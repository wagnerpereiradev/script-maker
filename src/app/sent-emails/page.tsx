'use client';

import { useEffect, useState, useCallback } from 'react';
import MainLayout from '@/components/MainLayout';
import { Search, Filter, Mail, Calendar, User, Building, Eye, X, Check, Clock, AlertCircle, Send, ExternalLink } from 'lucide-react';

interface SentEmail {
    id: string;
    toEmail: string;
    toName: string;
    subject: string;
    htmlContent: string;
    textContent?: string;
    fromEmail: string;
    fromName: string;
    smtpHost: string;
    smtpPort: number;
    status: string;
    sentAt?: string;
    deliveredAt?: string;
    openedAt?: string;
    clickedAt?: string;
    errorMessage?: string;
    trackingId?: string;
    opened: boolean;
    clicked: boolean;
    bounced: boolean;
    createdAt: string;
    updatedAt: string;
    contact: {
        name: string;
        email: string;
        companyName: string;
    };
    script?: {
        subject: string;
        emailType: string;
    };
    template?: {
        name: string;
    };
}

export default function SentEmails() {
    const [emails, setEmails] = useState<SentEmail[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    // Modal states
    const [selectedEmail, setSelectedEmail] = useState<SentEmail | null>(null);
    const [showModal, setShowModal] = useState(false);

    // UI states
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const fetchEmails = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: currentPage.toString(),
                limit: '10',
                ...(search && { search }),
                ...(status && { status }),
            });

            const response = await fetch(`/api/sent-emails?${params}`);
            if (response.ok) {
                const data = await response.json();
                setEmails(data.emails);
                setTotalPages(data.pagination.pages);
                setTotal(data.pagination.total);
            } else {
                setMessage({ type: 'error', text: 'Erro ao carregar emails enviados' });
            }
        } catch (error) {
            console.error('Erro ao buscar emails enviados:', error);
            setMessage({ type: 'error', text: 'Erro ao conectar com o servidor' });
        } finally {
            setLoading(false);
        }
    }, [currentPage, search, status]);

    useEffect(() => {
        fetchEmails();
    }, [fetchEmails]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setCurrentPage(1);
        fetchEmails();
    };

    // Modal functions
    const openModal = (email: SentEmail) => {
        setSelectedEmail(email);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedEmail(null);
    };

    // Status functions
    const getStatusLabel = (emailStatus: string) => {
        const labels = {
            pending: 'Pendente',
            sending: 'Enviando',
            sent: 'Enviado',
            delivered: 'Entregue',
            opened: 'Aberto',
            clicked: 'Clicado',
            bounced: 'Rejeitado',
            failed: 'Falhou',
        };
        return labels[emailStatus as keyof typeof labels] || emailStatus;
    };

    const getStatusColor = (emailStatus: string) => {
        const colors = {
            pending: 'bg-yellow-900/50 text-yellow-300 border-yellow-700',
            sending: 'bg-blue-900/50 text-blue-300 border-blue-700',
            sent: 'bg-green-900/50 text-green-300 border-green-700',
            delivered: 'bg-green-900/50 text-green-300 border-green-700',
            opened: 'bg-purple-900/50 text-purple-300 border-purple-700',
            clicked: 'bg-indigo-900/50 text-indigo-300 border-indigo-700',
            bounced: 'bg-orange-900/50 text-orange-300 border-orange-700',
            failed: 'bg-red-900/50 text-red-300 border-red-700',
        };
        return colors[emailStatus as keyof typeof colors] || 'bg-neutral-800 text-neutral-300 border-neutral-600';
    };

    const getStatusIcon = (emailStatus: string) => {
        const icons = {
            pending: Clock,
            sending: Send,
            sent: Check,
            delivered: Check,
            opened: Eye,
            clicked: ExternalLink,
            bounced: AlertCircle,
            failed: X,
        };
        return icons[emailStatus as keyof typeof icons] || Clock;
    };

    return (
        <MainLayout>
            <div className="p-8">
                <div className="max-w-6xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-white mb-2">
                            Emails Enviados
                        </h1>
                        <p className="text-neutral-400">
                            Histórico e monitoramento de todos os emails enviados
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

                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-neutral-gradient rounded-lg p-4 border border-neutral-800">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-neutral-400 text-sm">Total Enviados</p>
                                    <p className="text-2xl font-bold text-white">{total}</p>
                                </div>
                                <Mail className="h-8 w-8 text-blue-400" />
                            </div>
                        </div>
                        <div className="bg-neutral-gradient rounded-lg p-4 border border-neutral-800">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-neutral-400 text-sm">Entregues</p>
                                    <p className="text-2xl font-bold text-green-300">
                                        {emails.filter(e => ['sent', 'delivered', 'opened', 'clicked'].includes(e.status)).length}
                                    </p>
                                </div>
                                <Check className="h-8 w-8 text-green-400" />
                            </div>
                        </div>
                        <div className="bg-neutral-gradient rounded-lg p-4 border border-neutral-800">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-neutral-400 text-sm">Abertos</p>
                                    <p className="text-2xl font-bold text-purple-300">
                                        {emails.filter(e => e.opened || ['opened', 'clicked'].includes(e.status)).length}
                                    </p>
                                </div>
                                <Eye className="h-8 w-8 text-purple-400" />
                            </div>
                        </div>
                        <div className="bg-neutral-gradient rounded-lg p-4 border border-neutral-800">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-neutral-400 text-sm">Falharam</p>
                                    <p className="text-2xl font-bold text-red-300">
                                        {emails.filter(e => ['failed', 'bounced'].includes(e.status)).length}
                                    </p>
                                </div>
                                <AlertCircle className="h-8 w-8 text-red-400" />
                            </div>
                        </div>
                    </div>

                    {/* Filters and Search */}
                    <div className="bg-neutral-gradient rounded-lg p-6 border border-neutral-800 mb-6">
                        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1">
                                <div className="relative">
                                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400 pointer-events-none" />
                                    <input
                                        type="text"
                                        placeholder="Buscar por destinatário, assunto..."
                                        className="w-full pl-10 pr-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-white cursor-text"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <select
                                    className="px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:border-white cursor-pointer"
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                >
                                    <option value="">Todos os status</option>
                                    <option value="pending">Pendente</option>
                                    <option value="sending">Enviando</option>
                                    <option value="sent">Enviado</option>
                                    <option value="delivered">Entregue</option>
                                    <option value="opened">Aberto</option>
                                    <option value="clicked">Clicado</option>
                                    <option value="bounced">Rejeitado</option>
                                    <option value="failed">Falhou</option>
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

                    {/* Emails List */}
                    {loading ? (
                        <div className="bg-neutral-gradient rounded-lg p-12 border border-neutral-800 text-center">
                            <div className="text-neutral-400">Carregando emails...</div>
                        </div>
                    ) : emails.length === 0 ? (
                        <div className="bg-neutral-gradient rounded-lg p-12 border border-neutral-800 text-center">
                            <Mail className="h-16 w-16 text-neutral-500 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-white mb-2">
                                Nenhum email encontrado
                            </h3>
                            <p className="text-neutral-400 mb-6">
                                {search || status
                                    ? 'Nenhum email corresponde aos filtros aplicados.'
                                    : 'Você ainda não enviou nenhum email. Comece enviando seu primeiro email.'
                                }
                            </p>
                            <a
                                href="/send-email"
                                className="inline-flex items-center px-6 py-3 bg-white text-black font-medium rounded-lg hover:bg-neutral-200 transition-colors cursor-pointer"
                            >
                                Enviar Primeiro Email
                            </a>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {emails.map((email) => {
                                const StatusIcon = getStatusIcon(email.status);

                                return (
                                    <div
                                        key={email.id}
                                        className="bg-neutral-gradient rounded-lg p-4 border border-neutral-800 hover:border-neutral-700 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            {/* Status Icon */}
                                            <div className="flex-shrink-0">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getStatusColor(email.status)}`}>
                                                    <StatusIcon className="w-4 h-4" />
                                                </div>
                                            </div>

                                            {/* Email Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1 min-w-0 pr-4">
                                                        {/* Linha 1: Assunto + Status */}
                                                        <div className="flex items-center gap-3 mb-1">
                                                            <h3 className="text-base font-semibold text-white truncate">
                                                                {email.subject}
                                                            </h3>
                                                            <span className={`px-2 py-0.5 rounded text-xs font-medium border flex-shrink-0 ${getStatusColor(email.status)}`}>
                                                                {getStatusLabel(email.status)}
                                                            </span>
                                                        </div>

                                                        {/* Linha 2: Destinatário + Empresa */}
                                                        <div className="flex items-center gap-4 mb-1">
                                                            <div className="flex items-center gap-1.5 text-sm text-neutral-300">
                                                                <User className="h-3.5 w-3.5 text-neutral-500 flex-shrink-0" />
                                                                <span className="truncate">{email.toName} ({email.toEmail})</span>
                                                            </div>
                                                            {email.contact.companyName && (
                                                                <div className="flex items-center gap-1.5 text-sm text-neutral-300">
                                                                    <Building className="h-3.5 w-3.5 text-neutral-500 flex-shrink-0" />
                                                                    <span className="truncate">{email.contact.companyName}</span>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Linha 3: Template + Data */}
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-4 text-xs text-neutral-400">
                                                                {email.template && (
                                                                    <span className="px-2 py-0.5 bg-neutral-800 text-neutral-300 rounded text-xs border border-neutral-600 truncate">
                                                                        {email.template.name}
                                                                    </span>
                                                                )}
                                                                {email.script && (
                                                                    <span className="text-neutral-500 capitalize">
                                                                        {email.script.emailType.replace('_', ' ')}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center text-xs text-neutral-500 flex-shrink-0">
                                                                <Calendar className="h-3 w-3 mr-1" />
                                                                {email.sentAt ? new Date(email.sentAt).toLocaleString('pt-BR') : new Date(email.createdAt).toLocaleString('pt-BR')}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Action Button */}
                                                    <div className="flex-shrink-0">
                                                        <button
                                                            onClick={() => openModal(email)}
                                                            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-neutral-800 text-white rounded-md hover:bg-neutral-700 transition-colors border border-neutral-600 text-xs cursor-pointer"
                                                            title="Visualizar email"
                                                        >
                                                            <Eye className="h-3.5 w-3.5" />
                                                            <span className="hidden sm:inline">Ver</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Pagination */}
                    {emails.length > 0 && totalPages > 1 && (
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
                {showModal && selectedEmail && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-neutral-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden border border-neutral-700">
                            {/* Modal Header */}
                            <div className="p-6 border-b border-neutral-700 flex items-center justify-between">
                                <h2 className="text-xl font-bold text-white">
                                    {selectedEmail.subject}
                                </h2>
                                <button
                                    onClick={closeModal}
                                    className="text-neutral-400 hover:text-white transition-colors cursor-pointer"
                                >
                                    <X className="h-6 w-6" />
                                </button>
                            </div>

                            {/* Modal Content */}
                            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                                {/* Email Details */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-neutral-800 rounded-lg">
                                    <div>
                                        <h4 className="font-medium text-white mb-2">Informações do Envio</h4>
                                        <div className="space-y-1 text-sm text-neutral-300">
                                            <p><strong>Para:</strong> {selectedEmail.toName} ({selectedEmail.toEmail})</p>
                                            <p><strong>De:</strong> {selectedEmail.fromName} ({selectedEmail.fromEmail})</p>
                                            <p><strong>Status:</strong> <span className={`px-2 py-0.5 rounded text-xs ${getStatusColor(selectedEmail.status)}`}>{getStatusLabel(selectedEmail.status)}</span></p>
                                            <p><strong>SMTP:</strong> {selectedEmail.smtpHost}:{selectedEmail.smtpPort}</p>
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-white mb-2">Rastreamento</h4>
                                        <div className="space-y-1 text-sm text-neutral-300">
                                            <p><strong>Criado:</strong> {new Date(selectedEmail.createdAt).toLocaleString('pt-BR')}</p>
                                            {selectedEmail.sentAt && (
                                                <p><strong>Enviado:</strong> {new Date(selectedEmail.sentAt).toLocaleString('pt-BR')}</p>
                                            )}
                                            {selectedEmail.openedAt && (
                                                <p><strong>Aberto:</strong> {new Date(selectedEmail.openedAt).toLocaleString('pt-BR')}</p>
                                            )}
                                            {selectedEmail.clickedAt && (
                                                <p><strong>Clicado:</strong> {new Date(selectedEmail.clickedAt).toLocaleString('pt-BR')}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Error Message */}
                                {selectedEmail.errorMessage && (
                                    <div className="mb-6 p-4 bg-red-900/50 border border-red-700 rounded-lg">
                                        <h4 className="font-medium text-red-300 mb-2">Mensagem de Erro</h4>
                                        <p className="text-red-200 text-sm">{selectedEmail.errorMessage}</p>
                                    </div>
                                )}

                                {/* Email Content */}
                                <div>
                                    <h4 className="font-medium text-white mb-3 flex items-center gap-2">
                                        <Eye className="w-4 h-4" />
                                        Conteúdo do Email
                                    </h4>
                                    <div className="bg-white rounded-lg p-4 max-h-96 overflow-y-auto">
                                        {selectedEmail.htmlContent ? (
                                            <div
                                                dangerouslySetInnerHTML={{ __html: selectedEmail.htmlContent }}
                                                className="prose max-w-none"
                                            />
                                        ) : (
                                            <p className="text-gray-500 text-center">Nenhum conteúdo para visualizar</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="p-6 border-t border-neutral-700 flex items-center justify-end">
                                <button
                                    onClick={closeModal}
                                    className="px-4 py-2 bg-white text-black rounded-lg hover:bg-neutral-200 transition-colors cursor-pointer"
                                >
                                    Fechar
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </MainLayout>
    );
} 