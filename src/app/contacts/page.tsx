'use client';

import { useState, useCallback, useEffect } from 'react';
import MainLayout from '@/components/MainLayout';
import ContactItem from '@/components/ContactItem';
import ImportCSVModal from '@/components/ImportCSVModal';
import { Search, Filter, Users, Eye, Trash2, Plus, Edit3, Check, X, Upload, List } from 'lucide-react';
import Link from 'next/link';

interface MailingList {
    id: string;
    name: string;
    color: string;
}

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
    mailingListId?: string;
    mailingList?: MailingList;
    createdAt: string;
    updatedAt: string;
}

const CustomCheckbox = ({
    checked,
    onChange,
    className = "",
    label
}: {
    checked: boolean;
    onChange: () => void;
    className?: string;
    label?: string;
}) => {
    return (
        <label className={`flex items-center cursor-pointer ${className}`}>
            <div className="relative">
                <input
                    type="checkbox"
                    checked={checked}
                    onChange={onChange}
                    className="sr-only"
                />
                <div className={`w-4 h-4 rounded border-2 transition-all duration-200 ${checked
                    ? 'bg-blue-600 border-blue-600'
                    : 'bg-neutral-800 border-neutral-600 hover:border-neutral-500'
                    }`}>
                    {checked && (
                        <Check className="w-3 h-3 text-white absolute top-0.5 left-0.5 transform scale-75" />
                    )}
                </div>
            </div>
            {label && (
                <span className="ml-2 text-neutral-300 text-sm select-none">
                    {label}
                </span>
            )}
        </label>
    );
};

