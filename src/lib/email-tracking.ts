/**
 * Biblioteca para rastreamento de emails
 * Adiciona pixel de tracking e substitui links por URLs de tracking
 */

/**
 * Adiciona pixel de tracking para rastrear abertura do email
 * Usa atributos específicos para evitar carregamento automático
 */
export function addOpenTracking(htmlContent: string, trackingId: string, baseUrl: string): string {
    // Pixel de tracking otimizado para evitar falsos positivos
    const trackingPixel = `
        <img 
            src="${baseUrl}/api/track/open/${trackingId}" 
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

/**
 * Substitui todos os links por URLs de tracking para rastrear cliques
 */
export function addClickTracking(htmlContent: string, trackingId: string, baseUrl: string): string {
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

    // Adicionar tracking de cliques primeiro
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

/**
 * Valida se o User-Agent é de um cliente de email real
 * Filtra bots, crawlers e pre-loading
 */
export function isValidEmailClient(userAgent: string | null): boolean {
    if (!userAgent) return false;

    const userAgentLower = userAgent.toLowerCase();

    // Lista de bots e crawlers conhecidos
    const botPatterns = [
        'bot', 'crawler', 'spider', 'scraper', 'fetch', 'curl', 'wget',
        'googlebot', 'bingbot', 'slurp', 'duckduckbot', 'facebookexternalhit',
        'twitterbot', 'linkedinbot', 'whatsapp', 'telegrambot', 'slackbot',
        'microsoftpreview', 'outlooklinkthumbnail', 'gmail-mobile-linkcheck',
        'prefetch', 'preload', 'preview', 'proxy', 'monitor', 'check',
        'headless', 'phantom', 'selenium', 'automated'
    ];

    // Verificar se contém padrões de bot
    const isBot = botPatterns.some(pattern => userAgentLower.includes(pattern));
    if (isBot) return false;

    // Lista de clientes de email válidos
    const validEmailClients = [
        'outlook', 'thunderbird', 'apple mail', 'gmail', 'mail.ru',
        'yahoo mail', 'airmail', 'spark', 'mailbird', 'em client',
        'mail and calendar', 'windows mail', 'mail app', 'k-9 mail',
        'blue mail', 'mymail', 'email', 'mozilla'
    ];

    // Verificar se é um cliente de email conhecido
    const isEmailClient = validEmailClients.some(client =>
        userAgentLower.includes(client)
    );

    // Se não for identificado como cliente de email, verificar padrões suspeitos
    if (!isEmailClient) {
        // Permitir navegadores comuns (podem abrir emails)
        const commonBrowsers = ['chrome', 'firefox', 'safari', 'edge', 'opera'];
        const isBrowser = commonBrowsers.some(browser =>
            userAgentLower.includes(browser)
        );

        return isBrowser;
    }

    return true;
}

/**
 * Valida se o referrer indica uma abertura legítima
 */
export function isValidReferrer(referrer: string | null): boolean {
    if (!referrer) return true; // Sem referrer é normal para emails

    const referrerLower = referrer.toLowerCase();

    // Lista de referrers suspeitos
    const suspiciousReferrers = [
        'preview', 'scan', 'security', 'antivirus', 'filter',
        'protection', 'safe', 'check', 'verify', 'validate'
    ];

    return !suspiciousReferrers.some(pattern =>
        referrerLower.includes(pattern)
    );
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