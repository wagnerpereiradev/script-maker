import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, type Prisma } from '@/generated/prisma';
import { requireAuth, unauthorizedResponse } from '@/lib/api-auth';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
    try {
        // Verificar autenticação
        const { user, error } = requireAuth(request);
        if (error || !user) {
            return unauthorizedResponse(error);
        }

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const search = searchParams.get('search') || '';
        const status = searchParams.get('status') || '';
        const contactId = searchParams.get('contactId') || '';

        const skip = (page - 1) * limit;

        // Construir filtros
        const where: Prisma.EmailSentWhereInput = {};

        if (search) {
            where.OR = [
                { toName: { contains: search } },
                { toEmail: { contains: search } },
                { subject: { contains: search } },
            ];
        }

        if (status) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            where.status = status as any;
        }

        if (contactId) {
            where.contactId = contactId;
        }

        // Buscar emails com relacionamentos
        const [emails, total] = await Promise.all([
            prisma.emailSent.findMany({
                where,
                include: {
                    contact: {
                        select: {
                            name: true,
                            email: true,
                            companyName: true,
                        },
                    },
                    script: {
                        select: {
                            subject: true,
                            emailType: true,
                        },
                    },
                    template: {
                        select: {
                            name: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma.emailSent.count({ where }),
        ]);

        // Buscar estatísticas globais (sem filtros de busca/status para ter métricas completas)
        const globalStats = await prisma.emailSent.groupBy({
            by: ['status'],
            _count: {
                status: true,
            },
        });

        // Buscar estatísticas adicionais
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

        // Processar estatísticas corrigidas
        const stats = {
            total: totalEmails,
            sent: 0,
            delivered: totalEmails - failedEmails,
            opened: openedEmails,
            clicked: clickedEmails,
            failed: failedEmails,
            pending: 0,
        };

        // Contar por status para sent e pending
        globalStats.forEach((stat) => {
            const count = stat._count.status;
            switch (stat.status) {
                case 'sent':
                case 'delivered':
                case 'opened':
                case 'clicked':
                    stats.sent += count;
                    break;
                case 'pending':
                case 'sending':
                    stats.pending += count;
                    break;
                // failed e bounced já foram contados acima
            }
        });

        const pages = Math.ceil(total / limit);

        return NextResponse.json({
            emails,
            pagination: {
                current: page,
                pages,
                total,
                hasNext: page < pages,
                hasPrev: page > 1,
            },
            stats,
        });
    } catch (error) {
        console.error('Erro ao buscar emails enviados:', error);
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
} 