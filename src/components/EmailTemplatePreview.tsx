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

// Função auxiliar para processar especificamente o assunto do script
const processScriptSubject = (
    scriptSubject: string,
    contact: Contact | null,
    smtpConfig: SMTPConfig | null,
    preserveContactVariables: boolean = false
): string => {
    let processed = scriptSubject;

    if (!processed) return '';

    // Substituições do contato no assunto do script (apenas se não preservar variáveis)
    if (contact && !preserveContactVariables) {
        processed = processed.replace(/\{\{contactName\}\}/g, contact.name || '');
        processed = processed.replace(/\{\{contactFirstName\}\}/g, contact.name?.split(' ')[0] || '');
        processed = processed.replace(/\{\{firstName\}\}/g, contact.name?.split(' ')[0] || '');
        processed = processed.replace(/\{\{companyName\}\}/g, contact.companyName || '');
        processed = processed.replace(/\{\{contactEmail\}\}/g, contact.email || '');
        processed = processed.replace(/\{\{contactPhone\}\}/g, contact.phone || '');
        processed = processed.replace(/\{\{contactPosition\}\}/g, contact.position || '');
        processed = processed.replace(/\{\{position\}\}/g, contact.position || '');
        processed = processed.replace(/\{\{companyWebsite\}\}/g, contact.website || '');
        processed = processed.replace(/\{\{website\}\}/g, contact.website || '');
        processed = processed.replace(/\{\{companyIndustry\}\}/g, contact.niche || '');
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
        processed = processed.replace(/\{\{senderName\}\}/g, smtpConfig.fromName || '');
        processed = processed.replace(/\{\{senderEmail\}\}/g, smtpConfig.fromEmail || '');
        processed = processed.replace(/\{\{senderCompany\}\}/g, smtpConfig.yourCompany || '');
        processed = processed.replace(/\{\{senderPhone\}\}/g, smtpConfig.yourPhone || '');
        processed = processed.replace(/\{\{senderLinkedIn\}\}/g, '');
    }

    // Aplicar dados dinâmicos ao assunto do script
    const now = new Date();
    processed = processed.replace(/\{\{currentDate\}\}/g, now.toLocaleDateString('pt-BR'));
    processed = processed.replace(/\{\{currentTime\}\}/g, now.toLocaleTimeString('pt-BR'));
    processed = processed.replace(/\{\{currentYear\}\}/g, now.getFullYear().toString());
    processed = processed.replace(/\{\{dayOfWeek\}\}/g, now.toLocaleDateString('pt-BR', { weekday: 'long' }));

    return processed;
};

