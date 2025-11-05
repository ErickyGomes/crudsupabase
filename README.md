# Sistema de Gerenciamento de Fretes e Leilão

Sistema completo para gerenciamento de fretes, pedidos e simulação de leilão de frete, desenvolvido com React, TypeScript, Vite e Supabase.

## 🚀 Funcionalidades

### 📦 Gerenciamento de Fretes
- Upload de arquivos Excel com dados de frete
- Filtros dinâmicos (UF, Transportadora, Frete, Prazo, CEP)
- Ordenação personalizada (mais barato, mais rápido, etc.)
- Tabela pivot com CEPs nas linhas e Transportadoras nas colunas
- Cards que se ajustam conforme filtros aplicados
- Identificação automática de transportadora mais barata e mais rápida
- Exportação para Excel (XLSX)

### 🛒 Leilão de Fretes - Pedidos
- Upload de pedidos dos clientes via Excel
- Simulação de leilão de frete comparando transportadoras
- Filtros por UF, CEP e Cliente
- Tabela pivot mostrando resultados do leilão
- Identificação de vencedores (mais barato e mais rápido)
- Exportação completa dos resultados para Excel

### 👥 Gerenciamento de Usuários
- CRUD completo de usuários
- Autenticação com Supabase Auth
- Sistema de login e cadastro

## 🛠 Tecnologias

- **React 19** + **TypeScript**
- **Vite** - Build tool
- **Mantine UI 8** - Componentes de interface
- **Supabase** - Banco de dados PostgreSQL + Auth + Storage
- **XLSX** - Processamento de arquivos Excel
- **React Router DOM** - Navegação

## 📋 Pré-requisitos

- Node.js 18+ 
- Conta no Supabase
- Git

## 🚀 Instalação

1. Clone o repositório:
```bash
git clone https://github.com/ErickyGomes/crudsupabase.git
cd crudsupabase-main
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env
```

Edite o arquivo `.env` e adicione suas credenciais do Supabase:
```
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima
```

4. Execute as migrações SQL no Supabase:
   - `supabase/migrations/001_process_storage_file.sql`
   - `supabase/migrations/003_fix_process_json_data.sql`
   - `supabase/migrations/004_create_pedidos_table.sql`

5. Execute o projeto:
```bash
npm run dev
```

## 📚 Documentação

Consulte a [DOCUMENTACAO.md](./DOCUMENTACAO.md) para informações detalhadas sobre:
- Estrutura do projeto
- Configuração do Supabase
- Guias passo a passo
- Formato dos arquivos Excel

## 📖 Guias Disponíveis

- [GUIA_FRETE.md](./GUIA_FRETE.md) - Configuração do sistema de fretes
- [GUIA_SUPABASE.md](./GUIA_SUPABASE.md) - Configuração do Supabase
- [GUIA_UPLOAD_XLSX.md](./GUIA_UPLOAD_XLSX.md) - Como fazer upload de arquivos Excel
- [GUIA_PROCESSAMENTO_AUTOMATICO.md](./GUIA_PROCESSAMENTO_AUTOMATICO.md) - Processamento automático
- [GUIA_BACKEND_CONVERSAO.md](./GUIA_BACKEND_CONVERSAO.md) - Backend e conversão

## 🎯 Uso

### Gerenciamento de Fretes

1. Acesse a página **Fretes**
2. Faça upload de um arquivo Excel com dados de frete (veja formato em GUIA_FRETE.md)
3. Use os filtros para encontrar transportadoras específicas
4. Visualize os resultados na tabela pivot
5. Exporte os dados filtrados para Excel

### Leilão de Fretes

1. Acesse a página **Pedidos**
2. Na aba "Upload de Pedidos", faça upload de um arquivo Excel com pedidos dos clientes
3. Use os filtros se necessário
4. Clique em "Simular Leilão" para comparar transportadoras
5. Visualize os resultados na tabela pivot
6. Exporte os resultados para Excel

## 📝 Formato dos Arquivos Excel

### Fretes
- Colunas: CEP, UF, Transportadora, Frete, Prazo
- Aceita variações de nomes (veja GUIA_FRETE.md)

### Pedidos
- Colunas: CEP, UF, Pedido ID (opcional), Cliente (opcional)
- Aceita variações de nomes (CEP Destino, Estado, etc.)

## 🔧 Estrutura do Projeto

```
src/
├── pages/
│   ├── Login.tsx
│   ├── Signup.tsx
│   ├── Users.tsx
│   ├── Frete.tsx          # Gerenciamento de fretes
│   ├── Pedidos.tsx           # Leilão de fretes
│   └── Upload.tsx
├── services/
│   ├── freteService.ts
│   ├── pedidoService.ts      # Serviço de pedidos e leilão
│   └── uploadService.ts
├── types/
│   ├── frete.ts
│   └── pedido.ts             # Tipos para pedidos
└── components/
    ├── Layout.tsx
    └── Sidebar.tsx
```

## 📄 Licença

Este projeto está sob a licença MIT.

## 👤 Autor

ErickyGomes

## 🔗 Links

- [Repositório GitHub](https://github.com/ErickyGomes/crudsupabase)
- [Supabase](https://supabase.com)
