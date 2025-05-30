'use client';

import { useEffect, useState, useCallback } from 'react';
import MainLayout from '@/components/MainLayout';
import { List, Plus, Edit3, Trash2, Users, Eye, X, Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import Link from 'next/link';

interface MailingList {
    id: string;
    name: string;
    description?: string;
    color: string;
    createdAt: string;
    updatedAt: string;
    _count: {
        contacts: number;
    };
}

interface Contact {
    id: string;
    name: string;
    email: string;
    companyName: string;
}

const PREDEFINED_COLORS = [
    '#3b82f6', // blue
    '#ef4444', // red
    '#10b981', // green
    '#f59e0b', // yellow
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#06b6d4', // cyan
    '#84cc16', // lime
    '#f97316', // orange
    '#6366f1', // indigo
];

// Função para formatar números de telefone
const formatPhoneNumber = (phone: string): string => {
    if (!phone) return '';

    // Remove todos os caracteres não numéricos, exceto + no início
    let cleaned = phone.replace(/[^\d+]/g, '');

    // Se não tem +, assume que é número brasileiro
    if (!cleaned.startsWith('+')) {
        // Remove zeros à esquerda
        cleaned = cleaned.replace(/^0+/, '');

        // Se tem 11 dígitos, assume formato brasileiro com DDD
        if (cleaned.length === 11) {
            return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
        }
        // Se tem 10 dígitos, assume formato brasileiro com DDD (telefone fixo)
        else if (cleaned.length === 10) {
            return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
        }
        // Se tem 13 dígitos e começa com 55, assume brasileiro com código do país
        else if (cleaned.length === 13 && cleaned.startsWith('55')) {
            return `+55 (${cleaned.slice(2, 4)}) ${cleaned.slice(4, 9)}-${cleaned.slice(9)}`;
        }
        // Se tem 12 dígitos e começa com 55, assume brasileiro com código do país (fixo)
        else if (cleaned.length === 12 && cleaned.startsWith('55')) {
            return `+55 (${cleaned.slice(2, 4)}) ${cleaned.slice(4, 8)}-${cleaned.slice(8)}`;
        }
        // Para outros casos, adiciona código brasileiro
        else if (cleaned.length >= 8) {
            return `+55 ${cleaned}`;
        }
    } else {
        // Número internacional com código de país
        const countryPatterns = {
            '+1': { // EUA/Canadá
                pattern: /^\+1(\d{10})$/,
                format: (match: RegExpMatchArray) => `+1 (${match[1].slice(0, 3)}) ${match[1].slice(3, 6)}-${match[1].slice(6)}`
            },
            '+55': { // Brasil
                pattern: /^\+55(\d{2})(\d{8,9})$/,
                format: (match: RegExpMatchArray) => {
                    const ddd = match[1];
                    const number = match[2];
                    if (number.length === 9) {
                        return `+55 (${ddd}) ${number.slice(0, 5)}-${number.slice(5)}`;
                    } else {
                        return `+55 (${ddd}) ${number.slice(0, 4)}-${number.slice(4)}`;
                    }
                }
            },
            '+44': { // Reino Unido
                pattern: /^\+44(\d+)$/,
                format: (match: RegExpMatchArray) => `+44 ${match[1].replace(/(\d{4})(\d{6})/, '$1 $2')}`
            },
            '+49': { // Alemanha
                pattern: /^\+49(\d+)$/,
                format: (match: RegExpMatchArray) => `+49 ${match[1]}`
            },
            '+33': { // França
                pattern: /^\+33(\d+)$/,
                format: (match: RegExpMatchArray) => `+33 ${match[1].replace(/(\d{1})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5')}`
            },
            '+39': { // Itália
                pattern: /^\+39(\d+)$/,
                format: (match: RegExpMatchArray) => `+39 ${match[1]}`
            },
            '+81': { // Japão
                pattern: /^\+81(\d+)$/,
                format: (match: RegExpMatchArray) => `+81 ${match[1]}`
            },
            '+86': { // China
                pattern: /^\+86(\d+)$/,
                format: (match: RegExpMatchArray) => `+86 ${match[1]}`
            },
            '+91': { // Índia
                pattern: /^\+91(\d+)$/,
                format: (match: RegExpMatchArray) => `+91 ${match[1]}`
            },
            '+61': { // Austrália
                pattern: /^\+61(\d+)$/,
                format: (match: RegExpMatchArray) => `+61 ${match[1]}`
            },
            '+27': { // África do Sul
                pattern: /^\+27(\d+)$/,
                format: (match: RegExpMatchArray) => `+27 ${match[1]}`
            }
        };

        // Tenta encontrar o padrão correto
        for (const [code, config] of Object.entries(countryPatterns)) {
            if (cleaned.startsWith(code)) {
                const match = cleaned.match(config.pattern);
                if (match) {
                    return config.format(match);
                }
            }
        }

        // Se não encontrou padrão específico, tenta formatação genérica
        const genericMatch = cleaned.match(/^\+(\d{1,4})(\d+)$/);
        if (genericMatch) {
            const countryCode = genericMatch[1];
            const number = genericMatch[2];

            // Formata números longos em grupos
            if (number.length >= 8) {
                const formatted = number.replace(/(\d{2,4})(?=\d)/g, '$1 ');
                return `+${countryCode} ${formatted.trim()}`;
            }
            return `+${countryCode} ${number}`;
        }
    }

    // Retorna o número original se não conseguiu formatar
    return phone;
};

// Função para validar formato de telefone
const isValidPhoneNumber = (phone: string): boolean => {
    if (!phone) return true; // Telefone é opcional

    const cleaned = phone.replace(/[^\d+]/g, '');

    // Aceita números brasileiros (10-11 dígitos) ou internacionais com +
    if (cleaned.startsWith('+')) {
        return cleaned.length >= 8 && cleaned.length <= 18;
    } else {
        return cleaned.length >= 8 && cleaned.length <= 15;
    }
};

export default function MailingLists() {
    const [lists, setLists] = useState<MailingList[]>([]);
    const [loading, setLoading] = useState(true);
    const [showNewListModal, setShowNewListModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [editingList, setEditingList] = useState<MailingList | null>(null);
    const [selectedList, setSelectedList] = useState<MailingList | null>(null);
    const [listContacts, setListContacts] = useState<Contact[]>([]);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [deleting, setDeleting] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        color: '#3b82f6'
    });

    // Import states
    const [showImportModal, setShowImportModal] = useState(false);
    const [importData, setImportData] = useState<Record<string, string>[]>([]);
    const [importMapping, setImportMapping] = useState<{ [key: string]: string }>({});
    const [importStep, setImportStep] = useState<'upload' | 'mapping' | 'preview' | 'importing'>('upload');
    const [importResults, setImportResults] = useState<{
        success: number;
        errors: { row: number; error: string }[];
    } | null>(null);
    const [importing, setImporting] = useState(false);
    const [selectedListForImport, setSelectedListForImport] = useState<string>('');

    const fetchLists = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/mailing-lists');
            if (response.ok) {
                const data = await response.json();
                setLists(data.mailingLists);
            } else {
                setMessage({ type: 'error', text: 'Erro ao carregar listas' });
            }
        } catch (error) {
            console.error('Erro ao buscar listas:', error);
            setMessage({ type: 'error', text: 'Erro ao conectar com o servidor' });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchLists();
    }, [fetchLists]);

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            color: '#3b82f6'
        });
    };

    const openCreateModal = () => {
        resetForm();
        setShowNewListModal(true);
    };

    const openEditModal = (list: MailingList) => {
        setFormData({
            name: list.name,
            description: list.description || '',
            color: list.color
        });
        setEditingList(list);
        setShowEditModal(true);
    };

    const openViewModal = async (list: MailingList) => {
        setSelectedList(list);
        setShowViewModal(true);

        try {
            const response = await fetch(`/api/mailing-lists/${list.id}`);
            if (response.ok) {
                const data = await response.json();
                setListContacts(data.mailingList.contacts || []);
            }
        } catch (error) {
            console.error('Erro ao carregar contatos da lista:', error);
        }
    };

    const closeModals = () => {
        setShowNewListModal(false);
        setShowEditModal(false);
        setShowViewModal(false);
        setShowImportModal(false);
        setEditingList(null);
        setSelectedList(null);
        setListContacts([]);
        resetForm();
        resetImport();
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            setMessage({ type: 'error', text: 'Nome da lista é obrigatório' });
            return;
        }

        try {
            const response = await fetch('/api/mailing-lists', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                setMessage({ type: 'success', text: 'Lista criada com sucesso!' });
                closeModals();
                fetchLists();
            } else {
                const error = await response.json();
                setMessage({ type: 'error', text: error.error || 'Erro ao criar lista' });
            }
        } catch {
            setMessage({ type: 'error', text: 'Erro ao conectar com o servidor' });
        }
    };

    const handleEdit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!editingList || !formData.name.trim()) {
            setMessage({ type: 'error', text: 'Nome da lista é obrigatório' });
            return;
        }

        try {
            const response = await fetch(`/api/mailing-lists/${editingList.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                setMessage({ type: 'success', text: 'Lista atualizada com sucesso!' });
                closeModals();
                fetchLists();
            } else {
                const error = await response.json();
                setMessage({ type: 'error', text: error.error || 'Erro ao atualizar lista' });
            }
        } catch {
            setMessage({ type: 'error', text: 'Erro ao conectar com o servidor' });
        }
    };

    const handleDelete = async (list: MailingList) => {
        if (!confirm(`Tem certeza que deseja deletar a lista "${list.name}"? ${list._count.contacts} contatos serão desvinculados.`)) {
            return;
        }

        setDeleting(true);
        try {
            const response = await fetch(`/api/mailing-lists/${list.id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                const data = await response.json();
                setMessage({ type: 'success', text: data.message });
                fetchLists();
            } else {
                const error = await response.json();
                setMessage({ type: 'error', text: error.error || 'Erro ao deletar lista' });
            }
        } catch {
            setMessage({ type: 'error', text: 'Erro ao conectar com o servidor' });
        } finally {
            setDeleting(false);
        }
    };

    // Import functions
    const parseCSV = (text: string): Record<string, string>[] => {
        const lines = text.split('\n').filter(line => line.trim());
        if (lines.length === 0) return [];

        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        const data = [];

        for (let i = 1; i < lines.length; i++) {
            const values: string[] = [];
            let current = '';
            let inQuotes = false;

            for (let j = 0; j < lines[i].length; j++) {
                const char = lines[i][j];
                if (char === '"') {
                    inQuotes = !inQuotes;
                } else if (char === ',' && !inQuotes) {
                    values.push(current.trim());
                    current = '';
                } else {
                    current += char;
                }
            }
            values.push(current.trim());

            if (values.length === headers.length) {
                const row: Record<string, string> = {};
                headers.forEach((header, index) => {
                    row[header] = values[index] || '';
                });
                data.push(row);
            }
        }

        return data;
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.name.toLowerCase().endsWith('.csv')) {
            setMessage({ type: 'error', text: 'Por favor, selecione um arquivo CSV válido.' });
            return;
        }

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const text = e.target?.result as string;
                const data = parseCSV(text);

                if (data.length === 0) {
                    setMessage({ type: 'error', text: 'O arquivo CSV está vazio ou inválido.' });
                    return;
                }

                setImportData(data);

                // Configuração de mapeamento padrão
                const headers = Object.keys(data[0]);
                const defaultMapping: { [key: string]: string } = {};

                headers.forEach(header => {
                    const lowerHeader = header.toLowerCase();
                    if (lowerHeader.includes('nome') || lowerHeader.includes('name')) {
                        defaultMapping['name'] = header;
                    } else if (lowerHeader.includes('email')) {
                        defaultMapping['email'] = header;
                    } else if (lowerHeader.includes('telefone') || lowerHeader.includes('phone')) {
                        defaultMapping['phone'] = header;
                    } else if (lowerHeader.includes('cargo') || lowerHeader.includes('position') || lowerHeader.includes('título')) {
                        defaultMapping['position'] = header;
                    } else if (lowerHeader.includes('empresa') || lowerHeader.includes('company')) {
                        defaultMapping['companyName'] = header;
                    }
                });

                setImportMapping(defaultMapping);
                setImportStep('mapping');
            } catch {
                setMessage({ type: 'error', text: 'Erro ao processar o arquivo CSV.' });
            }
        };
        reader.readAsText(file);
    };

    const processImportWithList = async () => {
        if (!selectedListForImport) {
            setMessage({ type: 'error', text: 'Selecione uma lista para vincular os contatos' });
            return;
        }

        setImporting(true);
        let successCount = 0;
        const importErrors: { row: number; error: string }[] = [];

        for (let i = 0; i < importData.length; i++) {
            const row = importData[i];

            try {
                // Validar telefone se fornecido
                const phoneValue = row[importMapping.phone]?.trim() || '';
                if (phoneValue && !isValidPhoneNumber(phoneValue)) {
                    importErrors.push({
                        row: i + 1,
                        error: 'Formato de telefone inválido'
                    });
                    continue;
                }

                const contactData = {
                    name: row[importMapping.name]?.trim() || '',
                    email: row[importMapping.email]?.trim() || '',
                    companyName: row[importMapping.companyName]?.trim() || '',
                    position: row[importMapping.position]?.trim() || '',
                    phone: formatPhoneNumber(phoneValue),
                    mailingListId: selectedListForImport,
                    isActive: true
                };

                const response = await fetch('/api/contacts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(contactData),
                });

                if (response.ok) {
                    successCount++;
                } else {
                    const error = await response.json();
                    importErrors.push({
                        row: i + 1,
                        error: error.error || 'Erro ao criar contato'
                    });
                }
            } catch {
                importErrors.push({
                    row: i + 1,
                    error: 'Erro de conexão'
                });
            }
        }

        setImportResults({ success: successCount, errors: importErrors });
        setImporting(false);

        if (successCount > 0) {
            fetchLists(); // Recarregar listas para atualizar contadores
        }
    };

    const resetImport = () => {
        setImportData([]);
        setImportMapping({});
        setImportStep('upload');
        setImportResults(null);
        setImporting(false);
        setSelectedListForImport('');
    };

    return (
        <MainLayout>
            <div className="p-8">
                <div className="max-w-6xl mx-auto">
                    {/* Header */}
                    <div className="mb-8 flex items-center justify-between">
                        <div>
                            {/* Submenu */}
                            <nav className="flex items-center gap-4 mb-4">
                                <Link
                                    href="/contacts"
                                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                                >
                                    <Users className="h-4 w-4" />
                                    Todos os Contatos
                                </Link>
                                <Link
                                    href="/contacts/lists"
                                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white text-black transition-colors"
                                >
                                    <List className="h-4 w-4" />
                                    Listas de E-mail
                                </Link>
                            </nav>

                            <h1 className="text-3xl font-bold text-white mb-2">Listas de E-mail</h1>
                            <div className="flex items-center gap-4">
                                <p className="text-neutral-400">
                                    Organize seus contatos em listas temáticas para campanhas direcionadas
                                </p>
                                <div className="flex items-center gap-2 px-3 py-1 bg-neutral-800 rounded-full border border-neutral-700">
                                    <List className="h-4 w-4 text-neutral-400" />
                                    <span className="text-sm text-neutral-300 font-medium">
                                        {lists.length} lista(s)
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowImportModal(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                            >
                                <Upload className="h-4 w-4" />
                                Importar e Criar Lista
                            </button>
                            <button
                                onClick={openCreateModal}
                                className="flex items-center gap-2 px-4 py-2 bg-white text-black font-medium rounded-lg hover:bg-neutral-200 transition-colors cursor-pointer"
                            >
                                <Plus className="h-4 w-4" />
                                Nova Lista
                            </button>
                        </div>
                    </div>

                    {/* Message */}
                    {message && (
                        <div className={`mb-6 p-4 rounded-lg ${message.type === 'success'
                            ? 'bg-green-900/50 border border-green-700 text-green-300'
                            : 'bg-red-900/50 border border-red-700 text-red-300'
                            }`}>
                            {message.text}
                            <button
                                onClick={() => setMessage(null)}
                                className="float-right text-current hover:opacity-70 cursor-pointer"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    )}

                    {/* Lists Grid */}
                    {loading ? (
                        <div className="bg-neutral-gradient rounded-lg p-12 border border-neutral-800 text-center">
                            <div className="text-neutral-400">Carregando listas...</div>
                        </div>
                    ) : lists.length === 0 ? (
                        <div className="bg-neutral-gradient rounded-lg p-12 border border-neutral-800 text-center">
                            <List className="h-16 w-16 text-neutral-500 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-white mb-2">
                                Nenhuma lista criada
                            </h3>
                            <p className="text-neutral-400 mb-6">
                                Comece criando sua primeira lista para organizar seus contatos
                            </p>
                            <button
                                onClick={openCreateModal}
                                className="inline-flex items-center px-6 py-3 bg-white text-black font-medium rounded-lg hover:bg-neutral-200 transition-colors cursor-pointer"
                            >
                                Criar Primeira Lista
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {lists.map((list) => (
                                <div
                                    key={list.id}
                                    className="bg-neutral-gradient rounded-lg p-6 border border-neutral-800 hover:border-neutral-700 transition-all duration-200"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-4 h-4 rounded-full flex-shrink-0"
                                                style={{ backgroundColor: list.color }}
                                            />
                                            <h3 className="text-lg font-semibold text-white truncate">
                                                {list.name}
                                            </h3>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => openViewModal(list)}
                                                className="p-1.5 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                                                title="Ver contatos"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => openEditModal(list)}
                                                className="p-1.5 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                                                title="Editar lista"
                                            >
                                                <Edit3 className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(list)}
                                                disabled={deleting}
                                                className="p-1.5 text-neutral-400 hover:text-red-400 transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                                                title="Deletar lista"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>

                                    {list.description && (
                                        <p className="text-neutral-300 text-sm mb-4 line-clamp-2">
                                            {list.description}
                                        </p>
                                    )}

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-sm text-neutral-400">
                                            <Users className="h-4 w-4" />
                                            <span>
                                                {list._count.contacts} contato{list._count.contacts !== 1 ? 's' : ''}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => openViewModal(list)}
                                            className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors cursor-pointer"
                                        >
                                            Ver detalhes
                                        </button>
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-neutral-700">
                                        <div className="text-xs text-neutral-500">
                                            Criada em {new Date(list.createdAt).toLocaleDateString('pt-BR')}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Create Modal */}
                    {showNewListModal && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                            <div className="bg-neutral-900 rounded-lg max-w-md w-full border border-neutral-700">
                                <div className="p-6 border-b border-neutral-700">
                                    <h2 className="text-xl font-bold text-white">Nova Lista</h2>
                                </div>

                                <form onSubmit={handleCreate} className="p-6 space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-white mb-2">
                                            Nome da Lista *
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                            className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-white cursor-text"
                                            placeholder="Ex: Prospects Tecnologia"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-white mb-2">
                                            Descrição
                                        </label>
                                        <textarea
                                            value={formData.description}
                                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                            className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-white cursor-text h-20 resize-none"
                                            placeholder="Descreva o propósito desta lista..."
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-white mb-2">
                                            Cor da Lista
                                        </label>
                                        <div className="flex gap-2 flex-wrap">
                                            {PREDEFINED_COLORS.map((color) => (
                                                <button
                                                    key={color}
                                                    type="button"
                                                    onClick={() => setFormData(prev => ({ ...prev, color }))}
                                                    className={`w-8 h-8 rounded-full border-2 transition-all ${formData.color === color
                                                        ? 'border-white scale-110'
                                                        : 'border-neutral-600 hover:border-neutral-500'
                                                        }`}
                                                    style={{ backgroundColor: color }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </form>

                                <div className="p-6 border-t border-neutral-700 flex items-center justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={closeModals}
                                        className="px-4 py-2 bg-neutral-800 text-white rounded-lg hover:bg-neutral-700 transition-colors border border-neutral-600 cursor-pointer"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        onClick={handleCreate}
                                        className="px-4 py-2 bg-white text-black rounded-lg hover:bg-neutral-200 transition-colors cursor-pointer"
                                    >
                                        Criar Lista
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Edit Modal */}
                    {showEditModal && editingList && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                            <div className="bg-neutral-900 rounded-lg max-w-md w-full border border-neutral-700">
                                <div className="p-6 border-b border-neutral-700">
                                    <h2 className="text-xl font-bold text-white">Editar Lista</h2>
                                </div>

                                <form onSubmit={handleEdit} className="p-6 space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-white mb-2">
                                            Nome da Lista *
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                            className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-white cursor-text"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-white mb-2">
                                            Descrição
                                        </label>
                                        <textarea
                                            value={formData.description}
                                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                            className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-white cursor-text h-20 resize-none"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-white mb-2">
                                            Cor da Lista
                                        </label>
                                        <div className="flex gap-2 flex-wrap">
                                            {PREDEFINED_COLORS.map((color) => (
                                                <button
                                                    key={color}
                                                    type="button"
                                                    onClick={() => setFormData(prev => ({ ...prev, color }))}
                                                    className={`w-8 h-8 rounded-full border-2 transition-all ${formData.color === color
                                                        ? 'border-white scale-110'
                                                        : 'border-neutral-600 hover:border-neutral-500'
                                                        }`}
                                                    style={{ backgroundColor: color }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </form>

                                <div className="p-6 border-t border-neutral-700 flex items-center justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={closeModals}
                                        className="px-4 py-2 bg-neutral-800 text-white rounded-lg hover:bg-neutral-700 transition-colors border border-neutral-600 cursor-pointer"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        onClick={handleEdit}
                                        className="px-4 py-2 bg-white text-black rounded-lg hover:bg-neutral-200 transition-colors cursor-pointer"
                                    >
                                        Salvar Alterações
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* View Modal */}
                    {showViewModal && selectedList && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                            <div className="bg-neutral-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden border border-neutral-700">
                                <div className="p-6 border-b border-neutral-700 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-6 h-6 rounded-full"
                                            style={{ backgroundColor: selectedList.color }}
                                        />
                                        <div>
                                            <h2 className="text-xl font-bold text-white">{selectedList.name}</h2>
                                            {selectedList.description && (
                                                <p className="text-neutral-400 text-sm">{selectedList.description}</p>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={closeModals}
                                        className="text-neutral-400 hover:text-white transition-colors cursor-pointer"
                                    >
                                        <X className="h-6 w-6" />
                                    </button>
                                </div>

                                <div className="p-6 overflow-y-auto max-h-[70vh]">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                            <Users className="h-5 w-5 text-blue-400" />
                                            Contatos da Lista ({listContacts.length})
                                        </h3>
                                        <Link
                                            href={`/contacts?list=${selectedList.id}`}
                                            className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
                                        >
                                            Ver todos os contatos
                                        </Link>
                                    </div>

                                    {listContacts.length === 0 ? (
                                        <div className="text-center py-8">
                                            <Users className="h-12 w-12 text-neutral-500 mx-auto mb-4" />
                                            <p className="text-neutral-400">Esta lista ainda não possui contatos</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {listContacts.map((contact) => (
                                                <div
                                                    key={contact.id}
                                                    className="bg-neutral-800/50 rounded-lg p-3 flex items-center justify-between"
                                                >
                                                    <div>
                                                        <h4 className="text-white font-medium">{contact.name}</h4>
                                                        <p className="text-neutral-400 text-sm">{contact.email}</p>
                                                        <p className="text-neutral-500 text-xs">{contact.companyName}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Import Modal */}
                    {showImportModal && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                            <div className="bg-neutral-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden border border-neutral-700">
                                <div className="p-6 border-b border-neutral-700 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Upload className="h-6 w-6 text-blue-400" />
                                        <h2 className="text-xl font-bold text-white">
                                            Importar e Criar Lista
                                        </h2>
                                    </div>
                                    <button
                                        onClick={closeModals}
                                        className="text-neutral-400 hover:text-white transition-colors cursor-pointer"
                                    >
                                        <X className="h-6 w-6" />
                                    </button>
                                </div>

                                <div className="p-6 overflow-y-auto max-h-[70vh]">
                                    {/* Step 1: Upload */}
                                    {importStep === 'upload' && (
                                        <div className="space-y-6">
                                            <div className="text-center">
                                                <FileText className="h-16 w-16 text-neutral-500 mx-auto mb-4" />
                                                <h3 className="text-lg font-semibold text-white mb-2">
                                                    Selecione um arquivo CSV
                                                </h3>
                                                <p className="text-neutral-400 mb-6">
                                                    Importe contatos e vincule-os a uma lista nova ou existente
                                                </p>
                                            </div>

                                            <div className="border-2 border-dashed border-neutral-600 rounded-lg p-8 text-center hover:border-neutral-500 transition-colors">
                                                <input
                                                    type="file"
                                                    accept=".csv"
                                                    onChange={handleFileUpload}
                                                    className="hidden"
                                                    id="csv-upload-list"
                                                />
                                                <label
                                                    htmlFor="csv-upload-list"
                                                    className="cursor-pointer block"
                                                >
                                                    <Upload className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
                                                    <p className="text-white font-medium mb-2">
                                                        Clique para selecionar ou arraste o arquivo aqui
                                                    </p>
                                                    <p className="text-neutral-400 text-sm">
                                                        Apenas arquivos .csv são aceitos
                                                    </p>
                                                </label>
                                            </div>
                                        </div>
                                    )}

                                    {/* Step 2: Mapping + List Selection */}
                                    {importStep === 'mapping' && importData.length > 0 && (
                                        <div className="space-y-6">
                                            <div>
                                                <h3 className="text-lg font-semibold text-white mb-2">
                                                    Configurações de Importação
                                                </h3>
                                                <p className="text-neutral-400 mb-4">
                                                    Encontramos {importData.length} registros. Configure os campos e selecione uma lista:
                                                </p>
                                            </div>

                                            {/* List Selection */}
                                            <div className="bg-neutral-800/50 rounded-lg p-4">
                                                <h4 className="text-white font-medium mb-3">Lista de Destino</h4>
                                                <select
                                                    value={selectedListForImport}
                                                    onChange={(e) => setSelectedListForImport(e.target.value)}
                                                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:border-white cursor-pointer"
                                                    required
                                                >
                                                    <option value="">Selecione uma lista existente</option>
                                                    {lists.map(list => (
                                                        <option key={list.id} value={list.id}>
                                                            {list.name} ({list._count.contacts} contatos)
                                                        </option>
                                                    ))}
                                                </select>
                                                <p className="text-neutral-400 text-sm mt-2">
                                                    Os contatos importados serão adicionados à lista selecionada
                                                </p>
                                            </div>

                                            {/* Field Mapping */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                                                {[
                                                    { key: 'name', label: 'Nome *', required: true },
                                                    { key: 'email', label: 'Email *', required: true },
                                                    { key: 'companyName', label: 'Empresa *', required: true },
                                                    { key: 'position', label: 'Cargo', required: false },
                                                    { key: 'phone', label: 'Telefone', required: false },
                                                ].map((field) => (
                                                    <div key={field.key}>
                                                        <label className="block text-sm font-medium text-white mb-2">
                                                            {field.label}
                                                        </label>
                                                        <select
                                                            value={importMapping[field.key] || ''}
                                                            onChange={(e) => setImportMapping(prev => ({
                                                                ...prev,
                                                                [field.key]: e.target.value
                                                            }))}
                                                            className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:border-white cursor-pointer"
                                                            required={field.required}
                                                        >
                                                            <option value="">Selecione uma coluna</option>
                                                            {Object.keys(importData[0]).map(header => (
                                                                <option key={header} value={header}>
                                                                    {header}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Preview */}
                                            {importMapping.name && importMapping.email && importMapping.companyName && selectedListForImport && (
                                                <div>
                                                    <h4 className="text-white font-medium mb-3">Preview (primeiros 3 registros):</h4>
                                                    <div className="bg-neutral-800 rounded-lg p-4 space-y-2">
                                                        {importData.slice(0, 3).map((row, index) => (
                                                            <div key={index} className="text-sm text-neutral-300 border-b border-neutral-700 pb-2 last:border-b-0">
                                                                <p><strong>Nome:</strong> {row[importMapping.name] || 'N/A'}</p>
                                                                <p><strong>Email:</strong> {row[importMapping.email] || 'N/A'}</p>
                                                                <p><strong>Empresa:</strong> {row[importMapping.companyName] || 'N/A'}</p>
                                                                {importMapping.position && row[importMapping.position] && (
                                                                    <p><strong>Cargo:</strong> {row[importMapping.position]}</p>
                                                                )}
                                                                {importMapping.phone && row[importMapping.phone] && (
                                                                    <p><strong>Telefone:</strong> {formatPhoneNumber(row[importMapping.phone])}</p>
                                                                )}
                                                                <p><strong>Lista:</strong> {lists.find(l => l.id === selectedListForImport)?.name}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Step 3: Results */}
                                    {importResults && (
                                        <div className="space-y-6">
                                            <div className="text-center">
                                                {importResults.success > 0 ? (
                                                    <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-4" />
                                                ) : (
                                                    <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
                                                )}
                                                <h3 className="text-lg font-semibold text-white mb-2">
                                                    Importação Concluída
                                                </h3>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="bg-green-900/20 border border-green-700 rounded-lg p-4">
                                                    <h4 className="text-green-300 font-medium mb-2">Sucesso</h4>
                                                    <p className="text-green-200 text-2xl font-bold">
                                                        {importResults.success}
                                                    </p>
                                                    <p className="text-green-300 text-sm">
                                                        contatos importados
                                                    </p>
                                                </div>
                                                <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
                                                    <h4 className="text-red-300 font-medium mb-2">Erros</h4>
                                                    <p className="text-red-200 text-2xl font-bold">
                                                        {importResults.errors.length}
                                                    </p>
                                                    <p className="text-red-300 text-sm">
                                                        registros com erro
                                                    </p>
                                                </div>
                                            </div>

                                            {importResults.errors.length > 0 && (
                                                <div>
                                                    <h4 className="text-white font-medium mb-3">Detalhes dos Erros:</h4>
                                                    <div className="bg-neutral-800 rounded-lg p-4 max-h-40 overflow-y-auto">
                                                        {importResults.errors.map((error, index) => (
                                                            <div key={index} className="text-sm text-red-300 mb-1">
                                                                Linha {error.row}: {error.error}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="p-6 border-t border-neutral-700 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        {importStep === 'mapping' && (
                                            <button
                                                onClick={() => setImportStep('upload')}
                                                className="px-4 py-2 bg-neutral-800 text-white rounded-lg hover:bg-neutral-700 transition-colors border border-neutral-600 cursor-pointer"
                                            >
                                                Voltar
                                            </button>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={closeModals}
                                            className="px-4 py-2 bg-neutral-800 text-white rounded-lg hover:bg-neutral-700 transition-colors border border-neutral-600 cursor-pointer"
                                        >
                                            {importResults ? 'Fechar' : 'Cancelar'}
                                        </button>
                                        {importStep === 'mapping' && importMapping.name && importMapping.email && importMapping.companyName && selectedListForImport && (
                                            <button
                                                onClick={processImportWithList}
                                                disabled={importing}
                                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                                            >
                                                {importing ? 'Importando...' : `Importar ${importData.length} Contatos`}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </MainLayout>
    );
}