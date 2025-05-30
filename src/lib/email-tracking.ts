/**
 * Biblioteca para rastreamento de emails
 * Adiciona pixel de tracking e substitui links por URLs de tracking
 */

import { createHmac } from 'crypto';

/**
 * Gera token HMAC para validação de tracking
 */
export function generateTrackingToken(trackingId: string, secret?: string): string {
    const hmacSecret = secret || process.env.TRACKING_SECRET || 'default-secret-change-in-production';
    return createHmac('sha256', hmacSecret)
        .update(trackingId)
        .digest('hex')
        .substring(0, 16); // Usar apenas primeiros 16 caracteres para URL mais limpa
}

/**
 * Valida token HMAC de tracking
 */
export function validateTrackingToken(trackingId: string, token: string, secret?: string): boolean {
    const expectedToken = generateTrackingToken(trackingId, secret);
    return token === expectedToken;
}

/**
 * Adiciona pixel de tracking para rastrear abertura do email
 * Pode usar GIF dinâmico ou PNG estático da pasta public
 */
export function addOpenTracking(htmlContent: string, trackingId: string, baseUrl: string, useStaticPixel = false): string {
    const token = generateTrackingToken(trackingId);

    let pixelSrc: string;

    if (useStaticPixel) {
        // Usar PNG estático com tracking via JavaScript
        pixelSrc = `${baseUrl}/pixel-tracking.png`;
        const trackingPixel = `
            <img 
                src="${pixelSrc}" 
                width="1" 
                height="1" 
                style="display:none !important; visibility:hidden !important; opacity:0 !important; position:absolute !important; left:-9999px !important;" 
                alt="" 
                loading="lazy"
                data-email-tracking="open"
                onload="fetch('${baseUrl}/api/track/open/${trackingId}?t=${token}').catch(e=>{})"
            />
        `.trim();

        // Adicionar também um noscript fallback
        const noscriptFallback = `
            <noscript>
                <img src="${baseUrl}/api/track/open/${trackingId}?t=${token}" width="1" height="1" style="display:none" alt="" />
            </noscript>
        `.trim();

        const fullTracking = trackingPixel + '\n' + noscriptFallback;

        // Tentar adicionar antes do </body>
        if (htmlContent.includes('</body>')) {
            return htmlContent.replace('</body>', `${fullTracking}</body>`);
        } else if (htmlContent.includes('</html>')) {
            return htmlContent.replace('</html>', `${fullTracking}</html>`);
        } else {
            return htmlContent + fullTracking;
        }
    } else {
        // Pixel de tracking dinâmico - GIF 1x1 transparente
        pixelSrc = `${baseUrl}/api/track/open/${trackingId}?t=${token}`;
        const trackingPixel = `
            <img 
                src="${pixelSrc}" 
                width="1" 
                height="1" 
                style="display:none !important; visibility:hidden !important; opacity:0 !important; position:absolute !important; left:-9999px !important;" 
                alt="" 
                loading="lazy"
                data-email-tracking="open"
            />
        `.trim();

        // Tentar adicionar antes do </body>, se não existir, adicionar no final
        if (htmlContent.includes('</body>')) {
            return htmlContent.replace('</body>', `${trackingPixel}</body>`);
        } else if (htmlContent.includes('</html>')) {
            return htmlContent.replace('</html>', `${trackingPixel}</html>`);
        } else {
            return htmlContent + trackingPixel;
        }
    }
}

/**
 * Substitui todos os links por URLs de tracking para rastrear cliques
 */
export function addClickTracking(htmlContent: string, trackingId: string, baseUrl: string): string {
    const token = generateTrackingToken(trackingId);

    // Regex melhorada para encontrar links href
    const linkRegex = /href\s*=\s*["']([^"']+)["']/gi;

    return htmlContent.replace(linkRegex, (match, originalUrl) => {
        // Não trackear links internos, âncoras, mailto, tel, etc.
        if (
            originalUrl.startsWith('#') ||
            originalUrl.startsWith('mailto:') ||
            originalUrl.startsWith('tel:') ||
            originalUrl.startsWith('sms:') ||
            originalUrl.startsWith('javascript:') ||
            originalUrl.includes(baseUrl) || // Evitar loop de tracking
            originalUrl.startsWith('data:') ||
            originalUrl.startsWith('file:') ||
            originalUrl.length < 4 // URLs muito curtas
        ) {
            return match;
        }

        // Criar URL de tracking com token
        const encodedUrl = encodeURIComponent(originalUrl);
        const trackingUrl = `${baseUrl}/api/track/click/${trackingId}?url=${encodedUrl}&t=${token}`;

        return `href="${trackingUrl}"`;
    });
}

