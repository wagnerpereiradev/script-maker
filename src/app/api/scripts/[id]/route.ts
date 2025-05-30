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

        // Formatar resposta igual ao lib/scripts.ts
        const formattedScript = {
            id: script.id,
            subject: script.subject,
            body: script.body,
            prospectData: {
                contactName: script.contactName,
                companyName: script.companyName,
                niche: script.niche,
                position: script.position,
                email: script.email,
                phone: script.phone,
                website: script.website,
                painPoints: script.painPoints,
                previousInteraction: script.previousInteraction,
                notes: script.notes,
            },
            emailType: script.emailType,
            tone: script.tone,
            length: script.length,
            callToAction: script.callToAction,
            createdAt: script.createdAt,
            updatedAt: script.updatedAt,
        };

        return NextResponse.json(formattedScript);
    } catch (error) {
        console.error('Erro ao buscar script:', error);
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        );
    } finally {
        await new PrismaClient().$disconnect();
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const prisma = new PrismaClient();
        const body = await request.json();

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

        // Validação básica
        if (!body.subject || !body.body) {
            return NextResponse.json(
                { error: 'Assunto e corpo do email são obrigatórios' },
                { status: 400 }
            );
        }

        // Atualizar o script com campos individuais
        const updatedScript = await prisma.emailScript.update({
            where: { id },
            data: {
                subject: body.subject,
                body: body.body,
                emailType: body.emailType,
                tone: body.tone,
                length: body.length,
                callToAction: body.callToAction,
                // Dados do prospect - campos individuais
                contactName: body.prospectData?.contactName || '',
                companyName: body.prospectData?.companyName || '',
                niche: body.prospectData?.niche || '',
                position: body.prospectData?.position || null,
                website: body.prospectData?.website || null,
                painPoints: body.prospectData?.painPoints || null,
            },
        });

        return NextResponse.json({
            message: 'Script atualizado com sucesso',
            script: updatedScript,
        });
    } catch (error) {
        console.error('Erro ao atualizar script:', error);
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        );
    } finally {
        await new PrismaClient().$disconnect();
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
    } finally {
        await new PrismaClient().$disconnect();
    }
} 