'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import MainLayout from '@/components/MainLayout';
import EmailTemplatePreview from '@/components/EmailTemplatePreview';
import { Search, Filter, FileText, Calendar, Eye, Trash2, Plus, Edit3, Power, PowerOff, Check, X, Copy } from 'lucide-react';

interface EmailTemplate {
    id: string;
    name: string;
    description?: string;
    subject: string;
    htmlContent: string;
    category?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

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

interface TemplatesResponse {
    templates: EmailTemplate[];
    total: number;
    pages: number;
    currentPage: number;
}

// Componente de Editor HTML Profissional
const HTMLEditor = ({
    value,
    onChange,
    placeholder = "Digite ou cole o código HTML aqui...",
    className = ""
}: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Formatação HTML inteligente
    const formatHTML = useCallback(() => {
        if (!value.trim()) return;

        try {
            let formatted = value;

            // 1. Limpeza inicial: remove espaços extras e quebras desnecessárias
            formatted = formatted.replace(/>\s+</g, '><');
            formatted = formatted.replace(/\s+/g, ' ');
            formatted = formatted.trim();

            // 2. Adiciona quebras de linha estratégicas
            formatted = formatted.replace(/></g, '>\n<');

            // 3. Configuração de tags
            const inlineTags = ['a', 'span', 'strong', 'em', 'b', 'i', 'small', 'code', 'sup', 'sub', 'br'];
            const voidTags = ['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'];
            const blockTags = ['div', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'table', 'tr', 'td', 'th', 'thead', 'tbody', 'html', 'head', 'body', 'style', 'script'];

            // 4. Processamento linha por linha
            const lines = formatted.split('\n');
            let indentLevel = 0;
            const indentSize = 2;

            const formattedLines = lines.map((line) => {
                const trimmed = line.trim();
                if (!trimmed) return '';

                // Análise da linha
                const isClosingTag = trimmed.startsWith('</');
                const isOpeningTag = trimmed.startsWith('<') && !isClosingTag && !trimmed.startsWith('<!--') && !trimmed.startsWith('<!');
                const isSelfClosing = trimmed.endsWith('/>') || voidTags.some(tag => trimmed.toLowerCase().includes(`<${tag}`));
                const isComment = trimmed.startsWith('<!--');
                const isDoctype = trimmed.toLowerCase().startsWith('<!doctype');

                // Determina o tipo de tag
                let tagName = '';
                if (isOpeningTag) {
                    const match = trimmed.match(/<(\w+)/);
                    tagName = match ? match[1].toLowerCase() : '';
                }

                const isInlineTag = inlineTags.includes(tagName);
                const isBlockTag = blockTags.includes(tagName);

                // Ajusta indentação antes da linha (para tags de fechamento)
                if (isClosingTag && !isInlineTag) {
                    indentLevel = Math.max(0, indentLevel - 1);
                }

                // Aplica indentação
                const indentedLine = ' '.repeat(indentLevel * indentSize) + trimmed;

                // Ajusta indentação após a linha (para tags de abertura)
                if (isOpeningTag && !isSelfClosing && !isInlineTag && !isComment && !isDoctype) {
                    // Verifica se é uma tag que deve aumentar indentação
                    const shouldIndent = isBlockTag ||
                        (!inlineTags.includes(tagName) &&
                            !voidTags.includes(tagName));

                    if (shouldIndent) {
                        indentLevel++;
                    }
                }

                return indentedLine;
            });

            // 5. Pós-processamento para melhorar estrutura
            let result = formattedLines.filter(line => line.trim()).join('\n');

            // 6. Formatação específica para CSS dentro de <style>
            result = result.replace(/(<style[^>]*>)(.*?)(<\/style>)/gi, (match, openTag, content, closeTag) => {
                const cleanContent = content.replace(/\s+/g, ' ').trim();
                if (!cleanContent) return match;

                const formattedCSS = cleanContent
                    .replace(/\{/g, ' {\n  ')
                    .replace(/\}/g, '\n}\n')
                    .replace(/;/g, ';\n  ')
                    .replace(/\n\s*\n/g, '\n')
                    .trim();

                const indentedCSS = formattedCSS
                    .split('\n')
                    .map((line: string) => line.trim() ? '  ' + line : '')
                    .join('\n');

                return openTag + '\n' + indentedCSS + '\n' + closeTag;
            });

            // 7. Melhora formatação de atributos muito longos
            result = result.replace(/(<[^>]{80,})/g, (match) => {
                return match.replace(/\s+(\w+="[^"]*")/g, '\n      $1');
            });

            onChange(result);

        } catch (error) {
            console.error('Erro ao formatar HTML:', error);
        }
    }, [value, onChange]);

    // Handlers para melhor experiência de digitação
    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            const textarea = e.currentTarget;
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;

            // Insere 2 espaços em vez de tab
            const newValue = value.substring(0, start) + '  ' + value.substring(end);
            onChange(newValue);

            // Restaura posição do cursor
            setTimeout(() => {
                textarea.selectionStart = textarea.selectionEnd = start + 2;
            }, 0);
        }

        if (e.key === 'Enter') {
            const textarea = e.currentTarget;
            const start = textarea.selectionStart;
            const beforeCursor = value.substring(0, start);
            const afterCursor = value.substring(start);

            // Detecta indentação da linha atual
            const lines = beforeCursor.split('\n');
            const currentLine = lines[lines.length - 1];
            const indent = currentLine.match(/^\s*/)?.[0] || '';

            // Se a linha anterior termina com >, adiciona indentação extra
            const extraIndent = currentLine.trim().endsWith('>') &&
                !currentLine.trim().endsWith('/>') &&
                !currentLine.trim().includes('</') ? '  ' : '';

            const newValue = beforeCursor + '\n' + indent + extraIndent + afterCursor;
            onChange(newValue);

            // Posiciona cursor na nova linha com indentação
            setTimeout(() => {
                textarea.selectionStart = textarea.selectionEnd = start + 1 + indent.length + extraIndent.length;
            }, 0);

            e.preventDefault();
        }
    }, [value, onChange]);

    return (
        <div className={`relative ${className}`}>
            {/* Header com botões */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                    <h4 className="text-sm font-medium text-white flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        Editor HTML
                    </h4>
                </div>
                <button
                    type="button"
                    onClick={formatHTML}
                    className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors cursor-pointer font-medium flex items-center gap-1.5"
                >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                    Formatar Código
                </button>
            </div>

            {/* Container do editor */}
            <div className="border border-neutral-600 rounded-lg overflow-hidden bg-[#1e1e1e] shadow-lg">
                <textarea
                    id="htmlContent"
                    ref={textareaRef}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-full h-[400px] bg-transparent text-[#d4d4d4] font-mono text-sm leading-[1.5] p-4 resize-none outline-none border-none placeholder-neutral-500"
                    placeholder={placeholder}
                    spellCheck={false}
                    style={{
                        fontSize: '14px',
                        lineHeight: '21px',
                        fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                        tabSize: 2,
                        overflowX: 'hidden',
                        overflowY: 'auto',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        scrollbarWidth: 'thin',
                        scrollbarColor: '#555 #2d2d30'
                    }}
                />
            </div>

            {/* Footer informativo */}
            <div className="mt-3 flex items-center justify-between">
                <div className="text-xs text-neutral-400 bg-neutral-800/50 px-3 py-2 rounded-md flex items-center gap-2">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <span><strong>Dica:</strong> Use Tab para indentar, Enter para quebra automática</span>
                </div>
                <div className="text-xs text-neutral-400">
                    Use variáveis: <code className="bg-neutral-700 px-1 rounded">{`{{variável}}`}</code>
                </div>
            </div>
        </div>
    );
};

// Componente de Checkbox customizado (reutilizado)
const CustomCheckbox = ({
    checked,
    onChange,
    className = "",
    label
}: {
    checked: boolean;
    onChange: () => void;
    className?: string;
    label?: string;
}) => {
    return (
        <label className={`flex items-center cursor-pointer ${className}`}>
            <div className="relative">
                <input
                    type="checkbox"
                    checked={checked}
                    onChange={onChange}
                    className="sr-only"
                />
                <div className={`w-4 h-4 rounded border-2 transition-all duration-200 ${checked
                    ? 'bg-blue-600 border-blue-600'
                    : 'bg-neutral-800 border-neutral-600 hover:border-neutral-500'
                    }`}>
                    {checked && (
                        <Check className="w-3 h-3 text-white absolute top-0.5 left-0.5 transform scale-75" />
                    )}
                </div>
            </div>
            {label && (
                <span className="ml-2 text-neutral-300 text-sm select-none">
                    {label}
                </span>
            )}
        </label>
    );
};

export default function Templates() {
    const [templates, setTemplates] = useState<EmailTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('');
    const [isActive, setIsActive] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Modal states
    const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
    const [showViewModal, setShowViewModal] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Selection states
    const [selectedTemplates, setSelectedTemplates] = useState<Set<string>>(new Set());
    const [selectAll, setSelectAll] = useState(false);

    // UI states
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [copiedTemplate, setCopiedTemplate] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [showVariablesHelper, setShowVariablesHelper] = useState(false);

    // Preview states
    const [smtpConfig, setSMTPConfig] = useState<SMTPConfig | null>(null);
    const [previewContact, setPreviewContact] = useState<Contact | null>(null);

    // Confirmation modal states
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmAction, setConfirmAction] = useState<{
        type: 'single' | 'multiple';
        templateId?: string;
        count?: number;
        onConfirm: () => void;
    } | null>(null);

    // Form states
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        subject: '',
        htmlContent: '',
        category: '',
        isActive: true
    });

    // Buscar configurações SMTP
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

    // Buscar contato de exemplo para preview
    const fetchPreviewContact = useCallback(async () => {
        try {
            const response = await fetch('/api/contacts?limit=1&isActive=true');
            if (response.ok) {
                const data = await response.json();
                if (data.contacts && data.contacts.length > 0) {
                    setPreviewContact(data.contacts[0]);
                } else {
                    // Se não há contatos, criar um contato fictício para preview
                    setPreviewContact({
                        id: 'preview',
                        name: 'João Silva',
                        email: 'joao.silva@empresa.com',
                        phone: '(11) 99999-9999',
                        position: 'Diretor Comercial',
                        companyName: 'Empresa Exemplo Ltda',
                        website: 'https://empresa-exemplo.com',
                        niche: 'Tecnologia',
                        painPoints: 'Melhorar eficiência de vendas',
                        isActive: true,
                        previousInteraction: '',
                        notes: ''
                    });
                }
            }
        } catch (error) {
            console.error('Erro ao buscar contato de preview:', error);
            // Criar contato fictício em caso de erro
            setPreviewContact({
                id: 'preview',
                name: 'João Silva',
                email: 'joao.silva@empresa.com',
                phone: '(11) 99999-9999',
                position: 'Diretor Comercial',
                companyName: 'Empresa Exemplo Ltda',
                website: 'https://empresa-exemplo.com',
                niche: 'Tecnologia',
                painPoints: 'Melhorar eficiência de vendas',
                isActive: true,
                previousInteraction: '',
                notes: ''
            });
        }
    }, []);

    const fetchTemplates = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: currentPage.toString(),
                limit: '10',
                ...(search && { search }),
                ...(category && { category }),
                ...(isActive && { isActive }),
            });

            const response = await fetch(`/api/templates?${params}`);
            if (response.ok) {
                const data: TemplatesResponse = await response.json();
                setTemplates(data.templates);
                setTotalPages(data.pages);
                setSelectedTemplates(new Set());
                setSelectAll(false);
            }
        } catch (error) {
            console.error('Erro ao buscar templates:', error);
            setMessage({ type: 'error', text: 'Erro ao carregar templates' });
        } finally {
            setLoading(false);
        }
    }, [currentPage, search, category, isActive]);

    useEffect(() => {
        fetchTemplates();
        fetchSMTPConfig();
        fetchPreviewContact();
    }, [fetchTemplates, fetchSMTPConfig, fetchPreviewContact]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setCurrentPage(1);
        fetchTemplates();
    };

    // Modal functions
    const openViewModal = async (templateId: string) => {
        try {
            const response = await fetch(`/api/templates/${templateId}`);
            if (response.ok) {
                const template = await response.json();
                setSelectedTemplate(template);
                setFormData({
                    name: template.name,
                    description: template.description || '',
                    subject: template.subject,
                    htmlContent: template.htmlContent,
                    category: template.category || '',
                    isActive: template.isActive
                });
                setShowViewModal(true);
            } else {
                setMessage({ type: 'error', text: 'Erro ao carregar template' });
            }
        } catch {
            setMessage({ type: 'error', text: 'Erro ao carregar template' });
        }
    };

    const openCreateModal = () => {
        setFormData({
            name: '',
            description: '',
            subject: '',
            htmlContent: '',
            category: '',
            isActive: true
        });
        setShowCreateModal(true);
    };

    const closeModals = () => {
        setShowViewModal(false);
        setShowCreateModal(false);
        setSelectedTemplate(null);
        setFormData({
            name: '',
            description: '',
            subject: '',
            htmlContent: '',
            category: '',
            isActive: true
        });
    };

    // Selection functions
    const toggleSelectTemplate = (templateId: string) => {
        const newSelected = new Set(selectedTemplates);
        if (newSelected.has(templateId)) {
            newSelected.delete(templateId);
        } else {
            newSelected.add(templateId);
        }
        setSelectedTemplates(newSelected);
        setSelectAll(newSelected.size === templates.length);
    };

    const toggleSelectAll = () => {
        if (selectAll) {
            setSelectedTemplates(new Set());
        } else {
            setSelectedTemplates(new Set(templates.map(template => template.id)));
        }
        setSelectAll(!selectAll);
    };

    // Copy function
    const copyTemplate = async (content: string, templateId: string) => {
        try {
            await navigator.clipboard.writeText(content);
            setCopiedTemplate(templateId);
            setTimeout(() => setCopiedTemplate(null), 2000);
        } catch {
            setMessage({ type: 'error', text: 'Erro ao copiar para área de transferência' });
        }
    };

    const getCategoryLabel = (type: string) => {
        const labels = {
            cold_outreach: 'Primeiro Contato',
            follow_up: 'Follow-up',
            introduction: 'Apresentação',
            meeting_request: 'Agendamento',
        };
        return labels[type as keyof typeof labels] || type;
    };

    const getCategoryColor = (type: string) => {
        const colors = {
            cold_outreach: 'bg-blue-900/50 text-blue-300 border-blue-700',
            follow_up: 'bg-green-900/50 text-green-300 border-green-700',
            introduction: 'bg-purple-900/50 text-purple-300 border-purple-700',
            meeting_request: 'bg-orange-900/50 text-orange-300 border-orange-700',
        };
        return colors[type as keyof typeof colors] || 'bg-neutral-800 text-neutral-300 border-neutral-600';
    };

    // Confirmation modal functions
    const openConfirmModal = (type: 'single' | 'multiple', templateId?: string, count?: number) => {
        const actualDeleteSingle = async () => {
            setDeleting(true);
            try {
                const response = await fetch(`/api/templates/${templateId}`, {
                    method: 'DELETE',
                });

                if (response.ok) {
                    setMessage({ type: 'success', text: 'Template deletado com sucesso!' });
                    fetchTemplates();
                    if (selectedTemplate?.id === templateId) {
                        closeModals();
                    }
                } else {
                    setMessage({ type: 'error', text: 'Erro ao deletar template' });
                }
            } catch {
                setMessage({ type: 'error', text: 'Erro ao conectar com o servidor' });
            } finally {
                setDeleting(false);
                setShowConfirmModal(false);
                setConfirmAction(null);
            }
        };

        const actualDeleteMultiple = async () => {
            setDeleting(true);
            try {
                const response = await fetch('/api/templates', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ids: Array.from(selectedTemplates) }),
                });

                if (response.ok) {
                    const data = await response.json();
                    setMessage({ type: 'success', text: data.message });
                    fetchTemplates();
                } else {
                    setMessage({ type: 'error', text: 'Erro ao deletar templates' });
                }
            } catch {
                setMessage({ type: 'error', text: 'Erro ao conectar com o servidor' });
            } finally {
                setDeleting(false);
                setShowConfirmModal(false);
                setConfirmAction(null);
            }
        };

        setConfirmAction({
            type,
            templateId,
            count,
            onConfirm: type === 'single' ? actualDeleteSingle : actualDeleteMultiple
        });
        setShowConfirmModal(true);
    };

    const closeConfirmModal = () => {
        setShowConfirmModal(false);
        setConfirmAction(null);
    };

    // Delete functions
    const deleteTemplate = (templateId: string) => {
        openConfirmModal('single', templateId);
    };

    const deleteSelectedTemplates = () => {
        if (selectedTemplates.size === 0) return;
        const count = selectedTemplates.size;
        openConfirmModal('multiple', undefined, count);
    };

    // Form submission functions
    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.subject || !formData.htmlContent) {
            setMessage({ type: 'error', text: 'Nome, assunto e conteúdo HTML são obrigatórios' });
            return;
        }

        try {
            const response = await fetch('/api/templates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                setMessage({ type: 'success', text: 'Template criado com sucesso!' });
                closeModals();
                fetchTemplates();
            } else {
                const error = await response.json();
                setMessage({ type: 'error', text: error.error || 'Erro ao criar template' });
            }
        } catch {
            setMessage({ type: 'error', text: 'Erro ao conectar com o servidor' });
        }
    };

    const handleEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTemplate || !formData.name || !formData.subject || !formData.htmlContent) {
            setMessage({ type: 'error', text: 'Nome, assunto e conteúdo HTML são obrigatórios' });
            return;
        }

        try {
            const response = await fetch(`/api/templates/${selectedTemplate.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                setMessage({ type: 'success', text: 'Template atualizado com sucesso!' });
                closeModals();
                fetchTemplates();
            } else {
                const error = await response.json();
                setMessage({ type: 'error', text: error.error || 'Erro ao atualizar template' });
            }
        } catch {
            setMessage({ type: 'error', text: 'Erro ao conectar com o servidor' });
        }
    };

    // Variable insertion for HTML editor
    const insertVariable = (variable: string) => {
        const textarea = document.getElementById('htmlContent') as HTMLTextAreaElement;
        if (textarea) {
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const text = textarea.value;
            const before = text.substring(0, start);
            const after = text.substring(end, text.length);
            const newText = before + `{{${variable}}}` + after;

            setFormData(prev => ({ ...prev, htmlContent: newText }));

            // Restore cursor position
            setTimeout(() => {
                textarea.selectionStart = textarea.selectionEnd = start + variable.length + 4;
                textarea.focus();
            }, 0);
        } else {
            // Fallback: just add to the end
            setFormData(prev => ({
                ...prev,
                htmlContent: prev.htmlContent + `{{${variable}}}`
            }));
        }
    };

    // Common variables for email templates
    const commonVariables = [
        // Dados do Contato e Empresa
        { name: 'contactName', label: 'Nome do Contato', category: 'prospect' },
        { name: 'contactFirstName', label: 'Primeiro Nome', category: 'prospect' },
        { name: 'contactEmail', label: 'Email do Contato', category: 'prospect' },
        { name: 'contactPhone', label: 'Telefone do Contato', category: 'prospect' },
        { name: 'contactPosition', label: 'Cargo do Contato', category: 'prospect' },
        { name: 'companyName', label: 'Nome da Empresa', category: 'prospect' },
        { name: 'companyWebsite', label: 'Site da Empresa', category: 'prospect' },
        { name: 'companySize', label: 'Tamanho da Empresa', category: 'prospect' },
        { name: 'companyIndustry', label: 'Setor da Empresa', category: 'prospect' },
        { name: 'companyLocation', label: 'Localização da Empresa', category: 'prospect' },

        // Contexto do Negócio
        { name: 'painPoints', label: 'Pontos de Dor', category: 'business' },
        { name: 'solutions', label: 'Soluções Propostas', category: 'business' },
        { name: 'benefits', label: 'Benefícios', category: 'business' },
        { name: 'competitorAnalysis', label: 'Análise de Concorrentes', category: 'business' },
        { name: 'roi', label: 'Retorno do Investimento', category: 'business' },

        // Dados do Remetente
        { name: 'senderName', label: 'Nome do Remetente', category: 'sender' },
        { name: 'senderEmail', label: 'Email do Remetente', category: 'sender' },
        { name: 'senderCompany', label: 'Empresa do Remetente', category: 'sender' },
        { name: 'senderPhone', label: 'Telefone do Remetente', category: 'sender' },
        { name: 'senderLinkedIn', label: 'LinkedIn do Remetente', category: 'sender' },
        { name: 'yourName', label: 'Seu Nome', category: 'sender' },
        { name: 'yourCompany', label: 'Sua Empresa', category: 'sender' },
        { name: 'yourPhone', label: 'Seu Telefone', category: 'sender' },
        { name: 'yourIndustry', label: 'Seu Setor', category: 'sender' },
        { name: 'yourPosition', label: 'Seu Cargo', category: 'sender' },
        { name: 'yourWebsite', label: 'Seu Website', category: 'sender' },
        { name: 'yourLocation', label: 'Sua Localização', category: 'sender' },

        // Call to Action e Agendamento
        { name: 'primaryCTA', label: 'CTA Principal', category: 'cta' },
        { name: 'secondaryCTA', label: 'CTA Secundário', category: 'cta' },
        { name: 'ctaLink', label: 'Link do CTA', category: 'cta' },
        { name: 'meetingLink', label: 'Link de Agendamento', category: 'meeting' },
        { name: 'availableSlots', label: 'Horários Disponíveis', category: 'meeting' },

        // Dados Dinâmicos
        { name: 'currentDate', label: 'Data Atual', category: 'dynamic' },
        { name: 'currentTime', label: 'Hora Atual', category: 'dynamic' },
        { name: 'dayOfWeek', label: 'Dia da Semana', category: 'dynamic' }
    ];

    // Criar template fictício para preview
    const mockTemplate = {
        id: 'preview',
        name: formData.name || 'Template de Exemplo',
        description: formData.description,
        subject: formData.subject || 'Assunto do Email',
        htmlContent: formData.htmlContent || '<p>Conteúdo do email aparecerá aqui...</p>',
        category: formData.category,
        isActive: formData.isActive,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    return (
        <MainLayout>
            <div className="p-8">
                <div className="max-w-6xl mx-auto">
                    {/* Header */}
                    <div className="mb-6 lg:mb-8">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                                    Modelos de Email
                                </h1>
                                <p className="text-neutral-400">
                                    Gerencie seus modelos de email HTML reutilizáveis
                                </p>
                            </div>
                            <button
                                onClick={openCreateModal}
                                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-white text-black font-medium rounded-lg hover:bg-neutral-200 transition-colors cursor-pointer"
                            >
                                <Plus className="h-4 w-4" />
                                <span className="sm:inline">Novo Modelo</span>
                            </button>
                        </div>
                    </div>

                    {/* Message */}
                    {message && (
                        <div className={`mb-6 p-4 rounded-lg ${message.type === 'success'
                            ? 'bg-green-900/50 border border-green-700 text-green-300'
                            : 'bg-red-900/50 border border-red-700 text-red-300'
                            }`}>
                            <div className="flex items-start justify-between">
                                <span className="flex-1">{message.text}</span>
                                <button
                                    onClick={() => setMessage(null)}
                                    className="text-current hover:opacity-70 cursor-pointer ml-4 flex-shrink-0"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Filters and Search */}
                    <div className="bg-neutral-gradient rounded-lg p-4 sm:p-6 border border-neutral-800 mb-6">
                        <form onSubmit={handleSearch} className="space-y-4">
                            {/* Search Bar */}
                            <div className="w-full">
                                <div className="relative">
                                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400 pointer-events-none" />
                                    <input
                                        type="text"
                                        placeholder="Buscar modelos..."
                                        className="w-full pl-10 pr-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-white cursor-text"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Filters */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                <select
                                    className="px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:border-white cursor-pointer"
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                >
                                    <option value="">Todas as categorias</option>
                                    <option value="cold_outreach">Primeiro Contato</option>
                                    <option value="follow_up">Follow-up</option>
                                    <option value="introduction">Apresentação</option>
                                    <option value="meeting_request">Agendamento</option>
                                </select>
                                <select
                                    className="px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:border-white cursor-pointer"
                                    value={isActive}
                                    onChange={(e) => setIsActive(e.target.value)}
                                >
                                    <option value="">Todos os status</option>
                                    <option value="true">Ativos</option>
                                    <option value="false">Inativos</option>
                                </select>
                                <div className="sm:col-span-2 lg:col-span-2 flex gap-3">
                                    <button
                                        type="submit"
                                        className="flex-1 sm:flex-none px-4 py-2 bg-blue-600 hover:bg-blue-700 border border-blue-600 rounded-lg text-white transition-colors cursor-pointer font-medium"
                                    >
                                        <Filter className="h-4 w-4 mx-auto sm:mr-2 sm:inline" />
                                        <span className="hidden sm:inline">Filtrar</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSearch('');
                                            setCategory('');
                                            setIsActive('');
                                            setCurrentPage(1);
                                            fetchTemplates();
                                        }}
                                        className="px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white hover:bg-neutral-700 transition-colors cursor-pointer"
                                    >
                                        Limpar
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>

                    {/* Templates List */}
                    {loading ? (
                        <div className="bg-neutral-gradient rounded-lg p-12 border border-neutral-800 text-center">
                            <div className="text-neutral-400">Carregando modelos...</div>
                        </div>
                    ) : templates.length === 0 ? (
                        <div className="bg-neutral-gradient rounded-lg p-12 border border-neutral-800 text-center">
                            <FileText className="h-16 w-16 text-neutral-500 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-white mb-2">
                                Nenhum modelo encontrado
                            </h3>
                            <p className="text-neutral-400 mb-6">
                                {search || category || isActive
                                    ? 'Nenhum modelo corresponde aos filtros aplicados.'
                                    : 'Você ainda não criou nenhum modelo. Comece criando seu primeiro modelo de email.'
                                }
                            </p>
                            <button
                                onClick={openCreateModal}
                                className="inline-flex items-center px-6 py-3 bg-white text-black font-medium rounded-lg hover:bg-neutral-200 transition-colors cursor-pointer"
                            >
                                Criar Primeiro Modelo
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {/* Select All Header - Mais Compacto */}
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-neutral-800 rounded-lg">
                                <CustomCheckbox
                                    checked={selectAll}
                                    onChange={toggleSelectAll}
                                    label={`Selecionar todos (${templates.length} modelos)`}
                                />
                                {selectedTemplates.size > 0 && (
                                    <div className="flex items-center gap-3 w-full sm:w-auto">
                                        <span className="text-blue-300 text-sm flex-1 sm:flex-none">
                                            {selectedTemplates.size} modelo(s) selecionado(s)
                                        </span>
                                        <button
                                            onClick={deleteSelectedTemplates}
                                            disabled={deleting}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed text-sm"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                            {deleting ? 'Deletando...' : 'Deletar'}
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Lista de Templates - Layout Compacto e Responsivo */}
                            {templates.map((template) => (
                                <div
                                    key={template.id}
                                    className={`bg-neutral-gradient rounded-lg p-4 border transition-colors ${selectedTemplates.has(template.id)
                                        ? 'border-blue-500 bg-blue-900/10'
                                        : 'border-neutral-800 hover:border-neutral-700'
                                        }`}
                                >
                                    <div className="flex flex-col lg:flex-row items-start gap-3">
                                        {/* Checkbox */}
                                        <div className="flex-shrink-0 lg:mt-1">
                                            <CustomCheckbox
                                                checked={selectedTemplates.has(template.id)}
                                                onChange={() => toggleSelectTemplate(template.id)}
                                            />
                                        </div>

                                        {/* Conteúdo Principal */}
                                        <div className="flex-1 min-w-0 w-full">
                                            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
                                                {/* Informações do Template */}
                                                <div className="flex-1 min-w-0 w-full lg:pr-4">
                                                    {/* Linha 1: Nome + Status + Categoria */}
                                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                                                        <h3 className="text-base font-semibold text-white truncate flex-1 min-w-0">
                                                            {template.name}
                                                        </h3>
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <div className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs flex-shrink-0 ${template.isActive
                                                                ? 'bg-green-900/50 text-green-300 border border-green-700'
                                                                : 'bg-red-900/50 text-red-300 border border-red-700'
                                                                }`}>
                                                                {template.isActive ? <Power className="h-3 w-3" /> : <PowerOff className="h-3 w-3" />}
                                                                {template.isActive ? 'Ativo' : 'Inativo'}
                                                            </div>
                                                            {template.category && (
                                                                <span className={`px-2 py-0.5 rounded text-xs font-medium border flex-shrink-0 ${getCategoryColor(template.category)}`}>
                                                                    {getCategoryLabel(template.category)}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Linha 2: Assunto */}
                                                    <p className="text-neutral-300 text-sm mb-2 truncate font-medium">
                                                        {template.subject}
                                                    </p>

                                                    {/* Linha 3: Descrição + Data */}
                                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-4">
                                                        <p className="text-neutral-400 text-xs truncate">
                                                            {template.description || 'Sem descrição'}
                                                        </p>
                                                        <div className="flex items-center text-xs text-neutral-500 flex-shrink-0">
                                                            <Calendar className="h-3 w-3 mr-1" />
                                                            <span className="whitespace-nowrap">
                                                                {new Date(template.updatedAt).toLocaleDateString('pt-BR')}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Botões de Ação - Responsivos */}
                                                <div className="flex gap-1.5 flex-shrink-0 w-full lg:w-auto">
                                                    <button
                                                        onClick={() => openViewModal(template.id)}
                                                        className="flex-1 lg:flex-none flex items-center justify-center gap-1.5 px-2.5 py-1.5 bg-neutral-800 text-white rounded-md hover:bg-neutral-700 transition-colors border border-neutral-600 text-xs cursor-pointer"
                                                        title="Visualizar template"
                                                    >
                                                        <Eye className="h-3.5 w-3.5" />
                                                        <span className="sm:inline">Ver</span>
                                                    </button>
                                                    <button
                                                        onClick={() => openViewModal(template.id)}
                                                        className="flex-1 lg:flex-none flex items-center justify-center gap-1.5 px-2.5 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-xs cursor-pointer"
                                                        title="Editar template"
                                                    >
                                                        <Edit3 className="h-3.5 w-3.5" />
                                                        <span className="sm:inline">Editar</span>
                                                    </button>
                                                    <button
                                                        onClick={() => deleteTemplate(template.id)}
                                                        disabled={deleting}
                                                        className="flex-1 lg:flex-none flex items-center justify-center gap-1.5 px-2.5 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-xs disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                                                        title="Deletar template"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                        <span className="sm:inline">Deletar</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    {templates.length > 0 && totalPages > 1 && (
                        <div className="mt-6 sm:mt-8 flex items-center justify-center">
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    className="px-3 py-2 bg-neutral-800 text-white rounded-lg hover:bg-neutral-700 transition-colors border border-neutral-600 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-sm"
                                >
                                    <span className="hidden sm:inline">Anterior</span>
                                    <span className="sm:hidden">Ant</span>
                                </button>
                                <span className="px-3 sm:px-4 py-2 text-neutral-400 select-none text-sm">
                                    <span className="hidden sm:inline">Página {currentPage} de {totalPages}</span>
                                    <span className="sm:hidden">{currentPage}/{totalPages}</span>
                                </span>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages}
                                    className="px-3 py-2 bg-neutral-800 text-white rounded-lg hover:bg-neutral-700 transition-colors border border-neutral-600 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-sm"
                                >
                                    <span className="hidden sm:inline">Próxima</span>
                                    <span className="sm:hidden">Prox</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Create Modal */}
                {showCreateModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50">
                        <div className="bg-neutral-900 rounded-xl w-full max-w-7xl h-[95vh] sm:h-[90vh] border border-neutral-700 shadow-2xl flex flex-col">
                            {/* Modal Header */}
                            <div className="px-4 sm:px-6 py-4 border-b border-neutral-700 flex items-center justify-between bg-gradient-to-r from-neutral-800 to-neutral-900 rounded-t-xl">
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <Plus className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h2 className="text-lg sm:text-xl font-bold text-white truncate">
                                            Criar Novo Template
                                        </h2>
                                        <p className="text-xs sm:text-sm text-neutral-400 hidden sm:block">
                                            Crie um modelo de email reutilizável
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={closeModals}
                                    className="text-neutral-400 hover:text-white transition-colors p-2 hover:bg-neutral-800 rounded-lg cursor-pointer flex-shrink-0"
                                >
                                    <X className="h-5 w-5 sm:h-6 sm:w-6" />
                                </button>
                            </div>

                            {/* Modal Content - Responsivo */}
                            <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
                                {/* Left Side - Form */}
                                <div className="w-full lg:w-1/2 border-b lg:border-b-0 lg:border-r border-neutral-700 flex flex-col max-h-[50vh] lg:max-h-none">
                                    <div className="p-4 sm:p-6 overflow-y-auto flex-1">
                                        <div className="space-y-4 sm:space-y-6">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-white mb-2">
                                                        Nome do Template *
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={formData.name}
                                                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                                        className="w-full px-3 py-2.5 bg-neutral-800 border border-neutral-600 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 cursor-text text-sm"
                                                        placeholder="Ex: Cold Outreach Básico"
                                                        required
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-white mb-2">
                                                        Categoria
                                                    </label>
                                                    <select
                                                        value={formData.category}
                                                        onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                                                        className="w-full px-3 py-2.5 bg-neutral-800 border border-neutral-600 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 cursor-pointer text-sm"
                                                    >
                                                        <option value="">Selecione uma categoria</option>
                                                        <option value="cold_outreach">Primeiro Contato</option>
                                                        <option value="follow_up">Follow-up</option>
                                                        <option value="introduction">Apresentação</option>
                                                        <option value="meeting_request">Agendamento</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-white mb-2">
                                                    Descrição
                                                </label>
                                                <textarea
                                                    value={formData.description}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                                    className="w-full px-3 py-2.5 bg-neutral-800 border border-neutral-600 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 cursor-text h-16 sm:h-20 resize-none text-sm"
                                                    placeholder="Descrição opcional do template"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-white mb-2">
                                                    Assunto *
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.subject}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                                                    className="w-full px-3 py-2.5 bg-neutral-800 border border-neutral-600 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 cursor-text text-sm"
                                                    placeholder="Ex: Proposta de Parceria - {{companyName}}"
                                                    required
                                                />
                                            </div>

                                            <div className="flex items-center gap-3 p-3 sm:p-4 bg-neutral-800/50 rounded-lg">
                                                <CustomCheckbox
                                                    checked={formData.isActive}
                                                    onChange={() => setFormData(prev => ({ ...prev, isActive: !prev.isActive }))}
                                                />
                                                <div>
                                                    <span className="text-white font-medium text-sm">Template ativo</span>
                                                    <p className="text-xs text-neutral-400">Templates ativos aparecerão na lista de seleção</p>
                                                </div>
                                            </div>

                                            <div>
                                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 mb-3">
                                                    <label className="block text-sm font-medium text-white">
                                                        Conteúdo HTML *
                                                    </label>
                                                    <div className="flex flex-wrap gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowVariablesHelper(!showVariablesHelper)}
                                                            className="px-3 py-1.5 text-xs bg-neutral-700 text-neutral-300 rounded-md hover:bg-neutral-600 transition-colors cursor-pointer"
                                                        >
                                                            {showVariablesHelper ? 'Ocultar Variáveis' : 'Mostrar Variáveis'}
                                                        </button>
                                                    </div>
                                                </div>

                                                {showVariablesHelper && (
                                                    <div className="mb-4 bg-neutral-800 rounded-lg p-3 sm:p-4 border border-neutral-700">
                                                        <h4 className="text-white font-medium mb-3 flex items-center gap-2 text-sm">
                                                            <FileText className="h-4 w-4 text-blue-400" />
                                                            Variáveis Disponíveis
                                                        </h4>
                                                        <div className="grid grid-cols-1 gap-3 sm:gap-4 max-h-32 sm:max-h-48 overflow-y-auto">
                                                            <div>
                                                                <h5 className="text-xs font-semibold text-neutral-300 uppercase tracking-wide mb-2 flex items-center gap-1">
                                                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                                                    Dados do Contato
                                                                </h5>
                                                                <div className="flex flex-wrap gap-1">
                                                                    {commonVariables.filter(v => v.category === 'prospect').slice(0, 6).map((variable) => (
                                                                        <button
                                                                            key={variable.name}
                                                                            type="button"
                                                                            onClick={() => insertVariable(variable.name)}
                                                                            className="px-2 py-1 bg-blue-900/30 text-blue-300 rounded text-xs hover:bg-blue-900/50 transition-colors cursor-pointer border border-blue-700/30"
                                                                            title={variable.label}
                                                                        >
                                                                            {`{{${variable.name}}}`}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <h5 className="text-xs font-semibold text-neutral-300 uppercase tracking-wide mb-2 flex items-center gap-1">
                                                                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                                                    Remetente
                                                                </h5>
                                                                <div className="flex flex-wrap gap-1">
                                                                    {commonVariables.filter(v => v.category === 'sender').slice(0, 4).map((variable) => (
                                                                        <button
                                                                            key={variable.name}
                                                                            type="button"
                                                                            onClick={() => insertVariable(variable.name)}
                                                                            className="px-2 py-1 bg-purple-900/30 text-purple-300 rounded text-xs hover:bg-purple-900/50 transition-colors cursor-pointer border border-purple-700/30"
                                                                            title={variable.label}
                                                                        >
                                                                            {`{{${variable.name}}}`}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                <HTMLEditor
                                                    value={formData.htmlContent}
                                                    onChange={(value) => setFormData(prev => ({ ...prev, htmlContent: value }))}
                                                    placeholder="Digite ou cole o código HTML aqui..."
                                                    className="h-48 sm:h-auto"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Side - Preview */}
                                <div className="w-full lg:w-1/2 flex flex-col">
                                    <div className="p-4 sm:p-6 border-b border-neutral-700 bg-neutral-800/30">
                                        <h3 className="text-base sm:text-lg font-semibold text-white mb-1 flex items-center gap-2">
                                            <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" />
                                            Preview do Template
                                        </h3>
                                        <p className="text-xs sm:text-sm text-neutral-400">Visualização em tempo real</p>
                                    </div>

                                    <div className="flex-1 min-h-0">
                                        <EmailTemplatePreview
                                            sendType="individual"
                                            selectedTemplate={mockTemplate}
                                            selectedScript={null}
                                            contactForPreview={previewContact}
                                            smtpConfig={smtpConfig}
                                            className="h-full"
                                            title="Preview do Template"
                                            showRawVariables={true}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer - Responsivo */}
                            <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-neutral-700 bg-neutral-800/30 rounded-b-xl">
                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                                    <div className="text-xs sm:text-sm text-neutral-400 order-2 sm:order-1">
                                        * Campos obrigatórios
                                    </div>
                                    <div className="flex gap-2 sm:gap-3 order-1 sm:order-2">
                                        <button
                                            type="button"
                                            onClick={closeModals}
                                            className="flex-1 sm:flex-none px-4 sm:px-6 py-2.5 bg-neutral-700 text-neutral-300 rounded-lg hover:bg-neutral-600 transition-colors border border-neutral-600 cursor-pointer font-medium text-sm"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="submit"
                                            onClick={handleCreate}
                                            className="flex-1 sm:flex-none px-4 sm:px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all cursor-pointer font-medium shadow-lg text-sm"
                                        >
                                            Criar Template
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* View/Edit Modal */}
                {showViewModal && selectedTemplate && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50">
                        <div className="bg-neutral-900 rounded-xl w-full max-w-7xl h-[95vh] sm:h-[90vh] border border-neutral-700 shadow-2xl flex flex-col">
                            {/* Modal Header */}
                            <div className="px-4 sm:px-6 py-4 border-b border-neutral-700 flex items-center justify-between bg-gradient-to-r from-neutral-800 to-neutral-900 rounded-t-xl">
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <Edit3 className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h2 className="text-lg sm:text-xl font-bold text-white truncate">
                                            {selectedTemplate.name}
                                        </h2>
                                        <p className="text-xs sm:text-sm text-neutral-400 hidden sm:block">
                                            Editar modelo de email
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={closeModals}
                                    className="text-neutral-400 hover:text-white transition-colors p-2 hover:bg-neutral-800 rounded-lg cursor-pointer flex-shrink-0"
                                >
                                    <X className="h-5 w-5 sm:h-6 sm:w-6" />
                                </button>
                            </div>

                            {/* Modal Content */}
                            <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
                                {/* Left Side - Form */}
                                <div className="w-full lg:w-1/2 border-b lg:border-b-0 lg:border-r border-neutral-700 flex flex-col max-h-[50vh] lg:max-h-none">
                                    <div className="p-4 sm:p-6 overflow-y-auto flex-1">
                                        <div className="space-y-4 sm:space-y-6">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-white mb-2">
                                                        Nome do Template *
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={formData.name}
                                                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                                        className="w-full px-3 py-2.5 bg-neutral-800 border border-neutral-600 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 cursor-text text-sm"
                                                        required
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-white mb-2">
                                                        Categoria
                                                    </label>
                                                    <select
                                                        value={formData.category}
                                                        onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                                                        className="w-full px-3 py-2.5 bg-neutral-800 border border-neutral-600 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 cursor-pointer text-sm"
                                                    >
                                                        <option value="">Selecione uma categoria</option>
                                                        <option value="cold_outreach">Primeiro Contato</option>
                                                        <option value="follow_up">Follow-up</option>
                                                        <option value="introduction">Apresentação</option>
                                                        <option value="meeting_request">Agendamento</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-white mb-2">
                                                    Descrição
                                                </label>
                                                <textarea
                                                    value={formData.description}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                                    className="w-full px-3 py-2.5 bg-neutral-800 border border-neutral-600 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 cursor-text h-16 sm:h-20 resize-none text-sm"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-white mb-2">
                                                    Assunto *
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.subject}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                                                    className="w-full px-3 py-2.5 bg-neutral-800 border border-neutral-600 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 cursor-text text-sm"
                                                    required
                                                />
                                            </div>

                                            <div className="flex items-center gap-3 p-3 sm:p-4 bg-neutral-800/50 rounded-lg">
                                                <CustomCheckbox
                                                    checked={formData.isActive}
                                                    onChange={() => setFormData(prev => ({ ...prev, isActive: !prev.isActive }))}
                                                />
                                                <div>
                                                    <span className="text-white font-medium text-sm">Template ativo</span>
                                                    <p className="text-xs text-neutral-400">Templates ativos aparecerão na lista de seleção</p>
                                                </div>
                                            </div>

                                            <div>
                                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 mb-3">
                                                    <label className="block text-sm font-medium text-white">
                                                        Conteúdo HTML *
                                                    </label>
                                                    <div className="flex flex-wrap gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowVariablesHelper(!showVariablesHelper)}
                                                            className="px-3 py-1.5 text-xs bg-neutral-700 text-neutral-300 rounded-md hover:bg-neutral-600 transition-colors cursor-pointer"
                                                        >
                                                            {showVariablesHelper ? 'Ocultar Variáveis' : 'Mostrar Variáveis'}
                                                        </button>
                                                    </div>
                                                </div>

                                                {showVariablesHelper && (
                                                    <div className="mb-4 bg-neutral-800 rounded-lg p-3 sm:p-4 border border-neutral-700">
                                                        <h4 className="text-white font-medium mb-3 flex items-center gap-2 text-sm">
                                                            <FileText className="h-4 w-4 text-blue-400" />
                                                            Variáveis Disponíveis
                                                        </h4>
                                                        <div className="grid grid-cols-1 gap-3 sm:gap-4 max-h-32 sm:max-h-48 overflow-y-auto">
                                                            <div>
                                                                <h5 className="text-xs font-semibold text-neutral-300 uppercase tracking-wide mb-2 flex items-center gap-1">
                                                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                                                    Dados do Contato
                                                                </h5>
                                                                <div className="flex flex-wrap gap-1">
                                                                    {commonVariables.filter(v => v.category === 'prospect').slice(0, 6).map((variable) => (
                                                                        <button
                                                                            key={variable.name}
                                                                            type="button"
                                                                            onClick={() => insertVariable(variable.name)}
                                                                            className="px-2 py-1 bg-blue-900/30 text-blue-300 rounded text-xs hover:bg-blue-900/50 transition-colors cursor-pointer border border-blue-700/30"
                                                                            title={variable.label}
                                                                        >
                                                                            {`{{${variable.name}}}`}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <h5 className="text-xs font-semibold text-neutral-300 uppercase tracking-wide mb-2 flex items-center gap-1">
                                                                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                                                    Remetente
                                                                </h5>
                                                                <div className="flex flex-wrap gap-1">
                                                                    {commonVariables.filter(v => v.category === 'sender').slice(0, 4).map((variable) => (
                                                                        <button
                                                                            key={variable.name}
                                                                            type="button"
                                                                            onClick={() => insertVariable(variable.name)}
                                                                            className="px-2 py-1 bg-purple-900/30 text-purple-300 rounded text-xs hover:bg-purple-900/50 transition-colors cursor-pointer border border-purple-700/30"
                                                                            title={variable.label}
                                                                        >
                                                                            {`{{${variable.name}}}`}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                <HTMLEditor
                                                    value={formData.htmlContent}
                                                    onChange={(value) => setFormData(prev => ({ ...prev, htmlContent: value }))}
                                                    placeholder="Digite ou cole o código HTML aqui..."
                                                    className="h-48 sm:h-auto"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Side - Preview */}
                                <div className="w-full lg:w-1/2 flex flex-col">
                                    <div className="flex-1 min-h-0">
                                        <EmailTemplatePreview
                                            sendType="individual"
                                            selectedTemplate={mockTemplate}
                                            selectedScript={null}
                                            contactForPreview={previewContact}
                                            smtpConfig={smtpConfig}
                                            className="h-full"
                                            title="Preview do Template"
                                            showRawVariables={true}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-neutral-700 bg-neutral-800/30 rounded-b-xl">
                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 order-2 sm:order-1">
                                        <button
                                            onClick={() => copyTemplate(formData.htmlContent, selectedTemplate.id)}
                                            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-neutral-700 text-neutral-300 rounded-lg hover:bg-neutral-600 transition-colors border border-neutral-600 cursor-pointer font-medium text-sm"
                                        >
                                            {copiedTemplate === selectedTemplate.id ? (
                                                <>
                                                    <Check className="h-4 w-4" />
                                                    Copiado!
                                                </>
                                            ) : (
                                                <>
                                                    <Copy className="h-4 w-4" />
                                                    Copiar HTML
                                                </>
                                            )}
                                        </button>
                                        <div className="text-xs sm:text-sm text-neutral-400 text-center sm:text-left">
                                            * Campos obrigatórios
                                        </div>
                                    </div>
                                    <div className="flex gap-2 sm:gap-3 order-1 sm:order-2">
                                        <button
                                            type="button"
                                            onClick={closeModals}
                                            className="flex-1 sm:flex-none px-4 sm:px-6 py-2.5 bg-neutral-700 text-neutral-300 rounded-lg hover:bg-neutral-600 transition-colors border border-neutral-600 cursor-pointer font-medium text-sm"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="submit"
                                            onClick={handleEdit}
                                            className="flex-1 sm:flex-none px-4 sm:px-6 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all cursor-pointer font-medium shadow-lg text-sm"
                                        >
                                            Salvar Alterações
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Confirmation Modal */}
                {showConfirmModal && confirmAction && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-neutral-900 rounded-lg max-w-md w-full border border-neutral-700">
                            {/* Modal Header */}
                            <div className="p-4 sm:p-6 border-b border-neutral-700">
                                <h2 className="text-lg sm:text-xl font-bold text-white">
                                    Confirmar Exclusão
                                </h2>
                            </div>

                            {/* Modal Content */}
                            <div className="p-4 sm:p-6">
                                <div className="flex items-start gap-4 mb-4 sm:mb-6">
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-600 rounded-full flex items-center justify-center flex-shrink-0">
                                        <Trash2 className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white font-medium mb-1 text-sm sm:text-base">
                                            {confirmAction.type === 'single'
                                                ? 'Deletar template?'
                                                : `Deletar ${confirmAction.count} templates?`
                                            }
                                        </p>
                                        <p className="text-neutral-400 text-xs sm:text-sm">
                                            {confirmAction.type === 'single'
                                                ? 'Esta ação não pode ser desfeita.'
                                                : `Todos os ${confirmAction.count} templates selecionados serão deletados permanentemente.`
                                            }
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="p-4 sm:p-6 border-t border-neutral-700 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3">
                                <button
                                    onClick={closeConfirmModal}
                                    disabled={deleting}
                                    className="order-2 sm:order-1 px-4 py-2 bg-neutral-800 text-white rounded-lg hover:bg-neutral-700 transition-colors border border-neutral-600 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed text-sm"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={confirmAction.onConfirm}
                                    disabled={deleting}
                                    className="order-1 sm:order-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed text-sm"
                                >
                                    {deleting ? 'Deletando...' : 'Deletar'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </MainLayout>
    );
} 