import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser, generateToken, isValidEmail } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
        const { email, password } = await request.json();

        // Validar campos obrigatórios
        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email e senha são obrigatórios' },
                { status: 400 }
            );
        }

        // Validar formato do email
        if (!isValidEmail(email)) {
            return NextResponse.json(
                { error: 'Formato de email inválido' },
                { status: 400 }
            );
        }

        // Autenticar usuário
        const user = await authenticateUser({ email, password });

        if (!user) {
            return NextResponse.json(
                { error: 'Email ou senha incorretos' },
                { status: 401 }
            );
        }

        // Gerar token JWT
        const token = generateToken(user);

        // Retornar dados do usuário e token
        const response = NextResponse.json({
            message: 'Login realizado com sucesso',
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
            },
            token,
        });

        // Configurar cookie httpOnly com o token
        response.cookies.set('auth-token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7, // 7 dias
            path: '/',
        });

        return response;

    } catch (error) {
        console.error('Erro no login:', error);

        if (error instanceof Error) {
            return NextResponse.json(
                { error: error.message },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
} 