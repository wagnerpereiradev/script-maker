import prisma from './database';
import { ScriptGenerationRequest, EmailScript, ProspectData } from '@/types';

export async function saveScript(
    request: ScriptGenerationRequest,
    generatedScript: { subject: string; body: string }
): Promise<string> {
    try {
        const script = await prisma.emailScript.create({
            data: {
                subject: generatedScript.subject,
                body: generatedScript.body,
                contactName: request.prospectData.contactName,
                companyName: request.prospectData.companyName,
                niche: request.prospectData.niche,
                position: request.prospectData.position || null,
                email: request.prospectData.email || null,
                website: request.prospectData.website || null,
                painPoints: request.prospectData.painPoints || null,
                previousInteraction: request.prospectData.previousInteraction || null,
                notes: request.prospectData.notes || null,
                emailType: request.emailType,
                tone: request.tone,
                length: request.length,
                callToAction: request.callToAction,
                contactId: (request as unknown as { contactId?: string }).contactId || null,
            },
        });

        return script.id;
    } catch (error: unknown) {
        console.error('Erro ao salvar script:', error);
        throw new Error('Falha ao salvar script no banco de dados');
    }
}

export async function getScripts(
    page: number = 1,
    limit: number = 10,
    search?: string,
    emailType?: string
) {
    try {
        const where = {
            ...(search && {
                OR: [
                    { subject: { contains: search } },
                    { contactName: { contains: search } },
                    { companyName: { contains: search } },
                    { niche: { contains: search } },
                ],
            }),
            ...(emailType && { emailType: emailType as 'cold_outreach' | 'follow_up' | 'introduction' | 'meeting_request' }),
        };

        const [scripts, total] = await Promise.all([
            prisma.emailScript.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.emailScript.count({ where }),
        ]);

        return {
            scripts: scripts.map((script) => ({
                id: script.id,
                subject: script.subject,
                body: script.body,
                prospectData: {
                    contactName: script.contactName,
                    companyName: script.companyName,
                    niche: script.niche,
                    position: script.position,
                    email: script.email,
                    phone: script.phone,
                    website: script.website,
                    painPoints: script.painPoints,
                    previousInteraction: script.previousInteraction,
                    notes: script.notes,
                } as ProspectData,
                emailType: script.emailType,
                tone: script.tone,
                length: script.length,
                callToAction: script.callToAction,
                createdAt: script.createdAt,
                updatedAt: script.updatedAt,
            })),
            total,
            pages: Math.ceil(total / limit),
        };
    } catch (error: unknown) {
        console.error('Erro ao buscar scripts:', error);
        throw new Error('Falha ao buscar scripts do banco de dados');
    }
}

export async function getScriptById(id: string) {
    try {
        const script = await prisma.emailScript.findUnique({
            where: { id },
        });

        if (!script) {
            return null;
        }

        return {
            id: script.id,
            subject: script.subject,
            body: script.body,
            prospectData: {
                contactName: script.contactName,
                companyName: script.companyName,
                niche: script.niche,
                position: script.position,
                email: script.email,
                phone: script.phone,
                website: script.website,
                painPoints: script.painPoints,
                previousInteraction: script.previousInteraction,
                notes: script.notes,
            } as ProspectData,
            emailType: script.emailType,
            tone: script.tone,
            length: script.length,
            callToAction: script.callToAction,
            createdAt: script.createdAt,
            updatedAt: script.updatedAt,
        } as EmailScript;
    } catch (error) {
        console.error('Erro ao buscar script:', error);
        throw new Error('Falha ao buscar script do banco de dados');
    }
}

export async function deleteScript(id: string): Promise<boolean> {
    try {
        await prisma.emailScript.delete({
            where: { id },
        });
        return true;
    } catch (error) {
        console.error('Erro ao deletar script:', error);
        return false;
    }
}

export async function getScriptStats() {
    try {
        const [total, byType] = await Promise.all([
            prisma.emailScript.count(),
            prisma.emailScript.groupBy({
                by: ['emailType'],
                _count: {
                    emailType: true,
                },
            }),
        ]);

        return {
            total,
            byType: byType.reduce((acc: Record<string, number>, curr: { emailType: string; _count: { emailType: number } }) => {
                acc[curr.emailType] = curr._count.emailType;
                return acc;
            }, {} as Record<string, number>),
        };
    } catch (error: unknown) {
        console.error('Erro ao buscar estatísticas:', error);
        return {
            total: 0,
            byType: {},
        };
    }
} 