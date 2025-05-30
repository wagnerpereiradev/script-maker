'use client';

import { useEffect, useState, useCallback } from 'react';
import MainLayout from '@/components/MainLayout';
import { Search, Filter, Mail, Calendar, User, Building, Eye, X, Check, Clock, AlertCircle, Send, ExternalLink, TrendingUp, Activity, Zap, ChevronRight } from 'lucide-react';

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

// Componente de Timeline de Status do Email
const EmailStatusTimeline = ({ email }: { email: SentEmail }) => {
    const steps = [
        {
            id: 'pending',
            label: 'Criado',
            description: 'Email foi criado',
            icon: Clock,
            timestamp: email.createdAt,
            completed: true
        },
        {
            id: 'sent',
            label: 'Enviado',
            description: 'Email foi enviado pelo servidor',
            icon: Send,
            timestamp: email.sentAt,
            completed: ['sent', 'delivered', 'opened', 'clicked'].includes(email.status)
        },
        {
            id: 'delivered',
            label: 'Entregue',
            description: 'Email chegou na caixa de entrada',
            icon: Check,
            timestamp: email.deliveredAt,
            completed: ['delivered', 'opened', 'clicked'].includes(email.status)
        },
        {
            id: 'opened',
            label: 'Aberto',
            description: 'Destinatário abriu o email',
            icon: Eye,
            timestamp: email.openedAt,
            completed: email.opened || ['opened', 'clicked'].includes(email.status)
        },
        {
            id: 'clicked',
            label: 'Clicado',
            description: 'Destinatário clicou em um link',
            icon: ExternalLink,
            timestamp: email.clickedAt,
            completed: email.clicked || email.status === 'clicked'
        }
    ];

    const isError = ['failed', 'bounced'].includes(email.status);
    const currentStep = email.status;

    return (
        <div className="bg-neutral-800/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Activity className="h-4 w-4 text-blue-400" />
                    Linha do Tempo do Email
                </h4>
                {isError && (
                    <div className="flex items-center gap-1 px-2 py-1 bg-red-900/50 text-red-300 rounded text-xs border border-red-700">
                        <AlertCircle className="h-3 w-3" />
                        {email.status === 'failed' ? 'Falhou' : 'Rejeitado'}
                    </div>
                )}
            </div>

            <div className="space-y-3">
                {steps.map((step, index) => {
                    const Icon = step.icon;
                    const isCurrentStep = currentStep === step.id;
                    const isActive = step.completed || isCurrentStep;
                    const showError = isError && step.id === 'sent';

                    return (
                        <div key={step.id} className="flex items-start gap-3 relative">
                            {/* Conectores entre steps */}
                            {index < steps.length - 1 && (
                                <div className={`absolute left-4 top-8 w-0.5 h-6 ${isActive && !isError ? 'bg-blue-500' : 'bg-neutral-600'}`} />
                            )}

                            {/* Ícone do step */}
                            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border-2 ${showError
                                ? 'bg-red-900/50 border-red-600 text-red-300'
                                : isActive
                                    ? isCurrentStep
                                        ? 'bg-blue-600 border-blue-500 text-white animate-pulse'
                                        : 'bg-green-600 border-green-500 text-white'
                                    : 'bg-neutral-700 border-neutral-600 text-neutral-400'
                                }`}>
                                {showError ? (
                                    <X className="h-4 w-4" />
                                ) : isActive && !isCurrentStep ? (
                                    <Check className="h-3 w-3" />
                                ) : (
                                    <Icon className="h-3 w-3" />
                                )}
                            </div>

                            {/* Conteúdo do step */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                    <div className={`text-sm font-medium ${isActive ? 'text-white' : 'text-neutral-400'}`}>
                                        {step.label}
                                        {isCurrentStep && !isError && (
                                            <span className="ml-2 px-2 py-0.5 bg-blue-900/50 text-blue-300 rounded text-xs border border-blue-700">
                                                Atual
                                            </span>
                                        )}
                                    </div>
                                    {step.timestamp && (
                                        <div className="text-xs text-neutral-500">
                                            {new Date(step.timestamp).toLocaleString('pt-BR', {
                                                day: '2-digit',
                                                month: '2-digit',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </div>
                                    )}
                                </div>
                                <div className={`text-xs ${isActive ? 'text-neutral-300' : 'text-neutral-500'}`}>
                                    {showError ? email.errorMessage || 'Falha no envio do email' : step.description}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// Componente de Status Badge Melhorado
const StatusBadge = ({ email }: { email: SentEmail }) => {
    const getStatusConfig = (status: string) => {
        const configs = {
            pending: {
                label: 'Pendente',
                icon: Clock,
                color: 'bg-yellow-900/50 text-yellow-300 border-yellow-700',
                pulse: false
            },
            sending: {
                label: 'Enviando',
                icon: Send,
                color: 'bg-blue-900/50 text-blue-300 border-blue-700',
                pulse: true
            },
            sent: {
                label: 'Enviado',
                icon: Send,
                color: 'bg-green-900/50 text-green-300 border-green-700',
                pulse: false
            },
            delivered: {
                label: 'Entregue',
                icon: Check,
                color: 'bg-green-900/50 text-green-300 border-green-700',
                pulse: false
            },
            opened: {
                label: 'Aberto',
                icon: Eye,
                color: 'bg-purple-900/50 text-purple-300 border-purple-700',
                pulse: false
            },
            clicked: {
                label: 'Clicado',
                icon: ExternalLink,
                color: 'bg-indigo-900/50 text-indigo-300 border-indigo-700',
                pulse: false
            },
            bounced: {
                label: 'Rejeitado',
                icon: AlertCircle,
                color: 'bg-orange-900/50 text-orange-300 border-orange-700',
                pulse: false
            },
            failed: {
                label: 'Falhou',
                icon: X,
                color: 'bg-red-900/50 text-red-300 border-red-700',
                pulse: false
            }
        };
        return configs[status as keyof typeof configs] || configs.pending;
    };

    const config = getStatusConfig(email.status);
    const Icon = config.icon;

    return (
        <div className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium border ${config.color} ${config.pulse ? 'animate-pulse' : ''}`}>
            <Icon className="h-3 w-3" />
            <span>{config.label}</span>
            {email.opened && email.status !== 'opened' && email.status !== 'clicked' && (
                <div className="w-1 h-1 bg-purple-400 rounded-full ml-1" title="Email foi aberto" />
            )}
            {email.clicked && email.status !== 'clicked' && (
                <div className="w-1 h-1 bg-indigo-400 rounded-full ml-1" title="Links foram clicados" />
            )}
        </div>
    );
};

// Componente de Métricas de Engajamento
const EngagementMetrics = ({ stats }: {
    stats: {
        total: number;
        sent: number;
        delivered: number;
        opened: number;
        clicked: number;
        failed: number;
        pending: number;
    }
}) => {
    const deliveryRate = stats.total > 0 ? (stats.delivered / stats.total * 100) : 0;
    const openRate = stats.delivered > 0 ? (stats.opened / stats.delivered * 100) : 0;
    const clickRate = stats.opened > 0 ? (stats.clicked / stats.opened * 100) : 0;

    return (
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
            <div className="bg-neutral-gradient rounded-lg p-4 border border-neutral-800">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-neutral-400 text-sm">Total</p>
                        <p className="text-2xl font-bold text-white">{stats.total}</p>
                    </div>
                    <Mail className="h-8 w-8 text-blue-400" />
                </div>
            </div>

            <div className="bg-neutral-gradient rounded-lg p-4 border border-neutral-800">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-neutral-400 text-sm">Entregues</p>
                        <p className="text-2xl font-bold text-green-300">{stats.delivered}</p>
                        <p className="text-xs text-neutral-500">{deliveryRate.toFixed(1)}%</p>
                    </div>
                    <Check className="h-8 w-8 text-green-400" />
                </div>
            </div>

            <div className="bg-neutral-gradient rounded-lg p-4 border border-neutral-800">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-neutral-400 text-sm">Abertos</p>
                        <p className="text-2xl font-bold text-purple-300">{stats.opened}</p>
                        <p className="text-xs text-neutral-500">{openRate.toFixed(1)}%</p>
                    </div>
                    <Eye className="h-8 w-8 text-purple-400" />
                </div>
            </div>

            <div className="bg-neutral-gradient rounded-lg p-4 border border-neutral-800">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-neutral-400 text-sm">Clicados</p>
                        <p className="text-2xl font-bold text-indigo-300">{stats.clicked}</p>
                        <p className="text-xs text-neutral-500">{clickRate.toFixed(1)}%</p>
                    </div>
                    <ExternalLink className="h-8 w-8 text-indigo-400" />
                </div>
            </div>

            <div className="bg-neutral-gradient rounded-lg p-4 border border-neutral-800">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-neutral-400 text-sm">Falharam</p>
                        <p className="text-2xl font-bold text-red-300">{stats.failed}</p>
                        <p className="text-xs text-neutral-500">{stats.total > 0 ? (stats.failed / stats.total * 100).toFixed(1) : 0}%</p>
                    </div>
                    <AlertCircle className="h-8 w-8 text-red-400" />
                </div>
            </div>

            <div className="bg-neutral-gradient rounded-lg p-4 border border-neutral-800">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-neutral-400 text-sm">Performance</p>
                        <p className="text-2xl font-bold text-blue-300">{((deliveryRate + openRate + clickRate) / 3).toFixed(0)}%</p>
                        <p className="text-xs text-neutral-500">Média geral</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-blue-400" />
                </div>
            </div>
        </div>
    );
};

export default function SentEmails() {
    const [emails, setEmails] = useState<SentEmail[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [globalStats, setGlobalStats] = useState({
        total: 0,
        sent: 0,
        delivered: 0,
        opened: 0,
        clicked: 0,
        failed: 0,
        pending: 0,
    });

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
                setGlobalStats(data.stats);
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
                    <EngagementMetrics stats={globalStats} />

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
                                return (
                                    <div
                                        key={email.id}
                                        className="bg-neutral-gradient rounded-lg p-4 border border-neutral-800 hover:border-neutral-700 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            {/* Status Icon */}
                                            <div className="flex-shrink-0">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getStatusColor(email.status)}`}>
                                                    <div className="w-4 h-4">
                                                        {email.status === 'pending' && <Clock className="w-4 h-4" />}
                                                        {email.status === 'sending' && <Send className="w-4 h-4" />}
                                                        {['sent', 'delivered'].includes(email.status) && <Check className="w-4 h-4" />}
                                                        {email.status === 'opened' && <Eye className="w-4 h-4" />}
                                                        {email.status === 'clicked' && <ExternalLink className="w-4 h-4" />}
                                                        {email.status === 'bounced' && <AlertCircle className="w-4 h-4" />}
                                                        {email.status === 'failed' && <X className="w-4 h-4" />}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Email Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1 min-w-0 pr-4">
                                                        {/* Linha 1: Assunto + Status */}
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <h3 className="text-base font-semibold text-white truncate">
                                                                {email.subject}
                                                            </h3>
                                                            <StatusBadge email={email} />
                                                        </div>

                                                        {/* Linha 2: Destinatário + Empresa */}
                                                        <div className="flex items-center gap-4 mb-2">
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

                                                        {/* Linha 3: Informações detalhadas do status */}
                                                        <div className="flex items-center gap-4 mb-2">
                                                            {email.sentAt && (
                                                                <div className="flex items-center gap-1 text-xs text-neutral-400">
                                                                    <Send className="h-3 w-3" />
                                                                    <span>Enviado: {new Date(email.sentAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                                                                </div>
                                                            )}
                                                            {email.deliveredAt && (
                                                                <div className="flex items-center gap-1 text-xs text-green-400">
                                                                    <Check className="h-3 w-3" />
                                                                    <span>Entregue: {new Date(email.deliveredAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                                                                </div>
                                                            )}
                                                            {email.openedAt && (
                                                                <div className="flex items-center gap-1 text-xs text-purple-400">
                                                                    <Eye className="h-3 w-3" />
                                                                    <span>Aberto: {new Date(email.openedAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                                                                </div>
                                                            )}
                                                            {email.clickedAt && (
                                                                <div className="flex items-center gap-1 text-xs text-indigo-400">
                                                                    <ExternalLink className="h-3 w-3" />
                                                                    <span>Clicado: {new Date(email.clickedAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Linha 4: Template + Data de criação */}
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
                                                                {email.errorMessage && (
                                                                    <div className="flex items-center gap-1 text-red-400">
                                                                        <AlertCircle className="h-3 w-3" />
                                                                        <span className="truncate max-w-48">{email.errorMessage}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center text-xs text-neutral-500 flex-shrink-0">
                                                                <Calendar className="h-3 w-3 mr-1" />
                                                                {new Date(email.createdAt).toLocaleString('pt-BR')}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Action Button */}
                                                    <div className="flex-shrink-0">
                                                        <button
                                                            onClick={() => openModal(email)}
                                                            className="flex items-center gap-1.5 px-3 py-2 bg-neutral-800 text-white rounded-md hover:bg-neutral-700 transition-colors border border-neutral-600 text-xs cursor-pointer"
                                                            title="Ver detalhes e linha do tempo"
                                                        >
                                                            <Eye className="h-3.5 w-3.5" />
                                                            <span className="hidden sm:inline">Detalhes</span>
                                                            <ChevronRight className="h-3 w-3" />
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
                    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                        <div className="bg-neutral-900 rounded-xl max-w-6xl w-full max-h-[90vh] overflow-hidden border border-neutral-700 shadow-2xl">
                            {/* Modal Header */}
                            <div className="p-6 border-b border-neutral-700 flex items-center justify-between bg-gradient-to-r from-neutral-800 to-neutral-900">
                                <div className="flex items-center gap-3">
                                    <div className="flex-shrink-0">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getStatusColor(selectedEmail.status)}`}>
                                            <div className="w-5 h-5">
                                                {selectedEmail.status === 'pending' && <Clock className="w-5 h-5" />}
                                                {selectedEmail.status === 'sending' && <Send className="w-5 h-5" />}
                                                {['sent', 'delivered'].includes(selectedEmail.status) && <Check className="w-5 h-5" />}
                                                {selectedEmail.status === 'opened' && <Eye className="w-5 h-5" />}
                                                {selectedEmail.status === 'clicked' && <ExternalLink className="w-5 h-5" />}
                                                {selectedEmail.status === 'bounced' && <AlertCircle className="w-5 h-5" />}
                                                {selectedEmail.status === 'failed' && <X className="w-5 h-5" />}
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-white mb-1">
                                            {selectedEmail.subject}
                                        </h2>
                                        <div className="flex items-center gap-2">
                                            <StatusBadge email={selectedEmail} />
                                            <span className="text-neutral-400 text-sm">
                                                • {selectedEmail.toName} ({selectedEmail.contact.companyName})
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={closeModal}
                                    className="text-neutral-400 hover:text-white transition-colors p-2 hover:bg-neutral-800 rounded-lg cursor-pointer"
                                >
                                    <X className="h-6 w-6" />
                                </button>
                            </div>

                            {/* Modal Content */}
                            <div className="flex max-h-[calc(90vh-200px)]">
                                {/* Coluna esquerda - Informações */}
                                <div className="w-1/2 p-6 overflow-y-auto border-r border-neutral-700">
                                    {/* Email Details */}
                                    <div className="mb-6">
                                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                            <Mail className="h-5 w-5 text-blue-400" />
                                            Detalhes do Email
                                        </h3>

                                        <div className="space-y-4">
                                            <div className="bg-neutral-800/50 rounded-lg p-4">
                                                <h4 className="font-medium text-white mb-3">Envio</h4>
                                                <div className="space-y-2 text-sm">
                                                    <div className="flex justify-between">
                                                        <span className="text-neutral-400">Para:</span>
                                                        <span className="text-white">{selectedEmail.toName}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-neutral-400">Email:</span>
                                                        <span className="text-white">{selectedEmail.toEmail}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-neutral-400">De:</span>
                                                        <span className="text-white">{selectedEmail.fromName}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-neutral-400">Email remetente:</span>
                                                        <span className="text-white">{selectedEmail.fromEmail}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="bg-neutral-800/50 rounded-lg p-4">
                                                <h4 className="font-medium text-white mb-3">Configuração SMTP</h4>
                                                <div className="space-y-2 text-sm">
                                                    <div className="flex justify-between">
                                                        <span className="text-neutral-400">Servidor:</span>
                                                        <span className="text-white">{selectedEmail.smtpHost}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-neutral-400">Porta:</span>
                                                        <span className="text-white">{selectedEmail.smtpPort}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {selectedEmail.template && (
                                                <div className="bg-neutral-800/50 rounded-lg p-4">
                                                    <h4 className="font-medium text-white mb-3">Template</h4>
                                                    <div className="text-sm">
                                                        <span className="px-2 py-1 bg-blue-900/50 text-blue-300 rounded text-xs border border-blue-700">
                                                            {selectedEmail.template.name}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}

                                            {selectedEmail.script && (
                                                <div className="bg-neutral-800/50 rounded-lg p-4">
                                                    <h4 className="font-medium text-white mb-3">Script</h4>
                                                    <div className="text-sm">
                                                        <span className="px-2 py-1 bg-green-900/50 text-green-300 rounded text-xs border border-green-700 capitalize">
                                                            {selectedEmail.script.emailType.replace('_', ' ')}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Error Message */}
                                    {selectedEmail.errorMessage && (
                                        <div className="mb-6">
                                            <h3 className="text-lg font-semibold text-red-300 mb-4 flex items-center gap-2">
                                                <AlertCircle className="h-5 w-5" />
                                                Erro no Envio
                                            </h3>
                                            <div className="bg-red-900/50 border border-red-700 rounded-lg p-4">
                                                <p className="text-red-200 text-sm leading-relaxed">{selectedEmail.errorMessage}</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Email Content Preview */}
                                    <div>
                                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                            <Eye className="h-5 w-5 text-purple-400" />
                                            Preview do Conteúdo
                                        </h3>
                                        <div className="bg-white rounded-lg p-4 max-h-64 overflow-y-auto border border-neutral-600">
                                            {selectedEmail.htmlContent ? (
                                                <div
                                                    dangerouslySetInnerHTML={{ __html: selectedEmail.htmlContent }}
                                                    className="prose prose-sm max-w-none"
                                                    style={{ fontSize: '12px', lineHeight: '1.4' }}
                                                />
                                            ) : (
                                                <p className="text-gray-500 text-center text-sm">Nenhum conteúdo para visualizar</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Coluna direita - Timeline */}
                                <div className="w-1/2 p-6 overflow-y-auto">
                                    <div className="mb-6">
                                        <EmailStatusTimeline email={selectedEmail} />
                                    </div>

                                    {/* Métricas de performance se o email foi bem-sucedido */}
                                    {['delivered', 'opened', 'clicked'].includes(selectedEmail.status) && (
                                        <div className="bg-neutral-800/50 rounded-lg p-4">
                                            <h4 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                                                <TrendingUp className="h-4 w-4 text-green-400" />
                                                Performance do Email
                                            </h4>
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-neutral-400 text-sm">Status de entrega:</span>
                                                    <div className="flex items-center gap-1 text-green-400 text-sm">
                                                        <Check className="h-3 w-3" />
                                                        <span>Entregue com sucesso</span>
                                                    </div>
                                                </div>

                                                {selectedEmail.opened && (
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-neutral-400 text-sm">Engajamento:</span>
                                                        <div className="flex items-center gap-1 text-purple-400 text-sm">
                                                            <Eye className="h-3 w-3" />
                                                            <span>Email foi aberto</span>
                                                        </div>
                                                    </div>
                                                )}

                                                {selectedEmail.clicked && (
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-neutral-400 text-sm">Interação:</span>
                                                        <div className="flex items-center gap-1 text-indigo-400 text-sm">
                                                            <ExternalLink className="h-3 w-3" />
                                                            <span>Links foram clicados</span>
                                                        </div>
                                                    </div>
                                                )}

                                                {selectedEmail.sentAt && selectedEmail.openedAt && (
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-neutral-400 text-sm">Tempo para abertura:</span>
                                                        <span className="text-blue-400 text-sm">
                                                            {Math.round((new Date(selectedEmail.openedAt).getTime() - new Date(selectedEmail.sentAt).getTime()) / (1000 * 60))} min
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="p-6 border-t border-neutral-700 flex items-center justify-between bg-neutral-800/30">
                                <div className="text-sm text-neutral-400">
                                    ID do rastreamento: {selectedEmail.trackingId || 'N/A'}
                                </div>
                                <button
                                    onClick={closeModal}
                                    className="px-6 py-2.5 bg-white text-black rounded-lg hover:bg-neutral-200 transition-colors cursor-pointer font-medium"
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