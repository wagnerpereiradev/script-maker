'use client';

import { useEffect, useState } from 'react';
import MainLayout from '@/components/MainLayout';
import {
  Mail, Users, FileText, TrendingUp, Activity,
  Eye, ExternalLink, Clock, Send, AlertCircle, BarChart3,
  ArrowUpRight, ArrowDownRight, PieChart, Zap,
  Target, Award, Rocket
} from 'lucide-react';
import Link from 'next/link';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RechartsPieChart, Cell, AreaChart, Area, Pie
} from 'recharts';
import { format, parseISO } from 'date-fns';
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
      };
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
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red';
  subtitle?: string;
  loading?: boolean;
}) => {
  const colorClasses = {
    blue: 'text-blue-400 bg-blue-900/20 border-blue-800',
    green: 'text-green-400 bg-green-900/20 border-green-800',
    purple: 'text-purple-400 bg-purple-900/20 border-purple-800',
    orange: 'text-orange-400 bg-orange-900/20 border-orange-800',
    red: 'text-red-400 bg-red-900/20 border-red-800',
  };

  return (
    <div className="bg-neutral-gradient rounded-xl p-6 border border-neutral-800 hover:border-neutral-700 transition-all duration-200">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
        {trend && trendValue && (
          <div className={`flex items-center gap-1 text-sm ${trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
            {trend === 'up' ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
            <span>{trendValue}</span>
          </div>
        )}
      </div>
      <div>
        <h3 className="text-neutral-400 text-sm font-medium mb-1">{title}</h3>
        <p className="text-2xl font-bold text-white mb-1">
          {loading ? '...' : value}
        </p>
        {subtitle && (
          <p className="text-neutral-500 text-xs">{subtitle}</p>
        )}
      </div>
    </div>
  );
};

// Componente de Atividade Recente
const RecentActivity = ({ emails }: { emails: DashboardData['emails']['recent'] }) => {
  const getStatusConfig = (status: string) => {
    const configs = {
      pending: { label: 'Pendente', color: 'text-yellow-400 bg-yellow-900/20', icon: Clock },
      sent: { label: 'Enviado', color: 'text-green-400 bg-green-900/20', icon: Send },
      delivered: { label: 'Entregue', color: 'text-green-400 bg-green-900/20', icon: Send },
      opened: { label: 'Aberto', color: 'text-purple-400 bg-purple-900/20', icon: Eye },
      clicked: { label: 'Clicado', color: 'text-blue-400 bg-blue-900/20', icon: ExternalLink },
      failed: { label: 'Falhou', color: 'text-red-400 bg-red-900/20', icon: AlertCircle },
    };
    return configs[status as keyof typeof configs] || configs.pending;
  };

  return (
    <div className="bg-neutral-gradient rounded-xl p-6 border border-neutral-800">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Activity className="h-5 w-5 text-blue-400" />
          Atividade Recente
        </h3>
        <Link
          href="/sent-emails"
          className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
        >
          Ver todos
        </Link>
      </div>

      <div className="space-y-4">
        {emails.length === 0 ? (
          <div className="text-center py-8">
            <Mail className="h-8 w-8 text-neutral-500 mx-auto mb-2" />
            <p className="text-neutral-400 text-sm">Nenhum email enviado ainda</p>
          </div>
        ) : (
          emails.slice(0, 5).map((email) => {
            const config = getStatusConfig(email.status);
            const Icon = config.icon;

            return (
              <div key={email.id} className="flex items-center gap-3 p-3 bg-neutral-800/30 rounded-lg hover:bg-neutral-800/50 transition-colors">
                <div className={`p-2 rounded-lg ${config.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-white text-sm font-medium truncate">{email.subject}</h4>
                  <p className="text-neutral-400 text-xs">
                    Para: {email.toName} • {email.contact.companyName}
                  </p>
                </div>
                <div className="text-right">
                  <div className={`text-xs px-2 py-1 rounded ${config.color}`}>
                    {config.label}
                  </div>
                  <div className="text-neutral-500 text-xs mt-1">
                    {format(parseISO(email.createdAt), 'dd/MM HH:mm', { locale: ptBR })}
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
    { name: 'Entregues', value: data.emails.delivered, color: '#10b981' },
    { name: 'Abertos', value: data.emails.opened, color: '#8b5cf6' },
    { name: 'Clicados', value: data.emails.clicked, color: '#3b82f6' },
    { name: 'Falharam', value: data.emails.failed, color: '#ef4444' },
  ] : [];

  return (
    <MainLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
                  <BarChart3 className="h-8 w-8 text-white" />
                </div>
                Dashboard
              </h1>
              <p className="text-neutral-400">
                Visão geral do seu sistema de email marketing
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/send-email"
                className="inline-flex items-center px-4 py-2 bg-white text-black font-medium rounded-lg hover:bg-neutral-200 transition-colors"
              >
                <Send className="h-4 w-4 mr-2" />
                Enviar Email
              </Link>
              <Link
                href="/create"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Rocket className="h-4 w-4 mr-2" />
                Criar Script
              </Link>
            </div>
          </div>
        </div>

        {/* Métricas Principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Total de Emails"
            value={data?.emails.total || 0}
            icon={Mail}
            color="blue"
            trend="up"
            trendValue="+12%"
            subtitle="Últimos 30 dias"
            loading={loading}
          />
          <MetricCard
            title="Taxa de Abertura"
            value={data?.performance.openRate.toFixed(1) + '%' || '0%'}
            icon={Eye}
            color="purple"
            trend="up"
            trendValue="+5.2%"
            subtitle="Média da indústria: 22%"
            loading={loading}
          />
          <MetricCard
            title="Taxa de Clique"
            value={data?.performance.clickRate.toFixed(1) + '%' || '0%'}
            icon={ExternalLink}
            color="green"
            trend="up"
            trendValue="+2.8%"
            subtitle="Média da indústria: 3.5%"
            loading={loading}
          />
          <MetricCard
            title="Contatos Ativos"
            value={data?.contacts.total || 0}
            icon={Users}
            color="orange"
            trend="up"
            trendValue="+8"
            subtitle="Este mês"
            loading={loading}
          />
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Gráfico de Performance ao Longo do Tempo */}
          <div className="bg-neutral-gradient rounded-xl p-6 border border-neutral-800">
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-400" />
              Performance dos Últimos 7 Dias
            </h3>
            {data?.emails.dailyStats ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={data.emails.dailyStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis
                    dataKey="date"
                    stroke="#9ca3af"
                    fontSize={12}
                    tickFormatter={(value) => format(parseISO(value), 'dd/MM', { locale: ptBR })}
                  />
                  <YAxis stroke="#9ca3af" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                    labelFormatter={(value) => format(parseISO(value as string), 'dd/MM/yyyy', { locale: ptBR })}
                  />
                  <Area type="monotone" dataKey="total" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                  <Area type="monotone" dataKey="opened" stackId="2" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} />
                  <Area type="monotone" dataKey="clicked" stackId="3" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center">
                <div className="text-neutral-400">Carregando dados...</div>
              </div>
            )}
          </div>

          {/* Gráfico de Pizza - Distribuição de Status */}
          <div className="bg-neutral-gradient rounded-xl p-6 border border-neutral-800">
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <PieChart className="h-5 w-5 text-purple-400" />
              Distribuição de Status
            </h3>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Pie
                    dataKey="value"
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }: { name: string; percent: number }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center">
                <div className="text-neutral-400">Nenhum dado disponível</div>
              </div>
            )}
          </div>
        </div>

        {/* Métricas de Performance */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-green-900/20 to-green-800/10 rounded-xl p-6 border border-green-800/50">
            <div className="flex items-center justify-between mb-4">
              <Target className="h-8 w-8 text-green-400" />
              <div className="text-green-400 text-2xl font-bold">
                {data?.performance.deliveryRate.toFixed(1) || '0'}%
              </div>
            </div>
            <h3 className="text-white font-semibold mb-1">Taxa de Entrega</h3>
            <p className="text-green-300 text-sm">Emails entregues com sucesso</p>
          </div>

          <div className="bg-gradient-to-br from-purple-900/20 to-purple-800/10 rounded-xl p-6 border border-purple-800/50">
            <div className="flex items-center justify-between mb-4">
              <Eye className="h-8 w-8 text-purple-400" />
              <div className="text-purple-400 text-2xl font-bold">
                {data?.performance.openRate.toFixed(1) || '0'}%
              </div>
            </div>
            <h3 className="text-white font-semibold mb-1">Taxa de Abertura</h3>
            <p className="text-purple-300 text-sm">Emails abertos pelos destinatários</p>
          </div>

          <div className="bg-gradient-to-br from-blue-900/20 to-blue-800/10 rounded-xl p-6 border border-blue-800/50">
            <div className="flex items-center justify-between mb-4">
              <Zap className="h-8 w-8 text-blue-400" />
              <div className="text-blue-400 text-2xl font-bold">
                {data?.performance.clickRate.toFixed(1) || '0'}%
              </div>
            </div>
            <h3 className="text-white font-semibold mb-1">Taxa de Clique</h3>
            <p className="text-blue-300 text-sm">Links clicados nos emails</p>
          </div>
        </div>

        {/* Seção Inferior */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Atividade Recente */}
          <RecentActivity emails={data?.emails.recent || []} />

          {/* Ações Rápidas */}
          <div className="bg-neutral-gradient rounded-xl p-6 border border-neutral-800">
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <Rocket className="h-5 w-5 text-blue-400" />
              Ações Rápidas
            </h3>
            <div className="grid grid-cols-1 gap-4">
              <Link
                href="/create"
                className="group bg-neutral-800 hover:bg-blue-900/30 rounded-lg p-4 transition-all duration-200 hover:border-blue-500 border border-transparent"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-600 rounded-lg group-hover:bg-blue-500 transition-colors">
                    <FileText className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h4 className="text-white font-medium">Criar Script</h4>
                    <p className="text-blue-300 text-sm">Gerar email personalizado</p>
                  </div>
                  <ArrowUpRight className="h-5 w-5 text-blue-400 ml-auto" />
                </div>
              </Link>

              <Link
                href="/send-email"
                className="group bg-neutral-800 hover:bg-green-900/30 rounded-lg p-4 transition-all duration-200 hover:border-green-500 border border-transparent"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-600 rounded-lg group-hover:bg-green-500 transition-colors">
                    <Send className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h4 className="text-white font-medium">Enviar Email</h4>
                    <p className="text-green-300 text-sm">Envio direto ou em massa</p>
                  </div>
                  <ArrowUpRight className="h-5 w-5 text-green-400 ml-auto" />
                </div>
              </Link>

              <Link
                href="/contacts"
                className="group bg-neutral-800 hover:bg-purple-900/30 rounded-lg p-4 transition-all duration-200 hover:border-purple-500 border border-transparent"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-600 rounded-lg group-hover:bg-purple-500 transition-colors">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h4 className="text-white font-medium">Gerenciar Contatos</h4>
                    <p className="text-purple-300 text-sm">Lista de prospects</p>
                  </div>
                  <ArrowUpRight className="h-5 w-5 text-purple-400 ml-auto" />
                </div>
              </Link>

              <Link
                href="/settings"
                className="group bg-neutral-800 hover:bg-orange-900/30 rounded-lg p-4 transition-all duration-200 hover:border-orange-500 border border-transparent"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-600 rounded-lg group-hover:bg-orange-500 transition-colors">
                    <Award className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h4 className="text-white font-medium">Configurações</h4>
                    <p className="text-orange-300 text-sm">SMTP e dados pessoais</p>
                  </div>
                  <ArrowUpRight className="h-5 w-5 text-orange-400 ml-auto" />
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
