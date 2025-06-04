import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const mailingList = await prisma.mailingList.findUnique({
            where: { id },
            include: {
                contacts: {
                    orderBy: {
                        name: 'asc'
                    }
                },
                _count: {
                    select: {
                        contacts: true
                    }
                }
            }
        });

        if (!mailingList) {
            return NextResponse.json(
                { error: 'Lista não encontrada' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            mailingList
        });
    } catch (error) {
        console.error('Erro ao buscar lista:', error);
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { name, description, color } = body;

        if (!name || name.trim() === '') {
            return NextResponse.json(
                { error: 'Nome da lista é obrigatório' },
                { status: 400 }
            );
        }

        // Verificar se a lista existe
        const existingList = await prisma.mailingList.findUnique({
            where: { id }
        });

        if (!existingList) {
            return NextResponse.json(
                { error: 'Lista não encontrada' },
                { status: 404 }
            );
        }

        // Verificar se já existe outra lista com este nome
        const duplicateList = await prisma.mailingList.findFirst({
            where: {
                name: name.trim(),
                NOT: { id }
            }
        });

        if (duplicateList) {
            return NextResponse.json(
                { error: 'Já existe uma lista com este nome' },
                { status: 400 }
            );
        }

        const updatedList = await prisma.mailingList.update({
            where: { id },
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
            mailingList: updatedList
        });
    } catch (error) {
        console.error('Erro ao atualizar lista:', error);
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Verificar se a lista existe
        const existingList = await prisma.mailingList.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        contacts: true
                    }
                }
            }
        });

        if (!existingList) {
            return NextResponse.json(
                { error: 'Lista não encontrada' },
                { status: 404 }
            );
        }

        // Desvincular todos os contatos da lista antes de deletá-la
        await prisma.contact.updateMany({
            where: { mailingListId: id },
            data: { mailingListId: null }
        });

        // Deletar a lista
        await prisma.mailingList.delete({
            where: { id }
        });

        return NextResponse.json({
            success: true,
            message: `Lista "${existingList.name}" deletada com sucesso. ${existingList._count.contacts} contatos foram desvinculados.`
        });
    } catch (error) {
        console.error('Erro ao deletar lista:', error);
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
} 