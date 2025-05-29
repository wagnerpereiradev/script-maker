import { NextRequest, NextResponse } from 'next/server';
import { getSettings, updateSettings, UpdateSettingsRequest } from '@/lib/settings';

export async function GET() {
    try {
        const settings = await getSettings();

        // Remover informações sensíveis antes de retornar
        const safeSettings = {
            ...settings,
            openaiApiKeyHash: undefined, // Nunca retornar hashes
            smtpPasswordHash: undefined,
            hasOpenAIKey: !!settings.openaiApiKeyHash,
            hasSMTPPassword: !!settings.smtpPasswordHash,
        };

        return NextResponse.json({ settings: safeSettings });
    } catch (error) {
        console.error('Erro na API de configurações:', error);
        return NextResponse.json(
            { error: 'Falha ao buscar configurações' },
            { status: 500 }
        );
    }
}

export async function PUT(request: NextRequest) {
    try {
        const body: UpdateSettingsRequest = await request.json();

        const updatedSettings = await updateSettings(body);

        // Remover informações sensíveis antes de retornar
        const safeSettings = {
            ...updatedSettings,
            openaiApiKeyHash: undefined,
            smtpPasswordHash: undefined,
            hasOpenAIKey: !!updatedSettings.openaiApiKeyHash,
            hasSMTPPassword: !!updatedSettings.smtpPasswordHash,
        };

        return NextResponse.json({
            settings: safeSettings,
            message: 'Configurações atualizadas com sucesso'
        });
    } catch (error) {
        console.error('Erro na API de configurações:', error);
        return NextResponse.json(
            { error: 'Falha ao atualizar configurações' },
            { status: 500 }
        );
    }
} 