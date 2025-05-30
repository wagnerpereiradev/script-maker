/**
 * Biblioteca para rastreamento de emails
 * Adiciona pixel de tracking e substitui links por URLs de tracking
 */

/**
 * Adiciona pixel de tracking para rastrear abertura do email
 */
export function addOpenTracking(htmlContent: string, trackingId: string, baseUrl: string): string {
    // Pixel de tracking (imagem 1x1 transparente)
    const trackingPixel = `<img src="${baseUrl}/api/track/open/${trackingId}" width="1" height="1" style="display:none;" alt="" />`;

    // Tentar adicionar antes do </body>, se não existir, adicionar no final
    if (htmlContent.includes('</body>')) {
        return htmlContent.replace('</body>', `${trackingPixel}</body>`);
    } else {
        return htmlContent + trackingPixel;
    }
}

/**
 * Substitui todos os links por URLs de tracking para rastrear cliques
 */
export function addClickTracking(htmlContent: string, trackingId: string, baseUrl: string): string {
    // Regex para encontrar links href
    const linkRegex = /href\s*=\s*["']([^"']+)["']/gi;

    return htmlContent.replace(linkRegex, (match, originalUrl) => {
        // Não trackear links internos, mailto, tel, etc.
        if (
            originalUrl.startsWith('#') ||
            originalUrl.startsWith('mailto:') ||
            originalUrl.startsWith('tel:') ||
            originalUrl.startsWith('sms:') ||
            originalUrl.includes(baseUrl) // Evitar loop de tracking
        ) {
            return match;
        }

        // Criar URL de tracking
        const encodedUrl = encodeURIComponent(originalUrl);
        const trackingUrl = `${baseUrl}/api/track/click/${trackingId}?url=${encodedUrl}`;

        return `href="${trackingUrl}"`;
    });
}

/**
 * Adiciona ambos os trackings (abertura e cliques) ao email
 */
export function addEmailTracking(htmlContent: string, trackingId: string, baseUrl: string): string {
    let processedContent = htmlContent;

    // Adicionar tracking de cliques
    processedContent = addClickTracking(processedContent, trackingId, baseUrl);

    // Adicionar tracking de abertura
    processedContent = addOpenTracking(processedContent, trackingId, baseUrl);

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