import { PrismaClient } from '@/generated/prisma';
import { randomBytes, createCipheriv, createDecipheriv } from 'node:crypto';

const prisma = new PrismaClient();

export interface Settings {
    id: string;
    // Configurações da OpenAI
    openaiApiKeyHash?: string;
    openaiModel: string;
    // Preferências gerais
    defaultTone: string;
    defaultLength: string;
    autoSaveScripts: boolean;
    // Configurações SMTP
    smtpHost?: string;
    smtpPort?: number;
    smtpUsername?: string;
    smtpPasswordHash?: string;
    smtpSecure: boolean;
    smtpFromEmail?: string;
    smtpFromName?: string;
    // Configurações de email
    emailSignature?: string;
    trackEmailOpens: boolean;
    trackEmailClicks: boolean;
    // Metadados
    createdAt: Date;
    updatedAt: Date;
}

export interface UpdateSettingsRequest {
    // Configurações da OpenAI
    openaiApiKey?: string;
    openaiModel?: string;
    // Preferências gerais
    defaultTone?: string;
    defaultLength?: string;
    autoSaveScripts?: boolean;
    // Configurações SMTP
    smtpHost?: string;
    smtpPort?: number;
    smtpUsername?: string;
    smtpPassword?: string;
    smtpSecure?: boolean;
    smtpFromEmail?: string;
    smtpFromName?: string;
    // Configurações de email
    emailSignature?: string;
    trackEmailOpens?: boolean;
    trackEmailClicks?: boolean;
}

// Chave de criptografia fixa (em produção, use uma chave do ambiente)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '32ac212f4711e5d19252a47017ec3f8f';

// Função para criptografar dados sensíveis
function encryptData(text: string): string {
    const algorithm = 'aes-256-cbc';
    const key = Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').substring(0, 32), 'utf8');
    const iv = randomBytes(16);

    const cipher = createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return iv.toString('hex') + ':' + encrypted;
}

// Função para verificar se dados criptografados são válidos testando descriptografia
function isValidEncryptedData(text: string): boolean {
    try {
        const algorithm = 'aes-256-cbc';
        const key = Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').substring(0, 32), 'utf8');

        const parts = text.split(':');
        if (parts.length !== 2) return false;

        const iv = Buffer.from(parts[0], 'hex');
        if (iv.length !== 16) return false;

        const encryptedText = parts[1];

        // Tentar descriptografar para verificar se é válido
        const decipher = createDecipheriv(algorithm, key, iv);
        decipher.update(encryptedText, 'hex', 'utf8');
        decipher.final('utf8');

        return true;
    } catch {
        return false;
    }
}

// Função para limpar dados corrompidos apenas quando necessário
async function cleanCorruptedDataIfNeeded(fieldName: string, encryptedValue: string): Promise<boolean> {
    try {
        if (!isValidEncryptedData(encryptedValue)) {
            console.log(`Detectados dados corrompidos em ${fieldName}, limpando...`);

            const settings = await prisma.settings.findFirst({
                orderBy: { createdAt: 'desc' }
            });

            if (settings) {
                const updates: Record<string, unknown> = {};
                if (fieldName === 'openaiApiKeyHash') {
                    updates.openaiApiKeyHash = null;
                } else if (fieldName === 'smtpPasswordHash') {
                    updates.smtpPasswordHash = null;
                }

                await prisma.settings.update({
                    where: { id: settings.id },
                    data: updates
                });

                console.log(`Dados corrompidos em ${fieldName} foram limpos.`);
                return true;
            }
        }
        return false;
    } catch (error) {
        console.error('Erro ao limpar dados corrompidos:', error);
        return false;
    }
}

