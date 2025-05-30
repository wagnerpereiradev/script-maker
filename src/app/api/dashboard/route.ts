import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';
import { requireAuth, unauthorizedResponse } from '@/lib/api-auth';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
    try {
        // Verificar autenticação
        const { user, error } = requireAuth(request);
        if (error || !user) {
            return unauthorizedResponse(error);
        }

        // Buscar dados básicos
        const [
            totalContacts,
            emailStats,
            recentEmails,
            emailsByStatus,
        ] = await Promise.all([
            // Contatos
            prisma.contact.count(),

            // Estatísticas de emails
            prisma.emailSent.aggregate({
                _count: { id: true },
            }),

            // Emails recentes
            prisma.emailSent.findMany({
                take: 5,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    toName: true,
                    toEmail: true,
                    subject: true,
                    status: true,
                    createdAt: true,
                    opened: true,
                    clicked: true,
                    contact: {
                        select: {
                            companyName: true,
                        },
                    },
                },
            }),

            // Emails por status
            prisma.emailSent.groupBy({
                by: ['status'],
                _count: {
                    status: true,
                },
            }),
        ]);

        // Buscar contadores manuais de emails
        const [totalEmails, openedEmails, clickedEmails, failedEmails] = await Promise.all([
            prisma.emailSent.count(),
            prisma.emailSent.count({ where: { opened: true } }),
            prisma.emailSent.count({ where: { clicked: true } }),
            prisma.emailSent.count({
                where: {
                    status: {
                        in: ['failed', 'bounced']
                    }
                }
            }),
        ]);

        // Calcular emails entregues corretamente
        // Entregues = Total - Falharam (não considerar apenas os abertos)
        const deliveredEmails = totalEmails - failedEmails;

        // Buscar dados reais dos últimos 7 dias
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        // Consulta real para dados diários dos últimos 7 dias
        const dailyEmailsRaw = await prisma.emailSent.findMany({
            where: {
                createdAt: {
                    gte: sevenDaysAgo,
                },
            },
            select: {
                createdAt: true,
                status: true,
                opened: true,
                clicked: true,
            },
            orderBy: {
                createdAt: 'asc',
            },
        });

        // Agrupar por data
        const dailyStatsMap = new Map<string, {
            total: number;
            sent: number;
            opened: number;
            clicked: number;
            failed: number;
        }>();

        // Inicializar todos os dias dos últimos 7 dias
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            dailyStatsMap.set(dateStr, {
                total: 0,
                sent: 0,
                opened: 0,
                clicked: 0,
                failed: 0,
            });
        }

        // Processar emails reais
        dailyEmailsRaw.forEach(email => {
            const dateStr = email.createdAt.toISOString().split('T')[0];
            const stats = dailyStatsMap.get(dateStr);

            if (stats) {
                stats.total++;

                // Considerar como enviado se não falhou
                if (!['failed', 'bounced'].includes(email.status)) {
                    stats.sent++;
                }

                if (email.opened) {
                    stats.opened++;
                }

                if (email.clicked) {
                    stats.clicked++;
                }

                if (['failed', 'bounced'].includes(email.status)) {
                    stats.failed++;
                }
            }
        });

        // Converter para array e calcular taxas
        const dailyStats = Array.from(dailyStatsMap.entries()).map(([date, stats]) => ({
            date,
            total: stats.total,
            sent: stats.sent,
            opened: stats.opened,
            clicked: stats.clicked,
            failed: stats.failed,
            openRate: stats.sent > 0 ? (stats.opened / stats.sent) * 100 : 0,
            clickRate: stats.opened > 0 ? (stats.clicked / stats.opened) * 100 : 0,
        }));

        // Processar dados de emails
        const emailsData = {
            total: totalEmails,
            opened: openedEmails,
            clicked: clickedEmails,
            delivered: deliveredEmails, // Corrigido: emails que não falharam
            failed: failedEmails,
            recent: recentEmails,
            byStatus: emailsByStatus.reduce((acc: Record<string, number>, item: { status: string; _count: { status: number } }) => {
                acc[item.status] = item._count.status;
                return acc;
            }, {}),
            dailyStats,
        };

        // Calcular métricas de performance corrigidas
        const performance = {
            deliveryRate: totalEmails > 0 ? (deliveredEmails / totalEmails) * 100 : 0,
            openRate: deliveredEmails > 0 ? (openedEmails / deliveredEmails) * 100 : 0,
            clickRate: openedEmails > 0 ? (clickedEmails / openedEmails) * 100 : 0,
        };

        return NextResponse.json({
            emails: emailsData,
            contacts: { total: totalContacts },
            templates: { total: 0 }, // Placeholder até implementar templates
            performance,
        });
    } catch (error) {
        console.error('Erro ao buscar dados do dashboard:', error);
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
} 