/**
 * Adiciona ambos os trackings (abertura e cliques) ao email
 */
export function addEmailTracking(htmlContent: string, trackingId: string, baseUrl: string, useStaticPixel = false): string {
    let processedContent = htmlContent;

    // Adicionar tracking de cliques primeiro
    processedContent = addClickTracking(processedContent, trackingId, baseUrl);

    // Adicionar tracking de abertura
    processedContent = addOpenTracking(processedContent, trackingId, baseUrl, useStaticPixel);

    return processedContent;
}

/**
 * Gerar URL base dinamicamente baseado no request
 */
export function getBaseUrl(request?: Request): string {
    if (typeof window !== 'undefined') {
        // Cliente
        return window.location.origin;
    }

    if (request) {
        // Servidor com request
        const host = request.headers.get('host');
        const protocol = request.headers.get('x-forwarded-proto') || 'http';
        return `${protocol}://${host}`;
    }

    // Fallback para desenvolvimento
    return process.env.NODE_ENV === 'production'
        ? 'https://scriptmaker.wagnerai.me'
        : 'https://scriptmaker.wagnerai.me';
}

/**
 * Valida se o User-Agent é de um cliente de email real
 * Validação SIMPLIFICADA - bloqueia apenas bots óbvios
 */
export function isValidEmailClient(userAgent: string | null): boolean {
    if (!userAgent) return true; // Aceitar mesmo sem User-Agent

    const userAgentLower = userAgent.toLowerCase();

    // Lista REDUZIDA - só bloquear bots óbvios
    const obviousBots = [
        'googlebot', 'bingbot', 'crawler', 'spider', 'scraper',
        'curl', 'wget', 'python-requests', 'node-fetch',
        'postman', 'insomnia', 'httpie'
    ];

    // Verificar se é bot óbvio
    const isObviousBot = obviousBots.some(pattern => userAgentLower.includes(pattern));

    // Se não é bot óbvio, aceitar (inclui todos os clientes de email e navegadores)
    return !isObviousBot;
}

/**
 * Valida se o referrer indica uma abertura legítima
 * Validação SIMPLIFICADA - aceita quase tudo
 */
export function isValidReferrer(): boolean {
    // Aceitar praticamente qualquer referrer ou ausência dele
    return true;
}

/**
 * Determina o próximo status baseado no status atual
 */
export function getNextStatus(currentStatus: string, actionType: 'open' | 'click'): string {
    const statusHierarchy = {
        'pending': 1,
        'sending': 2,
        'sent': 3,
        'delivered': 4,
        'opened': 5,
        'clicked': 6,
        'bounced': 7,
        'failed': 8
    };

    const currentLevel = statusHierarchy[currentStatus as keyof typeof statusHierarchy] || 0;

    if (actionType === 'open') {
        // Só atualizar para 'opened' se o status atual permitir
        if (currentLevel >= 3 && currentLevel < 5) { // sent, delivered
            return 'opened';
        }
    } else if (actionType === 'click') {
        // Atualizar para 'clicked' se possível
        if (currentLevel >= 3 && currentLevel < 6) { // sent, delivered, opened
            return 'clicked';
        }
    }

    // Manter status atual se não pode ser atualizado
    return currentStatus;
}

/**
 * Retorna o pixel de tracking transparente otimizado
 * GIF 1x1 transparente de 43 bytes (mais eficiente que PNG)
 */
export function getOptimizedTrackingPixel(): Buffer {
    // GIF transparente 1x1 (43 bytes) - mais leve que PNG
    return Buffer.from(
        'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
        'base64'
    );
} 