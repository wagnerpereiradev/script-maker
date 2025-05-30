// Versão para Edge Runtime - compatível com middleware
export interface AuthUser {
    id: string;
    email: string;
    name: string;
    role: 'USER' | 'ADMIN';
}

/**
 * Verificação básica de token JWT para Edge Runtime
 * Apenas verifica se o token não expirou e tem a estrutura básica
 */
export function verifyTokenSimple(token: string): AuthUser | null {
    try {
        if (!token || typeof token !== 'string') {
            return null;
        }

        // Verificar estrutura básica do JWT
        const parts = token.split('.');
        if (parts.length !== 3) {
            return null;
        }

        // Decodificar payload (sem verificar assinatura por simplicidade no middleware)
        const base64Payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(atob(base64Payload));

        // Verificar expiração básica
        if (payload.exp && Date.now() >= payload.exp * 1000) {
            return null;
        }

        // Verificar campos obrigatórios
        if (!payload.id || !payload.email || !payload.name || !payload.role) {
            return null;
        }

        return {
            id: payload.id,
            email: payload.email,
            name: payload.name,
            role: payload.role,
        };
    } catch {
        // Falha silenciosa no middleware
        return null;
    }
} 