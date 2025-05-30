import { NextRequest, NextResponse } from 'next/server';
import { getScripts, getScriptStats, deleteScript } from '@/lib/scripts';
import { PrismaClient } from '@/generated/prisma';
import { requireAuth, unauthorizedResponse } from '@/lib/api-auth';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
    try {
        // Verificar autenticação
        const { user, error } = requireAuth(request);
        if (error || !user) {
            return unauthorizedResponse(error);
        }

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const search = searchParams.get('search') || undefined;
        const emailType = searchParams.get('emailType') || undefined;
        const stats = searchParams.get('stats') === 'true';

        if (stats) {
            const statistics = await getScriptStats();
            return NextResponse.json(statistics);
        }

        const result = await getScripts(page, limit, search, emailType);
        return NextResponse.json(result);
    } catch (error) {
        console.error('Erro na API de scripts:', error);
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { ids } = await request.json();

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json(
                { error: 'IDs dos scripts são obrigatórios' },
                { status: 400 }
            );
        }

        // Deletar múltiplos scripts
        let deletedCount = 0;
        for (const id of ids) {
            const success = await deleteScript(id);
            if (success) deletedCount++;
        }

        return NextResponse.json({
            success: true,
            deletedCount,
            message: `${deletedCount} script(s) deletado(s) com sucesso`
        });
    } catch (error) {
        console.error('Erro ao deletar scripts:', error);
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
}

// POST - Salvar script
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const {
            subject,
            body: scriptBody,
            prospectData,
            emailType,
            tone,
            length,
            callToAction,
            contactId,
        } = body;

        // Validações básicas
        if (!subject || !scriptBody) {
            return NextResponse.json(
                { error: 'Campos obrigatórios: subject e body' },
                { status: 400 }
            );
        }

        // Para scripts não genéricos, validar dados do prospect
        if (prospectData && prospectData.contactName !== '[Nome do Contato]' &&
            (!prospectData.contactName || !prospectData.companyName || !prospectData.niche)) {
            return NextResponse.json(
                { error: 'Para scripts personalizados são obrigatórios: contactName, companyName, niche' },
                { status: 400 }
            );
        }

        // Usar dados do prospectData ou valores padrão para scripts genéricos
        const {
            contactName = '[Nome do Contato]',
            companyName = '[Nome da Empresa]',
            niche = '[Nicho/Setor]',
            position = '[Cargo]',
            email = '[Email]',
            website = '[Website]',
            painPoints = '[Pontos de Dor]',
            previousInteraction = '[Interação Anterior]',
            notes = '[Observações]'
        } = prospectData || {};

        const script = await prisma.emailScript.create({
            data: {
                subject,
                body: scriptBody,
                contactName,
                companyName,
                niche,
                position: position || null,
                email: email || null,
                website: website || null,
                painPoints: painPoints || null,
                previousInteraction: previousInteraction || null,
                notes: notes || null,
                emailType,
                tone,
                length,
                callToAction,
                contactId: contactId || null,
            },
        });

        return NextResponse.json(script, { status: 201 });
    } catch (error) {
        console.error('Erro ao salvar script:', error);
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
} 