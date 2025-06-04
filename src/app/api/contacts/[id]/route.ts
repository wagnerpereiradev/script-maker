import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

// GET - Buscar contato por ID
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const contact = await prisma.contact.findUnique({
            where: { id },
            include: {
                scripts: {
                    orderBy: { createdAt: 'desc' },
                    take: 5, // Últimos 5 scripts
                },
            },
        });

        if (!contact) {
            return NextResponse.json(
                { error: 'Contato não encontrado' },
                { status: 404 }
            );
        }

        return NextResponse.json(contact);
    } catch (error) {
        console.error('Erro ao buscar contato:', error);
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
}

// PUT - Atualizar contato
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
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
            isActive,
        } = body;

        // Validações básicas
        if (!name?.trim() || !email?.trim() || !companyName?.trim()) {
            return NextResponse.json(
                { error: 'Nome, email e empresa são obrigatórios' },
                { status: 400 }
            );
        }

        // Verificar se o contato existe
        const existingContact = await prisma.contact.findUnique({
            where: { id },
        });

        if (!existingContact) {
            return NextResponse.json(
                { error: 'Contato não encontrado' },
                { status: 404 }
            );
        }

        // Verificar se já existe outro contato com o mesmo email
        const duplicateContact = await prisma.contact.findFirst({
            where: {
                email: email.trim(),
                NOT: { id },
            },
        });

        if (duplicateContact) {
            return NextResponse.json(
                { error: 'Já existe outro contato com este email' },
                { status: 400 }
            );
        }

        const contact = await prisma.contact.update({
            where: { id },
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
                isActive: isActive ?? true,
            },
        });

        return NextResponse.json(contact);
    } catch (error) {
        console.error('Erro ao atualizar contato:', error);
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
}

// DELETE - Deletar contato
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Verificar se o contato existe
        const existingContact = await prisma.contact.findUnique({
            where: { id },
        });

        if (!existingContact) {
            return NextResponse.json(
                { error: 'Contato não encontrado' },
                { status: 404 }
            );
        }

        // Deletar o contato (os scripts relacionados continuarão existindo, apenas sem referência)
        await prisma.contact.delete({
            where: { id },
        });

        return NextResponse.json({
            message: 'Contato deletado com sucesso',
        });
    } catch (error) {
        console.error('Erro ao deletar contato:', error);
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
} 