import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ trackingId: string }> }
) {
    try {
        const { trackingId } = await context.params;

        if (!trackingId) {
            return new NextResponse('Tracking ID não fornecido', { status: 400 });
        }

        // Buscar email pelo tracking ID
        const email = await prisma.emailSent.findFirst({
            where: { trackingId },
        });

        if (email) {
            // Atualizar apenas se ainda não foi marcado como aberto
            if (!email.opened && !email.openedAt) {
                await prisma.emailSent.update({
                    where: { id: email.id },
                    data: {
                        opened: true,
                        openedAt: new Date(),
                        status: email.status === 'sent' ? 'opened' : email.status,
                    },
                });
            }
        }

        // Retornar um pixel transparente 1x1
        const pixel = Buffer.from(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
            'base64'
        );

        return new NextResponse(pixel, {
            status: 200,
            headers: {
                'Content-Type': 'image/png',
                'Content-Length': pixel.length.toString(),
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0',
            },
        });

    } catch (error) {
        console.error('Erro no tracking de email:', error);

        // Ainda retornar o pixel mesmo em caso de erro
        const pixel = Buffer.from(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
            'base64'
        );

        return new NextResponse(pixel, {
            status: 200,
            headers: {
                'Content-Type': 'image/png',
                'Content-Length': pixel.length.toString(),
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0',
            },
        });
    }
} 