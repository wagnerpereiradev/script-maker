import { NextResponse } from 'next/server';
import { getOpenAIKey } from '@/lib/settings';

export async function GET() {
    try {
        const apiKey = await getOpenAIKey();

        return NextResponse.json({
            success: true,
            apiKey: apiKey
        });
    } catch (error) {
        console.error('Erro ao buscar chave OpenAI:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Erro ao buscar chave da API OpenAI'
            },
            { status: 500 }
        );
    }
} 