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

        // Definir períodos para comparação
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

        const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

        // Buscar dados do período atual (últimos 30 dias)
        const [
            // Emails últimos 30 dias
            emailsLast30Days,
            emailsOpened30Days,
            emailsClicked30Days,
            emailsDelivered30Days,

            // Emails 30-60 dias atrás (para comparação)
            emailsPrevious30Days,
            emailsOpenedPrevious30Days,
            emailsClickedPrevious30Days,
            emailsDeliveredPrevious30Days,

            // Contatos este mês
            contactsThisMonth,
            contactsLastMonth,

            totalContacts,
            recentEmails,
            emailsByStatus,
        ] = await Promise.all([
            // Período atual (últimos 30 dias)
            prisma.emailSent.count({
                where: { createdAt: { gte: thirtyDaysAgo } }
            }),
            prisma.emailSent.count({
                where: {
                    createdAt: { gte: thirtyDaysAgo },
                    opened: true
                }
            }),
            prisma.emailSent.count({
                where: {
                    createdAt: { gte: thirtyDaysAgo },
                    clicked: true
                }
            }),
            prisma.emailSent.count({
                where: {
                    createdAt: { gte: thirtyDaysAgo },
                    status: { notIn: ['failed', 'bounced'] }
                }
            }),

            // Período anterior (30-60 dias atrás)
            prisma.emailSent.count({
                where: {
                    createdAt: {
                        gte: sixtyDaysAgo,
                        lt: thirtyDaysAgo
                    }
                }
            }),
            prisma.emailSent.count({
                where: {
                    createdAt: {
                        gte: sixtyDaysAgo,
                        lt: thirtyDaysAgo
                    },
                    opened: true
                }
            }),
            prisma.emailSent.count({
                where: {
                    createdAt: {
                        gte: sixtyDaysAgo,
                        lt: thirtyDaysAgo
                    },
                    clicked: true
                }
            }),
            prisma.emailSent.count({
                where: {
                    createdAt: {
                        gte: sixtyDaysAgo,
                        lt: thirtyDaysAgo
                    },
                    status: { notIn: ['failed', 'bounced'] }
                }
            }),

            // Contatos este mês vs mês passado
            prisma.contact.count({
                where: {
                    createdAt: { gte: startOfThisMonth },
                    isActive: true
                }
            }),
            prisma.contact.count({
                where: {
                    createdAt: {
                        gte: startOfLastMonth,
                        lt: startOfThisMonth
                    },
                    isActive: true
                }
            }),

            // Totais gerais
            prisma.contact.count({ where: { isActive: true } }),

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

        // Calcular variações percentuais
        const calculatePercentageChange = (current: number, previous: number): string => {
            if (previous === 0) return current > 0 ? '+100%' : '0%';
            const change = ((current - previous) / previous) * 100;
            return change >= 0 ? `+${change.toFixed(1)}%` : `${change.toFixed(1)}%`;
        };

        const calculateAbsoluteChange = (current: number, previous: number): string => {
            const change = current - previous;
            return change >= 0 ? `+${change}` : `${change}`;
        };

        // Calcular taxas atuais
        const currentOpenRate = emailsDelivered30Days > 0 ? (emailsOpened30Days / emailsDelivered30Days) * 100 : 0;
        const currentClickRate = emailsOpened30Days > 0 ? (emailsClicked30Days / emailsOpened30Days) * 100 : 0;

        // Calcular taxas anteriores
        const previousOpenRate = emailsDeliveredPrevious30Days > 0 ? (emailsOpenedPrevious30Days / emailsDeliveredPrevious30Days) * 100 : 0;
        const previousClickRate = emailsOpenedPrevious30Days > 0 ? (emailsClickedPrevious30Days / emailsOpenedPrevious30Days) * 100 : 0;

        // Buscar totais gerais para compatibilidade
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

        const deliveredEmails = totalEmails - failedEmails;

        // Buscar dados reais dos últimos 7 dias para gráficos
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

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
            delivered: deliveredEmails,
            failed: failedEmails,
            recent: recentEmails,
            byStatus: emailsByStatus.reduce((acc: Record<string, number>, item: { status: string; _count: { status: number } }) => {
                acc[item.status] = item._count.status;
                return acc;
            }, {}),
            dailyStats,
        };

        // Calcular métricas de performance
        const performance = {
            deliveryRate: totalEmails > 0 ? (deliveredEmails / totalEmails) * 100 : 0,
            openRate: deliveredEmails > 0 ? (openedEmails / deliveredEmails) * 100 : 0,
            clickRate: openedEmails > 0 ? (clickedEmails / openedEmails) * 100 : 0,
        };

        // Calcular tendências (comparações reais)
        const trends = {
            emailsTrend: calculatePercentageChange(emailsLast30Days, emailsPrevious30Days),
            openRateTrend: calculatePercentageChange(currentOpenRate, previousOpenRate),
            clickRateTrend: calculatePercentageChange(currentClickRate, previousClickRate),
            contactsTrend: calculateAbsoluteChange(contactsThisMonth, contactsLastMonth),
        };

        return NextResponse.json({
            emails: emailsData,
            contacts: { total: totalContacts },
            templates: { total: 0 },
            performance,
            trends, // Dados reais de tendências
        });
    } catch (error) {
        console.error('Erro ao buscar dados do dashboard:', error);
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
} 