// Função para processar template com substituição de variáveis
const processTemplate = (
    template: string,
    contact: Contact | null,
    script: Script | null,
    smtpConfig: SMTPConfig | null,
    preserveContactVariables: boolean = false
): string => {
    let processed = template;

    if (!processed) return '';

    // Substituições do contato (apenas se não preservar variáveis)
    if (contact && !preserveContactVariables) {
        processed = processed.replace(/\{\{contactName\}\}/g, contact.name || '');
        processed = processed.replace(/\{\{contactFirstName\}\}/g, contact.name?.split(' ')[0] || '');
        processed = processed.replace(/\{\{firstName\}\}/g, contact.name?.split(' ')[0] || '');
        processed = processed.replace(/\{\{companyName\}\}/g, contact.companyName || '');
        processed = processed.replace(/\{\{contactEmail\}\}/g, contact.email || '');
        processed = processed.replace(/\{\{contactPhone\}\}/g, contact.phone || '');
        processed = processed.replace(/\{\{contactPosition\}\}/g, contact.position || '');
        processed = processed.replace(/\{\{position\}\}/g, contact.position || '');
        processed = processed.replace(/\{\{companyWebsite\}\}/g, contact.website || '');
        processed = processed.replace(/\{\{website\}\}/g, contact.website || '');
        processed = processed.replace(/\{\{companyIndustry\}\}/g, contact.niche || '');
        processed = processed.replace(/\{\{niche\}\}/g, contact.niche || '');
        processed = processed.replace(/\{\{painPoints\}\}/g, contact.painPoints || '');
        processed = processed.replace(/\{\{previousInteraction\}\}/g, contact.previousInteraction || '');
        processed = processed.replace(/\{\{notes\}\}/g, contact.notes || '');

        // Variáveis adicionais comuns
        processed = processed.replace(/\{\{companySize\}\}/g, '');
        processed = processed.replace(/\{\{companyLocation\}\}/g, '');
    }

    // Substituições do script
    if (script) {
        // Processar o assunto do script com as variáveis dinâmicas
        let processedScriptSubject = script.subject || '';
        // Usar a função auxiliar para processar o assunto do script
        processedScriptSubject = processScriptSubject(processedScriptSubject, contact, smtpConfig, preserveContactVariables);

        processed = processed.replace(/\{\{scriptSubject\}\}/g, processedScriptSubject);

        // Converter markdown para HTML para scriptBody
        if (script.body) {
            try {
                // Primeiro processar as variáveis dinâmicas no body do script (apenas se não preservar variáveis do contato)
                let processedScriptBody = script.body;
                if (contact && !preserveContactVariables) {
                    processedScriptBody = processedScriptBody.replace(/\{\{contactName\}\}/g, contact.name || '');
                    processedScriptBody = processedScriptBody.replace(/\{\{contactFirstName\}\}/g, contact.name?.split(' ')[0] || '');
                    processedScriptBody = processedScriptBody.replace(/\{\{firstName\}\}/g, contact.name?.split(' ')[0] || '');
                    processedScriptBody = processedScriptBody.replace(/\{\{companyName\}\}/g, contact.companyName || '');
                    processedScriptBody = processedScriptBody.replace(/\{\{contactEmail\}\}/g, contact.email || '');
                    processedScriptBody = processedScriptBody.replace(/\{\{contactPhone\}\}/g, contact.phone || '');
                    processedScriptBody = processedScriptBody.replace(/\{\{contactPosition\}\}/g, contact.position || '');
                    processedScriptBody = processedScriptBody.replace(/\{\{position\}\}/g, contact.position || '');
                    processedScriptBody = processedScriptBody.replace(/\{\{companyWebsite\}\}/g, contact.website || '');
                    processedScriptBody = processedScriptBody.replace(/\{\{website\}\}/g, contact.website || '');
                    processedScriptBody = processedScriptBody.replace(/\{\{companyIndustry\}\}/g, contact.niche || '');
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
                processedScriptBody = processedScriptBody.replace(/\{\{dayOfWeek\}\}/g, now.toLocaleDateString('pt-BR', { weekday: 'long' }));

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
        processed = processed.replace(/\{\{primaryCTA\}\}/g, script.callToAction || '');

        // Dados do prospect do script
        if (script.prospectData) {
            processed = processed.replace(/\{\{scriptContactName\}\}/g, script.prospectData.contactName || '');
            processed = processed.replace(/\{\{scriptCompanyName\}\}/g, script.prospectData.companyName || '');
            processed = processed.replace(/\{\{scriptNiche\}\}/g, script.prospectData.niche || '');
            processed = processed.replace(/\{\{scriptPosition\}\}/g, script.prospectData.position || '');
            processed = processed.replace(/\{\{scriptWebsite\}\}/g, script.prospectData.website || '');
            processed = processed.replace(/\{\{scriptPainPoints\}\}/g, script.prospectData.painPoints || '');
        }

        // Outras variáveis de script
        processed = processed.replace(/\{\{solutions\}\}/g, '');
        processed = processed.replace(/\{\{benefits\}\}/g, '');
        processed = processed.replace(/\{\{competitorAnalysis\}\}/g, '');
        processed = processed.replace(/\{\{roi\}\}/g, '');
    } else {
        // Limpar tags de script se não houver script
        processed = processed.replace(/\{\{scriptSubject\}\}/g, '');
        processed = processed.replace(/\{\{scriptBody\}\}/g, '');
        processed = processed.replace(/\{\{emailType\}\}/g, '');
        processed = processed.replace(/\{\{tone\}\}/g, '');
        processed = processed.replace(/\{\{length\}\}/g, '');
        processed = processed.replace(/\{\{callToAction\}\}/g, '');
        processed = processed.replace(/\{\{primaryCTA\}\}/g, '');
        processed = processed.replace(/\{\{scriptContactName\}\}/g, '');
        processed = processed.replace(/\{\{scriptCompanyName\}\}/g, '');
        processed = processed.replace(/\{\{scriptNiche\}\}/g, '');
        processed = processed.replace(/\{\{scriptPosition\}\}/g, '');
        processed = processed.replace(/\{\{scriptWebsite\}\}/g, '');
        processed = processed.replace(/\{\{scriptPainPoints\}\}/g, '');
        processed = processed.replace(/\{\{solutions\}\}/g, '');
        processed = processed.replace(/\{\{benefits\}\}/g, '');
        processed = processed.replace(/\{\{competitorAnalysis\}\}/g, '');
        processed = processed.replace(/\{\{roi\}\}/g, '');
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
        processed = processed.replace(/\{\{senderName\}\}/g, smtpConfig.fromName || '');
        processed = processed.replace(/\{\{senderEmail\}\}/g, smtpConfig.fromEmail || '');
        processed = processed.replace(/\{\{senderCompany\}\}/g, smtpConfig.yourCompany || '');
        processed = processed.replace(/\{\{senderPhone\}\}/g, smtpConfig.yourPhone || '');
        processed = processed.replace(/\{\{senderLinkedIn\}\}/g, '');
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
        processed = processed.replace(/\{\{senderName\}\}/g, '[Nome do Remetente]');
        processed = processed.replace(/\{\{senderEmail\}\}/g, '[Email do Remetente]');
        processed = processed.replace(/\{\{senderCompany\}\}/g, '[Empresa do Remetente]');
        processed = processed.replace(/\{\{senderPhone\}\}/g, '[Telefone do Remetente]');
        processed = processed.replace(/\{\{senderLinkedIn\}\}/g, '[LinkedIn do Remetente]');
    }

    // CTAs adicionais
    processed = processed.replace(/\{\{secondaryCTA\}\}/g, '');
    processed = processed.replace(/\{\{ctaLink\}\}/g, '');

    // Tags gerais
    const now = new Date();
    processed = processed.replace(/\{\{currentDate\}\}/g, now.toLocaleDateString('pt-BR'));
    processed = processed.replace(/\{\{currentTime\}\}/g, now.toLocaleTimeString('pt-BR'));
    processed = processed.replace(/\{\{currentYear\}\}/g, now.getFullYear().toString());
    processed = processed.replace(/\{\{dayOfWeek\}\}/g, now.toLocaleDateString('pt-BR', { weekday: 'long' }));

    return processed;
};

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
                            a { color: #0066cc; text-decoration: underline; }
                            a:hover { text-decoration: none; }
                            h1, h2, h3, h4, h5, h6 { 
                                margin-top: 24px; 
                                margin-bottom: 16px; 
                                line-height: 1.25; 
                                color: #212529;
                                font-weight: 600;
                            }
                            h1 { font-size: 24px; border-bottom: 2px solid #e9ecef; padding-bottom: 8px; }
                            h2 { font-size: 20px; }
                            h3 { font-size: 18px; }
                            p { margin-top: 0; margin-bottom: 16px; }
                            ul, ol { 
                                margin-top: 0; 
                                margin-bottom: 16px; 
                                padding-left: 30px; 
                            }
                            li { 
                                margin-bottom: 8px; 
                                line-height: 1.5;
                            }
                            ul li {
                                list-style-type: disc;
                            }
                            ol li {
                                list-style-type: decimal;
                            }
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
                        sandbox="allow-same-origin allow-scripts"
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
                            a { color: #0066cc; text-decoration: underline; }
                            a:hover { text-decoration: none; }
                            h1, h2, h3, h4, h5, h6 { 
                                margin-top: 24px; 
                                margin-bottom: 16px; 
                                line-height: 1.25; 
                                color: #212529;
                                font-weight: 600;
                            }
                            h1 { font-size: 24px; border-bottom: 2px solid #e9ecef; padding-bottom: 8px; }
                            h2 { font-size: 20px; }
                            h3 { font-size: 18px; }
                            p { margin-top: 0; margin-bottom: 16px; }
                            ul, ol { 
                                margin-top: 0; 
                                margin-bottom: 16px; 
                                padding-left: 30px; 
                            }
                            li { 
                                margin-bottom: 8px; 
                                line-height: 1.5;
                            }
                            ul li {
                                list-style-type: disc;
                            }
                            ol li {
                                list-style-type: decimal;
                            }
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
                    sandbox="allow-same-origin allow-scripts"
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
    // Função para processar conteúdo do preview (preserva variáveis quando envio em massa)
    const processPreviewContent = useCallback((content: string, contact: Contact | null, script?: Script | null): string => {
        // Se showRawVariables for true, retorna o conteúdo original sem substituições
        if (showRawVariables) {
            return content;
        }

        // Para envio em massa (lista), preserva as variáveis dos contatos
        if (sendType === 'list') {
            return processTemplate(content, contact, script || null, smtpConfig, true);
        } else {
            // Para envio individual, substitui todas as variáveis
            return processTemplate(content, contact, script || null, smtpConfig, false);
        }
    }, [sendType, smtpConfig, showRawVariables]);

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
                                    ? processScriptSubject(selectedScript.subject, contactForPreview, smtpConfig, sendType === 'list')
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