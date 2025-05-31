'use client';

import { useEffect, useState, useCallback } from 'react';
import MainLayout from '@/components/MainLayout';
import ContactItem from '@/components/ContactItem';
import ImportCSVModal from '@/components/ImportCSVModal';
import { List, Plus, Edit3, Trash2, Users, Eye, X, Upload } from 'lucide-react';
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

export default function MailingLists() {
    const [lists, setLists] = useState<MailingList[]>([]);
    const [loading, setLoading] = useState(true);
    const [showNewListModal, setShowNewListModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
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

    return (
        <MainLayout>
            <div className="p-4 sm:p-6 lg:p-8">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="mb-6 lg:mb-8">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                            <div className="flex-1">
                                {/* Submenu */}
                                <nav className="flex items-center gap-2 sm:gap-4 mb-4 overflow-x-auto">
                                    <Link
                                        href="/contacts"
                                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors whitespace-nowrap"
                                    >
                                        <Users className="h-4 w-4" />
                                        <span className="hidden sm:inline">Todos os Contatos</span>
                                        <span className="sm:hidden">Contatos</span>
                                    </Link>
                                    <Link
                                        href="/contacts/lists"
                                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white text-black transition-colors whitespace-nowrap"
                                    >
                                        <List className="h-4 w-4" />
                                        <span className="hidden sm:inline">Listas de E-mail</span>
                                        <span className="sm:hidden">Listas</span>
                                    </Link>
                                </nav>

                                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Listas de E-mail</h1>

                                {/* Info Row */}
                                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                                    <p className="text-neutral-400 text-sm sm:text-base">
                                        Organize seus contatos em listas temáticas para campanhas direcionadas
                                    </p>
                                    <div className="flex items-center gap-2 px-3 py-1 bg-neutral-800 rounded-full border border-neutral-700 self-start">
                                        <List className="h-4 w-4 text-neutral-400" />
                                        <span className="text-sm text-neutral-300 font-medium">
                                            {lists.length} lista{lists.length !== 1 ? 's' : ''}
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
                                    <span className="hidden lg:inline">Importar e Criar Lista</span>
                                    <span className="lg:hidden">Importar</span>
                                </button>
                                <button
                                    onClick={openCreateModal}
                                    className="flex items-center justify-center gap-2 px-4 py-2 bg-white text-black font-medium rounded-lg hover:bg-neutral-200 transition-colors cursor-pointer text-sm sm:text-base"
                                >
                                    <Plus className="h-4 w-4" />
                                    <span className="hidden sm:inline">Nova Lista</span>
                                    <span className="sm:hidden">Nova</span>
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

                    {/* Lists Grid */}
                    {loading ? (
                        <div className="bg-neutral-gradient rounded-lg p-8 sm:p-12 border border-neutral-800 text-center">
                            <div className="text-neutral-400">Carregando listas...</div>
                        </div>
                    ) : lists.length === 0 ? (
                        <div className="bg-neutral-gradient rounded-lg p-8 sm:p-12 border border-neutral-800 text-center">
                            <List className="h-12 w-12 sm:h-16 sm:w-16 text-neutral-500 mx-auto mb-4" />
                            <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">
                                Nenhuma lista criada
                            </h3>
                            <p className="text-neutral-400 mb-6 text-sm sm:text-base">
                                Comece criando sua primeira lista para organizar seus contatos
                            </p>
                            <button
                                onClick={openCreateModal}
                                className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 bg-white text-black font-medium rounded-lg hover:bg-neutral-200 transition-colors cursor-pointer"
                            >
                                Criar Primeira Lista
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                            {lists.map((list) => (
                                <div
                                    key={list.id}
                                    className="bg-neutral-gradient rounded-lg p-4 sm:p-6 border border-neutral-800 hover:border-neutral-700 transition-all duration-200"
                                >
                                    {/* Header */}
                                    <div className="flex items-start justify-between mb-3 sm:mb-4">
                                        <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
                                            <div
                                                className="w-3 h-3 sm:w-4 sm:h-4 rounded-full flex-shrink-0 mt-0.5"
                                                style={{ backgroundColor: list.color }}
                                            />
                                            <h3 className="text-base sm:text-lg font-semibold text-white line-clamp-2 leading-tight">
                                                {list.name}
                                            </h3>
                                        </div>
                                        <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0 ml-2">
                                            <button
                                                onClick={() => openViewModal(list)}
                                                className="p-1 sm:p-1.5 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                                                title="Ver contatos"
                                            >
                                                <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                            </button>
                                            <button
                                                onClick={() => openEditModal(list)}
                                                className="p-1 sm:p-1.5 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                                                title="Editar lista"
                                            >
                                                <Edit3 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(list)}
                                                disabled={deleting}
                                                className="p-1 sm:p-1.5 text-neutral-400 hover:text-red-400 transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                                                title="Deletar lista"
                                            >
                                                <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Description */}
                                    {list.description && (
                                        <p className="text-neutral-300 text-sm mb-3 sm:mb-4 line-clamp-3 leading-relaxed">
                                            {list.description}
                                        </p>
                                    )}

                                    {/* Stats and Actions */}
                                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                                        <div className="flex items-center gap-1.5 text-xs sm:text-sm text-neutral-400">
                                            <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                            <span>
                                                {list._count.contacts} contato{list._count.contacts !== 1 ? 's' : ''}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => openViewModal(list)}
                                            className="text-blue-400 hover:text-blue-300 text-xs sm:text-sm font-medium transition-colors cursor-pointer"
                                        >
                                            Ver detalhes
                                        </button>
                                    </div>

                                    {/* Footer */}
                                    <div className="pt-3 sm:pt-4 border-t border-neutral-700">
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
                            <div className="bg-neutral-900 rounded-lg max-w-md w-full border border-neutral-700 max-h-[90vh] overflow-y-auto">
                                <div className="p-4 sm:p-6 border-b border-neutral-700">
                                    <h2 className="text-lg sm:text-xl font-bold text-white">Nova Lista</h2>
                                </div>

                                <form onSubmit={handleCreate} className="p-4 sm:p-6 space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-white mb-2">
                                            Nome da Lista *
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                            className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-white cursor-text text-sm sm:text-base"
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
                                            className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-white cursor-text h-20 resize-none text-sm sm:text-base"
                                            placeholder="Descreva o propósito desta lista..."
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-white mb-2">
                                            Cor da Lista
                                        </label>
                                        <div className="grid grid-cols-5 sm:flex sm:flex-wrap gap-2">
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
                                        Criar Lista
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Edit Modal */}
                    {showEditModal && editingList && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                            <div className="bg-neutral-900 rounded-lg max-w-md w-full border border-neutral-700 max-h-[90vh] overflow-y-auto">
                                <div className="p-4 sm:p-6 border-b border-neutral-700">
                                    <h2 className="text-lg sm:text-xl font-bold text-white">Editar Lista</h2>
                                </div>

                                <form onSubmit={handleEdit} className="p-4 sm:p-6 space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-white mb-2">
                                            Nome da Lista *
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                            className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-white cursor-text text-sm sm:text-base"
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
                                            className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-white cursor-text h-20 resize-none text-sm sm:text-base"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-white mb-2">
                                            Cor da Lista
                                        </label>
                                        <div className="grid grid-cols-5 sm:flex sm:flex-wrap gap-2">
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

                    {/* View Modal */}
                    {showViewModal && selectedList && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                            <div className="bg-neutral-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden border border-neutral-700">
                                <div className="p-4 sm:p-6 border-b border-neutral-700 flex items-center justify-between">
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                        <div
                                            className="w-4 h-4 sm:w-6 sm:h-6 rounded-full flex-shrink-0"
                                            style={{ backgroundColor: selectedList.color }}
                                        />
                                        <div className="min-w-0 flex-1">
                                            <h2 className="text-lg sm:text-xl font-bold text-white truncate">{selectedList.name}</h2>
                                            {selectedList.description && (
                                                <p className="text-neutral-400 text-xs sm:text-sm line-clamp-2">{selectedList.description}</p>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={closeModals}
                                        className="text-neutral-400 hover:text-white transition-colors cursor-pointer flex-shrink-0 ml-2"
                                    >
                                        <X className="h-5 w-5 sm:h-6 sm:w-6" />
                                    </button>
                                </div>

                                <div className="p-4 sm:p-6 overflow-y-auto max-h-[70vh]">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                                        <h3 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
                                            <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" />
                                            Contatos da Lista ({listContacts.length})
                                        </h3>
                                        <Link
                                            href={`/contacts?list=${selectedList.id}`}
                                            className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors self-start"
                                        >
                                            Ver todos os contatos
                                        </Link>
                                    </div>

                                    {listContacts.length === 0 ? (
                                        <div className="text-center py-8">
                                            <Users className="h-8 w-8 sm:h-12 sm:w-12 text-neutral-500 mx-auto mb-4" />
                                            <p className="text-neutral-400 text-sm sm:text-base">Esta lista ainda não possui contatos</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {listContacts.map((contact) => (
                                                <ContactItem key={contact.id} contact={contact} />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Import Modal */}
                    <ImportCSVModal
                        isOpen={showImportModal}
                        onClose={() => setShowImportModal(false)}
                        onSuccess={() => {
                            fetchLists();
                            setMessage({ type: 'success', text: 'Lista e contatos criados com sucesso!' });
                        }}
                        mailingLists={lists}
                        title="Importar e Criar Lista"
                    />
                </div>
            </div>
        </MainLayout>
    );
}