import { NextRequest, NextResponse } from 'next/server';
import { EmailStatus } from '@/generated/prisma';
import { prisma } from '@/lib/prisma';
import { isValidEmailClient, isValidReferrer, getNextStatus, validateTrackingToken, getOptimizedTrackingPixel } from '@/lib/email-tracking';

export async function GET(
    request: NextRequest,
    { params }: { params: { trackingId: string } }
) {
    try {
        const { trackingId } = params;
        const { searchParams } = new URL(request.url);
        const token = searchParams.get('t');

        // Obter informações do request
        const userAgent = request.headers.get('user-agent');
        const referrer = request.headers.get('referer') || request.headers.get('referrer');
        const forwardedFor = request.headers.get('x-forwarded-for');
        const realIp = request.headers.get('x-real-ip');
        const clientIp = forwardedFor?.split(',')[0] || realIp || 'unknown';

        // Log SEMPRE para debugging
        console.log('=== TRACKING ATTEMPT ===');
        console.log('TrackingId:', trackingId);
        console.log('Token:', token);
        console.log('UserAgent:', userAgent);
        console.log('Referrer:', referrer);
        console.log('ClientIP:', clientIp);
        console.log('Timestamp:', new Date().toISOString());

        if (!trackingId) {
            console.log('❌ No tracking ID provided');
            return getOptimizedTrackingPixelResponse(trackingId);
        }

        // Validar token HMAC (mais tolerante)
        if (!token || !validateTrackingToken(trackingId, token)) {
            console.log('⚠️  Invalid token, but continuing with tracking');
            // Continuar mesmo com token inválido para debug
        }

        // Buscar email pelo trackingId
        const email = await prisma.emailSent.findFirst({
            where: { trackingId },
        });

        if (!email) {
            console.log('❌ Email not found in database');
            return getOptimizedTrackingPixelResponse(trackingId);
        }

        console.log('📧 Email found:', {
            id: email.id,
            toEmail: email.toEmail,
            status: email.status,
            opened: email.opened,
            openedAt: email.openedAt
        });

        // Validações simplificadas
        const isValidClient = isValidEmailClient(userAgent);
        const isValidRef = isValidReferrer();

        console.log('🔍 Validations:', {
            isValidClient,
            isValidRef,
            alreadyOpened: email.opened
        });

        // Atualizar SEMPRE se ainda não foi marcado como aberto (para debug)
        if (!email.opened) {
            const nextStatus = getNextStatus(email.status, 'open') as EmailStatus;

            console.log('🔄 Updating email status:', {
                from: email.status,
                to: nextStatus
            });

            await prisma.emailSent.update({
                where: { id: email.id },
                data: {
                    opened: true,
                    openedAt: new Date(),
                    status: nextStatus,
                },
            });

            console.log('✅ Email marked as opened successfully');
        } else {
            console.log('ℹ️  Email already marked as opened at:', email.openedAt);
        }

        console.log('=== END TRACKING ===\n');
        return getOptimizedTrackingPixelResponse(trackingId);

    } catch (error) {
        console.error('❌ ERROR in tracking:', error);
        // Sempre retornar pixel mesmo em caso de erro
        const { trackingId } = params;
        return getOptimizedTrackingPixelResponse(trackingId);
    }
}

/**
 * Retorna o pixel de tracking transparente otimizado com headers melhorados
 */
function getOptimizedTrackingPixelResponse(trackingId?: string): NextResponse {
    const pixelBuffer = getOptimizedTrackingPixel();

    const response = new NextResponse(pixelBuffer, {
        status: 200,
        headers: {
            'Content-Type': 'image/gif',
            'Content-Length': pixelBuffer.length.toString(),
            'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
            'Pragma': 'no-cache',
            'Expires': '0',
            'X-Robots-Tag': 'noindex, nofollow',
            'Access-Control-Allow-Origin': '*',
            'Vary': 'User-Agent',
        },
    });

    // Adicionar ETag para forçar revalidação
    if (trackingId) {
        response.headers.set('ETag', `"${trackingId}"`);
    }

    return response;
} 