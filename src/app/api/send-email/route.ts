import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { prisma } from '@/lib/prisma';
import { getSMTPConfig, getSMTPPassword } from '@/lib/settings';
import { randomBytes } from 'crypto';
import { addEmailTracking, getBaseUrl } from '@/lib/email-tracking';
import { requireAuth, unauthorizedResponse } from '@/lib/api-auth';

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

// Função para delay entre envios
function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
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

// Função para processar um único email
async function processEmail(
    contact: Contact,
    subject: string,
    htmlContent: string,
    textContent: string,
    scriptId: string | undefined,
    templateId: string | undefined,
    expandedConfig: SMTPConfigExpanded,
    transporter: nodemailer.Transporter,
    baseUrl: string
): Promise<{ success: boolean; result?: { contactId: string; contactName: string; contactEmail: string; messageId: string; trackingId: string; status: string }; error?: string }> {
    try {
        // Gerar ID de tracking único para cada email
        const trackingId = randomBytes(16).toString('hex');

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

        // Simular status de "delivered" após alguns segundos (em produção, isso viria do provedor SMTP)
        // Para Gmail, Outlook, etc., podemos considerar como delivered imediatamente após sent
        setTimeout(async () => {
            try {
                await prisma.emailSent.update({
                    where: { id: emailRecord.id },
                    data: {
                        status: 'delivered',
                        deliveredAt: new Date(),
                    },
                });
            } catch (error) {
                console.error('Erro ao atualizar status para delivered:', error);
            }
        }, 2000); // 2 segundos de delay para simular entrega

        return {
            success: true,
            result: {
                contactId: contact.id,
                contactName: contact.name,
                contactEmail: contact.email,
                messageId: result.messageId,
                trackingId: trackingId,
                status: 'sent'
            }
        };

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

        // Tentar atualizar o status do email no banco se foi criado
        try {
            await prisma.emailSent.updateMany({
                where: {
                    contactId: contact.id,
                    toEmail: contact.email,
                    status: { in: ['pending', 'sending'] }
                },
                data: {
                    status: errorStatus as 'failed' | 'bounced',
                    errorMessage: errorMessage,
                },
            });
        } catch (updateError) {
            console.error('Erro ao atualizar status de falha:', updateError);
        }

        return {
            success: false,
            error: errorMessage
        };
    }
}

// Função para processar emails em lotes
async function processEmailBatch(
    contacts: Contact[],
    subject: string,
    htmlContent: string,
    textContent: string,
    scriptId: string | undefined,
    templateId: string | undefined,
    expandedConfig: SMTPConfigExpanded,
    transporter: nodemailer.Transporter,
    baseUrl: string,
    batchSize: number = 5,
    delayBetweenEmails: number = 1000,
    delayBetweenBatches: number = 3000
): Promise<{
    results: Array<{ contactId: string; contactName: string; contactEmail: string; messageId: string; trackingId: string; status: string }>;
    errors: Array<{ contactId: string; contactName: string; contactEmail: string; error: string; status: string }>
}> {
    const results: Array<{ contactId: string; contactName: string; contactEmail: string; messageId: string; trackingId: string; status: string }> = [];
    const errors: Array<{ contactId: string; contactName: string; contactEmail: string; error: string; status: string }> = [];

    // Dividir contatos em lotes
    for (let i = 0; i < contacts.length; i += batchSize) {
        const batch = contacts.slice(i, i + batchSize);
        console.log(`Processando lote ${Math.floor(i / batchSize) + 1} de ${Math.ceil(contacts.length / batchSize)}: ${batch.length} emails`);

        // Processar emails do lote em paralelo limitado
        const batchPromises = batch.map(async (contact, index) => {
            // Delay progressivo dentro do lote para evitar sobrecarga
            if (index > 0) {
                await delay(delayBetweenEmails);
            }

            const result = await processEmail(
                contact,
                subject,
                htmlContent,
                textContent,
                scriptId,
                templateId,
                expandedConfig,
                transporter,
                baseUrl
            );

            if (result.success) {
                if (result.result) {
                    results.push(result.result);
                }
            } else {
                errors.push({
                    contactId: contact.id,
                    contactName: contact.name,
                    contactEmail: contact.email,
                    error: result.error || 'Erro desconhecido',
                    status: 'failed'
                });
            }
        });

        // Aguardar conclusão do lote
        await Promise.all(batchPromises);

        // Delay entre lotes (exceto no último)
        if (i + batchSize < contacts.length) {
            console.log(`Aguardando ${delayBetweenBatches}ms antes do próximo lote...`);
            await delay(delayBetweenBatches);
        }
    }

    return { results, errors };
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

        // Configurar transporter com pool de conexões para melhor performance
        const transporter = nodemailer.createTransport({
            host: expandedConfig.host,
            port: expandedConfig.port,
            secure: expandedConfig.secure,
            pool: true, // Usar pool de conexões
            maxConnections: 3, // Máximo 3 conexões simultâneas
            maxMessages: 10, // Máximo 10 mensagens por conexão
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

        const baseUrl = getBaseUrl(request);
        const totalCount = contactsToSend.length;

        console.log(`Iniciando envio para ${totalCount} contatos...`);

        // Determinar configurações de lote baseado no número de contatos
        let batchSize = 5;
        let delayBetweenEmails = 1000; // 1 segundo
        let delayBetweenBatches = 3000; // 3 segundos

        if (totalCount > 50) {
            batchSize = 3;
            delayBetweenEmails = 2000; // 2 segundos
            delayBetweenBatches = 5000; // 5 segundos
        } else if (totalCount > 20) {
            batchSize = 4;
            delayBetweenEmails = 1500; // 1.5 segundos
            delayBetweenBatches = 4000; // 4 segundos
        }

        // Processar emails em lotes
        const { results, errors } = await processEmailBatch(
            contactsToSend,
            subject,
            htmlContent,
            textContent || '',
            scriptId,
            templateId,
            expandedConfig,
            transporter,
            baseUrl,
            batchSize,
            delayBetweenEmails,
            delayBetweenBatches
        );

        // Fechar transporter
        transporter.close();

        const successCount = results.length;
        const errorCount = errors.length;

        console.log(`Envio concluído: ${successCount} enviados, ${errorCount} falharam de ${totalCount} total`);

        return NextResponse.json({
            message: `Processamento concluído: ${successCount} enviados, ${errorCount} falharam de ${totalCount} total`,
            summary: {
                total: totalCount,
                sent: successCount,
                failed: errorCount,
                successRate: totalCount > 0 ? Math.round((successCount / totalCount) * 100) : 0
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