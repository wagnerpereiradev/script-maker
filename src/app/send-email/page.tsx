'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import MainLayout from '@/components/MainLayout';
import { Search, User, FileText, Mail, Eye, Send, ArrowLeft, ArrowRight, Check, X, Loader2, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';

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
}

// Componente isolado para preview que usa iframe
const IsolatedPreview = ({
    content,
    className = ""
}: {
    content: string;
    className?: string;
}) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);

    useEffect(() => {
        if (iframeRef.current && content) {
            const iframe = iframeRef.current;
            const doc = iframe.contentDocument || iframe.contentWindow?.document;

            if (doc) {
                // HTML completo com estilos base para um preview limpo
                const htmlContent = `
                    <!DOCTYPE html>
                    <html lang="pt-BR">
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>Preview</title>
                        <style>
                            /* Reset básico para o preview */
                            * {
                                box-sizing: border-box;
                            }
                            
                            body {
                                margin: 0;
                                padding: 20px;
                                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
                                line-height: 1.6;
                                color: #333;
                                background-color: #fff;
                                word-wrap: break-word;
                            }
                            
                            /* Estilos base para elementos comuns de email */
                            img {
                                max-width: 100%;
                                height: auto;
                            }
                            
                            table {
                                border-collapse: collapse;
                                width: 100%;
                            }
                            
                            td, th {
                                text-align: left;
                                padding: 8px;
                            }
                            
                            a {
                                color: #0066cc;
                                text-decoration: underline;
                            }
                            
                            a:hover {
                                text-decoration: none;
                            }
                            
                            h1, h2, h3, h4, h5, h6 {
                                margin-top: 0;
                                margin-bottom: 16px;
                                line-height: 1.25;
                            }
                            
                            p {
                                margin-top: 0;
                                margin-bottom: 16px;
                            }
                            
                            ul, ol {
                                margin-top: 0;
                                margin-bottom: 16px;
                                padding-left: 30px;
                            }
                            
                            li {
                                margin-bottom: 4px;
                            }
                            
                            /* Container para centralizar emails de largura fixa */
                            .email-container {
                                max-width: 600px;
                                margin: 0 auto;
                            }
                        </style>
                    </head>
                    <body>
                        <div class="email-container">
                            ${content}
                        </div>
                    </body>
                    </html>
                `;

                doc.open();
                doc.write(htmlContent);
                doc.close();
            }
        }
    }, [content]);

    if (!content) {
        return (
            <div className="bg-white rounded-lg p-8 text-center text-gray-500 min-h-[300px] flex items-center justify-center">
                <div>
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-lg flex items-center justify-center">
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
        <div className={`bg-white rounded-lg overflow-hidden shadow-inner border border-gray-200 ${className}`}>
            <iframe
                ref={iframeRef}
                className="w-full h-full min-h-[400px] border-none"
                sandbox="allow-same-origin"
                title="Preview do Email"
                style={{
                    backgroundColor: 'white',
                    borderRadius: '0.5rem'
                }}
            />
        </div>
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
    const [selectedSubjectType, setSelectedSubjectType] = useState<'script' | 'template'>('template');
    const [previewSubject, setPreviewSubject] = useState('');

    // UI states
    const [sending, setSending] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [expandedScripts, setExpandedScripts] = useState<Set<string>>(new Set());

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

    // Limpar scripts expandidos quando mudar de step
    useEffect(() => {
        setExpandedScripts(new Set());
    }, [step]);

    // Replace template variables with actual data
    const replaceVariables = useCallback((content: string, contact: Contact, script: Script): string => {
        // Verificar se content é válido
        if (!content || typeof content !== 'string') {
            return '';
        }

        let result = content;

        // Verificar se contact existe antes de usar suas propriedades
        if (contact) {
            // Dados do contato
            result = result.replace(/{{contactName}}/g, contact.name || '');
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
        }

        // Dados do remetente (SMTP config)
        result = result.replace(/{{senderName}}/g, smtpConfig?.fromName || '');
        result = result.replace(/{{senderEmail}}/g, smtpConfig?.fromEmail || '');
        result = result.replace(/{{senderCompany}}/g, '');
        result = result.replace(/{{senderPhone}}/g, '');
        result = result.replace(/{{senderLinkedIn}}/g, '');

        // Dados dinâmicos
        result = result.replace(/{{currentDate}}/g, new Date().toLocaleDateString('pt-BR'));
        result = result.replace(/{{currentTime}}/g, new Date().toLocaleTimeString('pt-BR'));
        result = result.replace(/{{dayOfWeek}}/g, new Date().toLocaleDateString('pt-BR', { weekday: 'long' }));

        return result;
    }, [smtpConfig]);

    // Update preview when selection changes
    useEffect(() => {
        if (selectedContact && selectedScript && selectedTemplate && smtpConfig) {
            try {
                const processedHtml = replaceVariables(selectedTemplate.htmlContent, selectedContact, selectedScript);
                setFinalHtmlContent(processedHtml);
            } catch (error) {
                console.error('Erro ao processar template:', error);
                setFinalHtmlContent('Erro ao processar template');
            }
        } else {
            setFinalHtmlContent('');
        }
    }, [selectedContact, selectedScript, selectedTemplate, smtpConfig, replaceVariables]);

    // Update preview subject when selection changes
    useEffect(() => {
        if (selectedContact && selectedScript && selectedTemplate) {
            try {
                if (selectedSubjectType === 'script') {
                    setPreviewSubject(selectedScript.subject);
                } else {
                    // Template subject with variables replaced
                    const processedSubject = replaceVariables(selectedTemplate.subject, selectedContact, selectedScript);
                    setPreviewSubject(processedSubject);
                }
            } catch (error) {
                console.error('Erro ao gerar preview do assunto:', error);
                setPreviewSubject('Erro ao processar assunto');
            }
        } else {
            setPreviewSubject('');
        }
    }, [selectedContact, selectedScript, selectedTemplate, selectedSubjectType, smtpConfig, replaceVariables]);

    // Generate final email when all selections are made
    useEffect(() => {
        if (selectedContact && selectedScript && selectedTemplate &&
            selectedTemplate.subject && selectedTemplate.htmlContent) {
            try {
                // Processar assunto baseado na escolha do usuário
                const processedSubject = selectedSubjectType === 'script' ?
                    selectedScript.subject : // Script subject é fixo
                    replaceVariables(selectedTemplate.subject, selectedContact, selectedScript); // Template subject pode ter variáveis

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
    }, [selectedContact, selectedScript, selectedTemplate, smtpConfig, selectedSubjectType, replaceVariables]);

    // Send email function
    const sendEmail = async () => {
        if (!selectedContact || !selectedScript || !selectedTemplate || !smtpConfig) {
            setMessage({ type: 'error', text: 'Dados incompletos para envio' });
            return;
        }

        setSending(true);
        try {
            const response = await fetch('/api/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contactId: selectedContact.id,
                    scriptId: selectedScript.id,
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
            <div className="p-8">
                <div className="max-w-6xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-white mb-2">
                            Enviar Email
                        </h1>
                        <p className="text-neutral-400">
                            Selecione contato, script e template para compor e enviar seu email
                        </p>
                    </div>

                    {/* Message */}
                    {message && (
                        <div className={`mb-6 p-4 rounded-lg ${message.type === 'success'
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
                    <div className="mb-8">
                        <div className="flex items-center justify-between">
                            {[
                                { step: 1, title: 'Selecionar Contato', icon: User },
                                { step: 2, title: 'Escolher Script', icon: FileText },
                                { step: 3, title: 'Escolher Template', icon: Mail },
                                { step: 4, title: 'Escolher Assunto', icon: Mail },
                                { step: 5, title: 'Revisar e Enviar', icon: Send }
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
                                        {index < 4 && (
                                            <div className={`w-16 h-0.5 mx-4 ${step > item.step ? 'bg-green-600' : 'bg-neutral-600'
                                                }`} />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Step Content */}
                    <div className="bg-neutral-gradient rounded-lg border border-neutral-800">
                        {step === 1 && (
                            <div className="p-6">
                                <h2 className="text-xl font-semibold text-white mb-4">Selecionar Contato</h2>

                                {/* Search */}
                                <div className="mb-4">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                                        <input
                                            type="text"
                                            placeholder="Buscar contatos..."
                                            className="w-full pl-10 pr-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500"
                                            value={contactSearch}
                                            onChange={(e) => setContactSearch(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* Contacts List */}
                                <div className="space-y-3 max-h-96 overflow-y-auto">
                                    {filteredContacts.map((contact) => {
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
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        {/* Avatar */}
                                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-medium text-sm ${avatar.bgColor} ${avatar.textColor}`}>
                                                            {avatar.letter}
                                                        </div>
                                                        {/* Contact Info */}
                                                        <div>
                                                            <h3 className="font-semibold text-white">{contact.name}</h3>
                                                            <p className="text-neutral-400 text-sm">{contact.companyName}</p>
                                                            <p className="text-neutral-500 text-xs">{contact.email}</p>
                                                        </div>
                                                    </div>
                                                    {selectedContact?.id === contact.id && (
                                                        <Check className="w-5 h-5 text-blue-400" />
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Navigation */}
                                <div className="flex justify-end mt-6">
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
                            <div className="p-6">
                                <h2 className="text-xl font-semibold text-white mb-4">Escolher Script</h2>

                                {/* Search */}
                                <div className="mb-4">
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

                                {/* Scripts List */}
                                <div className="space-y-3 max-h-96 overflow-y-auto">
                                    {filteredScripts.map((script) => {
                                        const isExpanded = expandedScripts.has(script.id);
                                        const shouldTruncate = script.body && script.body.length > 150;
                                        const displayBody = shouldTruncate && !isExpanded
                                            ? script.body.slice(0, 150) + '...'
                                            : script.body;

                                        const toggleExpanded = (e: React.MouseEvent) => {
                                            e.stopPropagation(); // Impede seleção do script ao clicar em "ver mais"
                                            const newExpanded = new Set(expandedScripts);
                                            if (isExpanded) {
                                                newExpanded.delete(script.id);
                                            } else {
                                                newExpanded.add(script.id);
                                            }
                                            setExpandedScripts(newExpanded);
                                        };

                                        return (
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
                                                        {/* Header */}
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <h3 className="font-semibold text-white">{script.subject}</h3>
                                                            {selectedScript?.id === script.id && (
                                                                <Check className="w-5 h-5 text-blue-400 flex-shrink-0" />
                                                            )}
                                                        </div>

                                                        {/* Meta info */}
                                                        <p className="text-neutral-400 text-sm mb-2">
                                                            {script.prospectData?.contactName || 'N/A'} - {script.prospectData?.companyName || 'N/A'}
                                                        </p>
                                                        <p className="text-neutral-500 text-xs mb-3 capitalize">
                                                            {script.tone} • {script.emailType.replace('_', ' ')}
                                                        </p>

                                                        {/* Body */}
                                                        {script.body && (
                                                            <div className="bg-neutral-800/50 rounded-lg p-3 mb-2">
                                                                <p className="text-neutral-300 text-sm whitespace-pre-wrap">
                                                                    {displayBody}
                                                                </p>
                                                                {shouldTruncate && (
                                                                    <button
                                                                        onClick={toggleExpanded}
                                                                        className="mt-2 text-blue-400 hover:text-blue-300 text-xs flex items-center gap-1 transition-colors"
                                                                    >
                                                                        {isExpanded ? (
                                                                            <>
                                                                                <ChevronUp className="w-3 h-3" />
                                                                                Ver menos
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                <ChevronDown className="w-3 h-3" />
                                                                                Ver mais
                                                                            </>
                                                                        )}
                                                                    </button>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Navigation */}
                                <div className="flex justify-between mt-6">
                                    <button
                                        onClick={() => setStep(1)}
                                        className="flex items-center gap-2 px-6 py-2 bg-neutral-700 text-white rounded-lg hover:bg-neutral-600 transition-colors"
                                    >
                                        <ArrowLeft className="w-4 h-4" />
                                        Anterior
                                    </button>
                                    <button
                                        onClick={() => setStep(3)}
                                        disabled={!selectedScript}
                                        className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Próximo
                                        <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="p-6">
                                <h2 className="text-xl font-semibold text-white mb-4">Escolher Template</h2>

                                {/* Search */}
                                <div className="mb-4">
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
                                <div className="space-y-3 max-h-96 overflow-y-auto">
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
                                <div className="flex justify-between mt-6">
                                    <button
                                        onClick={() => setStep(2)}
                                        className="flex items-center gap-2 px-6 py-2 bg-neutral-700 text-white rounded-lg hover:bg-neutral-600 transition-colors"
                                    >
                                        <ArrowLeft className="w-4 h-4" />
                                        Anterior
                                    </button>
                                    <button
                                        onClick={() => setStep(4)}
                                        disabled={!selectedTemplate}
                                        className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Próximo
                                        <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {step === 4 && (
                            <div className="p-6">
                                <h2 className="text-xl font-semibold text-white mb-4">Escolher Assunto</h2>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Opções de Assunto */}
                                    <div className="space-y-4">
                                        <h3 className="font-semibold text-white mb-3">Qual assunto usar?</h3>

                                        {/* Opção Template */}
                                        <div
                                            className={`p-4 border rounded-lg cursor-pointer transition-all ${selectedSubjectType === 'template'
                                                ? 'border-blue-500 bg-blue-900/20'
                                                : 'border-neutral-700 hover:border-neutral-600'
                                                }`}
                                            onClick={() => setSelectedSubjectType('template')}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h4 className="font-semibold text-white">Assunto do Template</h4>
                                                    <p className="text-neutral-400 text-sm">
                                                        {selectedTemplate?.subject || 'Nenhum template selecionado'}
                                                    </p>
                                                    <p className="text-neutral-500 text-xs">
                                                        Pode conter variáveis dinâmicas
                                                    </p>
                                                </div>
                                                {selectedSubjectType === 'template' && (
                                                    <Check className="w-5 h-5 text-blue-400" />
                                                )}
                                            </div>
                                        </div>

                                        {/* Opção Script */}
                                        <div
                                            className={`p-4 border rounded-lg cursor-pointer transition-all ${selectedSubjectType === 'script'
                                                ? 'border-blue-500 bg-blue-900/20'
                                                : 'border-neutral-700 hover:border-neutral-600'
                                                }`}
                                            onClick={() => setSelectedSubjectType('script')}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h4 className="font-semibold text-white">Assunto do Script</h4>
                                                    <p className="text-neutral-400 text-sm">
                                                        {selectedScript?.subject || 'Nenhum script selecionado'}
                                                    </p>
                                                    <p className="text-neutral-500 text-xs">
                                                        Assunto fixo do script
                                                    </p>
                                                </div>
                                                {selectedSubjectType === 'script' && (
                                                    <Check className="w-5 h-5 text-blue-400" />
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Preview do Assunto */}
                                    <div className="bg-neutral-800 rounded-lg p-4">
                                        <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                                            <Eye className="w-4 h-4" />
                                            Preview do Assunto
                                        </h3>
                                        <div className="bg-white rounded-lg p-4 border-l-4 border-blue-500">
                                            <div className="text-gray-600 text-xs uppercase tracking-wide mb-1">
                                                Linha de Assunto
                                            </div>
                                            <p className="text-gray-800 font-medium text-lg leading-tight">
                                                {previewSubject || 'Selecione uma opção para ver o preview'}
                                            </p>
                                        </div>
                                        {previewSubject && (
                                            <div className="mt-3 text-xs text-neutral-400 bg-neutral-700/50 rounded px-3 py-2">
                                                <span className="font-medium">💡 Dica:</span> Este será o assunto que aparecerá na caixa de entrada do destinatário
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Navigation */}
                                <div className="flex justify-between mt-6">
                                    <button
                                        onClick={() => setStep(3)}
                                        className="flex items-center gap-2 px-6 py-2 bg-neutral-700 text-white rounded-lg hover:bg-neutral-600 transition-colors"
                                    >
                                        <ArrowLeft className="w-4 h-4" />
                                        Anterior
                                    </button>
                                    <button
                                        onClick={() => setStep(5)}
                                        disabled={!selectedSubjectType}
                                        className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Próximo
                                        <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {step === 5 && (
                            <div className="p-6">
                                <h2 className="text-xl font-semibold text-white mb-6">Revisar e Enviar</h2>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Email Details */}
                                    <div className="space-y-4">
                                        <div className="bg-neutral-800 rounded-lg p-4">
                                            <h3 className="font-semibold text-white mb-3">Detalhes do Envio</h3>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-neutral-400">Para:</span>
                                                    <span className="text-white">{selectedContact?.name} ({selectedContact?.email})</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-neutral-400">De:</span>
                                                    <span className="text-white">{smtpConfig?.fromName} ({smtpConfig?.fromEmail})</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-neutral-400">Assunto:</span>
                                                    <span className="text-white">{finalSubject}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* SMTP Status */}
                                        <div className="bg-neutral-800 rounded-lg p-4">
                                            <h3 className="font-semibold text-white mb-3">Configuração SMTP</h3>
                                            {smtpConfig?.host ? (
                                                <div className="flex items-center text-green-300">
                                                    <Check className="w-4 h-4 mr-2" />
                                                    Configurado ({smtpConfig.host}:{smtpConfig.port})
                                                </div>
                                            ) : (
                                                <div className="flex items-center text-red-300">
                                                    <AlertCircle className="w-4 h-4 mr-2" />
                                                    SMTP não configurado
                                                </div>
                                            )}
                                        </div>

                                        {/* Send Button */}
                                        <button
                                            onClick={sendEmail}
                                            disabled={sending || !smtpConfig?.host}
                                            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                                        >
                                            {sending ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    Enviando...
                                                </>
                                            ) : (
                                                <>
                                                    <Send className="w-4 h-4" />
                                                    Enviar Email
                                                </>
                                            )}
                                        </button>
                                    </div>

                                    {/* Email Preview */}
                                    <div className="bg-neutral-800 rounded-lg p-4">
                                        <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                                            <Eye className="w-4 h-4" />
                                            Preview do Email
                                        </h3>
                                        <IsolatedPreview
                                            content={finalHtmlContent}
                                            className="max-h-96 overflow-y-auto"
                                        />
                                        {!finalHtmlContent && (
                                            <div className="bg-white rounded-lg p-4 text-center text-gray-500 min-h-[200px] flex items-center justify-center">
                                                <div className="text-xs mt-2 text-left">
                                                    <p><strong>Debug Info:</strong></p>
                                                    <p>Contato: {selectedContact ? '✓' : '✗'}</p>
                                                    <p>Script: {selectedScript ? '✓' : '✗'}</p>
                                                    <p>Template: {selectedTemplate ? '✓' : '✗'}</p>
                                                    <p>Template HTML: {selectedTemplate?.htmlContent ? `${selectedTemplate.htmlContent.length} chars` : 'vazio'}</p>
                                                    <p>Final HTML: {finalHtmlContent ? `${finalHtmlContent.length} chars` : 'vazio'}</p>
                                                    <p>SMTP: {smtpConfig ? '✓' : '✗'}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Navigation */}
                                <div className="flex justify-between mt-6">
                                    <button
                                        onClick={() => setStep(4)}
                                        className="flex items-center gap-2 px-6 py-2 bg-neutral-700 text-white rounded-lg hover:bg-neutral-600 transition-colors"
                                    >
                                        <ArrowLeft className="w-4 h-4" />
                                        Anterior
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </MainLayout>
    );
} 