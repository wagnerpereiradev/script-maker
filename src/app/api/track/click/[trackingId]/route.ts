import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

export async function GET(
    request: NextRequest,
    { params }: { params: { trackingId: string } }
) {
    try {
        const { trackingId } = params;
        const { searchParams } = new URL(request.url);
        const originalUrl = searchParams.get('url');

        if (!trackingId) {
            return NextResponse.json({ error: 'Tracking ID não fornecido' }, { status: 400 });
        }

        if (!originalUrl) {
            return NextResponse.json({ error: 'URL original não fornecida' }, { status: 400 });
        }

        // Buscar email pelo trackingId
        const email = await prisma.emailSent.findFirst({
            where: { trackingId },
        });

        if (!email) {
            return NextResponse.json({ error: 'Email não encontrado' }, { status: 404 });
        }

        // Atualizar status para clicado
        const updateData: any = {
            clicked: true,
            status: 'clicked', // Atualizar status para clicked
        };

        // Se ainda não foi aberto, marcar como aberto também
        if (!email.opened) {
            updateData.opened = true;
            updateData.openedAt = new Date();
        }

        // Se ainda não tem clickedAt, definir agora
        if (!email.clickedAt) {
            updateData.clickedAt = new Date();
        }

        await prisma.emailSent.update({
            where: { id: email.id },
            data: updateData,
        });

        // Redirecionar para a URL original
        return NextResponse.redirect(decodeURIComponent(originalUrl), 302);

    } catch (error) {
        console.error('Erro no tracking de clique:', error);

        // Em caso de erro, tentar redirecionar para a URL original se possível
        const { searchParams } = new URL(request.url);
        const originalUrl = searchParams.get('url');

        if (originalUrl) {
            return NextResponse.redirect(decodeURIComponent(originalUrl), 302);
        }

        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
} 