'use client';

import { useEffect, useState, useCallback } from 'react';
import MainLayout from '@/components/MainLayout';
import EmailTemplatePreview from '@/components/EmailTemplatePreview';
import { Search, Filter, Mail, Calendar, User, Building, Eye, X, Check, Clock, AlertCircle, Send, ExternalLink, TrendingUp, Activity, ChevronRight, RefreshCw, FileText, Play, Pause, Copy, Code, Server, Link } from 'lucide-react';

// CSS customizado para transições suaves
const smoothTransitionStyles = `
  .smooth-refresh-transition {
    transition: opacity 0.3s ease-in-out, transform 0.2s ease-in-out;
  }
  
  .refresh-shimmer {
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.03), transparent);
    background-size: 200% 100%;
    animation: shimmer 2s infinite;
  }
  
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  
  .stagger-fade-in {
    animation: staggerFadeIn 0.4s ease-out forwards;
    opacity: 0;
    transform: translateY(10px);
  }
  
  @keyframes staggerFadeIn {
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .auto-refresh-pulse {
    animation: autoRefreshPulse 2s ease-in-out infinite;
  }
  
  @keyframes autoRefreshPulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }

  .flip-number {
    display: inline-block;
    transition: transform 0.6s ease-in-out;
    transform-style: preserve-3d;
  }

  .flip-number.flipping {
    animation: flipDigit 0.6s ease-in-out;
  }

  @keyframes flipDigit {
    0% { transform: rotateX(0deg); }
    50% { transform: rotateX(90deg); }
    100% { transform: rotateX(0deg); }
  }

  .number-container {
    perspective: 100px;
    display: inline-block;
  }
`;

