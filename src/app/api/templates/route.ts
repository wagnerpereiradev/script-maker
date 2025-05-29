import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const search = searchParams.get('search') || '';
        const category = searchParams.get('category') || '';
        const isActive = searchParams.get('isActive');
        const includeContent = searchParams.get('includeContent') === 'true';

        const skip = (page - 1) * limit;

        // Construir filtros
        const where: Record<string, unknown> = {};

        if (search) {
            where.OR = [
                { name: { contains: search } },
                { description: { contains: search } },
                { subject: { contains: search } }
            ];
        }

        if (category) {
            where.category = category;
        }

        if (isActive !== null && isActive !== undefined && isActive !== '') {
            where.isActive = isActive === 'true';
        }

        // Definir campos a serem selecionados baseado no includeContent
        const selectFields = {
            id: true,
            name: true,
            description: true,
            subject: true,
            category: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
            ...(includeContent && { htmlContent: true }),
        };

        // Buscar templates
        const [templates, total] = await Promise.all([
            prisma.emailTemplate.findMany({
                where,
                skip,
                take: limit,
                orderBy: { updatedAt: 'desc' },
                select: selectFields
            }),
            prisma.emailTemplate.count({ where })
        ]);

        const pages = Math.ceil(total / limit);

        return NextResponse.json({
            templates,
            total,
            pages,
            currentPage: page
        });
    } catch (error) {
        console.error('Erro ao buscar templates:', error);
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, description, subject, htmlContent, category, isActive } = body;

        // Validações
        if (!name || !subject || !htmlContent) {
            return NextResponse.json(
                { error: 'Nome, assunto e conteúdo HTML são obrigatórios' },
                { status: 400 }
            );
        }

        const template = await prisma.emailTemplate.create({
            data: {
                name,
                description: description || null,
                subject,
                htmlContent,
                category: category || null,
                isActive: isActive !== undefined ? isActive : true
            }
        });

        return NextResponse.json(template, { status: 201 });
    } catch (error: unknown) {
        console.error('Erro ao criar template:', error);
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const body = await request.json();
        const { ids } = body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json(
                { error: 'IDs são obrigatórios' },
                { status: 400 }
            );
        }

        const result = await prisma.emailTemplate.deleteMany({
            where: {
                id: {
                    in: ids
                }
            }
        });

        return NextResponse.json({
            message: `${result.count} template(s) deletado(s) com sucesso`
        });
    } catch (error) {
        console.error('Erro ao deletar templates:', error);
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
} 