// Função para descriptografar dados sensíveis
function decryptData(text: string): string {
    try {
        // Verificar se os dados são válidos antes de tentar descriptografar
        if (!isValidEncryptedData(text)) {
            throw new Error('Dados criptografados inválidos ou corrompidos');
        }

        const algorithm = 'aes-256-cbc';
        const key = Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').substring(0, 32), 'utf8');

        const parts = text.split(':');
        const iv = Buffer.from(parts[0], 'hex');
        const encryptedText = parts[1];

        const decipher = createDecipheriv(algorithm, key, iv);
        let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    } catch (error) {
        console.error('Erro na descriptografia:', error);
        console.error('Dados recebidos:', text);
        throw new Error(`Falha na descriptografia: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
}

// Buscar configurações (sempre retorna uma configuração, criando se não existir)
export async function getSettings(): Promise<Settings> {
    try {
        let settings = await prisma.settings.findFirst({
            orderBy: { createdAt: 'desc' }
        });

        if (!settings) {
            // Criar configurações padrão se não existirem
            settings = await prisma.settings.create({
                data: {
                    openaiModel: 'gpt-4o-mini',
                    defaultTone: 'professional',
                    defaultLength: 'medium',
                    autoSaveScripts: true,
                    smtpPort: 587,
                    smtpSecure: true,
                    trackEmailOpens: false,
                    trackEmailClicks: false,
                }
            });
        }

        return {
            id: settings.id,
            openaiApiKeyHash: settings.openaiApiKeyHash || undefined,
            openaiModel: settings.openaiModel,
            defaultTone: settings.defaultTone,
            defaultLength: settings.defaultLength,
            autoSaveScripts: settings.autoSaveScripts,
            smtpHost: settings.smtpHost || undefined,
            smtpPort: settings.smtpPort || undefined,
            smtpUsername: settings.smtpUsername || undefined,
            smtpPasswordHash: settings.smtpPasswordHash || undefined,
            smtpSecure: settings.smtpSecure,
            smtpFromEmail: settings.smtpFromEmail || undefined,
            smtpFromName: settings.smtpFromName || undefined,
            emailSignature: settings.emailSignature || undefined,
            trackEmailOpens: settings.trackEmailOpens,
            trackEmailClicks: settings.trackEmailClicks,
            createdAt: settings.createdAt,
            updatedAt: settings.updatedAt,
        };
    } catch (error) {
        console.error('Erro ao buscar configurações:', error);
        throw new Error('Falha ao buscar configurações do banco de dados');
    }
}

// Atualizar configurações
export async function updateSettings(updates: UpdateSettingsRequest): Promise<Settings> {
    try {
        const currentSettings = await getSettings();

        const updateData: Record<string, unknown> = {};

        // Configurações da OpenAI
        if (updates.openaiApiKey !== undefined) {
            updateData.openaiApiKeyHash = updates.openaiApiKey ? encryptData(updates.openaiApiKey) : null;
        }
        if (updates.openaiModel !== undefined) {
            updateData.openaiModel = updates.openaiModel;
        }

        // Preferências gerais
        if (updates.defaultTone !== undefined) {
            updateData.defaultTone = updates.defaultTone;
        }
        if (updates.defaultLength !== undefined) {
            updateData.defaultLength = updates.defaultLength;
        }
        if (updates.autoSaveScripts !== undefined) {
            updateData.autoSaveScripts = updates.autoSaveScripts;
        }

        // Configurações SMTP
        if (updates.smtpHost !== undefined) {
            updateData.smtpHost = updates.smtpHost || null;
        }
        if (updates.smtpPort !== undefined) {
            updateData.smtpPort = updates.smtpPort;
        }
        if (updates.smtpUsername !== undefined) {
            updateData.smtpUsername = updates.smtpUsername || null;
        }
        if (updates.smtpPassword !== undefined) {
            updateData.smtpPasswordHash = updates.smtpPassword ? encryptData(updates.smtpPassword) : null;
        }
        if (updates.smtpSecure !== undefined) {
            updateData.smtpSecure = updates.smtpSecure;
        }
        if (updates.smtpFromEmail !== undefined) {
            updateData.smtpFromEmail = updates.smtpFromEmail || null;
        }
        if (updates.smtpFromName !== undefined) {
            updateData.smtpFromName = updates.smtpFromName || null;
        }

        // Configurações de email
        if (updates.emailSignature !== undefined) {
            updateData.emailSignature = updates.emailSignature || null;
        }
        if (updates.trackEmailOpens !== undefined) {
            updateData.trackEmailOpens = updates.trackEmailOpens;
        }
        if (updates.trackEmailClicks !== undefined) {
            updateData.trackEmailClicks = updates.trackEmailClicks;
        }

        const updatedSettings = await prisma.settings.update({
            where: { id: currentSettings.id },
            data: updateData
        });

        return {
            id: updatedSettings.id,
            openaiApiKeyHash: updatedSettings.openaiApiKeyHash || undefined,
            openaiModel: updatedSettings.openaiModel,
            defaultTone: updatedSettings.defaultTone,
            defaultLength: updatedSettings.defaultLength,
            autoSaveScripts: updatedSettings.autoSaveScripts,
            smtpHost: updatedSettings.smtpHost || undefined,
            smtpPort: updatedSettings.smtpPort || undefined,
            smtpUsername: updatedSettings.smtpUsername || undefined,
            smtpPasswordHash: updatedSettings.smtpPasswordHash || undefined,
            smtpSecure: updatedSettings.smtpSecure,
            smtpFromEmail: updatedSettings.smtpFromEmail || undefined,
            smtpFromName: updatedSettings.smtpFromName || undefined,
            emailSignature: updatedSettings.emailSignature || undefined,
            trackEmailOpens: updatedSettings.trackEmailOpens,
            trackEmailClicks: updatedSettings.trackEmailClicks,
            createdAt: updatedSettings.createdAt,
            updatedAt: updatedSettings.updatedAt,
        };
    } catch (error) {
        console.error('Erro ao atualizar configurações:', error);
        throw new Error('Falha ao atualizar configurações no banco de dados');
    }
}

// Verificar se a API key está configurada
export async function hasOpenAIKey(): Promise<boolean> {
    try {
        const settings = await getSettings();
        return !!settings.openaiApiKeyHash;
    } catch (error) {
        console.error('Erro ao verificar API key:', error);
        return false;
    }
}

// Obter chave da OpenAI descriptografada
export async function getOpenAIKey(): Promise<string | null> {
    try {
        const settings = await getSettings();
        if (!settings.openaiApiKeyHash) {
            return null;
        }

        try {
            return decryptData(settings.openaiApiKeyHash);
        } catch {
            // Se houver erro de descriptografia, limpar dados corrompidos
            console.error('Erro ao descriptografar chave OpenAI, limpando dados corrompidos...');
            await cleanCorruptedDataIfNeeded('openaiApiKeyHash', settings.openaiApiKeyHash);
            return null;
        }
    } catch (error) {
        console.error('Erro ao buscar chave OpenAI:', error);
        return null;
    }
}

// Obter configurações da OpenAI (modelo + chave)
export async function getOpenAIConfig(): Promise<{
    apiKey: string | null;
    model: string;
}> {
    try {
        const settings = await getSettings();
        let apiKey: string | null = null;

        if (settings.openaiApiKeyHash) {
            try {
                apiKey = decryptData(settings.openaiApiKeyHash);
            } catch {
                // Se houver erro de descriptografia, limpar dados corrompidos
                console.error('Erro ao descriptografar chave OpenAI, limpando dados corrompidos...');
                await cleanCorruptedDataIfNeeded('openaiApiKeyHash', settings.openaiApiKeyHash);
                apiKey = null;
            }
        }

        return {
            apiKey,
            model: settings.openaiModel,
        };
    } catch (error) {
        console.error('Erro ao buscar configurações OpenAI:', error);
        return {
            apiKey: null,
            model: 'gpt-4.1',
        };
    }
}

// Obter configurações SMTP (sem senhas)
export async function getSMTPConfig(): Promise<{
    host?: string;
    port?: number;
    username?: string;
    secure: boolean;
    fromEmail?: string;
    fromName?: string;
}> {
    try {
        const settings = await getSettings();
        return {
            host: settings.smtpHost,
            port: settings.smtpPort,
            username: settings.smtpUsername,
            secure: settings.smtpSecure,
            fromEmail: settings.smtpFromEmail,
            fromName: settings.smtpFromName,
        };
    } catch (error) {
        console.error('Erro ao buscar configurações SMTP:', error);
        throw new Error('Falha ao buscar configurações SMTP');
    }
}

// Obter senha SMTP descriptografada
export async function getSMTPPassword(): Promise<string | null> {
    try {
        const settings = await getSettings();
        if (!settings.smtpPasswordHash) {
            return null;
        }

        try {
            return decryptData(settings.smtpPasswordHash);
        } catch {
            // Se houver erro de descriptografia, limpar dados corrompidos
            console.error('Erro ao descriptografar senha SMTP, limpando dados corrompidos...');
            await cleanCorruptedDataIfNeeded('smtpPasswordHash', settings.smtpPasswordHash);
            return null;
        }
    } catch (error) {
        console.error('Erro ao buscar senha SMTP:', error);
        return null;
    }
} 