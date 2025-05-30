import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { PrismaClient } from '@/generated/prisma';
import { getSMTPConfig, getSMTPPassword } from '@/lib/settings';
import { randomBytes } from 'crypto';
import { addEmailTracking, getBaseUrl } from '@/lib/email-tracking';
import { requireAuth, unauthorizedResponse } from '@/lib/api-auth';

const prisma = new PrismaClient();

interface Contact {
    id: string;
    name: string;
    email: string;
    companyName: string;
    position?: string | null;
    phone?: string | null;
    niche?: string | null;
    painPoints?: string | null;
    website?: string | null;
}

interface SMTPConfigExpanded {
    host?: string;
    port?: number;
    username?: string;
    secure: boolean;
    fromEmail?: string;
    fromName?: string;
    yourName?: string;
    yourCompany?: string;
    yourPhone?: string;
    yourIndustry?: string;
    yourPosition?: string;
    yourWebsite?: string;
    yourLocation?: string;
}

interface SendEmailRequest {
    // Para envio individual
    contactId?: string;
    toEmail?: string;
    toName?: string;

    // Para envio em massa
    mailingListId?: string;

    // Comum
    scriptId?: string;
    templateId?: string;
    subject: string;
    htmlContent: string;
    textContent?: string;
}

// Função para personalizar conteúdo com dados do contato
function personalizeContent(content: string, contact: Contact, smtpConfig?: SMTPConfigExpanded): string {
    if (!content || typeof content !== 'string') {
        return '';
    }

    let result = content;

    // Dados do contato
    result = result.replace(/{{contactName}}/g, contact.name || '');
    result = result.replace(/{{contactFirstName}}/g, contact.name ? contact.name.split(' ')[0] : '');
    result = result.replace(/{{contactEmail}}/g, contact.email || '');
    result = result.replace(/{{contactPhone}}/g, contact.phone || '');
    result = result.replace(/{{contactPosition}}/g, contact.position || '');
    result = result.replace(/{{companyName}}/g, contact.companyName || '');
    result = result.replace(/{{companyWebsite}}/g, contact.website || '');
    result = result.replace(/{{companyIndustry}}/g, contact.niche || '');
    result = result.replace(/{{painPoints}}/g, contact.painPoints || '');

    // Dados do remetente (se disponíveis)
    if (smtpConfig) {
        result = result.replace(/{{senderName}}/g, smtpConfig.fromName || '');
        result = result.replace(/{{senderEmail}}/g, smtpConfig.fromEmail || '');
        result = result.replace(/{{yourName}}/g, smtpConfig.yourName || '');
        result = result.replace(/{{yourCompany}}/g, smtpConfig.yourCompany || '');
        result = result.replace(/{{yourPhone}}/g, smtpConfig.yourPhone || '');
        result = result.replace(/{{yourIndustry}}/g, smtpConfig.yourIndustry || '');
        result = result.replace(/{{yourPosition}}/g, smtpConfig.yourPosition || '');
        result = result.replace(/{{yourWebsite}}/g, smtpConfig.yourWebsite || '');
        result = result.replace(/{{yourLocation}}/g, smtpConfig.yourLocation || '');
    }

    // Dados dinâmicos
    result = result.replace(/{{currentDate}}/g, new Date().toLocaleDateString('pt-BR'));
    result = result.replace(/{{currentTime}}/g, new Date().toLocaleTimeString('pt-BR'));
    result = result.replace(/{{dayOfWeek}}/g, new Date().toLocaleDateString('pt-BR', { weekday: 'long' }));

    return result;
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
            mailingListId,
            scriptId,
            templateId,
            subject,
            htmlContent,
            textContent
        } = body;

        // Validar dados obrigatórios
        if ((!contactId && !mailingListId) || !subject || !htmlContent) {
            return NextResponse.json(
                { error: 'Dados obrigatórios ausentes' },
                { status: 400 }
            );
        }

        // Se for envio para lista, buscar todos os contatos da lista
        let contactsToSend: Contact[] = [];

        if (mailingListId) {
            const contacts = await prisma.contact.findMany({
                where: {
                    mailingListId: mailingListId,
                    isActive: true
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    companyName: true,
                    position: true,
                    phone: true,
                    niche: true,
                    painPoints: true,
                    website: true
                }
            });

            if (contacts.length === 0) {
                return NextResponse.json(
                    { error: 'Nenhum contato ativo encontrado na lista selecionada' },
                    { status: 400 }
                );
            }

            contactsToSend = contacts;
        } else if (contactId) {
            // Envio individual - buscar o contato específico
            const contact = await prisma.contact.findUnique({
                where: { id: contactId },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    companyName: true,
                    position: true,
                    phone: true,
                    niche: true,
                    painPoints: true,
                    website: true
                }
            });

            if (!contact) {
                return NextResponse.json(
                    { error: 'Contato não encontrado' },
                    { status: 404 }
                );
            }

            contactsToSend = [contact];
        }

        // Obter configurações SMTP
        const smtpConfig = await getSMTPConfig();
        if (!smtpConfig) {
            return NextResponse.json(
                { error: 'Configurações SMTP não encontradas' },
                { status: 500 }
            );
        }

        const smtpPassword = await getSMTPPassword();
        if (!smtpPassword) {
            return NextResponse.json(
                { error: 'Senha SMTP não configurada' },
                { status: 500 }
            );
        }

        // Buscar configurações pessoais para personalização
        const personalSettings = await prisma.settings.findFirst();

        // Criar objeto com configurações expandidas
        const expandedConfig = {
            ...smtpConfig,
            yourName: personalSettings?.yourName || '',
            yourCompany: personalSettings?.yourCompany || '',
            yourPhone: personalSettings?.yourPhone || '',
            yourIndustry: personalSettings?.yourIndustry || '',
            yourPosition: personalSettings?.yourPosition || '',
            yourWebsite: personalSettings?.yourWebsite || '',
            yourLocation: personalSettings?.yourLocation || '',
        };

        // Configurar transporter
        const transporter = nodemailer.createTransport({
            host: expandedConfig.host,
            port: expandedConfig.port,
            secure: expandedConfig.secure,
            auth: {
                user: expandedConfig.username,
                pass: smtpPassword,
            },
        });

        // Verificar conexão SMTP
        try {
            await transporter.verify();
        } catch (verifyError) {
            console.error('Erro na verificação SMTP:', verifyError);
            return NextResponse.json(
                { error: 'Erro na configuração SMTP' },
                { status: 500 }
            );
        }

        // Processar envios para cada contato
        const results = [];
        const errors = [];

        for (const contact of contactsToSend) {
            try {
                // Gerar ID de tracking único para cada email
                const trackingId = randomBytes(16).toString('hex');

                // Obter URL base para tracking
                const baseUrl = getBaseUrl(request);

                // Personalizar conteúdo para este contato específico
                const personalizedSubject = personalizeContent(subject, contact, expandedConfig);
                const personalizedHtmlContent = personalizeContent(htmlContent, contact, expandedConfig);
                const personalizedTextContent = textContent ? personalizeContent(textContent, contact, expandedConfig) : '';

                // Adicionar tracking ao HTML personalizado
                const htmlContentWithTracking = addEmailTracking(personalizedHtmlContent, trackingId, baseUrl);

                // Criar registro de email na base de dados
                const emailRecord = await prisma.emailSent.create({
                    data: {
                        contactId: contact.id,
                        scriptId,
                        templateId,
                        toEmail: contact.email,
                        toName: contact.name,
                        subject: personalizedSubject,
                        htmlContent: htmlContentWithTracking,
                        textContent: personalizedTextContent,
                        fromEmail: expandedConfig.fromEmail || expandedConfig.username || '',
                        fromName: expandedConfig.fromName || expandedConfig.username || '',
                        smtpHost: expandedConfig.host || '',
                        smtpPort: expandedConfig.port || 587,
                        status: 'pending',
                        trackingId,
                        opened: false,
                        clicked: false,
                        bounced: false,
                    },
                });

                // Configurar opções do email com conteúdo personalizado
                const mailOptions = {
                    from: `"${expandedConfig.fromName}" <${expandedConfig.fromEmail}>`,
                    to: `"${contact.name}" <${contact.email}>`,
                    subject: personalizedSubject,
                    html: htmlContentWithTracking,
                    text: personalizedTextContent,
                };

                // Atualizar status para enviando
                await prisma.emailSent.update({
                    where: { id: emailRecord.id },
                    data: { status: 'sending' },
                });

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

                results.push({
                    contactId: contact.id,
                    contactName: contact.name,
                    contactEmail: contact.email,
                    messageId: result.messageId,
                    trackingId: trackingId,
                    status: 'sent'
                });

            } catch (emailError: unknown) {
                console.error(`Erro ao enviar email para ${contact.email}:`, emailError);

                // Determinar tipo de erro e status apropriado
                let errorStatus = 'failed';
                let errorMessage = 'Erro desconhecido';

                if (emailError instanceof Error) {
                    errorMessage = emailError.message;
                    if (errorMessage.includes('bounce') || errorMessage.includes('rejected')) {
                        errorStatus = 'bounced';
                    }
                }

                errors.push({
                    contactId: contact.id,
                    contactName: contact.name,
                    contactEmail: contact.email,
                    error: errorMessage,
                    status: errorStatus
                });
            }
        }

        const baseUrl = getBaseUrl(request);
        const successCount = results.length;
        const errorCount = errors.length;
        const totalCount = contactsToSend.length;

        return NextResponse.json({
            message: `Processamento concluído: ${successCount} enviados, ${errorCount} falharam de ${totalCount} total`,
            summary: {
                total: totalCount,
                sent: successCount,
                failed: errorCount
            },
            results,
            errors,
            trackingUrls: results.map(result => ({
                contactId: result.contactId,
                openUrl: `${baseUrl}/api/track/open/${result.trackingId}`,
                clickUrl: `${baseUrl}/api/track/click/${result.trackingId}`,
            }))
        });

    } catch (error) {
        console.error('Erro geral no envio de email:', error);
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
} 