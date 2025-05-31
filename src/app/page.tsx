'use client';

import { useEffect, useState } from 'react';
import MainLayout from '@/components/MainLayout';
import {
  Mail, Users, FileText, TrendingUp, Activity,
  Eye, ExternalLink, Clock, Send, AlertCircle, BarChart3,
  ArrowUpRight, ArrowDownRight, PieChart,
  Award, Rocket
} from 'lucide-react';
import Link from 'next/link';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RechartsPieChart, Cell, AreaChart, Area, Pie
} from 'recharts';
import { format, parseISO, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DashboardData {
  emails: {
    total: number;
    opened: number;
    clicked: number;
    delivered: number;
    failed: number;
    recent: Array<{
      id: string;
      toName: string;
      toEmail: string;
      subject: string;
      status: string;
      createdAt: string;
      opened: boolean;
      clicked: boolean;
      contact: {
        companyName: string;
      } | null;
    }>;
    byStatus: Record<string, number>;
    dailyStats: Array<{
      date: string;
      total: number;
      sent: number;
      opened: number;
      clicked: number;
      failed: number;
      openRate: number;
      clickRate: number;
    }>;
  };
  contacts: {
    total: number;
  };
  templates: {
    total: number;
  };
  performance: {
    deliveryRate: number;
    openRate: number;
    clickRate: number;
  };
  trends?: {
    emailsTrend: string;
    openRateTrend: string;
    clickRateTrend: string;
    contactsTrend: string;
  };
}

// Componente de Métrica Principal
const MetricCard = ({
  title,
  value,
  icon: Icon,
  trend,
  trendValue,
  color = 'blue',
  subtitle,
  loading = false
}: {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  trend?: 'up' | 'down';
  trendValue?: string;
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'neutral';
  subtitle?: string;
  loading?: boolean;
}) => {
  const colorConfigs = {
    blue: {
      gradient: 'from-blue-600/15 via-blue-500/8 to-blue-600/3',
      border: 'border-blue-500/20',
      iconBg: 'from-blue-600 to-blue-700',
      iconColor: 'text-white',
      hover: 'hover:border-blue-400/30',
      glow: 'shadow-blue-500/5'
    },
    green: {
      gradient: 'from-emerald-600/15 via-emerald-500/8 to-emerald-600/3',
      border: 'border-emerald-500/20',
      iconBg: 'from-emerald-600 to-emerald-700',
      iconColor: 'text-white',
      hover: 'hover:border-emerald-400/30',
      glow: 'shadow-emerald-500/5'
    },
    purple: {
      gradient: 'from-purple-600/15 via-purple-500/8 to-purple-600/3',
      border: 'border-purple-500/20',
      iconBg: 'from-purple-600 to-purple-700',
      iconColor: 'text-white',
      hover: 'hover:border-purple-400/30',
      glow: 'shadow-purple-500/5'
    },
    orange: {
      gradient: 'from-orange-600/15 via-orange-500/8 to-orange-600/3',
      border: 'border-orange-500/20',
      iconBg: 'from-orange-600 to-orange-700',
      iconColor: 'text-white',
      hover: 'hover:border-orange-400/30',
      glow: 'shadow-orange-500/5'
    },
    red: {
      gradient: 'from-red-600/15 via-red-500/8 to-red-600/3',
      border: 'border-red-500/20',
      iconBg: 'from-red-600 to-red-700',
      iconColor: 'text-white',
      hover: 'hover:border-red-400/30',
      glow: 'shadow-red-500/5'
    },
    neutral: {
      gradient: 'from-neutral-600/10 via-neutral-500/5 to-neutral-600/2',
      border: 'border-neutral-500/15',
      iconBg: 'from-neutral-600 to-neutral-700',
      iconColor: 'text-white',
      hover: 'hover:border-neutral-400/25',
      glow: 'shadow-neutral-500/5'
    },
  };

  const config = colorConfigs[color];

  return (
    <div className={`
      group relative overflow-hidden
      bg-gradient-to-br ${config.gradient}
      backdrop-blur-sm border ${config.border}
      rounded-xl p-5 
      transition-all duration-200 ease-out
      ${config.hover}
      hover:scale-[1.01]
      shadow-sm ${config.glow}
    `}>
      <div className="relative z-10">
        {/* Header simplificado */}
        <div className="flex items-center justify-between mb-3">
          <div className={`
            p-2.5 rounded-lg
            bg-gradient-to-br ${config.iconBg}
            shadow-sm
          `}>
            <Icon className={`h-5 w-5 ${config.iconColor}`} />
          </div>

          {trend && trendValue && (
            <div className={`
              flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium
              ${trend === 'up'
                ? 'text-emerald-400 bg-emerald-500/10'
                : 'text-red-400 bg-red-500/10'
              }
            `}>
              {trend === 'up' ? (
                <ArrowUpRight className="h-3 w-3" />
              ) : (
                <ArrowDownRight className="h-3 w-3" />
              )}
              <span>{trendValue}</span>
            </div>
          )}
        </div>

        {/* Conteúdo principal limpo */}
        <div className="space-y-1">
          <h3 className="text-neutral-400 text-xs font-medium uppercase tracking-wider">
            {title}
          </h3>

          <p className="text-2xl font-bold text-white">
            {loading ? (
              <span className="animate-pulse bg-neutral-600 rounded w-12 h-6 block"></span>
            ) : (
              value
            )}
          </p>

          {subtitle && (
            <p className="text-neutral-500 text-xs mt-2">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// Componente de Atividade Recente
const RecentActivity = ({ emails }: { emails: DashboardData['emails']['recent'] }) => {
  const getStatusConfig = (status: string) => {
    const configs = {
      pending: { label: 'Pendente', color: 'text-amber-400', bgColor: 'bg-amber-500/10', borderColor: 'border-amber-500/20', icon: Clock },
      sent: { label: 'Enviado', color: 'text-emerald-400', bgColor: 'bg-emerald-500/10', borderColor: 'border-emerald-500/20', icon: Send },
      delivered: { label: 'Entregue', color: 'text-emerald-400', bgColor: 'bg-emerald-500/10', borderColor: 'border-emerald-500/20', icon: Send },
      opened: { label: 'Aberto', color: 'text-purple-400', bgColor: 'bg-purple-500/10', borderColor: 'border-purple-500/20', icon: Eye },
      clicked: { label: 'Clicado', color: 'text-blue-400', bgColor: 'bg-blue-500/10', borderColor: 'border-blue-500/20', icon: ExternalLink },
      failed: { label: 'Falhou', color: 'text-red-400', bgColor: 'bg-red-500/10', borderColor: 'border-red-500/20', icon: AlertCircle },
    };
    return configs[status as keyof typeof configs] || configs.pending;
  };

  return (
    <div className="rounded-xl p-5 border border-neutral-700/50 backdrop-blur-sm shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg shadow-sm">
              <Activity className="h-5 w-5 text-white" />
            </div>
            Atividade Recente
          </h3>
          <p className="text-neutral-400 text-sm">Últimos emails enviados</p>
        </div>
        <Link
          href="/sent-emails"
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-400 bg-blue-500/10 rounded-lg border border-blue-500/20 hover:bg-blue-500/20 transition-colors"
        >
          Ver todos
          <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="space-y-3">
        {emails.length === 0 ? (
          <div className="text-center py-12">
            <div className="p-4 bg-neutral-700/30 rounded-full w-fit mx-auto mb-4">
              <Mail className="h-8 w-8 text-neutral-500" />
            </div>
            <p className="text-neutral-400 font-medium mb-1">Nenhum email enviado ainda</p>
            <p className="text-neutral-500 text-sm">Comece criando seu primeiro email</p>
          </div>
        ) : (
          emails.slice(0, 5).map((email) => {
            const config = getStatusConfig(email.status);
            const Icon = config.icon;

            return (
              <div key={email.id} className="group p-4 bg-neutral-800/20 hover:bg-neutral-800/40 rounded-lg border border-neutral-700/30 hover:border-neutral-600/50 transition-all duration-200">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${config.bgColor} ${config.borderColor} border`}>
                    <Icon className={`h-4 w-4 ${config.color}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className="text-white font-medium text-sm truncate group-hover:text-blue-300 transition-colors">
                        {email.subject}
                      </h4>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-md ${config.bgColor} ${config.color} whitespace-nowrap`}>
                        {config.label}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <p className="text-neutral-400 truncate">
                        <span className="text-neutral-300">{email.toName}</span>
                        {email.contact?.companyName && (
                          <span className="text-neutral-500"> • {email.contact.companyName}</span>
                        )}
                      </p>
                      <time className="text-neutral-500 whitespace-nowrap ml-2">
                        {formatDistanceToNow(parseISO(email.createdAt), {
                          locale: ptBR,
                          addSuffix: true
                        })}
                      </time>
                    </div>

                    {/* Indicadores de interação */}
                    {(email.opened || email.clicked) && (
                      <div className="flex items-center gap-2 mt-2">
                        {email.opened && (
                          <div className="flex items-center gap-1 px-2 py-0.5 bg-purple-500/10 text-purple-400 rounded-md text-xs">
                            <Eye className="h-3 w-3" />
                            <span>Aberto</span>
                          </div>
                        )}
                        {email.clicked && (
                          <div className="flex items-center gap-1 px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded-md text-xs">
                            <ExternalLink className="h-3 w-3" />
                            <span>Clicado</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/dashboard');
        if (response.ok) {
          const result = await response.json();
          setData(result);
        }
      } catch (error) {
        console.error('Erro ao buscar dados do dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const pieData = data ? [
    { name: 'Não Abertos', value: data.emails.delivered - data.emails.opened, color: '#6b7280' },
    { name: 'Abertos', value: data.emails.opened - data.emails.clicked, color: '#8b5cf6' },
    { name: 'Clicados', value: data.emails.clicked, color: '#3b82f6' },
    { name: 'Falharam', value: data.emails.failed, color: '#ef4444' },
  ].filter(item => item.value > 0) : [];

  return (
    <MainLayout>
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6 lg:mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
                  <BarChart3 className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                </div>
                Dashboard
              </h1>
              <p className="text-neutral-400">
                Visão geral do seu sistema de email marketing
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <Link
                href="/send-email"
                className="inline-flex items-center justify-center px-4 py-2 bg-white text-black font-medium rounded-lg hover:bg-neutral-200 transition-colors"
              >
                <Send className="h-4 w-4 mr-2" />
                Enviar Email
              </Link>
              <Link
                href="/create"
                className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Rocket className="h-4 w-4 mr-2" />
                Criar Script
              </Link>
            </div>
          </div>
        </div>

        {/* Métricas Principais */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
          <MetricCard
            title="Total de Emails"
            value={data?.emails.total || 0}
            icon={Mail}
            color="neutral"
            trend={data?.trends?.emailsTrend?.startsWith('+') ? 'up' : 'down'}
            trendValue={data?.trends?.emailsTrend || '0%'}
            subtitle="Últimos 30 dias"
            loading={loading}
          />
          <MetricCard
            title="Taxa de Abertura"
            value={data?.performance.openRate.toFixed(1) + '%' || '0%'}
            icon={Eye}
            color="purple"
            trend={data?.trends?.openRateTrend?.startsWith('+') ? 'up' : 'down'}
            trendValue={data?.trends?.openRateTrend || '0%'}
            subtitle="Últimos 7 dias"
            loading={loading}
          />
          <MetricCard
            title="Taxa de Clique"
            value={data?.performance.clickRate.toFixed(1) + '%' || '0%'}
            icon={ExternalLink}
            color="blue"
            trend={data?.trends?.clickRateTrend?.startsWith('+') ? 'up' : 'down'}
            trendValue={data?.trends?.clickRateTrend || '0%'}
            subtitle="Últimos 7 dias"
            loading={loading}
          />
          <MetricCard
            title="Contatos Ativos"
            value={data?.contacts.total || 0}
            icon={Users}
            color="orange"
            trend={data?.trends?.contactsTrend?.startsWith('+') ? 'up' : 'down'}
            trendValue={data?.trends?.contactsTrend || '0'}
            subtitle="Este mês"
            loading={loading}
          />
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 mb-6 lg:mb-8">
          {/* Gráfico de Performance ao Longo do Tempo */}
          <div className="rounded-2xl p-6 border border-neutral-700/50 backdrop-blur-sm shadow-xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-2 flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg shadow-lg">
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                  Performance dos Últimos 7 Dias
                </h3>
                <p className="text-neutral-400 text-sm">Análise detalhada da performance dos emails</p>
              </div>

              {/* Legenda moderna */}
              <div className="flex flex-wrap gap-2 text-xs">
                <div className="flex items-center gap-2 bg-green-500/10 px-3 py-1.5 rounded-full border border-green-500/20">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-green-300 font-medium">Entregues</span>
                </div>
                <div className="flex items-center gap-2 bg-purple-500/10 px-3 py-1.5 rounded-full border border-purple-500/20">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span className="text-purple-300 font-medium">Abertos</span>
                </div>
                <div className="flex items-center gap-2 bg-blue-500/10 px-3 py-1.5 rounded-full border border-blue-500/20">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-blue-300 font-medium">Clicados</span>
                </div>
                <div className="flex items-center gap-2 bg-red-500/10 px-3 py-1.5 rounded-full border border-red-500/20">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-red-300 font-medium">Falharam</span>
                </div>
              </div>
            </div>

            {data?.emails.dailyStats ? (
              <div className="bg-neutral-800/30 rounded-xl p-4 border border-neutral-700/30">
                <ResponsiveContainer width="100%" height={320}>
                  <AreaChart
                    data={data.emails.dailyStats}
                    margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                  >
                    <defs>
                      <linearGradient id="deliveredGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                      </linearGradient>
                      <linearGradient id="openedGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1} />
                      </linearGradient>
                      <linearGradient id="clickedGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                      </linearGradient>
                      <linearGradient id="failedGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#374151"
                      strokeOpacity={0.3}
                      vertical={false}
                    />
                    <XAxis
                      dataKey="date"
                      stroke="#9ca3af"
                      fontSize={11}
                      fontWeight={500}
                      tickLine={false}
                      axisLine={false}
                      dy={10}
                      tickFormatter={(value) => format(parseISO(value), 'dd/MM', { locale: ptBR })}
                    />
                    <YAxis
                      stroke="#9ca3af"
                      fontSize={11}
                      fontWeight={500}
                      tickLine={false}
                      axisLine={false}
                      dx={-10}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-neutral-900 border border-neutral-600 rounded-xl p-4 shadow-xl backdrop-blur-sm">
                              <p className="text-white font-semibold mb-3 text-sm">
                                {format(parseISO(label as string), 'dd/MM/yyyy', { locale: ptBR })}
                              </p>
                              <div className="space-y-2">
                                {payload.reverse().map((entry, index) => (
                                  <div key={index} className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-2">
                                      <div
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: entry.color }}
                                      />
                                      <span className="text-neutral-300 text-xs font-medium">
                                        {entry.dataKey === 'sent' ? 'Entregues' :
                                          entry.dataKey === 'opened' ? 'Abertos' :
                                            entry.dataKey === 'clicked' ? 'Clicados' :
                                              entry.dataKey === 'failed' ? 'Falharam' : entry.dataKey}
                                      </span>
                                    </div>
                                    <span className="text-white font-bold text-sm">
                                      {entry.value}
                                    </span>
                                  </div>
                                ))}
                              </div>
                              {payload[0]?.payload && (
                                <div className="mt-3 pt-3 border-t border-neutral-700">
                                  <div className="flex justify-between text-xs">
                                    <span className="text-neutral-400">Taxa de Abertura:</span>
                                    <span className="text-purple-400 font-semibold">
                                      {payload[0].payload.openRate?.toFixed(1)}%
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-xs mt-1">
                                    <span className="text-neutral-400">Taxa de Clique:</span>
                                    <span className="text-blue-400 font-semibold">
                                      {payload[0].payload.clickRate?.toFixed(1)}%
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="sent"
                      stroke="#10b981"
                      strokeWidth={2}
                      fill="url(#deliveredGradient)"
                      dot={{ fill: '#10b981', strokeWidth: 0, r: 4 }}
                      activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2, fill: '#1f2937' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="opened"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                      fill="url(#openedGradient)"
                      dot={{ fill: '#8b5cf6', strokeWidth: 0, r: 4 }}
                      activeDot={{ r: 6, stroke: '#8b5cf6', strokeWidth: 2, fill: '#1f2937' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="clicked"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      fill="url(#clickedGradient)"
                      dot={{ fill: '#3b82f6', strokeWidth: 0, r: 4 }}
                      activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2, fill: '#1f2937' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="failed"
                      stroke="#ef4444"
                      strokeWidth={2}
                      fill="url(#failedGradient)"
                      dot={{ fill: '#ef4444', strokeWidth: 0, r: 4 }}
                      activeDot={{ r: 6, stroke: '#ef4444', strokeWidth: 2, fill: '#1f2937' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="bg-neutral-800/30 rounded-xl border border-neutral-700/30">
                <div className="h-[340px] flex flex-col items-center justify-center">
                  <div className="animate-pulse mb-4">
                    <TrendingUp className="h-12 w-12 text-neutral-500" />
                  </div>
                  <div className="text-neutral-400 font-medium">Carregando dados...</div>
                  <div className="text-neutral-500 text-sm mt-1">Analisando performance dos emails</div>
                </div>
              </div>
            )}
          </div>

          {/* Gráfico de Pizza - Distribuição de Status */}
          <div className="rounded-2xl p-6 border border-neutral-700/50 backdrop-blur-sm shadow-xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-2 flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg shadow-lg">
                    <PieChart className="h-5 w-5 text-white" />
                  </div>
                  Distribuição dos Emails
                </h3>
                <p className="text-neutral-400 text-sm">Performance detalhada dos emails enviados</p>
              </div>

              {/* Estatísticas rápidas */}
              {data && (
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="text-center bg-green-500/10 px-3 py-2 rounded-lg border border-green-500/20">
                    <div className="text-green-400 font-bold text-lg">{data.emails.delivered}</div>
                    <div className="text-green-300">Entregues</div>
                  </div>
                  <div className="text-center bg-purple-500/10 px-3 py-2 rounded-lg border border-purple-500/20">
                    <div className="text-purple-400 font-bold text-lg">{data.emails.opened}</div>
                    <div className="text-purple-300">Abertos</div>
                  </div>
                </div>
              )}
            </div>

            {pieData.length > 0 ? (
              <div className="bg-neutral-800/30 rounded-xl p-4 border border-neutral-700/30">
                <ResponsiveContainer width="100%" height={320}>
                  <RechartsPieChart>
                    <Pie
                      dataKey="value"
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      stroke="#1f2937"
                      strokeWidth={2}
                    >
                      {pieData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color}
                          className="hover:opacity-80 transition-opacity duration-200"
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          const total = pieData.reduce((acc, item) => acc + item.value, 0);
                          return (
                            <div className="bg-neutral-900 border border-neutral-600 rounded-xl p-4 shadow-xl backdrop-blur-sm">
                              <div className="flex items-center gap-3 mb-2">
                                <div
                                  className="w-4 h-4 rounded-full"
                                  style={{ backgroundColor: data.color }}
                                />
                                <span className="text-white font-semibold">{data.name}</span>
                              </div>
                              <div className="text-2xl font-bold text-white mb-1">{data.value}</div>
                              <div className="text-neutral-400 text-sm">
                                {((data.value / total) * 100).toFixed(1)}% do total
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </RechartsPieChart>
                </ResponsiveContainer>

                {/* Legenda customizada */}
                <div className="grid grid-cols-2 gap-3 mt-4">
                  {pieData.map((entry, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-neutral-700/30 rounded-lg hover:bg-neutral-700/50 transition-colors">
                      <div
                        className="w-3 h-3 rounded-full shadow-lg"
                        style={{ backgroundColor: entry.color }}
                      />
                      <div className="flex-1">
                        <div className="text-white font-medium text-sm">{entry.name}</div>
                        <div className="flex items-center gap-2">
                          <span className="text-neutral-300 font-bold">{entry.value}</span>
                          <span className="text-neutral-500 text-xs">
                            ({((entry.value / pieData.reduce((acc, item) => acc + item.value, 0)) * 100).toFixed(0)}%)
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-neutral-800/30 rounded-xl border border-neutral-700/30">
                <div className="h-[340px] flex flex-col items-center justify-center">
                  <div className="animate-pulse mb-4">
                    <PieChart className="h-12 w-12 text-neutral-500" />
                  </div>
                  <div className="text-neutral-400 font-medium">Nenhum dado disponível</div>
                  <div className="text-neutral-500 text-sm mt-1">Aguardando dados de email</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Seção Inferior */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          {/* Atividade Recente */}
          <RecentActivity emails={data?.emails.recent || []} />

          {/* Ações Rápidas */}
          <div className="rounded-xl p-5 border border-neutral-700/50 backdrop-blur-sm shadow-sm">
            <div className="mb-5">
              <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow-sm">
                  <Rocket className="h-5 w-5 text-white" />
                </div>
                Ações Rápidas
              </h3>
              <p className="text-neutral-400 text-sm">Acesso rápido às funcionalidades principais</p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <Link
                href="/create"
                className="group p-4 bg-neutral-800/20 hover:bg-blue-600/10 rounded-lg border border-neutral-700/30 hover:border-blue-500/30 transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg shadow-sm group-hover:scale-105 transition-transform">
                    <FileText className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-white font-semibold mb-0.5 group-hover:text-blue-300 transition-colors">Criar Script</h4>
                    <p className="text-neutral-400 text-sm">Gerar email personalizado com IA</p>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-neutral-500 group-hover:text-blue-400 transition-colors" />
                </div>
              </Link>

              <Link
                href="/send-email"
                className="group p-4 bg-neutral-800/20 hover:bg-emerald-600/10 rounded-lg border border-neutral-700/30 hover:border-emerald-500/30 transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-lg shadow-sm group-hover:scale-105 transition-transform">
                    <Send className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-white font-semibold mb-0.5 group-hover:text-emerald-300 transition-colors">Enviar Email</h4>
                    <p className="text-neutral-400 text-sm">Envio direto ou campanha em massa</p>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-neutral-500 group-hover:text-emerald-400 transition-colors" />
                </div>
              </Link>

              <Link
                href="/contacts"
                className="group p-4 bg-neutral-800/20 hover:bg-purple-600/10 rounded-lg border border-neutral-700/30 hover:border-purple-500/30 transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg shadow-sm group-hover:scale-105 transition-transform">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-white font-semibold mb-0.5 group-hover:text-purple-300 transition-colors">Gerenciar Contatos</h4>
                    <p className="text-neutral-400 text-sm">Organizar e importar lista de prospects</p>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-neutral-500 group-hover:text-purple-400 transition-colors" />
                </div>
              </Link>

              <Link
                href="/settings"
                className="group p-4 bg-neutral-800/20 hover:bg-orange-600/10 rounded-lg border border-neutral-700/30 hover:border-orange-500/30 transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-gradient-to-br from-orange-600 to-orange-700 rounded-lg shadow-sm group-hover:scale-105 transition-transform">
                    <Award className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-white font-semibold mb-0.5 group-hover:text-orange-300 transition-colors">Configurações</h4>
                    <p className="text-neutral-400 text-sm">SMTP, dados pessoais e preferências</p>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-neutral-500 group-hover:text-orange-400 transition-colors" />
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
