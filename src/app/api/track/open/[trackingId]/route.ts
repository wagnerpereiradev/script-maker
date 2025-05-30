import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, EmailStatus } from '@/generated/prisma';
import { isValidEmailClient, isValidReferrer, getNextStatus } from '@/lib/email-tracking';

const prisma = new PrismaClient();

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ trackingId: string }> }
) {
    try {
        const { trackingId } = await params;

        if (!trackingId) {
            return new NextResponse('Tracking ID não fornecido', { status: 400 });
        }

        // Obter informações do request para validação
        const userAgent = request.headers.get('user-agent');
        const referrer = request.headers.get('referer') || request.headers.get('referrer');
        const forwardedFor = request.headers.get('x-forwarded-for');
        const realIp = request.headers.get('x-real-ip');

        // Log para debugging (remover em produção se necessário)
        console.log('Open tracking attempt:', {
            trackingId,
            userAgent,
            referrer,
            ip: forwardedFor || realIp,
            timestamp: new Date().toISOString()
        });

        // Validações de segurança
        const isValidClient = isValidEmailClient(userAgent);
        const isValidRef = isValidReferrer(referrer);

        // Buscar email pelo trackingId
        const email = await prisma.emailSent.findFirst({
            where: { trackingId },
        });

        if (!email) {
            // Ainda retornar pixel mesmo se email não encontrado
            return getTrackingPixelResponse();
        }

        // Só atualizar se passar nas validações e ainda não foi marcado como aberto
        if (isValidClient && isValidRef && !email.opened) {
            const nextStatus = getNextStatus(email.status, 'open') as EmailStatus;

            // Só atualizar se o status deve mudar
            if (nextStatus !== email.status || !email.opened) {
                await prisma.emailSent.update({
                    where: { id: email.id },
                    data: {
                        opened: true,
                        openedAt: new Date(),
                        status: nextStatus,
                    },
                });

                console.log('Email marked as opened:', {
                    emailId: email.id,
                    toEmail: email.toEmail,
                    previousStatus: email.status,
                    newStatus: nextStatus,
                    userAgent,
                    timestamp: new Date().toISOString()
                });
            }
        } else if (!isValidClient || !isValidRef) {
            console.log('Open tracking blocked - invalid client or referrer:', {
                trackingId,
                isValidClient,
                isValidRef,
                userAgent,
                referrer
            });
        }

        return getTrackingPixelResponse();

    } catch (error) {
        console.error('Erro no tracking de abertura:', error);
        // Sempre retornar pixel mesmo em caso de erro
        return getTrackingPixelResponse();
    }
}

/**
 * Retorna o pixel de tracking transparente
 */
function getTrackingPixelResponse(): NextResponse {
    // Pixel transparente 1x1 PNG otimizado
    const pixelBuffer = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        'base64'
    );

    return new NextResponse(pixelBuffer, {
        status: 200,
        headers: {
            'Content-Type': 'image/png',
            'Content-Length': pixelBuffer.length.toString(),
            'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
            'Pragma': 'no-cache',
            'Expires': '0',
            'X-Robots-Tag': 'noindex, nofollow',
            'Access-Control-Allow-Origin': '*',
        },
    });
} 