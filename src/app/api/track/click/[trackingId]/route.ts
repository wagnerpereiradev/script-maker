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
        const { searchParams } = new URL(request.url);
        const originalUrl = searchParams.get('url');

        if (!trackingId) {
            return NextResponse.json({ error: 'Tracking ID não fornecido' }, { status: 400 });
        }

        if (!originalUrl) {
            return NextResponse.json({ error: 'URL original não fornecida' }, { status: 400 });
        }

        // Obter informações do request para validação
        const userAgent = request.headers.get('user-agent');
        const referrer = request.headers.get('referer') || request.headers.get('referrer');
        const forwardedFor = request.headers.get('x-forwarded-for');
        const realIp = request.headers.get('x-real-ip');

        // Log para debugging
        console.log('Click tracking attempt:', {
            trackingId,
            originalUrl,
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
                timestamp: new Date().toISOString()
            });
        } else {
            console.log('Click tracking blocked - invalid client or referrer:', {
                trackingId,
                originalUrl,
                isValidClient,
                isValidRef,
                userAgent,
                referrer
            });
        }

        // Sempre redirecionar para a URL original
        return NextResponse.redirect(decodeURIComponent(originalUrl), 302);

    } catch (error) {
        console.error('Erro no tracking de clique:', error);

        // Em caso de erro, tentar redirecionar mesmo assim
        const { searchParams } = new URL(request.url);
        const originalUrl = searchParams.get('url');

        if (originalUrl) {
            return NextResponse.redirect(decodeURIComponent(originalUrl), 302);
        }

        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
} 