'use client';

import { useState, useRef } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, Download, X, Check, ArrowLeft, ArrowRight, Loader } from 'lucide-react';

interface MailingList {
    id: string;
    name: string;
    color: string;
    _count?: {
        contacts: number;
    };
}

interface ImportCSVModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    mailingLists: MailingList[];
    defaultListId?: string;
    title?: string;
}

interface ImportData {
    [key: string]: string;
}

interface ImportResults {
    success: number;
    errors: { row: number; error: string }[];
}

interface ImportProgress {
    current: number;
    total: number;
    percentage: number;
    currentItem?: string;
}

type ImportStep = 'upload' | 'mapping' | 'importing' | 'results';

// Funções de validação e normalização
const validateEmail = (email: string): boolean => {
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return emailRegex.test(email);
};

const validatePhoneNumber = (phone: string): boolean => {
    if (!phone) return true; // Telefone é opcional
    const cleaned = phone.replace(/[^\d+]/g, '');
    if (cleaned.startsWith('+')) {
        return cleaned.length >= 8 && cleaned.length <= 18;
    } else {
        return cleaned.length >= 8 && cleaned.length <= 15;
    }
};

const normalizeName = (name: string): string => {
    if (!name) return '';
    return name
        .trim()
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

const normalizeCompany = (company: string): string => {
    if (!company) return '';
    return company
        .trim()
        .split(' ')
        .map(word => {
            // Mantém siglas em maiúsculo (ex: CEO, CTO, LTDA)
            if (word.length <= 4 && word.toUpperCase() === word) {
                return word.toUpperCase();
            }
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        })
        .join(' ');
};

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
            '+1': { pattern: /^\+1(\d{10})$/, format: (match: RegExpMatchArray) => `+1 (${match[1].slice(0, 3)}) ${match[1].slice(3, 6)}-${match[1].slice(6)}` },
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

// Gerar CSV modelo
const generateSampleCSV = (): string => {
    const headers = [
        'Nome',
        'Email',
        'Telefone',
        'Cargo',
        'Empresa',
        'Website',
        'Nicho',
        'Pontos de Dor',
        'Interação Anterior',
        'Observações'
    ];

    const sampleData = [
        [
            'João Silva',
            'joao.silva@empresa.com',
            '(11) 99999-9999',
            'CEO',
            'Tech Solutions LTDA',
            'https://www.techsolutions.com',
            'Tecnologia',
            'Dificuldade em automatizar processos',
            'Reunião em janeiro de 2024',
            'Interessado em soluções de automação'
        ],
        [
            'Maria Santos',
            'maria.santos@startup.com',
            '+55 (21) 98888-8888',
            'CTO',
            'Startup Inovadora',
            'https://www.startup.com',
            'Software',
            'Falta de escalabilidade na infraestrutura',
            'Contato via LinkedIn',
            'Busca soluções em nuvem'
        ],
        [
            'Pedro Costa',
            'pedro@comercio.com',
            '(85) 97777-7777',
            'Diretor Comercial',
            'Comércio Digital ME',
            '',
            'E-commerce',
            'Baixa conversão no site',
            'Indicação de cliente',
            'Quer melhorar vendas online'
        ]
    ];

    const csvContent = [
        headers.join(','),
        ...sampleData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return csvContent;
};

const downloadSampleCSV = () => {
    const csvContent = generateSampleCSV();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'modelo_contatos.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

export default function ImportCSVModal({
    isOpen,
    onClose,
    onSuccess,
    mailingLists,
    defaultListId,
    title = 'Importar Contatos via CSV'
}: ImportCSVModalProps) {
    const [currentStep, setCurrentStep] = useState<ImportStep>('upload');
    const [importData, setImportData] = useState<ImportData[]>([]);
    const [importMapping, setImportMapping] = useState<{ [key: string]: string }>({});
    const [selectedListId, setSelectedListId] = useState<string>(defaultListId || '');
    const [createNewList, setCreateNewList] = useState(false);
    const [newListName, setNewListName] = useState('');
    const [importProgress, setImportProgress] = useState<ImportProgress>({ current: 0, total: 0, percentage: 0 });
    const [importResults, setImportResults] = useState<ImportResults | null>(null);
    const [isImporting, setIsImporting] = useState(false);
    const [error, setError] = useState<string>('');

    const fileInputRef = useRef<HTMLInputElement>(null);

    const resetModal = () => {
        setCurrentStep('upload');
        setImportData([]);
        setImportMapping({});
        setSelectedListId(defaultListId || '');
        setCreateNewList(false);
        setNewListName('');
        setImportProgress({ current: 0, total: 0, percentage: 0 });
        setImportResults(null);
        setIsImporting(false);
        setError('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleClose = () => {
        resetModal();
        onClose();
    };

    // Parse CSV
    const parseCSV = (text: string): ImportData[] => {
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
                    values.push(current.trim().replace(/"/g, ''));
                    current = '';
                } else {
                    current += char;
                }
            }
            values.push(current.trim().replace(/"/g, ''));

            if (values.length === headers.length) {
                const row: ImportData = {};
                headers.forEach((header, index) => {
                    row[header] = values[index] || '';
                });
                data.push(row);
            }
        }

        return data;
    };

    // Handle file upload
    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.name.toLowerCase().endsWith('.csv')) {
            setError('Por favor, selecione um arquivo CSV válido.');
            return;
        }

        setError('');
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result as string;
                const data = parseCSV(text);

                if (data.length === 0) {
                    setError('O arquivo CSV está vazio ou inválido.');
                    return;
                }

                setImportData(data);

                // Auto-mapping baseado nos nomes das colunas
                const headers = Object.keys(data[0]);
                const defaultMapping: { [key: string]: string } = {};

                headers.forEach(header => {
                    const lowerHeader = header.toLowerCase();
                    if (lowerHeader.includes('nome') || lowerHeader.includes('name')) {
                        defaultMapping['name'] = header;
                    } else if (lowerHeader.includes('email')) {
                        defaultMapping['email'] = header;
                    } else if (lowerHeader.includes('telefone') || lowerHeader.includes('phone') || lowerHeader.includes('celular')) {
                        defaultMapping['phone'] = header;
                    } else if (lowerHeader.includes('cargo') || lowerHeader.includes('position') || lowerHeader.includes('título')) {
                        defaultMapping['position'] = header;
                    } else if (lowerHeader.includes('empresa') || lowerHeader.includes('company')) {
                        defaultMapping['companyName'] = header;
                    } else if (lowerHeader.includes('website') || lowerHeader.includes('site')) {
                        defaultMapping['website'] = header;
                    } else if (lowerHeader.includes('nicho') || lowerHeader.includes('segmento') || lowerHeader.includes('setor')) {
                        defaultMapping['niche'] = header;
                    } else if (lowerHeader.includes('dor') || lowerHeader.includes('problema')) {
                        defaultMapping['painPoints'] = header;
                    } else if (lowerHeader.includes('interação') || lowerHeader.includes('historico')) {
                        defaultMapping['previousInteraction'] = header;
                    } else if (lowerHeader.includes('observação') || lowerHeader.includes('nota')) {
                        defaultMapping['notes'] = header;
                    }
                });

                setImportMapping(defaultMapping);
                setCurrentStep('mapping');
            } catch {
                setError('Erro ao processar o arquivo CSV.');
            }
        };
        reader.readAsText(file);
    };

    // Validate import data
    const validateImportData = (): { row: number; error: string }[] => {
        const errors: { row: number; error: string }[] = [];

        importData.forEach((row, index) => {
            const name = row[importMapping.name]?.trim();
            const email = row[importMapping.email]?.trim();
            const companyName = row[importMapping.companyName]?.trim();
            const phone = row[importMapping.phone]?.trim();

            if (!name) {
                errors.push({ row: index + 1, error: 'Nome é obrigatório' });
            }
            if (!email) {
                errors.push({ row: index + 1, error: 'Email é obrigatório' });
            } else if (!validateEmail(email)) {
                errors.push({ row: index + 1, error: 'Email inválido' });
            }
            if (!companyName) {
                errors.push({ row: index + 1, error: 'Empresa é obrigatória' });
            }
            if (phone && !validatePhoneNumber(phone)) {
                errors.push({ row: index + 1, error: 'Formato de telefone inválido' });
            }
        });

        return errors;
    };

    // Process import
    const processImport = async () => {
        setIsImporting(true);
        setCurrentStep('importing');

        // Validate data first
        const validationErrors = validateImportData();
        if (validationErrors.length > 0) {
            setImportResults({ success: 0, errors: validationErrors });
            setIsImporting(false);
            setCurrentStep('results');
            return;
        }

        // Create new list if needed
        let targetListId = selectedListId;
        if (createNewList && newListName.trim()) {
            try {
                const response = await fetch('/api/mailing-lists', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: newListName.trim(),
                        description: `Lista criada durante importação em ${new Date().toLocaleDateString('pt-BR')}`,
                        color: '#3b82f6'
                    }),
                });

                if (response.ok) {
                    const data = await response.json();
                    targetListId = data.mailingList.id;
                } else {
                    throw new Error('Erro ao criar lista');
                }
            } catch {
                setImportResults({
                    success: 0,
                    errors: [{ row: 0, error: 'Erro ao criar nova lista' }]
                });
                setIsImporting(false);
                setCurrentStep('results');
                return;
            }
        }

        // Initialize progress
        setImportProgress({ current: 0, total: importData.length, percentage: 0 });

        let successCount = 0;
        const importErrors: { row: number; error: string }[] = [];

        // Process each contact
        for (let i = 0; i < importData.length; i++) {
            const row = importData[i];

            // Update progress
            setImportProgress({
                current: i + 1,
                total: importData.length,
                percentage: Math.round(((i + 1) / importData.length) * 100),
                currentItem: row[importMapping.name] || `Linha ${i + 1}`
            });

            try {
                const contactData = {
                    name: normalizeName(row[importMapping.name] || ''),
                    email: row[importMapping.email]?.trim().toLowerCase() || '',
                    phone: formatPhoneNumber(row[importMapping.phone] || ''),
                    position: row[importMapping.position]?.trim() || '',
                    companyName: normalizeCompany(row[importMapping.companyName] || ''),
                    website: row[importMapping.website]?.trim() || '',
                    niche: row[importMapping.niche]?.trim() || '',
                    painPoints: row[importMapping.painPoints]?.trim() || '',
                    previousInteraction: row[importMapping.previousInteraction]?.trim() || '',
                    notes: row[importMapping.notes]?.trim() || `Importado via CSV em ${new Date().toLocaleDateString('pt-BR')}`,
                    isActive: true,
                    mailingListId: targetListId || undefined
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

            // Small delay to show progress
            await new Promise(resolve => setTimeout(resolve, 50));
        }

        setImportResults({ success: successCount, errors: importErrors });
        setIsImporting(false);
        setCurrentStep('results');

        if (successCount > 0) {
            onSuccess();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-neutral-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden border border-neutral-700">
                {/* Header */}
                <div className="p-6 border-b border-neutral-700 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Upload className="h-6 w-6 text-blue-400" />
                        <h2 className="text-xl font-bold text-white">{title}</h2>
                    </div>
                    <button
                        onClick={handleClose}
                        className="text-neutral-400 hover:text-white transition-colors cursor-pointer"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Progress Steps */}
                <div className="px-6 py-4 border-b border-neutral-700">
                    <div className="flex items-center justify-between">
                        {['upload', 'mapping', 'importing', 'results'].map((step, index) => {
                            const stepNames = {
                                upload: 'Upload',
                                mapping: 'Mapeamento',
                                importing: 'Importando',
                                results: 'Resultado'
                            };

                            const isActive = currentStep === step;
                            const isCompleted = ['upload', 'mapping', 'importing', 'results'].indexOf(currentStep) > index;

                            return (
                                <div key={step} className="flex items-center">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${isCompleted ? 'bg-green-600 text-white' :
                                            isActive ? 'bg-blue-600 text-white' :
                                                'bg-neutral-700 text-neutral-400'
                                        }`}>
                                        {isCompleted ? <Check className="h-4 w-4" /> : index + 1}
                                    </div>
                                    <span className={`ml-2 text-sm ${isActive ? 'text-white font-medium' :
                                            isCompleted ? 'text-green-400' :
                                                'text-neutral-400'
                                        }`}>
                                        {stepNames[step as keyof typeof stepNames]}
                                    </span>
                                    {index < 3 && (
                                        <div className={`w-8 h-0.5 mx-4 ${isCompleted ? 'bg-green-600' : 'bg-neutral-700'
                                            }`} />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[60vh]">
                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-900/50 border border-red-700 rounded-lg">
                            <div className="flex items-center gap-2">
                                <AlertCircle className="h-4 w-4 text-red-400" />
                                <span className="text-red-300">{error}</span>
                            </div>
                        </div>
                    )}

                    {/* Step 1: Upload */}
                    {currentStep === 'upload' && (
                        <div className="space-y-6">
                            <div className="text-center">
                                <FileText className="h-16 w-16 text-neutral-500 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-white mb-2">
                                    Selecione um arquivo CSV
                                </h3>
                                <p className="text-neutral-400 mb-6">
                                    Importe contatos em massa de forma rápida e organizada
                                </p>
                            </div>

                            {/* Download Sample */}
                            <div className="text-center mb-6">
                                <button
                                    onClick={downloadSampleCSV}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-800 text-white rounded-lg hover:bg-neutral-700 transition-colors border border-neutral-600 cursor-pointer"
                                >
                                    <Download className="h-4 w-4" />
                                    Baixar Modelo CSV
                                </button>
                                <p className="text-neutral-500 text-sm mt-2">
                                    Use este modelo para organizar seus dados corretamente
                                </p>
                            </div>

                            {/* File Upload */}
                            <div className="border-2 border-dashed border-neutral-600 rounded-lg p-8 text-center hover:border-neutral-500 transition-colors">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".csv"
                                    onChange={handleFileUpload}
                                    className="hidden"
                                    id="csv-upload"
                                />
                                <label
                                    htmlFor="csv-upload"
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

                            {/* List Selection */}
                            <div className="bg-neutral-800/50 rounded-lg p-4">
                                <h4 className="text-white font-medium mb-3">Lista de Destino (Opcional)</h4>

                                <div className="space-y-3">
                                    <label className="flex items-center gap-3">
                                        <input
                                            type="radio"
                                            name="listOption"
                                            checked={!createNewList}
                                            onChange={() => setCreateNewList(false)}
                                            className="w-4 h-4 text-blue-600 bg-neutral-800 border-neutral-600 focus:ring-blue-500"
                                        />
                                        <span className="text-white">Usar lista existente ou não vincular</span>
                                    </label>

                                    {!createNewList && (
                                        <select
                                            value={selectedListId}
                                            onChange={(e) => setSelectedListId(e.target.value)}
                                            className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:border-white cursor-pointer"
                                        >
                                            <option value="">Não vincular a nenhuma lista</option>
                                            {mailingLists.map(list => (
                                                <option key={list.id} value={list.id}>
                                                    {list.name} ({list._count?.contacts || 0} contatos)
                                                </option>
                                            ))}
                                        </select>
                                    )}

                                    <label className="flex items-center gap-3">
                                        <input
                                            type="radio"
                                            name="listOption"
                                            checked={createNewList}
                                            onChange={() => setCreateNewList(true)}
                                            className="w-4 h-4 text-blue-600 bg-neutral-800 border-neutral-600 focus:ring-blue-500"
                                        />
                                        <span className="text-white">Criar nova lista</span>
                                    </label>

                                    {createNewList && (
                                        <input
                                            type="text"
                                            placeholder="Nome da nova lista"
                                            value={newListName}
                                            onChange={(e) => setNewListName(e.target.value)}
                                            className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-white cursor-text"
                                        />
                                    )}
                                </div>
                            </div>

                            {/* Format Info */}
                            <div className="bg-neutral-800 rounded-lg p-4">
                                <h4 className="text-white font-medium mb-2">Campos Suportados:</h4>
                                <div className="text-sm text-neutral-300 space-y-1">
                                    <p>• <strong>Nome:</strong> Nome completo (obrigatório)</p>
                                    <p>• <strong>Email:</strong> Endereço de email válido (obrigatório)</p>
                                    <p>• <strong>Empresa:</strong> Nome da empresa (obrigatório)</p>
                                    <p>• <strong>Telefone:</strong> Número de telefone (opcional)</p>
                                    <p>• <strong>Cargo:</strong> Posição na empresa (opcional)</p>
                                    <p>• <strong>Website:</strong> Site da empresa (opcional)</p>
                                    <p>• <strong>Nicho:</strong> Segmento/setor de atuação (opcional)</p>
                                    <p>• <strong>Pontos de Dor:</strong> Problemas enfrentados (opcional)</p>
                                    <p>• <strong>Interação Anterior:</strong> Histórico de contato (opcional)</p>
                                    <p>• <strong>Observações:</strong> Notas adicionais (opcional)</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Mapping */}
                    {currentStep === 'mapping' && importData.length > 0 && (
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-semibold text-white mb-2">
                                    Mapeamento de Campos
                                </h3>
                                <p className="text-neutral-400 mb-4">
                                    Encontramos {importData.length} registros. Configure o mapeamento dos campos:
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[
                                    { key: 'name', label: 'Nome *', required: true },
                                    { key: 'email', label: 'Email *', required: true },
                                    { key: 'companyName', label: 'Empresa *', required: true },
                                    { key: 'phone', label: 'Telefone', required: false },
                                    { key: 'position', label: 'Cargo', required: false },
                                    { key: 'website', label: 'Website', required: false },
                                    { key: 'niche', label: 'Nicho/Segmento', required: false },
                                    { key: 'painPoints', label: 'Pontos de Dor', required: false },
                                    { key: 'previousInteraction', label: 'Interação Anterior', required: false },
                                    { key: 'notes', label: 'Observações', required: false },
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
                            {importMapping.name && importMapping.email && importMapping.companyName && (
                                <div>
                                    <h4 className="text-white font-medium mb-3">Preview (primeiros 3 registros):</h4>
                                    <div className="bg-neutral-800 rounded-lg p-4 space-y-3">
                                        {importData.slice(0, 3).map((row, index) => (
                                            <div key={index} className="text-sm text-neutral-300 border-b border-neutral-700 pb-3 last:border-b-0">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                    <p><strong>Nome:</strong> {normalizeName(row[importMapping.name] || 'N/A')}</p>
                                                    <p><strong>Email:</strong> {row[importMapping.email]?.toLowerCase() || 'N/A'}</p>
                                                    <p><strong>Empresa:</strong> {normalizeCompany(row[importMapping.companyName] || 'N/A')}</p>
                                                    {importMapping.phone && row[importMapping.phone] && (
                                                        <p><strong>Telefone:</strong> {formatPhoneNumber(row[importMapping.phone])}</p>
                                                    )}
                                                    {importMapping.position && row[importMapping.position] && (
                                                        <p><strong>Cargo:</strong> {row[importMapping.position]}</p>
                                                    )}
                                                    {importMapping.website && row[importMapping.website] && (
                                                        <p><strong>Website:</strong> {row[importMapping.website]}</p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 3: Importing */}
                    {currentStep === 'importing' && (
                        <div className="space-y-6">
                            <div className="text-center">
                                <Loader className="h-16 w-16 text-blue-400 mx-auto mb-4 animate-spin" />
                                <h3 className="text-lg font-semibold text-white mb-2">
                                    Importando Contatos
                                </h3>
                                <p className="text-neutral-400 mb-6">
                                    Por favor, aguarde enquanto processamos seus dados...
                                </p>
                            </div>

                            {/* Progress Bar */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-neutral-400">
                                        Progresso: {importProgress.current} de {importProgress.total}
                                    </span>
                                    <span className="text-blue-400 font-medium">
                                        {importProgress.percentage}%
                                    </span>
                                </div>
                                <div className="w-full bg-neutral-800 rounded-full h-3">
                                    <div
                                        className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                                        style={{ width: `${importProgress.percentage}%` }}
                                    />
                                </div>
                                {importProgress.currentItem && (
                                    <p className="text-neutral-400 text-sm text-center">
                                        Processando: <span className="text-white">{importProgress.currentItem}</span>
                                    </p>
                                )}
                            </div>

                            <div className="text-center">
                                <p className="text-neutral-500 text-sm">
                                    Validando dados, normalizando informações e criando contatos...
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Results */}
                    {currentStep === 'results' && importResults && (
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
                                <p className="text-neutral-400">
                                    {importResults.success > 0
                                        ? `${importResults.success} contatos foram importados com sucesso!`
                                        : 'Nenhum contato foi importado devido aos erros encontrados.'
                                    }
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-green-900/20 border border-green-700 rounded-lg p-4">
                                    <h4 className="text-green-300 font-medium mb-2">Sucessos</h4>
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
                                                <strong>Linha {error.row}:</strong> {error.error}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-neutral-700 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {currentStep === 'mapping' && (
                            <button
                                onClick={() => setCurrentStep('upload')}
                                className="flex items-center gap-2 px-4 py-2 bg-neutral-800 text-white rounded-lg hover:bg-neutral-700 transition-colors border border-neutral-600 cursor-pointer"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Voltar
                            </button>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleClose}
                            disabled={isImporting}
                            className="px-4 py-2 bg-neutral-800 text-white rounded-lg hover:bg-neutral-700 transition-colors border border-neutral-600 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                        >
                            {importResults ? 'Fechar' : 'Cancelar'}
                        </button>
                        {currentStep === 'mapping' &&
                            importMapping.name &&
                            importMapping.email &&
                            importMapping.companyName &&
                            (!createNewList || newListName.trim()) && (
                                <button
                                    onClick={processImport}
                                    disabled={isImporting}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                                >
                                    <ArrowRight className="h-4 w-4" />
                                    {isImporting ? 'Importando...' : `Importar ${importData.length} Contatos`}
                                </button>
                            )}
                    </div>
                </div>
            </div>
        </div>
    );
} 