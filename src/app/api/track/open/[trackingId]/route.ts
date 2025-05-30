import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

export async function GET(
    request: NextRequest,
    { params }: { params: { trackingId: string } }
) {
    try {
        const { trackingId } = params;

        if (!trackingId) {
            return new NextResponse('Tracking ID não fornecido', { status: 400 });
        }

        // Buscar email pelo trackingId
        const email = await prisma.emailSent.findFirst({
            where: { trackingId },
        });

        if (!email) {
            return new NextResponse('Email não encontrado', { status: 404 });
        }

        // Atualizar status para aberto (apenas se ainda não foi aberto)
        if (!email.opened) {
            await prisma.emailSent.update({
                where: { id: email.id },
                data: {
                    opened: true,
                    openedAt: new Date(),
                    status: email.status === 'sent' ? 'opened' : email.status, // Manter status mais avançado se existir
                },
            });
        }

        // Retornar pixel transparente 1x1
        const pixelBuffer = Buffer.from(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
            'base64'
        );

        return new NextResponse(pixelBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'image/png',
                'Content-Length': pixelBuffer.length.toString(),
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0',
            },
        });
    } catch (error) {
        console.error('Erro no tracking de abertura:', error);
        // Mesmo em caso de erro, retornar pixel transparente
        const pixelBuffer = Buffer.from(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
            'base64'
        );
        return new NextResponse(pixelBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'image/png',
                'Content-Length': pixelBuffer.length.toString(),
            },
        });
    }
} 