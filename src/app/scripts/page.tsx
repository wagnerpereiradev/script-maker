'use client';

import { useEffect, useState, useCallback } from 'react';
import MainLayout from '@/components/MainLayout';
import { Search, Filter, FileText, Calendar, User, Building, Eye, Trash2, X, Copy, Check, Tag } from 'lucide-react';

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

    // Selection states
    const [selectedScripts, setSelectedScripts] = useState<Set<string>>(new Set());
    const [selectAll, setSelectAll] = useState(false);

    // UI states
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [copiedScript, setCopiedScript] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

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
                                    className={`bg-neutral-gradient rounded-lg p-4 border transition-colors ${selectedScripts.has(script.id)
                                        ? 'border-blue-500 bg-blue-900/10'
                                        : 'border-neutral-800 hover:border-neutral-700'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        {/* Checkbox */}
                                        <div className="flex-shrink-0">
                                            <CustomCheckbox
                                                checked={selectedScripts.has(script.id)}
                                                onChange={() => toggleSelectScript(script.id)}
                                            />
                                        </div>

                                        {/* Conteúdo Principal - Layout Horizontal */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between">
                                                {/* Informações do Script */}
                                                <div className="flex-1 min-w-0 pr-4">
                                                    {/* Linha 1: Assunto + Tipo + Badge Genérico */}
                                                    <div className="flex items-center gap-3 mb-1">
                                                        <h3 className="text-base font-semibold text-white truncate">
                                                            {script.subject}
                                                        </h3>
                                                        <div className="flex items-center gap-2 flex-shrink-0">
                                                            <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getEmailTypeColor(script.emailType)}`}>
                                                                {getEmailTypeLabel(script.emailType)}
                                                            </span>
                                                            {isGenericScript(script) && (
                                                                <span className="px-2 py-0.5 rounded text-xs font-medium border bg-emerald-900/20 text-emerald-300 border-emerald-700 flex items-center gap-1">
                                                                    <Tag className="h-3 w-3" />
                                                                    Template Reutilizável
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Linha 2: Contato + Empresa (só para scripts não-genéricos) */}
                                                    {!isGenericScript(script) && (
                                                        <div className="flex items-center gap-4 mb-1">
                                                            {script.prospectData?.contactName && (
                                                                <div className="flex items-center gap-1.5 text-sm text-neutral-300">
                                                                    <User className="h-3.5 w-3.5 text-neutral-500 flex-shrink-0" />
                                                                    <span className="truncate">{script.prospectData.contactName}</span>
                                                                </div>
                                                            )}
                                                            {script.prospectData?.companyName && (
                                                                <div className="flex items-center gap-1.5 text-sm text-neutral-300">
                                                                    <Building className="h-3.5 w-3.5 text-neutral-500 flex-shrink-0" />
                                                                    <span className="truncate">{script.prospectData.companyName}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Linha 3: Nicho + Tom + Data */}
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-4 text-xs text-neutral-400">
                                                            {!isGenericScript(script) && script.prospectData?.niche && (
                                                                <span className="px-2 py-0.5 bg-neutral-800 text-neutral-300 rounded text-xs border border-neutral-600 truncate">
                                                                    {script.prospectData.niche}
                                                                </span>
                                                            )}
                                                            {script.tone && (
                                                                <span className="text-neutral-500 capitalize">
                                                                    {script.tone}
                                                                </span>
                                                            )}
                                                            {isGenericScript(script) && (
                                                                <span className="text-neutral-500 text-xs">
                                                                    Pronto para personalização
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center text-xs text-neutral-500 flex-shrink-0">
                                                            <Calendar className="h-3 w-3 mr-1" />
                                                            {new Date(script.createdAt).toLocaleDateString('pt-BR')}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Botões de Ação - Compactos */}
                                                <div className="flex gap-1.5 flex-shrink-0">
                                                    <button
                                                        onClick={() => openModal(script.id)}
                                                        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-neutral-800 text-white rounded-md hover:bg-neutral-700 transition-colors border border-neutral-600 text-xs cursor-pointer"
                                                        title="Visualizar script"
                                                    >
                                                        <Eye className="h-3.5 w-3.5" />
                                                        <span className="hidden sm:inline">Ver</span>
                                                    </button>
                                                    <button
                                                        onClick={() => deleteScript(script.id)}
                                                        disabled={deleting}
                                                        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-xs disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                                                        title="Deletar script"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                        <span className="hidden sm:inline">Deletar</span>
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
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-neutral-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden border border-neutral-700">
                            {/* Modal Header */}
                            <div className="p-6 border-b border-neutral-700 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <h2 className="text-xl font-bold text-white">
                                        {selectedScript.subject}
                                    </h2>
                                    {isGenericScript(selectedScript) && (
                                        <span className="px-3 py-1 rounded-full text-sm font-medium border bg-emerald-900/20 text-emerald-300 border-emerald-700 flex items-center gap-2">
                                            <Tag className="h-4 w-4" />
                                            Template Reutilizável
                                        </span>
                                    )}
                                </div>
                                <button
                                    onClick={closeModal}
                                    className="text-neutral-400 hover:text-white transition-colors cursor-pointer"
                                >
                                    <X className="h-6 w-6" />
                                </button>
                            </div>

                            {/* Modal Content */}
                            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                                {/* Script Info */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-neutral-800 rounded-lg">
                                    <div>
                                        <h4 className="font-medium text-white mb-2">Dados do Prospect</h4>
                                        <div className="space-y-1 text-sm text-neutral-300">
                                            <p><strong>Nome:</strong> {selectedScript.prospectData?.contactName || 'N/A'}</p>
                                            <p><strong>Empresa:</strong> {selectedScript.prospectData?.companyName || 'N/A'}</p>
                                            <p><strong>Nicho:</strong> {selectedScript.prospectData?.niche || 'N/A'}</p>
                                            {selectedScript.prospectData?.position && (
                                                <p><strong>Cargo:</strong> {selectedScript.prospectData.position}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-white mb-2">Configurações</h4>
                                        <div className="space-y-1 text-sm text-neutral-300">
                                            <p><strong>Tipo:</strong> {getEmailTypeLabel(selectedScript.emailType)}</p>
                                            <p><strong>Tom:</strong> {selectedScript.tone || 'N/A'}</p>
                                            <p><strong>Tamanho:</strong> {selectedScript.length || 'N/A'}</p>
                                            <p><strong>Data:</strong> {new Date(selectedScript.createdAt).toLocaleDateString('pt-BR')}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Email Content */}
                                <div className="space-y-4">
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="font-medium text-white">Assunto</h4>
                                            <button
                                                onClick={() => copyScript(selectedScript.subject, `${selectedScript.id}-subject`)}
                                                className="flex items-center gap-1 text-xs text-neutral-400 hover:text-white transition-colors cursor-pointer"
                                            >
                                                {copiedScript === `${selectedScript.id}-subject` ? (
                                                    <>
                                                        <Check className="h-3 w-3" />
                                                        Copiado!
                                                    </>
                                                ) : (
                                                    <>
                                                        <Copy className="h-3 w-3" />
                                                        Copiar
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                        <div className="p-3 bg-neutral-800 rounded-lg text-neutral-300 font-medium cursor-text select-text">
                                            {selectedScript.subject}
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="font-medium text-white">Corpo do Email</h4>
                                            <button
                                                onClick={() => copyScript(selectedScript.body, `${selectedScript.id}-body`)}
                                                className="flex items-center gap-1 text-xs text-neutral-400 hover:text-white transition-colors cursor-pointer"
                                            >
                                                {copiedScript === `${selectedScript.id}-body` ? (
                                                    <>
                                                        <Check className="h-3 w-3" />
                                                        Copiado!
                                                    </>
                                                ) : (
                                                    <>
                                                        <Copy className="h-3 w-3" />
                                                        Copiar
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                        <div className="p-4 bg-neutral-800 rounded-lg text-neutral-300 whitespace-pre-wrap leading-relaxed cursor-text select-text">
                                            {selectedScript.body}
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="font-medium text-white mb-2">Call to Action</h4>
                                        <div className="p-3 bg-neutral-800 rounded-lg text-neutral-300 cursor-text select-text">
                                            {selectedScript.callToAction || 'Nenhum call to action definido'}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="p-6 border-t border-neutral-700 flex items-center justify-between">
                                <button
                                    onClick={() => copyScript(`${selectedScript.subject}\n\n${selectedScript.body}`, `${selectedScript.id}-full`)}
                                    className="flex items-center gap-2 px-4 py-2 bg-neutral-800 text-white rounded-lg hover:bg-neutral-700 transition-colors border border-neutral-600 cursor-pointer"
                                >
                                    {copiedScript === `${selectedScript.id}-full` ? (
                                        <>
                                            <Check className="h-4 w-4" />
                                            Copiado!
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="h-4 w-4" />
                                            Copiar Email Completo
                                        </>
                                    )}
                                </button>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => deleteScript(selectedScript.id)}
                                        disabled={deleting}
                                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                        {deleting ? 'Deletando...' : 'Deletar'}
                                    </button>
                                    <button
                                        onClick={closeModal}
                                        className="px-4 py-2 bg-white text-black rounded-lg hover:bg-neutral-200 transition-colors cursor-pointer"
                                    >
                                        Fechar
                                    </button>
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