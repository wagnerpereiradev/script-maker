import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, type Prisma } from '@/generated/prisma';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
    try {
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
        });
    } catch (error) {
        console.error('Erro ao buscar emails enviados:', error);
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
} 