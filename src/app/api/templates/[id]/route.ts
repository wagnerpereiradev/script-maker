import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const template = await prisma.emailTemplate.findUnique({
            where: { id },
        });

        if (!template) {
            return NextResponse.json(
                { error: 'Template não encontrado' },
                { status: 404 }
            );
        }

        return NextResponse.json(template);
    } catch (error) {
        console.error('Erro ao buscar template:', error);
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

        const {
            name,
            description,
            subject,
            htmlContent,
            category,
            isActive,
        } = body;

        // Validações básicas
        if (!name?.trim() || !subject?.trim() || !htmlContent?.trim()) {
            return NextResponse.json(
                { error: 'Nome, assunto e conteúdo HTML são obrigatórios' },
                { status: 400 }
            );
        }

        const template = await prisma.emailTemplate.update({
            where: { id },
            data: {
                name: name.trim(),
                description: description?.trim() || null,
                subject: subject.trim(),
                htmlContent: htmlContent.trim(),
                category: category?.trim() || null,
                isActive: isActive ?? true,
            },
        });

        return NextResponse.json(template);
    } catch (error) {
        console.error('Erro ao atualizar template:', error);
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

        // Verificar se o template existe
        const existingTemplate = await prisma.emailTemplate.findUnique({
            where: { id },
        });

        if (!existingTemplate) {
            return NextResponse.json(
                { error: 'Template não encontrado' },
                { status: 404 }
            );
        }

        await prisma.emailTemplate.delete({
            where: { id },
        });

        return NextResponse.json({
            message: 'Template deletado com sucesso',
        });
    } catch (error) {
        console.error('Erro ao deletar template:', error);
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
} 