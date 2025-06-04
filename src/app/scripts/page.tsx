'use client';

import { useEffect, useState, useCallback } from 'react';
import MainLayout from '@/components/MainLayout';
import { Search, Filter, FileText, User, Building, Eye, Trash2, X, Copy, Check, Tag, Edit3, Save, Settings, Target, Zap, Clock, Hash } from 'lucide-react';

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
    createdAt: string;
}

// Componente de Checkbox customizado
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

export default function Scripts() {
    const [scripts, setScripts] = useState<Script[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [emailType, setEmailType] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Modal states
    const [selectedScript, setSelectedScript] = useState<Script | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);

    // Selection states
    const [selectedScripts, setSelectedScripts] = useState<Set<string>>(new Set());
    const [selectAll, setSelectAll] = useState(false);

    // UI states
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [copiedScript, setCopiedScript] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [saving, setSaving] = useState(false);

    // Edit form states
    const [editForm, setEditForm] = useState({
        subject: '',
        body: '',
        prospectData: {
            contactName: '',
            companyName: '',
            niche: '',
            position: '',
            website: '',
            painPoints: ''
        },
        emailType: '',
        tone: '',
        length: '',
        callToAction: ''
    });

    // Confirmation modal states
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmAction, setConfirmAction] = useState<{
        type: 'single' | 'multiple';
        scriptId?: string;
        count?: number;
        onConfirm: () => void;
    } | null>(null);

    const fetchScripts = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: currentPage.toString(),
                limit: '10',
                ...(search && { search }),
                ...(emailType && { emailType }),
            });

            const response = await fetch(`/api/scripts?${params}`);
            if (response.ok) {
                const data = await response.json();
                setScripts(data.scripts);
                setTotalPages(data.pages);
                setSelectedScripts(new Set());
                setSelectAll(false);
            }
        } catch (error) {
            console.error('Erro ao buscar scripts:', error);
            setMessage({ type: 'error', text: 'Erro ao carregar scripts' });
        } finally {
            setLoading(false);
        }
    }, [currentPage, search, emailType]);

    useEffect(() => {
        fetchScripts();
    }, [fetchScripts]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setCurrentPage(1);
        fetchScripts();
    };

    // Modal functions
    const openModal = async (scriptId: string) => {
        try {
            const response = await fetch(`/api/scripts/${scriptId}`);
            if (response.ok) {
                const script = await response.json();
                setSelectedScript(script);
                setShowModal(true);
            } else {
                setMessage({ type: 'error', text: 'Erro ao carregar script completo' });
            }
        } catch {
            setMessage({ type: 'error', text: 'Erro ao carregar script' });
        }
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedScript(null);
    };

    // Edit functions
    const openEditModal = async (scriptId: string) => {
        try {
            const response = await fetch(`/api/scripts/${scriptId}`);
            if (response.ok) {
                const script = await response.json();
                setSelectedScript(script);
                setEditForm({
                    subject: script.subject,
                    body: script.body,
                    prospectData: {
                        contactName: script.prospectData?.contactName || '',
                        companyName: script.prospectData?.companyName || '',
                        niche: script.prospectData?.niche || '',
                        position: script.prospectData?.position || '',
                        website: script.prospectData?.website || '',
                        painPoints: script.prospectData?.painPoints || ''
                    },
                    emailType: script.emailType,
                    tone: script.tone,
                    length: script.length,
                    callToAction: script.callToAction
                });
                setShowEditModal(true);
            } else {
                setMessage({ type: 'error', text: 'Erro ao carregar script para edição' });
            }
        } catch {
            setMessage({ type: 'error', text: 'Erro ao carregar script' });
        }
    };

    const closeEditModal = () => {
        setShowEditModal(false);
        setSelectedScript(null);
        setEditForm({
            subject: '',
            body: '',
            prospectData: {
                contactName: '',
                companyName: '',
                niche: '',
                position: '',
                website: '',
                painPoints: ''
            },
            emailType: '',
            tone: '',
            length: '',
            callToAction: ''
        });
    };

    const saveScript = async () => {
        if (!selectedScript) return;

        setSaving(true);
        try {
            const response = await fetch(`/api/scripts/${selectedScript.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editForm),
            });

            if (response.ok) {
                setMessage({ type: 'success', text: 'Script atualizado com sucesso!' });
                closeEditModal();
                fetchScripts();
            } else {
                const error = await response.json();
                setMessage({ type: 'error', text: error.error || 'Erro ao salvar script' });
            }
        } catch {
            setMessage({ type: 'error', text: 'Erro ao conectar com o servidor' });
        } finally {
            setSaving(false);
        }
    };

    // Tag insertion functions
    const insertTag = (field: 'subject' | 'body' | 'callToAction', tag: string) => {
        const textareaId = `${field}-textarea`;
        const textarea = document.getElementById(textareaId) as HTMLTextAreaElement;

        if (textarea) {
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const currentValue = editForm[field];
            const newValue = currentValue.substring(0, start) + tag + currentValue.substring(end);

            setEditForm(prev => ({
                ...prev,
                [field]: newValue
            }));

            // Restaurar posição do cursor
            setTimeout(() => {
                textarea.focus();
                textarea.setSelectionRange(start + tag.length, start + tag.length);
            }, 0);
        } else {
            // Fallback: adicionar no final
            setEditForm(prev => ({
                ...prev,
                [field]: prev[field] + tag
            }));
        }
    };

    // Selection functions
    const toggleSelectScript = (scriptId: string) => {
        const newSelected = new Set(selectedScripts);
        if (newSelected.has(scriptId)) {
            newSelected.delete(scriptId);
        } else {
            newSelected.add(scriptId);
        }
        setSelectedScripts(newSelected);
        setSelectAll(newSelected.size === scripts.length);
    };

    const toggleSelectAll = () => {
        if (selectAll) {
            setSelectedScripts(new Set());
        } else {
            setSelectedScripts(new Set(scripts.map(script => script.id)));
        }
        setSelectAll(!selectAll);
    };

    // Confirmation modal functions
    const openConfirmModal = (type: 'single' | 'multiple', scriptId?: string, count?: number) => {
        const actualDeleteSingle = async () => {
            setDeleting(true);
            try {
                const response = await fetch(`/api/scripts/${scriptId}`, {
                    method: 'DELETE',
                });

                if (response.ok) {
                    setMessage({ type: 'success', text: 'Script deletado com sucesso!' });
                    fetchScripts();
                    if (selectedScript?.id === scriptId) {
                        closeModal();
                    }
                } else {
                    setMessage({ type: 'error', text: 'Erro ao deletar script' });
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
                const response = await fetch('/api/scripts', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ids: Array.from(selectedScripts) }),
                });

                if (response.ok) {
                    const data = await response.json();
                    setMessage({ type: 'success', text: data.message });
                    fetchScripts();
                } else {
                    setMessage({ type: 'error', text: 'Erro ao deletar scripts' });
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
            scriptId,
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
    const deleteScript = async (scriptId: string) => {
        openConfirmModal('single', scriptId);
    };

    const deleteSelectedScripts = async () => {
        if (selectedScripts.size === 0) return;
        const count = selectedScripts.size;
        openConfirmModal('multiple', undefined, count);
    };

    // Copy function
    const copyScript = async (content: string, scriptId: string) => {
        try {
            await navigator.clipboard.writeText(content);
            setCopiedScript(scriptId);
            setTimeout(() => setCopiedScript(null), 2000);
        } catch {
            setMessage({ type: 'error', text: 'Erro ao copiar para área de transferência' });
        }
    };

    const getEmailTypeLabel = (type: string) => {
        const labels = {
            cold_outreach: 'Primeiro Contato',
            follow_up: 'Follow-up',
            introduction: 'Apresentação',
            meeting_request: 'Agendamento',
        };
        return labels[type as keyof typeof labels] || type;
    };

    const getEmailTypeColor = (type: string) => {
        switch (type) {
            case 'cold_outreach':
                return 'bg-blue-900/20 text-blue-300 border-blue-700';
            case 'follow_up':
                return 'bg-green-900/20 text-green-300 border-green-700';
            case 'introduction':
                return 'bg-purple-900/20 text-purple-300 border-purple-700';
            case 'meeting_request':
                return 'bg-yellow-900/20 text-yellow-300 border-yellow-700';
            default:
                return 'bg-neutral-900/20 text-neutral-300 border-neutral-700';
        }
    };

    // Função para detectar se é um script genérico (com placeholders)
    const isGenericScript = (script: Script) => {
        const placeholders = [
            '[Nome do Contato]',
            '[Nome da Empresa]',
            '[Nicho/Setor]',
            '[Cargo]',
            '[Email]',
            '[Website]',
            '[Pontos de Dor]'
        ];

        return placeholders.some(placeholder =>
            script.prospectData?.contactName?.includes(placeholder) ||
            script.prospectData?.companyName?.includes(placeholder) ||
            script.prospectData?.niche?.includes(placeholder)
        );
    };

    return (
        <MainLayout>
            <div className="p-8">
                <div className="max-w-6xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-white mb-2">
                            Meus Scripts
                        </h1>
                        <p className="text-neutral-400">
                            Gerencie e visualize todos os seus scripts de email criados
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

                    {/* Filters and Search */}
                    <div className="bg-neutral-gradient rounded-lg p-6 border border-neutral-800 mb-6">
                        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1">
                                <div className="relative">
                                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400 pointer-events-none" />
                                    <input
                                        type="text"
                                        placeholder="Buscar scripts..."
                                        className="w-full pl-10 pr-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-white cursor-text"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <select
                                    className="px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:border-white cursor-pointer"
                                    value={emailType}
                                    onChange={(e) => setEmailType(e.target.value)}
                                >
                                    <option value="">Todos os tipos</option>
                                    <option value="cold_outreach">Primeiro Contato</option>
                                    <option value="follow_up">Follow-up</option>
                                    <option value="introduction">Apresentação</option>
                                    <option value="meeting_request">Agendamento</option>
                                </select>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white hover:bg-neutral-700 transition-colors cursor-pointer"
                                >
                                    <Filter className="h-4 w-4" />
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Scripts List */}
                    {loading ? (
                        <div className="bg-neutral-gradient rounded-lg p-12 border border-neutral-800 text-center">
                            <div className="text-neutral-400">Carregando scripts...</div>
                        </div>
                    ) : scripts.length === 0 ? (
                        <div className="bg-neutral-gradient rounded-lg p-12 border border-neutral-800 text-center">
                            <FileText className="h-16 w-16 text-neutral-500 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-white mb-2">
                                Nenhum script encontrado
                            </h3>
                            <p className="text-neutral-400 mb-6">
                                {search || emailType
                                    ? 'Nenhum script corresponde aos filtros aplicados.'
                                    : 'Você ainda não criou nenhum script. Comece criando seu primeiro email personalizado.'
                                }
                            </p>
                            <a
                                href="/create"
                                className="inline-flex items-center px-6 py-3 bg-white text-black font-medium rounded-lg hover:bg-neutral-200 transition-colors cursor-pointer"
                            >
                                Criar Primeiro Script
                            </a>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {/* Select All Header - Mais Compacto */}
                            <div className="flex items-center justify-between p-3 bg-neutral-800 rounded-lg">
                                <CustomCheckbox
                                    checked={selectAll}
                                    onChange={toggleSelectAll}
                                    label={`Selecionar todos (${scripts.length} scripts)`}
                                />
                                {selectedScripts.size > 0 && (
                                    <div className="flex items-center gap-3">
                                        <span className="text-blue-300 text-sm">
                                            {selectedScripts.size} script(s) selecionado(s)
                                        </span>
                                        <button
                                            onClick={deleteSelectedScripts}
                                            disabled={deleting}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed text-sm"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                            {deleting ? 'Deletando...' : 'Deletar'}
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Lista de Scripts - Layout Compacto */}
                            {scripts.map((script) => (
                                <div
                                    key={script.id}
                                    className={`bg-neutral-gradient rounded-xl p-4 sm:p-5 border transition-all duration-200 ${selectedScripts.has(script.id)
                                        ? 'border-blue-500 bg-blue-900/10 shadow-lg shadow-blue-500/10'
                                        : 'border-neutral-800 hover:border-neutral-700 hover:bg-neutral-800/30'
                                        }`}
                                >
                                    <div className="flex flex-col gap-4">
                                        {/* Header Row: Checkbox + Assunto + Badges + Actions */}
                                        <div className="flex items-start gap-3">
                                            {/* Checkbox */}
                                            <div className="flex-shrink-0 mt-1">
                                                <CustomCheckbox
                                                    checked={selectedScripts.has(script.id)}
                                                    onChange={() => toggleSelectScript(script.id)}
                                                />
                                            </div>

                                            {/* Main Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                                                    {/* Left Side: Title + Badges */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                                                            <h3 className="text-lg font-semibold text-white truncate">
                                                                {script.subject}
                                                            </h3>
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <span className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${getEmailTypeColor(script.emailType)} flex items-center gap-1.5`}>
                                                                    <Hash className="h-3 w-3" />
                                                                    {getEmailTypeLabel(script.emailType)}
                                                                </span>
                                                                {isGenericScript(script) && (
                                                                    <span className="px-2.5 py-1 rounded-lg text-xs font-medium border bg-emerald-900/20 text-emerald-300 border-emerald-700 flex items-center gap-1.5">
                                                                        <Target className="h-3 w-3" />
                                                                        <span className="hidden sm:inline">Template Reutilizável</span>
                                                                        <span className="sm:hidden">Template</span>
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Right Side: Actions */}
                                                    <div className="flex gap-2 flex-shrink-0">
                                                        <button
                                                            onClick={() => openModal(script.id)}
                                                            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-neutral-800 text-white rounded-lg hover:bg-neutral-700 transition-all border border-neutral-600 text-xs font-medium"
                                                            title="Visualizar script"
                                                        >
                                                            <Eye className="h-3.5 w-3.5" />
                                                            <span className="hidden sm:inline">Ver</span>
                                                        </button>
                                                        <button
                                                            onClick={() => openEditModal(script.id)}
                                                            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all text-xs font-medium"
                                                            title="Editar script"
                                                        >
                                                            <Edit3 className="h-3.5 w-3.5" />
                                                            <span className="hidden sm:inline">Editar</span>
                                                        </button>
                                                        <button
                                                            onClick={() => deleteScript(script.id)}
                                                            disabled={deleting}
                                                            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                                            title="Deletar script"
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                            <span className="hidden sm:inline">Deletar</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Content Preview */}
                                        <div className="pl-7 sm:pl-8">
                                            <div className="flex items-start gap-3 mb-3">
                                                <FileText className="h-4 w-4 text-neutral-500 mt-0.5 flex-shrink-0" />
                                                <p className="text-sm text-neutral-400 leading-relaxed">
                                                    <span className="block sm:hidden">
                                                        {script.body.length > 120
                                                            ? `${script.body.substring(0, 120)}...`
                                                            : script.body
                                                        }
                                                    </span>
                                                    <span className="hidden sm:block">
                                                        {script.body.length > 200
                                                            ? `${script.body.substring(0, 200)}...`
                                                            : script.body
                                                        }
                                                    </span>
                                                </p>
                                            </div>
                                        </div>

                                        {/* Footer: Contact + Meta Info */}
                                        <div className="pl-7 sm:pl-8 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-neutral-800/50">
                                            {/* Left: Contact Info */}
                                            <div className="flex flex-wrap items-center gap-4">
                                                {!isGenericScript(script) && (
                                                    <>
                                                        {script.prospectData?.contactName && (
                                                            <div className="flex items-center gap-1.5 text-sm text-neutral-300">
                                                                <User className="h-3.5 w-3.5 text-neutral-500" />
                                                                <span className="truncate">{script.prospectData.contactName}</span>
                                                            </div>
                                                        )}
                                                        {script.prospectData?.companyName && (
                                                            <div className="flex items-center gap-1.5 text-sm text-neutral-300">
                                                                <Building className="h-3.5 w-3.5 text-neutral-500" />
                                                                <span className="truncate">{script.prospectData.companyName}</span>
                                                            </div>
                                                        )}
                                                        {script.prospectData?.niche && (
                                                            <div className="flex items-center gap-1.5">
                                                                <Tag className="h-3.5 w-3.5 text-neutral-500" />
                                                                <span className="px-2 py-1 bg-neutral-800/60 text-neutral-300 rounded-md border border-neutral-600/50 text-xs">
                                                                    {script.prospectData.niche}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                                {isGenericScript(script) && (
                                                    <div className="flex items-center gap-1.5 text-emerald-400 text-sm font-medium">
                                                        <Target className="h-4 w-4" />
                                                        <span>Pronto para personalização</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Right: Meta Info */}
                                            <div className="flex items-center gap-4 text-xs text-neutral-500">
                                                {script.tone && (
                                                    <div className="hidden sm:flex items-center gap-1.5">
                                                        <Settings className="h-3.5 w-3.5" />
                                                        <span className="capitalize">Tom: {script.tone}</span>
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-1.5">
                                                    <Clock className="h-3.5 w-3.5" />
                                                    <span className="hidden sm:inline">
                                                        {new Date(script.createdAt).toLocaleDateString('pt-BR')}
                                                    </span>
                                                    <span className="sm:hidden">
                                                        {new Date(script.createdAt).toLocaleDateString('pt-BR', {
                                                            day: '2-digit',
                                                            month: '2-digit'
                                                        })}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    {scripts.length > 0 && totalPages > 1 && (
                        <div className="mt-8 flex items-center justify-center">
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    className="px-3 py-2 bg-neutral-800 text-white rounded-lg hover:bg-neutral-700 transition-colors border border-neutral-600 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                >
                                    Anterior
                                </button>
                                <span className="px-4 py-2 text-neutral-400 select-none">
                                    Página {currentPage} de {totalPages}
                                </span>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages}
                                    className="px-3 py-2 bg-neutral-800 text-white rounded-lg hover:bg-neutral-700 transition-colors border border-neutral-600 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                >
                                    Próxima
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Modal */}
                {showModal && selectedScript && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                        <div className="bg-neutral-900 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-neutral-700/50 shadow-2xl">
                            {/* Modal Header */}
                            <div className="p-4 sm:p-6 border-b border-neutral-700/50 bg-gradient-to-r from-neutral-800/50 to-neutral-900/50">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg">
                                                <FileText className="h-5 w-5 text-white" />
                                            </div>
                                            <h2 className="text-xl sm:text-2xl font-bold text-white truncate">
                                                Visualizar Script
                                            </h2>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getEmailTypeColor(selectedScript.emailType)}`}>
                                                {getEmailTypeLabel(selectedScript.emailType)}
                                            </span>
                                            {isGenericScript(selectedScript) && (
                                                <span className="px-3 py-1 rounded-full text-xs font-medium border bg-emerald-900/20 text-emerald-300 border-emerald-700 flex items-center gap-1">
                                                    <Tag className="h-3 w-3" />
                                                    Template
                                                </span>
                                            )}
                                            <span className="text-xs text-neutral-400 bg-neutral-800/50 px-2 py-1 rounded-lg">
                                                {new Date(selectedScript.createdAt).toLocaleDateString('pt-BR')}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={closeModal}
                                        className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-all"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Modal Content */}
                            <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                                <div className="space-y-6">
                                    {/* Info Cards */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                        {/* Prospect Info */}
                                        <div className="bg-gradient-to-br from-blue-900/20 to-blue-800/10 rounded-xl p-4 border border-blue-700/30">
                                            <h3 className="flex items-center gap-2 text-blue-200 font-semibold mb-3">
                                                <User className="h-4 w-4" />
                                                Dados do Prospect
                                            </h3>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-neutral-400">Nome:</span>
                                                    <span className="text-white font-medium">{selectedScript.prospectData?.contactName || 'N/A'}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-neutral-400">Empresa:</span>
                                                    <span className="text-white font-medium">{selectedScript.prospectData?.companyName || 'N/A'}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-neutral-400">Nicho:</span>
                                                    <span className="text-white font-medium">{selectedScript.prospectData?.niche || 'N/A'}</span>
                                                </div>
                                                {selectedScript.prospectData?.position && (
                                                    <div className="flex justify-between">
                                                        <span className="text-neutral-400">Cargo:</span>
                                                        <span className="text-white font-medium">{selectedScript.prospectData.position}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Config Info */}
                                        <div className="bg-gradient-to-br from-purple-900/20 to-purple-800/10 rounded-xl p-4 border border-purple-700/30">
                                            <h3 className="flex items-center gap-2 text-purple-200 font-semibold mb-3">
                                                <Settings className="h-4 w-4" />
                                                Configurações
                                            </h3>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-neutral-400">Tipo:</span>
                                                    <span className="text-white font-medium">{getEmailTypeLabel(selectedScript.emailType)}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-neutral-400">Tom:</span>
                                                    <span className="text-white font-medium capitalize">{selectedScript.tone || 'N/A'}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-neutral-400">Tamanho:</span>
                                                    <span className="text-white font-medium capitalize">{selectedScript.length || 'N/A'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Script Content */}
                                    <div className="space-y-4">
                                        {/* Subject */}
                                        <div className="bg-neutral-800/30 rounded-xl p-4 border border-neutral-700/30">
                                            <div className="flex items-center justify-between mb-3">
                                                <h3 className="text-white font-semibold flex items-center gap-2">
                                                    <div className="p-1 bg-blue-500/20 rounded">
                                                        <Target className="h-3 w-3 text-blue-400" />
                                                    </div>
                                                    Assunto
                                                </h3>
                                                <button
                                                    onClick={() => copyScript(selectedScript.subject, `${selectedScript.id}-subject`)}
                                                    className="flex items-center gap-1 px-2 py-1 text-xs text-neutral-400 hover:text-white hover:bg-neutral-700/50 rounded-lg transition-all"
                                                >
                                                    {copiedScript === `${selectedScript.id}-subject` ? (
                                                        <><Check className="h-3 w-3" />Copiado!</>
                                                    ) : (
                                                        <><Copy className="h-3 w-3" />Copiar</>
                                                    )}
                                                </button>
                                            </div>
                                            <div className="p-3 bg-neutral-900/50 rounded-lg text-white font-medium select-text">
                                                {selectedScript.subject}
                                            </div>
                                        </div>

                                        {/* Body */}
                                        <div className="bg-neutral-800/30 rounded-xl p-4 border border-neutral-700/30">
                                            <div className="flex items-center justify-between mb-3">
                                                <h3 className="text-white font-semibold flex items-center gap-2">
                                                    <div className="p-1 bg-emerald-500/20 rounded">
                                                        <FileText className="h-3 w-3 text-emerald-400" />
                                                    </div>
                                                    Corpo do Email
                                                </h3>
                                                <button
                                                    onClick={() => copyScript(selectedScript.body, `${selectedScript.id}-body`)}
                                                    className="flex items-center gap-1 px-2 py-1 text-xs text-neutral-400 hover:text-white hover:bg-neutral-700/50 rounded-lg transition-all"
                                                >
                                                    {copiedScript === `${selectedScript.id}-body` ? (
                                                        <><Check className="h-3 w-3" />Copiado!</>
                                                    ) : (
                                                        <><Copy className="h-3 w-3" />Copiar</>
                                                    )}
                                                </button>
                                            </div>
                                            <div className="p-4 bg-neutral-900/50 rounded-lg text-neutral-300 whitespace-pre-wrap leading-relaxed select-text max-h-60 overflow-y-auto">
                                                {selectedScript.body}
                                            </div>
                                        </div>

                                        {/* Call to Action */}
                                        {selectedScript.callToAction && (
                                            <div className="bg-neutral-800/30 rounded-xl p-4 border border-neutral-700/30">
                                                <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                                                    <div className="p-1 bg-amber-500/20 rounded">
                                                        <Zap className="h-3 w-3 text-amber-400" />
                                                    </div>
                                                    Call to Action
                                                </h3>
                                                <div className="p-3 bg-neutral-900/50 rounded-lg text-neutral-300 select-text">
                                                    {selectedScript.callToAction}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="p-4 sm:p-6 border-t border-neutral-700/50 bg-neutral-900/50">
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                                    <button
                                        onClick={() => copyScript(`Assunto: ${selectedScript.subject}\n\n${selectedScript.body}`, `${selectedScript.id}-full`)}
                                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg"
                                    >
                                        {copiedScript === `${selectedScript.id}-full` ? (
                                            <><Check className="h-4 w-4" />Email Copiado!</>
                                        ) : (
                                            <><Copy className="h-4 w-4" />Copiar Email Completo</>
                                        )}
                                    </button>
                                    <div className="flex gap-2 w-full sm:w-auto">
                                        <button
                                            onClick={() => {
                                                closeModal();
                                                openEditModal(selectedScript.id);
                                            }}
                                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all"
                                        >
                                            <Edit3 className="h-4 w-4" />
                                            Editar
                                        </button>
                                        <button
                                            onClick={() => deleteScript(selectedScript.id)}
                                            disabled={deleting}
                                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all disabled:opacity-50"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            {deleting ? 'Deletando...' : 'Deletar'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Edit Modal */}
                {showEditModal && selectedScript && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                        <div className="bg-neutral-900 rounded-xl max-w-6xl w-full max-h-[90vh] overflow-hidden border border-neutral-700/50 shadow-2xl">
                            {/* Modal Header */}
                            <div className="p-4 sm:p-6 border-b border-neutral-700/50 bg-gradient-to-r from-neutral-800/50 to-neutral-900/50">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-lg shadow-lg">
                                            <Edit3 className="h-5 w-5 text-white" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl sm:text-2xl font-bold text-white">
                                                Editar Script
                                            </h2>
                                            <p className="text-neutral-400 text-sm">
                                                Modifique o conteúdo e configurações do script
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={closeEditModal}
                                        className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-all"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Modal Content */}
                            <div className="flex flex-col lg:flex-row h-[calc(90vh-200px)]">
                                {/* Left Side - Form */}
                                <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
                                    <div className="space-y-6">
                                        {/* Configuration Section */}
                                        <div className="bg-gradient-to-br from-blue-900/20 to-blue-800/10 rounded-xl p-4 border border-blue-700/30">
                                            <h3 className="text-blue-200 font-semibold mb-4 flex items-center gap-2">
                                                <Settings className="h-4 w-4" />
                                                Configurações
                                            </h3>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-white mb-2">
                                                        Tipo de Email
                                                    </label>
                                                    <select
                                                        value={editForm.emailType}
                                                        onChange={(e) => setEditForm(prev => ({ ...prev, emailType: e.target.value }))}
                                                        className="w-full px-3 py-2 bg-neutral-800/50 border border-neutral-700/50 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-all"
                                                    >
                                                        <option value="cold_outreach">Primeiro Contato</option>
                                                        <option value="follow_up">Follow-up</option>
                                                        <option value="introduction">Apresentação</option>
                                                        <option value="meeting_request">Agendamento</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-white mb-2">
                                                        Tom
                                                    </label>
                                                    <select
                                                        value={editForm.tone}
                                                        onChange={(e) => setEditForm(prev => ({ ...prev, tone: e.target.value }))}
                                                        className="w-full px-3 py-2 bg-neutral-800/50 border border-neutral-700/50 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-all"
                                                    >
                                                        <option value="professional">Profissional</option>
                                                        <option value="casual">Casual</option>
                                                        <option value="friendly">Amigável</option>
                                                        <option value="formal">Formal</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Prospect Data Section */}
                                        <div className="bg-gradient-to-br from-purple-900/20 to-purple-800/10 rounded-xl p-4 border border-purple-700/30">
                                            <h3 className="text-purple-200 font-semibold mb-4 flex items-center gap-2">
                                                <User className="h-4 w-4" />
                                                Dados do Prospect
                                            </h3>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-white mb-2">
                                                        Nome do Contato
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={editForm.prospectData.contactName}
                                                        onChange={(e) => setEditForm(prev => ({
                                                            ...prev,
                                                            prospectData: { ...prev.prospectData, contactName: e.target.value }
                                                        }))}
                                                        className="w-full px-3 py-2 bg-neutral-800/50 border border-neutral-700/50 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-all"
                                                        placeholder="Ex: João Silva ou [Nome do Contato]"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-white mb-2">
                                                        Empresa
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={editForm.prospectData.companyName}
                                                        onChange={(e) => setEditForm(prev => ({
                                                            ...prev,
                                                            prospectData: { ...prev.prospectData, companyName: e.target.value }
                                                        }))}
                                                        className="w-full px-3 py-2 bg-neutral-800/50 border border-neutral-700/50 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-all"
                                                        placeholder="Ex: Acme Corp ou [Nome da Empresa]"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-white mb-2">
                                                        Nicho/Setor
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={editForm.prospectData.niche}
                                                        onChange={(e) => setEditForm(prev => ({
                                                            ...prev,
                                                            prospectData: { ...prev.prospectData, niche: e.target.value }
                                                        }))}
                                                        className="w-full px-3 py-2 bg-neutral-800/50 border border-neutral-700/50 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-all"
                                                        placeholder="Ex: E-commerce ou [Nicho/Setor]"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-white mb-2">
                                                        Cargo
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={editForm.prospectData.position}
                                                        onChange={(e) => setEditForm(prev => ({
                                                            ...prev,
                                                            prospectData: { ...prev.prospectData, position: e.target.value }
                                                        }))}
                                                        className="w-full px-3 py-2 bg-neutral-800/50 border border-neutral-700/50 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-all"
                                                        placeholder="Ex: CEO ou [Cargo]"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Script Content Section */}
                                        <div className="bg-gradient-to-br from-emerald-900/20 to-emerald-800/10 rounded-xl p-4 border border-emerald-700/30">
                                            <h3 className="text-emerald-200 font-semibold mb-4 flex items-center gap-2">
                                                <FileText className="h-4 w-4" />
                                                Conteúdo do Script
                                            </h3>
                                            <div className="space-y-4">
                                                {/* Subject */}
                                                <div>
                                                    <label className="block text-sm font-medium text-white mb-2">
                                                        Assunto do Email
                                                    </label>
                                                    <textarea
                                                        id="subject-textarea"
                                                        value={editForm.subject}
                                                        onChange={(e) => setEditForm(prev => ({ ...prev, subject: e.target.value }))}
                                                        className="w-full px-3 py-2 bg-neutral-800/50 border border-neutral-700/50 rounded-lg text-white focus:outline-none focus:border-emerald-500 resize-none transition-all"
                                                        rows={2}
                                                        placeholder="Assunto do email..."
                                                    />
                                                </div>

                                                {/* Body */}
                                                <div>
                                                    <label className="block text-sm font-medium text-white mb-2">
                                                        Corpo do Email
                                                    </label>
                                                    <textarea
                                                        id="body-textarea"
                                                        value={editForm.body}
                                                        onChange={(e) => setEditForm(prev => ({ ...prev, body: e.target.value }))}
                                                        className="w-full px-3 py-2 bg-neutral-800/50 border border-neutral-700/50 rounded-lg text-white focus:outline-none focus:border-emerald-500 resize-none transition-all"
                                                        rows={8}
                                                        placeholder="Conteúdo do email..."
                                                    />
                                                </div>

                                                {/* Call to Action */}
                                                <div>
                                                    <label className="block text-sm font-medium text-white mb-2">
                                                        Call to Action
                                                    </label>
                                                    <textarea
                                                        id="callToAction-textarea"
                                                        value={editForm.callToAction}
                                                        onChange={(e) => setEditForm(prev => ({ ...prev, callToAction: e.target.value }))}
                                                        className="w-full px-3 py-2 bg-neutral-800/50 border border-neutral-700/50 rounded-lg text-white focus:outline-none focus:border-emerald-500 resize-none transition-all"
                                                        rows={2}
                                                        placeholder="Chamada para ação..."
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Side - Tags Panel (Hidden on Mobile) */}
                                <div className="hidden lg:block w-80 border-l border-neutral-700/50 p-4 bg-neutral-800/30 overflow-y-auto">
                                    <div className="sticky top-0">
                                        <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                                            <Tag className="h-5 w-5" />
                                            Tags Dinâmicas
                                        </h3>
                                        <p className="text-sm text-neutral-400 mb-4">
                                            Clique para inserir no campo ativo
                                        </p>

                                        <div className="space-y-4">
                                            {/* Contact Tags */}
                                            <div className="bg-neutral-900/50 rounded-lg p-3 border border-neutral-700/30">
                                                <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                                                    <User className="h-4 w-4 text-blue-400" />
                                                    Contato
                                                </h4>
                                                <div className="space-y-2">
                                                    {[
                                                        { tag: '{{contactName}}', label: 'Nome' },
                                                        { tag: '{{contactEmail}}', label: 'Email' },
                                                        { tag: '{{contactPosition}}', label: 'Cargo' }
                                                    ].map(({ tag, label }) => (
                                                        <div key={tag} className="flex items-center justify-between">
                                                            <span className="text-xs text-neutral-300">{label}</span>
                                                            <div className="flex gap-1">
                                                                <button
                                                                    onClick={() => insertTag('subject', tag)}
                                                                    className="px-2 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 rounded text-xs transition-all"
                                                                    title="Assunto"
                                                                >
                                                                    A
                                                                </button>
                                                                <button
                                                                    onClick={() => insertTag('body', tag)}
                                                                    className="px-2 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 rounded text-xs transition-all"
                                                                    title="Corpo"
                                                                >
                                                                    C
                                                                </button>
                                                                <button
                                                                    onClick={() => insertTag('callToAction', tag)}
                                                                    className="px-2 py-1 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 rounded text-xs transition-all"
                                                                    title="CTA"
                                                                >
                                                                    T
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Company Tags */}
                                            <div className="bg-neutral-900/50 rounded-lg p-3 border border-neutral-700/30">
                                                <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                                                    <Building className="h-4 w-4 text-purple-400" />
                                                    Empresa
                                                </h4>
                                                <div className="space-y-2">
                                                    {[
                                                        { tag: '{{companyName}}', label: 'Nome' },
                                                        { tag: '{{companyWebsite}}', label: 'Website' },
                                                        { tag: '{{companyIndustry}}', label: 'Setor' }
                                                    ].map(({ tag, label }) => (
                                                        <div key={tag} className="flex items-center justify-between">
                                                            <span className="text-xs text-neutral-300">{label}</span>
                                                            <div className="flex gap-1">
                                                                <button
                                                                    onClick={() => insertTag('subject', tag)}
                                                                    className="px-2 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 rounded text-xs transition-all"
                                                                >
                                                                    A
                                                                </button>
                                                                <button
                                                                    onClick={() => insertTag('body', tag)}
                                                                    className="px-2 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 rounded text-xs transition-all"
                                                                >
                                                                    C
                                                                </button>
                                                                <button
                                                                    onClick={() => insertTag('callToAction', tag)}
                                                                    className="px-2 py-1 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 rounded text-xs transition-all"
                                                                >
                                                                    T
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="p-4 sm:p-6 border-t border-neutral-700/50 bg-neutral-900/50">
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                                    <div className="text-sm text-neutral-400 hidden lg:block">
                                        <span className="font-medium">Dica:</span> Use A (Assunto), C (Corpo), T (CTA) para inserir tags
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                                        <button
                                            onClick={closeEditModal}
                                            disabled={saving}
                                            className="w-full sm:w-auto px-4 py-2 bg-neutral-800 text-white rounded-lg hover:bg-neutral-700 transition-all border border-neutral-600 disabled:opacity-50"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            onClick={saveScript}
                                            disabled={saving || !editForm.subject || !editForm.body}
                                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg hover:from-emerald-700 hover:to-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                                        >
                                            {saving ? (
                                                <>
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                    Salvando...
                                                </>
                                            ) : (
                                                <>
                                                    <Save className="h-4 w-4" />
                                                    Salvar Alterações
                                                </>
                                            )}
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
                            <div className="p-6 border-b border-neutral-700">
                                <h2 className="text-xl font-bold text-white">
                                    Confirmar Exclusão
                                </h2>
                            </div>

                            {/* Modal Content */}
                            <div className="p-6">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center">
                                        <Trash2 className="h-6 w-6 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-white font-medium mb-1">
                                            {confirmAction.type === 'single'
                                                ? 'Deletar script?'
                                                : `Deletar ${confirmAction.count} scripts?`
                                            }
                                        </p>
                                        <p className="text-neutral-400 text-sm">
                                            {confirmAction.type === 'single'
                                                ? 'Esta ação não pode ser desfeita.'
                                                : `Todos os ${confirmAction.count} scripts selecionados serão deletados permanentemente.`
                                            }
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="p-6 border-t border-neutral-700 flex items-center justify-end gap-3">
                                <button
                                    onClick={closeConfirmModal}
                                    disabled={deleting}
                                    className="px-4 py-2 bg-neutral-800 text-white rounded-lg hover:bg-neutral-700 transition-colors border border-neutral-600 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={confirmAction.onConfirm}
                                    disabled={deleting}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
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