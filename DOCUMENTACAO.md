# Documentação Completa: Sistema de Auditoria com Login, CRUD de Usuários e Gerenciamento de Fretes

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Tecnologias Utilizadas](#tecnologias-utilizadas)
3. [Estrutura do Projeto](#estrutura-do-projeto)
4. [Instalação e Configuração](#instalação-e-configuração)
5. [Como Funciona Cada Parte](#como-funciona-cada-parte)
6. [Guia Passo a Passo para Replicar](#guia-passo-a-passo-para-replicar)
7. [Explicação Detalhada dos Arquivos](#explicação-detalhada-dos-arquivos)
8. [Conceitos Importantes](#conceitos-importantes)
9. [Integração com Supabase (Banco de Dados Real)](#integração-com-supabase-banco-de-dados-real)
   - [Opção 1: Usar Auth do Supabase (Recomendado)](#opção-1-usar-auth-do-supabase-recomendado)
   - [Opção 2: Tabela Manual](#opção-2-tabela-manual-mais-simples)
10. [Sistema de Navegação (Sidebar)](#sistema-de-navegação-sidebar)
11. [Sistema de Upload e Gerenciamento de Fretes](#sistema-de-upload-e-gerenciamento-de-fretes)
   - [Processamento Automático Excel → Parquet → Storage → Banco](#processamento-automático-excel--parquet--storage--banco)
12. [Personalização e Extensões](#personalização-e-extensões)

---

## 🎯 Visão Geral

Este projeto é um sistema completo de auditoria desenvolvido com React, TypeScript, Vite e Mantine UI, incluindo autenticação, gerenciamento de usuários e sistema de frete com upload de arquivos Excel.

### O que o sistema faz:

1. **Autenticação**:
   - Tela de Login com validação de email não confirmado
   - Tela de Cadastro (Signup)
   - Sistema de autenticação seguro com Supabase Auth

2. **Gerenciamento de Usuários** (CRUD completo):
   - Ver lista de todos os usuários
   - Criar novos usuários
   - Editar usuários existentes
   - Excluir usuários

3. **Sistema de Navegação**:
   - Sidebar fixo com menu lateral
   - Navegação entre páginas
   - Indicador de página ativa

4. **Sistema de Fretes** (CRUD completo):
   - Upload de arquivos Excel (.xlsx)
   - Conversão automática para Parquet
   - Upload para Supabase Storage
   - Inserção automática no banco de dados
   - Visualização resumida por UF (quantidade de CEPs, média de frete, média de prazo)
   - Visualização detalhada de todos os registros por UF
   - Exclusão de dados por UF

5. **Proteção de Rotas**: Impede acesso às páginas sem estar autenticado

---

## 🛠 Tecnologias Utilizadas

### Bibliotecas Principais

- **React 19**: Biblioteca JavaScript para criar interfaces de usuário
- **TypeScript**: Adiciona tipagem estática ao JavaScript
- **Vite**: Ferramenta de build rápida para desenvolvimento
- **Mantine UI 8**: Biblioteca de componentes visuais prontos
- **React Router DOM**: Gerencia navegação entre páginas
- **Tabler Icons**: Biblioteca de ícones
- **Supabase**: Banco de dados PostgreSQL + Auth + Storage
- **XLSX**: Biblioteca para ler arquivos Excel
- **ParquetJS**: Biblioteca para conversão de dados (Parquet)
- **Mantine Dropzone**: Componente de upload de arquivos

### Por que essas tecnologias?

- **React**: É a biblioteca mais popular para criar interfaces web modernas
- **TypeScript**: Ajuda a evitar erros comuns e torna o código mais seguro
- **Vite**: Extremamente rápido para desenvolvimento
- **Mantine UI**: Fornece componentes bonitos e funcionais prontos para uso
- **React Router**: Necessário para ter múltiplas páginas em uma aplicação React

---

## 📁 Estrutura do Projeto

```
auditoria/
├── src/
│   ├── pages/              # Páginas da aplicação
│   │   ├── Login.tsx       # Tela de login
│   │   ├── Signup.tsx      # Tela de cadastro
│   │   ├── Users.tsx       # Tela de gerenciamento de usuários
│   │   ├── Frete.tsx       # Tela de gerenciamento de fretes
│   │   └── Upload.tsx       # Tela de upload de arquivos
│   ├── components/         # Componentes reutilizáveis
│   │   ├── Sidebar.tsx     # Menu lateral de navegação
│   │   └── Layout.tsx      # Layout com sidebar
│   ├── contexts/           # Contextos React (gerenciamento de estado global)
│   │   └── AuthContext.tsx # Contexto de autenticação
│   ├── services/           # Serviços (lógica de negócio)
│   │   ├── userService.ts  # Serviço para operações com usuários
│   │   ├── freteService.ts # Serviço para operações com fretes
│   │   └── uploadService.ts # Serviço para upload e processamento de arquivos
│   ├── types/              # Definições de tipos TypeScript
│   │   ├── user.ts         # Tipos relacionados a usuários
│   │   └── frete.ts        # Tipos relacionados a fretes
│   ├── lib/                # Bibliotecas e configurações
│   │   └── supabase.ts     # Configuração do cliente Supabase
│   ├── App.tsx             # Componente principal com rotas
│   └── main.tsx            # Ponto de entrada da aplicação
├── package.json            # Dependências do projeto
├── DOCUMENTACAO.md         # Esta documentação
├── GUIA_SUPABASE.md        # Guia de integração básica com Supabase
├── GUIA_SUPABASE_AUTH.md   # Guia de integração com Auth do Supabase
├── GUIA_FRETE.md           # Guia de configuração do sistema de fretes
└── GUIA_UPLOAD_XLSX.md     # Guia de upload de arquivos Excel
```

### Explicação das Pastas

- **pages/**: Cada arquivo aqui é uma página completa da aplicação
- **contexts/**: Armazena estado global que pode ser usado em qualquer lugar
- **services/**: Contém funções que fazem operações (como salvar, buscar dados)
- **types/**: Define a estrutura dos dados (como um usuário deve ser)
- **App.tsx**: Define as rotas e como navegar entre páginas
- **main.tsx**: Inicializa a aplicação React

---

## 🚀 Instalação e Configuração

### Pré-requisitos

Você precisa ter instalado:
- **Node.js** (versão 18 ou superior)
- **Yarn** ou **npm** (gerenciador de pacotes)

### Passo 1: Criar um novo projeto Vite

```bash
# Usando npm
npm create vite@latest meu-projeto -- --template react-ts

# Ou usando yarn
yarn create vite meu-projeto --template react-ts
```

### Passo 2: Instalar dependências base

```bash
cd meu-projeto
yarn install
# ou
npm install
```

### Passo 3: Instalar Mantine UI

```bash
yarn add @mantine/core @mantine/form @mantine/hooks
yarn add @mantine/notifications @mantine/dropzone
yarn add @tabler/icons-react
```

### Passo 4: Instalar React Router

```bash
yarn add react-router-dom
```

### Passo 5: Instalar Supabase e Bibliotecas de Upload

```bash
yarn add @supabase/supabase-js
yarn add xlsx parquetjs
```

**Nota:** `parquetjs` pode ter algumas dependências. Se houver problemas, você pode usar apenas XLSX e fazer a conversão para Parquet no backend.

### Passo 6: Configurar PostCSS (para Mantine)

Crie ou atualize o arquivo `postcss.config.cjs`:

```javascript
module.exports = {
  plugins: {
    'postcss-preset-mantine': {},
    'postcss-simple-vars': {
      variables: {
        'mantine-breakpoint-xs': '36em',
        'mantine-breakpoint-sm': '48em',
        'mantine-breakpoint-md': '62em',
        'mantine-breakpoint-lg': '75em',
        'mantine-breakpoint-xl': '88em',
      },
    },
  },
};
```

### Passo 7: Executar o projeto

```bash
yarn dev
# ou
npm run dev
```

O projeto estará rodando em `http://localhost:5173`

---

## 🔍 Como Funciona Cada Parte

### 1. Sistema de Autenticação (AuthContext)

**O que é?** Um contexto React que gerencia o estado de autenticação em toda a aplicação.

**Como funciona?**
- Quando você faz login, o sistema salva no `localStorage` que você está autenticado
- Todas as páginas podem verificar se você está logado
- Quando você faz logout, remove essa informação

**Código-chave:**
```typescript
// Verifica se está autenticado
const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';

// Faz login
localStorage.setItem('isAuthenticated', 'true');

// Faz logout
localStorage.removeItem('isAuthenticated');
```

### 2. Proteção de Rotas

**O que é?** Um componente que verifica se o usuário está autenticado antes de mostrar uma página.

**Como funciona?**
- Se você está autenticado → mostra a página
- Se não está → redireciona para a página de login

**Código-chave:**
```typescript
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}
```

### 3. CRUD de Usuários

**CRUD significa:**
- **C**reate (Criar): Adicionar novos usuários
- **R**ead (Ler): Ver lista de usuários
- **U**pdate (Atualizar): Modificar usuários existentes
- **D**elete (Excluir): Remover usuários

**Como funciona cada operação:**

1. **Criar**: Preenche formulário → salva novo usuário → atualiza lista
2. **Ler**: Carrega lista de usuários → exibe em tabela
3. **Atualizar**: Abre formulário com dados do usuário → modifica → salva → atualiza lista
4. **Excluir**: Confirma exclusão → remove usuário → atualiza lista

### 4. Formulários com Validação

**O que é?** Formulários que verificam se os dados estão corretos antes de enviar.

**Validações implementadas:**
- Email deve ter formato válido (ex: `usuario@email.com`)
- Senha deve ter pelo menos 3 caracteres
- Campos obrigatórios não podem estar vazios

---

## 📝 Guia Passo a Passo para Replicar

### Passo 1: Criar a estrutura de pastas

Crie as seguintes pastas dentro de `src/`:

```
src/
├── pages/
├── contexts/
├── services/
└── types/
```

### Passo 2: Criar os tipos TypeScript

Crie `src/types/user.ts`:

```typescript
export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  role: string;
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  password?: string;
  role?: string;
}
```

**O que isso faz?** Define a estrutura dos dados. É como um "contrato" que diz como um usuário deve ser.

### Passo 3: Criar o contexto de autenticação

Crie `src/contexts/AuthContext.tsx`:

```typescript
import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('isAuthenticated') === 'true';
  });

  const login = async (email: string, password: string): Promise<boolean> => {
    if (email && password) {
      localStorage.setItem('isAuthenticated', 'true');
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    localStorage.removeItem('isAuthenticated');
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
```

**O que isso faz?**
- Cria um "contexto" que pode ser usado em qualquer lugar da aplicação
- Gerencia se o usuário está logado ou não
- Fornece funções `login` e `logout`

### Passo 4: Criar o serviço de usuários

Crie `src/services/userService.ts`:

```typescript
import type { User, CreateUserData, UpdateUserData } from '../types/user';

// Simulação de armazenamento em memória (em produção, seria uma API)
let users: User[] = [
  {
    id: '1',
    name: 'Admin',
    email: 'admin@example.com',
    role: 'admin',
    createdAt: new Date().toISOString(),
  },
];

export const userService = {
  getAll: async (): Promise<User[]> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return [...users];
  },

  getById: async (id: string): Promise<User | null> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return users.find((u) => u.id === id) || null;
  },

  create: async (data: CreateUserData): Promise<User> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const newUser: User = {
      id: Date.now().toString(),
      name: data.name,
      email: data.email,
      role: data.role,
      createdAt: new Date().toISOString(),
    };
    users.push(newUser);
    return newUser;
  },

  update: async (id: string, data: UpdateUserData): Promise<User | null> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const userIndex = users.findIndex((u) => u.id === id);
    if (userIndex === -1) return null;

    users[userIndex] = {
      ...users[userIndex],
      ...data,
    };
    return users[userIndex];
  },

  delete: async (id: string): Promise<boolean> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const userIndex = users.findIndex((u) => u.id === id);
    if (userIndex === -1) return false;

    users.splice(userIndex, 1);
    return true;
  },
};
```

**O que isso faz?**
- Simula um banco de dados em memória (os dados são perdidos ao recarregar a página)
- Fornece funções para todas as operações CRUD
- Em produção, você substituiria isso por chamadas a uma API real

### Passo 5: Criar a página de Login

Crie `src/pages/Login.tsx`:

```typescript
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Title,
  TextInput,
  PasswordInput,
  Button,
  Stack,
  Text,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useAuth } from '../contexts/AuthContext';
import { notifications } from '@mantine/notifications';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);

  const form = useForm({
    initialValues: {
      email: '',
      password: '',
    },
    validate: {
      email: (value) => (!value ? 'Email é obrigatório' : /^\S+@\S+$/.test(value) ? null : 'Email inválido'),
      password: (value) => (!value ? 'Senha é obrigatória' : value.length < 3 ? 'Senha deve ter pelo menos 3 caracteres' : null),
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);
    try {
      const success = await login(values.email, values.password);
      if (success) {
        notifications.show({
          title: 'Sucesso',
          message: 'Login realizado com sucesso!',
          color: 'green',
        });
        navigate('/users');
      } else {
        notifications.show({
          title: 'Erro',
          message: 'Email ou senha inválidos',
          color: 'red',
        });
      }
    } catch (error) {
      notifications.show({
        title: 'Erro',
        message: 'Erro ao fazer login',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container size={420} my={40}>
      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        <Title ta="center" mb="md">
          Login
        </Title>
        <Text c="dimmed" size="sm" ta="center" mt={5} mb="xl">
          Faça login para acessar o sistema
        </Text>

        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            <TextInput
              label="Email"
              placeholder="seu@email.com"
              required
              {...form.getInputProps('email')}
            />
            <PasswordInput
              label="Senha"
              placeholder="Sua senha"
              required
              {...form.getInputProps('password')}
            />
            <Button type="submit" fullWidth mt="md" loading={loading}>
              Entrar
            </Button>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}
```

**O que isso faz?**
- Cria um formulário bonito com validação
- Quando você submete, tenta fazer login
- Se sucesso, redireciona para a página de usuários
- Se erro, mostra notificação

### Passo 6: Criar a página de CRUD

Crie `src/pages/Users.tsx`. Este arquivo é maior, então você pode copiar do arquivo original do projeto.

**Principais funcionalidades:**
- Lista todos os usuários em uma tabela
- Botão para criar novo usuário
- Botões de editar e excluir em cada linha
- Modais para criar/editar usuários
- Modal de confirmação para excluir

### Passo 7: Configurar o App.tsx

Atualize `src/App.tsx`:

```typescript
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Users from './pages/Users';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/users"
          element={
            <ProtectedRoute>
              <Users />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/users" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```

**O que isso faz?**
- Define as rotas da aplicação
- `/login` → página de login (pública)
- `/users` → página de usuários (protegida)
- `/` → redireciona para `/users`

### Passo 8: Configurar o main.tsx

Atualize `src/main.tsx`:

```typescript
import React from "react";
import ReactDOM from "react-dom/client";
import { MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import "@mantine/notifications/styles.css";
import { AuthProvider } from "./contexts/AuthContext";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <MantineProvider>
      <Notifications />
      <AuthProvider>
        <App />
      </AuthProvider>
    </MantineProvider>
  </React.StrictMode>
);
```

**O que isso faz?**
- Inicializa a aplicação React
- Envolve tudo com `MantineProvider` (para usar componentes Mantine)
- Envolve com `AuthProvider` (para usar autenticação)
- Adiciona sistema de notificações

### Passo 9: Importar estilos CSS

No início do `src/App.tsx`, adicione:

```typescript
import '@mantine/core/styles.css';
```

Isso importa os estilos do Mantine UI.

---

## 📄 Explicação Detalhada dos Arquivos

### 1. `src/types/user.ts`

**Propósito**: Define os tipos de dados que serão usados no sistema.

**Conceitos importantes:**
- `interface`: Define a estrutura de um objeto
- `?`: Indica que um campo é opcional
- `string`, `number`, etc.: Tipos básicos do TypeScript

**Exemplo prático:**
```typescript
interface User {
  id: string;        // ID único do usuário
  name: string;      // Nome completo
  email: string;     // Email válido
  role: string;      // Perfil (admin ou user)
  createdAt: string; // Data de criação (ISO format)
}
```

### 2. `src/contexts/AuthContext.tsx`

**Propósito**: Gerencia o estado de autenticação globalmente.

**Conceitos importantes:**
- **Context API**: Permite compartilhar estado entre componentes sem passar props
- **useState**: Hook para gerenciar estado local
- **localStorage**: Armazenamento persistente no navegador

**Fluxo de funcionamento:**
1. Ao iniciar, verifica `localStorage` para ver se há sessão salva
2. Função `login` salva no `localStorage` e atualiza estado
3. Função `logout` remove do `localStorage` e atualiza estado
4. Qualquer componente pode usar `useAuth()` para acessar essas funções

### 3. `src/services/userService.ts`

**Propósito**: Simula operações de banco de dados (em produção, seria uma API real).

**Conceitos importantes:**
- **Array em memória**: Dados são armazenados em uma variável JavaScript
- **Promises**: Simula operações assíncronas (como chamadas de API)
- **CRUD completo**: Create, Read, Update, Delete

**Operações:**
- `getAll()`: Retorna todos os usuários
- `getById(id)`: Retorna um usuário específico
- `create(data)`: Cria novo usuário
- `update(id, data)`: Atualiza usuário existente
- `delete(id)`: Remove usuário

### 4. `src/pages/Login.tsx`

**Propósito**: Página de autenticação do sistema.

**Componentes Mantine usados:**
- `Container`: Centraliza o conteúdo
- `Paper`: Cria um card bonito
- `TextInput`: Campo de texto
- `PasswordInput`: Campo de senha (oculta texto)
- `Button`: Botão de ação
- `Stack`: Organiza elementos verticalmente

**Fluxo:**
1. Usuário preenche email e senha
2. Validação acontece automaticamente (via `useForm`)
3. Ao submeter, chama `login()` do contexto
4. Se sucesso → redireciona para `/users`
5. Se erro → mostra notificação

### 5. `src/pages/Users.tsx`

**Propósito**: Página completa de gerenciamento de usuários.

**Funcionalidades principais:**

**a) Listagem:**
- Usa `Table` do Mantine para exibir dados
- Mostra nome, email, perfil e data de criação
- Botões de ação (editar/excluir) em cada linha

**b) Criação:**
- Modal com formulário
- Validação de campos
- Ao salvar, atualiza a lista automaticamente

**c) Edição:**
- Mesmo modal de criação, mas pré-preenchido
- Permite alterar dados (senha é opcional)
- Ao salvar, atualiza na lista

**d) Exclusão:**
- Modal de confirmação (para evitar exclusões acidentais)
- Ao confirmar, remove o usuário da lista

**Hooks importantes:**
- `useState`: Gerencia estado local (lista de usuários, modais abertos, etc.)
- `useEffect`: Carrega usuários quando a página monta
- `useForm`: Gerencia formulários com validação

### 6. `src/App.tsx`

**Propósito**: Define as rotas e estrutura de navegação.

**Conceitos:**
- `BrowserRouter`: Habilita navegação por URL
- `Routes` e `Route`: Define as páginas
- `Navigate`: Redireciona para outra rota
- `ProtectedRoute`: Componente que protege rotas

**Estrutura de rotas:**
```
/login  → Login (pública)
/users  → Users (protegida - requer login)
/       → Redireciona para /users
```

### 7. `src/main.tsx`

**Propósito**: Ponto de entrada da aplicação React.

**Providers:**
- `MantineProvider`: Fornece tema e estilos do Mantine
- `AuthProvider`: Fornece contexto de autenticação
- `Notifications`: Sistema de notificações

**Por que envolver tudo?**
Os "Providers" são como "serviços globais" que todos os componentes podem usar.

---

## 🎓 Conceitos Importantes

### 1. React Hooks

**O que são?** Funções especiais do React que permitem usar recursos como estado e ciclo de vida em componentes funcionais.

**Hooks principais usados:**
- `useState`: Gerencia estado (dados que podem mudar)
- `useEffect`: Executa código quando componente monta/atualiza
- `useContext`: Acessa um contexto React
- `useForm`: Gerencia formulários (do Mantine)
- `useNavigate`: Navega entre páginas (do React Router)

**Exemplo:**
```typescript
const [count, setCount] = useState(0);
// count = valor atual
// setCount = função para atualizar
```

### 2. TypeScript

**O que é?** JavaScript com tipos estáticos. Ajuda a evitar erros.

**Benefícios:**
- Autocomplete melhor no editor
- Erros são detectados antes de executar
- Código mais fácil de entender

**Exemplo:**
```typescript
// JavaScript normal
function soma(a, b) {
  return a + b;
}

// TypeScript
function soma(a: number, b: number): number {
  return a + b;
}
```

### 3. Context API

**O que é?** Sistema do React para compartilhar dados globalmente.

**Quando usar:**
- Dados que muitos componentes precisam (como autenticação)
- Evita passar props através de muitos componentes

**Estrutura:**
1. Criar contexto
2. Criar Provider (fornece dados)
3. Criar Hook customizado (facilita uso)
4. Usar em componentes

### 4. Roteamento

**O que é?** Sistema que mapeia URLs para páginas diferentes.

**React Router:**
- Permite ter múltiplas "páginas" em uma SPA (Single Page Application)
- URLs mudam sem recarregar a página
- Permite proteger rotas (exigir autenticação)

### 5. Formulários com Validação

**Mantine Form (`useForm`):**
- Gerencia valores do formulário
- Validação automática
- Mensagens de erro
- Estado de "dirty" (se foi modificado)

**Exemplo de validação:**
```typescript
validate: {
  email: (value) => {
    if (!value) return 'Email é obrigatório';
    if (!/^\S+@\S+$/.test(value)) return 'Email inválido';
    return null; // Sem erros
  }
}
```

### 6. LocalStorage

**O que é?** Armazenamento persistente no navegador.

**Características:**
- Persiste mesmo após fechar o navegador
- Limitado a ~5-10MB
- Apenas dados do mesmo domínio
- Dados são strings (precisa converter)

**Uso:**
```typescript
// Salvar
localStorage.setItem('chave', 'valor');

// Ler
const valor = localStorage.getItem('chave');

// Remover
localStorage.removeItem('chave');
```

---

## 🗄️ Integração com Supabase (Banco de Dados Real)

Por padrão, o sistema usa um array em memória para armazenar usuários. Isso significa que os dados são perdidos ao recarregar a página. Para ter persistência real, você pode integrar com **Supabase**, um banco de dados PostgreSQL na nuvem.

> 📖 **Guias Completos**: 
> - Veja `GUIA_SUPABASE.md` para integração básica com tabela manual
> - Veja `GUIA_SUPABASE_AUTH.md` para usar Auth do Supabase (recomendado - mais seguro)

### Duas Abordagens

**1. Tabela Manual (`users`)** - Mais simples, mas você gerencia tudo
- Criar tabela `users` manualmente
- Gerenciar senhas (precisa criptografar manualmente)
- Mais controle sobre a estrutura

**2. Auth do Supabase** (⭐ Recomendado) - Mais seguro e profissional
- Usa `auth.users` (gerenciada pelo Supabase)
- Senhas criptografadas automaticamente
- Tokens JWT automáticos
- Sessões seguras
- Recuperação de senha pronta
- Tabela `profiles` para dados extras (nome, role, etc.)

**Recomendamos usar Auth do Supabase** para produção, pois é mais seguro e tem recursos profissionais prontos.

### O que é Supabase?

**Supabase** é uma plataforma que oferece:
- ✅ Banco de dados PostgreSQL (banco de dados real)
- ✅ Autenticação segura
- ✅ API REST automática
- ✅ Gratuito para começar!

### Opção 1: Usar Auth do Supabase (⭐ Recomendado)

Esta é a abordagem mais segura e profissional. Use o sistema de autenticação nativo do Supabase.

#### Passos Rápidos

1. **Instalar dependência**: `yarn add @supabase/supabase-js`
2. **Criar arquivo de configuração**: `src/lib/supabase.ts`
3. **Criar tabela `profiles`** (SQL no guia)
4. **Atualizar AuthContext** para usar `signInWithPassword`, `signUp`, `signOut`
5. **Atualizar userService** para trabalhar com perfis

**Estrutura:**
- `auth.users` - Gerenciada pelo Supabase (email, senha criptografada)
- `profiles` - Tabela para dados extras (nome, role, etc.)
- Trigger automático cria perfil quando usuário se registra

**Vantagens:**
- ✅ Senhas criptografadas automaticamente
- ✅ Tokens JWT gerenciados
- ✅ Sessões seguras
- ✅ Recuperação de senha pronta
- ✅ Mais seguro e profissional

> 📖 **Tutorial Completo**: Veja `GUIA_SUPABASE_AUTH.md` para passo a passo detalhado

#### Resumo do Código

**AuthContext atualizado:**
```typescript
const login = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  // ...
};

const signup = async (email: string, password: string, name: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name, role: 'user' } },
  });
  // ...
};
```

**userService atualizado:**
```typescript
// Buscar perfis (não usuários diretamente)
getAll: async () => {
  const { data } = await supabase
    .from('profiles')
    .select('*');
  // ...
}
```

---

### Opção 2: Tabela Manual (Mais Simples)

Se preferir ter controle total sobre a estrutura, você pode criar uma tabela `users` manualmente.

#### Passos Rápidos

1. **Instalar dependência**: `yarn add @supabase/supabase-js`
2. **Criar arquivo de configuração**: `src/lib/supabase.ts`
3. **Criar tabela `users`** (SQL abaixo)
4. **Atualizar userService** para usar Supabase

**SQL para criar tabela:**
```sql
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir acesso" ON users
  FOR ALL USING (true);
```

**⚠️ Importante:** Você precisará criptografar senhas manualmente (usar bcrypt)!

> 📖 **Tutorial Completo**: Veja `GUIA_SUPABASE.md` para passo a passo detalhado

### Estrutura de Pastas Atualizada

**Com Auth do Supabase:**
```
src/
├── lib/
│   └── supabase.ts           ← Configuração do Supabase
├── contexts/
│   └── AuthContext.tsx       ← MODIFICADO: Usa Supabase Auth
├── services/
│   └── userService.ts        ← MODIFICADO: Trabalha com perfis
└── types/
    └── user.ts               ← MODIFICADO: Adiciona UserProfile
```

**Com tabela manual:**
```
src/
├── lib/
│   └── supabase.ts      ← Configuração do Supabase
├── services/
│   └── userService.ts    ← MODIFICADO: Usa tabela users
└── ...
```

### Principais Métodos do Supabase

**Para Banco de Dados:**
- `.from('tabela')` - Seleciona a tabela
- `.select('*')` - Seleciona todas as colunas
- `.insert()` - Insere novo registro
- `.update()` - Atualiza registro
- `.delete()` - Remove registro
- `.eq('id', id)` - Filtra por ID
- `.single()` - Retorna apenas um resultado
- `.order()` - Ordena resultados

**Para Autenticação (Auth):**
- `supabase.auth.signInWithPassword()` - Fazer login
- `supabase.auth.signUp()` - Criar conta
- `supabase.auth.signOut()` - Fazer logout
- `supabase.auth.getSession()` - Verificar sessão
- `supabase.auth.getUser()` - Obter usuário atual
- `supabase.auth.onAuthStateChange()` - Escutar mudanças de autenticação

### Vantagens do Supabase

✅ **Dados persistem** mesmo após recarregar a página  
✅ **Banco de dados real** (PostgreSQL)  
✅ **API REST automática** - não precisa criar backend  
✅ **Gratuito** para começar  
✅ **Seguro** com Row Level Security (RLS)  
✅ **Escalável** para crescimento

**Com Auth do Supabase adicionalmente:**
✅ **Senhas criptografadas** automaticamente  
✅ **Tokens JWT** gerenciados  
✅ **Sessões seguras** com refresh tokens  
✅ **Recuperação de senha** pronta  
✅ **Verificação de email** (opcional)

### Comparação: Tabela Manual vs Auth

| Recurso | Tabela Manual | Auth do Supabase |
|---------|---------------|-----------------|
| Controle total | ✅ Sim | ❌ Limitado |
| Segurança | ⚠️ Você gerencia | ✅ Automático |
| Criptografia de senha | ⚠️ Manual (bcrypt) | ✅ Automático |
| Tokens JWT | ❌ Não | ✅ Sim |
| Recuperação de senha | ⚠️ Você implementa | ✅ Pronto |
| Complexidade | ⚠️ Média | ✅ Baixa |
| **Recomendado para** | Aprendizado | **Produção** |

### Próximos Passos com Supabase

1. ✅ **Usar Auth do Supabase** - Veja `GUIA_SUPABASE_AUTH.md` (recomendado)
2. **Usar Variáveis de Ambiente**: Mover credenciais para `.env`
3. **Filtros e Busca**: Adicionar funcionalidades avançadas de busca
4. **Verificação de Email**: Configurar confirmação de email
5. **Recuperação de Senha**: Usar recursos nativos do Supabase

> 📚 **Aprenda Mais**: 
> - Consulte `GUIA_SUPABASE.md` para integração básica
> - Consulte `GUIA_SUPABASE_AUTH.md` para usar Auth (recomendado)

---

## 🧭 Sistema de Navegação (Sidebar)

O sistema inclui um menu lateral (sidebar) fixo que facilita a navegação entre as diferentes seções da aplicação.

### Componentes Criados

#### 1. Sidebar (`src/components/Sidebar.tsx`)

Menu lateral fixo com:
- **Navegação entre páginas**: Usuários, Fretes, Upload
- **Indicador de página ativa**: Destaca a página atual
- **Botão de logout**: Para sair do sistema
- **Design responsivo**: Usa componentes do Mantine

#### 2. Layout (`src/components/Layout.tsx`)

Wrapper que:
- Inclui o Sidebar em todas as páginas protegidas
- Ajusta o conteúdo principal para não sobrepor o menu
- Mantém layout consistente

### Como Funciona

```typescript
// App.tsx
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Layout>{children}</Layout> : <Navigate to="/login" />;
}
```

**O que isso faz?**
- Todas as rotas protegidas são envolvidas com `<Layout>`
- O Layout inclui o Sidebar automaticamente
- Páginas públicas (Login, Signup) não têm sidebar

### Rotas do Sistema

- `/login` - Página de login (pública, sem sidebar)
- `/signup` - Página de cadastro (pública, sem sidebar)
- `/users` - Gerenciamento de usuários (protegida, com sidebar)
- `/frete` - Gerenciamento de fretes (protegida, com sidebar)
- `/upload` - Upload de arquivos (protegida, com sidebar)

---

## 📦 Sistema de Upload e Gerenciamento de Fretes

Sistema completo para gerenciar dados de frete com upload de arquivos Excel, conversão para Parquet e visualização de dados.

### Funcionalidades

#### 1. Upload de Arquivos Excel

**Página**: `/upload`

**Características:**
- Drag & drop de arquivos
- Validação de formato (.xlsx, .xls)
- Barra de progresso durante processamento
- Histórico de uploads realizados

**Fluxo (Modo Automático - Recomendado):**
1. Usuário seleciona arquivo Excel
2. Sistema lê o arquivo usando biblioteca XLSX
3. Converte dados para formato JSON
4. Converte para Parquet (ou JSON como fallback)
5. Faz upload para Supabase Storage com metadados
6. **Chama função SQL `process_uploaded_file()`** para processamento automático
7. Função SQL detecta tipo de dados, normaliza e insere no banco
8. Registra no log de uploads (`file_uploads`)
9. Exibe notificação de sucesso com quantidade de linhas inseridas

**Fluxo (Modo Manual - Fallback):**
1-5. Mesmo do modo automático
6. Insere dados diretamente via `insertToDatabase()` (fallback se função SQL não estiver disponível)
7. Exibe notificação de sucesso

#### 2. Gerenciamento de Fretes

**Página**: `/frete`

**Visualizações:**

**a) Cards de Resumo Geral:**
- Total de CEPs cadastrados
- Média geral de frete
- Média geral de prazo

**b) Tabela Resumida por UF:**
- UF (Estado)
- Quantidade de CEPs por UF
- Média de frete por UF
- Média de prazo por UF
- Botões de ação (Ver detalhes, Excluir)

**c) Modal de Detalhes:**
- Ao clicar em "Ver detalhes", mostra todos os registros da UF
- Tabela com: CEP, UF, Transportadora, Frete, Prazo
- Formatação de valores em moeda (R$)

**d) Exclusão:**
- Excluir todos os dados de uma UF específica
- Modal de confirmação antes de excluir

### Estrutura de Dados

#### Tabela `fretes` no Supabase:

```sql
CREATE TABLE fretes (
  id UUID PRIMARY KEY,
  cep TEXT NOT NULL,
  uf TEXT NOT NULL,
  transportadora TEXT NOT NULL,
  frete DECIMAL(10, 2) NOT NULL,
  prazo INTEGER NOT NULL,
  created_at TIMESTAMP NOT NULL
);
```

#### Formato do Excel:

O sistema aceita variações de nomes de colunas:

| Campo | Nomes Aceitos |
|-------|---------------|
| CEP | `cep`, `ceo`, `cep_origem` |
| UF | `uf`, `estado`, `uf_destino` |
| Transportadora | `transportadora`, `empresa`, `nome_transportadora`, `transportadora_nome`, `nome_empresa` |
| Frete | `frete`, `valor_frete`, `valor`, `preco`, `custo` |
| Prazo | `prazo`, `prazo_entrega`, `dias`, `prazo_dias` |

### Serviços Criados

#### `freteService.ts`

- `getSummary()` - Busca resumo por UF (usa função SQL `get_frete_summary()`)
- `getByUF(uf)` - Busca todos os registros de uma UF
- `deleteByUF(uf)` - Exclui todos os dados de uma UF
- `insertMany(records)` - Insere múltiplos registros (usado no upload)

#### `uploadService.ts`

- `processFile(file, onProgress, options)` - Processa arquivo completo
  - `autoProcess`: true/false - Ativa processamento via função SQL
- `readExcelFile(file)` - Lê arquivo Excel e retorna JSON
- `convertToParquet(data)` - Converte dados para Parquet (ou JSON como fallback)
- `uploadToStorage(filename, buffer, metadata)` - Faz upload para Supabase Storage com metadados
- `insertToDatabase(data)` - Insere dados no banco (modo manual)
- `insertFreteData(data)` - Detecta e processa dados de frete

### Função SQL de Resumo

O sistema usa uma função SQL no Supabase para calcular resumos:

```sql
CREATE FUNCTION get_frete_summary()
RETURNS TABLE (
  uf TEXT,
  qtd_ceps BIGINT,
  media_frete NUMERIC,
  media_prazo NUMERIC
)
```

**O que faz:**
- Agrupa dados por UF
- Calcula quantidade de CEPs
- Calcula média de frete
- Calcula média de prazo

### Configuração Necessária

Para usar o sistema de fretes, você precisa:

1. **Criar tabela `fretes`** no Supabase (veja `GUIA_FRETE.md`)
2. **Criar função `get_frete_summary()`** (veja `GUIA_FRETE.md`)
3. **Configurar bucket `uploads`** no Supabase Storage
4. **Configurar políticas RLS** para tabela e storage
5. **Executar migração SQL** para processamento automático (veja `GUIA_PROCESSAMENTO_AUTOMATICO.md`)

> 📖 **Guias Completos**: 
> - `GUIA_FRETE.md` - Configuração do sistema de fretes
> - `GUIA_PROCESSAMENTO_AUTOMATICO.md` - Processamento automático Excel → Parquet → Storage → Banco

### Fluxo Completo de Upload (Modo Automático)

```
1. Usuário seleciona arquivo Excel
   ↓
2. Sistema lê Excel (XLSX library)
   ↓
3. Converte para JSON
   ↓
4. Normaliza colunas (detecta variações de nomes)
   ↓
5. Converte para Parquet (ou JSON como fallback)
   ↓
6. Upload para Supabase Storage (bucket 'uploads') com metadados
   ↓
7. Chama função SQL process_uploaded_file()
   ↓
8. Função SQL detecta tipo de dados (frete/genérico)
   ↓
9. Função SQL normaliza dados (CEP, UF, Transportadora, etc.)
   ↓
10. Função SQL insere dados na tabela 'fretes'
   ↓
11. Registra no log (tabela 'file_uploads')
   ↓
12. Exibe notificação de sucesso
   ↓
13. Dados aparecem automaticamente na página de Fretes
```

**Modo Manual (Fallback):**
- Se função SQL não estiver disponível, o sistema faz inserção direta via `insertToDatabase()`

### Exemplo de Uso

**1. Fazer Upload:**
- Acesse `/upload`
- Selecione arquivo Excel com colunas: CEP, UF, Transportadora, Frete, Prazo
- Aguarde processamento

**2. Visualizar Dados:**
- Acesse `/frete`
- Veja resumo por UF na tabela
- Clique em "Ver detalhes" para ver todos os CEPs com transportadora

**3. Excluir Dados:**
- Na tabela de fretes, clique no ícone de lixeira
- Confirme a exclusão
- Dados da UF serão removidos

---

## ⚡ Processamento Automático Excel → Parquet → Storage → Banco

### Visão Geral

O sistema agora suporta **processamento automático** via funções SQL no Supabase. Quando um arquivo Excel é enviado:

1. Frontend converte para Parquet/JSON
2. Faz upload para Supabase Storage
3. **Função SQL processa automaticamente** e insere no banco
4. Logs são mantidos na tabela `file_uploads`

### Funcionalidades

- ✅ **Detecção automática de tipo**: Identifica se dados são de frete ou genéricos
- ✅ **Normalização automática**: Normaliza CEP, UF, Transportadora, etc.
- ✅ **Processamento no servidor**: Mais seguro e performático
- ✅ **Logs completos**: Rastreia todos os uploads processados
- ✅ **Fallback automático**: Se função SQL não estiver disponível, usa processamento manual

### Configuração Rápida

1. **Executar migração SQL**:
   - Abra o SQL Editor no Supabase
   - Execute: `supabase/migrations/001_process_storage_file.sql`

2. **Configurar Storage**:
   - Criar bucket `uploads` (se não existir)
   - Configurar políticas RLS (veja `GUIA_PROCESSAMENTO_AUTOMATICO.md`)

3. **Pronto!** O sistema já está configurado no código

### Tabela de Logs: `file_uploads`

A tabela `file_uploads` rastreia todos os uploads:

- `file_path`: Caminho do arquivo no storage
- `file_url`: URL pública do arquivo
- `rows_count`: Quantidade de linhas no arquivo
- `rows_inserted`: Quantidade de linhas inseridas
- `data_type`: Tipo de dados (frete/generic)
- `status`: Status do processamento (pending/processing/completed/error)
- `error_message`: Mensagem de erro (se houver)

### Funções SQL Criadas

- `process_uploaded_file()` - Função principal (chamada pelo frontend)
- `process_json_data()` - Processa dados JSON diretamente
- `normalize_frete_data()` - Normaliza dados de frete

### Como Usar

O modo automático já está **ativado por padrão** na página de Upload. Basta fazer upload de um arquivo Excel e o sistema processará automaticamente.

### Documentação Completa

> 📖 **Guia Detalhado**: Veja `GUIA_PROCESSAMENTO_AUTOMATICO.md` para:
> - Configuração passo a passo
> - Arquitetura do sistema
> - Solução de problemas
> - Exemplos de uso

---

## 🔧 Personalização e Extensões

### 1. Conectar com Outra API (Alternativa ao Supabase)

**Substituir `userService.ts` para usar API REST:**

```typescript
export const userService = {
  getAll: async (): Promise<User[]> => {
    const response = await fetch('https://api.seudominio.com/users');
    if (!response.ok) throw new Error('Erro ao buscar usuários');
    return response.json();
  },

  create: async (data: CreateUserData): Promise<User> => {
    const response = await fetch('https://api.seudominio.com/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Erro ao criar usuário');
    return response.json();
  },
  // ... outras operações
};
```

**Nota**: Recomendamos usar Supabase para simplicidade, mas você pode usar qualquer API REST.

### 2. Adicionar Autenticação Real

**⭐ Opção A: Usar Autenticação do Supabase (Recomendado)**

Esta é a melhor opção. Veja o guia completo em `GUIA_SUPABASE_AUTH.md`.

```typescript
import { supabase } from '../lib/supabase';

const login = async (email: string, password: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) return false;
    
    // O Supabase gerencia a sessão automaticamente
    // Não precisa localStorage manual
    return !!data.user;
  } catch {
    return false;
  }
};

const signup = async (email: string, password: string, name: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name: name,
        role: 'user',
      },
    },
  });
  // ...
};
```

**Vantagens:**
- ✅ Senhas criptografadas automaticamente
- ✅ Sessões gerenciadas pelo Supabase
- ✅ Tokens JWT automáticos
- ✅ Verificação de email pronta
- ✅ Recuperação de senha pronta

**Opção B: Usar API REST Personalizada**

```typescript
const login = async (email: string, password: string): Promise<boolean> => {
  try {
    const response = await fetch('https://api.seudominio.com/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    
    if (response.ok) {
      const { token } = await response.json();
      localStorage.setItem('token', token);
      localStorage.setItem('isAuthenticated', 'true');
      setIsAuthenticated(true);
      return true;
    }
    return false;
  } catch {
    return false;
  }
};
```

### 3. Adicionar Mais Campos ao Usuário

**1. Atualizar tipos (`src/types/user.ts`):**
```typescript
export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;        // Novo campo opcional
  department?: string;   // Novo campo opcional
  createdAt: string;
}
```

**2. Atualizar formulário (`src/pages/Users.tsx`):**
```typescript
const form = useForm({
  initialValues: {
    name: '',
    email: '',
    password: '',
    role: 'user',
    phone: '',           // Adicionar aqui
    department: '',      // Adicionar aqui
  },
});
```

**3. Adicionar campos no modal:**
```typescript
<TextInput
  label="Telefone"
  placeholder="(00) 00000-0000"
  {...form.getInputProps('phone')}
/>
```

### 4. Adicionar Paginação

**Usar componente `Pagination` do Mantine:**
```typescript
import { Pagination } from '@mantine/core';

// No componente
const [page, setPage] = useState(1);
const itemsPerPage = 10;
const paginatedUsers = users.slice((page - 1) * itemsPerPage, page * itemsPerPage);

// No JSX
<Pagination value={page} onChange={setPage} total={Math.ceil(users.length / itemsPerPage)} />
```

### 5. Adicionar Busca/Filtro

```typescript
const [search, setSearch] = useState('');

const filteredUsers = users.filter(user => 
  user.name.toLowerCase().includes(search.toLowerCase()) ||
  user.email.toLowerCase().includes(search.toLowerCase())
);

// No JSX
<TextInput
  placeholder="Buscar usuários..."
  value={search}
  onChange={(e) => setSearch(e.target.value)}
/>
```

### 6. Mudar Tema/Cores

**No `main.tsx`, adicionar tema:**
```typescript
import { MantineProvider, createTheme } from '@mantine/core';

const theme = createTheme({
  primaryColor: 'blue', // ou 'red', 'green', etc.
  fontFamily: 'Arial, sans-serif',
});

<MantineProvider theme={theme}>
```

### 7. Adicionar Mais Perfis

**No `Users.tsx`, atualizar Select:**
```typescript
<Select
  label="Perfil"
  data={[
    { value: 'user', label: 'Usuário' },
    { value: 'admin', label: 'Administrador' },
    { value: 'manager', label: 'Gerente' },  // Novo
    { value: 'viewer', label: 'Visualizador' }, // Novo
  ]}
  {...form.getInputProps('role')}
/>
```

---

## ❓ Perguntas Frequentes

### Por que os dados desaparecem ao recarregar a página?

Por padrão, o sistema usa um array em memória (`let users = []`). Para persistir os dados, você deve:

1. **Integrar com Supabase Auth** (⭐ mais recomendado - veja `GUIA_SUPABASE_AUTH.md`)
2. **Integrar com Supabase (tabela manual)** (veja `GUIA_SUPABASE.md`)
3. **Conectar com uma API REST** (veja seção Personalização)
4. **Usar outro banco de dados** (Firebase, MongoDB, etc.)

**Recomendamos usar Auth do Supabase** pois é mais seguro e tem recursos profissionais prontos.

### Como fazer login real?

Substitua a função `login` no `AuthContext.tsx` para fazer uma chamada à sua API de autenticação.

### Como adicionar mais páginas?

1. Crie um novo arquivo em `src/pages/`
2. Adicione uma rota em `src/App.tsx`:
```typescript
<Route path="/nova-pagina" element={<NovaPagina />} />
```

### Como proteger uma nova rota?

Envolva com `ProtectedRoute`:
```typescript
<Route
  path="/protegida"
  element={
    <ProtectedRoute>
      <NovaPagina />
    </ProtectedRoute>
  }
/>
```

### Como adicionar logout na página de login?

Não é necessário, pois a página de login só aparece quando não está autenticado.

### Como mudar o idioma das mensagens?

Altere os textos diretamente nos arquivos. Por exemplo, em `Login.tsx`, mude:
```typescript
<Title>Login</Title> // Para "Entrar", "Acesso", etc.
```

---

## 📚 Recursos Adicionais

### Documentação Oficial

- [React](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/)
- [Mantine UI](https://mantine.dev/)
- [React Router](https://reactrouter.com/)
- [Supabase](https://supabase.com/docs)

### Conceitos para Estudar

1. **React Fundamentals**: Componentes, Props, Estado
2. **Hooks**: useState, useEffect, useContext
3. **TypeScript Basics**: Tipos, Interfaces, Generics
4. **Routing**: Navegação em SPAs
5. **Form Management**: Validação, submissão
6. **Banco de Dados**: SQL, PostgreSQL, Queries
7. **Supabase**: Client, Queries, Row Level Security
8. **Supabase Auth**: Autenticação, JWT, Sessões, Triggers

---

## ✅ Checklist para Replicar

- [ ] Criar projeto Vite com React + TypeScript
- [ ] Instalar todas as dependências
- [ ] Criar estrutura de pastas
- [ ] Criar arquivo de tipos (`user.ts`)
- [ ] Criar contexto de autenticação
- [ ] Criar serviço de usuários
- [ ] Criar página de login
- [ ] Criar página de CRUD
- [ ] Configurar rotas no App.tsx
- [ ] Configurar providers no main.tsx
- [ ] Importar estilos CSS
- [ ] Testar login
- [ ] Testar CRUD completo
- [ ] Personalizar conforme necessário
- [ ] (Opcional) Integrar com Supabase Auth (recomendado - veja `GUIA_SUPABASE_AUTH.md`)
- [ ] (Opcional) Integrar com Supabase (tabela manual - veja `GUIA_SUPABASE.md`)
- [ ] (Opcional) Configurar sistema de Fretes (veja `GUIA_FRETE.md`)
- [ ] (Opcional) Testar upload de arquivos Excel

---

## 🎉 Conclusão

Agora você tem um sistema completo de auditoria com:
- ✅ Autenticação segura com Supabase Auth
- ✅ Gerenciamento completo de usuários (CRUD)
- ✅ Sistema de navegação com Sidebar
- ✅ Upload de arquivos Excel com conversão para Parquet
- ✅ **Processamento automático via funções SQL** (novo)
- ✅ Gerenciamento de fretes com visualizações resumidas e detalhadas
- ✅ Integração completa com Supabase (Banco + Auth + Storage)
- ✅ Logs de uploads na tabela `file_uploads`

Este projeto serve como base sólida para aplicações mais complexas e demonstra boas práticas de desenvolvimento React com TypeScript.

**Próximos passos sugeridos:**
1. ✅ **Conectar com Supabase Auth** (⭐ Recomendado) - Veja `GUIA_SUPABASE_AUTH.md`
2. ✅ **Conectar com Supabase (tabela manual)** - Veja `GUIA_SUPABASE.md`
3. ✅ **Configurar Sistema de Fretes** - Veja `GUIA_FRETE.md`
4. ✅ **Configurar Upload de Arquivos** - Veja `GUIA_UPLOAD_XLSX.md`
5. ✅ **Processamento Automático Excel → Parquet → Storage → Banco** - Veja `GUIA_PROCESSAMENTO_AUTOMATICO.md`
6. Adicionar mais validações
7. Implementar verificação de email
8. Adicionar recuperação de senha
9. Adicionar testes
10. Adicionar mais funcionalidades (filtros, ordenação, busca, etc.)
11. Usar variáveis de ambiente para credenciais
12. Implementar conversão real de Parquet no backend (Edge Function)
13. Adicionar paginação nas tabelas
14. Criar dashboard de uploads (visualizar histórico na tabela `file_uploads`)

**Dúvidas?** Revise esta documentação e os comentários no código. Todo o código está bem documentado e comentado para facilitar o entendimento.

---

**Versão da Documentação:** 4.0  
**Última Atualização:** 2024  
**Projeto:** Sistema de Login e CRUD de Usuários com Vite + Mantine UI  
**Integração:** Supabase (Banco de Dados PostgreSQL + Auth + Storage)
**Guias Disponíveis:**
- `GUIA_SUPABASE.md` - Integração básica com tabela manual
- `GUIA_SUPABASE_AUTH.md` - Integração com Auth do Supabase (recomendado)
- `GUIA_FRETE.md` - Configuração do sistema de fretes
- `GUIA_UPLOAD_XLSX.md` - Guia de upload básico de arquivos Excel
- `GUIA_PROCESSAMENTO_AUTOMATICO.md` - Processamento automático Excel → Parquet → Storage → Banco (⭐ Novo)
- `GUIA_BACKEND_CONVERSAO.md` - Opções de backend para conversão Parquet

