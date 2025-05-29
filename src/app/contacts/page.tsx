'use client';

import { useEffect, useState, useCallback } from 'react';
import MainLayout from '@/components/MainLayout';
import { Search, Filter, Users, Calendar, Eye, Trash2, Plus, Edit3, Power, PowerOff, Check, X, Phone, Mail, Globe, Building2, User, MessageSquare } from 'lucide-react';

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
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [isActive, setIsActive] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Modal states
    const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
    const [showViewModal, setShowViewModal] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Selection states
    const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
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

    // Form states
    const [formData, setFormData] = useState({
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
        isActive: true
    });

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

    const fetchContacts = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: currentPage.toString(),
                limit: '10',
                ...(search && { search }),
                ...(isActive && { isActive }),
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
    }, [currentPage, search, isActive]);

    useEffect(() => {
        fetchContacts();
    }, [fetchContacts]);

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
                setFormData({
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
                    isActive: contact.isActive
                });
                setShowViewModal(true);
            } else {
                setMessage({ type: 'error', text: 'Erro ao carregar contato' });
            }
        } catch {
            setMessage({ type: 'error', text: 'Erro ao carregar contato' });
        }
    };

    const openCreateModal = () => {
        setFormData({
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
            isActive: true
        });
        setShowCreateModal(true);
    };

    const closeModals = () => {
        setShowViewModal(false);
        setShowCreateModal(false);
        setSelectedContact(null);
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
        if (!formData.name || !formData.email || !formData.companyName) {
            setMessage({ type: 'error', text: 'Nome, email e empresa são obrigatórios' });
            return;
        }

        try {
            const response = await fetch('/api/contacts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
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
        if (!selectedContact || !formData.name || !formData.email || !formData.companyName) {
            setMessage({ type: 'error', text: 'Nome, email e empresa são obrigatórios' });
            return;
        }

        try {
            const response = await fetch(`/api/contacts/${selectedContact.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
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
            <div className="p-8">
                <div className="max-w-6xl mx-auto">
                    {/* Header */}
                    <div className="mb-8 flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-white mb-2">
                                Contatos
                            </h1>
                            <p className="text-neutral-400">
                                Gerencie seus contatos e prospects
                            </p>
                        </div>
                        <button
                            onClick={openCreateModal}
                            className="flex items-center gap-2 px-4 py-2 bg-white text-black font-medium rounded-lg hover:bg-neutral-200 transition-colors cursor-pointer"
                        >
                            <Plus className="h-4 w-4" />
                            Novo Contato
                        </button>
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

                    {/* Filters and Search */}
                    <div className="bg-neutral-gradient rounded-lg p-6 border border-neutral-800 mb-6">
                        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1">
                                <div className="relative">
                                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400 pointer-events-none" />
                                    <input
                                        type="text"
                                        placeholder="Buscar contatos..."
                                        className="w-full pl-10 pr-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-white cursor-text"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <select
                                    className="px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:border-white cursor-pointer"
                                    value={isActive}
                                    onChange={(e) => setIsActive(e.target.value)}
                                >
                                    <option value="">Todos os status</option>
                                    <option value="true">Ativos</option>
                                    <option value="false">Inativos</option>
                                </select>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white hover:bg-neutral-700 transition-colors cursor-pointer"
                                >
                                    <Filter className="h-4 w-4" />
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Contacts List */}
                    {loading ? (
                        <div className="bg-neutral-gradient rounded-lg p-12 border border-neutral-800 text-center">
                            <div className="text-neutral-400">Carregando contatos...</div>
                        </div>
                    ) : contacts.length === 0 ? (
                        <div className="bg-neutral-gradient rounded-lg p-12 border border-neutral-800 text-center">
                            <Users className="h-16 w-16 text-neutral-500 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-white mb-2">
                                Nenhum contato encontrado
                            </h3>
                            <p className="text-neutral-400 mb-6">
                                {search || isActive
                                    ? 'Nenhum contato corresponde aos filtros aplicados.'
                                    : 'Você ainda não adicionou nenhum contato. Comece criando seu primeiro contato.'
                                }
                            </p>
                            <button
                                onClick={openCreateModal}
                                className="inline-flex items-center px-6 py-3 bg-white text-black font-medium rounded-lg hover:bg-neutral-200 transition-colors cursor-pointer"
                            >
                                Criar Primeiro Contato
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {/* Select All Header - Mais Compacto */}
                            <div className="flex items-center justify-between p-3 bg-neutral-800 rounded-lg">
                                <CustomCheckbox
                                    checked={selectAll}
                                    onChange={toggleSelectAll}
                                    label={`Selecionar todos (${contacts.length} contatos)`}
                                />
                                {selectedContacts.size > 0 && (
                                    <div className="flex items-center gap-3">
                                        <span className="text-blue-300 text-sm">
                                            {selectedContacts.size} contato(s) selecionado(s)
                                        </span>
                                        <button
                                            onClick={deleteSelectedContacts}
                                            disabled={deleting}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed text-sm"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                            {deleting ? 'Deletando...' : 'Deletar'}
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Lista de Contatos - Layout Compacto */}
                            {contacts.map((contact) => (
                                <div
                                    key={contact.id}
                                    className={`bg-neutral-gradient rounded-lg p-4 border transition-colors ${selectedContacts.has(contact.id)
                                        ? 'border-blue-500 bg-blue-900/10'
                                        : 'border-neutral-800 hover:border-neutral-700'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        {/* Checkbox */}
                                        <div className="flex-shrink-0">
                                            <CustomCheckbox
                                                checked={selectedContacts.has(contact.id)}
                                                onChange={() => toggleSelectContact(contact.id)}
                                            />
                                        </div>

                                        {/* Avatar */}
                                        <div className="flex-shrink-0">
                                            <div className={`w-10 h-10 rounded-full ${getAvatarColor(contact.name)} flex items-center justify-center text-white font-semibold text-sm shadow-lg`}>
                                                {getInitials(contact.name)}
                                            </div>
                                        </div>

                                        {/* Conteúdo Principal - Layout Horizontal */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between">
                                                {/* Informações do Contato */}
                                                <div className="flex-1 min-w-0 pr-4">
                                                    {/* Linha 1: Nome + Cargo + Status */}
                                                    <div className="flex items-center gap-3 mb-1">
                                                        <h3 className="text-base font-semibold text-white truncate">
                                                            {contact.name}
                                                        </h3>
                                                        {contact.position && (
                                                            <span className="text-neutral-400 text-xs flex-shrink-0">
                                                                • {contact.position}
                                                            </span>
                                                        )}
                                                        <div className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs flex-shrink-0 ${contact.isActive
                                                            ? 'bg-green-900/50 text-green-300 border border-green-700'
                                                            : 'bg-red-900/50 text-red-300 border border-red-700'
                                                            }`}>
                                                            {contact.isActive ? <Power className="h-3 w-3" /> : <PowerOff className="h-3 w-3" />}
                                                            {contact.isActive ? 'Ativo' : 'Inativo'}
                                                        </div>
                                                    </div>

                                                    {/* Linha 2: Empresa + Email */}
                                                    <div className="flex items-center gap-4 mb-1">
                                                        <div className="flex items-center gap-1.5 text-sm text-neutral-300">
                                                            <Building2 className="h-3.5 w-3.5 text-neutral-500 flex-shrink-0" />
                                                            <span className="truncate">{contact.companyName}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 text-sm text-neutral-300">
                                                            <Mail className="h-3.5 w-3.5 text-neutral-500 flex-shrink-0" />
                                                            <span className="truncate">{contact.email}</span>
                                                        </div>
                                                    </div>

                                                    {/* Linha 3: Informações adicionais */}
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-4 text-xs text-neutral-400">
                                                            {contact.phone && (
                                                                <div className="flex items-center gap-1.5">
                                                                    <Phone className="h-3 w-3 flex-shrink-0" />
                                                                    <span>{contact.phone}</span>
                                                                </div>
                                                            )}
                                                            {contact.niche && (
                                                                <div className="flex items-center gap-1.5">
                                                                    <User className="h-3 w-3 flex-shrink-0" />
                                                                    <span className="truncate">{contact.niche}</span>
                                                                </div>
                                                            )}
                                                            {contact.website && (
                                                                <div className="flex items-center gap-1.5">
                                                                    <Globe className="h-3 w-3 flex-shrink-0" />
                                                                    <span className="truncate max-w-24">{contact.website.replace(/^https?:\/\//, '')}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center text-xs text-neutral-500 flex-shrink-0">
                                                            <Calendar className="h-3 w-3 mr-1" />
                                                            {new Date(contact.updatedAt).toLocaleDateString('pt-BR')}
                                                        </div>
                                                    </div>

                                                    {/* Notas (se existir) */}
                                                    {contact.notes && (
                                                        <div className="flex items-start gap-1.5 text-xs text-neutral-400 mt-1">
                                                            <MessageSquare className="h-3 w-3 mt-0.5 text-neutral-500 flex-shrink-0" />
                                                            <p className="truncate">{contact.notes}</p>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Botões de Ação - Compactos */}
                                                <div className="flex gap-1.5 flex-shrink-0">
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
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    {contacts.length > 0 && totalPages > 1 && (
                        <div className="mt-8 flex items-center justify-center">
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    className="px-3 py-2 bg-neutral-800 text-white rounded-lg hover:bg-neutral-700 transition-colors border border-neutral-600 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                >
                                    Anterior
                                </button>
                                <span className="px-4 py-2 text-neutral-400 select-none">
                                    Página {currentPage} de {totalPages}
                                </span>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages}
                                    className="px-3 py-2 bg-neutral-800 text-white rounded-lg hover:bg-neutral-700 transition-colors border border-neutral-600 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                >
                                    Próxima
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Create Modal */}
                {showCreateModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-neutral-900 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden border border-neutral-700">
                            <div className="p-6 border-b border-neutral-700 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    {/* Avatar Preview */}
                                    <div className="flex-shrink-0">
                                        <div className={`w-10 h-10 rounded-full ${formData.name ? getAvatarColor(formData.name) : 'bg-neutral-600'} flex items-center justify-center text-white font-semibold text-sm shadow-lg`}>
                                            {formData.name ? getInitials(formData.name) : '?'}
                                        </div>
                                    </div>
                                    <h2 className="text-xl font-bold text-white">
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

                            <form onSubmit={handleCreate} className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-white mb-2">
                                            Nome *
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                            className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-white cursor-text"
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
                                            value={formData.email}
                                            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                            className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-white cursor-text"
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
                                            value={formData.phone}
                                            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                            className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-white cursor-text"
                                            placeholder="(11) 99999-9999"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-white mb-2">
                                            Cargo
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.position}
                                            onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                                            className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-white cursor-text"
                                            placeholder="Ex: CEO, Diretor de Marketing"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-white mb-2">
                                            Empresa *
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.companyName}
                                            onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                                            className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-white cursor-text"
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
                                            value={formData.website}
                                            onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                                            className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-white cursor-text"
                                            placeholder="https://exemplo.com"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-white mb-2">
                                        Nicho/Segmento
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.niche}
                                        onChange={(e) => setFormData(prev => ({ ...prev, niche: e.target.value }))}
                                        className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-white cursor-text"
                                        placeholder="Ex: E-commerce, Saúde, Educação"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-white mb-2">
                                        Pontos de Dor
                                    </label>
                                    <textarea
                                        value={formData.painPoints}
                                        onChange={(e) => setFormData(prev => ({ ...prev, painPoints: e.target.value }))}
                                        className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-white cursor-text h-24 resize-none"
                                        placeholder="Problemas que a empresa enfrenta..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-white mb-2">
                                        Interação Anterior
                                    </label>
                                    <textarea
                                        value={formData.previousInteraction}
                                        onChange={(e) => setFormData(prev => ({ ...prev, previousInteraction: e.target.value }))}
                                        className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-white cursor-text h-24 resize-none"
                                        placeholder="Histórico de contatos ou interações..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-white mb-2">
                                        Observações
                                    </label>
                                    <textarea
                                        value={formData.notes}
                                        onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                                        className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-white cursor-text h-24 resize-none"
                                        placeholder="Anotações gerais sobre o contato..."
                                    />
                                </div>

                                <div className="flex items-center">
                                    <label className="flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.isActive}
                                            onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                                            className="sr-only"
                                        />
                                        <div className={`w-4 h-4 rounded border-2 transition-all duration-200 ${formData.isActive
                                            ? 'bg-blue-600 border-blue-600'
                                            : 'bg-neutral-800 border-neutral-600 hover:border-neutral-500'
                                            }`}>
                                            {formData.isActive && (
                                                <Check className="w-3 h-3 text-white absolute transform scale-75" />
                                            )}
                                        </div>
                                        <span className="ml-2 text-neutral-300 text-sm">
                                            Contato ativo
                                        </span>
                                    </label>
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
                                    Criar Contato
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* View/Edit Modal */}
                {showViewModal && selectedContact && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-neutral-900 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden border border-neutral-700">
                            <div className="p-6 border-b border-neutral-700 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    {/* Avatar */}
                                    <div className="flex-shrink-0">
                                        <div className={`w-10 h-10 rounded-full ${getAvatarColor(formData.name || selectedContact.name)} flex items-center justify-center text-white font-semibold text-sm shadow-lg`}>
                                            {getInitials(formData.name || selectedContact.name)}
                                        </div>
                                    </div>
                                    <h2 className="text-xl font-bold text-white">
                                        {selectedContact.name}
                                    </h2>
                                </div>
                                <button
                                    onClick={closeModals}
                                    className="text-neutral-400 hover:text-white transition-colors cursor-pointer"
                                >
                                    <X className="h-6 w-6" />
                                </button>
                            </div>

                            <form onSubmit={handleEdit} className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-white mb-2">
                                            Nome *
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
                                            Email *
                                        </label>
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                            className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-white cursor-text"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-white mb-2">
                                            Telefone
                                        </label>
                                        <input
                                            type="tel"
                                            value={formData.phone}
                                            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                            className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-white cursor-text"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-white mb-2">
                                            Cargo
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.position}
                                            onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                                            className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-white cursor-text"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-white mb-2">
                                            Empresa *
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.companyName}
                                            onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                                            className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-white cursor-text"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-white mb-2">
                                            Website
                                        </label>
                                        <input
                                            type="url"
                                            value={formData.website}
                                            onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                                            className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-white cursor-text"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-white mb-2">
                                        Nicho/Segmento
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.niche}
                                        onChange={(e) => setFormData(prev => ({ ...prev, niche: e.target.value }))}
                                        className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-white cursor-text"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-white mb-2">
                                        Pontos de Dor
                                    </label>
                                    <textarea
                                        value={formData.painPoints}
                                        onChange={(e) => setFormData(prev => ({ ...prev, painPoints: e.target.value }))}
                                        className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-white cursor-text h-24 resize-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-white mb-2">
                                        Interação Anterior
                                    </label>
                                    <textarea
                                        value={formData.previousInteraction}
                                        onChange={(e) => setFormData(prev => ({ ...prev, previousInteraction: e.target.value }))}
                                        className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-white cursor-text h-24 resize-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-white mb-2">
                                        Observações
                                    </label>
                                    <textarea
                                        value={formData.notes}
                                        onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                                        className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-white cursor-text h-24 resize-none"
                                    />
                                </div>

                                <div className="flex items-center">
                                    <label className="flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.isActive}
                                            onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                                            className="sr-only"
                                        />
                                        <div className={`w-4 h-4 rounded border-2 transition-all duration-200 ${formData.isActive
                                            ? 'bg-blue-600 border-blue-600'
                                            : 'bg-neutral-800 border-neutral-600 hover:border-neutral-500'
                                            }`}>
                                            {formData.isActive && (
                                                <Check className="w-3 h-3 text-white absolute transform scale-75" />
                                            )}
                                        </div>
                                        <span className="ml-2 text-neutral-300 text-sm">
                                            Contato ativo
                                        </span>
                                    </label>
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

                {/* Confirmation Modal */}
                {showConfirmModal && confirmAction && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-neutral-900 rounded-lg max-w-md w-full border border-neutral-700">
                            <div className="p-6 border-b border-neutral-700">
                                <h2 className="text-xl font-bold text-white">
                                    Confirmar Exclusão
                                </h2>
                            </div>

                            <div className="p-6">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center">
                                        <Trash2 className="h-6 w-6 text-white" />
                                    </div>
                                    <div>
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

                            <div className="p-6 border-t border-neutral-700 flex items-center justify-end gap-3">
                                <button
                                    onClick={() => setShowConfirmModal(false)}
                                    disabled={deleting}
                                    className="px-4 py-2 bg-neutral-800 text-white rounded-lg hover:bg-neutral-700 transition-colors border border-neutral-600 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={confirmAction.onConfirm}
                                    disabled={deleting}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
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