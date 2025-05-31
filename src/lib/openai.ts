import OpenAI from 'openai';
import { ScriptGenerationRequest } from '@/types';
import { getOpenAIConfig } from './settings';

export async function generateEmailScript(request: ScriptGenerationRequest & {
    selectedVariables?: { user: string[], contact: string[] };
    userData?: Record<string, unknown>;
    contactVariables?: Record<string, unknown>;
}) {
    const {
        prospectData,
        emailType,
        tone,
        length,
        callToAction,
        customInstructions,
        selectedVariables,
        userData,
        contactVariables
    } = request;

    // Buscar configurações do banco de dados
    const { apiKey, model } = await getOpenAIConfig();

    if (!apiKey) {
        throw new Error('Chave da API OpenAI não configurada. Acesse as configurações para definir uma chave.');
    }

    // Criar instância do OpenAI com a chave do banco
    const openai = new OpenAI({
        apiKey: apiKey,
    });

    // Build variables section for the prompt
    let variablesSection = '';

    if (selectedVariables && (selectedVariables.user.length > 0 || selectedVariables.contact.length > 0)) {
        variablesSection = '\nVARIÁVEIS SELECIONADAS PARA INCLUIR NO SCRIPT:\n';

        if (selectedVariables.user.length > 0) {
            variablesSection += '\nVariáveis do Usuário:\n';
            selectedVariables.user.forEach(variable => {
                const value = userData?.[variable as keyof typeof userData] || `[${variable}]`;
                variablesSection += `- {{${variable}}}: ${value}\n`;
            });
        }

        if (selectedVariables.contact.length > 0) {
            variablesSection += '\nVariáveis do Contato:\n';
            selectedVariables.contact.forEach(variable => {
                const value = contactVariables?.[variable as keyof typeof contactVariables] || `[${variable}]`;
                variablesSection += `- {{${variable}}}: ${value}\n`;
            });
        }

        variablesSection += '\nIMPORTANTE: Use EXATAMENTE essas variáveis selecionadas no formato {{variavel}} no script gerado.\n';
    }

    const prompt = `
    Você é um especialista em copywriting e vendas por email. Crie um email de prospecção personalizado com base nas seguintes informações:

    DADOS DO PROSPECT:
    - Nome: ${prospectData.contactName}
    - Empresa: ${prospectData.companyName}
    - Nicho: ${prospectData.niche}
    - Cargo: ${prospectData.position || 'Não informado'}
    - Website: ${prospectData.website || 'Não informado'}
    - Pontos de dor: ${prospectData.painPoints || 'Não informado'}
    - Interação anterior: ${prospectData.previousInteraction || 'Primeira interação'}
    - Observações: ${prospectData.notes || 'Nenhuma'}

    CONFIGURAÇÕES DO EMAIL:
    - Tipo: ${emailType}
    - Tom: ${tone}
    - Tamanho: ${length}
    - Call to Action: ${callToAction}

    ${variablesSection}

    ${customInstructions ? `INSTRUÇÕES PERSONALIZADAS:
    ${customInstructions}` : ''}

    INSTRUÇÕES GERAIS:
    1. Crie um assunto atrativo e personalizado
    2. Escreva o corpo do email seguindo as melhores práticas de copywriting
    3. Use o tom especificado (${tone})
    4. Mantenha o tamanho ${length}
    5. Inclua o call to action: ${callToAction}
    6. Personalize baseado no nicho e empresa
    7. Seja genuíno e evite parecer spam
    8. Use formatação em markdown quando apropriado
    ${selectedVariables && (selectedVariables.user.length > 0 || selectedVariables.contact.length > 0)
            ? '9. INCLUA as variáveis selecionadas no formato {{variavel}} no script'
            : ''
        }
    ${customInstructions ? '10. SIGA RIGOROSAMENTE as instruções personalizadas fornecidas acima' : ''}

    Retorne apenas um objeto JSON com esta estrutura:
    {
      "subject": "assunto do email",
      "body": "corpo do email em markdown"
    }

    IMPORTANTE: Retorne APENAS o objeto JSON, sem code blocks, sem explicações, sem texto adicional. Apenas o JSON puro.
    `;

    try {
        const completion = await openai.chat.completions.create({
            model: model,
            messages: [
                {
                    role: "system",
                    content: "Você é um especialista em copywriting e vendas. Sempre responda APENAS com JSON válido, sem markdown, sem code blocks, sem explicações adicionais. Apenas o objeto JSON puro."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: 1,
            stream: true, // Enable streaming
        });

        return completion;
    } catch (error) {
        console.error('Erro ao gerar script:', error);

        // Tratamento de erros específicos da OpenAI
        if (error instanceof Error) {
            if (error.message.includes('401')) {
                throw new Error('Chave da API OpenAI inválida. Verifique sua chave nas configurações.');
            }
            if (error.message.includes('429')) {
                throw new Error('Limite de requisições excedido. Tente novamente em alguns minutos.');
            }
            if (error.message.includes('quota')) {
                throw new Error('Limite de uso da API OpenAI excedido. Verifique sua conta.');
            }
        }

        throw new Error('Falha ao gerar o script de email. Verifique sua conexão e configurações.');
    }
} 