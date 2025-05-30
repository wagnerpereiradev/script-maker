import { NextRequest } from 'next/server';
import { verifyToken, AuthUser } from '@/lib/auth';

export interface AuthenticatedRequest extends NextRequest {
    user?: AuthUser;
}

/**
 * Verificar autenticação via cookie ou header Authorization
 */
export function getAuthenticatedUser(request: NextRequest): AuthUser | null {
    try {
        // Tentar pegar token do cookie primeiro
        let token = request.cookies.get('auth-token')?.value;

        // Se não houver cookie, tentar header Authorization
        if (!token) {
            const authHeader = request.headers.get('authorization');
            if (authHeader && authHeader.startsWith('Bearer ')) {
                token = authHeader.substring(7);
            }
        }

        if (!token) {
            return null;
        }

        // Verificar token
        return verifyToken(token);
    } catch (error) {
        console.error('Erro na verificação de autenticação API:', error);
        return null;
    }
}

/**
 * Middleware de autenticação para APIs
 * Retorna o usuário autenticado ou null se não autenticado
 */
export function requireAuth(request: NextRequest): { user: AuthUser | null; error?: string } {
    const user = getAuthenticatedUser(request);

    if (!user) {
        return { user: null, error: 'Token de autenticação inválido ou ausente' };
    }

    return { user };
}

/**
 * Verificar se usuário tem permissão de admin
 */
export function requireAdmin(request: NextRequest): { user: AuthUser | null; error?: string } {
    const { user, error } = requireAuth(request);

    if (error || !user) {
        return { user: null, error: error || 'Autenticação necessária' };
    }

    if (user.role !== 'ADMIN') {
        return { user: null, error: 'Acesso restrito a administradores' };
    }

    return { user };
}

/**
 * Resposta de erro de autenticação padronizada
 */
export function unauthorizedResponse(message: string = 'Não autorizado') {
    return Response.json(
        { error: message, code: 'UNAUTHORIZED' },
        { status: 401 }
    );
}

/**
 * Resposta de erro de permissão padronizada
 */
export function forbiddenResponse(message: string = 'Acesso negado') {
    return Response.json(
        { error: message, code: 'FORBIDDEN' },
        { status: 403 }
    );
} 