// Componente para horário com animação
const AnimatedTime = ({ time }: { time: Date | null }) => {
    const [prevTime, setPrevTime] = useState<string>('');
    const [flippingDigits, setFlippingDigits] = useState<Set<number>>(new Set());

    const timeStr = time ? time.toLocaleTimeString('pt-BR') : '--:--:--';

    useEffect(() => {
        if (time && prevTime && prevTime !== timeStr) {
            const newFlipping = new Set<number>();
            for (let i = 0; i < Math.min(prevTime.length, timeStr.length); i++) {
                if (prevTime[i] !== timeStr[i] && /\d/.test(timeStr[i])) {
                    newFlipping.add(i);
                }
            }
            setFlippingDigits(newFlipping);

            setTimeout(() => {
                setFlippingDigits(new Set());
            }, 600);
        }
        if (time) {
            setPrevTime(timeStr);
        }
    }, [timeStr, prevTime, time]);

    if (!time) {
        return <span className="text-neutral-400">--:--:--</span>;
    }

    return (
        <span className="font-mono text-xs">
            {timeStr.split('').map((char, index) => (
                <span
                    key={index}
                    className={`number-container ${flippingDigits.has(index) ? 'flip-number flipping' : 'flip-number'}`}
                >
                    {char}
                </span>
            ))}
        </span>
    );
};

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
    } | null;
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
            description: 'Email foi criado e adicionado à fila',
            icon: Clock,
            timestamp: email.createdAt,
            completed: true,
            duration: null
        },
        {
            id: 'sent',
            label: 'Enviado',
            description: 'Email foi processado e enviado pelo servidor SMTP',
            icon: Send,
            timestamp: email.sentAt,
            completed: ['sent', 'delivered', 'opened', 'clicked'].includes(email.status),
            duration: email.sentAt && email.createdAt ?
                Math.round((new Date(email.sentAt).getTime() - new Date(email.createdAt).getTime()) / 1000) : null
        },
        {
            id: 'delivered',
            label: 'Entregue',
            description: 'Email chegou na caixa de entrada do destinatário',
            icon: Check,
            timestamp: email.deliveredAt,
            completed: ['delivered', 'opened', 'clicked'].includes(email.status),
            duration: email.deliveredAt && email.sentAt ?
                Math.round((new Date(email.deliveredAt).getTime() - new Date(email.sentAt).getTime()) / 1000) : null
        },
        {
            id: 'opened',
            label: 'Aberto',
            description: 'Destinatário visualizou o email',
            icon: Eye,
            timestamp: email.openedAt,
            completed: email.opened || ['opened', 'clicked'].includes(email.status),
            duration: email.openedAt && email.deliveredAt ?
                Math.round((new Date(email.openedAt).getTime() - new Date(email.deliveredAt).getTime()) / 60000) : null
        },
        {
            id: 'clicked',
            label: 'Clicado',
            description: 'Destinatário interagiu com links no email',
            icon: ExternalLink,
            timestamp: email.clickedAt,
            completed: email.clicked || email.status === 'clicked',
            duration: email.clickedAt && email.openedAt ?
                Math.round((new Date(email.clickedAt).getTime() - new Date(email.openedAt).getTime()) / 60000) : null
        }
    ];

    const isError = ['failed', 'bounced'].includes(email.status);
    const currentStep = email.status;

    // Calcular tempo total de delivery
    const totalDeliveryTime = email.sentAt && email.createdAt ?
        Math.round((new Date(email.sentAt).getTime() - new Date(email.createdAt).getTime()) / 1000) : null;

    return (
        <div className="bg-neutral-800/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Activity className="h-4 w-4 text-blue-400" />
                    Linha do Tempo do Email
                </h4>
                <div className="flex items-center gap-2">
                    {isError ? (
                        <div className="flex items-center gap-1 px-2 py-1 bg-red-900/50 text-red-300 rounded text-xs border border-red-700">
                            <AlertCircle className="h-3 w-3" />
                            {email.status === 'failed' ? 'Falhou' : 'Rejeitado'}
                        </div>
                    ) : totalDeliveryTime && (
                        <div className="text-xs text-neutral-400 bg-neutral-700/50 px-2 py-1 rounded">
                            Tempo de envio: {totalDeliveryTime}s
                        </div>
                    )}
                </div>
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
                                    <div className="flex items-center gap-2">
                                        {step.duration !== null && (
                                            <div className="text-xs text-neutral-400 bg-neutral-700/30 px-2 py-0.5 rounded">
                                                {step.id === 'delivered' ?
                                                    `${step.duration}s` :
                                                    `${step.duration}min`
                                                }
                                            </div>
                                        )}
                                        {step.timestamp && (
                                            <div className="text-xs text-neutral-500">
                                                {new Date(step.timestamp).toLocaleString('pt-BR', {
                                                    day: '2-digit',
                                                    month: '2-digit',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                    second: '2-digit'
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className={`text-xs ${isActive ? 'text-neutral-300' : 'text-neutral-500'}`}>
                                    {showError ? email.errorMessage || 'Falha no envio do email' : step.description}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Resumo de Performance */}
            {!isError && email.opened && (
                <div className="mt-4 pt-3 border-t border-neutral-700">
                    <h5 className="text-xs font-semibold text-neutral-300 mb-2">Métricas de Engajamento</h5>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                        {email.openedAt && email.sentAt && (
                            <div className="bg-neutral-700/50 p-2 rounded">
                                <span className="text-neutral-400">Tempo para abertura:</span>
                                <div className="text-purple-400 font-medium">
                                    {Math.round((new Date(email.openedAt).getTime() - new Date(email.sentAt).getTime()) / 60000)} min
                                </div>
                            </div>
                        )}
                        {email.clickedAt && email.openedAt && (
                            <div className="bg-neutral-700/50 p-2 rounded">
                                <span className="text-neutral-400">Tempo para clique:</span>
                                <div className="text-indigo-400 font-medium">
                                    {Math.round((new Date(email.clickedAt).getTime() - new Date(email.openedAt).getTime()) / 60000)} min
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
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
    const [autoRefreshing, setAutoRefreshing] = useState(false);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Modal states
    const [selectedEmail, setSelectedEmail] = useState<SentEmail | null>(null);
    const [showModal, setShowModal] = useState(false);

    // Auto-refresh states
    const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
    const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
    const [totalPendingEmails, setTotalPendingEmails] = useState(0); // Total real de pendentes

    const [globalStats, setGlobalStats] = useState({
        total: 0,
        sent: 0,
        delivered: 0,
        opened: 0,
        clicked: 0,
        failed: 0,
        pending: 0,
    });

    // UI states
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Buscar total real de emails pendentes
    const fetchTotalPendingEmails = useCallback(async () => {
        try {
            const response = await fetch('/api/sent-emails?limit=1&countOnly=true');
            if (response.ok) {
                const data = await response.json();
                const pending = data.stats?.pending || 0;
                setTotalPendingEmails(pending);
                return pending;
            }
        } catch (error) {
            console.error('Erro ao buscar total de emails pendentes:', error);
        }
        return 0;
    }, []);

    // Fetch data function com parâmetro para indicar se é auto-refresh
    const fetchEmails = useCallback(async (isAutoRefresh: boolean = false) => {
        if (!isAutoRefresh) {
            setLoading(true); // Só mostra loading no carregamento inicial
        } else {
            setAutoRefreshing(true); // Indica que está fazendo auto-refresh
        }

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

                // Para auto-refresh, fazemos uma transição mais suave
                if (isAutoRefresh) {
                    // Pequeno delay para suavizar a transição
                    setTimeout(() => {
                        setEmails(data.emails);
                        setTotalPages(data.pagination.pages);
                        setGlobalStats(data.stats);
                        setLastRefreshTime(new Date());

                        // Atualiza total real de pendentes
                        setTotalPendingEmails(data.stats?.pending || 0);
                    }, 50); // Pequeno delay para suavizar
                } else {
                    // Carregamento normal
                    setEmails(data.emails);
                    setTotalPages(data.pagination.pages);
                    setGlobalStats(data.stats);
                    setLastRefreshTime(new Date());

                    // Atualiza total real de pendentes
                    setTotalPendingEmails(data.stats?.pending || 0);
                }
            } else {
                if (!isAutoRefresh) {
                    setMessage({ type: 'error', text: 'Erro ao carregar emails enviados' });
                }
            }
        } catch (error) {
            console.error('Erro ao buscar emails enviados:', error);
            if (!isAutoRefresh) {
                setMessage({ type: 'error', text: 'Erro ao conectar com o servidor' });
            }
        } finally {
            if (!isAutoRefresh) {
                setLoading(false);
            } else {
                // Pequeno delay antes de remover o estado de auto-refresh
                setTimeout(() => {
                    setAutoRefreshing(false);
                }, 100);
            }
        }
    }, [currentPage, search, status]);

    // Auto-refresh effect otimizado - funciona sempre quando habilitado
    useEffect(() => {
        let intervalId: NodeJS.Timeout | null = null;

        if (autoRefreshEnabled) {
            // Intervalo mais frequente se há emails pendentes, menos frequente se não há
            const interval = totalPendingEmails > 0 ? 3000 : 10000; // 3s ou 10s

            intervalId = setInterval(() => {
                fetchEmails(true); // Indica que é auto-refresh
            }, interval);
        }

        return () => {
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    }, [fetchEmails, autoRefreshEnabled, totalPendingEmails]);

    // Initial fetch
    useEffect(() => {
        fetchEmails(false); // Carregamento inicial
    }, [fetchEmails]);

    // Buscar total de pendentes periodicamente
    useEffect(() => {
        fetchTotalPendingEmails();
        const interval = setInterval(fetchTotalPendingEmails, 10000); // A cada 10 segundos
        return () => clearInterval(interval);
    }, [fetchTotalPendingEmails]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setCurrentPage(1);
        fetchEmails(false);
    };

    const openModal = (email: SentEmail) => {
        setSelectedEmail(email);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedEmail(null);
    };

    return (
        <MainLayout>
            {/* Estilos customizados */}
            <style jsx>{smoothTransitionStyles}</style>

            <div className="p-8">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="mb-8 flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-white mb-2">
                                Emails Enviados
                            </h1>
                            <p className="text-neutral-400">
                                Acompanhe o status e engagement dos seus emails
                            </p>
                        </div>

                        {/* Controls com indicador de auto-refresh melhorado */}
                        <div className="flex items-center gap-4">
                            {/* Indicador de Auto-refresh Melhorado - Sempre visível */}
                            <div className={`flex items-center gap-3 px-3 py-2 bg-black/90 rounded-lg border border-neutral-800 smooth-refresh-transition ${autoRefreshing ? 'border-blue-500/30' : ''
                                }`}>
                                {/* Status compacto */}
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full transition-all duration-300 ${autoRefreshing
                                        ? 'bg-blue-400 animate-pulse'
                                        : autoRefreshEnabled
                                            ? 'bg-green-400'
                                            : 'bg-neutral-500'
                                        }`}></div>
                                    <span className="text-xs text-neutral-300">
                                        {autoRefreshing ? 'Atualizando' : autoRefreshEnabled ? 'Auto-refresh' : 'Pausado'}
                                    </span>
                                </div>

                                {/* Contador de pendentes - só aparece se houver pendentes */}
                                {totalPendingEmails > 0 && (
                                    <div className="flex items-center gap-1 px-2 py-0.5 bg-orange-900/40 text-orange-300 rounded text-xs border border-orange-800/50">
                                        <Clock className="w-3 h-3" />
                                        <span>{totalPendingEmails}</span>
                                    </div>
                                )}

                                {/* Horário compacto */}
                                {lastRefreshTime && (
                                    <div className="text-neutral-400 text-xs">
                                        <AnimatedTime time={lastRefreshTime} />
                                    </div>
                                )}
                            </div>

                            {/* Controles de Auto-refresh Redesenhados */}
                            <div className="flex items-center gap-2">
                                {/* Toggle Auto-refresh */}
                                <button
                                    onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-200 ${autoRefreshEnabled
                                        ? 'bg-green-600 border-green-500 text-white hover:bg-green-700 shadow-lg shadow-green-600/20'
                                        : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:bg-neutral-700 hover:text-neutral-300'
                                        }`}
                                    title={autoRefreshEnabled ? 'Pausar auto-refresh' : 'Ativar auto-refresh'}
                                >
                                    {autoRefreshEnabled ? (
                                        <>
                                            <Pause className="h-4 w-4" />
                                            <span className="text-sm font-medium">Pausar</span>
                                        </>
                                    ) : (
                                        <>
                                            <Play className="h-4 w-4" />
                                            <span className="text-sm font-medium">Ativar</span>
                                        </>
                                    )}
                                </button>

                                {/* Refresh Manual - só aparece quando auto-refresh está desabilitado */}
                                {!autoRefreshEnabled && (
                                    <button
                                        onClick={() => fetchEmails(false)}
                                        disabled={loading}
                                        className="flex items-center gap-2 px-3 py-2 bg-blue-600 border border-blue-500 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-600/20"
                                        title="Atualizar agora"
                                    >
                                        <RefreshCw className={`h-4 w-4 transition-transform duration-200 ${loading ? 'animate-spin' : ''}`} />
                                        <span className="text-sm font-medium">Atualizar</span>
                                    </button>
                                )}
                            </div>
                        </div>
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

                    {/* Global Stats */}
                    <EngagementMetrics stats={globalStats} />

                    {/* Filters */}
                    <div className="bg-neutral-gradient rounded-lg p-6 border border-neutral-800 mb-6">
                        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1">
                                <div className="relative">
                                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400 pointer-events-none" />
                                    <input
                                        type="text"
                                        placeholder="Buscar por destinatário, assunto ou conteúdo..."
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
                                    <option value="sent">Enviado</option>
                                    <option value="delivered">Entregue</option>
                                    <option value="opened">Aberto</option>
                                    <option value="clicked">Clicado</option>
                                    <option value="failed">Falhado</option>
                                    <option value="bounced">Rejeitado</option>
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

                    {/* Lista de Emails com transições suaves */}
                    <div className={`bg-neutral-gradient rounded-lg border border-neutral-800 smooth-refresh-transition ${autoRefreshing ? 'opacity-95 refresh-shimmer' : 'opacity-100'
                        }`}>
                        {loading ? (
                            <div className="p-12 text-center">
                                <div className="inline-flex items-center gap-3 text-neutral-400">
                                    <RefreshCw className="h-5 w-5 animate-spin" />
                                    Carregando emails...
                                </div>
                            </div>
                        ) : emails.length === 0 ? (
                            <div className="p-12 text-center">
                                <div className="w-16 h-16 mx-auto mb-4 bg-neutral-800 rounded-full flex items-center justify-center">
                                    <Mail className="w-8 h-8 text-neutral-500" />
                                </div>
                                <h3 className="text-xl font-semibold text-white mb-2">
                                    Nenhum email encontrado
                                </h3>
                                <p className="text-neutral-400 mb-6">
                                    {search || status
                                        ? 'Nenhum email corresponde aos filtros aplicados.'
                                        : 'Você ainda não enviou nenhum email através da plataforma.'
                                    }
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y divide-neutral-800">
                                {emails.map((email, index) => (
                                    <div
                                        key={email.id}
                                        className={`p-6 hover:bg-neutral-800/30 transition-all duration-200 cursor-pointer transform smooth-refresh-transition stagger-fade-in ${autoRefreshing ? 'scale-[0.999]' : 'scale-100'
                                            }`}
                                        onClick={() => openModal(email)}
                                        style={{
                                            animationDelay: `${index * 50}ms`
                                        }}
                                    >
                                        <div className="flex items-center gap-3">
                                            {/* Avatar */}
                                            <div className="w-10 h-10 bg-neutral-800 rounded-full flex items-center justify-center flex-shrink-0">
                                                <User className="w-5 h-5 text-neutral-400" />
                                            </div>

                                            {/* Email Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1 min-w-0">
                                                        {/* Nome do contato - sem status badge aqui */}
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <h3 className="font-medium text-white truncate">
                                                                {email.toName || 'Sem nome'}
                                                            </h3>
                                                            {/* Engagement indicators inline com o nome */}
                                                            {email.opened && (
                                                                <div className="flex items-center gap-1 text-green-400 text-xs">
                                                                    <Eye className="w-3 h-3" />
                                                                    <span>Aberto</span>
                                                                </div>
                                                            )}
                                                            {email.clicked && (
                                                                <div className="flex items-center gap-1 text-blue-400 text-xs">
                                                                    <ExternalLink className="w-3 h-3" />
                                                                    <span>Clicado</span>
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="flex items-center gap-2 text-sm text-neutral-400 mb-1">
                                                            <span className="truncate">{email.toEmail}</span>
                                                            {email.contact?.companyName && (
                                                                <>
                                                                    <span>•</span>
                                                                    <Building className="w-3 h-3 flex-shrink-0" />
                                                                    <span className="truncate">{email.contact.companyName}</span>
                                                                </>
                                                            )}
                                                        </div>

                                                        <p className="text-neutral-300 text-sm font-medium truncate mb-2">
                                                            {email.subject}
                                                        </p>

                                                        <div className="flex items-center gap-4 text-xs text-neutral-500">
                                                            <div className="flex items-center gap-1">
                                                                <Calendar className="w-3 h-3" />
                                                                {email.sentAt
                                                                    ? new Date(email.sentAt).toLocaleString('pt-BR')
                                                                    : new Date(email.createdAt).toLocaleString('pt-BR')
                                                                }
                                                            </div>

                                                            {email.template?.name && (
                                                                <div className="flex items-center gap-1">
                                                                    <FileText className="w-3 h-3" />
                                                                    <span className="truncate max-w-[120px]">{email.template.name}</span>
                                                                </div>
                                                            )}

                                                            {email.script?.emailType && (
                                                                <div className="flex items-center gap-1">
                                                                    <Activity className="w-3 h-3" />
                                                                    <span>
                                                                        {email.script.emailType === 'cold_outreach' && 'Primeiro Contato'}
                                                                        {email.script.emailType === 'follow_up' && 'Follow-up'}
                                                                        {email.script.emailType === 'introduction' && 'Apresentação'}
                                                                        {email.script.emailType === 'meeting_request' && 'Agendamento'}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                                                        {/* Status Badge ao lado do botão de detalhes */}
                                                        <StatusBadge email={email} />

                                                        <div className="flex-shrink-0">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    openModal(email);
                                                                }}
                                                                className="flex items-center gap-1.5 px-3 py-2 bg-neutral-800 text-white rounded-md hover:bg-neutral-700 transition-colors border border-neutral-600 text-xs cursor-pointer"
                                                                title="Ver detalhes e linha do tempo"
                                                            >
                                                                <Eye className="w-3 h-3" />
                                                                Detalhes
                                                                <ChevronRight className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

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
                        <div className="bg-neutral-900 rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden border border-neutral-700">
                            {/* Modal Header */}
                            <div className="px-6 py-4 border-b border-neutral-700 flex items-center justify-between bg-gradient-to-r from-neutral-800 to-neutral-900">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                                        <Mail className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-white">
                                            Detalhes do Email
                                        </h2>
                                        <p className="text-sm text-neutral-400">
                                            {selectedEmail.toName} • {selectedEmail.toEmail}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={closeModal}
                                    className="text-neutral-400 hover:text-white transition-colors p-2 hover:bg-neutral-800 rounded-lg cursor-pointer"
                                >
                                    <X className="h-6 w-6" />
                                </button>
                            </div>

                            {/* Modal Content com Abas */}
                            <div className="flex flex-1 h-[calc(90vh-120px)]">
                                {/* Aba de Informações Gerais */}
                                <div className="w-1/2 border-r border-neutral-700 overflow-y-auto">
                                    <div className="p-6">
                                        {/* Seção: Informações Básicas */}
                                        <div className="mb-6">
                                            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                                <User className="h-5 w-5 text-blue-400" />
                                                Informações Básicas
                                            </h3>
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between p-3 bg-neutral-800/50 rounded-lg">
                                                    <span className="text-neutral-400 text-sm">ID do Email:</span>
                                                    <div className="flex items-center gap-2">
                                                        <code className="text-white bg-neutral-700 px-2 py-1 rounded text-xs font-mono">
                                                            {selectedEmail.id}
                                                        </code>
                                                        <button
                                                            onClick={() => navigator.clipboard.writeText(selectedEmail.id)}
                                                            className="text-neutral-400 hover:text-white transition-colors"
                                                            title="Copiar ID"
                                                        >
                                                            <Copy className="h-3 w-3" />
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between p-3 bg-neutral-800/50 rounded-lg">
                                                    <span className="text-neutral-400 text-sm">Para (Nome):</span>
                                                    <span className="text-white font-medium">{selectedEmail.toName}</span>
                                                </div>

                                                <div className="flex items-center justify-between p-3 bg-neutral-800/50 rounded-lg">
                                                    <span className="text-neutral-400 text-sm">Para (Email):</span>
                                                    <span className="text-white font-mono text-sm">{selectedEmail.toEmail}</span>
                                                </div>

                                                <div className="p-3 bg-neutral-800/50 rounded-lg">
                                                    <span className="text-neutral-400 text-sm block mb-2">Assunto:</span>
                                                    <span className="text-white">{selectedEmail.subject}</span>
                                                </div>

                                                <div className="flex items-center justify-between p-3 bg-neutral-800/50 rounded-lg">
                                                    <span className="text-neutral-400 text-sm">Status do Contato:</span>
                                                    <span className={`text-xs px-2 py-1 rounded font-medium ${selectedEmail.contact
                                                        ? 'bg-green-900/50 text-green-300'
                                                        : 'bg-neutral-700 text-neutral-400'
                                                        }`}>
                                                        {selectedEmail.contact ? 'Vinculado' : 'Sem contato'}
                                                    </span>
                                                </div>

                                                {selectedEmail.template && (
                                                    <div className="p-3 bg-neutral-800/50 rounded-lg">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="text-neutral-400 text-sm">Template:</span>
                                                            <span className="text-green-300 text-xs px-2 py-1 bg-green-900/50 rounded">Usado</span>
                                                        </div>
                                                        <span className="text-white font-medium">{selectedEmail.template.name}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Seção: Configurações SMTP */}
                                        <div className="mb-6">
                                            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                                <Server className="h-5 w-5 text-green-400" />
                                                Configurações SMTP
                                            </h3>
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between p-3 bg-neutral-800/50 rounded-lg">
                                                    <span className="text-neutral-400 text-sm">De (Nome):</span>
                                                    <span className="text-white font-medium">{selectedEmail.fromName}</span>
                                                </div>

                                                <div className="flex items-center justify-between p-3 bg-neutral-800/50 rounded-lg">
                                                    <span className="text-neutral-400 text-sm">De (Email):</span>
                                                    <span className="text-white font-mono text-sm">{selectedEmail.fromEmail}</span>
                                                </div>

                                                <div className="flex items-center justify-between p-3 bg-neutral-800/50 rounded-lg">
                                                    <span className="text-neutral-400 text-sm">Servidor SMTP:</span>
                                                    <span className="text-white font-mono text-sm">{selectedEmail.smtpHost}</span>
                                                </div>

                                                <div className="flex items-center justify-between p-3 bg-neutral-800/50 rounded-lg">
                                                    <span className="text-neutral-400 text-sm">Porta SMTP:</span>
                                                    <span className="text-white font-mono">{selectedEmail.smtpPort}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Seção: Tracking */}
                                        <div className="mb-6">
                                            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                                <Link className="h-5 w-5 text-purple-400" />
                                                Rastreamento
                                            </h3>
                                            <div className="space-y-3">
                                                {selectedEmail.trackingId ? (
                                                    <div className="flex items-center justify-between p-3 bg-neutral-800/50 rounded-lg">
                                                        <span className="text-neutral-400 text-sm">ID de Tracking:</span>
                                                        <div className="flex items-center gap-2">
                                                            <code className="text-white bg-neutral-700 px-2 py-1 rounded text-xs font-mono">
                                                                {selectedEmail.trackingId}
                                                            </code>
                                                            <button
                                                                onClick={() => selectedEmail.trackingId && navigator.clipboard.writeText(selectedEmail.trackingId)}
                                                                className="text-neutral-400 hover:text-white transition-colors"
                                                                title="Copiar Tracking ID"
                                                            >
                                                                <Copy className="h-3 w-3" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="p-3 bg-neutral-800/50 rounded-lg">
                                                        <span className="text-neutral-400 text-sm">Tracking não configurado</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Seção: Conteúdo de Texto */}
                                        {selectedEmail.textContent && (
                                            <div className="mb-6">
                                                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                                    <FileText className="h-5 w-5 text-orange-400" />
                                                    Conteúdo de Texto
                                                </h3>
                                                <div className="p-4 bg-neutral-800/50 rounded-lg">
                                                    <pre className="text-neutral-300 text-sm whitespace-pre-wrap font-mono leading-relaxed max-h-40 overflow-y-auto">
                                                        {selectedEmail.textContent}
                                                    </pre>
                                                </div>
                                            </div>
                                        )}

                                        {/* Timeline de Status */}
                                        <EmailStatusTimeline email={selectedEmail} />
                                    </div>
                                </div>

                                {/* Aba de Preview do HTML */}
                                <div className="w-1/2 flex flex-col">
                                    <div className="p-4 border-b border-neutral-700 bg-neutral-800/30">
                                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                            <Code className="h-5 w-5 text-indigo-400" />
                                            Preview do Email HTML
                                        </h3>
                                        <p className="text-sm text-neutral-400 mt-1">
                                            Visualização do conteúdo enviado
                                        </p>
                                    </div>

                                    <div className="flex-1">
                                        <EmailTemplatePreview
                                            sendType="individual"
                                            selectedTemplate={{
                                                id: selectedEmail.id,
                                                name: selectedEmail.template?.name || 'Email Enviado',
                                                subject: selectedEmail.subject,
                                                htmlContent: selectedEmail.htmlContent,
                                                isActive: true
                                            }}
                                            selectedScript={null}
                                            contactForPreview={selectedEmail.contact ? {
                                                id: 'preview',
                                                name: selectedEmail.contact.name,
                                                email: selectedEmail.contact.email,
                                                companyName: selectedEmail.contact.companyName,
                                                isActive: true
                                            } : null}
                                            smtpConfig={{
                                                fromEmail: selectedEmail.fromEmail,
                                                fromName: selectedEmail.fromName,
                                                host: selectedEmail.smtpHost,
                                                port: selectedEmail.smtpPort,
                                                secure: selectedEmail.smtpPort === 465
                                            }}
                                            className="h-full"
                                            title="Conteúdo do Email Enviado"
                                            showRawVariables={false}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </MainLayout>
    );
} 