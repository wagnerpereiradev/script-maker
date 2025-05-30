'use client';

import { useCallback, useRef, useEffect, useState } from 'react';
import { Eye, Users, Maximize2, Monitor, X } from 'lucide-react';

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

interface EmailTemplatePreviewProps {
    sendType: 'individual' | 'list';
    selectedTemplate: Template | null;
    selectedScript: Script | null;
    contactForPreview: Contact | null;
    smtpConfig: SMTPConfig | null;
    className?: string;
    title?: string;
    showRawVariables?: boolean;
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
                        <h3 className="text-lg font-semibold text-gray-900">Preview</h3>
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

// Componente de preview de email
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
                    title="Preview"
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

export default function EmailTemplatePreview({
    sendType,
    selectedTemplate,
    selectedScript,
    contactForPreview,
    smtpConfig,
    className = "",
    title = "Preview",
    showRawVariables
}: EmailTemplatePreviewProps) {
    // Replace template variables with actual data (para envio individual)
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

    // Função para processar conteúdo do preview (preserva variáveis quando envio em massa)
    const processPreviewContent = useCallback((content: string, contact: Contact, script?: Script | null): string => {
        // Se showRawVariables for true, retorna o conteúdo original sem substituições
        if (showRawVariables) {
            return content;
        }

        // Para envio em massa (lista), não substitui as variáveis dos contatos para mostrar que será personalizado
        if (sendType === 'list') {
            // Substitui apenas as variáveis do remetente e dados estáticos
            let result = content;

            // Verificar se script existe antes de usar suas propriedades
            if (script) {
                // Dados do script - preserva quebras de linha convertendo para HTML
                const scriptBodyFormatted = script.body ? script.body.replace(/\n/g, '<br>') : '';
                result = result.replace(/{{scriptBody}}/g, scriptBodyFormatted);
                result = result.replace(/{{primaryCTA}}/g, script.callToAction || '');
                result = result.replace(/{{secondaryCTA}}/g, '');
                result = result.replace(/{{ctaLink}}/g, '');
            } else {
                result = result.replace(/{{scriptBody}}/g, '');
                result = result.replace(/{{primaryCTA}}/g, '');
                result = result.replace(/{{secondaryCTA}}/g, '');
                result = result.replace(/{{ctaLink}}/g, '');
            }

            // Dados do remetente (SMTP config) - sempre substituir
            result = result.replace(/{{senderName}}/g, smtpConfig?.fromName || '');
            result = result.replace(/{{senderEmail}}/g, smtpConfig?.fromEmail || '');
            result = result.replace(/{{senderCompany}}/g, '');
            result = result.replace(/{{senderPhone}}/g, '');
            result = result.replace(/{{senderLinkedIn}}/g, '');

            // Dados pessoais do remetente - sempre substituir
            result = result.replace(/{{yourName}}/g, smtpConfig?.yourName || '');
            result = result.replace(/{{yourCompany}}/g, smtpConfig?.yourCompany || '');
            result = result.replace(/{{yourPhone}}/g, smtpConfig?.yourPhone || '');
            result = result.replace(/{{yourIndustry}}/g, smtpConfig?.yourIndustry || '');
            result = result.replace(/{{yourPosition}}/g, smtpConfig?.yourPosition || '');
            result = result.replace(/{{yourWebsite}}/g, smtpConfig?.yourWebsite || '');
            result = result.replace(/{{yourLocation}}/g, smtpConfig?.yourLocation || '');

            // Dados dinâmicos - sempre substituir
            result = result.replace(/{{currentDate}}/g, new Date().toLocaleDateString('pt-BR'));
            result = result.replace(/{{currentTime}}/g, new Date().toLocaleTimeString('pt-BR'));
            result = result.replace(/{{dayOfWeek}}/g, new Date().toLocaleDateString('pt-BR', { weekday: 'long' }));

            // NÃO substitui as variáveis dos contatos para mostrar que será personalizado:
            // {{contactName}}, {{contactFirstName}}, {{contactEmail}}, {{contactPhone}}, 
            // {{contactPosition}}, {{companyName}}, {{companyWebsite}}, {{companySize}}, 
            // {{companyIndustry}}, {{companyLocation}}, {{painPoints}}

            return result;
        } else {
            // Para envio individual, substitui normalmente
            return replaceVariables(content, contact, script);
        }
    }, [sendType, smtpConfig, replaceVariables, showRawVariables]);

    return (
        <div className={`flex flex-col h-full ${className}`}>
            {/* Header */}
            <div className="flex-shrink-0">
                <div className="bg-black p-3 border-2 border-black">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Eye className="h-4 w-4 text-white" />
                            <h3 className="text-sm font-medium text-white flex items-center gap-2">
                                {title}
                                {showRawVariables && (
                                    <span className="px-1.5 py-0.5 bg-purple-600 text-white text-xs rounded">
                                        Raw
                                    </span>
                                )}
                                {!showRawVariables && sendType === 'list' && (
                                    <span className="px-1.5 py-0.5 bg-blue-600 text-white text-xs rounded">
                                        Massa
                                    </span>
                                )}
                                {!showRawVariables && sendType === 'individual' && (
                                    <span className="px-1.5 py-0.5 bg-green-600 text-white text-xs rounded">
                                        Individual
                                    </span>
                                )}
                            </h3>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-neutral-400">
                            {selectedTemplate && (
                                <span>{selectedTemplate.name}</span>
                            )}
                            {selectedScript && (
                                <span className="text-green-400">• Script</span>
                            )}
                            {contactForPreview && sendType === 'individual' && (
                                <span className="text-yellow-400">• {contactForPreview.name}</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Preview Content */}
            <div className="flex-1 min-h-0">
                {contactForPreview && selectedTemplate ? (
                    <div className="h-full flex flex-col">
                        {/* Banner informativo para envio em massa */}
                        {!showRawVariables && sendType === 'list' && (
                            <div className="mb-4 p-3 bg-blue-900/20 border border-blue-700 rounded-lg flex-shrink-0">
                                <div className="flex items-center gap-2 text-blue-300 text-sm font-medium mb-1">
                                    <Users className="h-4 w-4" />
                                    Preview para Envio em Massa
                                </div>
                                <p className="text-blue-200 text-xs">
                                    As variáveis como {`{{contactName}}`}, {`{{companyName}}`}, etc. serão personalizadas individualmente para cada contato da lista.
                                </p>
                            </div>
                        )}

                        {/* Email Preview */}
                        <div className="flex-1 min-h-0">
                            <EmailPreview
                                content={processPreviewContent(selectedTemplate.htmlContent, contactForPreview, selectedScript)}
                                subject={selectedScript
                                    ? selectedScript.subject
                                    : processPreviewContent(selectedTemplate.subject, contactForPreview, selectedScript)}
                                className="h-full"
                            />
                        </div>
                    </div>
                ) : (
                    <div className="bg-gray-50 border border-gray-200 p-8 text-center text-gray-500 h-full flex items-center justify-center">
                        <div>
                            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 flex items-center justify-center">
                                <Eye className="w-8 h-8 text-gray-400" />
                            </div>
                            <p className="font-medium text-gray-700 mb-2">Preview não disponível</p>
                            <p className="text-sm text-gray-500">
                                {sendType === 'list'
                                    ? 'Lista selecionada precisa ter contatos para gerar preview'
                                    : 'Contato e template são necessários para gerar o preview'
                                }
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
} 