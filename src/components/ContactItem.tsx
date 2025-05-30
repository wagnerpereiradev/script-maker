import React from 'react';
import {
    User,
    Building2,
    Mail,
    Phone,
    Globe,
    Calendar,
    MessageSquare,
    Power,
    PowerOff,
    Check
} from 'lucide-react';

interface Contact {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    position?: string | null;
    companyName: string;
    website?: string | null;
    niche?: string | null;
    painPoints?: string | null;
    notes?: string | null;
    isActive: boolean;
    updatedAt?: Date | string;
    mailingList?: {
        id: string;
        name: string;
        color: string;
    } | null;
}

interface ContactItemProps {
    contact: Contact;
    onContactClick?: (contact: Contact) => void;
    isSelected?: boolean;
    showActions?: boolean;
    showCheckbox?: boolean;
    onToggleSelect?: (contactId: string) => void;
    actionButtons?: React.ReactNode;
    selectionMode?: 'click' | 'checkbox';
}

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

    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        const char = name.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }

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

    let cleaned = phone.replace(/[^\d+]/g, '');

    if (!cleaned.startsWith('+')) {
        cleaned = cleaned.replace(/^0+/, '');

        if (cleaned.length === 11) {
            return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
        } else if (cleaned.length === 10) {
            return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
        } else if (cleaned.length === 13 && cleaned.startsWith('55')) {
            return `+55 (${cleaned.slice(2, 4)}) ${cleaned.slice(4, 9)}-${cleaned.slice(9)}`;
        } else if (cleaned.length === 12 && cleaned.startsWith('55')) {
            return `+55 (${cleaned.slice(2, 4)}) ${cleaned.slice(4, 8)}-${cleaned.slice(8)}`;
        } else if (cleaned.length >= 8) {
            return `+55 ${cleaned}`;
        }
    } else {
        const countryPatterns = {
            '+55': {
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
            }
        };

        for (const [code, config] of Object.entries(countryPatterns)) {
            if (cleaned.startsWith(code)) {
                const match = cleaned.match(config.pattern);
                if (match) {
                    return config.format(match);
                }
            }
        }

        const genericMatch = cleaned.match(/^\+(\d{1,4})(\d+)$/);
        if (genericMatch) {
            const countryCode = genericMatch[1];
            const number = genericMatch[2];
            if (number.length >= 8) {
                const formatted = number.replace(/(\d{2,4})(?=\d)/g, '$1 ');
                return `+${countryCode} ${formatted.trim()}`;
            }
            return `+${countryCode} ${number}`;
        }
    }

    return phone;
};

// Custom Checkbox Component
const CustomCheckbox: React.FC<{ checked: boolean; onChange: () => void; }> = ({ checked, onChange }) => {
    return (
        <div
            onClick={onChange}
            className={`w-5 h-5 rounded border-2 cursor-pointer transition-all flex items-center justify-center ${checked
                ? 'bg-blue-600 border-blue-600'
                : 'border-neutral-600 hover:border-neutral-500'
                }`}
        >
            {checked && <Check className="h-3 w-3 text-white" />}
        </div>
    );
};

export const ContactItem: React.FC<ContactItemProps> = ({
    contact,
    onContactClick,
    isSelected = false,
    showActions = false,
    showCheckbox = false,
    onToggleSelect,
    actionButtons,
    selectionMode = 'click'
}) => {
    const handleClick = () => {
        if (selectionMode === 'click' && onContactClick) {
            onContactClick(contact);
        }
    };

    const handleCheckboxClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onToggleSelect) {
            onToggleSelect(contact.id);
        }
    };

    return (
        <div
            className={`bg-neutral-gradient rounded-lg p-4 border transition-all cursor-pointer ${isSelected
                ? 'border-blue-500 bg-blue-900/20'
                : 'border-neutral-700 hover:border-neutral-600 hover:bg-neutral-800'
                }`}
            onClick={handleClick}
        >
            <div className="flex items-center gap-3">
                {/* Checkbox */}
                {showCheckbox && onToggleSelect && (
                    <div className="flex-shrink-0" onClick={handleCheckboxClick}>
                        <CustomCheckbox
                            checked={isSelected}
                            onChange={() => onToggleSelect(contact.id)}
                        />
                    </div>
                )}

                {/* Avatar */}
                <div className="flex-shrink-0">
                    <div className={`w-10 h-10 rounded-full ${getAvatarColor(contact.name)} flex items-center justify-center text-white font-semibold text-sm shadow-lg`}>
                        {getInitials(contact.name)}
                    </div>
                </div>

                {/* Conteúdo Principal */}
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

                            {/* Linha 2: Empresa + Email + Lista */}
                            <div className="flex items-center gap-4 mb-1">
                                <div className="flex items-center gap-1.5 text-sm">
                                    <Building2 className="h-3.5 w-3.5 text-neutral-500 flex-shrink-0" />
                                    <span className="truncate text-blue-300 font-medium">{contact.companyName}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-sm text-neutral-300">
                                    <Mail className="h-3.5 w-3.5 text-neutral-500 flex-shrink-0" />
                                    <span className="truncate">{contact.email}</span>
                                </div>
                                {contact.mailingList && (
                                    <div className="flex items-center gap-1.5 text-sm">
                                        <div
                                            className="w-2 h-2 rounded-full flex-shrink-0"
                                            style={{ backgroundColor: contact.mailingList.color }}
                                        />
                                        <span className="truncate text-neutral-400 text-xs">
                                            {contact.mailingList.name}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Linha 3: Informações adicionais */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4 text-xs text-neutral-400">
                                    {contact.phone && (
                                        <div className="flex items-center gap-1.5">
                                            <Phone className="h-3 w-3 flex-shrink-0" />
                                            <span>{formatPhoneNumber(contact.phone)}</span>
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
                                {contact.updatedAt && (
                                    <div className="flex items-center text-xs text-neutral-500 flex-shrink-0">
                                        <Calendar className="h-3 w-3 mr-1" />
                                        {new Date(contact.updatedAt).toLocaleDateString('pt-BR')}
                                    </div>
                                )}
                            </div>

                            {/* Notas (se existir) */}
                            {contact.notes && (
                                <div className="flex items-start gap-1.5 text-xs text-neutral-400 mt-1">
                                    <MessageSquare className="h-3 w-3 mt-0.5 text-neutral-500 flex-shrink-0" />
                                    <p className="truncate">{contact.notes}</p>
                                </div>
                            )}
                        </div>

                        {/* Botões de Ação ou Ícone de Seleção */}
                        {showActions && actionButtons ? (
                            <div className="flex gap-1.5 flex-shrink-0">
                                {actionButtons}
                            </div>
                        ) : isSelected && selectionMode === 'click' ? (
                            <div className="ml-3">
                                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                                    <Check className="w-4 h-4 text-white" />
                                </div>
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ContactItem; 