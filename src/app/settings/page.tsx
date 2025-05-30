'use client';

import { useState, useEffect } from 'react';
import MainLayout from '@/components/MainLayout';
import { Save, Key, User, Palette, Mail, Eye, EyeOff } from 'lucide-react';

interface Settings {
    id: string;
    openaiModel: string;
    defaultTone: string;
    defaultLength: string;
    autoSaveScripts: boolean;
    smtpHost?: string;
    smtpPort?: number;
    smtpUsername?: string;
    smtpSecure: boolean;
    smtpFromEmail?: string;
    smtpFromName?: string;
    emailSignature?: string;
    trackEmailOpens: boolean;
    trackEmailClicks: boolean;
    hasOpenAIKey?: boolean;
    hasSMTPPassword?: boolean;
    yourName?: string;
    yourCompany?: string;
    yourPhone?: string;
    yourIndustry?: string;
    yourPosition?: string;
    yourWebsite?: string;
    yourLocation?: string;
}

export default function Settings() {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [settings, setSettings] = useState<Settings | null>(null);
    const [apiKey, setApiKey] = useState('');
    const [smtpPassword, setSmtpPassword] = useState('');
    const [showApiKey, setShowApiKey] = useState(false);
    const [showSmtpPassword, setShowSmtpPassword] = useState(false);
    const [showRealApiKey, setShowRealApiKey] = useState(false);
    const [realApiKey, setRealApiKey] = useState<string | null>(null);
    const [loadingRealKey, setLoadingRealKey] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const response = await fetch('/api/settings');
            const data = await response.json();

            if (response.ok) {
                setSettings(data.settings);
            } else {
                setMessage({ type: 'error', text: data.error || 'Erro ao carregar configurações' });
            }
        } catch {
            setMessage({ type: 'error', text: 'Erro ao conectar com o servidor' });
        } finally {
            setIsLoading(false);
        }
    };

    const loadRealApiKey = async () => {
        if (!settings?.hasOpenAIKey) {
            setMessage({ type: 'error', text: 'Nenhuma chave configurada no banco' });
            return;
        }

        setLoadingRealKey(true);
        try {
            const response = await fetch('/api/settings/openai-key');
            const data = await response.json();

            if (response.ok && data.success) {
                setRealApiKey(data.apiKey);
                setShowRealApiKey(true);
            } else {
                setMessage({ type: 'error', text: data.error || 'Erro ao buscar chave do banco' });
            }
        } catch {
            setMessage({ type: 'error', text: 'Erro ao conectar com o servidor' });
        } finally {
            setLoadingRealKey(false);
        }
    };

    const handleSaveSettings = async () => {
        if (!settings) return;

        setIsSaving(true);
        setMessage(null);

        try {
            const updateData: Record<string, unknown> = {
                openaiModel: settings.openaiModel,
                defaultTone: settings.defaultTone,
                defaultLength: settings.defaultLength,
                autoSaveScripts: settings.autoSaveScripts,
                smtpHost: settings.smtpHost,
                smtpPort: settings.smtpPort,
                smtpUsername: settings.smtpUsername,
                smtpSecure: settings.smtpSecure,
                smtpFromEmail: settings.smtpFromEmail,
                smtpFromName: settings.smtpFromName,
                emailSignature: settings.emailSignature,
                trackEmailOpens: settings.trackEmailOpens,
                trackEmailClicks: settings.trackEmailClicks,
                yourName: settings.yourName,
                yourCompany: settings.yourCompany,
                yourPhone: settings.yourPhone,
                yourIndustry: settings.yourIndustry,
                yourPosition: settings.yourPosition,
                yourWebsite: settings.yourWebsite,
                yourLocation: settings.yourLocation,
            };

            // Só inclui API key se foi alterada
            if (apiKey.trim()) {
                updateData.openaiApiKey = apiKey.trim();
            }

            // Só inclui senha SMTP se foi alterada
            if (smtpPassword.trim()) {
                updateData.smtpPassword = smtpPassword.trim();
            }

            const response = await fetch('/api/settings', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updateData),
            });

            const data = await response.json();

            if (response.ok) {
                setSettings(data.settings);
                setApiKey(''); // Limpar campo após salvar
                setSmtpPassword(''); // Limpar campo após salvar
                setMessage({ type: 'success', text: data.message || 'Configurações salvas com sucesso!' });
            } else {
                setMessage({ type: 'error', text: data.error || 'Erro ao salvar configurações' });
            }
        } catch {
            setMessage({ type: 'error', text: 'Erro ao salvar configurações' });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <MainLayout>
                <div className="p-8">
                    <div className="max-w-4xl mx-auto">
                        <div className="flex items-center justify-center h-64">
                            <div className="text-white">Carregando configurações...</div>
                        </div>
                    </div>
                </div>
            </MainLayout>
        );
    }

    if (!settings) {
        return (
            <MainLayout>
                <div className="p-8">
                    <div className="max-w-4xl mx-auto">
                        <div className="flex items-center justify-center h-64">
                            <div className="text-red-400">Erro ao carregar configurações</div>
                        </div>
                    </div>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="p-8">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-white mb-2">
                            Configurações
                        </h1>
                        <p className="text-neutral-400">
                            Gerencie suas preferências e configurações da conta
                        </p>
                    </div>

                    {/* Message */}
                    {message && (
                        <div className={`mb-6 p-4 rounded-lg ${message.type === 'success'
                            ? 'bg-green-900/50 border border-green-700 text-green-300'
                            : 'bg-red-900/50 border border-red-700 text-red-300'
                            }`}>
                            {message.text}
                        </div>
                    )}

                    <div className="space-y-6">
                        {/* API Configuration */}
                        <div className="bg-neutral-gradient rounded-lg p-6 border border-neutral-800">
                            <div className="flex items-center mb-4">
                                <Key className="h-5 w-5 text-white mr-3" />
                                <h3 className="text-lg font-semibold text-white">
                                    Configuração da API OpenAI
                                </h3>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                                        Modelo OpenAI
                                    </label>
                                    <select
                                        className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:border-white"
                                        value={settings.openaiModel}
                                        onChange={(e) => setSettings({ ...settings, openaiModel: e.target.value })}
                                    >
                                        <option value="gpt-4o-mini">GPT-4o Mini</option>
                                        <option value="gpt-4o">GPT-4o</option>
                                        <option value="gpt-4-turbo">GPT-4 Turbo</option>
                                        <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                                        Chave da API OpenAI {settings.hasOpenAIKey && <span className="text-green-400">(Configurada)</span>}
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showApiKey ? 'text' : 'password'}
                                            placeholder={settings.hasOpenAIKey ? "••••••••••••••••" : "sk-..."}
                                            className="w-full px-3 py-2 pr-20 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-white"
                                            value={apiKey}
                                            onChange={(e) => setApiKey(e.target.value)}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowApiKey(!showApiKey)}
                                            className="absolute right-2 top-2 px-3 py-1 text-xs text-neutral-400 hover:text-white"
                                        >
                                            {showApiKey ? 'Ocultar' : 'Mostrar'}
                                        </button>
                                    </div>
                                    <p className="text-xs text-neutral-500 mt-1">
                                        {settings.hasOpenAIKey
                                            ? 'Deixe em branco para manter a chave atual'
                                            : 'Sua chave da API será armazenada com segurança no banco de dados'}
                                    </p>
                                </div>

                                {/* Seção para mostrar chave atual do banco */}
                                {settings.hasOpenAIKey && (
                                    <div className="pt-4 border-t border-neutral-700">
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="block text-sm font-medium text-neutral-300">
                                                Chave atual no banco de dados
                                            </label>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (showRealApiKey) {
                                                        setShowRealApiKey(false);
                                                        setRealApiKey(null);
                                                    } else {
                                                        loadRealApiKey();
                                                    }
                                                }}
                                                disabled={loadingRealKey}
                                                className="flex items-center gap-2 px-3 py-1 text-xs bg-neutral-700 hover:bg-neutral-600 text-white rounded transition-colors disabled:opacity-50"
                                            >
                                                {loadingRealKey ? (
                                                    <>
                                                        <div className="animate-spin w-3 h-3 border border-white border-t-transparent rounded-full"></div>
                                                        Carregando...
                                                    </>
                                                ) : showRealApiKey ? (
                                                    <>
                                                        <EyeOff className="w-3 h-3" />
                                                        Ocultar Chave
                                                    </>
                                                ) : (
                                                    <>
                                                        <Eye className="w-3 h-3" />
                                                        Mostrar Chave do Banco
                                                    </>
                                                )}
                                            </button>
                                        </div>

                                        {showRealApiKey && realApiKey && (
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    readOnly
                                                    value={realApiKey}
                                                    className="w-full px-3 py-2 bg-neutral-900 border border-neutral-600 rounded-lg text-green-400 font-mono text-sm cursor-text"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(realApiKey);
                                                        setMessage({ type: 'success', text: 'Chave copiada para a área de transferência!' });
                                                    }}
                                                    className="absolute right-2 top-2 px-2 py-1 text-xs bg-neutral-700 hover:bg-neutral-600 text-white rounded"
                                                >
                                                    Copiar
                                                </button>
                                            </div>
                                        )}

                                        <p className="text-xs text-neutral-500 mt-1">
                                            Esta é a chave que está atualmente armazenada e criptografada no banco de dados
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Default Preferences */}
                        <div className="bg-neutral-gradient rounded-lg p-6 border border-neutral-800">
                            <div className="flex items-center mb-4">
                                <Palette className="h-5 w-5 text-white mr-3" />
                                <h3 className="text-lg font-semibold text-white">
                                    Preferências Padrão
                                </h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                                        Tom Padrão
                                    </label>
                                    <select
                                        className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:border-white"
                                        value={settings.defaultTone}
                                        onChange={(e) => setSettings({ ...settings, defaultTone: e.target.value })}
                                    >
                                        <option value="professional">Profissional</option>
                                        <option value="casual">Casual</option>
                                        <option value="friendly">Amigável</option>
                                        <option value="formal">Formal</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                                        Tamanho Padrão
                                    </label>
                                    <select
                                        className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:border-white"
                                        value={settings.defaultLength}
                                        onChange={(e) => setSettings({ ...settings, defaultLength: e.target.value })}
                                    >
                                        <option value="short">Curto</option>
                                        <option value="medium">Médio</option>
                                        <option value="long">Longo</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* SMTP Configuration */}
                        <div className="bg-neutral-gradient rounded-lg p-6 border border-neutral-800">
                            <div className="flex items-center mb-4">
                                <Mail className="h-5 w-5 text-white mr-3" />
                                <h3 className="text-lg font-semibold text-white">
                                    Configurações de Email (SMTP)
                                </h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                                        Servidor SMTP
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="smtp.gmail.com"
                                        className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-white"
                                        value={settings.smtpHost || ''}
                                        onChange={(e) => setSettings({ ...settings, smtpHost: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                                        Porta
                                    </label>
                                    <input
                                        type="number"
                                        placeholder="587"
                                        className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-white"
                                        value={settings.smtpPort || ''}
                                        onChange={(e) => setSettings({ ...settings, smtpPort: parseInt(e.target.value) || undefined })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                                        Usuário
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="seu@email.com"
                                        className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-white"
                                        value={settings.smtpUsername || ''}
                                        onChange={(e) => setSettings({ ...settings, smtpUsername: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                                        Senha {settings.hasSMTPPassword && <span className="text-green-400">(Configurada)</span>}
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showSmtpPassword ? 'text' : 'password'}
                                            placeholder={settings.hasSMTPPassword ? "••••••••" : "Senha do email"}
                                            className="w-full px-3 py-2 pr-20 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-white"
                                            value={smtpPassword}
                                            onChange={(e) => setSmtpPassword(e.target.value)}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowSmtpPassword(!showSmtpPassword)}
                                            className="absolute right-2 top-2 px-3 py-1 text-xs text-neutral-400 hover:text-white"
                                        >
                                            {showSmtpPassword ? 'Ocultar' : 'Mostrar'}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                                        Email do Remetente
                                    </label>
                                    <input
                                        type="email"
                                        placeholder="seu@email.com"
                                        className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-white"
                                        value={settings.smtpFromEmail || ''}
                                        onChange={(e) => setSettings({ ...settings, smtpFromEmail: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                                        Nome do Remetente
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Seu Nome"
                                        className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-white"
                                        value={settings.smtpFromName || ''}
                                        onChange={(e) => setSettings({ ...settings, smtpFromName: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="mt-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="font-medium text-white">Conexão Segura (TLS)</h4>
                                        <p className="text-sm text-neutral-400">
                                            Usar criptografia TLS para envio de emails
                                        </p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={settings.smtpSecure}
                                            onChange={(e) => setSettings({ ...settings, smtpSecure: e.target.checked })}
                                        />
                                        <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                    </label>
                                </div>
                            </div>

                            <div className="mt-4">
                                <label className="block text-sm font-medium text-neutral-300 mb-2">
                                    Assinatura do Email
                                </label>
                                <textarea
                                    placeholder="Sua assinatura personalizada..."
                                    rows={3}
                                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-white resize-none"
                                    value={settings.emailSignature || ''}
                                    onChange={(e) => setSettings({ ...settings, emailSignature: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Personal Data Section */}
                        <div className="bg-neutral-gradient rounded-lg p-6 border border-neutral-800">
                            <div className="flex items-center mb-4">
                                <User className="h-5 w-5 text-white mr-3" />
                                <h3 className="text-lg font-semibold text-white">
                                    Dados Pessoais do Remetente
                                </h3>
                            </div>
                            <p className="text-sm text-neutral-400 mb-6">
                                Configure seus dados pessoais para uso em templates. Use as tags como {'{'}{'{'} yourName {'}'}{'}'},  {'{'}{'{'} yourCompany {'}'}{'}'},  etc. nos seus templates e scripts.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                                        Seu Nome <span className="text-xs text-neutral-500">({'{'}{'{'} yourName {'}'}{'}'})</span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Ex: João Silva"
                                        className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-white"
                                        value={settings.yourName || ''}
                                        onChange={(e) => setSettings({ ...settings, yourName: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                                        Sua Empresa <span className="text-xs text-neutral-500">({'{'}{'{'} yourCompany {'}'}{'}'})</span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Ex: Minha Empresa Ltda"
                                        className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-white"
                                        value={settings.yourCompany || ''}
                                        onChange={(e) => setSettings({ ...settings, yourCompany: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                                        Seu Telefone <span className="text-xs text-neutral-500">({'{'}{'{'} yourPhone {'}'}{'}'})</span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Ex: (11) 99999-9999"
                                        className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-white"
                                        value={settings.yourPhone || ''}
                                        onChange={(e) => setSettings({ ...settings, yourPhone: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                                        Seu Cargo <span className="text-xs text-neutral-500">({'{'}{'{'} yourPosition {'}'}{'}'})</span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Ex: Diretor Comercial"
                                        className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-white"
                                        value={settings.yourPosition || ''}
                                        onChange={(e) => setSettings({ ...settings, yourPosition: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                                        Seu Setor/Indústria <span className="text-xs text-neutral-500">({'{'}{'{'} yourIndustry {'}'}{'}'})</span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Ex: Tecnologia, Consultoria, etc."
                                        className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-white"
                                        value={settings.yourIndustry || ''}
                                        onChange={(e) => setSettings({ ...settings, yourIndustry: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                                        Seu Website <span className="text-xs text-neutral-500">({'{'}{'{'} yourWebsite {'}'}{'}'})</span>
                                    </label>
                                    <input
                                        type="url"
                                        placeholder="Ex: https://minhaempresa.com"
                                        className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-white"
                                        value={settings.yourWebsite || ''}
                                        onChange={(e) => setSettings({ ...settings, yourWebsite: e.target.value })}
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                                        Sua Localização <span className="text-xs text-neutral-500">({'{'}{'{'} yourLocation {'}'}{'}'})</span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Ex: São Paulo, SP - Brasil"
                                        className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-white"
                                        value={settings.yourLocation || ''}
                                        onChange={(e) => setSettings({ ...settings, yourLocation: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Tags Reference */}
                            <div className="mt-6 p-4 bg-neutral-800/50 rounded-lg border border-neutral-700">
                                <h4 className="text-sm font-medium text-neutral-300 mb-3">Tags Disponíveis:</h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                                    <code className="bg-neutral-700 px-2 py-1 rounded text-blue-300">{'{{yourName}}'}</code>
                                    <code className="bg-neutral-700 px-2 py-1 rounded text-blue-300">{'{{yourCompany}}'}</code>
                                    <code className="bg-neutral-700 px-2 py-1 rounded text-blue-300">{'{{yourPhone}}'}</code>
                                    <code className="bg-neutral-700 px-2 py-1 rounded text-blue-300">{'{{yourPosition}}'}</code>
                                    <code className="bg-neutral-700 px-2 py-1 rounded text-blue-300">{'{{yourIndustry}}'}</code>
                                    <code className="bg-neutral-700 px-2 py-1 rounded text-blue-300">{'{{yourWebsite}}'}</code>
                                    <code className="bg-neutral-700 px-2 py-1 rounded text-blue-300">{'{{yourLocation}}'}</code>
                                </div>
                                <p className="text-xs text-neutral-500 mt-3">
                                    Use essas tags nos seus templates e scripts. Elas serão automaticamente substituídas pelos valores configurados acima.
                                </p>
                            </div>
                        </div>

                        {/* General Settings */}
                        <div className="bg-neutral-gradient rounded-lg p-6 border border-neutral-800">
                            <div className="flex items-center mb-4">
                                <User className="h-5 w-5 text-white mr-3" />
                                <h3 className="text-lg font-semibold text-white">
                                    Configurações Gerais
                                </h3>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="font-medium text-white">Auto Salvar Scripts</h4>
                                        <p className="text-sm text-neutral-400">
                                            Salvar automaticamente os scripts criados
                                        </p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={settings.autoSaveScripts}
                                            onChange={(e) => setSettings({ ...settings, autoSaveScripts: e.target.checked })}
                                        />
                                        <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                    </label>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="font-medium text-white">Rastrear Aberturas</h4>
                                        <p className="text-sm text-neutral-400">
                                            Rastrear quando emails são abertos
                                        </p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={settings.trackEmailOpens}
                                            onChange={(e) => setSettings({ ...settings, trackEmailOpens: e.target.checked })}
                                        />
                                        <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                    </label>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="font-medium text-white">Rastrear Cliques</h4>
                                        <p className="text-sm text-neutral-400">
                                            Rastrear quando links são clicados
                                        </p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={settings.trackEmailClicks}
                                            onChange={(e) => setSettings({ ...settings, trackEmailClicks: e.target.checked })}
                                        />
                                        <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Save Button */}
                        <div className="flex justify-end">
                            <button
                                onClick={handleSaveSettings}
                                disabled={isSaving}
                                className="flex items-center px-6 py-3 bg-white text-black font-medium rounded-lg hover:bg-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Save className="mr-2 h-4 w-4" />
                                {isSaving ? 'Salvando...' : 'Salvar Configurações'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
} 