'use client';

import { useEffect, useState } from 'react';
import MainLayout from '@/components/MainLayout';
import { PenTool, FileText, TrendingUp, Mail } from 'lucide-react';
import Link from 'next/link';

interface Stats {
  total: number;
  byType: Record<string, number>;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    total: 0,
    byType: {},
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/scripts?stats=true');
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <MainLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Dashboard
          </h1>
          <p className="text-neutral-400">
            Bem-vindo ao Script Maker. Crie emails de prospecção personalizados com IA.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-neutral-gradient rounded-lg p-6 border border-neutral-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-neutral-400 text-sm">Scripts Criados</p>
                <p className="text-2xl font-bold text-white">
                  {loading ? '...' : stats.total}
                </p>
              </div>
              <FileText className="h-8 w-8 text-neutral-500" />
            </div>
          </div>

          <div className="bg-neutral-gradient rounded-lg p-6 border border-neutral-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-neutral-400 text-sm">Primeiro Contato</p>
                <p className="text-2xl font-bold text-white">
                  {loading ? '...' : (stats.byType.cold_outreach || 0)}
                </p>
              </div>
              <Mail className="h-8 w-8 text-neutral-500" />
            </div>
          </div>

          <div className="bg-neutral-gradient rounded-lg p-6 border border-neutral-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-neutral-400 text-sm">Follow-ups</p>
                <p className="text-2xl font-bold text-white">
                  {loading ? '...' : (stats.byType.follow_up || 0)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-neutral-500" />
            </div>
          </div>

          <div className="bg-neutral-gradient rounded-lg p-6 border border-neutral-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-neutral-400 text-sm">Agendamentos</p>
                <p className="text-2xl font-bold text-white">
                  {loading ? '...' : (stats.byType.meeting_request || 0)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-neutral-500" />
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-neutral-gradient rounded-lg p-8 border border-neutral-800">
            <div className="flex items-center mb-4">
              <PenTool className="h-6 w-6 text-white mr-3" />
              <h3 className="text-xl font-semibold text-white">Criar Novo Script</h3>
            </div>
            <p className="text-neutral-400 mb-6">
              Use nossa IA para criar emails de prospecção personalizados e eficazes.
            </p>
            <Link
              href="/create"
              className="inline-flex items-center px-6 py-3 bg-white text-black font-medium rounded-lg hover:bg-neutral-200 transition-colors"
            >
              Começar Agora
            </Link>
          </div>

          <div className="bg-neutral-gradient rounded-lg p-8 border border-neutral-800">
            <div className="flex items-center mb-4">
              <FileText className="h-6 w-6 text-white mr-3" />
              <h3 className="text-xl font-semibold text-white">Meus Scripts</h3>
            </div>
            <p className="text-neutral-400 mb-6">
              Gerencie e visualize todos os seus scripts criados anteriormente.
            </p>
            <Link
              href="/scripts"
              className="inline-flex items-center px-6 py-3 bg-neutral-800 text-white font-medium rounded-lg hover:bg-neutral-700 transition-colors border border-neutral-600"
            >
              Ver Scripts
            </Link>
          </div>
        </div>

        {/* Getting Started */}
        <div className="mt-12 bg-dark-gradient rounded-lg p-8 border border-neutral-800">
          <h3 className="text-xl font-semibold text-white mb-4">Como começar</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="bg-neutral-800 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                <span className="text-white font-bold">1</span>
              </div>
              <h4 className="font-medium text-white mb-2">Insira os Dados</h4>
              <p className="text-neutral-400 text-sm">
                Adicione informações do prospect: nome, empresa, nicho e outros detalhes relevantes.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-neutral-800 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                <span className="text-white font-bold">2</span>
              </div>
              <h4 className="font-medium text-white mb-2">Configure o Email</h4>
              <p className="text-neutral-400 text-sm">
                Escolha o tipo, tom e tamanho do email. Defina seu call-to-action.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-neutral-800 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                <span className="text-white font-bold">3</span>
              </div>
              <h4 className="font-medium text-white mb-2">Gere e Use</h4>
              <p className="text-neutral-400 text-sm">
                Nossa IA criará um email personalizado pronto para envio.
              </p>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
