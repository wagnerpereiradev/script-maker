'use client';

import { useEffect, useState, useCallback } from 'react';
import MainLayout from '@/components/MainLayout';
import ContactItem from '@/components/ContactItem';
import EmailTemplatePreview from '@/components/EmailTemplatePreview';
import { Search, User, FileText, Mail, Send, ArrowLeft, ArrowRight, Check, X, Loader2, AlertCircle, Users, List } from 'lucide-react';

interface Contact {
    id: string;
    name: string;
    email: string;
    phone?: string;
    position?: string;
    companyName: string;
    website?: string;
    niche?: string;
    painPoints?: string;
    previousInteraction?: string;
    notes?: string;
    isActive: boolean;
}

interface MailingList {
    id: string;
    name: string;
    description?: string;
    color: string;
    _count?: {
        contacts: number;
    };
}

interface Script {
    id: string;
    subject: string;
    body: string;
    prospectData: {
        contactName: string;
        companyName: string;
        niche: string;
        position?: string;
        website?: string;
        painPoints?: string;
    };
    emailType: string;
    tone: string;
    length: string;
    callToAction: string;
}

interface Template {
    id: string;
    name: string;
    description?: string;
    subject: string;
    htmlContent: string;
    category?: string;
    isActive: boolean;
}

interface SMTPConfig {
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

// Função auxiliar para processar especificamente o assunto do script
const processScriptSubject = (
    scriptSubject: string,
    contact: Contact | null,
    smtpConfig: SMTPConfig | null
): string => {
    let processed = scriptSubject;

    if (!processed) return '';

    // Substituições do contato no assunto do script
    if (contact) {
        processed = processed.replace(/\{\{contactName\}\}/g, contact.name || '');
        processed = processed.replace(/\{\{firstName\}\}/g, contact.name?.split(' ')[0] || '');
        processed = processed.replace(/\{\{companyName\}\}/g, contact.companyName || '');
        processed = processed.replace(/\{\{contactEmail\}\}/g, contact.email || '');
        processed = processed.replace(/\{\{contactPhone\}\}/g, contact.phone || '');
        processed = processed.replace(/\{\{position\}\}/g, contact.position || '');
        processed = processed.replace(/\{\{website\}\}/g, contact.website || '');
        processed = processed.replace(/\{\{niche\}\}/g, contact.niche || '');
        processed = processed.replace(/\{\{painPoints\}\}/g, contact.painPoints || '');
        processed = processed.replace(/\{\{previousInteraction\}\}/g, contact.previousInteraction || '');
        processed = processed.replace(/\{\{notes\}\}/g, contact.notes || '');
    }

    // Aplicar dados do SMTP ao assunto do script
    if (smtpConfig) {
        processed = processed.replace(/\{\{yourName\}\}/g, smtpConfig.yourName || smtpConfig.fromName || '');
        processed = processed.replace(/\{\{yourCompany\}\}/g, smtpConfig.yourCompany || '');
        processed = processed.replace(/\{\{yourEmail\}\}/g, smtpConfig.fromEmail || '');
        processed = processed.replace(/\{\{yourPhone\}\}/g, smtpConfig.yourPhone || '');
        processed = processed.replace(/\{\{yourIndustry\}\}/g, smtpConfig.yourIndustry || '');
        processed = processed.replace(/\{\{yourPosition\}\}/g, smtpConfig.yourPosition || '');
        processed = processed.replace(/\{\{yourWebsite\}\}/g, smtpConfig.yourWebsite || '');
        processed = processed.replace(/\{\{yourLocation\}\}/g, smtpConfig.yourLocation || '');
        processed = processed.replace(/\{\{fromName\}\}/g, smtpConfig.fromName || '');
        processed = processed.replace(/\{\{fromEmail\}\}/g, smtpConfig.fromEmail || '');
    }

    // Aplicar dados dinâmicos ao assunto do script
    const now = new Date();
    processed = processed.replace(/\{\{currentDate\}\}/g, now.toLocaleDateString('pt-BR'));
    processed = processed.replace(/\{\{currentTime\}\}/g, now.toLocaleTimeString('pt-BR'));
    processed = processed.replace(/\{\{currentYear\}\}/g, now.getFullYear().toString());

    return processed;
};

// Função para processar template com substituição de variáveis
const processTemplate = (
    template: string,
    contact: Contact | null,
    script: Script | null,
    smtpConfig: SMTPConfig | null
): string => {
    let processed = template;

    if (!processed) return '';

    // Substituições do contato
    if (contact) {
        processed = processed.replace(/\{\{contactName\}\}/g, contact.name || '');
        processed = processed.replace(/\{\{firstName\}\}/g, contact.name?.split(' ')[0] || '');
        processed = processed.replace(/\{\{companyName\}\}/g, contact.companyName || '');
        processed = processed.replace(/\{\{contactEmail\}\}/g, contact.email || '');
        processed = processed.replace(/\{\{contactPhone\}\}/g, contact.phone || '');
        processed = processed.replace(/\{\{position\}\}/g, contact.position || '');
        processed = processed.replace(/\{\{website\}\}/g, contact.website || '');
        processed = processed.replace(/\{\{niche\}\}/g, contact.niche || '');
        processed = processed.replace(/\{\{painPoints\}\}/g, contact.painPoints || '');
        processed = processed.replace(/\{\{previousInteraction\}\}/g, contact.previousInteraction || '');
        processed = processed.replace(/\{\{notes\}\}/g, contact.notes || '');
    } else {
        // Limpar tags de contato se não houver contato
        processed = processed.replace(/\{\{contactName\}\}/g, '[Nome do Contato]');
        processed = processed.replace(/\{\{firstName\}\}/g, '[Primeiro Nome]');
        processed = processed.replace(/\{\{companyName\}\}/g, '[Nome da Empresa]');
        processed = processed.replace(/\{\{contactEmail\}\}/g, '[Email do Contato]');
        processed = processed.replace(/\{\{contactPhone\}\}/g, '[Telefone]');
        processed = processed.replace(/\{\{position\}\}/g, '[Cargo]');
        processed = processed.replace(/\{\{website\}\}/g, '[Website]');
        processed = processed.replace(/\{\{niche\}\}/g, '[Nicho]');
        processed = processed.replace(/\{\{painPoints\}\}/g, '[Pontos de Dor]');
        processed = processed.replace(/\{\{previousInteraction\}\}/g, '[Interação Anterior]');
        processed = processed.replace(/\{\{notes\}\}/g, '[Observações]');
    }

    // Substituições do script
    if (script) {
        // Processar o assunto do script com as variáveis dinâmicas
        let processedScriptSubject = script.subject || '';
        // Usar a função auxiliar para processar o assunto do script
        processedScriptSubject = processScriptSubject(processedScriptSubject, contact, smtpConfig);

        processed = processed.replace(/\{\{scriptSubject\}\}/g, processedScriptSubject);

        // Converter markdown para HTML para scriptBody
        if (script.body) {
            try {
                // Primeiro processar as variáveis dinâmicas no body do script
                let processedScriptBody = script.body;
                if (contact) {
                    processedScriptBody = processedScriptBody.replace(/\{\{contactName\}\}/g, contact.name || '');
                    processedScriptBody = processedScriptBody.replace(/\{\{firstName\}\}/g, contact.name?.split(' ')[0] || '');
                    processedScriptBody = processedScriptBody.replace(/\{\{companyName\}\}/g, contact.companyName || '');
                    processedScriptBody = processedScriptBody.replace(/\{\{contactEmail\}\}/g, contact.email || '');
                    processedScriptBody = processedScriptBody.replace(/\{\{contactPhone\}\}/g, contact.phone || '');
                    processedScriptBody = processedScriptBody.replace(/\{\{position\}\}/g, contact.position || '');
                    processedScriptBody = processedScriptBody.replace(/\{\{website\}\}/g, contact.website || '');
                    processedScriptBody = processedScriptBody.replace(/\{\{niche\}\}/g, contact.niche || '');
                    processedScriptBody = processedScriptBody.replace(/\{\{painPoints\}\}/g, contact.painPoints || '');
                    processedScriptBody = processedScriptBody.replace(/\{\{previousInteraction\}\}/g, contact.previousInteraction || '');
                    processedScriptBody = processedScriptBody.replace(/\{\{notes\}\}/g, contact.notes || '');
                }
                // Aplicar dados do SMTP ao body do script
                if (smtpConfig) {
                    processedScriptBody = processedScriptBody.replace(/\{\{yourName\}\}/g, smtpConfig.yourName || smtpConfig.fromName || '');
                    processedScriptBody = processedScriptBody.replace(/\{\{yourCompany\}\}/g, smtpConfig.yourCompany || '');
                    processedScriptBody = processedScriptBody.replace(/\{\{yourEmail\}\}/g, smtpConfig.fromEmail || '');
                    processedScriptBody = processedScriptBody.replace(/\{\{yourPhone\}\}/g, smtpConfig.yourPhone || '');
                    processedScriptBody = processedScriptBody.replace(/\{\{yourIndustry\}\}/g, smtpConfig.yourIndustry || '');
                    processedScriptBody = processedScriptBody.replace(/\{\{yourPosition\}\}/g, smtpConfig.yourPosition || '');
                    processedScriptBody = processedScriptBody.replace(/\{\{yourWebsite\}\}/g, smtpConfig.yourWebsite || '');
                    processedScriptBody = processedScriptBody.replace(/\{\{yourLocation\}\}/g, smtpConfig.yourLocation || '');
                }
                // Aplicar dados dinâmicos ao body do script
                const now = new Date();
                processedScriptBody = processedScriptBody.replace(/\{\{currentDate\}\}/g, now.toLocaleDateString('pt-BR'));
                processedScriptBody = processedScriptBody.replace(/\{\{currentTime\}\}/g, now.toLocaleTimeString('pt-BR'));
                processedScriptBody = processedScriptBody.replace(/\{\{currentYear\}\}/g, now.getFullYear().toString());

                // Agora converter markdown para HTML
                const htmlBody = processedScriptBody
                    // Processar tabelas markdown completas
                    .replace(/(?:^\|.+\|.*\n)+/gm, (match) => {
                        const lines = match.trim().split('\n').filter(line => line.trim() && line.includes('|'));

                        if (lines.length < 2) return match;

                        let tableHtml = '<table style="border-collapse: collapse; width: 100%; margin: 16px 0; border: 1px solid #e9ecef; font-size: 14px;">';
                        let isFirstDataRow = true;

                        for (let i = 0; i < lines.length; i++) {
                            const line = lines[i].trim();

                            // Verificar se é linha separadora (---, :--:, etc)
                            if (line.match(/^\|[\s]*:?-+:?[\s]*(\|[\s]*:?-+:?[\s]*)*\|?$/)) {
                                continue; // Pular linha separadora
                            }

                            // Processar células da linha
                            const cells = line.split('|')
                                .slice(1, -1) // Remove primeiro e último elementos vazios
                                .map(cell => cell.trim());

                            if (cells.length === 0) continue;

                            // Primeira linha não separadora é cabeçalho
                            if (isFirstDataRow) {
                                tableHtml += '<tr>';
                                cells.forEach(cell => {
                                    tableHtml += `<th style="text-align: left; padding: 12px 16px; border: 1px solid #e9ecef; background-color: #f8f9fa; font-weight: 600; color: #495057; vertical-align: top;">${cell}</th>`;
                                });
                                tableHtml += '</tr>';
                                isFirstDataRow = false;
                            } else {
                                tableHtml += '<tr>';
                                cells.forEach((cell, index) => {
                                    const bgColor = index % 2 === 0 ? '#ffffff' : '#f8f9fa';
                                    tableHtml += `<td style="text-align: left; padding: 12px 16px; border: 1px solid #e9ecef; background-color: ${bgColor}; vertical-align: top;">${cell}</td>`;
                                });
                                tableHtml += '</tr>';
                            }
                        }

                        tableHtml += '</table>';
                        return tableHtml;
                    })
                    // Títulos
                    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
                    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
                    .replace(/^# (.*$)/gm, '<h1>$1</h1>')
                    // Negrito
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    // Itálico
                    .replace(/\*(.*?)\*/g, '<em>$1</em>')
                    // Links [texto](url)
                    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" style="color: #0066cc; text-decoration: underline;">$1</a>')
                    // Links simples (URLs)
                    .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" style="color: #0066cc; text-decoration: underline;">$1</a>')
                    // Listas não ordenadas (-, *, +) - SEM <br>
                    .replace(/^[\s]*[-\*\+][\s]+(.+)$/gm, '<li>$1</li>')
                    // Listas ordenadas (1. 2. 3.) - SEM <br>
                    .replace(/^[\s]*\d+\.[\s]+(.+)$/gm, '<li>$1</li>')
                    // Envolver listas consecutivas em tags <ul> e <ol>
                    .replace(/(<li>.*?<\/li>)(?:\s*<li>.*?<\/li>)*/g, (match) => {
                        // Verificar se é lista ordenada checando o conteúdo original
                        const hasOrderedItems = processedScriptBody.match(/^\s*\d+\./m);
                        return hasOrderedItems ? `<ol>${match}</ol>` : `<ul>${match}</ul>`;
                    })
                    // Quebras de linha para parágrafos (apenas no final, e não em excesso)
                    .replace(/\n\s*\n/g, '</p><p>')
                    .replace(/^(.)/g, '<p>$1')
                    .replace(/(.)$/g, '$1</p>')
                    // Limpar parágrafos vazios e duplicados
                    .replace(/<p><\/p>/g, '')
                    .replace(/<p>(<[^>]+>)/g, '$1')
                    .replace(/(<\/[^>]+>)<\/p>/g, '$1');

                processed = processed.replace(/\{\{scriptBody\}\}/g, htmlBody);
            } catch (error) {
                console.error('Erro ao converter markdown:', error);
                // Fallback: usar o texto sem conversão
                processed = processed.replace(/\{\{scriptBody\}\}/g, script.body.replace(/\n/g, '<br>'));
            }
        }

        processed = processed.replace(/\{\{emailType\}\}/g, script.emailType || '');
        processed = processed.replace(/\{\{tone\}\}/g, script.tone || '');
        processed = processed.replace(/\{\{length\}\}/g, script.length || '');
        processed = processed.replace(/\{\{callToAction\}\}/g, script.callToAction || '');

        // Dados do prospect do script
        if (script.prospectData) {
            processed = processed.replace(/\{\{scriptContactName\}\}/g, script.prospectData.contactName || '');
            processed = processed.replace(/\{\{scriptCompanyName\}\}/g, script.prospectData.companyName || '');
            processed = processed.replace(/\{\{scriptNiche\}\}/g, script.prospectData.niche || '');
            processed = processed.replace(/\{\{scriptPosition\}\}/g, script.prospectData.position || '');
            processed = processed.replace(/\{\{scriptWebsite\}\}/g, script.prospectData.website || '');
            processed = processed.replace(/\{\{scriptPainPoints\}\}/g, script.prospectData.painPoints || '');
        }
    } else {
        // Limpar tags de script se não houver script
        processed = processed.replace(/\{\{scriptSubject\}\}/g, '');
        processed = processed.replace(/\{\{scriptBody\}\}/g, '');
        processed = processed.replace(/\{\{emailType\}\}/g, '');
        processed = processed.replace(/\{\{tone\}\}/g, '');
        processed = processed.replace(/\{\{length\}\}/g, '');
        processed = processed.replace(/\{\{callToAction\}\}/g, '');
        processed = processed.replace(/\{\{scriptContactName\}\}/g, '');
        processed = processed.replace(/\{\{scriptCompanyName\}\}/g, '');
        processed = processed.replace(/\{\{scriptNiche\}\}/g, '');
        processed = processed.replace(/\{\{scriptPosition\}\}/g, '');
        processed = processed.replace(/\{\{scriptWebsite\}\}/g, '');
        processed = processed.replace(/\{\{scriptPainPoints\}\}/g, '');
    }

    // Substituições das configurações SMTP/remetente
    if (smtpConfig) {
        processed = processed.replace(/\{\{yourName\}\}/g, smtpConfig.yourName || smtpConfig.fromName || '');
        processed = processed.replace(/\{\{yourCompany\}\}/g, smtpConfig.yourCompany || '');
        processed = processed.replace(/\{\{yourEmail\}\}/g, smtpConfig.fromEmail || '');
        processed = processed.replace(/\{\{yourPhone\}\}/g, smtpConfig.yourPhone || '');
        processed = processed.replace(/\{\{yourIndustry\}\}/g, smtpConfig.yourIndustry || '');
        processed = processed.replace(/\{\{yourPosition\}\}/g, smtpConfig.yourPosition || '');
        processed = processed.replace(/\{\{yourWebsite\}\}/g, smtpConfig.yourWebsite || '');
        processed = processed.replace(/\{\{yourLocation\}\}/g, smtpConfig.yourLocation || '');
        processed = processed.replace(/\{\{fromName\}\}/g, smtpConfig.fromName || '');
        processed = processed.replace(/\{\{fromEmail\}\}/g, smtpConfig.fromEmail || '');
    } else {
        // Limpar tags de configuração se não houver dados
        processed = processed.replace(/\{\{yourName\}\}/g, '[Seu Nome]');
        processed = processed.replace(/\{\{yourCompany\}\}/g, '[Sua Empresa]');
        processed = processed.replace(/\{\{yourEmail\}\}/g, '[Seu Email]');
        processed = processed.replace(/\{\{yourPhone\}\}/g, '[Seu Telefone]');
        processed = processed.replace(/\{\{yourIndustry\}\}/g, '[Seu Setor]');
        processed = processed.replace(/\{\{yourPosition\}\}/g, '[Seu Cargo]');
        processed = processed.replace(/\{\{yourWebsite\}\}/g, '[Seu Website]');
        processed = processed.replace(/\{\{yourLocation\}\}/g, '[Sua Localização]');
        processed = processed.replace(/\{\{fromName\}\}/g, '[Nome do Remetente]');
        processed = processed.replace(/\{\{fromEmail\}\}/g, '[Email do Remetente]');
    }

    // Tags gerais
    const now = new Date();
    processed = processed.replace(/\{\{currentDate\}\}/g, now.toLocaleDateString('pt-BR'));
    processed = processed.replace(/\{\{currentTime\}\}/g, now.toLocaleTimeString('pt-BR'));
    processed = processed.replace(/\{\{currentYear\}\}/g, now.getFullYear().toString());

    return processed;
};

export default function SendEmail() {
    const [step, setStep] = useState(1);
    const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
    const [selectedMailingList, setSelectedMailingList] = useState<MailingList | null>(null);
    const [sendType, setSendType] = useState<'individual' | 'list'>('individual');
    const [selectedScript, setSelectedScript] = useState<Script | null>(null);
    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

    // Lists
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [mailingLists, setMailingLists] = useState<MailingList[]>([]);
    const [scripts, setScripts] = useState<Script[]>([]);
    const [templates, setTemplates] = useState<Template[]>([]);

    // Search states
    const [contactSearch, setContactSearch] = useState('');
    const [mailingListSearch, setMailingListSearch] = useState('');
    const [scriptSearch, setScriptSearch] = useState('');
    const [templateSearch, setTemplateSearch] = useState('');

    // Final email data
    const [finalSubject, setFinalSubject] = useState('');
    const [finalHtmlContent, setFinalHtmlContent] = useState('');
    const [smtpConfig, setSMTPConfig] = useState<SMTPConfig | null>(null);

    // UI states
    const [sending, setSending] = useState(false);
    const [sendingProgress, setSendingProgress] = useState({
        total: 0,
        sent: 0,
        failed: 0,
        currentBatch: 0,
        totalBatches: 0,
        currentEmail: '',
        isComplete: false
    });
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [previewContact, setPreviewContact] = useState<Contact | null>(null);

    // Fetch data functions
    const fetchContacts = useCallback(async () => {
        try {
            const response = await fetch('/api/contacts?limit=9999&isActive=true');
            if (response.ok) {
                const data = await response.json();
                setContacts((data.contacts || []).filter((c: Contact) => c.isActive));
            }
        } catch (error) {
            console.error('Erro ao buscar contatos:', error);
        }
    }, []);

    const fetchMailingLists = useCallback(async () => {
        try {
            console.log('Iniciando fetch das listas...');
            const response = await fetch('/api/mailing-lists');
            console.log('Response status:', response.status);

            if (response.ok) {
                const data = await response.json();
                console.log('Dados recebidos:', data);
                console.log('mailingLists:', data.mailingLists);
                setMailingLists(data.mailingLists || []);
                console.log('Listas setadas:', data.mailingLists?.length || 0);
            } else {
                console.error('Erro na resposta:', response.status, response.statusText);
                const errorText = await response.text();
                console.error('Erro detalhado:', errorText);
            }
        } catch (error) {
            console.error('Erro ao buscar listas de email:', error);
        }
    }, []);

    const fetchScripts = useCallback(async () => {
        try {
            const response = await fetch('/api/scripts?limit=100');
            if (response.ok) {
                const data = await response.json();
                setScripts(data.scripts || []);
            }
        } catch (error) {
            console.error('Erro ao buscar scripts:', error);
        }
    }, []);

    const fetchTemplates = useCallback(async () => {
        try {
            const response = await fetch('/api/templates?limit=100&includeContent=true');
            if (response.ok) {
                const data = await response.json();
                setTemplates((data.templates || []).filter((t: Template) => t.isActive));
            }
        } catch (error) {
            console.error('Erro ao buscar templates:', error);
        }
    }, []);

    const fetchSMTPConfig = useCallback(async () => {
        try {
            const response = await fetch('/api/settings');
            if (response.ok) {
                const data = await response.json();
                setSMTPConfig({
                    host: data.settings.smtpHost,
                    port: data.settings.smtpPort,
                    username: data.settings.smtpUsername,
                    secure: data.settings.smtpSecure,
                    fromEmail: data.settings.smtpFromEmail,
                    fromName: data.settings.smtpFromName,
                    yourName: data.settings.yourName,
                    yourCompany: data.settings.yourCompany,
                    yourPhone: data.settings.yourPhone,
                    yourIndustry: data.settings.yourIndustry,
                    yourPosition: data.settings.yourPosition,
                    yourWebsite: data.settings.yourWebsite,
                    yourLocation: data.settings.yourLocation,
                });
            }
        } catch (error) {
            console.error('Erro ao buscar configurações SMTP:', error);
        }
    }, []);

    // Buscar contato de exemplo da lista para preview
    const fetchPreviewContact = useCallback(async (listId: string) => {
        try {
            const response = await fetch(`/api/contacts?mailingListId=${listId}&limit=1`);
            if (response.ok) {
                const data = await response.json();
                if (data.contacts && data.contacts.length > 0) {
                    setPreviewContact(data.contacts[0]);
                } else {
                    setPreviewContact(null);
                }
            }
        } catch (error) {
            console.error('Erro ao buscar contato de preview:', error);
            setPreviewContact(null);
        }
    }, []);

    useEffect(() => {
        fetchContacts();
        fetchMailingLists();
        fetchScripts();
        fetchTemplates();
        fetchSMTPConfig();
    }, [fetchContacts, fetchMailingLists, fetchScripts, fetchTemplates, fetchSMTPConfig]);

    // Atualizar preview contact quando lista muda
    useEffect(() => {
        if (sendType === 'list' && selectedMailingList) {
            fetchPreviewContact(selectedMailingList.id);
        } else {
            setPreviewContact(null);
        }
    }, [sendType, selectedMailingList, fetchPreviewContact]);

    // Generate final email when all selections are made
    useEffect(() => {
        const contactForPreview = sendType === 'individual' ? selectedContact : previewContact;

        if (selectedTemplate && selectedTemplate.subject && selectedTemplate.htmlContent) {
            try {
                // Processar assunto
                let processedSubject = '';
                if (selectedScript && selectedScript.subject) {
                    // Se há script, usar o assunto do script processado com a função específica
                    processedSubject = processScriptSubject(selectedScript.subject, contactForPreview, smtpConfig);
                } else {
                    // Senão, usar o assunto do template processado
                    processedSubject = processTemplate(selectedTemplate.subject, contactForPreview, selectedScript, smtpConfig);
                }

                // Processar conteúdo HTML
                const processedContent = processTemplate(selectedTemplate.htmlContent, contactForPreview, selectedScript, smtpConfig);

                setFinalSubject(processedSubject);
                setFinalHtmlContent(processedContent);
            } catch (error) {
                console.error('Erro ao processar template:', error);
                setFinalSubject('');
                setFinalHtmlContent('');
            }
        } else {
            setFinalSubject('');
            setFinalHtmlContent('');
        }
    }, [selectedContact, previewContact, selectedScript, selectedTemplate, sendType, smtpConfig]);

    // Send email function
    const sendEmail = async () => {
        if ((!selectedContact && !selectedMailingList) || !selectedTemplate || !smtpConfig) {
            setMessage({ type: 'error', text: 'Seleções e configuração SMTP são obrigatórias' });
            return;
        }

        setSending(true);

        // Inicializar progresso
        const totalEmails = sendType === 'list' ? (selectedMailingList?._count?.contacts || 0) : 1;
        setSendingProgress({
            total: totalEmails,
            sent: 0,
            failed: 0,
            currentBatch: 1,
            totalBatches: Math.ceil(totalEmails / (totalEmails > 50 ? 3 : totalEmails > 20 ? 4 : 5)),
            currentEmail: sendType === 'individual' ? selectedContact?.email || '' : 'Preparando envio...',
            isComplete: false
        });

        try {
            const requestBody: {
                scriptId: string | null;
                templateId: string;
                subject: string;
                htmlContent: string;
                contactId?: string;
                toEmail?: string;
                toName?: string;
                mailingListId?: string;
            } = {
                scriptId: selectedScript?.id || null,
                templateId: selectedTemplate.id,
                subject: sendType === 'list'
                    ? (selectedScript ? selectedScript.subject : selectedTemplate.subject)
                    : finalSubject,
                htmlContent: sendType === 'list'
                    ? selectedTemplate.htmlContent
                    : finalHtmlContent,
            };

            // Adicionar dados específicos baseado no tipo de envio
            if (sendType === 'individual' && selectedContact) {
                requestBody.contactId = selectedContact.id;
                requestBody.toEmail = selectedContact.email;
                requestBody.toName = selectedContact.name;
                setSendingProgress(prev => ({
                    ...prev,
                    currentEmail: `Enviando para ${selectedContact.name} (${selectedContact.email})`
                }));
            } else if (sendType === 'list' && selectedMailingList) {
                requestBody.mailingListId = selectedMailingList.id;
                setSendingProgress(prev => ({
                    ...prev,
                    currentEmail: `Iniciando envio para lista "${selectedMailingList.name}"`
                }));
            }

            const response = await fetch('/api/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
            });

            if (response.ok) {
                const result = await response.json();

                // Atualizar progresso final
                setSendingProgress(prev => ({
                    ...prev,
                    sent: result.summary.sent,
                    failed: result.summary.failed,
                    currentEmail: 'Envio concluído!',
                    isComplete: true
                }));

                if (sendType === 'list') {
                    setMessage({
                        type: 'success',
                        text: `Envio concluído! ${result.summary.sent} emails enviados com sucesso de ${result.summary.total} total. Taxa de sucesso: ${result.summary.successRate}%.`
                    });
                } else {
                    setMessage({ type: 'success', text: 'Email enviado com sucesso!' });
                }

                // Aguardar um pouco para mostrar o resultado final antes de resetar
                setTimeout(() => {
                    // Reset form apenas se não houver erros graves
                    if (result.summary.sent > 0) {
                        setStep(1);
                        setSelectedContact(null);
                        setSelectedMailingList(null);
                        setSelectedScript(null);
                        setSelectedTemplate(null);
                        setSendType('individual');
                        setSendingProgress({
                            total: 0,
                            sent: 0,
                            failed: 0,
                            currentBatch: 0,
                            totalBatches: 0,
                            currentEmail: '',
                            isComplete: false
                        });
                    }
                }, 3000);
            } else {
                const error = await response.json();
                setSendingProgress(prev => ({
                    ...prev,
                    failed: prev.total,
                    currentEmail: 'Erro no envio',
                    isComplete: true
                }));
                setMessage({ type: 'error', text: error.error || 'Erro ao enviar email' });
            }
        } catch (err) {
            console.error('Erro ao enviar email:', err);
            setSendingProgress(prev => ({
                ...prev,
                failed: prev.total,
                currentEmail: 'Erro de conexão',
                isComplete: true
            }));
            setMessage({ type: 'error', text: 'Erro ao conectar com o servidor' });
        } finally {
            setSending(false);
        }
    };

    // Filter functions
    const filteredContacts = (contacts || []).filter(contact =>
        contact && contact.name && contact.companyName && contact.email && (
            contact.name.toLowerCase().includes(contactSearch.toLowerCase()) ||
            contact.companyName.toLowerCase().includes(contactSearch.toLowerCase()) ||
            contact.email.toLowerCase().includes(contactSearch.toLowerCase())
        )
    );

    const filteredMailingLists = (mailingLists || []).filter(list =>
        list && list.name && (
            list.name.toLowerCase().includes(mailingListSearch.toLowerCase()) ||
            (list.description || '').toLowerCase().includes(mailingListSearch.toLowerCase())
        )
    );

    const filteredScripts = (scripts || []).filter(script =>
        script && script.subject && (
            script.subject.toLowerCase().includes(scriptSearch.toLowerCase()) ||
            (script.prospectData?.contactName || '').toLowerCase().includes(scriptSearch.toLowerCase())
        )
    );

    const filteredTemplates = (templates || []).filter(template =>
        template && template.name && template.subject && (
            template.name.toLowerCase().includes(templateSearch.toLowerCase()) ||
            template.subject.toLowerCase().includes(templateSearch.toLowerCase())
        )
    );

    return (
        <MainLayout>
            <div className="p-4 sm:p-6 lg:p-8 h-screen flex flex-col">
                <div className="max-w-7xl mx-auto flex-1 flex flex-col min-h-0 w-full">
                    {/* Header */}
                    <div className="mb-4 sm:mb-6 flex-shrink-0">
                        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                            Enviar Email
                        </h1>
                        <p className="text-neutral-400 text-sm sm:text-base">
                            Selecione contato, script e template para compor e enviar seu email
                        </p>
                    </div>

                    {/* Message */}
                    {message && (
                        <div className={`mb-4 p-3 sm:p-4 rounded-lg flex-shrink-0 ${message.type === 'success'
                            ? 'bg-green-900/50 border border-green-700 text-green-300'
                            : 'bg-red-900/50 border border-red-700 text-red-300'
                            }`}>
                            <div className="flex items-start justify-between gap-2">
                                <span className="flex-1 text-sm sm:text-base">{message.text}</span>
                                <button
                                    onClick={() => setMessage(null)}
                                    className="flex-shrink-0 text-current hover:opacity-70 cursor-pointer p-1"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Progress Steps */}
                    <div className="mb-4 sm:mb-6 flex-shrink-0">
                        {/* Desktop Steps */}
                        <div className="hidden lg:flex items-center justify-between">
                            {[
                                { step: 1, title: 'Para quem Enviar?', icon: Users },
                                { step: 2, title: 'Escolher Template', icon: Mail },
                                { step: 3, title: 'Escolher Script (Opcional)', icon: FileText },
                                { step: 4, title: 'Revisar e Enviar', icon: Send }
                            ].map((item, index) => {
                                const Icon = item.icon;
                                const isActive = step === item.step;
                                const isCompleted = step > item.step;

                                return (
                                    <div key={item.step} className="flex items-center">
                                        <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${isCompleted
                                            ? 'bg-green-600 border-green-600'
                                            : isActive
                                                ? 'bg-blue-600 border-blue-600'
                                                : 'border-neutral-600'
                                            }`}>
                                            {isCompleted ? (
                                                <Check className="w-5 h-5 text-white" />
                                            ) : (
                                                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-neutral-400'}`} />
                                            )}
                                        </div>
                                        <span className={`ml-3 text-sm font-medium ${isActive ? 'text-white' : isCompleted ? 'text-green-300' : 'text-neutral-400'
                                            }`}>
                                            {item.title}
                                        </span>
                                        {index < 3 && (
                                            <div className={`w-16 h-0.5 mx-4 ${step > item.step ? 'bg-green-600' : 'bg-neutral-600'
                                                }`} />
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Mobile/Tablet Steps */}
                        <div className="lg:hidden">
                            <div className="flex items-center justify-between mb-3">
                                <div className="text-sm text-neutral-400">
                                    Passo {step} de 4
                                </div>
                                <div className="flex items-center gap-2">
                                    {[1, 2, 3, 4].map((num) => (
                                        <div
                                            key={num}
                                            className={`w-2 h-2 rounded-full ${step >= num ? 'bg-blue-500' : 'bg-neutral-600'
                                                }`}
                                        />
                                    ))}
                                </div>
                            </div>
                            <div className="bg-neutral-800/50 rounded-lg p-3 border border-neutral-700/50">
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 1 ? 'bg-blue-600' : step > 1 ? 'bg-green-600' : 'bg-neutral-700'
                                        }`}>
                                        {step === 1 ? (
                                            <Users className="w-4 h-4 text-white" />
                                        ) : step === 2 ? (
                                            <Mail className="w-4 h-4 text-white" />
                                        ) : step === 3 ? (
                                            <FileText className="w-4 h-4 text-white" />
                                        ) : (
                                            <Send className="w-4 h-4 text-white" />
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="text-white font-medium text-sm">
                                            {step === 1 && 'Para quem Enviar?'}
                                            {step === 2 && 'Escolher Template'}
                                            {step === 3 && 'Escolher Script (Opcional)'}
                                            {step === 4 && 'Revisar e Enviar'}
                                        </h3>
                                        <p className="text-neutral-400 text-xs">
                                            {step === 1 && 'Selecione um contato ou lista'}
                                            {step === 2 && 'Escolha um template de email'}
                                            {step === 3 && 'Adicione um script personalizado'}
                                            {step === 4 && 'Revise e envie seu email'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Step Content */}
                    <div className="bg-neutral-gradient rounded-lg border border-neutral-800 flex-1 flex flex-col min-h-0">
                        {step === 1 && (
                            <div className="p-4 sm:p-6 flex-1 flex flex-col min-h-0">
                                <h2 className="text-lg sm:text-xl font-semibold text-white mb-4 sm:mb-6 flex-shrink-0">Para quem Enviar?</h2>

                                {/* Tipo de Envio */}
                                <div className="mb-4 sm:mb-6 flex-shrink-0">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                        <button
                                            onClick={() => {
                                                setSendType('individual');
                                                setSelectedMailingList(null);
                                            }}
                                            className={`p-3 sm:p-4 rounded-lg border-2 transition-all ${sendType === 'individual'
                                                ? 'border-blue-500 bg-blue-900/20'
                                                : 'border-neutral-700 bg-neutral-800/50 hover:border-neutral-600'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg flex-shrink-0 ${sendType === 'individual' ? 'bg-blue-600' : 'bg-neutral-700'
                                                    }`}>
                                                    <User className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                                                </div>
                                                <div className="text-left min-w-0 flex-1">
                                                    <h3 className="font-medium text-white text-sm sm:text-base">Contato Individual</h3>
                                                    <p className="text-xs sm:text-sm text-neutral-400">Enviar para um contato específico</p>
                                                </div>
                                            </div>
                                        </button>

                                        <button
                                            onClick={() => {
                                                setSendType('list');
                                                setSelectedContact(null);
                                            }}
                                            className={`p-3 sm:p-4 rounded-lg border-2 transition-all ${sendType === 'list'
                                                ? 'border-blue-500 bg-blue-900/20'
                                                : 'border-neutral-700 bg-neutral-800/50 hover:border-neutral-600'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg flex-shrink-0 ${sendType === 'list' ? 'bg-blue-600' : 'bg-neutral-700'
                                                    }`}>
                                                    <List className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                                                </div>
                                                <div className="text-left min-w-0 flex-1">
                                                    <h3 className="font-medium text-white text-sm sm:text-base">Lista de Email</h3>
                                                    <p className="text-xs sm:text-sm text-neutral-400">Enviar para todos de uma lista</p>
                                                </div>
                                            </div>
                                        </button>
                                    </div>
                                </div>

                                {/* Conteúdo baseado no tipo selecionado */}
                                {sendType === 'individual' ? (
                                    <>
                                        {/* Search Contatos */}
                                        <div className="mb-4 flex-shrink-0">
                                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 mb-3">
                                                <h3 className="text-sm font-medium text-neutral-300">
                                                    Contatos disponíveis
                                                </h3>
                                                <div className="flex items-center gap-2 px-2 py-1 bg-neutral-800 rounded text-xs text-neutral-400">
                                                    <User className="h-3 w-3" />
                                                    <span>{filteredContacts.length} contato{filteredContacts.length !== 1 ? 's' : ''}</span>
                                                </div>
                                            </div>
                                            <div className="relative">
                                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                                                <input
                                                    type="text"
                                                    placeholder="Buscar por nome, empresa ou email..."
                                                    className="w-full pl-10 pr-4 py-2.5 sm:py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500 text-sm sm:text-base"
                                                    value={contactSearch}
                                                    onChange={(e) => setContactSearch(e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        {/* Contacts List */}
                                        <div className="space-y-3 flex-1 overflow-y-auto min-h-0 mb-4 sm:mb-6">
                                            {filteredContacts.length === 0 ? (
                                                <div className="h-full flex items-center justify-center">
                                                    <div className="text-center px-4">
                                                        <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 bg-neutral-800 rounded-full flex items-center justify-center">
                                                            <User className="w-6 h-6 sm:w-8 sm:h-8 text-neutral-500" />
                                                        </div>
                                                        <h3 className="text-white font-medium mb-2 text-sm sm:text-base">
                                                            {contactSearch ? 'Nenhum contato encontrado' : 'Nenhum contato disponível'}
                                                        </h3>
                                                        <p className="text-neutral-400 text-xs sm:text-sm max-w-sm mx-auto">
                                                            {contactSearch
                                                                ? 'Tente buscar com termos diferentes ou verifique se há contatos ativos.'
                                                                : 'Você precisa ter contatos ativos para enviar emails.'
                                                            }
                                                        </p>
                                                        {contactSearch && (
                                                            <button
                                                                onClick={() => setContactSearch('')}
                                                                className="mt-3 text-blue-400 hover:text-blue-300 text-xs sm:text-sm"
                                                            >
                                                                Limpar busca
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ) : (
                                                filteredContacts.map((contact) => (
                                                    <ContactItem
                                                        key={contact.id}
                                                        contact={{
                                                            ...contact,
                                                            phone: contact.phone || undefined
                                                        }}
                                                        isSelected={selectedContact?.id === contact.id}
                                                        onContactClick={() => setSelectedContact(contact)}
                                                        selectionMode="click"
                                                    />
                                                ))
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        {/* Search Listas */}
                                        <div className="mb-4 flex-shrink-0">
                                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 mb-3">
                                                <h3 className="text-sm font-medium text-neutral-300">
                                                    Listas de email disponíveis
                                                </h3>
                                                <div className="flex items-center gap-2 px-2 py-1 bg-neutral-800 rounded text-xs text-neutral-400">
                                                    <List className="h-3 w-3" />
                                                    <span>{filteredMailingLists.length} lista{filteredMailingLists.length !== 1 ? 's' : ''}</span>
                                                </div>
                                            </div>
                                            <div className="relative">
                                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                                                <input
                                                    type="text"
                                                    placeholder="Buscar por nome ou descrição..."
                                                    className="w-full pl-10 pr-4 py-2.5 sm:py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500 text-sm sm:text-base"
                                                    value={mailingListSearch}
                                                    onChange={(e) => setMailingListSearch(e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        {/* Mailing Lists */}
                                        <div className="space-y-3 flex-1 overflow-y-auto min-h-0 mb-4 sm:mb-6">
                                            {filteredMailingLists.length === 0 ? (
                                                <div className="h-full flex items-center justify-center">
                                                    <div className="text-center px-4">
                                                        <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 bg-neutral-800 rounded-full flex items-center justify-center">
                                                            <List className="w-6 h-6 sm:w-8 sm:h-8 text-neutral-500" />
                                                        </div>
                                                        <h3 className="text-white font-medium mb-2 text-sm sm:text-base">
                                                            {mailingListSearch ? 'Nenhuma lista encontrada' : 'Nenhuma lista disponível'}
                                                        </h3>
                                                        <p className="text-neutral-400 text-xs sm:text-sm max-w-sm mx-auto">
                                                            {mailingListSearch
                                                                ? 'Tente buscar com termos diferentes.'
                                                                : 'Você precisa criar listas de email para usar esta opção.'
                                                            }
                                                        </p>
                                                        {mailingListSearch && (
                                                            <button
                                                                onClick={() => setMailingListSearch('')}
                                                                className="mt-3 text-blue-400 hover:text-blue-300 text-xs sm:text-sm"
                                                            >
                                                                Limpar busca
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ) : (
                                                filteredMailingLists.map((list) => {
                                                    const isSelected = selectedMailingList?.id === list.id;
                                                    const contactCount = list._count?.contacts || 0;

                                                    return (
                                                        <div
                                                            key={list.id}
                                                            className={`p-3 sm:p-4 border rounded-lg cursor-pointer transition-all ${isSelected
                                                                ? 'border-blue-500 bg-blue-900/20'
                                                                : 'border-neutral-700 bg-neutral-800/50 hover:border-neutral-600 hover:bg-neutral-800'
                                                                }`}
                                                            onClick={() => setSelectedMailingList(list)}
                                                        >
                                                            <div className="flex items-center justify-between gap-3">
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center gap-3 mb-2">
                                                                        <div
                                                                            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0"
                                                                            style={{ backgroundColor: list.color }}
                                                                        >
                                                                            <List className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                                                                        </div>
                                                                        <div className="min-w-0 flex-1">
                                                                            <h3 className="text-white font-medium text-sm sm:text-base truncate">{list.name}</h3>
                                                                            {list.description && (
                                                                                <p className="text-neutral-400 text-xs sm:text-sm truncate">{list.description}</p>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center gap-1 text-xs text-neutral-400">
                                                                        <Users className="w-3 h-3" />
                                                                        <span>{contactCount} contato{contactCount !== 1 ? 's' : ''}</span>
                                                                    </div>
                                                                </div>
                                                                {isSelected && (
                                                                    <div className="flex-shrink-0">
                                                                        <div className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-600 rounded-full flex items-center justify-center">
                                                                            <Check className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </>
                                )}

                                {/* Navigation */}
                                <div className="flex justify-end flex-shrink-0">
                                    <button
                                        onClick={() => setStep(2)}
                                        disabled={sendType === 'individual' ? !selectedContact : !selectedMailingList}
                                        className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 disabled:bg-neutral-700 disabled:cursor-not-allowed text-white px-6 py-3 sm:py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                                    >
                                        Próximo
                                        <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="p-4 sm:p-6 flex-1 flex flex-col min-h-0">
                                <h2 className="text-lg sm:text-xl font-semibold text-white mb-4 flex-shrink-0">Escolher Template</h2>

                                {/* Search */}
                                <div className="mb-4 flex-shrink-0">
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 mb-3">
                                        <h3 className="text-sm font-medium text-neutral-300">
                                            Templates disponíveis
                                        </h3>
                                        <div className="flex items-center gap-2 px-2 py-1 bg-neutral-800 rounded text-xs text-neutral-400">
                                            <Mail className="h-3 w-3" />
                                            <span>{filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''}</span>
                                        </div>
                                    </div>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                                        <input
                                            type="text"
                                            placeholder="Buscar templates..."
                                            className="w-full pl-10 pr-4 py-2.5 sm:py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500 text-sm sm:text-base"
                                            value={templateSearch}
                                            onChange={(e) => setTemplateSearch(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* Templates List */}
                                <div className="space-y-3 flex-1 overflow-y-auto min-h-0 mb-4 sm:mb-6">
                                    {filteredTemplates.length === 0 ? (
                                        <div className="h-full flex items-center justify-center">
                                            <div className="text-center px-4">
                                                <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 bg-neutral-800 rounded-full flex items-center justify-center">
                                                    <Mail className="w-6 h-6 sm:w-8 sm:h-8 text-neutral-500" />
                                                </div>
                                                <h3 className="text-white font-medium mb-2 text-sm sm:text-base">
                                                    {templateSearch ? 'Nenhum template encontrado' : 'Nenhum template disponível'}
                                                </h3>
                                                <p className="text-neutral-400 text-xs sm:text-sm max-w-sm mx-auto">
                                                    {templateSearch
                                                        ? 'Tente buscar com termos diferentes.'
                                                        : 'Você precisa criar templates de email para usar esta funcionalidade.'
                                                    }
                                                </p>
                                                {templateSearch && (
                                                    <button
                                                        onClick={() => setTemplateSearch('')}
                                                        className="mt-3 text-blue-400 hover:text-blue-300 text-xs sm:text-sm"
                                                    >
                                                        Limpar busca
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        filteredTemplates.map((template) => (
                                            <div
                                                key={template.id}
                                                className={`p-3 sm:p-4 border rounded-lg cursor-pointer transition-all ${selectedTemplate?.id === template.id
                                                    ? 'border-blue-500 bg-blue-900/20'
                                                    : 'border-neutral-700 hover:border-neutral-600'
                                                    }`}
                                                onClick={() => setSelectedTemplate(template)}
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-start gap-3 mb-2">
                                                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg flex items-center justify-center flex-shrink-0">
                                                                <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <h3 className="font-semibold text-white text-sm sm:text-base truncate">{template.name}</h3>
                                                                <p className="text-neutral-400 text-xs sm:text-sm leading-relaxed">{template.subject}</p>
                                                                {template.description && (
                                                                    <p className="text-neutral-500 text-xs mt-1 line-clamp-2">{template.description}</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                        {template.category && (
                                                            <div className="flex items-center gap-2 ml-11">
                                                                <span className="px-2 py-0.5 bg-neutral-800 text-neutral-300 rounded text-xs border border-neutral-600">
                                                                    {template.category}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    {selectedTemplate?.id === template.id && (
                                                        <div className="flex-shrink-0">
                                                            <div className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-600 rounded-full flex items-center justify-center">
                                                                <Check className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* Navigation */}
                                <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0 flex-shrink-0">
                                    <button
                                        onClick={() => setStep(1)}
                                        className="flex items-center justify-center gap-2 px-6 py-3 sm:py-2 bg-neutral-700 text-white rounded-lg hover:bg-neutral-600 transition-colors order-2 sm:order-1"
                                    >
                                        <ArrowLeft className="w-4 h-4" />
                                        Anterior
                                    </button>
                                    <button
                                        onClick={() => setStep(3)}
                                        disabled={!selectedTemplate}
                                        className="flex items-center justify-center gap-2 px-6 py-3 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed order-1 sm:order-2"
                                    >
                                        Próximo
                                        <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="p-4 sm:p-6 flex-1 flex flex-col min-h-0">
                                <h2 className="text-lg sm:text-xl font-semibold text-white mb-4 flex-shrink-0">
                                    Escolher Script (Opcional)
                                </h2>

                                {/* Layout responsivo - vertical em mobile, horizontal em desktop */}
                                <div className="flex-1 flex flex-col lg:flex-row gap-4 lg:gap-6 min-h-0">
                                    {/* Coluna esquerda - Lista de scripts */}
                                    <div className="w-full lg:w-1/2 flex flex-col min-h-0">
                                        {/* Search */}
                                        <div className="mb-4 flex-shrink-0">
                                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 mb-3">
                                                <h3 className="text-sm font-medium text-neutral-300">
                                                    Scripts disponíveis
                                                </h3>
                                                <div className="flex items-center gap-2 px-2 py-1 bg-neutral-800 rounded text-xs text-neutral-400">
                                                    <FileText className="h-3 w-3" />
                                                    <span>{filteredScripts.length} script{filteredScripts.length !== 1 ? 's' : ''}</span>
                                                </div>
                                            </div>
                                            <div className="relative">
                                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                                                <input
                                                    type="text"
                                                    placeholder="Buscar scripts..."
                                                    className="w-full pl-10 pr-4 py-2.5 sm:py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500 text-sm sm:text-base"
                                                    value={scriptSearch}
                                                    onChange={(e) => setScriptSearch(e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        {/* Opção "Sem Script" */}
                                        <div className="mb-3 flex-shrink-0">
                                            <div
                                                className={`p-3 sm:p-4 border rounded-lg cursor-pointer transition-all ${!selectedScript
                                                    ? 'border-blue-500 bg-blue-900/20'
                                                    : 'border-neutral-700 hover:border-neutral-600'
                                                    }`}
                                                onClick={() => setSelectedScript(null)}
                                            >
                                                <div className="flex items-center justify-between gap-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-neutral-600 to-neutral-700 rounded-lg flex items-center justify-center flex-shrink-0">
                                                            <X className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <h3 className="font-semibold text-white text-sm sm:text-base">
                                                                Sem Script Específico
                                                            </h3>
                                                            <p className="text-neutral-400 text-xs sm:text-sm">
                                                                Usar apenas o template selecionado
                                                            </p>
                                                        </div>
                                                    </div>
                                                    {!selectedScript && (
                                                        <div className="flex-shrink-0">
                                                            <div className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-600 rounded-full flex items-center justify-center">
                                                                <Check className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Scripts List */}
                                        <div className="space-y-3 flex-1 overflow-y-auto min-h-0 max-h-60 lg:max-h-none">
                                            {filteredScripts.length === 0 ? (
                                                <div className="h-full flex items-center justify-center">
                                                    <div className="text-center px-4">
                                                        <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 bg-neutral-800 rounded-full flex items-center justify-center">
                                                            <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-neutral-500" />
                                                        </div>
                                                        <h3 className="text-white font-medium mb-2 text-sm sm:text-base">
                                                            {scriptSearch ? 'Nenhum script encontrado' : 'Nenhum script disponível'}
                                                        </h3>
                                                        <p className="text-neutral-400 text-xs sm:text-sm max-w-sm mx-auto">
                                                            {scriptSearch
                                                                ? 'Tente buscar com termos diferentes.'
                                                                : 'Você pode continuar sem script ou criar um primeiro.'}
                                                        </p>
                                                        {scriptSearch && (
                                                            <button
                                                                onClick={() => setScriptSearch('')}
                                                                className="mt-3 text-blue-400 hover:text-blue-300 text-xs sm:text-sm"
                                                            >
                                                                Limpar busca
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ) : (
                                                filteredScripts.map((script) => (
                                                    <div
                                                        key={script.id}
                                                        className={`p-3 sm:p-4 border rounded-lg cursor-pointer transition-all ${selectedScript?.id === script.id
                                                            ? 'border-blue-500 bg-blue-900/20'
                                                            : 'border-neutral-700 hover:border-neutral-600'
                                                            }`}
                                                        onClick={() => setSelectedScript(script)}
                                                    >
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-start gap-3 mb-2">
                                                                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-lg flex items-center justify-center flex-shrink-0">
                                                                        <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                                                                    </div>
                                                                    <div className="min-w-0 flex-1">
                                                                        <h3 className="font-semibold text-white text-xs sm:text-sm truncate mb-1">
                                                                            {script.subject}
                                                                        </h3>
                                                                        <div className="flex flex-wrap items-center gap-2 mb-2">
                                                                            <span className="px-2 py-0.5 bg-neutral-800 text-neutral-300 rounded text-xs border border-neutral-600 flex-shrink-0">
                                                                                {script.emailType === 'cold_outreach' && 'Primeiro Contato'}
                                                                                {script.emailType === 'follow_up' && 'Follow-up'}
                                                                                {script.emailType === 'introduction' && 'Apresentação'}
                                                                                {script.emailType === 'meeting_request' && 'Agendamento'}
                                                                            </span>
                                                                            {script.tone && (
                                                                                <span className="text-neutral-400 text-xs">• {script.tone}</span>
                                                                            )}
                                                                        </div>
                                                                        <div className="text-xs text-neutral-400 mb-2">
                                                                            {script.prospectData?.contactName && (
                                                                                <span className="truncate block">{script.prospectData.contactName}</span>
                                                                            )}
                                                                            {script.prospectData?.companyName && (
                                                                                <span className="truncate block">• {script.prospectData.companyName}</span>
                                                                            )}
                                                                        </div>
                                                                        <p className="text-neutral-400 text-xs leading-relaxed line-clamp-2">
                                                                            {script.body.length > 80
                                                                                ? script.body.substring(0, 80) + '...'
                                                                                : script.body}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            {selectedScript?.id === script.id && (
                                                                <div className="flex-shrink-0">
                                                                    <div className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-600 rounded-full flex items-center justify-center">
                                                                        <Check className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>

                                    {/* Coluna direita - Preview */}
                                    <div className="w-full lg:w-1/2 flex flex-col min-h-0">
                                        <div className="mb-3 lg:hidden">
                                            <h3 className="text-sm font-medium text-neutral-300">
                                                Preview do Email
                                            </h3>
                                        </div>
                                        <EmailTemplatePreview
                                            sendType={sendType}
                                            selectedTemplate={selectedTemplate}
                                            selectedScript={selectedScript}
                                            contactForPreview={sendType === 'individual' ? selectedContact : previewContact}
                                            smtpConfig={smtpConfig}
                                            className="flex-1 min-h-60 lg:min-h-0"
                                        />
                                    </div>
                                </div>

                                {/* Navigation */}
                                <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0 flex-shrink-0 mt-4 lg:mt-6">
                                    <button
                                        onClick={() => setStep(2)}
                                        className="flex items-center justify-center gap-2 px-6 py-3 sm:py-2 bg-neutral-700 text-white rounded-lg hover:bg-neutral-600 transition-colors order-2 sm:order-1"
                                    >
                                        <ArrowLeft className="w-4 h-4" />
                                        Anterior
                                    </button>
                                    <button
                                        onClick={() => setStep(4)}
                                        className="flex items-center justify-center gap-2 px-6 py-3 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors order-1 sm:order-2"
                                    >
                                        Revisar Email
                                        <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {step === 4 && (
                            <div className="p-4 sm:p-6 flex-1 flex flex-col min-h-0">
                                <h2 className="text-lg sm:text-xl font-semibold text-white mb-4 sm:mb-6 flex-shrink-0">
                                    Revisar e Enviar
                                </h2>

                                <div className="flex flex-col xl:flex-row gap-4 lg:gap-6 flex-1 min-h-0">
                                    {/* Coluna esquerda - Informações e configurações */}
                                    <div className="w-full xl:w-1/3 flex flex-col gap-4 max-h-96 xl:max-h-none overflow-y-auto xl:overflow-visible">
                                        {/* Resumo da seleção */}
                                        <div className="bg-neutral-800 rounded-lg p-3 sm:p-4 border border-neutral-700">
                                            <h3 className="font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
                                                {sendType === 'individual' ? (
                                                    <User className="w-4 h-4" />
                                                ) : (
                                                    <List className="w-4 h-4" />
                                                )}
                                                Resumo da Seleção
                                            </h3>
                                            <div className="space-y-3 text-xs sm:text-sm">
                                                <div className="flex items-start gap-3">
                                                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 sm:mt-2 flex-shrink-0"></div>
                                                    <div className="min-w-0 flex-1">
                                                        {sendType === 'individual' ? (
                                                            <>
                                                                <p className="text-neutral-400">Contato:</p>
                                                                <p className="text-white font-medium truncate">{selectedContact?.name}</p>
                                                                <p className="text-neutral-400 text-xs truncate">{selectedContact?.email}</p>
                                                                <p className="text-neutral-400 text-xs truncate">{selectedContact?.companyName}</p>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <p className="text-neutral-400">Lista de Email:</p>
                                                                <p className="text-white font-medium truncate">{selectedMailingList?.name}</p>
                                                                {selectedMailingList?.description && (
                                                                    <p className="text-neutral-400 text-xs truncate">{selectedMailingList.description}</p>
                                                                )}
                                                                <p className="text-neutral-400 text-xs">
                                                                    {selectedMailingList?._count?.contacts || 0} contato{(selectedMailingList?._count?.contacts || 0) !== 1 ? 's' : ''}
                                                                </p>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-start gap-3">
                                                    <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 sm:mt-2 flex-shrink-0"></div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-neutral-400">Template:</p>
                                                        <p className="text-white font-medium truncate">{selectedTemplate?.name}</p>
                                                        <p className="text-neutral-400 text-xs truncate">{selectedTemplate?.description || 'Sem descrição'}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-start gap-3">
                                                    <div className={`w-2 h-2 rounded-full mt-1.5 sm:mt-2 flex-shrink-0 ${selectedScript ? 'bg-purple-500' : 'bg-neutral-500'}`}></div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-neutral-400">Script:</p>
                                                        <p className="text-white font-medium truncate">
                                                            {selectedScript ? selectedScript.subject : 'Nenhum script selecionado'}
                                                        </p>
                                                        {selectedScript && (
                                                            <p className="text-neutral-400 text-xs">
                                                                {selectedScript.emailType === 'cold_outreach' && 'Primeiro Contato'}
                                                                {selectedScript.emailType === 'follow_up' && 'Follow-up'}
                                                                {selectedScript.emailType === 'introduction' && 'Apresentação'}
                                                                {selectedScript.emailType === 'meeting_request' && 'Agendamento'}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Detalhes do envio */}
                                        <div className="bg-neutral-800 rounded-lg p-3 sm:p-4 border border-neutral-700">
                                            <h3 className="font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
                                                <Mail className="w-4 h-4" />
                                                Detalhes do Envio
                                            </h3>
                                            <div className="space-y-3 text-xs sm:text-sm">
                                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2">
                                                    <span className="text-neutral-400">De:</span>
                                                    <div className="text-white text-left sm:text-right min-w-0 flex-1">
                                                        <div className="truncate">{smtpConfig?.fromName || 'N/A'}</div>
                                                        <div className="text-xs text-neutral-400 truncate">{smtpConfig?.fromEmail || 'N/A'}</div>
                                                    </div>
                                                </div>
                                                {sendType === 'individual' && (
                                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2">
                                                        <span className="text-neutral-400">Para:</span>
                                                        <div className="text-white text-left sm:text-right min-w-0 flex-1">
                                                            <div className="truncate">{selectedContact?.name}</div>
                                                            <div className="text-xs text-neutral-400 truncate">{selectedContact?.email}</div>
                                                        </div>
                                                    </div>
                                                )}
                                                <div className="border-t border-neutral-700 pt-3">
                                                    <span className="text-neutral-400 text-xs">Assunto:</span>
                                                    <p className="text-white font-medium mt-1 leading-tight text-xs sm:text-sm">
                                                        {selectedScript ? selectedScript.subject : selectedTemplate?.subject}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Status SMTP */}
                                        <div className="bg-neutral-800 rounded-lg p-3 sm:p-4 border border-neutral-700">
                                            <h3 className="font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
                                                <Send className="w-4 h-4" />
                                                Configuração SMTP
                                            </h3>
                                            {smtpConfig?.host ? (
                                                <div className="space-y-2">
                                                    <div className="flex items-center text-green-300 text-xs sm:text-sm">
                                                        <Check className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                                                        Configurado e pronto
                                                    </div>
                                                    <div className="text-xs text-neutral-400 bg-neutral-700/50 rounded px-2 sm:px-3 py-2">
                                                        <p><strong>Servidor:</strong> {smtpConfig.host}:{smtpConfig.port}</p>
                                                        <p><strong>Seguro:</strong> {smtpConfig.secure ? 'SSL/TLS' : 'Não'}</p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="space-y-2">
                                                    <div className="flex items-center text-red-300 text-xs sm:text-sm">
                                                        <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                                                        Não configurado
                                                    </div>
                                                    <p className="text-xs text-neutral-400">
                                                        Configure o SMTP nas configurações para poder enviar emails.
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Coluna direita - Preview do email */}
                                    <div className="flex-1 flex flex-col min-h-0">
                                        <div className="mb-3 xl:hidden">
                                            <h3 className="text-sm font-medium text-neutral-300">
                                                Preview do Email
                                            </h3>
                                        </div>
                                        <EmailTemplatePreview
                                            sendType={sendType}
                                            selectedTemplate={selectedTemplate}
                                            selectedScript={selectedScript}
                                            contactForPreview={sendType === 'individual' ? selectedContact : previewContact}
                                            smtpConfig={smtpConfig}
                                            className="flex-1 min-h-60 xl:min-h-0"
                                        />
                                    </div>
                                </div>

                                {/* Navigation com botões reorganizados */}
                                <div className="flex flex-col gap-4 flex-shrink-0 mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-neutral-700">
                                    {/* Componente de Progresso de Envio - Versão Mobile/Desktop */}
                                    {sending && (
                                        <div className="w-full">
                                            {/* Versão Desktop */}
                                            <div className="hidden lg:block">
                                                <div className="bg-gradient-to-r from-neutral-800 to-neutral-900 rounded-lg px-4 py-2.5 border border-neutral-700/50 shadow-lg h-11 flex items-center gap-4">
                                                    {/* Ícone + Status */}
                                                    <div className="flex items-center gap-2 flex-shrink-0">
                                                        <div className="relative">
                                                            <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                                                                <Send className="w-3 h-3 text-white" />
                                                            </div>
                                                            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-400 rounded-full">
                                                                <Loader2 className="w-1.5 h-1.5 animate-spin text-neutral-900" />
                                                            </div>
                                                        </div>
                                                        <div className="text-xs">
                                                            <span className="text-white font-medium">Enviando</span>
                                                            {sendingProgress.totalBatches > 1 && (
                                                                <span className="text-neutral-400 ml-1">
                                                                    {sendingProgress.currentBatch}/{sendingProgress.totalBatches}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {/* Barra de Progresso Compacta */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex-1 bg-neutral-700 rounded-full h-2 overflow-hidden">
                                                                <div className="flex h-full">
                                                                    <div
                                                                        className="bg-gradient-to-r from-green-500 to-green-600 transition-all duration-300 ease-out"
                                                                        style={{
                                                                            width: `${sendingProgress.total > 0 ? (sendingProgress.sent / sendingProgress.total) * 100 : 0}%`
                                                                        }}
                                                                    />
                                                                    {sendingProgress.failed > 0 && (
                                                                        <div
                                                                            className="bg-gradient-to-r from-red-500 to-red-600 transition-all duration-300 ease-out"
                                                                            style={{
                                                                                width: `${sendingProgress.total > 0 ? (sendingProgress.failed / sendingProgress.total) * 100 : 0}%`
                                                                            }}
                                                                        />
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="text-xs font-bold text-white min-w-[2rem] text-right">
                                                                {sendingProgress.total > 0
                                                                    ? Math.round(((sendingProgress.sent + sendingProgress.failed) / sendingProgress.total) * 100)
                                                                    : 0
                                                                }%
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {/* Estatísticas Ultra Compactas */}
                                                    <div className="flex items-center gap-2 flex-shrink-0">
                                                        <div className="text-xs text-neutral-300">
                                                            {sendingProgress.sent + sendingProgress.failed}/{sendingProgress.total}
                                                        </div>
                                                        {sendingProgress.sent > 0 && (
                                                            <div className="flex items-center gap-1 px-1.5 py-0.5 bg-green-900/40 rounded text-xs">
                                                                <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                                                                <span className="text-green-300 font-medium">{sendingProgress.sent}</span>
                                                            </div>
                                                        )}
                                                        {sendingProgress.failed > 0 && (
                                                            <div className="flex items-center gap-1 px-1.5 py-0.5 bg-red-900/40 rounded text-xs">
                                                                <div className="w-1.5 h-1.5 bg-red-400 rounded-full"></div>
                                                                <span className="text-red-300 font-medium">{sendingProgress.failed}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Versão Mobile */}
                                            <div className="lg:hidden">
                                                <div className="bg-gradient-to-r from-neutral-800 to-neutral-900 rounded-lg p-4 border border-neutral-700/50 shadow-lg">
                                                    <div className="flex items-center gap-3 mb-3">
                                                        <div className="relative">
                                                            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                                                                <Send className="w-4 h-4 text-white" />
                                                            </div>
                                                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full flex items-center justify-center">
                                                                <Loader2 className="w-2 h-2 animate-spin text-neutral-900" />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div className="text-white font-medium">Enviando emails</div>
                                                            <div className="text-xs text-neutral-400">
                                                                {sendingProgress.currentEmail}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-3">
                                                        <div className="flex items-center justify-between text-sm">
                                                            <span className="text-neutral-300">Progresso</span>
                                                            <span className="text-white font-bold">
                                                                {sendingProgress.total > 0
                                                                    ? Math.round(((sendingProgress.sent + sendingProgress.failed) / sendingProgress.total) * 100)
                                                                    : 0
                                                                }%
                                                            </span>
                                                        </div>

                                                        <div className="bg-neutral-700 rounded-full h-3 overflow-hidden">
                                                            <div className="flex h-full">
                                                                <div
                                                                    className="bg-gradient-to-r from-green-500 to-green-600 transition-all duration-300 ease-out"
                                                                    style={{
                                                                        width: `${sendingProgress.total > 0 ? (sendingProgress.sent / sendingProgress.total) * 100 : 0}%`
                                                                    }}
                                                                />
                                                                {sendingProgress.failed > 0 && (
                                                                    <div
                                                                        className="bg-gradient-to-r from-red-500 to-red-600 transition-all duration-300 ease-out"
                                                                        style={{
                                                                            width: `${sendingProgress.total > 0 ? (sendingProgress.failed / sendingProgress.total) * 100 : 0}%`
                                                                        }}
                                                                    />
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center justify-between text-sm">
                                                            <div className="flex items-center gap-3">
                                                                {sendingProgress.sent > 0 && (
                                                                    <div className="flex items-center gap-1.5">
                                                                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                                                        <span className="text-green-300">{sendingProgress.sent} enviados</span>
                                                                    </div>
                                                                )}
                                                                {sendingProgress.failed > 0 && (
                                                                    <div className="flex items-center gap-1.5">
                                                                        <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                                                                        <span className="text-red-300">{sendingProgress.failed} falhas</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <span className="text-neutral-400">
                                                                {sendingProgress.sent + sendingProgress.failed}/{sendingProgress.total}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Botões de ação */}
                                    <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0">
                                        <button
                                            onClick={() => setStep(3)}
                                            disabled={sending}
                                            className="flex items-center justify-center gap-2 px-6 py-3 sm:py-2 bg-neutral-700 text-white rounded-lg hover:bg-neutral-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed order-2 sm:order-1"
                                        >
                                            <ArrowLeft className="w-4 h-4" />
                                            Anterior
                                        </button>

                                        <div className="flex items-center gap-4 order-1 sm:order-2">
                                            {!sending && (
                                                <div className="flex items-center gap-2 text-sm text-neutral-400">
                                                    <Check className="w-4 h-4 text-green-400" />
                                                    Email pronto para envio
                                                </div>
                                            )}

                                            <button
                                                onClick={sendEmail}
                                                disabled={sending || !smtpConfig?.host}
                                                className="flex items-center gap-2 px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg"
                                            >
                                                {sending ? (
                                                    <>
                                                        <Loader2 className="w-5 h-5 animate-spin" />
                                                        {sendingProgress.isComplete ? 'Concluído' : 'Enviando...'}
                                                    </>
                                                ) : (
                                                    <>
                                                        <Send className="w-5 h-5" />
                                                        Enviar Email
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </MainLayout>
    );
} 