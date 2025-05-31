import { NextRequest, NextResponse } from 'next/server';
import { generateEmailScript } from '@/lib/openai';
import { ScriptGenerationRequest } from '@/types';

export async function POST(request: NextRequest) {
    try {
        const body: ScriptGenerationRequest & {
            contactId?: string;
            selectedVariables?: { user: string[], contact: string[] };
            userData?: Record<string, unknown>;
            contactVariables?: Record<string, unknown>;
        } = await request.json();

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

        // Gerar script usando OpenAI com streaming
        const stream = await generateEmailScript(body);

        // Create a readable stream for the response
        const encoder = new TextEncoder();
        let jsonBuffer = '';
        let isParsingComplete = false;

        const readableStream = new ReadableStream({
            async start(controller) {
                try {
                    for await (const chunk of stream) {
                        const content = chunk.choices[0]?.delta?.content || '';

                        if (content) {
                            jsonBuffer += content;

                            // Try to detect and process sections
                            if (!isParsingComplete) {
                                // Try to parse the accumulated JSON
                                try {
                                    // Look for complete JSON structure
                                    const jsonMatch = jsonBuffer.match(/\{[\s\S]*\}/);
                                    if (jsonMatch) {
                                        const jsonStr = jsonMatch[0];
                                        const parsed = JSON.parse(jsonStr);

                                        if (parsed.subject && parsed.body) {
                                            // We have complete JSON, now stream it section by section
                                            isParsingComplete = true;

                                            // Stream subject
                                            controller.enqueue(encoder.encode('data: [SUBJECT_START]\n\n'));

                                            for (let i = 0; i < parsed.subject.length; i++) {
                                                await new Promise(resolve => setTimeout(resolve, 20)); // Small delay for typing effect
                                                controller.enqueue(encoder.encode(
                                                    `data: ${JSON.stringify({ content: parsed.subject[i] })}\n\n`
                                                ));
                                            }

                                            // Stream body
                                            controller.enqueue(encoder.encode('data: [BODY_START]\n\n'));

                                            const words = parsed.body.split(' ');
                                            for (let i = 0; i < words.length; i++) {
                                                await new Promise(resolve => setTimeout(resolve, 50)); // Delay for typing effect
                                                const word = i === 0 ? words[i] : ' ' + words[i];
                                                controller.enqueue(encoder.encode(
                                                    `data: ${JSON.stringify({ content: word })}\n\n`
                                                ));
                                            }

                                            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                                            controller.close();
                                            return;
                                        }
                                    }
                                } catch {
                                    // Continue accumulating if parsing fails
                                }
                            }
                        }
                    }

                    // Fallback if streaming parsing didn't work
                    if (!isParsingComplete && jsonBuffer) {
                        try {
                            const parsed = JSON.parse(jsonBuffer);
                            controller.enqueue(encoder.encode('data: [SUBJECT_START]\n\n'));
                            controller.enqueue(encoder.encode(
                                `data: ${JSON.stringify({ content: parsed.subject })}\n\n`
                            ));
                            controller.enqueue(encoder.encode('data: [BODY_START]\n\n'));
                            controller.enqueue(encoder.encode(
                                `data: ${JSON.stringify({ content: parsed.body })}\n\n`
                            ));
                            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                        } catch {
                            controller.enqueue(encoder.encode(
                                `data: ${JSON.stringify({ error: 'Erro ao processar resposta' })}\n\n`
                            ));
                        }
                    }

                    controller.close();
                } catch (error) {
                    console.error('Streaming error:', error);
                    controller.enqueue(encoder.encode(
                        `data: ${JSON.stringify({ error: 'Erro durante streaming' })}\n\n`
                    ));
                    controller.close();
                }
            }
        });

        return new NextResponse(readableStream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        });

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
