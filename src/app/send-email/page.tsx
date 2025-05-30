'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import MainLayout from '@/components/MainLayout';
import { Search, User, FileText, Mail, Eye, Send, ArrowLeft, ArrowRight, Check, X, Loader2, AlertCircle, ChevronDown, ChevronUp, Building2, Phone, MapPin, Power, PowerOff, Maximize2, Monitor } from 'lucide-react';

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

// Modal de preview em tela cheia
const FullscreenPreviewModal = ({
    isOpen,
    onClose,
    content,
    subject
}: {
    isOpen: boolean;
    onClose: () => void;
    content: string;
    subject: string;
}) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);

    useEffect(() => {
        if (iframeRef.current && content && isOpen) {
            const iframe = iframeRef.current;
            const doc = iframe.contentDocument || iframe.contentWindow?.document;

            if (doc) {
                const htmlContent = `
                    <!DOCTYPE html>
                    <html lang="pt-BR">
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>Preview do Email</title>
                        <style>
                            * { box-sizing: border-box; }
                            body {
                                margin: 0;
                                padding: 0;
                                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
                                line-height: 1.6;
                                color: #333;
                                background-color: #f8f9fa;
                            }
                            .email-wrapper {
                                background-color: #f8f9fa;
                                padding: 40px 20px;
                                min-height: 100vh;
                            }
                            .email-container {
                                max-width: 600px;
                                margin: 0 auto;
                                background-color: #ffffff;
                                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                                border: 1px solid #e9ecef;
                            }
                            .email-header {
                                background-color: #ffffff;
                                border-bottom: 1px solid #e9ecef;
                                padding: 20px;
                            }
                            .email-subject {
                                font-size: 18px;
                                font-weight: 600;
                                color: #212529;
                                margin: 0;
                            }
                            .email-body {
                                padding: 30px;
                                background-color: #ffffff;
                            }
                            img { max-width: 100%; height: auto; }
                            table { border-collapse: collapse; width: 100%; }
                            td, th { text-align: left; padding: 8px; }
                            a { color: #0066cc; text-decoration: underline; }
                            a:hover { text-decoration: none; }
                            h1, h2, h3, h4, h5, h6 { margin-top: 0; margin-bottom: 16px; line-height: 1.25; }
                            p { margin-top: 0; margin-bottom: 16px; }
                            ul, ol { margin-top: 0; margin-bottom: 16px; padding-left: 30px; }
                            li { margin-bottom: 4px; }
                        </style>
                    </head>
                    <body>
                        <div class="email-wrapper">
                            <div class="email-container">
                                <div class="email-header">
                                    <h1 class="email-subject">${subject}</h1>
                                </div>
                                <div class="email-body">
                                    ${content}
                                </div>
                            </div>
                        </div>
                    </body>
                    </html>
                `;

                doc.open();
                doc.write(htmlContent);
                doc.close();
            }
        }
    }, [content, subject, isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-white w-full h-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
                {/* Header do Modal */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center gap-3">
                        <Monitor className="h-5 w-5 text-gray-600" />
                        <h3 className="text-lg font-semibold text-gray-900">Preview do Email</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                        <X className="h-5 w-5 text-gray-600" />
                    </button>
                </div>

                {/* Conteúdo do Modal */}
                <div className="flex-1 bg-white">
                    <iframe
                        ref={iframeRef}
                        className="w-full h-full border-none"
                        sandbox="allow-same-origin"
                        title="Preview Completo do Email"
                    />
                </div>
            </div>
        </div>
    );
};

// Componente de preview melhorado simulando email real
const EmailPreview = ({
    content,
    subject,
    className = ""
}: {
    content: string;
    subject: string;
    className?: string;
}) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [showFullscreen, setShowFullscreen] = useState(false);

    useEffect(() => {
        if (iframeRef.current && content) {
            const iframe = iframeRef.current;
            const doc = iframe.contentDocument || iframe.contentWindow?.document;

            if (doc) {
                const htmlContent = `
                    <!DOCTYPE html>
                    <html lang="pt-BR">
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>Preview</title>
                        <style>
                            * { box-sizing: border-box; }
                            body {
                                margin: 0;
                                padding: 0;
                                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
                                line-height: 1.6;
                                color: #333;
                                background-color: #f8f9fa;
                            }
                            .email-wrapper {
                                background-color: #f8f9fa;
                                padding: 20px;
                            }
                            .email-container {
                                max-width: 600px;
                                margin: 0 auto;
                                background-color: #ffffff;
                                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                                border: 1px solid #e9ecef;
                            }
                            .email-header {
                                background-color: #ffffff;
                                border-bottom: 1px solid #e9ecef;
                                padding: 15px 20px;
                            }
                            .email-subject {
                                font-size: 16px;
                                font-weight: 600;
                                color: #212529;
                                margin: 0;
                                overflow: hidden;
                                text-overflow: ellipsis;
                                white-space: nowrap;
                            }
                            .email-body {
                                padding: 20px;
                                background-color: #ffffff;
                            }
                            img { max-width: 100%; height: auto; }
                            table { border-collapse: collapse; width: 100%; }
                            td, th { text-align: left; padding: 8px; }
                            a { color: #0066cc; text-decoration: underline; }
                            a:hover { text-decoration: none; }
                            h1, h2, h3, h4, h5, h6 { margin-top: 0; margin-bottom: 16px; line-height: 1.25; }
                            p { margin-top: 0; margin-bottom: 16px; }
                            ul, ol { margin-top: 0; margin-bottom: 16px; padding-left: 30px; }
                            li { margin-bottom: 4px; }
                        </style>
                    </head>
                    <body>
                        <div class="email-wrapper">
                        <div class="email-container">
                                <div class="email-header">
                                    <div class="email-subject">${subject || 'Sem assunto'}</div>
                                </div>
                                <div class="email-body">
                            ${content}
                                </div>
                            </div>
                        </div>
                    </body>
                    </html>
                `;

                doc.open();
                doc.write(htmlContent);
                doc.close();
            }
        }
    }, [content, subject]);

    if (!content) {
        return (
            <div className="bg-gray-50 border border-gray-200 p-8 text-center text-gray-500 min-h-[400px] flex items-center justify-center">
                <div>
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <p className="font-medium text-gray-700 mb-2">Nenhum conteúdo para visualizar</p>
                    <p className="text-sm text-gray-500">O preview aparecerá aqui quando todos os campos estiverem preenchidos</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className={`bg-white overflow-hidden shadow-lg border border-gray-200 relative ${className}`}>
                {/* Botão de tela cheia */}
                <button
                    onClick={() => setShowFullscreen(true)}
                    className="absolute top-2 right-2 z-10 p-2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white transition-all"
                    title="Ver em tela cheia"
                >
                    <Maximize2 className="h-4 w-4" />
                </button>

                <iframe
                    ref={iframeRef}
                    className="w-full h-full min-h-[500px] border-none"
                    sandbox="allow-same-origin"
                    title="Preview do Email"
                />
            </div>

            <FullscreenPreviewModal
                isOpen={showFullscreen}
                onClose={() => setShowFullscreen(false)}
                content={content}
                subject={subject}
            />
        </>
    );
};

// Função para gerar avatar com primeira letra
const generateAvatar = (name: string): { letter: string; bgColor: string; textColor: string } => {
    const letter = name ? name.charAt(0).toUpperCase() : '?';
    const colors = [
        { bg: 'bg-blue-500', text: 'text-white' },
        { bg: 'bg-green-500', text: 'text-white' },
        { bg: 'bg-purple-500', text: 'text-white' },
        { bg: 'bg-pink-500', text: 'text-white' },
        { bg: 'bg-indigo-500', text: 'text-white' },
        { bg: 'bg-yellow-500', text: 'text-black' },
        { bg: 'bg-red-500', text: 'text-white' },
        { bg: 'bg-teal-500', text: 'text-white' },
    ];

    const charCode = letter.charCodeAt(0);
    const colorIndex = charCode % colors.length;
    const selectedColor = colors[colorIndex];

    return {
        letter,
        bgColor: selectedColor.bg,
        textColor: selectedColor.text,
    };
};

// Função para formatar telefones de forma simplificada
const formatPhoneSimple = (phone: string): string => {
    if (!phone) return '';

    // Remove todos os caracteres não numéricos, exceto + no início
    let cleaned = phone.replace(/[^\d+]/g, '');

    // Se não tem +, assume que é número brasileiro
    if (!cleaned.startsWith('+')) {
        // Remove zeros à esquerda
        cleaned = cleaned.replace(/^0+/, '');

        // Se tem 11 dígitos, assume formato brasileiro com DDD
        if (cleaned.length === 11) {
            return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
        }
        // Se tem 10 dígitos, assume formato brasileiro com DDD (telefone fixo)
        else if (cleaned.length === 10) {
            return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
        }
    }

    // Para outros casos, retorna como está
    return phone;
};

export default function SendEmail() {
    const [step, setStep] = useState(1);
    const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
    const [selectedScript, setSelectedScript] = useState<Script | null>(null);
    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

    // Lists
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [scripts, setScripts] = useState<Script[]>([]);
    const [templates, setTemplates] = useState<Template[]>([]);

    // Search states
    const [contactSearch, setContactSearch] = useState('');
    const [scriptSearch, setScriptSearch] = useState('');
    const [templateSearch, setTemplateSearch] = useState('');

    // Final email data
    const [finalSubject, setFinalSubject] = useState('');
    const [finalHtmlContent, setFinalHtmlContent] = useState('');
    const [smtpConfig, setSMTPConfig] = useState<SMTPConfig | null>(null);

    // UI states
    const [sending, setSending] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Fetch data functions
    const fetchContacts = useCallback(async () => {
        try {
            const response = await fetch('/api/contacts?limit=100');
            if (response.ok) {
                const data = await response.json();
                setContacts(data.contacts.filter((c: Contact) => c.isActive));
            }
        } catch (error) {
            console.error('Erro ao buscar contatos:', error);
        }
    }, []);

    const fetchScripts = useCallback(async () => {
        try {
            const response = await fetch('/api/scripts?limit=100');
            if (response.ok) {
                const data = await response.json();
                setScripts(data.scripts);
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
                setTemplates(data.templates.filter((t: Template) => t.isActive));
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

    useEffect(() => {
        fetchContacts();
        fetchScripts();
        fetchTemplates();
        fetchSMTPConfig();
    }, [fetchContacts, fetchScripts, fetchTemplates, fetchSMTPConfig]);

    // Replace template variables with actual data
    const replaceVariables = useCallback((content: string, contact: Contact, script?: Script | null): string => {
        // Verificar se content é válido
        if (!content || typeof content !== 'string') {
            return '';
        }

        let result = content;

        // Verificar se contact existe antes de usar suas propriedades
        if (contact) {
            // Dados do contato
            result = result.replace(/{{contactName}}/g, contact.name || '');
            result = result.replace(/{{contactFirstName}}/g, contact.name ? contact.name.split(' ')[0] : '');
            result = result.replace(/{{contactEmail}}/g, contact.email || '');
            result = result.replace(/{{contactPhone}}/g, contact.phone || '');
            result = result.replace(/{{contactPosition}}/g, contact.position || '');
            result = result.replace(/{{companyName}}/g, contact.companyName || '');
            result = result.replace(/{{companyWebsite}}/g, contact.website || '');
            result = result.replace(/{{companySize}}/g, '');
            result = result.replace(/{{companyIndustry}}/g, contact.niche || '');
            result = result.replace(/{{companyLocation}}/g, '');
        }

        // Verificar se script existe antes de usar suas propriedades
        if (script) {
            // Dados do script - preserva quebras de linha convertendo para HTML
            const scriptBodyFormatted = script.body ? script.body.replace(/\n/g, '<br>') : '';
            result = result.replace(/{{scriptBody}}/g, scriptBodyFormatted);
            result = result.replace(/{{painPoints}}/g,
                (contact?.painPoints) ||
                (script.prospectData?.painPoints) ||
                ''
            );
            result = result.replace(/{{solutions}}/g, '');
            result = result.replace(/{{benefits}}/g, '');
            result = result.replace(/{{competitorAnalysis}}/g, '');
            result = result.replace(/{{roi}}/g, '');

            // Call to action do script
            result = result.replace(/{{primaryCTA}}/g, script.callToAction || '');
            result = result.replace(/{{secondaryCTA}}/g, '');
            result = result.replace(/{{ctaLink}}/g, '');
        } else {
            // Se não há script, remover ou substituir por valores padrão
            result = result.replace(/{{scriptBody}}/g, '');
            result = result.replace(/{{painPoints}}/g, contact?.painPoints || '');
            result = result.replace(/{{solutions}}/g, '');
            result = result.replace(/{{benefits}}/g, '');
            result = result.replace(/{{competitorAnalysis}}/g, '');
            result = result.replace(/{{roi}}/g, '');
            result = result.replace(/{{primaryCTA}}/g, '');
            result = result.replace(/{{secondaryCTA}}/g, '');
            result = result.replace(/{{ctaLink}}/g, '');
        }

        // Dados do remetente (SMTP config)
        result = result.replace(/{{senderName}}/g, smtpConfig?.fromName || '');
        result = result.replace(/{{senderEmail}}/g, smtpConfig?.fromEmail || '');
        result = result.replace(/{{senderCompany}}/g, '');
        result = result.replace(/{{senderPhone}}/g, '');
        result = result.replace(/{{senderLinkedIn}}/g, '');

        // Dados pessoais do remetente
        result = result.replace(/{{yourName}}/g, smtpConfig?.yourName || '');
        result = result.replace(/{{yourCompany}}/g, smtpConfig?.yourCompany || '');
        result = result.replace(/{{yourPhone}}/g, smtpConfig?.yourPhone || '');
        result = result.replace(/{{yourIndustry}}/g, smtpConfig?.yourIndustry || '');
        result = result.replace(/{{yourPosition}}/g, smtpConfig?.yourPosition || '');
        result = result.replace(/{{yourWebsite}}/g, smtpConfig?.yourWebsite || '');
        result = result.replace(/{{yourLocation}}/g, smtpConfig?.yourLocation || '');

        // Dados dinâmicos
        result = result.replace(/{{currentDate}}/g, new Date().toLocaleDateString('pt-BR'));
        result = result.replace(/{{currentTime}}/g, new Date().toLocaleTimeString('pt-BR'));
        result = result.replace(/{{dayOfWeek}}/g, new Date().toLocaleDateString('pt-BR', { weekday: 'long' }));

        return result;
    }, [smtpConfig]);

    // Generate final email when all selections are made
    useEffect(() => {
        if (selectedContact && selectedTemplate &&
            selectedTemplate.subject && selectedTemplate.htmlContent) {
            try {
                const processedSubject = selectedScript
                    ? selectedScript.subject
                    : replaceVariables(selectedTemplate.subject, selectedContact, selectedScript);
                const processedContent = replaceVariables(selectedTemplate.htmlContent, selectedContact, selectedScript);

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
    }, [selectedContact, selectedScript, selectedTemplate, smtpConfig, replaceVariables]);

    // Send email function
    const sendEmail = async () => {
        if (!selectedContact || !selectedTemplate || !smtpConfig) {
            setMessage({ type: 'error', text: 'Contato, template e configuração SMTP são obrigatórios' });
            return;
        }

        setSending(true);
        try {
            const response = await fetch('/api/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contactId: selectedContact.id,
                    scriptId: selectedScript?.id || null,
                    templateId: selectedTemplate.id,
                    toEmail: selectedContact.email,
                    toName: selectedContact.name,
                    subject: finalSubject,
                    htmlContent: finalHtmlContent,
                }),
            });

            if (response.ok) {
                setMessage({ type: 'success', text: 'Email enviado com sucesso!' });
                // Reset form
                setStep(1);
                setSelectedContact(null);
                setSelectedScript(null);
                setSelectedTemplate(null);
            } else {
                const error = await response.json();
                setMessage({ type: 'error', text: error.error || 'Erro ao enviar email' });
            }
        } catch {
            setMessage({ type: 'error', text: 'Erro ao conectar com o servidor' });
        } finally {
            setSending(false);
        }
    };

    // Filter functions
    const filteredContacts = contacts.filter(contact =>
        contact && contact.name && contact.companyName && contact.email && (
            contact.name.toLowerCase().includes(contactSearch.toLowerCase()) ||
            contact.companyName.toLowerCase().includes(contactSearch.toLowerCase()) ||
            contact.email.toLowerCase().includes(contactSearch.toLowerCase())
        )
    );

    const filteredScripts = scripts.filter(script =>
        script && script.subject && (
            script.subject.toLowerCase().includes(scriptSearch.toLowerCase()) ||
            (script.prospectData?.contactName || '').toLowerCase().includes(scriptSearch.toLowerCase())
        )
    );

    const filteredTemplates = templates.filter(template =>
        template && template.name && template.subject && (
            template.name.toLowerCase().includes(templateSearch.toLowerCase()) ||
            template.subject.toLowerCase().includes(templateSearch.toLowerCase())
        )
    );

    return (
        <MainLayout>
            <div className="p-8 h-screen flex flex-col">
                <div className="max-w-6xl mx-auto flex-1 flex flex-col min-h-0">
                    {/* Header */}
                    <div className="mb-6 flex-shrink-0">
                        <h1 className="text-3xl font-bold text-white mb-2">
                            Enviar Email
                        </h1>
                        <p className="text-neutral-400">
                            Selecione contato, script e template para compor e enviar seu email
                        </p>
                    </div>

                    {/* Message */}
                    {message && (
                        <div className={`mb-4 p-4 rounded-lg flex-shrink-0 ${message.type === 'success'
                            ? 'bg-green-900/50 border border-green-700 text-green-300'
                            : 'bg-red-900/50 border border-red-700 text-red-300'
                            }`}>
                            {message.text}
                            <button
                                onClick={() => setMessage(null)}
                                className="float-right text-current hover:opacity-70 cursor-pointer"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    )}

                    {/* Progress Steps */}
                    <div className="mb-6 flex-shrink-0">
                        <div className="flex items-center justify-between">
                            {[
                                { step: 1, title: 'Selecionar Contato', icon: User },
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
                    </div>

                    {/* Step Content */}
                    <div className="bg-neutral-gradient rounded-lg border border-neutral-800 flex-1 flex flex-col min-h-0">
                        {step === 1 && (
                            <div className="p-6 flex-1 flex flex-col min-h-0">
                                <h2 className="text-xl font-semibold text-white mb-4 flex-shrink-0">Selecionar Contato</h2>

                                {/* Search */}
                                <div className="mb-4 flex-shrink-0">
                                    <div className="flex items-center justify-between mb-3">
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
                                            className="w-full pl-10 pr-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500"
                                            value={contactSearch}
                                            onChange={(e) => setContactSearch(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* Contacts List */}
                                <div className="space-y-3 flex-1 overflow-y-auto min-h-0 mb-6">
                                    {filteredContacts.length === 0 ? (
                                        <div className="h-full flex items-center justify-center">
                                            <div className="text-center">
                                                <div className="w-16 h-16 mx-auto mb-4 bg-neutral-800 rounded-full flex items-center justify-center">
                                                    <User className="w-8 h-8 text-neutral-500" />
                                                </div>
                                                <h3 className="text-white font-medium mb-2">
                                                    {contactSearch ? 'Nenhum contato encontrado' : 'Nenhum contato disponível'}
                                                </h3>
                                                <p className="text-neutral-400 text-sm">
                                                    {contactSearch
                                                        ? 'Tente buscar com termos diferentes ou verifique se há contatos ativos.'
                                                        : 'Você precisa ter contatos ativos para enviar emails.'
                                                    }
                                                </p>
                                                {contactSearch && (
                                                    <button
                                                        onClick={() => setContactSearch('')}
                                                        className="mt-3 text-blue-400 hover:text-blue-300 text-sm"
                                                    >
                                                        Limpar busca
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        filteredContacts.map((contact) => {
                                            const avatar = generateAvatar(contact.name);
                                            return (
                                                <div
                                                    key={contact.id}
                                                    className={`p-4 border rounded-lg cursor-pointer transition-all ${selectedContact?.id === contact.id
                                                        ? 'border-blue-500 bg-blue-900/20'
                                                        : 'border-neutral-700 hover:border-neutral-600'
                                                        }`}
                                                    onClick={() => setSelectedContact(contact)}
                                                >
                                                    <div className="flex items-center gap-4">
                                                        {/* Avatar */}
                                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold text-sm ${avatar.bgColor} ${avatar.textColor} shadow-lg flex-shrink-0`}>
                                                            {avatar.letter}
                                                        </div>

                                                        {/* Contact Info */}
                                                        <div className="flex-1 min-w-0">
                                                            {/* Linha 1: Nome + Status + Check */}
                                                            <div className="flex items-center justify-between mb-1">
                                                                <div className="flex items-center gap-3">
                                                                    <h3 className="font-semibold text-white text-base truncate">
                                                                        {contact.name}
                                                                    </h3>
                                                                    {contact.position && (
                                                                        <span className="text-neutral-400 text-xs">
                                                                            • {contact.position}
                                                                        </span>
                                                                    )}
                                                                    <div className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs flex-shrink-0 ${contact.isActive
                                                                        ? 'bg-green-900/50 text-green-300 border border-green-700'
                                                                        : 'bg-red-900/50 text-red-300 border border-red-700'
                                                                        }`}>
                                                                        {contact.isActive ? <Power className="h-3 w-3" /> : <PowerOff className="h-3 w-3" />}
                                                                        {contact.isActive ? 'Ativo' : 'Inativo'}
                                                                    </div>
                                                                </div>
                                                                {selectedContact?.id === contact.id && (
                                                                    <Check className="w-5 h-5 text-blue-400 flex-shrink-0" />
                                                                )}
                                                            </div>

                                                            {/* Linha 2: Empresa + Email */}
                                                            <div className="flex items-center gap-4 mb-2">
                                                                <div className="flex items-center gap-1.5 text-sm">
                                                                    <Building2 className="h-3.5 w-3.5 text-neutral-500 flex-shrink-0" />
                                                                    <span className="truncate text-blue-300 font-medium">
                                                                        {contact.companyName}
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center gap-1.5 text-sm text-neutral-300">
                                                                    <Mail className="h-3.5 w-3.5 text-neutral-500 flex-shrink-0" />
                                                                    <span className="truncate">{contact.email}</span>
                                                                </div>
                                                            </div>

                                                            {/* Linha 3: Informações adicionais */}
                                                            <div className="flex items-center gap-4 text-xs text-neutral-400">
                                                                {contact.phone && (
                                                                    <div className="flex items-center gap-1.5">
                                                                        <Phone className="h-3 w-3 flex-shrink-0" />
                                                                        <span>{formatPhoneSimple(contact.phone)}</span>
                                                                    </div>
                                                                )}
                                                                {contact.niche && (
                                                                    <div className="flex items-center gap-1.5">
                                                                        <User className="h-3 w-3 flex-shrink-0" />
                                                                        <span className="truncate">{contact.niche}</span>
                                                                    </div>
                                                                )}
                                                                {contact.website && (
                                                                    <div className="flex items-center gap-1.5">
                                                                        <MapPin className="h-3 w-3 flex-shrink-0" />
                                                                        <span className="truncate max-w-32">
                                                                            {contact.website.replace(/^https?:\/\//, '')}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* Notas (se existir) */}
                                                            {contact.notes && (
                                                                <div className="mt-2 p-2 bg-neutral-800/50 rounded text-xs text-neutral-400">
                                                                    <div className="flex items-start gap-1.5">
                                                                        <FileText className="h-3 w-3 mt-0.5 text-neutral-500 flex-shrink-0" />
                                                                        <p className="truncate">
                                                                            {contact.notes.length > 80
                                                                                ? contact.notes.substring(0, 80) + '...'
                                                                                : contact.notes}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>

                                {/* Navigation */}
                                <div className="flex justify-end flex-shrink-0">
                                    <button
                                        onClick={() => setStep(2)}
                                        disabled={!selectedContact}
                                        className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Próximo
                                        <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="p-6 flex-1 flex flex-col min-h-0">
                                <h2 className="text-xl font-semibold text-white mb-4 flex-shrink-0">Escolher Template</h2>

                                {/* Search */}
                                <div className="mb-4 flex-shrink-0">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                                        <input
                                            type="text"
                                            placeholder="Buscar templates..."
                                            className="w-full pl-10 pr-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500"
                                            value={templateSearch}
                                            onChange={(e) => setTemplateSearch(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* Templates List */}
                                <div className="space-y-3 flex-1 overflow-y-auto min-h-0 mb-6">
                                    {filteredTemplates.map((template) => (
                                        <div
                                            key={template.id}
                                            className={`p-4 border rounded-lg cursor-pointer transition-all ${selectedTemplate?.id === template.id
                                                ? 'border-blue-500 bg-blue-900/20'
                                                : 'border-neutral-700 hover:border-neutral-600'
                                                }`}
                                            onClick={() => setSelectedTemplate(template)}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h3 className="font-semibold text-white">{template.name}</h3>
                                                    <p className="text-neutral-400 text-sm">{template.subject}</p>
                                                    {template.description && (
                                                        <p className="text-neutral-500 text-xs">{template.description}</p>
                                                    )}
                                                </div>
                                                {selectedTemplate?.id === template.id && (
                                                    <Check className="w-5 h-5 text-blue-400" />
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Navigation */}
                                <div className="flex justify-between flex-shrink-0">
                                    <button
                                        onClick={() => setStep(1)}
                                        className="flex items-center gap-2 px-6 py-2 bg-neutral-700 text-white rounded-lg hover:bg-neutral-600 transition-colors"
                                    >
                                        <ArrowLeft className="w-4 h-4" />
                                        Anterior
                                    </button>
                                    <button
                                        onClick={() => setStep(3)}
                                        disabled={!selectedTemplate}
                                        className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Próximo
                                        <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="p-6 flex-1 flex flex-col min-h-0">
                                <h2 className="text-xl font-semibold text-white mb-4 flex-shrink-0">
                                    Escolher Script (Opcional)
                                </h2>

                                {/* Layout de duas colunas */}
                                <div className="flex-1 flex gap-6 min-h-0">
                                    {/* Coluna esquerda - Lista de scripts */}
                                    <div className="w-1/2 flex flex-col min-h-0">
                                        {/* Search */}
                                        <div className="mb-4 flex-shrink-0">
                                            <div className="flex items-center justify-between mb-3">
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
                                                    className="w-full pl-10 pr-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500"
                                                    value={scriptSearch}
                                                    onChange={(e) => setScriptSearch(e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        {/* Opção "Sem Script" */}
                                        <div className="mb-3 flex-shrink-0">
                                            <div
                                                className={`p-4 border rounded-lg cursor-pointer transition-all ${!selectedScript
                                                    ? 'border-blue-500 bg-blue-900/20'
                                                    : 'border-neutral-700 hover:border-neutral-600'
                                                    }`}
                                                onClick={() => setSelectedScript(null)}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <h3 className="font-semibold text-white">
                                                            Sem Script Específico
                                                        </h3>
                                                        <p className="text-neutral-400 text-sm">
                                                            Usar apenas o template selecionado
                                                        </p>
                                                    </div>
                                                    {!selectedScript && (
                                                        <Check className="w-5 h-5 text-blue-400" />
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Scripts List */}
                                        <div className="space-y-3 flex-1 overflow-y-auto min-h-0">
                                            {filteredScripts.length === 0 ? (
                                                <div className="h-full flex items-center justify-center">
                                                    <div className="text-center">
                                                        <div className="w-16 h-16 mx-auto mb-4 bg-neutral-800 rounded-full flex items-center justify-center">
                                                            <FileText className="w-8 h-8 text-neutral-500" />
                                                        </div>
                                                        <h3 className="text-white font-medium mb-2">
                                                            {scriptSearch ? 'Nenhum script encontrado' : 'Nenhum script disponível'}
                                                        </h3>
                                                        <p className="text-neutral-400 text-sm">
                                                            {scriptSearch
                                                                ? 'Tente buscar com termos diferentes.'
                                                                : 'Você pode continuar sem script ou criar um primeiro.'}
                                                        </p>
                                                        {scriptSearch && (
                                                            <button
                                                                onClick={() => setScriptSearch('')}
                                                                className="mt-3 text-blue-400 hover:text-blue-300 text-sm"
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
                                                        className={`p-4 border rounded-lg cursor-pointer transition-all ${selectedScript?.id === script.id
                                                            ? 'border-blue-500 bg-blue-900/20'
                                                            : 'border-neutral-700 hover:border-neutral-600'
                                                            }`}
                                                        onClick={() => setSelectedScript(script)}
                                                    >
                                                        <div className="flex items-start justify-between">
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <h3 className="font-semibold text-white text-sm truncate">
                                                                        {script.subject}
                                                                    </h3>
                                                                    <span className="px-2 py-0.5 bg-neutral-800 text-neutral-300 rounded text-xs border border-neutral-600 flex-shrink-0">
                                                                        {script.emailType === 'cold_outreach' && 'Primeiro Contato'}
                                                                        {script.emailType === 'follow_up' && 'Follow-up'}
                                                                        {script.emailType === 'introduction' && 'Apresentação'}
                                                                        {script.emailType === 'meeting_request' && 'Agendamento'}
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center gap-3 text-xs text-neutral-400 mb-2">
                                                                    {script.prospectData?.contactName && (
                                                                        <span>{script.prospectData.contactName}</span>
                                                                    )}
                                                                    {script.prospectData?.companyName && (
                                                                        <span>• {script.prospectData.companyName}</span>
                                                                    )}
                                                                    {script.tone && (
                                                                        <span>• {script.tone}</span>
                                                                    )}
                                                                </div>
                                                                <p className="text-neutral-400 text-xs leading-relaxed">
                                                                    {script.body.length > 100
                                                                        ? script.body.substring(0, 100) + '...'
                                                                        : script.body}
                                                                </p>
                                                            </div>
                                                            {selectedScript?.id === script.id && (
                                                                <Check className="w-5 h-5 text-blue-400 flex-shrink-0 ml-3" />
                                                            )}
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>

                                    {/* Coluna direita - Preview */}
                                    <div className="w-1/2 flex flex-col min-h-0">
                                        <div className="mb-4 flex-shrink-0">
                                            <h3 className="text-sm font-medium text-neutral-300 mb-3">
                                                Preview do Email
                                            </h3>
                                        </div>

                                        <div className="flex-1 min-h-0">
                                            {selectedContact && selectedTemplate ? (
                                                <EmailPreview
                                                    content={replaceVariables(selectedTemplate.htmlContent, selectedContact, selectedScript)}
                                                    subject={selectedScript
                                                        ? selectedScript.subject
                                                        : replaceVariables(selectedTemplate.subject, selectedContact, selectedScript)}
                                                    className="h-full"
                                                />
                                            ) : (
                                                <div className="bg-gray-50 border border-gray-200 p-8 text-center text-gray-500 h-full flex items-center justify-center">
                                                    <div>
                                                        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 flex items-center justify-center">
                                                            <Eye className="w-8 h-8 text-gray-400" />
                                                        </div>
                                                        <p className="font-medium text-gray-700 mb-2">Preview não disponível</p>
                                                        <p className="text-sm text-gray-500">
                                                            Contato e template são necessários para gerar o preview
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Navigation */}
                                <div className="flex justify-between flex-shrink-0 mt-6">
                                    <button
                                        onClick={() => setStep(2)}
                                        className="flex items-center gap-2 px-6 py-2 bg-neutral-700 text-white rounded-lg hover:bg-neutral-600 transition-colors"
                                    >
                                        <ArrowLeft className="w-4 h-4" />
                                        Anterior
                                    </button>
                                    <button
                                        onClick={() => setStep(4)}
                                        className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        Revisar Email
                                        <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {step === 4 && (
                            <div className="p-6 flex-1 flex flex-col min-h-0">
                                <h2 className="text-xl font-semibold text-white mb-6 flex-shrink-0">
                                    Revisar e Enviar
                                </h2>

                                <div className="flex gap-6 flex-1 min-h-0">
                                    {/* Coluna esquerda - Informações e configurações */}
                                    <div className="w-1/3 flex flex-col gap-4">
                                        {/* Resumo da seleção */}
                                        <div className="bg-neutral-800 rounded-lg p-4 border border-neutral-700">
                                            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                                                <User className="w-4 h-4" />
                                                Resumo da Seleção
                                            </h3>
                                            <div className="space-y-3 text-sm">
                                                <div className="flex items-start gap-3">
                                                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0"></div>
                                                    <div>
                                                        <p className="text-neutral-400">Contato:</p>
                                                        <p className="text-white font-medium">{selectedContact?.name}</p>
                                                        <p className="text-neutral-400 text-xs">{selectedContact?.email}</p>
                                                        <p className="text-neutral-400 text-xs">{selectedContact?.companyName}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-start gap-3">
                                                    <div className="w-2 h-2 rounded-full bg-green-500 mt-2 flex-shrink-0"></div>
                                                    <div>
                                                        <p className="text-neutral-400">Template:</p>
                                                        <p className="text-white font-medium">{selectedTemplate?.name}</p>
                                                        <p className="text-neutral-400 text-xs">{selectedTemplate?.description || 'Sem descrição'}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-start gap-3">
                                                    <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${selectedScript ? 'bg-purple-500' : 'bg-neutral-500'}`}></div>
                                                    <div>
                                                        <p className="text-neutral-400">Script:</p>
                                                        <p className="text-white font-medium">
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
                                        <div className="bg-neutral-800 rounded-lg p-4 border border-neutral-700">
                                            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                                                <Mail className="w-4 h-4" />
                                                Detalhes do Envio
                                            </h3>
                                            <div className="space-y-3 text-sm">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-neutral-400">De:</span>
                                                    <span className="text-white text-right">
                                                        {smtpConfig?.fromName || 'N/A'}<br />
                                                        <span className="text-xs text-neutral-400">{smtpConfig?.fromEmail || 'N/A'}</span>
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-neutral-400">Para:</span>
                                                    <span className="text-white text-right">
                                                        {selectedContact?.name}<br />
                                                        <span className="text-xs text-neutral-400">{selectedContact?.email}</span>
                                                    </span>
                                                </div>
                                                <div className="border-t border-neutral-700 pt-3">
                                                    <span className="text-neutral-400 text-xs">Assunto:</span>
                                                    <p className="text-white font-medium mt-1 leading-tight">
                                                        {selectedScript ? selectedScript.subject : selectedTemplate?.subject}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Status SMTP */}
                                        <div className="bg-neutral-800 rounded-lg p-4 border border-neutral-700">
                                            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                                                <Send className="w-4 h-4" />
                                                Configuração SMTP
                                            </h3>
                                            {smtpConfig?.host ? (
                                                <div className="space-y-2">
                                                    <div className="flex items-center text-green-300 text-sm">
                                                        <Check className="w-4 h-4 mr-2" />
                                                        Configurado e pronto
                                                    </div>
                                                    <div className="text-xs text-neutral-400 bg-neutral-700/50 rounded px-3 py-2">
                                                        <p><strong>Servidor:</strong> {smtpConfig.host}:{smtpConfig.port}</p>
                                                        <p><strong>Seguro:</strong> {smtpConfig.secure ? 'SSL/TLS' : 'Não'}</p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="space-y-2">
                                                    <div className="flex items-center text-red-300 text-sm">
                                                        <AlertCircle className="w-4 h-4 mr-2" />
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
                                        <div className="mb-4 flex items-center justify-between">
                                            <h3 className="font-semibold text-white flex items-center gap-2">
                                                <Eye className="w-4 h-4" />
                                                Preview Final do Email
                                            </h3>
                                            <div className="text-xs text-neutral-400 bg-neutral-800 px-3 py-1 rounded">
                                                Como o destinatário verá
                                            </div>
                                        </div>

                                        <div className="flex-1 min-h-0">
                                            {selectedContact && selectedTemplate ? (
                                                <EmailPreview
                                                    content={replaceVariables(selectedTemplate.htmlContent, selectedContact, selectedScript)}
                                                    subject={selectedScript
                                                        ? selectedScript.subject
                                                        : replaceVariables(selectedTemplate.subject, selectedContact, selectedScript)}
                                                    className="h-full"
                                                />
                                            ) : (
                                                <div className="bg-gray-50 border border-gray-200 p-8 text-center text-gray-500 h-full flex items-center justify-center">
                                                    <div>
                                                        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 flex items-center justify-center">
                                                            <AlertCircle className="w-8 h-8 text-gray-400" />
                                                        </div>
                                                        <p className="font-medium text-gray-700 mb-2">Erro no preview</p>
                                                        <p className="text-sm text-gray-500">
                                                            Dados insuficientes para gerar o preview
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Navigation com botões reorganizados */}
                                <div className="flex justify-between items-center flex-shrink-0 mt-6 pt-6 border-t border-neutral-700">
                                    <button
                                        onClick={() => setStep(3)}
                                        className="flex items-center gap-2 px-6 py-2 bg-neutral-700 text-white rounded-lg hover:bg-neutral-600 transition-colors"
                                    >
                                        <ArrowLeft className="w-4 h-4" />
                                        Voltar aos Scripts
                                    </button>

                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2 text-sm text-neutral-400">
                                            <Check className="w-4 h-4 text-green-400" />
                                            Email pronto para envio
                                        </div>

                                        <button
                                            onClick={sendEmail}
                                            disabled={sending || !smtpConfig?.host}
                                            className="flex items-center gap-2 px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg"
                                        >
                                            {sending ? (
                                                <>
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                    Enviando...
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
                        )}
                    </div>
                </div>
            </div>
        </MainLayout>
    );
} 