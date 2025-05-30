import { NextRequest, NextResponse } from 'next/server';
import { verifyTokenSimple } from '@/lib/auth-middleware';

// Rotas que não precisam de autenticação
const publicRoutes = ['/login'];

// APIs que não precisam de autenticação
const publicApis = [
    '/api/auth/login',
    '/api/auth/logout',
    '/api/track/', // APIs de tracking de email
];

// Rotas que precisam de autenticação
const protectedRoutes = [
    '/',
    '/dashboard',
    '/create',
    '/scripts',
    '/contacts',
    '/templates',
    '/send-email',
    '/sent-emails',
    '/settings',
];

// APIs que precisam de autenticação
const protectedApis = [
    '/api/dashboard',
    '/api/contacts',
    '/api/scripts',
    '/api/templates',
    '/api/send-email',
    '/api/sent-emails',
    '/api/settings',
    '/api/auth/me',
];

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Verificar se é uma rota pública
    if (publicRoutes.includes(pathname)) {
        return NextResponse.next();
    }

    // Verificar se é uma API pública
    if (publicApis.some(api => pathname.startsWith(api))) {
        return NextResponse.next();
    }

    // Verificar se é uma API protegida
    const isProtectedApi = protectedApis.some(api => pathname.startsWith(api));

    // Verificar se é uma rota protegida
    const isProtectedRoute = protectedRoutes.some(route =>
        pathname === route || pathname.startsWith(`${route}/`)
    );

    if (isProtectedRoute || isProtectedApi) {
        // Buscar token do cookie
        const token = request.cookies.get('auth-token')?.value;

        if (!token) {
            if (isProtectedApi) {
                // Para APIs, retornar JSON de erro
                return NextResponse.json(
                    { error: 'Token de autenticação necessário', code: 'UNAUTHORIZED' },
                    { status: 401 }
                );
            } else {
                // Para rotas, redirecionar para login
                const loginUrl = new URL('/login', request.url);
                return NextResponse.redirect(loginUrl);
            }
        }

        // Verificar se o token é válido
        const user = verifyTokenSimple(token);
        if (!user) {
            if (isProtectedApi) {
                // Para APIs, retornar JSON de erro
                return NextResponse.json(
                    { error: 'Token inválido ou expirado', code: 'UNAUTHORIZED' },
                    { status: 401 }
                );
            } else {
                // Para rotas, redirecionar para login e limpar cookie
                const loginUrl = new URL('/login', request.url);
                const response = NextResponse.redirect(loginUrl);

                response.cookies.set('auth-token', '', {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'lax',
                    maxAge: 0,
                    path: '/',
                });

                return response;
            }
        }

        // Adicionar informações do usuário ao header para uso nas APIs
        const response = NextResponse.next();
        response.headers.set('x-user-id', user.id);
        response.headers.set('x-user-email', user.email);
        response.headers.set('x-user-role', user.role);

        return response;
    }

    // Para outras rotas, permitir acesso
    return NextResponse.next();
}

export const config = {
    // Aplicar middleware a todas as rotas exceto arquivos estáticos
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.svg$).*)',
    ],
}; 