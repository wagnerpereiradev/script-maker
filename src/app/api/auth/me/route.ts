import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        // Buscar token no cookie
        const token = request.cookies.get('auth-token')?.value;

        if (!token) {
            return NextResponse.json(
                { error: 'Token de autenticação não encontrado' },
                { status: 401 }
            );
        }

        // Verificar token
        const user = verifyToken(token);

        if (!user) {
            return NextResponse.json(
                { error: 'Token inválido ou expirado' },
                { status: 401 }
            );
        }

        return NextResponse.json({
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
            },
        });

    } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
} 