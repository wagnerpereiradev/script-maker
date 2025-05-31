'use client';

import { useState, useEffect } from 'react';
import MainLayout from '@/components/MainLayout';
import { ProspectData, ScriptGenerationRequest } from '@/types';
import { Send, Loader2, Copy, Download, Settings, AlertTriangle, Users, Edit, User, RefreshCw, Save, Trash, FileText, Sparkles, Zap, Target } from 'lucide-react';
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

    // User data from settings
    const [userData, setUserData] = useState({
        yourName: '',
        yourCompany: '',
        yourPhone: '',
        yourPosition: '',
        yourIndustry: '',
        yourWebsite: '',
        yourLocation: ''
    });

    // New states for script actions
    const [isSaving, setIsSaving] = useState(false);
    const [showSaveOptions, setShowSaveOptions] = useState(false);
    const [showContactUpdatePrompt, setShowContactUpdatePrompt] = useState(false);
    const [updatedContactData, setUpdatedContactData] = useState<Record<string, unknown> | null>(null);

    // Modal state for prospect data editing
    const [showProspectModal, setShowProspectModal] = useState(false);

    // Selected variables for script generation
    const [selectedVariables, setSelectedVariables] = useState<{
        user: string[];
        contact: string[];
    }>({
        user: [],
        contact: []
    });

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

    // Set default selected variables based on available data
    useEffect(() => {
        const defaultUserVars = [];
        const defaultContactVars = ['contactName', 'contactFirstName', 'companyName'];

        // Add user variables that have values
        if (userData.yourName) defaultUserVars.push('yourName');
        if (userData.yourCompany) defaultUserVars.push('yourCompany');
        if (userData.yourPosition) defaultUserVars.push('yourPosition');

        setSelectedVariables({
            user: defaultUserVars,
            contact: defaultContactVars
        });
    }, [userData]);

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

                // Extract user data from settings
                setUserData({
                    yourName: data.settings.yourName || '',
                    yourCompany: data.settings.yourCompany || '',
                    yourPhone: data.settings.yourPhone || '',
                    yourPosition: data.settings.yourPosition || '',
                    yourIndustry: data.settings.yourIndustry || '',
                    yourWebsite: data.settings.yourWebsite || '',
                    yourLocation: data.settings.yourLocation || ''
                });
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
        setGeneratedScript({ subject: '', body: '' }); // Reset com strings vazias para mostrar loading

        try {
            // Helper function to get first name from full name
            const getFirstName = (fullName: string) => {
                return fullName.split(' ')[0] || '';
            };

            // Prepare contact variables
            const contactVariables = scriptMode === 'generic' ? {
                contactName: '[Nome do Contato]',
                contactFirstName: '[Primeiro Nome]',
                contactEmail: '[Email do Contato]',
                contactPhone: '[Telefone do Contato]',
                contactPosition: '[Cargo do Contato]',
                companyName: '[Nome da Empresa]',
                companyWebsite: '[Website da Empresa]',
                companyIndustry: '[Setor da Empresa]',
            } : {
                contactName: prospectData.contactName,
                contactFirstName: getFirstName(prospectData.contactName),
                contactEmail: prospectData.email,
                contactPhone: '', // Phone não está no prospectData atual, pode ser adicionado depois
                contactPosition: prospectData.position,
                companyName: prospectData.companyName,
                companyWebsite: prospectData.website,
                companyIndustry: prospectData.niche,
            };

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
                // Include user data from settings
                userData: userData,
                // Include contact variables
                contactVariables: contactVariables,
                // Include selected variables
                selectedVariables: selectedVariables,
                ...(scriptMode === 'contact' && selectedContactId && { contactId: selectedContactId })
            };

            const response = await fetch('/api/generate-script', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Falha ao gerar script');
            }

            // Handle streaming response
            const reader = response.body?.getReader();
            if (!reader) {
                throw new Error('Streaming não suportado');
            }

            const decoder = new TextDecoder();
            let subject = '';
            let body = '';
            let currentSection = '';

            while (true) {
                const { done, value } = await reader.read();

                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);

                        if (data === '[DONE]') {
                            setShowSaveOptions(true);
                            // Check if we should prompt to update contact
                            if (scriptMode === 'contact' && selectedContactId && contactMissingFields.length > 0) {
                                const hasChanges = checkForContactUpdates();
                                if (hasChanges) {
                                    setUpdatedContactData(hasChanges);
                                    setShowContactUpdatePrompt(true);
                                }
                            }
                            continue;
                        }

                        if (data === '[SUBJECT_START]') {
                            currentSection = 'subject';
                            continue;
                        }

                        if (data === '[BODY_START]') {
                            currentSection = 'body';
                            continue;
                        }

                        try {
                            const parsedData = JSON.parse(data);

                            if (currentSection === 'subject') {
                                subject += parsedData.content || '';
                                setGeneratedScript(prev => prev ? { ...prev, subject } : { subject, body: '' });
                            } else if (currentSection === 'body') {
                                body += parsedData.content || '';
                                setGeneratedScript(prev => prev ? { ...prev, body } : { subject, body });
                            }
                        } catch (error) {
                            // Ignore parsing errors for individual chunks
                            console.warn('Erro ao fazer parse do chunk:', error);
                        }
                    }
                }
            }

        } catch (error) {
            setError(error instanceof Error ? error.message : 'Erro desconhecido');
            setGeneratedScript(null);
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

    const regenerateScript = async () => {
        setGeneratedScript(null);
        setShowSaveOptions(false);
        const fakeEvent = {
            preventDefault: () => { }
        } as React.FormEvent;
        await handleSubmit(fakeEvent);
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
            <div className="p-4 sm:p-6 lg:p-8">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="mb-6 lg:mb-8">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 flex items-center gap-3">
                                    <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
                                        <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                                    </div>
                                    Criar Script
                                </h1>
                                <p className="text-neutral-400">
                                    Gere scripts personalizados com IA para diferentes tipos de campanhas
                                </p>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                                <Link
                                    href="/send-email"
                                    className="inline-flex items-center justify-center px-4 py-2 bg-white text-black font-medium rounded-lg hover:bg-neutral-200 transition-colors"
                                >
                                    <Send className="h-4 w-4 mr-2" />
                                    Enviar Email
                                </Link>
                                <Link
                                    href="/scripts"
                                    className="inline-flex items-center justify-center px-4 py-2 bg-neutral-700 text-white font-medium rounded-lg hover:bg-neutral-600 transition-colors"
                                >
                                    <FileText className="h-4 w-4 mr-2" />
                                    Scripts Salvos
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Script Creation Mode */}
                    <div className="mb-6 rounded-xl p-5 border border-neutral-700/50 backdrop-blur-sm shadow-sm">
                        <div className="mb-5">
                            <h3 className="text-lg font-bold text-white mb-1">Tipo de Script</h3>
                            <p className="text-neutral-400 text-sm">Escolha como você deseja criar seu script</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
                            <button
                                type="button"
                                onClick={() => setScriptMode('generic')}
                                className={`group relative p-4 rounded-xl transition-all duration-200 border-2 ${scriptMode === 'generic'
                                    ? 'bg-gradient-to-br from-blue-600/20 to-blue-700/10 border-blue-500/50 text-white'
                                    : 'bg-neutral-800/30 hover:bg-neutral-800/50 border-neutral-700/50 hover:border-neutral-600/50 text-neutral-300'
                                    }`}
                            >
                                <div className="flex flex-col items-center gap-3 text-center">
                                    <div className={`p-2.5 rounded-lg transition-all duration-200 ${scriptMode === 'generic'
                                        ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white'
                                        : 'bg-neutral-700 group-hover:bg-neutral-600 text-neutral-400'
                                        }`}>
                                        <FileText className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <div className="font-semibold mb-1">Script Genérico</div>
                                        <div className="text-xs opacity-80">Reutilizável com placeholders</div>
                                    </div>
                                </div>
                            </button>

                            <button
                                type="button"
                                onClick={() => setScriptMode('manual')}
                                className={`group relative p-4 rounded-xl transition-all duration-200 border-2 ${scriptMode === 'manual'
                                    ? 'bg-gradient-to-br from-emerald-600/20 to-emerald-700/10 border-emerald-500/50 text-white'
                                    : 'bg-neutral-800/30 hover:bg-neutral-800/50 border-neutral-700/50 hover:border-neutral-600/50 text-neutral-300'
                                    }`}
                            >
                                <div className="flex flex-col items-center gap-3 text-center">
                                    <div className={`p-2.5 rounded-lg transition-all duration-200 ${scriptMode === 'manual'
                                        ? 'bg-gradient-to-br from-emerald-600 to-emerald-700 text-white'
                                        : 'bg-neutral-700 group-hover:bg-neutral-600 text-neutral-400'
                                        }`}>
                                        <Edit className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <div className="font-semibold mb-1">Dados Manuais</div>
                                        <div className="text-xs opacity-80">Informações específicas</div>
                                    </div>
                                </div>
                            </button>

                            <button
                                type="button"
                                onClick={() => setScriptMode('contact')}
                                className={`group relative p-4 rounded-xl transition-all duration-200 border-2 ${scriptMode === 'contact'
                                    ? 'bg-gradient-to-br from-purple-600/20 to-purple-700/10 border-purple-500/50 text-white'
                                    : 'bg-neutral-800/30 hover:bg-neutral-800/50 border-neutral-700/50 hover:border-neutral-600/50 text-neutral-300'
                                    }`}
                            >
                                <div className="flex flex-col items-center gap-3 text-center">
                                    <div className={`p-2.5 rounded-lg transition-all duration-200 ${scriptMode === 'contact'
                                        ? 'bg-gradient-to-br from-purple-600 to-purple-700 text-white'
                                        : 'bg-neutral-700 group-hover:bg-neutral-600 text-neutral-400'
                                        }`}>
                                        <Users className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <div className="font-semibold mb-1">Contato Existente</div>
                                        <div className="text-xs opacity-80">Usar dados salvos</div>
                                    </div>
                                </div>
                            </button>
                        </div>

                        {/* Description based on selected mode */}
                        <div className="bg-neutral-800/30 rounded-lg p-4 border border-neutral-700/30">
                            {scriptMode === 'generic' && (
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-blue-500/10 rounded-lg">
                                        <FileText className="h-4 w-4 text-blue-400" />
                                    </div>
                                    <div>
                                        <h4 className="text-blue-300 font-medium mb-1">Script Genérico</h4>
                                        <p className="text-neutral-400 text-sm">
                                            Crie um template com placeholders como [Nome] e [Empresa] que pode ser reutilizado para diferentes contatos.
                                        </p>
                                    </div>
                                </div>
                            )}
                            {scriptMode === 'manual' && (
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-emerald-500/10 rounded-lg">
                                        <Edit className="h-4 w-4 text-emerald-400" />
                                    </div>
                                    <div>
                                        <h4 className="text-emerald-300 font-medium mb-1">Dados Manuais</h4>
                                        <p className="text-neutral-400 text-sm">
                                            Preencha informações específicas de um prospect para gerar um script completamente personalizado.
                                        </p>
                                    </div>
                                </div>
                            )}
                            {scriptMode === 'contact' && (
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-purple-500/10 rounded-lg">
                                        <Users className="h-4 w-4 text-purple-400" />
                                    </div>
                                    <div>
                                        <h4 className="text-purple-300 font-medium mb-1">Contato Existente</h4>
                                        <p className="text-neutral-400 text-sm">
                                            Use dados de um contato já cadastrado. Campos faltantes podem ser preenchidos durante o processo.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Contact Selection */}
                        {scriptMode === 'contact' && (
                            <div className="mt-5">
                                <label className="block text-sm font-semibold text-white mb-2">
                                    Selecionar Contato
                                </label>
                                {loadingContacts ? (
                                    <div className="flex items-center gap-2 text-neutral-400 p-3 bg-neutral-800/30 rounded-lg border border-neutral-700/30">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Carregando contatos...
                                    </div>
                                ) : (
                                    <select
                                        value={selectedContactId}
                                        onChange={(e) => setSelectedContactId(e.target.value)}
                                        className="w-full px-4 py-3 bg-neutral-800/50 border border-neutral-700/50 rounded-lg text-white focus:outline-none focus:border-blue-500/50 focus:bg-neutral-800/70 transition-all"
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
                                    <div className="text-center py-6 bg-neutral-800/30 rounded-lg border border-neutral-700/30 mt-2">
                                        <Users className="h-8 w-8 text-neutral-500 mx-auto mb-2" />
                                        <p className="text-neutral-400 text-sm mb-2">Nenhum contato ativo encontrado</p>
                                        <Link href="/contacts" className="text-blue-400 hover:text-blue-300 text-sm font-medium">
                                            Criar primeiro contato →
                                        </Link>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* OpenAI Configuration Alert */}
                    {hasOpenAIKey === false && (
                        <div className="mb-6 p-4 bg-gradient-to-r from-amber-900/30 to-orange-900/30 border border-amber-700/50 rounded-xl">
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-amber-500/20 rounded-lg">
                                    <AlertTriangle className="h-5 w-5 text-amber-400" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-amber-300 font-semibold mb-1">
                                        Configuração Necessária
                                    </h3>
                                    <p className="text-amber-200/80 text-sm mb-3">
                                        Configure sua chave da API OpenAI nas configurações para gerar scripts.
                                    </p>
                                    <Link
                                        href="/settings"
                                        className="inline-flex items-center px-3 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm font-medium"
                                    >
                                        <Settings className="mr-2 h-4 w-4" />
                                        Configurar Agora
                                    </Link>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Error Alert */}
                    {error && (
                        <div className="mb-6 p-4 bg-gradient-to-r from-red-900/30 to-red-800/30 border border-red-700/50 rounded-xl">
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-red-500/20 rounded-lg">
                                    <AlertTriangle className="h-5 w-5 text-red-400" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-red-300 font-semibold mb-1">Erro ao Gerar Script</h3>
                                    <p className="text-red-200/80 text-sm">{error}</p>
                                </div>
                                <button
                                    onClick={() => setError(null)}
                                    className="text-red-400 hover:text-red-300 p-1"
                                >
                                    <span className="sr-only">Fechar</span>
                                    ×
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
                        {/* Form */}
                        <div className="rounded-xl p-5 border border-neutral-700/50 backdrop-blur-sm shadow-sm">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Prospect Data - Show based on mode */}
                                {scriptMode === 'manual' && (
                                    <div>
                                        <div className="mb-5">
                                            <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                                                <div className="p-1.5 bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-lg">
                                                    <User className="h-4 w-4 text-white" />
                                                </div>
                                                Dados do Prospect
                                            </h3>
                                            <p className="text-neutral-400 text-sm">Informações específicas para personalização</p>
                                        </div>

                                        {/* Check if prospect data is filled */}
                                        {prospectData.contactName && prospectData.companyName ? (
                                            <div className="bg-neutral-800/30 rounded-lg p-4 border border-neutral-700/30">
                                                <div className="flex items-center justify-between mb-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-emerald-500/20 rounded-lg">
                                                            <User className="h-4 w-4 text-emerald-400" />
                                                        </div>
                                                        <div>
                                                            <span className="text-white font-semibold">{prospectData.contactName}</span>
                                                            {prospectData.position && (
                                                                <span className="text-neutral-400 ml-2">• {prospectData.position}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowProspectModal(true)}
                                                        className="px-3 py-1.5 bg-neutral-700/70 hover:bg-neutral-700 text-white text-sm font-medium rounded-lg transition-all border border-neutral-600/50 hover:border-neutral-500/50"
                                                    >
                                                        <Edit className="h-3 w-3 mr-1 inline" />
                                                        Editar
                                                    </button>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-blue-500/20 rounded-lg">
                                                        <Target className="h-4 w-4 text-blue-400" />
                                                    </div>
                                                    <div className="text-neutral-300">
                                                        {prospectData.companyName}
                                                        {prospectData.niche && ` • ${prospectData.niche}`}
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => setShowProspectModal(true)}
                                                className="w-full p-6 bg-gradient-to-r from-emerald-900/20 to-emerald-800/10 border border-emerald-700/30 rounded-xl hover:from-emerald-900/30 hover:to-emerald-800/20 transition-all group"
                                            >
                                                <div className="flex items-center justify-center gap-3">
                                                    <div className="p-2 bg-emerald-500/20 rounded-lg group-hover:bg-emerald-500/30 transition-all">
                                                        <User className="h-5 w-5 text-emerald-400" />
                                                    </div>
                                                    <div className="text-center">
                                                        <h4 className="text-emerald-300 font-semibold mb-1">Adicionar Dados do Prospect</h4>
                                                        <p className="text-emerald-200/70 text-sm">Clique para preencher as informações</p>
                                                    </div>
                                                </div>
                                            </button>
                                        )}
                                    </div>
                                )}

                                {/* Generic Script Info */}
                                {scriptMode === 'generic' && (
                                    <div>
                                        <div className="mb-5">
                                            <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                                                <div className="p-1.5 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg">
                                                    <FileText className="h-4 w-4 text-white" />
                                                </div>
                                                Script Genérico
                                            </h3>
                                            <p className="text-neutral-400 text-sm">Template reutilizável com placeholders</p>
                                        </div>
                                        <div className="bg-gradient-to-r from-blue-900/20 to-blue-800/10 border border-blue-700/30 rounded-xl p-5">
                                            <div className="flex items-start gap-4">
                                                <div className="p-2 bg-blue-500/20 rounded-lg">
                                                    <Sparkles className="h-5 w-5 text-blue-400" />
                                                </div>
                                                <div>
                                                    <h4 className="text-blue-300 font-semibold mb-3">Como funciona?</h4>
                                                    <ul className="text-blue-200/90 text-sm space-y-2">
                                                        <li className="flex items-start gap-2">
                                                            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0"></span>
                                                            <span>O script será criado com placeholders como [Nome do Contato], [Empresa], etc.</span>
                                                        </li>
                                                        <li className="flex items-start gap-2">
                                                            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0"></span>
                                                            <span>Pode ser reutilizado para diferentes prospects</span>
                                                        </li>
                                                        <li className="flex items-start gap-2">
                                                            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0"></span>
                                                            <span>Ideal para criar templates de cold outreach, follow-up, etc.</span>
                                                        </li>
                                                        <li className="flex items-start gap-2">
                                                            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0"></span>
                                                            <span>Na hora de enviar, os placeholders serão substituídos pelos dados reais</span>
                                                        </li>
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Selected Contact Display */}
                                {scriptMode === 'contact' && selectedContactId && (
                                    <div>
                                        <div className="mb-5">
                                            <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                                                <div className="p-1.5 bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg">
                                                    <User className="h-4 w-4 text-white" />
                                                </div>
                                                Contato Selecionado
                                            </h3>
                                        </div>

                                        <div className="bg-neutral-800/30 rounded-lg p-4 border border-neutral-700/30">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-purple-500/20 rounded-lg">
                                                        <User className="h-4 w-4 text-purple-400" />
                                                    </div>
                                                    <div>
                                                        <span className="text-white font-semibold">{prospectData.contactName}</span>
                                                        {prospectData.position && (
                                                            <span className="text-neutral-400 ml-2">• {prospectData.position}</span>
                                                        )}
                                                    </div>
                                                </div>
                                                {contactMissingFields.length > 0 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowProspectModal(true)}
                                                        className="px-3 py-1.5 bg-amber-600/80 hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition-all"
                                                    >
                                                        <Edit className="h-3 w-3 mr-1 inline" />
                                                        Completar Dados
                                                    </button>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="p-2 bg-blue-500/20 rounded-lg">
                                                    <Target className="h-4 w-4 text-blue-400" />
                                                </div>
                                                <div className="text-neutral-300">
                                                    {prospectData.companyName}
                                                    {prospectData.niche && ` • ${prospectData.niche}`}
                                                </div>
                                            </div>
                                            {prospectData.email && (
                                                <div className="text-neutral-400 text-sm pl-11">
                                                    {prospectData.email}
                                                </div>
                                            )}

                                            {contactMissingFields.length > 0 && (
                                                <div className="mt-3 pt-3 border-t border-neutral-700/50">
                                                    <div className="flex items-center gap-2 text-amber-400 text-sm">
                                                        <AlertTriangle className="h-4 w-4" />
                                                        <span>
                                                            {contactMissingFields.length} campo{contactMissingFields.length > 1 ? 's' : ''} em branco
                                                            {contactMissingFields.length <= 3 ? ` (${contactMissingFields.slice(0, 3).map(field => {
                                                                const fieldNames: { [key: string]: string } = {
                                                                    niche: 'Nicho',
                                                                    painPoints: 'Pontos de Dor',
                                                                    previousInteraction: 'Interação Anterior',
                                                                    position: 'Cargo',
                                                                    website: 'Website',
                                                                    notes: 'Observações'
                                                                };
                                                                return fieldNames[field];
                                                            }).join(', ')})` : ''}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Email Configuration */}
                                <div>
                                    <div className="mb-5">
                                        <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                                            <div className="p-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg">
                                                <Settings className="h-4 w-4 text-white" />
                                            </div>
                                            Configurações do Email
                                        </h3>
                                        <p className="text-neutral-400 text-sm">Defina o tipo e estilo do email</p>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-neutral-300 mb-2">
                                                Tipo de Email
                                            </label>
                                            <select
                                                className="w-full px-4 py-3 bg-neutral-800/50 border border-neutral-700/50 rounded-lg text-white focus:outline-none focus:border-blue-500/50 focus:bg-neutral-800/70 transition-all"
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

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-neutral-300 mb-2">
                                                    Tom
                                                </label>
                                                <select
                                                    className="w-full px-4 py-3 bg-neutral-800/50 border border-neutral-700/50 rounded-lg text-white focus:outline-none focus:border-blue-500/50 focus:bg-neutral-800/70 transition-all"
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
                                                    className="w-full px-4 py-3 bg-neutral-800/50 border border-neutral-700/50 rounded-lg text-white focus:outline-none focus:border-blue-500/50 focus:bg-neutral-800/70 transition-all"
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
                                                className="w-full px-4 py-3 bg-neutral-800/50 border border-neutral-700/50 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500/50 focus:bg-neutral-800/70 transition-all"
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
                                    <div className="mb-5">
                                        <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                                            <div className="p-1.5 bg-gradient-to-r from-amber-600 to-orange-600 rounded-lg">
                                                <Zap className="h-4 w-4 text-white" />
                                            </div>
                                            Instruções Personalizadas
                                        </h3>
                                        <p className="text-neutral-400 text-sm">Oriente a IA para resultados mais específicos</p>
                                    </div>
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
                                                className="w-full px-4 py-3 bg-neutral-800/50 border border-neutral-700/50 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500/50 focus:bg-neutral-800/70 transition-all resize-none"
                                                placeholder="Ex: Este é um script para campanha de lançamento de produto. Foque em benefícios únicos e crie urgência. Use tom entusiasmado mas profissional. Mencione desconto por tempo limitado."
                                                value={customInstructions}
                                                onChange={(e) => setCustomInstructions(e.target.value)}
                                            />
                                        </div>

                                        {/* Exemplos de instruções */}
                                        <div className="bg-neutral-800/30 rounded-lg p-4 border border-neutral-700/30">
                                            <h4 className="text-sm font-semibold text-neutral-300 mb-3 flex items-center gap-2">
                                                <Sparkles className="h-4 w-4 text-amber-400" />
                                                Exemplos de instruções:
                                            </h4>
                                            <ul className="text-xs text-neutral-400 space-y-2">
                                                <li className="flex items-start gap-2">
                                                    <span className="w-1 h-1 bg-neutral-500 rounded-full mt-2 flex-shrink-0"></span>
                                                    <span>Script para follow-up após demo. Mencionar pontos específicos discutidos.</span>
                                                </li>
                                                <li className="flex items-start gap-2">
                                                    <span className="w-1 h-1 bg-neutral-500 rounded-full mt-2 flex-shrink-0"></span>
                                                    <span>Cold outreach para CEOs de startups. Tom casual, mencionar crescimento rápido.</span>
                                                </li>
                                                <li className="flex items-start gap-2">
                                                    <span className="w-1 h-1 bg-neutral-500 rounded-full mt-2 flex-shrink-0"></span>
                                                    <span>Reativação de leads frios. Criar senso de urgência com nova funcionalidade.</span>
                                                </li>
                                                <li className="flex items-start gap-2">
                                                    <span className="w-1 h-1 bg-neutral-500 rounded-full mt-2 flex-shrink-0"></span>
                                                    <span>Email de nurturing B2B. Educar sobre ROI, incluir case study.</span>
                                                </li>
                                            </ul>
                                        </div>

                                        {/* Variáveis Disponíveis */}
                                        <div className="bg-gradient-to-r from-blue-900/20 to-indigo-900/20 rounded-lg p-4 border border-blue-700/30">
                                            <h4 className="text-sm font-semibold text-blue-300 mb-3 flex items-center gap-2">
                                                <Target className="h-4 w-4 text-blue-400" />
                                                Variáveis para Personalização:
                                            </h4>
                                            <p className="text-blue-200/80 text-xs mb-4">
                                                Selecione as variáveis que deseja usar no script. Elas serão substituídas automaticamente pelos dados reais.
                                            </p>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                                                <div>
                                                    <h5 className="text-blue-200 font-medium mb-3 flex items-center justify-between">
                                                        <span>Suas Informações:</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const userVars = ['yourName', 'yourCompany', 'yourPosition', 'yourIndustry', 'yourPhone', 'yourWebsite', 'yourLocation'];
                                                                const isAllSelected = userVars.every(v => selectedVariables.user.includes(v));
                                                                setSelectedVariables(prev => ({
                                                                    ...prev,
                                                                    user: isAllSelected ? [] : userVars
                                                                }));
                                                            }}
                                                            className="text-blue-300 hover:text-blue-200 text-xs underline"
                                                        >
                                                            {selectedVariables.user.length === 7 ? 'Desmarcar todas' : 'Selecionar todas'}
                                                        </button>
                                                    </h5>
                                                    <div className="space-y-2">
                                                        {[
                                                            { key: 'yourName', label: 'Seu nome', value: userData.yourName },
                                                            { key: 'yourCompany', label: 'Sua empresa', value: userData.yourCompany },
                                                            { key: 'yourPosition', label: 'Seu cargo', value: userData.yourPosition },
                                                            { key: 'yourIndustry', label: 'Seu setor', value: userData.yourIndustry },
                                                            { key: 'yourPhone', label: 'Seu telefone', value: userData.yourPhone },
                                                            { key: 'yourWebsite', label: 'Seu website', value: userData.yourWebsite },
                                                            { key: 'yourLocation', label: 'Sua localização', value: userData.yourLocation }
                                                        ].map(variable => (
                                                            <label key={variable.key} className="flex items-center gap-2 cursor-pointer">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={selectedVariables.user.includes(variable.key)}
                                                                    onChange={(e) => {
                                                                        setSelectedVariables(prev => ({
                                                                            ...prev,
                                                                            user: e.target.checked
                                                                                ? [...prev.user, variable.key]
                                                                                : prev.user.filter(v => v !== variable.key)
                                                                        }));
                                                                    }}
                                                                    className="w-3 h-3 rounded border border-blue-500/50 bg-transparent checked:bg-blue-500 focus:ring-blue-500 focus:ring-1"
                                                                />
                                                                <div className="flex-1">
                                                                    <code className="text-blue-300">{'{{' + variable.key + '}}'}</code>
                                                                    <span className="text-blue-200/80 ml-1">- {variable.label}</span>
                                                                    {variable.value && (
                                                                        <div className="text-blue-200/60 text-xs mt-0.5 truncate">
                                                                            Valor: {variable.value}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </label>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div>
                                                    <h5 className="text-blue-200 font-medium mb-3 flex items-center justify-between">
                                                        <span>Informações do Contato:</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const contactVars = ['contactName', 'contactFirstName', 'contactEmail', 'contactPosition', 'companyName', 'companyWebsite', 'companyIndustry'];
                                                                const isAllSelected = contactVars.every(v => selectedVariables.contact.includes(v));
                                                                setSelectedVariables(prev => ({
                                                                    ...prev,
                                                                    contact: isAllSelected ? [] : contactVars
                                                                }));
                                                            }}
                                                            className="text-blue-300 hover:text-blue-200 text-xs underline"
                                                        >
                                                            {selectedVariables.contact.length === 7 ? 'Desmarcar todas' : 'Selecionar todas'}
                                                        </button>
                                                    </h5>
                                                    <div className="space-y-2">
                                                        {[
                                                            { key: 'contactName', label: 'Nome completo' },
                                                            { key: 'contactFirstName', label: 'Primeiro nome' },
                                                            { key: 'contactEmail', label: 'Email do contato' },
                                                            { key: 'contactPosition', label: 'Cargo do contato' },
                                                            { key: 'companyName', label: 'Nome da empresa' },
                                                            { key: 'companyWebsite', label: 'Website da empresa' },
                                                            { key: 'companyIndustry', label: 'Setor da empresa' }
                                                        ].map(variable => (
                                                            <label key={variable.key} className="flex items-center gap-2 cursor-pointer">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={selectedVariables.contact.includes(variable.key)}
                                                                    onChange={(e) => {
                                                                        setSelectedVariables(prev => ({
                                                                            ...prev,
                                                                            contact: e.target.checked
                                                                                ? [...prev.contact, variable.key]
                                                                                : prev.contact.filter(v => v !== variable.key)
                                                                        }));
                                                                    }}
                                                                    className="w-3 h-3 rounded border border-blue-500/50 bg-transparent checked:bg-blue-500 focus:ring-blue-500 focus:ring-1"
                                                                />
                                                                <div>
                                                                    <code className="text-blue-300">{'{{' + variable.key + '}}'}</code>
                                                                    <span className="text-blue-200/80 ml-1">- {variable.label}</span>
                                                                </div>
                                                            </label>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            {(selectedVariables.user.length > 0 || selectedVariables.contact.length > 0) && (
                                                <div className="mt-4 p-3 bg-blue-800/20 rounded-lg border border-blue-600/30">
                                                    <p className="text-blue-200 text-xs font-medium mb-2">
                                                        ✅ Variáveis selecionadas ({selectedVariables.user.length + selectedVariables.contact.length}):
                                                    </p>
                                                    <div className="flex flex-wrap gap-1">
                                                        {[...selectedVariables.user, ...selectedVariables.contact].map(variable => (
                                                            <span key={variable} className="inline-block px-2 py-1 bg-blue-600/30 text-blue-200 rounded text-xs">
                                                                {'{{' + variable + '}}'}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            <div className="mt-3 p-3 bg-blue-800/20 rounded-lg border border-blue-600/30">
                                                <p className="text-blue-200/80 text-xs">
                                                    <strong className="text-blue-200">Dica:</strong> As variáveis selecionadas serão incluídas automaticamente no prompt da IA.
                                                    {!userData.yourName && (
                                                        <span className="block mt-1">
                                                            Configure seus dados em <Link href="/settings" className="text-blue-300 hover:text-blue-200 underline">Configurações</Link> para melhores resultados.
                                                        </span>
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={isGenerating || hasOpenAIKey === false}
                                    className="w-full flex items-center justify-center px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                                >
                                    {isGenerating ? (
                                        <>
                                            <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                                            Gerando Script...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="mr-3 h-5 w-5" />
                                            Gerar Script com IA
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>

                        {/* Generated Script */}
                        <div className="rounded-xl p-5 border border-neutral-700/50 backdrop-blur-sm shadow-sm">
                            <div className="mb-5">
                                <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                                    <div className="p-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-lg">
                                        <FileText className="h-4 w-4 text-white" />
                                    </div>
                                    Script Gerado
                                </h3>
                                <p className="text-neutral-400 text-sm">Resultado personalizado com IA</p>
                            </div>

                            {generatedScript ? (
                                <div className="space-y-5">
                                    {/* Subject */}
                                    <div>
                                        <div className="flex items-center justify-between mb-3">
                                            <label className="text-sm font-semibold text-white flex items-center gap-2">
                                                <div className="p-1 bg-blue-500/20 rounded">
                                                    <Target className="h-3 w-3 text-blue-400" />
                                                </div>
                                                Assunto
                                                {isGenerating && generatedScript.subject === '' && (
                                                    <div className="flex items-center gap-1 ml-2">
                                                        <div className="w-1 h-1 bg-blue-400 rounded-full animate-pulse"></div>
                                                        <div className="w-1 h-1 bg-blue-400 rounded-full animate-pulse delay-100"></div>
                                                        <div className="w-1 h-1 bg-blue-400 rounded-full animate-pulse delay-200"></div>
                                                    </div>
                                                )}
                                            </label>
                                            {generatedScript.subject && (
                                                <button
                                                    onClick={() => copyToClipboard(generatedScript.subject)}
                                                    className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-700/50 rounded-lg transition-all"
                                                    title="Copiar assunto"
                                                >
                                                    <Copy className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={generatedScript.subject}
                                                onChange={(e) => setGeneratedScript({
                                                    ...generatedScript,
                                                    subject: e.target.value
                                                })}
                                                className={`w-full p-4 bg-gradient-to-r from-neutral-800/50 to-neutral-800/30 rounded-lg text-white border border-neutral-700/30 hover:border-neutral-600/50 focus:border-blue-500/50 focus:outline-none transition-all ${isGenerating && generatedScript.subject === '' ? 'animate-pulse' : ''
                                                    }`}
                                                placeholder={isGenerating ? "Gerando assunto..." : "Assunto do email..."}
                                                disabled={isGenerating && generatedScript.subject === ''}
                                            />
                                            {isGenerating && generatedScript.subject !== '' && (
                                                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Body */}
                                    <div>
                                        <div className="flex items-center justify-between mb-3">
                                            <label className="text-sm font-semibold text-white flex items-center gap-2">
                                                <div className="p-1 bg-emerald-500/20 rounded">
                                                    <FileText className="h-3 w-3 text-emerald-400" />
                                                </div>
                                                Corpo do Email
                                                {isGenerating && (
                                                    <div className="flex items-center gap-1 ml-2">
                                                        <div className="w-1 h-1 bg-emerald-400 rounded-full animate-pulse"></div>
                                                        <div className="w-1 h-1 bg-emerald-400 rounded-full animate-pulse delay-100"></div>
                                                        <div className="w-1 h-1 bg-emerald-400 rounded-full animate-pulse delay-200"></div>
                                                    </div>
                                                )}
                                            </label>
                                            {generatedScript.body && !isGenerating && (
                                                <button
                                                    onClick={() => copyToClipboard(generatedScript.body)}
                                                    className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-700/50 rounded-lg transition-all"
                                                    title="Copiar corpo"
                                                >
                                                    <Copy className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>
                                        <div className="relative">
                                            <textarea
                                                value={generatedScript.body}
                                                onChange={(e) => setGeneratedScript({
                                                    ...generatedScript,
                                                    body: e.target.value
                                                })}
                                                rows={12}
                                                className={`w-full p-4 bg-gradient-to-r from-neutral-800/50 to-neutral-800/30 rounded-lg text-white border border-neutral-700/30 hover:border-neutral-600/50 focus:border-blue-500/50 focus:outline-none transition-all resize-none ${isGenerating && generatedScript.body === '' ? 'animate-pulse' : ''
                                                    }`}
                                                placeholder={isGenerating ? "Gerando conteúdo do email..." : "Corpo do email..."}
                                                disabled={isGenerating && generatedScript.body === ''}
                                            />
                                            {isGenerating && generatedScript.body !== '' && (
                                                <div className="absolute right-3 bottom-3">
                                                    <div className="flex items-center gap-2 px-2 py-1 bg-emerald-500/20 rounded-lg">
                                                        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                                                        <span className="text-emerald-300 text-xs font-medium">Escrevendo...</span>
                                                    </div>
                                                </div>
                                            )}
                                            {isGenerating && generatedScript.body === '' && generatedScript.subject !== '' && (
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <div className="flex items-center gap-3 px-4 py-2 bg-neutral-900/80 rounded-lg backdrop-blur-sm">
                                                        <Loader2 className="h-4 w-4 text-emerald-400 animate-spin" />
                                                        <span className="text-emerald-300 text-sm font-medium">Preparando conteúdo...</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    {showSaveOptions && (
                                        <div className="space-y-3 pt-2">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <button
                                                    onClick={saveScript}
                                                    disabled={isSaving}
                                                    className="flex items-center justify-center px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-lg hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 disabled:opacity-50 shadow-lg hover:shadow-xl"
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
                                                    className="flex items-center justify-center px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 shadow-lg hover:shadow-xl"
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
                                                className="w-full flex items-center justify-center px-4 py-3 bg-neutral-700/70 hover:bg-neutral-700 text-white font-medium rounded-lg transition-all duration-200 border border-neutral-600/50 hover:border-neutral-500/50"
                                            >
                                                <Trash className="mr-2 h-4 w-4" />
                                                Limpar e Começar Novamente
                                            </button>
                                        </div>
                                    )}

                                    {/* Copy and Download Options */}
                                    <div className="bg-neutral-800/30 rounded-lg p-4 border border-neutral-700/30">
                                        <h4 className="text-sm font-semibold text-neutral-300 mb-3 flex items-center gap-2">
                                            <Download className="h-4 w-4 text-blue-400" />
                                            Ações do Script
                                        </h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <button
                                                onClick={() =>
                                                    copyToClipboard(
                                                        `Assunto: ${generatedScript.subject}\n\n${generatedScript.body}`
                                                    )
                                                }
                                                className="flex items-center justify-center px-4 py-2.5 bg-neutral-700/70 hover:bg-neutral-700 text-white font-medium rounded-lg transition-all border border-neutral-600/50 hover:border-neutral-500/50"
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
                                                className="flex items-center justify-center px-4 py-2.5 bg-neutral-700/70 hover:bg-neutral-700 text-white font-medium rounded-lg transition-all border border-neutral-600/50 hover:border-neutral-500/50"
                                            >
                                                <Download className="mr-2 h-4 w-4" />
                                                Download TXT
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center h-80 text-neutral-500">
                                    <div className="text-center">
                                        <div className="p-4 bg-neutral-800/30 rounded-full w-fit mx-auto mb-4">
                                            <Sparkles className="h-12 w-12 opacity-50" />
                                        </div>
                                        <h4 className="text-neutral-400 font-semibold mb-2">Pronto para gerar seu script</h4>
                                        <p className="text-sm text-neutral-500 max-w-sm">
                                            Preencha o formulário ao lado e clique em <span className="font-medium">Gerar Script com IA</span> para ver o resultado aqui.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Prospect Data Modal */}
                {showProspectModal && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                        <div className="bg-neutral-900 rounded-xl max-w-2xl w-full border border-neutral-700/50 shadow-2xl max-h-[90vh] overflow-y-auto">
                            <div className="p-6 border-b border-neutral-700/50">
                                <h2 className="text-xl font-bold text-white flex items-center gap-3">
                                    <div className="p-2 bg-emerald-500/20 rounded-lg">
                                        <User className="h-5 w-5 text-emerald-400" />
                                    </div>
                                    {scriptMode === 'manual' ? 'Dados do Prospect' : 'Completar Informações do Contato'}
                                </h2>
                                <p className="text-neutral-400 text-sm mt-2">
                                    {scriptMode === 'manual'
                                        ? 'Preencha as informações do prospect para personalizar o script'
                                        : 'Complete os campos em branco para melhorar a qualidade do script'
                                    }
                                </p>
                            </div>

                            <div className="p-6">
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-neutral-300 mb-2">
                                                Nome do Contato *
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                className="w-full px-4 py-3 bg-neutral-800/50 border border-neutral-700/50 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500/50 focus:bg-neutral-800/70 transition-all"
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
                                                className="w-full px-4 py-3 bg-neutral-800/50 border border-neutral-700/50 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500/50 focus:bg-neutral-800/70 transition-all"
                                                placeholder="Ex: TechCorp Solutions"
                                                value={prospectData.companyName}
                                                onChange={(e) =>
                                                    setProspectData({ ...prospectData, companyName: e.target.value })
                                                }
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-neutral-300 mb-2">
                                            Nicho/Setor *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            className="w-full px-4 py-3 bg-neutral-800/50 border border-neutral-700/50 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500/50 focus:bg-neutral-800/70 transition-all"
                                            placeholder="Ex: Tecnologia, Marketing, Saúde"
                                            value={prospectData.niche}
                                            onChange={(e) =>
                                                setProspectData({ ...prospectData, niche: e.target.value })
                                            }
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-neutral-300 mb-2">
                                                Cargo
                                            </label>
                                            <input
                                                type="text"
                                                className="w-full px-4 py-3 bg-neutral-800/50 border border-neutral-700/50 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500/50 focus:bg-neutral-800/70 transition-all"
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
                                                className="w-full px-4 py-3 bg-neutral-800/50 border border-neutral-700/50 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500/50 focus:bg-neutral-800/70 transition-all"
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
                                            className="w-full px-4 py-3 bg-neutral-800/50 border border-neutral-700/50 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500/50 focus:bg-neutral-800/70 transition-all resize-none"
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
                                            className="w-full px-4 py-3 bg-neutral-800/50 border border-neutral-700/50 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500/50 focus:bg-neutral-800/70 transition-all resize-none"
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
                                            className="w-full px-4 py-3 bg-neutral-800/50 border border-neutral-700/50 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500/50 focus:bg-neutral-800/70 transition-all resize-none"
                                            placeholder="Informações extras sobre o prospect ou contexto"
                                            value={prospectData.notes}
                                            onChange={(e) =>
                                                setProspectData({ ...prospectData, notes: e.target.value })
                                            }
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 border-t border-neutral-700/50 flex flex-col sm:flex-row items-center justify-end gap-3">
                                <button
                                    onClick={() => setShowProspectModal(false)}
                                    className="w-full sm:w-auto px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white font-medium rounded-lg transition-all border border-neutral-600/50 hover:border-neutral-500/50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={() => {
                                        setShowProspectModal(false);
                                        // Se é modo contato e tem campos alterados, perguntar se quer atualizar o contato
                                        if (scriptMode === 'contact' && selectedContactId && contactMissingFields.length > 0) {
                                            const hasChanges = checkForContactUpdates();
                                            if (hasChanges) {
                                                setUpdatedContactData(hasChanges);
                                                setShowContactUpdatePrompt(true);
                                            }
                                        }
                                    }}
                                    disabled={!prospectData.contactName || !prospectData.companyName || !prospectData.niche}
                                    className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold rounded-lg transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Salvar Informações
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Contact Update Confirmation Modal */}
                {showContactUpdatePrompt && updatedContactData && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                        <div className="bg-neutral-900 rounded-xl max-w-md w-full border border-neutral-700/50 shadow-2xl">
                            <div className="p-6 border-b border-neutral-700/50">
                                <h2 className="text-xl font-bold text-white flex items-center gap-3">
                                    <div className="p-2 bg-blue-500/20 rounded-lg">
                                        <Users className="h-5 w-5 text-blue-400" />
                                    </div>
                                    Atualizar Informações do Contato?
                                </h2>
                            </div>

                            <div className="p-6">
                                <div className="flex items-start gap-4 mb-6">
                                    <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
                                        <Users className="h-6 w-6 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-white font-medium mb-2">
                                            Você preencheu campos que estavam vazios no contato.
                                        </p>
                                        <p className="text-neutral-400 text-sm mb-4">
                                            Deseja salvar essas informações no contato <span className="font-semibold text-white">{prospectData.contactName}</span> para uso futuro?
                                        </p>

                                        <div className="bg-neutral-800/50 rounded-lg p-4 space-y-2 border border-neutral-700/30">
                                            <h4 className="text-white font-medium text-sm mb-3 flex items-center gap-2">
                                                <Sparkles className="h-4 w-4 text-blue-400" />
                                                Novas informações:
                                            </h4>
                                            {Object.entries(updatedContactData).map(([key, value]) => {
                                                const fieldNames: { [key: string]: string } = {
                                                    niche: 'Nicho',
                                                    painPoints: 'Pontos de Dor',
                                                    previousInteraction: 'Interação Anterior',
                                                    position: 'Cargo',
                                                    website: 'Website',
                                                    notes: 'Observações'
                                                };
                                                return (
                                                    <div key={key} className="text-sm flex justify-between">
                                                        <span className="text-neutral-400">{fieldNames[key]}:</span>
                                                        <span className="text-white ml-2 font-medium max-w-xs truncate">
                                                            {typeof value === 'string' && value.length > 30
                                                                ? `${value.substring(0, 30)}...`
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

                            <div className="p-6 border-t border-neutral-700/50 flex flex-col sm:flex-row items-center justify-end gap-3">
                                <button
                                    onClick={() => {
                                        setShowContactUpdatePrompt(false);
                                        setUpdatedContactData(null);
                                    }}
                                    className="w-full sm:w-auto px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white font-medium rounded-lg transition-all border border-neutral-600/50 hover:border-neutral-500/50"
                                >
                                    Não, obrigado
                                </button>
                                <button
                                    onClick={updateContactWithNewData}
                                    className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-lg transition-all shadow-lg hover:shadow-xl"
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