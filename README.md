# 🚀 Script Maker - Gerador Inteligente de Emails de Prospecção

Uma plataforma completa para criar, gerenciar e enviar emails de prospecção personalizados usando IA da OpenAI. Transforme sua estratégia de vendas com scripts inteligentes e templates reutilizáveis.

## ✨ Funcionalidades Principais

### 🤖 Geração Inteligente com IA
- **Scripts Personalizados**: Criação automática usando GPT-4 da OpenAI
- **Instruções Customizadas**: Defina objetivos específicos para cada campanha
- **Múltiplos Tipos**: Primeiro contato, follow-up, apresentação e agendamento
- **Tom Personalizável**: Formal, casual, persuasivo ou amigável

### 📧 Três Modos de Criação
1. **Scripts Genéricos**: Templates reutilizáveis com placeholders
2. **Criação Manual**: Inserção direta dos dados do prospect
3. **Baseado em Contatos**: Seleção de contatos já cadastrados

### 👥 Gerenciamento de Contatos
- **Lista Completa**: Visualize todos os contatos cadastrados
- **Avatares Automáticos**: Geração de avatares coloridos baseados no nome
- **Busca e Filtros**: Encontre contatos rapidamente
- **Informações Detalhadas**: Nome, empresa, cargo, email e mais

### 📨 Sistema de Envio
- **Envio Direto**: Integração com SMTP para envio automático
- **Preview Isolado**: Visualização segura dos templates sem interferência CSS
- **Tracking de Emails**: Acompanhe emails enviados e status de entrega
- **Histórico Completo**: Mantenha registro de todas as comunicações

### 🎨 Interface Moderna
- **Design Dark**: Interface elegante com tema escuro
- **Responsiva**: Funciona perfeitamente em desktop e mobile
- **UX Otimizada**: Navegação intuitiva e fluxos simplificados
- **Componentes Reutilizáveis**: Arquitetura modular e escalável

## 🛠️ Stack Tecnológica

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: TailwindCSS 4, Lucide React Icons
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: MySQL com suporte a outros bancos
- **IA**: OpenAI GPT-4 API
- **Email**: Nodemailer com SMTP
- **Tipografia**: Fonte Geist

## 📦 Instalação e Configuração

### 1. Clone e Instale

```bash
git clone <url-do-repositorio>
cd script_maker
npm install
```

### 2. Configure Variáveis de Ambiente

```bash
cp .env.example .env.local
```

Edite o arquivo `.env.local` com suas configurações:

```env
ENCRYPTION_KEY=your-32-encryption-key
DATABASE_URL="mysql://username:password@localhost:3306/script_maker"
```

### 3. Configure o Banco de Dados

#### Opção A: MySQL Local
```bash
# Instale MySQL e crie o banco
mysql -u root -p
CREATE DATABASE script_maker;

# Execute as migrations
npx prisma migrate dev --name init
npx prisma generate
```

#### Opção B: Banco na Nuvem
Use serviços como PlanetScale, Railway ou Amazon RDS e configure a `DATABASE_URL`.

### 4. Execute o Projeto

```bash
# Desenvolvimento
npm run dev

# Produção
npm run build
npm start
```

## 🔑 Configuração da OpenAI API

