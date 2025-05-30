import { NextRequest, NextResponse } from 'next/server';
import { EmailStatus } from '@/generated/prisma';
import { prisma } from '@/lib/prisma';
import { isValidEmailClient, isValidReferrer, getNextStatus, validateTrackingToken, getOptimizedTrackingPixel } from '@/lib/email-tracking';

// Cache para IPs já processados (evitar múltiplos opens do mesmo IP)
const processedIPs = new Map<string, Set<string>>();

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ trackingId: string }> }
) {
    try {
        const { trackingId } = await params;
        const { searchParams } = new URL(request.url);
        const token = searchParams.get('t');

        if (!trackingId) {
            return getOptimizedTrackingPixelResponse(trackingId);
        }

        // Validar token HMAC
        if (!token || !validateTrackingToken(trackingId, token)) {
            console.log('Open tracking blocked - invalid token:', {
                trackingId,
                token,
                timestamp: new Date().toISOString()
            });
            return getOptimizedTrackingPixelResponse(trackingId);
        }

        // Obter informações do request para validação
        const userAgent = request.headers.get('user-agent');
        const referrer = request.headers.get('referer') || request.headers.get('referrer');
        const forwardedFor = request.headers.get('x-forwarded-for');
        const realIp = request.headers.get('x-real-ip');
        const clientIp = forwardedFor?.split(',')[0] || realIp || 'unknown';

        // Log para debugging (remover em produção se necessário)
        console.log('Open tracking attempt:', {
            trackingId,
            userAgent,
            referrer,
            ip: clientIp,
            timestamp: new Date().toISOString()
        });

        // Verificar se já processamos este IP para este trackingId (anti-duplicação)
        if (!processedIPs.has(trackingId)) {
            processedIPs.set(trackingId, new Set());
        }

        const trackingSet = processedIPs.get(trackingId)!;
        if (trackingSet.has(clientIp)) {
            console.log('Open tracking skipped - IP already processed:', {
                trackingId,
                ip: clientIp
            });
            return getOptimizedTrackingPixelResponse(trackingId);
        }

        // Validações de segurança melhoradas
        const isValidClient = isValidEmailClient(userAgent);
        const isValidRef = isValidReferrer(referrer);

        // Buscar email pelo trackingId
        const email = await prisma.emailSent.findFirst({
            where: { trackingId },
        });

        if (!email) {
            // Ainda retornar pixel mesmo se email não encontrado
            return getOptimizedTrackingPixelResponse(trackingId);
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

                // Adicionar IP ao conjunto de processados
                trackingSet.add(clientIp);

                console.log('Email marked as opened:', {
                    emailId: email.id,
                    toEmail: email.toEmail,
                    previousStatus: email.status,
                    newStatus: nextStatus,
                    userAgent,
                    ip: clientIp,
                    timestamp: new Date().toISOString()
                });
            }
        } else if (!isValidClient || !isValidRef) {
            console.log('Open tracking blocked - invalid client or referrer:', {
                trackingId,
                isValidClient,
                isValidRef,
                userAgent,
                referrer,
                ip: clientIp
            });
        } else if (email.opened) {
            console.log('Open tracking skipped - already marked as opened:', {
                trackingId,
                openedAt: email.openedAt
            });
        }

        return getOptimizedTrackingPixelResponse(trackingId);

    } catch (error) {
        console.error('Erro no tracking de abertura:', error);
        // Sempre retornar pixel mesmo em caso de erro
        const { trackingId } = await params;
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
            'Vary': 'User-Agent', // Diferenciar por cliente
        },
    });

    // Adicionar ETag para forçar revalidação
    if (trackingId) {
        response.headers.set('ETag', `"${trackingId}"`);
    }

    return response;
}

// Limpeza periódica do cache de IPs (executar a cada hora)
setInterval(() => {
    // Limpar entradas antigas (simplificado - em produção usar Redis ou similar)
    if (processedIPs.size > 1000) {
        processedIPs.clear();
        console.log('Cleaned up processed IPs cache');
    }
}, 60 * 60 * 1000); // 1 hora 