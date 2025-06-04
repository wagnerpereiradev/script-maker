import { NextRequest, NextResponse } from 'next/server';
import { EmailStatus } from '@/generated/prisma';
import { prisma } from '@/lib/prisma';
import { isValidEmailClient, isValidReferrer, getNextStatus, validateTrackingToken } from '@/lib/email-tracking';

export async function GET(
    request: NextRequest,
    { params }: { params: { trackingId: string } }
) {
    try {
        const { trackingId } = params;
        const { searchParams } = new URL(request.url);
        const originalUrl = searchParams.get('url');
        const token = searchParams.get('t');

        if (!trackingId) {
            return NextResponse.json({ error: 'Tracking ID não fornecido' }, { status: 400 });
        }

        if (!originalUrl) {
            return NextResponse.json({ error: 'URL original não fornecida' }, { status: 400 });
        }

        // Validar token HMAC
        if (!token || !validateTrackingToken(trackingId, token)) {
            console.log('Click tracking blocked - invalid token:', {
                trackingId,
                token,
                originalUrl,
                timestamp: new Date().toISOString()
            });
            // Mesmo com token inválido, redirecionar para não quebrar a experiência
            return NextResponse.redirect(decodeURIComponent(originalUrl), 302);
        }

        // Obter informações do request para validação
        const userAgent = request.headers.get('user-agent');
        const referrer = request.headers.get('referer') || request.headers.get('referrer');
        const forwardedFor = request.headers.get('x-forwarded-for');
        const realIp = request.headers.get('x-real-ip');
        const clientIp = forwardedFor?.split(',')[0] || realIp || 'unknown';

        // Log para debugging
        console.log('Click tracking attempt:', {
            trackingId,
            originalUrl,
            userAgent,
            referrer,
            ip: clientIp,
            timestamp: new Date().toISOString()
        });

        // Validações de segurança melhoradas
        const isValidClient = isValidEmailClient(userAgent);
        const isValidRef = isValidReferrer();

        // Buscar email pelo trackingId
        const email = await prisma.emailSent.findFirst({
            where: { trackingId },
        });

        if (!email) {
            // Mesmo sem email, redirecionar para a URL original
            return NextResponse.redirect(decodeURIComponent(originalUrl), 302);
        }

        // Só atualizar se passar nas validações
        if (isValidClient && isValidRef) {
            const nextStatus = getNextStatus(email.status, 'click') as EmailStatus;

            const updateData: {
                clicked: boolean;
                status: EmailStatus;
                opened?: boolean;
                openedAt?: Date;
                clickedAt?: Date;
            } = {
                clicked: true,
                status: nextStatus,
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

            console.log('Email marked as clicked:', {
                emailId: email.id,
                toEmail: email.toEmail,
                originalUrl,
                previousStatus: email.status,
                newStatus: nextStatus,
                userAgent,
                ip: clientIp,
                timestamp: new Date().toISOString()
            });
        } else {
            console.log('Click tracking blocked - invalid client or referrer:', {
                trackingId,
                originalUrl,
                isValidClient,
                isValidRef,
                userAgent,
                referrer,
                ip: clientIp
            });
        }

        // Sempre redirecionar para a URL original
        return NextResponse.redirect(decodeURIComponent(originalUrl), 302);

    } catch (error) {
        console.error('Erro no tracking de clique:', error);

        // Em caso de erro, ainda tentar redirecionar
        try {
            const { searchParams } = new URL(request.url);
            const originalUrl = searchParams.get('url');
            if (originalUrl) {
                return NextResponse.redirect(decodeURIComponent(originalUrl), 302);
            }
        } catch (urlError) {
            console.error('Erro ao extrair URL original:', urlError);
        }

        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
} 