1. Acesse [platform.openai.com](https://platform.openai.com)
2. Crie uma conta ou faça login
3. Vá para "API Keys" e crie uma nova chave
4. Adicione a chave no arquivo `.env.local`
5. Certifique-se de ter créditos na conta OpenAI

## 📱 Como Usar

### Dashboard Principal
- Visualize estatísticas de scripts e emails
- Acesso rápido às principais funcionalidades
- Resumo de atividades recentes

### Criando Scripts

#### 1. Scripts Genéricos (Recomendado)
- Crie templates reutilizáveis com placeholders
- Use `[Nome do Contato]`, `[Nome da Empresa]`, etc.
- Ideal para campanhas em massa
- Identificados com badge "Template Reutilizável"

#### 2. Scripts Personalizados
- Selecione um contato existente
- Preencha dados específicos do prospect
- Configure tom, tamanho e call-to-action
- Adicione instruções customizadas

#### 3. Criação Manual
- Insira dados diretamente no formulário
- Ideal para prospects únicos
- Máxima personalização

### Gerenciando Contatos
1. Vá para "Contatos"
2. Adicione novos contatos com informações completas
3. Use a busca para encontrar contatos específicos
4. Edite ou remova contatos conforme necessário

### Enviando Emails
1. Acesse "Enviar Email"
2. Selecione contatos da lista
3. Escolha um script existente
4. Personalize variáveis se necessário
5. Envie ou agende o envio

## 📁 Estrutura do Projeto

```
script_maker/
├── src/
│   ├── app/                    # App Router Next.js
│   │   ├── api/               # API Routes
│   │   │   ├── contacts/      # CRUD de contatos
│   │   │   ├── scripts/       # CRUD de scripts
│   │   │   ├── send-email/    # Envio de emails
│   │   │   └── generate-script/ # Geração com IA
│   │   ├── contacts/          # Página de contatos
│   │   ├── scripts/           # Página de scripts
│   │   ├── send-email/        # Página de envio
│   │   ├── templates/         # Página de templates
│   │   ├── sent-emails/       # Histórico de envios
│   │   └── create/            # Página de criação
│   ├── components/            # Componentes React
│   │   ├── ui/               # Componentes base
│   │   └── forms/            # Formulários específicos
│   ├── lib/                  # Utilitários e configurações
│   │   ├── database.ts       # Cliente Prisma
│   │   ├── openai.ts         # Cliente OpenAI
│   │   ├── scripts.ts        # Funções de scripts
│   │   └── settings.ts       # Configurações
│   └── types/                # Tipos TypeScript
├── prisma/
│   ├── schema.prisma         # Schema do banco
│   └── seed.ts              # Dados iniciais
└── public/                   # Arquivos estáticos
```

## 🚀 Deploy

### Vercel (Recomendado)
1. Conecte seu repositório GitHub
2. Configure as variáveis de ambiente
3. Deploy automático a cada push

### Outras Plataformas
- **Railway**: Suporte nativo a MySQL
- **Netlify**: Para sites estáticos
- **Heroku**: Com add-ons de banco

### Variáveis de Produção
Certifique-se de configurar:
- `DATABASE_URL`
- `ENCRYPTION_KEY`

## 🔧 Comandos Úteis

```bash
# Banco de dados
npx prisma studio              # Interface visual do banco
npx prisma migrate reset       # Reset completo
npx prisma db push            # Sincronizar schema
npx prisma generate           # Gerar cliente

# Desenvolvimento
npm run dev                   # Servidor de desenvolvimento
npm run build                # Build de produção
npm run lint                 # Verificar código
npm run type-check           # Verificar tipos

# Limpeza
npm run clean                # Limpar cache e builds
```

## 🎯 Funcionalidades Avançadas

### Templates com CSS Isolado
- Visualização segura sem interferência no CSS principal
- Suporte a templates HTML complexos
- Preview em iframe isolado

### Sistema de Badges
- Identificação visual de scripts genéricos
- Status de envio de emails
- Categorização automática

### Busca Inteligente
- Busca por nome, empresa ou conteúdo
- Filtros por tipo de script
- Ordenação por data e relevância

### Avatares Dinâmicos
- Geração automática baseada no nome
- Cores aleatórias para diferenciação
- Fallback para iniciais

## 📊 Métricas e Analytics

- Total de scripts criados
- Taxa de abertura de emails (se configurado)
- Contatos mais ativos
- Performance por tipo de script

## 🔒 Segurança

- Validação de dados no frontend e backend
- Sanitização de HTML em templates
- Proteção contra XSS em previews
- Variáveis de ambiente seguras

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo LICENSE para mais detalhes.

## 🆘 Suporte

Para dúvidas ou problemas:
1. Verifique a documentação
2. Consulte as issues no GitHub
3. Crie uma nova issue se necessário

---

**Desenvolvido com ❤️ para revolucionar sua estratégia de prospecção**
