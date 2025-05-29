import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { PrismaClient } from '@/generated/prisma';
import { getSMTPConfig, getSMTPPassword } from '@/lib/settings';
import { randomBytes } from 'crypto';

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

        // Gerar ID de tracking único
        const trackingId = randomBytes(16).toString('hex');

        // Criar transporter do nodemailer
        const transporter = nodemailer.createTransport({
            host: smtpConfig.host,
            port: smtpConfig.port || 587,
            secure: smtpConfig.secure,
            auth: {
                user: smtpConfig.username,
                pass: smtpPassword,
            },
        });

        // Adicionar tracking ID ao HTML se necessário
        let finalHtmlContent = htmlContent;
        if (finalHtmlContent && !finalHtmlContent.includes('tracking-pixel')) {
            finalHtmlContent += `<img src="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/email-tracking/${trackingId}" width="1" height="1" style="display:none;" alt="" class="tracking-pixel" />`;
        }

        // Preparar dados do email
        const mailOptions = {
            from: `${smtpConfig.fromName} <${smtpConfig.fromEmail}>`,
            to: `${toName} <${toEmail}>`,
            subject: subject,
            html: finalHtmlContent,
            text: textContent || htmlContent.replace(/<[^>]*>/g, ''), // Remove HTML tags for text version
        };

        // Salvar registro no banco antes do envio
        const emailRecord = await prisma.emailSent.create({
            data: {
                contactId,
                scriptId: scriptId || null,
                templateId: templateId || null,
                toEmail,
                toName,
                subject,
                htmlContent: finalHtmlContent,
                textContent: textContent || null,
                fromEmail: smtpConfig.fromEmail!,
                fromName: smtpConfig.fromName!,
                smtpHost: smtpConfig.host,
                smtpPort: smtpConfig.port || 587,
                status: 'sending',
                trackingId,
            },
        });

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
            });

        } catch (emailError) {
            console.error('Erro ao enviar email:', emailError);

            // Atualizar status para falhou
            await prisma.emailSent.update({
                where: { id: emailRecord.id },
                data: {
                    status: 'failed',
                    errorMessage: emailError instanceof Error ? emailError.message : 'Erro desconhecido',
                },
            });

            return NextResponse.json(
                { error: 'Falha ao enviar email: ' + (emailError instanceof Error ? emailError.message : 'Erro desconhecido') },
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