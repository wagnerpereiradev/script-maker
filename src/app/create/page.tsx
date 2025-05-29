'use client';

import { useState, useEffect } from 'react';
import MainLayout from '@/components/MainLayout';
import { ProspectData, ScriptGenerationRequest } from '@/types';
import { Send, Loader2, Copy, Download, Settings, AlertTriangle, Users, Edit, User, RefreshCw, Save, Trash, FileText } from 'lucide-react';
import Link from 'next/link';

interface Contact {
    id: string;
    name: string;
    email: string;
    phone?: string;
    position?: string;
    companyName: string;
    website?: string;
    niche?: string;
    painPoints?: string;
    previousInteraction?: string;
    notes?: string;
    isActive: boolean;
}

export default function CreateScript() {
    // Script creation mode
    const [scriptMode, setScriptMode] = useState<'generic' | 'manual' | 'contact'>('generic');

    // Contact selection states
    const [selectedContactId, setSelectedContactId] = useState<string>('');
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [loadingContacts, setLoadingContacts] = useState(false);

    const [prospectData, setProspectData] = useState<ProspectData>({
        contactName: '',
        companyName: '',
        niche: '',
        position: '',
        email: '',
        website: '',
        painPoints: '',
        previousInteraction: '',
        notes: '',
    });

    const [emailConfig, setEmailConfig] = useState({
        emailType: 'cold_outreach' as ScriptGenerationRequest['emailType'],
        tone: 'professional' as ScriptGenerationRequest['tone'],
        length: 'medium' as ScriptGenerationRequest['length'],
        callToAction: '',
    });

    // Instruções personalizadas para guiar a geração
    const [customInstructions, setCustomInstructions] = useState('');

    const [generatedScript, setGeneratedScript] = useState<{
        subject: string;
        body: string;
    } | null>(null);

    const [isGenerating, setIsGenerating] = useState(false);
    const [hasOpenAIKey, setHasOpenAIKey] = useState<boolean | null>(null);
    const [error, setError] = useState<string | null>(null);

    // New states for script actions
    const [isSaving, setIsSaving] = useState(false);
    const [showSaveOptions, setShowSaveOptions] = useState(false);
    const [showContactUpdatePrompt, setShowContactUpdatePrompt] = useState(false);
    const [updatedContactData, setUpdatedContactData] = useState<Record<string, unknown> | null>(null);

    // Fixed list of missing fields (calculated only when contact changes)
    const [initialMissingFields, setInitialMissingFields] = useState<string[]>([]);

    // Check if contact has missing important fields - now using fixed list
    const contactMissingFields = initialMissingFields;

    // Verificar se a API está configurada
    useEffect(() => {
        checkOpenAIConfig();
    }, []);

    // Load contacts when user selects to use contact
    useEffect(() => {
        if (scriptMode === 'contact') {
            loadContacts();
        }
    }, [scriptMode]);

    // Update prospect data when contact is selected
    useEffect(() => {
        if (selectedContactId && contacts.length > 0 && scriptMode === 'contact') {
            const contact = contacts.find(c => c.id === selectedContactId);
            if (contact) {
                setProspectData({
                    contactName: contact.name,
                    companyName: contact.companyName,
                    niche: contact.niche || '',
                    position: contact.position || '',
                    email: contact.email,
                    website: contact.website || '',
                    painPoints: contact.painPoints || '',
                    previousInteraction: contact.previousInteraction || '',
                    notes: contact.notes || '',
                });

                // Calculate missing fields only once when contact is selected
                const missingFields = [
                    ...((!contact.niche || contact.niche.trim() === '') ? ['niche'] : []),
                    ...((!contact.painPoints || contact.painPoints.trim() === '') ? ['painPoints'] : []),
                    ...((!contact.previousInteraction || contact.previousInteraction.trim() === '') ? ['previousInteraction'] : []),
                    ...((!contact.position || contact.position.trim() === '') ? ['position'] : []),
                    ...((!contact.website || contact.website.trim() === '') ? ['website'] : []),
                    ...((!contact.notes || contact.notes.trim() === '') ? ['notes'] : []),
                ];
                setInitialMissingFields(missingFields);
            }
        } else {
            // Clear missing fields when no contact is selected or mode changes
            setInitialMissingFields([]);
            // Clear prospect data when switching to generic mode
            if (scriptMode === 'generic') {
                setProspectData({
                    contactName: '',
                    companyName: '',
                    niche: '',
                    position: '',
                    email: '',
                    website: '',
                    painPoints: '',
                    previousInteraction: '',
                    notes: '',
                });
            }
        }
    }, [selectedContactId, contacts, scriptMode]);

    const checkOpenAIConfig = async () => {
        try {
            const response = await fetch('/api/settings');
            const data = await response.json();

            if (response.ok) {
                setHasOpenAIKey(data.settings.hasOpenAIKey);
            }
        } catch (error) {
            console.error('Erro ao verificar configuração:', error);
            setHasOpenAIKey(false);
        }
    };

    const loadContacts = async () => {
        setLoadingContacts(true);
        try {
            const response = await fetch('/api/contacts?limit=100&isActive=true');
            if (response.ok) {
                const data = await response.json();
                setContacts(data.contacts);
            }
        } catch (error) {
            console.error('Erro ao carregar contatos:', error);
        } finally {
            setLoadingContacts(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsGenerating(true);
        setError(null);

        try {
            const requestData = {
                prospectData: scriptMode === 'generic' ? {
                    contactName: '[Nome do Contato]',
                    companyName: '[Nome da Empresa]',
                    niche: '[Nicho/Setor]',
                    position: '[Cargo]',
                    email: '[Email]',
                    website: '[Website]',
                    painPoints: '[Pontos de Dor]',
                    previousInteraction: '[Interação Anterior]',
                    notes: '[Observações]',
                } : prospectData,
                ...emailConfig,
                customInstructions,
                isGeneric: scriptMode === 'generic',
                ...(scriptMode === 'contact' && selectedContactId && { contactId: selectedContactId })
            };

            const response = await fetch('/api/generate-script', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Falha ao gerar script');
            }

            setGeneratedScript(result);
            setShowSaveOptions(true);

            // Check if we should prompt to update contact
            if (scriptMode === 'contact' && selectedContactId && contactMissingFields.length > 0) {
                const hasChanges = checkForContactUpdates();
                if (hasChanges) {
                    setUpdatedContactData(hasChanges);
                    setShowContactUpdatePrompt(true);
                }
            }
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Erro desconhecido');
        } finally {
            setIsGenerating(false);
        }
    };

    const checkForContactUpdates = () => {
        const updates: Record<string, unknown> = {};
        let hasChanges = false;

        // Check only the fields that were initially missing
        initialMissingFields.forEach(field => {
            const currentValue = prospectData[field as keyof ProspectData];
            if (currentValue && typeof currentValue === 'string' && currentValue.trim()) {
                updates[field] = currentValue;
                hasChanges = true;
            }
        });

        return hasChanges ? updates : null;
    };

    const updateContactWithNewData = async () => {
        if (!selectedContactId || !updatedContactData) return;

        try {
            const originalContact = contacts.find(c => c.id === selectedContactId);
            if (!originalContact) return;

            const updateData = {
                ...originalContact,
                ...updatedContactData
            };

            const response = await fetch(`/api/contacts/${selectedContactId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updateData),
            });

            if (response.ok) {
                // Update local contacts list
                setContacts(prev => prev.map(contact =>
                    contact.id === selectedContactId
                        ? { ...contact, ...updatedContactData }
                        : contact
                ));
                alert('Informações do contato atualizadas com sucesso!');
            } else {
                throw new Error('Erro ao atualizar contato');
            }
        } catch (error) {
            console.error('Erro ao atualizar contato:', error);
            setError('Erro ao atualizar informações do contato');
        } finally {
            setShowContactUpdatePrompt(false);
            setUpdatedContactData(null);
        }
    };

    const saveScript = async () => {
        if (!generatedScript) return;

        setIsSaving(true);
        try {
            const scriptData = {
                subject: generatedScript.subject,
                body: generatedScript.body,
                prospectData: scriptMode === 'generic' ? {
                    contactName: '[Nome do Contato]',
                    companyName: '[Nome da Empresa]',
                    niche: '[Nicho/Setor]',
                    position: '[Cargo]',
                    email: '[Email]',
                    website: '[Website]',
                    painPoints: '[Pontos de Dor]',
                } : prospectData,
                ...emailConfig,
                customInstructions,
                isGeneric: scriptMode === 'generic',
                ...(scriptMode === 'contact' && selectedContactId && { contactId: selectedContactId })
            };

            const response = await fetch('/api/scripts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(scriptData),
            });

            if (response.ok) {
                alert('Script salvo com sucesso!');
                setShowSaveOptions(false);
            } else {
                throw new Error('Erro ao salvar script');
            }
        } catch (error) {
            console.error('Erro ao salvar:', error);
            setError('Erro ao salvar script');
        } finally {
            setIsSaving(false);
        }
    };

    const regenerateScript = () => {
        setGeneratedScript(null);
        setShowSaveOptions(false);
        handleSubmit({ preventDefault: () => { } } as React.FormEvent);
    };

    const clearScript = () => {
        setGeneratedScript(null);
        setShowSaveOptions(false);
        setError(null);
    };

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            alert('Copiado para a área de transferência!');
        } catch (err) {
            console.error('Erro ao copiar:', err);
        }
    };

    return (
        <MainLayout>
            <div className="p-8">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-white mb-2">
                            Criar Novo Script
                        </h1>
                        <p className="text-neutral-400">
                            Crie scripts genéricos reutilizáveis ou personalize usando dados de um contato específico
                        </p>
                    </div>

                    {/* Script Creation Mode */}
                    <div className="mb-6 bg-neutral-gradient rounded-lg p-6 border border-neutral-800">
                        <h3 className="text-lg font-semibold text-white mb-4">
                            Tipo de Script
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <button
                                type="button"
                                onClick={() => setScriptMode('generic')}
                                className={`flex flex-col items-center gap-2 p-4 rounded-lg transition-colors border-2 ${scriptMode === 'generic'
                                    ? 'bg-blue-600 text-white border-blue-600'
                                    : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700 border-neutral-700'
                                    }`}
                            >
                                <FileText className="h-6 w-6" />
                                <div className="text-center">
                                    <div className="font-medium">Script Genérico</div>
                                    <div className="text-xs opacity-80">Reutilizável para vários contatos</div>
                                </div>
                            </button>
                            <button
                                type="button"
                                onClick={() => setScriptMode('manual')}
                                className={`flex flex-col items-center gap-2 p-4 rounded-lg transition-colors border-2 ${scriptMode === 'manual'
                                    ? 'bg-blue-600 text-white border-blue-600'
                                    : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700 border-neutral-700'
                                    }`}
                            >
                                <Edit className="h-6 w-6" />
                                <div className="text-center">
                                    <div className="font-medium">Dados Manuais</div>
                                    <div className="text-xs opacity-80">Preencher informações específicas</div>
                                </div>
                            </button>
                            <button
                                type="button"
                                onClick={() => setScriptMode('contact')}
                                className={`flex flex-col items-center gap-2 p-4 rounded-lg transition-colors border-2 ${scriptMode === 'contact'
                                    ? 'bg-blue-600 text-white border-blue-600'
                                    : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700 border-neutral-700'
                                    }`}
                            >
                                <Users className="h-6 w-6" />
                                <div className="text-center">
                                    <div className="font-medium">Contato Existente</div>
                                    <div className="text-xs opacity-80">Usar dados de um contato</div>
                                </div>
                            </button>
                        </div>

                        {/* Description based on selected mode */}
                        <div className="bg-neutral-800/50 rounded-lg p-4">
                            {scriptMode === 'generic' && (
                                <div className="text-sm text-neutral-300">
                                    <strong>Script Genérico:</strong> Crie um script com placeholders que pode ser reutilizado para diferentes contatos.
                                    Ideal para criar templates de cold outreach, follow-up, etc.
                                </div>
                            )}
                            {scriptMode === 'manual' && (
                                <div className="text-sm text-neutral-300">
                                    <strong>Dados Manuais:</strong> Preencha informações específicas de um prospect para gerar um script personalizado.
                                    Útil para casos únicos ou prospects não cadastrados.
                                </div>
                            )}
                            {scriptMode === 'contact' && (
                                <div className="text-sm text-neutral-300">
                                    <strong>Contato Existente:</strong> Use dados de um contato já cadastrado para gerar um script personalizado.
                                    Os dados faltantes podem ser preenchidos durante o processo.
                                </div>
                            )}
                        </div>

                        {/* Contact Selection */}
                        {scriptMode === 'contact' && (
                            <div className="mt-4">
                                <label className="block text-sm font-medium text-neutral-300 mb-2">
                                    Selecionar Contato
                                </label>
                                {loadingContacts ? (
                                    <div className="flex items-center gap-2 text-neutral-400">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Carregando contatos...
                                    </div>
                                ) : (
                                    <select
                                        value={selectedContactId}
                                        onChange={(e) => setSelectedContactId(e.target.value)}
                                        className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:border-white"
                                        required={scriptMode === 'contact'}
                                    >
                                        <option value="">Selecione um contato...</option>
                                        {contacts.map((contact) => (
                                            <option key={contact.id} value={contact.id}>
                                                {contact.name} - {contact.companyName}
                                            </option>
                                        ))}
                                    </select>
                                )}
                                {contacts.length === 0 && !loadingContacts && (
                                    <p className="text-sm text-neutral-400 mt-2">
                                        Nenhum contato ativo encontrado.{' '}
                                        <Link href="/contacts" className="text-blue-400 hover:underline">
                                            Criar primeiro contato
                                        </Link>
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* OpenAI Configuration Alert */}
                    {hasOpenAIKey === false && (
                        <div className="mb-6 p-4 bg-yellow-900/50 border border-yellow-700 rounded-lg">
                            <div className="flex items-center">
                                <AlertTriangle className="h-5 w-5 text-yellow-400 mr-3" />
                                <div className="flex-1">
                                    <h3 className="text-yellow-400 font-medium">
                                        Configuração Necessária
                                    </h3>
                                    <p className="text-yellow-300 text-sm mt-1">
                                        Configure sua chave da API OpenAI nas configurações para gerar scripts.
                                    </p>
                                </div>
                                <Link
                                    href="/settings"
                                    className="flex items-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm"
                                >
                                    <Settings className="mr-2 h-4 w-4" />
                                    Configurar
                                </Link>
                            </div>
                        </div>
                    )}

                    {/* Error Alert */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-900/50 border border-red-700 rounded-lg">
                            <div className="flex items-center">
                                <AlertTriangle className="h-5 w-5 text-red-400 mr-3" />
                                <div className="flex-1">
                                    <h3 className="text-red-400 font-medium">Erro ao Gerar Script</h3>
                                    <p className="text-red-300 text-sm mt-1">{error}</p>
                                </div>
                                <button
                                    onClick={() => setError(null)}
                                    className="text-red-400 hover:text-red-300"
                                >
                                    ×
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Form */}
                        <div className="bg-neutral-gradient rounded-lg p-6 border border-neutral-800">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Prospect Data - Show based on mode */}
                                {scriptMode === 'manual' && (
                                    <div>
                                        <h3 className="text-lg font-semibold text-white mb-4">
                                            Dados do Prospect
                                        </h3>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-neutral-300 mb-2">
                                                    Nome do Contato *
                                                </label>
                                                <input
                                                    type="text"
                                                    required
                                                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-white"
                                                    placeholder="Ex: João Silva"
                                                    value={prospectData.contactName}
                                                    onChange={(e) =>
                                                        setProspectData({ ...prospectData, contactName: e.target.value })
                                                    }
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-neutral-300 mb-2">
                                                    Nome da Empresa *
                                                </label>
                                                <input
                                                    type="text"
                                                    required
                                                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-white"
                                                    placeholder="Ex: TechCorp Solutions"
                                                    value={prospectData.companyName}
                                                    onChange={(e) =>
                                                        setProspectData({ ...prospectData, companyName: e.target.value })
                                                    }
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-neutral-300 mb-2">
                                                    Nicho/Setor *
                                                </label>
                                                <input
                                                    type="text"
                                                    required
                                                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-white"
                                                    placeholder="Ex: Tecnologia, Marketing, Saúde"
                                                    value={prospectData.niche}
                                                    onChange={(e) =>
                                                        setProspectData({ ...prospectData, niche: e.target.value })
                                                    }
                                                />
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                                                        Cargo
                                                    </label>
                                                    <input
                                                        type="text"
                                                        className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-white"
                                                        placeholder="Ex: CEO, Diretor"
                                                        value={prospectData.position}
                                                        onChange={(e) =>
                                                            setProspectData({ ...prospectData, position: e.target.value })
                                                        }
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                                                        Website
                                                    </label>
                                                    <input
                                                        type="url"
                                                        className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-white"
                                                        placeholder="https://empresa.com"
                                                        value={prospectData.website}
                                                        onChange={(e) =>
                                                            setProspectData({ ...prospectData, website: e.target.value })
                                                        }
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-neutral-300 mb-2">
                                                    Pontos de Dor
                                                </label>
                                                <textarea
                                                    rows={3}
                                                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-white resize-none"
                                                    placeholder="Quais problemas a empresa enfrenta que você pode resolver?"
                                                    value={prospectData.painPoints}
                                                    onChange={(e) =>
                                                        setProspectData({ ...prospectData, painPoints: e.target.value })
                                                    }
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-neutral-300 mb-2">
                                                    Interação Anterior
                                                </label>
                                                <textarea
                                                    rows={3}
                                                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-white resize-none"
                                                    placeholder="Houve algum contato anterior? Como vocês se conheceram?"
                                                    value={prospectData.previousInteraction}
                                                    onChange={(e) =>
                                                        setProspectData({
                                                            ...prospectData,
                                                            previousInteraction: e.target.value,
                                                        })
                                                    }
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-neutral-300 mb-2">
                                                    Observações Adicionais
                                                </label>
                                                <textarea
                                                    rows={3}
                                                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-white resize-none"
                                                    placeholder="Informações extras sobre o prospect ou contexto"
                                                    value={prospectData.notes}
                                                    onChange={(e) =>
                                                        setProspectData({ ...prospectData, notes: e.target.value })
                                                    }
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Generic Script Info */}
                                {scriptMode === 'generic' && (
                                    <div>
                                        <h3 className="text-lg font-semibold text-white mb-4">
                                            Script Genérico
                                        </h3>
                                        <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
                                            <div className="flex items-start gap-3">
                                                <FileText className="h-5 w-5 text-blue-400 mt-0.5" />
                                                <div>
                                                    <h4 className="text-blue-300 font-medium mb-2">Como funciona?</h4>
                                                    <ul className="text-blue-200 text-sm space-y-1">
                                                        <li>• O script será criado com placeholders como [Nome do Contato], [Empresa], etc.</li>
                                                        <li>• Pode ser reutilizado para diferentes prospects</li>
                                                        <li>• Ideal para criar templates de cold outreach, follow-up, etc.</li>
                                                        <li>• Na hora de enviar, os placeholders serão substituídos pelos dados reais</li>
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Selected Contact Display */}
                                {scriptMode === 'contact' && selectedContactId && (
                                    <div>
                                        <h3 className="text-lg font-semibold text-white mb-4">
                                            Contato Selecionado
                                            {contactMissingFields.length > 0 && (
                                                <span className="ml-2 text-sm text-yellow-400">
                                                    (Alguns campos necessários estão vazios - preencha abaixo)
                                                </span>
                                            )}
                                        </h3>

                                        <div className="bg-neutral-800 rounded-lg p-4 space-y-3 mb-4">
                                            <div className="flex items-center gap-2">
                                                <User className="h-4 w-4 text-neutral-400" />
                                                <span className="text-white font-medium">{prospectData.contactName}</span>
                                                {prospectData.position && (
                                                    <span className="text-neutral-400">• {prospectData.position}</span>
                                                )}
                                            </div>
                                            <div className="text-neutral-300">
                                                {prospectData.companyName}
                                                {prospectData.niche && ` • ${prospectData.niche}`}
                                            </div>
                                            {prospectData.email && (
                                                <div className="text-neutral-400 text-sm">
                                                    {prospectData.email}
                                                </div>
                                            )}
                                        </div>

                                        {/* Editable fields for missing data */}
                                        {contactMissingFields.length > 0 && (
                                            <div className="space-y-4 p-4 bg-yellow-900/20 border border-yellow-700 rounded-lg">
                                                <h4 className="text-yellow-400 font-medium text-sm">
                                                    Preencha os campos em branco para melhorar o script:
                                                </h4>

                                                {contactMissingFields.includes('niche') && (
                                                    <div>
                                                        <label className="block text-sm font-medium text-neutral-300 mb-2">
                                                            Nicho/Setor *
                                                        </label>
                                                        <input
                                                            type="text"
                                                            required
                                                            className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-white"
                                                            placeholder="Ex: Tecnologia, Marketing, Saúde"
                                                            value={prospectData.niche}
                                                            onChange={(e) =>
                                                                setProspectData({ ...prospectData, niche: e.target.value })
                                                            }
                                                        />
                                                    </div>
                                                )}

                                                {contactMissingFields.includes('position') && (
                                                    <div>
                                                        <label className="block text-sm font-medium text-neutral-300 mb-2">
                                                            Cargo
                                                        </label>
                                                        <input
                                                            type="text"
                                                            className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-white"
                                                            placeholder="Ex: CEO, Diretor de Marketing"
                                                            value={prospectData.position}
                                                            onChange={(e) =>
                                                                setProspectData({ ...prospectData, position: e.target.value })
                                                            }
                                                        />
                                                    </div>
                                                )}

                                                {contactMissingFields.includes('website') && (
                                                    <div>
                                                        <label className="block text-sm font-medium text-neutral-300 mb-2">
                                                            Website
                                                        </label>
                                                        <input
                                                            type="url"
                                                            className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-white"
                                                            placeholder="https://empresa.com"
                                                            value={prospectData.website}
                                                            onChange={(e) =>
                                                                setProspectData({ ...prospectData, website: e.target.value })
                                                            }
                                                        />
                                                    </div>
                                                )}

                                                {contactMissingFields.includes('painPoints') && (
                                                    <div>
                                                        <label className="block text-sm font-medium text-neutral-300 mb-2">
                                                            Pontos de Dor
                                                        </label>
                                                        <textarea
                                                            rows={3}
                                                            className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-white resize-none"
                                                            placeholder="Quais problemas a empresa enfrenta que você pode resolver?"
                                                            value={prospectData.painPoints}
                                                            onChange={(e) =>
                                                                setProspectData({ ...prospectData, painPoints: e.target.value })
                                                            }
                                                        />
                                                    </div>
                                                )}

                                                {contactMissingFields.includes('previousInteraction') && (
                                                    <div>
                                                        <label className="block text-sm font-medium text-neutral-300 mb-2">
                                                            Interação Anterior
                                                        </label>
                                                        <textarea
                                                            rows={3}
                                                            className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-white resize-none"
                                                            placeholder="Houve algum contato anterior? Como vocês se conheceram?"
                                                            value={prospectData.previousInteraction}
                                                            onChange={(e) =>
                                                                setProspectData({ ...prospectData, previousInteraction: e.target.value })
                                                            }
                                                        />
                                                    </div>
                                                )}

                                                {contactMissingFields.includes('notes') && (
                                                    <div>
                                                        <label className="block text-sm font-medium text-neutral-300 mb-2">
                                                            Observações Adicionais
                                                        </label>
                                                        <textarea
                                                            rows={3}
                                                            className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-white resize-none"
                                                            placeholder="Informações extras sobre o prospect ou contexto"
                                                            value={prospectData.notes}
                                                            onChange={(e) =>
                                                                setProspectData({ ...prospectData, notes: e.target.value })
                                                            }
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Email Configuration */}
                                <div>
                                    <h3 className="text-lg font-semibold text-white mb-4">
                                        Configurações do Email
                                    </h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-neutral-300 mb-2">
                                                Tipo de Email
                                            </label>
                                            <select
                                                className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:border-white"
                                                value={emailConfig.emailType}
                                                onChange={(e) =>
                                                    setEmailConfig({
                                                        ...emailConfig,
                                                        emailType: e.target.value as ScriptGenerationRequest['emailType'],
                                                    })
                                                }
                                            >
                                                <option value="cold_outreach">Cold Outreach</option>
                                                <option value="follow_up">Follow-up</option>
                                                <option value="introduction">Introdução</option>
                                                <option value="meeting_request">Solicitação de Reunião</option>
                                            </select>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-neutral-300 mb-2">
                                                    Tom
                                                </label>
                                                <select
                                                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:border-white"
                                                    value={emailConfig.tone}
                                                    onChange={(e) =>
                                                        setEmailConfig({
                                                            ...emailConfig,
                                                            tone: e.target.value as ScriptGenerationRequest['tone'],
                                                        })
                                                    }
                                                >
                                                    <option value="professional">Profissional</option>
                                                    <option value="casual">Casual</option>
                                                    <option value="friendly">Amigável</option>
                                                    <option value="formal">Formal</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-neutral-300 mb-2">
                                                    Tamanho
                                                </label>
                                                <select
                                                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:border-white"
                                                    value={emailConfig.length}
                                                    onChange={(e) =>
                                                        setEmailConfig({
                                                            ...emailConfig,
                                                            length: e.target.value as ScriptGenerationRequest['length'],
                                                        })
                                                    }
                                                >
                                                    <option value="short">Curto</option>
                                                    <option value="medium">Médio</option>
                                                    <option value="long">Longo</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-neutral-300 mb-2">
                                                Call to Action
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-white"
                                                placeholder="Ex: Agendar uma reunião de 15 minutos"
                                                value={emailConfig.callToAction}
                                                onChange={(e) =>
                                                    setEmailConfig({ ...emailConfig, callToAction: e.target.value })
                                                }
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Instruções Personalizadas */}
                                <div>
                                    <h3 className="text-lg font-semibold text-white mb-4">
                                        Instruções Personalizadas
                                    </h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-neutral-300 mb-2">
                                                Direcionamento para o Script
                                                <span className="text-neutral-500 text-xs block mt-1">
                                                    Descreva o objetivo, tom específico, direcionamento da campanha, ou qualquer orientação para a IA
                                                </span>
                                            </label>
                                            <textarea
                                                rows={4}
                                                className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-white resize-none"
                                                placeholder="Ex: Este é um script para campanha de lançamento de produto. Foque em benefícios únicos e crie urgência. Use tom entusiasmado mas profissional. Mencione desconto por tempo limitado."
                                                value={customInstructions}
                                                onChange={(e) => setCustomInstructions(e.target.value)}
                                            />
                                        </div>

                                        {/* Exemplos de instruções */}
                                        <div className="bg-neutral-800/50 rounded-lg p-3">
                                            <h4 className="text-sm font-medium text-neutral-300 mb-2">💡 Exemplos de instruções:</h4>
                                            <ul className="text-xs text-neutral-400 space-y-1">
                                                <li>• Script para follow-up após demo. Mencionar pontos específicos discutidos.</li>
                                                <li>• Cold outreach para CEOs de startups. Tom casual, mencionar crescimento rápido.</li>
                                                <li>• Reativação de leads frios. Criar senso de urgência com nova funcionalidade.</li>
                                                <li>• Email de nurturing B2B. Educar sobre ROI, incluir case study.</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={isGenerating || hasOpenAIKey === false}
                                    className="w-full flex items-center justify-center px-6 py-3 bg-white text-black font-medium rounded-lg hover:bg-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isGenerating ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Gerando Script...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="mr-2 h-4 w-4" />
                                            Gerar Script
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>

                        {/* Generated Script */}
                        <div className="bg-neutral-gradient rounded-lg p-6 border border-neutral-800">
                            <h3 className="text-lg font-semibold text-white mb-4">
                                Script Gerado
                            </h3>

                            {generatedScript ? (
                                <div className="space-y-4">
                                    {/* Subject */}
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="text-sm font-medium text-neutral-300">
                                                Assunto
                                            </label>
                                            <button
                                                onClick={() => copyToClipboard(generatedScript.subject)}
                                                className="p-1 text-neutral-400 hover:text-white"
                                                title="Copiar assunto"
                                            >
                                                <Copy className="h-4 w-4" />
                                            </button>
                                        </div>
                                        <div className="p-3 bg-neutral-800 rounded-lg text-white">
                                            {generatedScript.subject}
                                        </div>
                                    </div>

                                    {/* Body */}
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="text-sm font-medium text-neutral-300">
                                                Corpo do Email
                                            </label>
                                            <button
                                                onClick={() => copyToClipboard(generatedScript.body)}
                                                className="p-1 text-neutral-400 hover:text-white"
                                                title="Copiar corpo"
                                            >
                                                <Copy className="h-4 w-4" />
                                            </button>
                                        </div>
                                        <div className="p-3 bg-neutral-800 rounded-lg text-white whitespace-pre-wrap max-h-96 overflow-y-auto">
                                            {generatedScript.body}
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    {showSaveOptions && (
                                        <div className="space-y-3">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={saveScript}
                                                    disabled={isSaving}
                                                    className="flex-1 flex items-center justify-center px-4 py-2 bg-white text-black rounded-lg hover:bg-neutral-200 transition-colors disabled:opacity-50"
                                                >
                                                    {isSaving ? (
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <Save className="mr-2 h-4 w-4" />
                                                    )}
                                                    {isSaving ? 'Salvando...' : 'Salvar Script'}
                                                </button>
                                                <button
                                                    onClick={regenerateScript}
                                                    disabled={isGenerating}
                                                    className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                                                >
                                                    {isGenerating ? (
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <RefreshCw className="mr-2 h-4 w-4" />
                                                    )}
                                                    {isGenerating ? 'Gerando...' : 'Gerar Novamente'}
                                                </button>
                                            </div>
                                            <button
                                                onClick={clearScript}
                                                className="w-full flex items-center justify-center px-4 py-2 bg-neutral-700 text-white rounded-lg hover:bg-neutral-600 transition-colors"
                                            >
                                                <Trash className="mr-2 h-4 w-4" />
                                                Limpar e Começar Novamente
                                            </button>
                                        </div>
                                    )}

                                    {/* Copy and Download Options */}
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() =>
                                                copyToClipboard(
                                                    `Assunto: ${generatedScript.subject}\n\n${generatedScript.body}`
                                                )
                                            }
                                            className="flex-1 flex items-center justify-center px-4 py-2 bg-neutral-700 text-white rounded-lg hover:bg-neutral-600 transition-colors"
                                        >
                                            <Copy className="mr-2 h-4 w-4" />
                                            Copiar Tudo
                                        </button>
                                        <button
                                            onClick={() => {
                                                const element = document.createElement('a');
                                                const file = new Blob(
                                                    [`Assunto: ${generatedScript.subject}\n\n${generatedScript.body}`],
                                                    { type: 'text/plain' }
                                                );
                                                element.href = URL.createObjectURL(file);
                                                element.download = 'email-script.txt';
                                                document.body.appendChild(element);
                                                element.click();
                                                document.body.removeChild(element);
                                            }}
                                            className="flex-1 flex items-center justify-center px-4 py-2 bg-neutral-700 text-white rounded-lg hover:bg-neutral-600 transition-colors"
                                        >
                                            <Download className="mr-2 h-4 w-4" />
                                            Download
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center h-64 text-neutral-500">
                                    <div className="text-center">
                                        <Send className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                        <p>Preencha o formulário e clique em <b>Gerar Script</b> para ver o resultado aqui.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Contact Update Confirmation Modal */}
                {showContactUpdatePrompt && updatedContactData && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-neutral-900 rounded-lg max-w-md w-full border border-neutral-700">
                            <div className="p-6 border-b border-neutral-700">
                                <h2 className="text-xl font-bold text-white">
                                    Atualizar Informações do Contato?
                                </h2>
                            </div>

                            <div className="p-6">
                                <div className="flex items-start gap-4 mb-6">
                                    <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                                        <Users className="h-6 w-6 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-white font-medium mb-2">
                                            Você preencheu campos que estavam vazios no contato.
                                        </p>
                                        <p className="text-neutral-400 text-sm mb-4">
                                            Deseja salvar essas informações no contato <b>{prospectData.contactName}</b> para uso futuro?
                                        </p>

                                        <div className="bg-neutral-800 rounded-lg p-3 space-y-2">
                                            <h4 className="text-white font-medium text-sm">Novas informações:</h4>
                                            {Object.entries(updatedContactData).map(([key, value]) => {
                                                const fieldNames: { [key: string]: string } = {
                                                    niche: 'Nicho/Setor',
                                                    painPoints: 'Pontos de Dor',
                                                    previousInteraction: 'Interação Anterior',
                                                    position: 'Cargo',
                                                    website: 'Website',
                                                    notes: 'Observações'
                                                };
                                                return (
                                                    <div key={key} className="text-sm">
                                                        <span className="text-neutral-400">{fieldNames[key]}:</span>
                                                        <span className="text-white ml-2">
                                                            {typeof value === 'string' && value.length > 50
                                                                ? `${value.substring(0, 50)}...`
                                                                : String(value)
                                                            }
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 border-t border-neutral-700 flex items-center justify-end gap-3">
                                <button
                                    onClick={() => {
                                        setShowContactUpdatePrompt(false);
                                        setUpdatedContactData(null);
                                    }}
                                    className="px-4 py-2 bg-neutral-800 text-white rounded-lg hover:bg-neutral-700 transition-colors border border-neutral-600"
                                >
                                    Não, obrigado
                                </button>
                                <button
                                    onClick={updateContactWithNewData}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Sim, Atualizar Contato
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </MainLayout>
    );
} 