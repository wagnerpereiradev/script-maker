import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { addEmailTracking, getBaseUrl } from '@/lib/email-tracking';

export async function GET(request: NextRequest) {
    try {
        // Pegar últimos emails enviados
        const recentEmails = await prisma.emailSent.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                trackingId: true,
                toEmail: true,
                subject: true,
                status: true,
                opened: true,
                openedAt: true,
                htmlContent: true
            }
        });

        const baseUrl = getBaseUrl(request);

        const testResults = recentEmails.map(email => {
            if (!email.trackingId) return null;

            // Verificar se o HTML contém o pixel de tracking
            const hasOpenPixel = email.htmlContent.includes('/api/track/open/');
            const hasClickTracking = email.htmlContent.includes('/api/track/click/');

            return {
                emailId: email.id,
                trackingId: email.trackingId,
                toEmail: email.toEmail,
                subject: email.subject,
                status: email.status,
                opened: email.opened,
                openedAt: email.openedAt,
                trackingUrls: {
                    openUrl: `${baseUrl}/api/track/open/${email.trackingId}`,
                    testOpenUrl: `${baseUrl}/api/track/open/${email.trackingId}?test=1`,
                },
                analysis: {
                    hasOpenPixel,
                    hasClickTracking,
                    htmlContentLength: email.htmlContent.length,
                    containsTracking: hasOpenPixel || hasClickTracking
                }
            };
        }).filter(Boolean);

        return NextResponse.json({
            message: 'Teste de tracking - últimos emails',
            baseUrl,
            totalEmails: testResults.length,
            results: testResults,
            instructions: {
                manualTest: 'Acesse uma das URLs testOpenUrl em seu navegador para simular abertura',
                checkLogs: 'Verifique os logs do servidor após acessar a URL',
                verifyDatabase: 'Confirme se o status do email mudou para "opened" no banco'
            }
        });

    } catch (error) {
        console.error('Erro no teste de tracking:', error);
        return NextResponse.json(
            { error: 'Erro interno do servidor', details: error },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { htmlContent, trackingId } = body;

        if (!htmlContent || !trackingId) {
            return NextResponse.json(
                { error: 'htmlContent e trackingId são obrigatórios' },
                { status: 400 }
            );
        }

        const baseUrl = getBaseUrl(request);

        // Adicionar tracking ao HTML
        const htmlWithTracking = addEmailTracking(htmlContent, trackingId, baseUrl);

        return NextResponse.json({
            message: 'HTML processado com tracking',
            original: {
                length: htmlContent.length,
                content: htmlContent.substring(0, 200) + '...'
            },
            processed: {
                length: htmlWithTracking.length,
                content: htmlWithTracking.substring(0, 500) + '...',
                fullContent: htmlWithTracking
            },
            tracking: {
                trackingId,
                openUrl: `${baseUrl}/api/track/open/${trackingId}`,
                difference: htmlWithTracking.length - htmlContent.length
            }
        });

    } catch (error) {
        console.error('Erro no processamento de tracking:', error);
        return NextResponse.json(
            { error: 'Erro interno do servidor', details: error },
            { status: 500 }
        );
    }
} 