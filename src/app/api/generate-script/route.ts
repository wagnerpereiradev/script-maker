import { NextRequest, NextResponse } from 'next/server';
import { generateEmailScript } from '@/lib/openai';
import { ScriptGenerationRequest } from '@/types';

export async function POST(request: NextRequest) {
    try {
        const body: ScriptGenerationRequest & { contactId?: string } = await request.json();

        // Validar campos obrigatórios
        if (!body.prospectData.contactName || !body.prospectData.companyName || !body.prospectData.niche) {
            return NextResponse.json(
                { error: 'Campos obrigatórios: nome do contato, empresa e nicho' },
                { status: 400 }
            );
        }

        if (!body.callToAction) {
            return NextResponse.json(
                { error: 'Call to Action é obrigatório' },
                { status: 400 }
            );
        }

        // Gerar script usando OpenAI
        const script = await generateEmailScript(body);

        // Retornar apenas o script gerado
        return NextResponse.json(script);
    } catch (error) {
        console.error('Erro na API:', error);

        // Tratar erros específicos da OpenAI
        if (error instanceof Error) {
            if (error.message.includes('API key')) {
                return NextResponse.json(
                    { error: 'Chave da API OpenAI não configurada. Configure nas configurações.' },
                    { status: 401 }
                );
            }
            if (error.message.includes('quota')) {
                return NextResponse.json(
                    { error: 'Cota da API OpenAI excedida. Verifique seu plano.' },
                    { status: 429 }
                );
            }
            if (error.message.includes('rate limit')) {
                return NextResponse.json(
                    { error: 'Muitas requisições. Tente novamente em alguns segundos.' },
                    { status: 429 }
                );
            }
        }

        return NextResponse.json(
            { error: 'Erro interno do servidor ao gerar script' },
            { status: 500 }
        );
    }
} 