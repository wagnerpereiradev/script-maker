import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const prisma = new PrismaClient();

        const script = await prisma.emailScript.findUnique({
            where: { id },
            include: {
                contact: true,
            },
        });

        if (!script) {
            return NextResponse.json(
                { error: 'Script não encontrado' },
                { status: 404 }
            );
        }

        return NextResponse.json(script);
    } catch (error) {
        console.error('Erro ao buscar script:', error);
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
        const prisma = new PrismaClient();

        // Verificar se o script existe
        const existingScript = await prisma.emailScript.findUnique({
            where: { id },
        });

        if (!existingScript) {
            return NextResponse.json(
                { error: 'Script não encontrado' },
                { status: 404 }
            );
        }

        await prisma.emailScript.delete({
            where: { id },
        });

        return NextResponse.json({
            message: 'Script deletado com sucesso',
        });
    } catch (error) {
        console.error('Erro ao deletar script:', error);
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
} 