import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

// GET - Listar contatos com filtros e paginação
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);

        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const search = searchParams.get('search') || '';
        const isActive = searchParams.get('isActive');

        const offset = (page - 1) * limit;

        // Filtros dinâmicos
        const where: Record<string, unknown> = {};

        if (search) {
            where.OR = [
                { name: { contains: search } },
                { email: { contains: search } },
                { companyName: { contains: search } },
                { position: { contains: search } },
            ];
        }

        if (isActive !== null && isActive !== '') {
            where.isActive = isActive === 'true';
        }

        // Buscar contatos com contagem total
        const [contacts, total] = await Promise.all([
            prisma.contact.findMany({
                where,
                orderBy: { updatedAt: 'desc' },
                skip: offset,
                take: limit,
            }),
            prisma.contact.count({ where }),
        ]);

        const pages = Math.ceil(total / limit);

        return NextResponse.json({
            contacts,
            total,
            pages,
            currentPage: page,
        });
    } catch (error) {
        console.error('Erro ao buscar contatos:', error);
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
}

// POST - Criar novo contato
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const {
            name,
            email,
            phone,
            position,
            companyName,
            website,
            niche,
            painPoints,
            previousInteraction,
            notes,
            isActive = true,
        } = body;

        // Validações básicas
        if (!name?.trim() || !email?.trim() || !companyName?.trim()) {
            return NextResponse.json(
                { error: 'Nome, email e empresa são obrigatórios' },
                { status: 400 }
            );
        }

        // Verificar se já existe contato com o mesmo email
        const existingContact = await prisma.contact.findFirst({
            where: { email: email.trim() },
        });

        if (existingContact) {
            return NextResponse.json(
                { error: 'Já existe um contato com este email' },
                { status: 400 }
            );
        }

        const contact = await prisma.contact.create({
            data: {
                name: name.trim(),
                email: email.trim(),
                phone: phone?.trim() || null,
                position: position?.trim() || null,
                companyName: companyName.trim(),
                website: website?.trim() || null,
                niche: niche?.trim() || null,
                painPoints: painPoints?.trim() || null,
                previousInteraction: previousInteraction?.trim() || null,
                notes: notes?.trim() || null,
                isActive,
            },
        });

        return NextResponse.json(contact, { status: 201 });
    } catch (error: unknown) {
        console.error('Erro ao criar contato:', error);
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
}

// DELETE - Deletar múltiplos contatos
export async function DELETE(request: NextRequest) {
    try {
        const body = await request.json();
        const { ids } = body;

        if (!Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json(
                { error: 'Lista de IDs é obrigatória' },
                { status: 400 }
            );
        }

        const deletedCount = await prisma.contact.deleteMany({
            where: {
                id: { in: ids },
            },
        });

        return NextResponse.json({
            message: `${deletedCount.count} contato(s) deletado(s) com sucesso`,
            deletedCount: deletedCount.count,
        });
    } catch (error) {
        console.error('Erro ao deletar contatos:', error);
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
} 