export default function Contacts() {
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [listFilter, setListFilter] = useState<string>('all');
    const [mailingLists, setMailingLists] = useState<MailingList[]>([]);
    const [showNewContactModal, setShowNewContactModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingContact, setEditingContact] = useState<Contact | null>(null);
    const [showImportModal, setShowImportModal] = useState(false);

    const [newContact, setNewContact] = useState<Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>>({
        name: '',
        email: '',
        phone: '',
        position: '',
        companyName: '',
        website: '',
        niche: '',
        painPoints: '',
        previousInteraction: '',
        notes: '',
        isActive: true,
        mailingListId: undefined,
    });

    // Modal states
    const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

    // Selection states
    const [selectAll, setSelectAll] = useState(false);

    // UI states
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [deleting, setDeleting] = useState(false);

    // Confirmation modal states
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmAction, setConfirmAction] = useState<{
        type: 'single' | 'multiple';
        contactId?: string;
        count?: number;
        onConfirm: () => void;
    } | null>(null);

    // Função para gerar cor do avatar baseada no nome
    const getAvatarColor = (name: string) => {
        const colors = [
            'bg-red-500',
            'bg-blue-500',
            'bg-green-500',
            'bg-yellow-500',
            'bg-purple-500',
            'bg-pink-500',
            'bg-indigo-500',
            'bg-orange-500',
            'bg-teal-500',
            'bg-cyan-500',
            'bg-emerald-500',
            'bg-violet-500',
            'bg-rose-500',
            'bg-amber-500',
            'bg-lime-500',
            'bg-sky-500'
        ];

        // Gera hash simples baseado no nome
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            const char = name.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Converte para 32bit integer
        }

        // Usa o hash para selecionar uma cor
        const index = Math.abs(hash) % colors.length;
        return colors[index];
    };

    // Função para obter as iniciais do nome
    const getInitials = (name: string) => {
        const words = name.trim().split(' ');
        if (words.length >= 2) {
            return (words[0][0] + words[words.length - 1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

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

    const fetchContacts = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: currentPage.toString(),
                limit: '999999',
                ...(searchTerm && { search: searchTerm }),
                ...(statusFilter !== 'all' && { isActive: (statusFilter === 'active').toString() }),
                ...(listFilter !== 'all' && { list: listFilter }),
            });

            const response = await fetch(`/api/contacts?${params}`);
            if (response.ok) {
                const data = await response.json();
                setContacts(data.contacts);
                setTotalPages(data.pages);
                setSelectedContacts(new Set());
                setSelectAll(false);
            }
        } catch (error) {
            console.error('Erro ao buscar contatos:', error);
            setMessage({ type: 'error', text: 'Erro ao carregar contatos' });
        } finally {
            setLoading(false);
        }
    }, [currentPage, searchTerm, statusFilter, listFilter]);

    const fetchMailingLists = useCallback(async () => {
        try {
            const response = await fetch('/api/mailing-lists');
            if (response.ok) {
                const data = await response.json();
                setMailingLists(data.mailingLists);
            }
        } catch (error) {
            console.error('Erro ao buscar listas:', error);
        }
    }, []);

    useEffect(() => {
        fetchContacts();
        fetchMailingLists();
    }, [fetchContacts, fetchMailingLists]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setCurrentPage(1);
        fetchContacts();
    };

    const openViewModal = async (contactId: string) => {
        try {
            const response = await fetch(`/api/contacts/${contactId}`);
            if (response.ok) {
                const contact = await response.json();
                setSelectedContact(contact);
                setEditingContact(contact);

                // Carregar dados do contato no formulário de edição
                setNewContact({
                    name: contact.name,
                    email: contact.email,
                    phone: contact.phone || '',
                    position: contact.position || '',
                    companyName: contact.companyName,
                    website: contact.website || '',
                    niche: contact.niche || '',
                    painPoints: contact.painPoints || '',
                    previousInteraction: contact.previousInteraction || '',
                    notes: contact.notes || '',
                    isActive: contact.isActive,
                    mailingListId: contact.mailingListId || undefined,
                });

                setShowEditModal(true);
            } else {
                setMessage({ type: 'error', text: 'Erro ao carregar contato' });
            }
        } catch {
            setMessage({ type: 'error', text: 'Erro ao carregar contato' });
        }
    };

    const openCreateModal = () => {
        setNewContact({
            name: '',
            email: '',
            phone: '',
            position: '',
            companyName: '',
            website: '',
            niche: '',
            painPoints: '',
            previousInteraction: '',
            notes: '',
            isActive: true,
            mailingListId: undefined,
        });
        setShowNewContactModal(true);
    };

    const closeModals = () => {
        setShowNewContactModal(false);
        setShowEditModal(false);
        setSelectedContact(null);
        setEditingContact(null);
    };

    // Selection functions
    const toggleSelectContact = (contactId: string) => {
        const newSelected = new Set(selectedContacts);
        if (newSelected.has(contactId)) {
            newSelected.delete(contactId);
        } else {
            newSelected.add(contactId);
        }
        setSelectedContacts(newSelected);
        setSelectAll(newSelected.size === contacts.length);
    };

    const toggleSelectAll = () => {
        if (selectAll) {
            setSelectedContacts(new Set());
        } else {
            setSelectedContacts(new Set(contacts.map(contact => contact.id)));
        }
        setSelectAll(!selectAll);
    };

    // Delete functions
    const openConfirmModal = (type: 'single' | 'multiple', contactId?: string, count?: number) => {
        const actualDeleteSingle = async () => {
            setDeleting(true);
            try {
                const response = await fetch(`/api/contacts/${contactId}`, {
                    method: 'DELETE',
                });

                if (response.ok) {
                    setMessage({ type: 'success', text: 'Contato deletado com sucesso!' });
                    fetchContacts();
                    if (selectedContact?.id === contactId) {
                        closeModals();
                    }
                } else {
                    setMessage({ type: 'error', text: 'Erro ao deletar contato' });
                }
            } catch {
                setMessage({ type: 'error', text: 'Erro ao conectar com o servidor' });
            } finally {
                setDeleting(false);
                setShowConfirmModal(false);
                setConfirmAction(null);
            }
        };

        const actualDeleteMultiple = async () => {
            setDeleting(true);
            try {
                const response = await fetch('/api/contacts', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ids: Array.from(selectedContacts) }),
                });

                if (response.ok) {
                    const data = await response.json();
                    setMessage({ type: 'success', text: data.message });
                    fetchContacts();
                } else {
                    setMessage({ type: 'error', text: 'Erro ao deletar contatos' });
                }
            } catch {
                setMessage({ type: 'error', text: 'Erro ao conectar com o servidor' });
            } finally {
                setDeleting(false);
                setShowConfirmModal(false);
                setConfirmAction(null);
            }
        };

        setConfirmAction({
            type,
            contactId,
            count,
            onConfirm: type === 'single' ? actualDeleteSingle : actualDeleteMultiple
        });
        setShowConfirmModal(true);
    };

    const deleteContact = (contactId: string) => {
        openConfirmModal('single', contactId);
    };

    const deleteSelectedContacts = () => {
        if (selectedContacts.size === 0) return;
        const count = selectedContacts.size;
        openConfirmModal('multiple', undefined, count);
    };

    // Form submission functions
    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newContact.name || !newContact.email || !newContact.companyName) {
            setMessage({ type: 'error', text: 'Nome, email e empresa são obrigatórios' });
            return;
        }

        if (newContact.phone && !isValidPhoneNumber(newContact.phone)) {
            setMessage({ type: 'error', text: 'Formato de telefone inválido' });
            return;
        }

        try {
            const dataToSend = {
                ...newContact,
                phone: formatPhoneNumber(newContact.phone || '')
            };

            const response = await fetch('/api/contacts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dataToSend),
            });

            if (response.ok) {
                setMessage({ type: 'success', text: 'Contato criado com sucesso!' });
                closeModals();
                fetchContacts();
            } else {
                const error = await response.json();
                setMessage({ type: 'error', text: error.error || 'Erro ao criar contato' });
            }
        } catch {
            setMessage({ type: 'error', text: 'Erro ao conectar com o servidor' });
        }
    };

    const handleEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingContact || !newContact.name || !newContact.email || !newContact.companyName) {
            setMessage({ type: 'error', text: 'Nome, email e empresa são obrigatórios' });
            return;
        }

        if (newContact.phone && !isValidPhoneNumber(newContact.phone)) {
            setMessage({ type: 'error', text: 'Formato de telefone inválido' });
            return;
        }

        try {
            const dataToSend = {
                ...newContact,
                phone: formatPhoneNumber(newContact.phone || '')
            };

            const response = await fetch(`/api/contacts/${editingContact.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dataToSend),
            });

            if (response.ok) {
                setMessage({ type: 'success', text: 'Contato atualizado com sucesso!' });
                closeModals();
                fetchContacts();
            } else {
                const error = await response.json();
                setMessage({ type: 'error', text: error.error || 'Erro ao atualizar contato' });
            }
        } catch {
            setMessage({ type: 'error', text: 'Erro ao conectar com o servidor' });
        }
    };

    return (
        <MainLayout>
            <div className="p-4 sm:p-6 lg:p-8">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="mb-6 lg:mb-8">
                        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                            <div className="flex-1">
                                {/* Submenu */}
                                <nav className="flex items-center gap-2 sm:gap-4 mb-4 overflow-x-auto">
                                    <Link
                                        href="/contacts"
                                        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors whitespace-nowrap ${!listFilter || listFilter === 'all'
                                            ? 'bg-white text-black'
                                            : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                                            }`}
                                    >
                                        <Users className="h-4 w-4" />
                                        <span className="hidden sm:inline">Todos os Contatos</span>
                                        <span className="sm:hidden">Contatos</span>
                                    </Link>
                                    <Link
                                        href="/contacts/lists"
                                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors whitespace-nowrap"
                                    >
                                        <List className="h-4 w-4" />
                                        <span className="hidden sm:inline">Listas de E-mail</span>
                                        <span className="sm:hidden">Listas</span>
                                    </Link>
                                </nav>

                                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                                    {listFilter !== 'all' && mailingLists.find(l => l.id === listFilter)
                                        ? `Lista: ${mailingLists.find(l => l.id === listFilter)?.name}`
                                        : 'Contatos'
                                    }
                                </h1>

                                {/* Info Row */}
                                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                                    <p className="text-neutral-400 text-sm sm:text-base">
                                        {listFilter !== 'all' && mailingLists.find(l => l.id === listFilter)
                                            ? `Contatos da lista ${mailingLists.find(l => l.id === listFilter)?.name}`
                                            : 'Gerencie seus contatos e prospects'
                                        }
                                    </p>
                                    <div className="flex items-center gap-2 px-3 py-1 bg-neutral-800 rounded-full border border-neutral-700 self-start">
                                        <Users className="h-4 w-4 text-neutral-400" />
                                        <span className="text-sm text-neutral-300 font-medium">
                                            {contacts.length} contato{contacts.length !== 1 ? 's' : ''}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                                <button
                                    onClick={() => setShowImportModal(true)}
                                    className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors cursor-pointer text-sm sm:text-base"
                                >
                                    <Upload className="h-4 w-4" />
                                    <span className="hidden lg:inline">Importar CSV</span>
                                    <span className="lg:hidden">Importar</span>
                                </button>
                                <button
                                    onClick={openCreateModal}
                                    className="flex items-center justify-center gap-2 px-4 py-2 bg-white text-black font-medium rounded-lg hover:bg-neutral-200 transition-colors cursor-pointer text-sm sm:text-base"
                                >
                                    <Plus className="h-4 w-4" />
                                    <span className="hidden sm:inline">Novo Contato</span>
                                    <span className="sm:hidden">Novo</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Message */}
                    {message && (
                        <div className={`mb-6 p-4 rounded-lg ${message.type === 'success'
                            ? 'bg-green-900/50 border border-green-700 text-green-300'
                            : 'bg-red-900/50 border border-red-700 text-red-300'
                            }`}>
                            <div className="flex items-start justify-between gap-2">
                                <span className="flex-1">{message.text}</span>
                                <button
                                    onClick={() => setMessage(null)}
                                    className="text-current hover:opacity-70 cursor-pointer flex-shrink-0"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Filters and Search */}
                    <div className="bg-neutral-gradient rounded-lg p-4 sm:p-6 border border-neutral-800 mb-6">
                        <form onSubmit={handleSearch} className="space-y-4">
                            {/* Search Input */}
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400 pointer-events-none" />
                                <input
                                    type="text"
                                    placeholder="Buscar contatos..."
                                    className="w-full pl-10 pr-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-white cursor-text text-sm sm:text-base"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>

                            {/* Filters Row */}
                            <div className="flex flex-col sm:flex-row gap-3">
                                <select
                                    className="flex-1 px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:border-white cursor-pointer text-sm sm:text-base"
                                    value={listFilter}
                                    onChange={(e) => setListFilter(e.target.value)}
                                >
                                    <option value="all">Todas as listas</option>
                                    {mailingLists.map(list => (
                                        <option key={list.id} value={list.id}>
                                            {list.name}
                                        </option>
                                    ))}
                                </select>
                                <select
                                    className="flex-1 px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:border-white cursor-pointer text-sm sm:text-base"
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                >
                                    <option value="all">Todos os status</option>
                                    <option value="active">Ativos</option>
                                    <option value="inactive">Inativos</option>
                                </select>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white hover:bg-neutral-700 transition-colors cursor-pointer flex items-center justify-center gap-2 sm:flex-shrink-0"
                                >
                                    <Filter className="h-4 w-4" />
                                    <span className="sm:hidden">Filtrar</span>
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Contacts List */}
                    {loading ? (
                        <div className="bg-neutral-gradient rounded-lg p-8 sm:p-12 border border-neutral-800 text-center">
                            <div className="text-neutral-400">Carregando contatos...</div>
                        </div>
                    ) : contacts.length === 0 ? (
                        <div className="bg-neutral-gradient rounded-lg p-8 sm:p-12 border border-neutral-800 text-center">
                            <Users className="h-12 w-12 sm:h-16 sm:w-16 text-neutral-500 mx-auto mb-4" />
                            <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">
                                Nenhum contato encontrado
                            </h3>
                            <p className="text-neutral-400 mb-6 text-sm sm:text-base">
                                {searchTerm || statusFilter !== 'all' || listFilter !== 'all'
                                    ? 'Nenhum contato corresponde aos filtros aplicados.'
                                    : 'Você ainda não adicionou nenhum contato. Comece criando seu primeiro contato.'
                                }
                            </p>
                            <button
                                onClick={openCreateModal}
                                className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 bg-white text-black font-medium rounded-lg hover:bg-neutral-200 transition-colors cursor-pointer"
                            >
                                Criar Primeiro Contato
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {/* Select All Header - Mobile Responsive */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 bg-neutral-800 rounded-lg">
                                <CustomCheckbox
                                    checked={selectAll}
                                    onChange={toggleSelectAll}
                                    label={`Selecionar todos (${contacts.length} contatos)`}
                                />
                                {selectedContacts.size > 0 && (
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                                        <span className="text-blue-300 text-sm">
                                            {selectedContacts.size} contato{selectedContacts.size !== 1 ? 's' : ''} selecionado{selectedContacts.size !== 1 ? 's' : ''}
                                        </span>
                                        <button
                                            onClick={deleteSelectedContacts}
                                            disabled={deleting}
                                            className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed text-sm"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                            {deleting ? 'Deletando...' : 'Deletar'}
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Lista de Contatos */}
                            {contacts.map((contact) => (
                                <ContactItem
                                    key={contact.id}
                                    contact={contact}
                                    isSelected={selectedContacts.has(contact.id)}
                                    showCheckbox={true}
                                    onToggleSelect={toggleSelectContact}
                                    showActions={true}
                                    selectionMode="checkbox"
                                    actionButtons={
                                        <>
                                            <button
                                                onClick={() => openViewModal(contact.id)}
                                                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-neutral-800 text-white rounded-md hover:bg-neutral-700 transition-colors border border-neutral-600 text-xs cursor-pointer"
                                                title="Visualizar contato"
                                            >
                                                <Eye className="h-3.5 w-3.5" />
                                                <span className="hidden sm:inline">Ver</span>
                                            </button>
                                            <button
                                                onClick={() => openViewModal(contact.id)}
                                                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-xs cursor-pointer"
                                                title="Editar contato"
                                            >
                                                <Edit3 className="h-3.5 w-3.5" />
                                                <span className="hidden sm:inline">Editar</span>
                                            </button>
                                            <button
                                                onClick={() => deleteContact(contact.id)}
                                                disabled={deleting}
                                                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-xs disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                                                title="Deletar contato"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                                <span className="hidden sm:inline">Deletar</span>
                                            </button>
                                        </>
                                    }
                                />
                            ))}
                        </div>
                    )}

                    {/* Indicador "Ver todos" */}
                    {contacts.length > 0 && statusFilter === 'all' && (
                        <div className="mt-8 flex items-center justify-center">
                            <div className="flex items-center gap-2 px-4 py-2 bg-blue-900/20 border border-blue-700 rounded-lg">
                                <Users className="h-4 w-4 text-blue-400" />
                                <span className="text-blue-300 text-sm">
                                    Exibindo todos os {contacts.length} contatos
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Pagination */}
                    {contacts.length > 0 && totalPages > 1 && (
                        <div className="mt-8 flex items-center justify-center">
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    className="px-3 py-2 bg-neutral-800 text-white rounded-lg hover:bg-neutral-700 transition-colors border border-neutral-600 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-sm"
                                >
                                    <span className="hidden sm:inline">Anterior</span>
                                    <span className="sm:hidden">←</span>
                                </button>
                                <span className="px-4 py-2 text-neutral-400 select-none text-sm">
                                    <span className="hidden sm:inline">Página {currentPage} de {totalPages}</span>
                                    <span className="sm:hidden">{currentPage}/{totalPages}</span>
                                </span>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages}
                                    className="px-3 py-2 bg-neutral-800 text-white rounded-lg hover:bg-neutral-700 transition-colors border border-neutral-600 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-sm"
                                >
                                    <span className="hidden sm:inline">Próxima</span>
                                    <span className="sm:hidden">→</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Import CSV Modal */}
                <ImportCSVModal
                    isOpen={showImportModal}
                    onClose={() => setShowImportModal(false)}
                    onSuccess={() => {
                        fetchContacts();
                        setMessage({ type: 'success', text: 'Contatos importados com sucesso!' });
                    }}
                    mailingLists={mailingLists}
                    defaultListId={listFilter !== 'all' ? listFilter : undefined}
                    title="Importar Contatos via CSV"
                />

                {/* Create Modal */}
                {showNewContactModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-neutral-900 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden border border-neutral-700">
                            <div className="p-4 sm:p-6 border-b border-neutral-700 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    {/* Avatar Preview */}
                                    <div className="flex-shrink-0">
                                        <div className={`w-10 h-10 rounded-full ${newContact.name ? getAvatarColor(newContact.name) : 'bg-neutral-600'} flex items-center justify-center text-white font-semibold text-sm shadow-lg`}>
                                            {newContact.name ? getInitials(newContact.name) : '?'}
                                        </div>
                                    </div>
                                    <h2 className="text-lg sm:text-xl font-bold text-white">
                                        Novo Contato
                                    </h2>
                                </div>
                                <button
                                    onClick={closeModals}
                                    className="text-neutral-400 hover:text-white transition-colors cursor-pointer"
                                >
                                    <X className="h-6 w-6" />
                                </button>
                            </div>

                            <form onSubmit={handleCreate} className="p-4 sm:p-6 space-y-4 overflow-y-auto max-h-[70vh]">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-white mb-2">
                                            Nome *
                                        </label>
                                        <input
                                            type="text"
                                            value={newContact.name}
                                            onChange={(e) => setNewContact(prev => ({ ...prev, name: e.target.value }))}
                                            className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-white cursor-text text-sm sm:text-base"
                                            placeholder="Nome do contato"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-white mb-2">
                                            Email *
                                        </label>
                                        <input
                                            type="email"
                                            value={newContact.email}
                                            onChange={(e) => setNewContact(prev => ({ ...prev, email: e.target.value }))}
                                            className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-white cursor-text text-sm sm:text-base"
                                            placeholder="email@exemplo.com"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-white mb-2">
                                            Telefone
                                        </label>
                                        <input
                                            type="tel"
                                            value={newContact.phone}
                                            onChange={(e) => setNewContact(prev => ({ ...prev, phone: e.target.value }))}
                                            className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-white cursor-text text-sm sm:text-base"
                                            placeholder="(11) 99999-9999, +1 555 123-4567"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-white mb-2">
                                            Cargo
                                        </label>
                                        <input
                                            type="text"
                                            value={newContact.position}
                                            onChange={(e) => setNewContact(prev => ({ ...prev, position: e.target.value }))}
                                            className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-white cursor-text text-sm sm:text-base"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-white mb-2">
                                            Empresa *
                                        </label>
                                        <input
                                            type="text"
                                            value={newContact.companyName}
                                            onChange={(e) => setNewContact(prev => ({ ...prev, companyName: e.target.value }))}
                                            className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-white cursor-text text-sm sm:text-base"
                                            placeholder="Nome da empresa"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-white mb-2">
                                            Website
                                        </label>
                                        <input
                                            type="url"
                                            value={newContact.website}
                                            onChange={(e) => setNewContact(prev => ({ ...prev, website: e.target.value }))}
                                            className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-white cursor-text text-sm sm:text-base"
                                        />
                                    </div>

                                    <div className="lg:col-span-2">
                                        <label className="block text-sm font-medium text-white mb-2">
                                            Lista de E-mail
                                        </label>
                                        <select
                                            value={newContact.mailingListId || ''}
                                            onChange={(e) => setNewContact(prev => ({ ...prev, mailingListId: e.target.value || undefined }))}
                                            className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:border-white cursor-pointer text-sm sm:text-base"
                                        >
                                            <option value="">Nenhuma lista</option>
                                            {mailingLists.map(list => (
                                                <option key={list.id} value={list.id}>
                                                    {list.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-white mb-2">
                                        Nicho/Segmento
                                    </label>
                                    <input
                                        type="text"
                                        value={newContact.niche}
                                        onChange={(e) => setNewContact(prev => ({ ...prev, niche: e.target.value }))}
                                        className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-white cursor-text text-sm sm:text-base"
                                        placeholder="Ex: E-commerce, Saúde, Educação"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-white mb-2">
                                        Pontos de Dor
                                    </label>
                                    <textarea
                                        value={newContact.painPoints}
                                        onChange={(e) => setNewContact(prev => ({ ...prev, painPoints: e.target.value }))}
                                        className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-white cursor-text h-24 resize-none text-sm sm:text-base"
                                        placeholder="Problemas que a empresa enfrenta..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-white mb-2">
                                        Interação Anterior
                                    </label>
                                    <textarea
                                        value={newContact.previousInteraction}
                                        onChange={(e) => setNewContact(prev => ({ ...prev, previousInteraction: e.target.value }))}
                                        className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-white cursor-text h-24 resize-none text-sm sm:text-base"
                                        placeholder="Histórico de contatos ou interações..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-white mb-2">
                                        Observações
                                    </label>
                                    <textarea
                                        value={newContact.notes}
                                        onChange={(e) => setNewContact(prev => ({ ...prev, notes: e.target.value }))}
                                        className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-white cursor-text h-24 resize-none text-sm sm:text-base"
                                        placeholder="Anotações gerais sobre o contato..."
                                    />
                                </div>

                                <div className="flex items-center">
                                    <CustomCheckbox
                                        checked={newContact.isActive}
                                        onChange={() => setNewContact(prev => ({ ...prev, isActive: !prev.isActive }))}
                                        label="Contato ativo"
                                    />
                                </div>
                            </form>

                            <div className="p-4 sm:p-6 border-t border-neutral-700 flex flex-col sm:flex-row items-center gap-3">
                                <button
                                    type="button"
                                    onClick={closeModals}
                                    className="w-full sm:w-auto px-4 py-2 bg-neutral-800 text-white rounded-lg hover:bg-neutral-700 transition-colors border border-neutral-600 cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    onClick={handleCreate}
                                    className="w-full sm:w-auto px-4 py-2 bg-white text-black rounded-lg hover:bg-neutral-200 transition-colors cursor-pointer"
                                >
                                    Criar Contato
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* View/Edit Modal */}
                {showEditModal && editingContact && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-neutral-900 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden border border-neutral-700">
                            <div className="p-4 sm:p-6 border-b border-neutral-700 flex items-center justify-between">
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                    {/* Avatar */}
                                    <div className="flex-shrink-0">
                                        <div className={`w-10 h-10 rounded-full ${getAvatarColor(editingContact.name || newContact.name)} flex items-center justify-center text-white font-semibold text-sm shadow-lg`}>
                                            {getInitials(editingContact.name || newContact.name)}
                                        </div>
                                    </div>
                                    <h2 className="text-lg sm:text-xl font-bold text-white truncate">
                                        {editingContact.name}
                                    </h2>
                                </div>
                                <button
                                    onClick={closeModals}
                                    className="text-neutral-400 hover:text-white transition-colors cursor-pointer flex-shrink-0 ml-2"
                                >
                                    <X className="h-6 w-6" />
                                </button>
                            </div>

                            <form onSubmit={handleEdit} className="p-4 sm:p-6 space-y-4 overflow-y-auto max-h-[70vh]">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-white mb-2">
                                            Nome *
                                        </label>
                                        <input
                                            type="text"
                                            value={newContact.name}
                                            onChange={(e) => setNewContact(prev => ({ ...prev, name: e.target.value }))}
                                            className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-white cursor-text text-sm sm:text-base"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-white mb-2">
                                            Email *
                                        </label>
                                        <input
                                            type="email"
                                            value={newContact.email}
                                            onChange={(e) => setNewContact(prev => ({ ...prev, email: e.target.value }))}
                                            className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-white cursor-text text-sm sm:text-base"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-white mb-2">
                                            Telefone
                                        </label>
                                        <input
                                            type="tel"
                                            value={newContact.phone}
                                            onChange={(e) => setNewContact(prev => ({ ...prev, phone: e.target.value }))}
                                            className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-white cursor-text text-sm sm:text-base"
                                            placeholder="(11) 99999-9999, +1 555 123-4567"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-white mb-2">
                                            Cargo
                                        </label>
                                        <input
                                            type="text"
                                            value={newContact.position}
                                            onChange={(e) => setNewContact(prev => ({ ...prev, position: e.target.value }))}
                                            className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-white cursor-text text-sm sm:text-base"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-white mb-2">
                                            Empresa *
                                        </label>
                                        <input
                                            type="text"
                                            value={newContact.companyName}
                                            onChange={(e) => setNewContact(prev => ({ ...prev, companyName: e.target.value }))}
                                            className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-white cursor-text text-sm sm:text-base"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-white mb-2">
                                            Website
                                        </label>
                                        <input
                                            type="url"
                                            value={newContact.website}
                                            onChange={(e) => setNewContact(prev => ({ ...prev, website: e.target.value }))}
                                            className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-white cursor-text text-sm sm:text-base"
                                        />
                                    </div>

                                    <div className="lg:col-span-2">
                                        <label className="block text-sm font-medium text-white mb-2">
                                            Lista de E-mail
                                        </label>
                                        <select
                                            value={newContact.mailingListId || ''}
                                            onChange={(e) => setNewContact(prev => ({ ...prev, mailingListId: e.target.value || undefined }))}
                                            className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:border-white cursor-pointer text-sm sm:text-base"
                                        >
                                            <option value="">Nenhuma lista</option>
                                            {mailingLists.map(list => (
                                                <option key={list.id} value={list.id}>
                                                    {list.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-white mb-2">
                                        Nicho/Segmento
                                    </label>
                                    <input
                                        type="text"
                                        value={newContact.niche}
                                        onChange={(e) => setNewContact(prev => ({ ...prev, niche: e.target.value }))}
                                        className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-white cursor-text text-sm sm:text-base"
                                        placeholder="Ex: E-commerce, Saúde, Educação"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-white mb-2">
                                        Pontos de Dor
                                    </label>
                                    <textarea
                                        value={newContact.painPoints}
                                        onChange={(e) => setNewContact(prev => ({ ...prev, painPoints: e.target.value }))}
                                        className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-white cursor-text h-24 resize-none text-sm sm:text-base"
                                        placeholder="Problemas que a empresa enfrenta..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-white mb-2">
                                        Interação Anterior
                                    </label>
                                    <textarea
                                        value={newContact.previousInteraction}
                                        onChange={(e) => setNewContact(prev => ({ ...prev, previousInteraction: e.target.value }))}
                                        className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-white cursor-text h-24 resize-none text-sm sm:text-base"
                                        placeholder="Histórico de contatos ou interações..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-white mb-2">
                                        Observações
                                    </label>
                                    <textarea
                                        value={newContact.notes}
                                        onChange={(e) => setNewContact(prev => ({ ...prev, notes: e.target.value }))}
                                        className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-white cursor-text h-24 resize-none text-sm sm:text-base"
                                        placeholder="Anotações gerais sobre o contato..."
                                    />
                                </div>

                                <div className="flex items-center">
                                    <CustomCheckbox
                                        checked={newContact.isActive}
                                        onChange={() => setNewContact(prev => ({ ...prev, isActive: !prev.isActive }))}
                                        label="Contato ativo"
                                    />
                                </div>
                            </form>

                            <div className="p-4 sm:p-6 border-t border-neutral-700 flex flex-col sm:flex-row items-center gap-3">
                                <button
                                    type="button"
                                    onClick={closeModals}
                                    className="w-full sm:w-auto px-4 py-2 bg-neutral-800 text-white rounded-lg hover:bg-neutral-700 transition-colors border border-neutral-600 cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    onClick={handleEdit}
                                    className="w-full sm:w-auto px-4 py-2 bg-white text-black rounded-lg hover:bg-neutral-200 transition-colors cursor-pointer"
                                >
                                    Salvar Alterações
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Confirmation Modal */}
                {showConfirmModal && confirmAction && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-neutral-900 rounded-lg max-w-md w-full border border-neutral-700">
                            <div className="p-4 sm:p-6 border-b border-neutral-700">
                                <h2 className="text-lg sm:text-xl font-bold text-white">
                                    Confirmar Exclusão
                                </h2>
                            </div>

                            <div className="p-4 sm:p-6">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
                                    <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center flex-shrink-0">
                                        <Trash2 className="h-6 w-6 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-white font-medium mb-1">
                                            {confirmAction.type === 'single'
                                                ? 'Deletar contato?'
                                                : `Deletar ${confirmAction.count} contatos?`
                                            }
                                        </p>
                                        <p className="text-neutral-400 text-sm">
                                            {confirmAction.type === 'single'
                                                ? 'Esta ação não pode ser desfeita.'
                                                : `Todos os ${confirmAction.count} contatos selecionados serão deletados permanentemente.`
                                            }
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 sm:p-6 border-t border-neutral-700 flex flex-col sm:flex-row items-center gap-3">
                                <button
                                    onClick={() => setShowConfirmModal(false)}
                                    disabled={deleting}
                                    className="w-full sm:w-auto px-4 py-2 bg-neutral-800 text-white rounded-lg hover:bg-neutral-700 transition-colors border border-neutral-600 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={confirmAction.onConfirm}
                                    disabled={deleting}
                                    className="w-full sm:w-auto px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                                >
                                    {deleting ? 'Deletando...' : 'Deletar'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </MainLayout>
    );
} 