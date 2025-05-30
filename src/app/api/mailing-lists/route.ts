import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const includeContacts = searchParams.get('includeContacts') === 'true';

        const mailingLists = await prisma.mailingList.findMany({
            include: {
                contacts: includeContacts,
                _count: {
                    select: {
                        contacts: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return NextResponse.json({
            success: true,
            mailingLists
        });
    } catch (error) {
        console.error('Erro ao buscar listas de e-mail:', error);
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, description, color } = body;

        if (!name || name.trim() === '') {
            return NextResponse.json(
                { error: 'Nome da lista é obrigatório' },
                { status: 400 }
            );
        }

        // Verificar se já existe uma lista com este nome
        const existingList = await prisma.mailingList.findUnique({
            where: { name: name.trim() }
        });

        if (existingList) {
            return NextResponse.json(
                { error: 'Já existe uma lista com este nome' },
                { status: 400 }
            );
        }

        const mailingList = await prisma.mailingList.create({
            data: {
                name: name.trim(),
                description: description?.trim() || null,
                color: color || '#3b82f6'
            },
            include: {
                _count: {
                    select: {
                        contacts: true
                    }
                }
            }
        });

        return NextResponse.json({
            success: true,
            mailingList
        });
    } catch (error) {
        console.error('Erro ao criar lista de e-mail:', error);

        if (error instanceof Error && error.message.includes('Unique constraint')) {
            return NextResponse.json(
                { error: 'Já existe uma lista com este nome' },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
} 