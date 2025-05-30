import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { PrismaClient } from '@/generated/prisma';
import { getSMTPConfig, getSMTPPassword } from '@/lib/settings';
import { randomBytes } from 'crypto';
import { addEmailTracking, getBaseUrl } from '@/lib/email-tracking';
import { requireAuth, unauthorizedResponse } from '@/lib/api-auth';

const prisma = new PrismaClient();

interface SendEmailRequest {
    contactId: string;
    scriptId?: string;
    templateId?: string;
    toEmail: string;
    toName: string;
    subject: string;
    htmlContent: string;
    textContent?: string;
}

export async function POST(request: NextRequest) {
    try {
        // Verificar autenticação
        const { user, error } = requireAuth(request);
        if (error || !user) {
            return unauthorizedResponse(error);
        }

        const body: SendEmailRequest = await request.json();
        const {
            contactId,
            scriptId,
            templateId,
            toEmail,
            toName,
            subject,
            htmlContent,
            textContent
        } = body;

        // Validar dados obrigatórios
        if (!contactId || !toEmail || !toName || !subject || !htmlContent) {
            return NextResponse.json(
                { error: 'Dados obrigatórios ausentes' },
                { status: 400 }
            );
        }

        // Obter configurações SMTP
        const smtpConfig = await getSMTPConfig();
        const smtpPassword = await getSMTPPassword();

        if (!smtpConfig.host || !smtpPassword) {
            return NextResponse.json(
                { error: 'Configurações SMTP não encontradas. Configure o SMTP nas configurações.' },
                { status: 400 }
            );
        }

        // Gerar ID de rastreamento único
        const trackingId = randomBytes(16).toString('hex');

        // Obter URL base para tracking
        const baseUrl = getBaseUrl(request);

        // Processar conteúdo HTML com tracking
        const htmlContentWithTracking = addEmailTracking(htmlContent, trackingId, baseUrl);

        // Criar registro de email na base de dados
        const emailRecord = await prisma.emailSent.create({
            data: {
                contactId,
                scriptId,
                templateId,
                toEmail,
                toName,
                subject,
                htmlContent: htmlContentWithTracking,
                textContent,
                fromEmail: smtpConfig.fromEmail || smtpConfig.username || '',
                fromName: smtpConfig.fromName || smtpConfig.username || '',
                smtpHost: smtpConfig.host || '',
                smtpPort: smtpConfig.port || 587,
                status: 'pending',
                trackingId,
                opened: false,
                clicked: false,
                bounced: false,
            },
        });

        // Configurar transporter com melhor handling de erros
        const transporter = nodemailer.createTransport({
            host: smtpConfig.host,
            port: smtpConfig.port || 587,
            secure: smtpConfig.port === 465,
            auth: {
                user: smtpConfig.username,
                pass: smtpPassword,
            },
            // Configurações adicionais para melhor tracking de erros
            connectionTimeout: 60000, // 60 segundos
            greetingTimeout: 30000,   // 30 segundos
            socketTimeout: 60000,     // 60 segundos
        });

        // Verificar conexão SMTP
        try {
            await transporter.verify();
        } catch (verifyError) {
            console.error('Erro na verificação SMTP:', verifyError);

            await prisma.emailSent.update({
                where: { id: emailRecord.id },
                data: {
                    status: 'failed',
                    errorMessage: `Erro de conexão SMTP: ${verifyError instanceof Error ? verifyError.message : 'Erro desconhecido'}`,
                },
            });

            return NextResponse.json(
                { error: 'Erro de conexão SMTP: ' + (verifyError instanceof Error ? verifyError.message : 'Erro desconhecido') },
                { status: 500 }
            );
        }

        // Atualizar status para enviando
        await prisma.emailSent.update({
            where: { id: emailRecord.id },
            data: { status: 'sending' },
        });

        const mailOptions = {
            from: `${smtpConfig.fromName || smtpConfig.username} <${smtpConfig.fromEmail || smtpConfig.username}>`,
            to: `${toName} <${toEmail}>`,
            subject: subject,
            html: htmlContentWithTracking,
            text: textContent,
            // Headers para melhor deliverability
            headers: {
                'X-Mailer': 'Script Maker',
                'X-Tracking-ID': trackingId,
            },
        };

        try {
            // Enviar email
            const result = await transporter.sendMail(mailOptions);

            // Atualizar status para enviado
            await prisma.emailSent.update({
                where: { id: emailRecord.id },
                data: {
                    status: 'sent',
                    sentAt: new Date(),
                },
            });

            return NextResponse.json({
                message: 'Email enviado com sucesso!',
                messageId: result.messageId,
                trackingId: trackingId,
                trackingUrls: {
                    open: `${baseUrl}/api/track/open/${trackingId}`,
                    click: `${baseUrl}/api/track/click/${trackingId}`,
                },
            });

        } catch (emailError: any) {
            console.error('Erro ao enviar email:', emailError);

            // Determinar tipo de erro e status apropriado
            let errorStatus = 'failed';
            let errorMessage = 'Erro desconhecido';

            if (emailError.code) {
                switch (emailError.code) {
                    case 'EENVELOPE':
                    case 'EMESSAGE':
                        errorStatus = 'bounced';
                        errorMessage = `Email rejeitado: ${emailError.message}`;
                        break;
                    case 'ECONNECTION':
                    case 'EAUTH':
                        errorStatus = 'failed';
                        errorMessage = `Erro de conexão/autenticação: ${emailError.message}`;
                        break;
                    case 'ETIMEDOUT':
                        errorStatus = 'failed';
                        errorMessage = `Timeout na conexão: ${emailError.message}`;
                        break;
                    default:
                        errorMessage = emailError.message || 'Erro no envio';
                }
            } else if (emailError.response) {
                // Erros SMTP específicos
                const responseCode = emailError.responseCode;
                if (responseCode >= 500 && responseCode < 600) {
                    errorStatus = 'bounced';
                    errorMessage = `Email rejeitado pelo servidor: ${emailError.response}`;
                } else {
                    errorMessage = `Erro SMTP: ${emailError.response}`;
                }
            } else {
                errorMessage = emailError.message || 'Erro desconhecido no envio';
            }

            // Atualizar status para falhou ou bounced
            await prisma.emailSent.update({
                where: { id: emailRecord.id },
                data: {
                    status: errorStatus as any,
                    errorMessage: errorMessage,
                    bounced: errorStatus === 'bounced',
                },
            });

            return NextResponse.json(
                { error: errorMessage },
                { status: 500 }
            );
        }

    } catch (error) {
        console.error('Erro na API de envio de email:', error);
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
} 