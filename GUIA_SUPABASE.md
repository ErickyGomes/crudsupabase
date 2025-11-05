# Guia Passo a Passo: Conectando com Supabase

## 🎯 Objetivo
Aprender a conectar o sistema de login e CRUD de usuários com Supabase, um banco de dados real que persiste os dados mesmo após recarregar a página.

---

## 📚 O que é Supabase?

**Supabase** é uma plataforma que oferece:
- **Banco de dados PostgreSQL** (banco de dados real)
- **Autenticação** (login seguro)
- **API REST automática** (endpoints prontos)
- **Storage** (armazenamento de arquivos)
- **Tudo gratuito** para começar!

É como ter um backend completo sem precisar criar um servidor do zero.

---

## 🚀 Passo 1: Criar Conta e Projeto no Supabase

### 1.1 Acesse o Supabase
1. Vá para: https://supabase.com
2. Clique em **"Start your project"** ou **"Sign Up"**
3. Crie uma conta (pode usar GitHub, Google ou email)

### 1.2 Criar Novo Projeto
1. Após fazer login, clique em **"New Project"**
2. Preencha os dados:
   - **Name**: `auditoria` (ou qualquer nome)
   - **Database Password**: Crie uma senha forte (ANOTE ELA!)
   - **Region**: Escolha a mais próxima (ex: South America - São Paulo)
3. Clique em **"Create new project"**
4. Aguarde 1-2 minutos enquanto o projeto é criado

### 1.3 Obter Credenciais
1. No menu lateral esquerdo, clique em **"Settings"** (ícone de engrenagem)
2. Clique em **"API"**
3. Você verá:
   - **Project URL**: Algo como `https://xxxxx.supabase.co`
   - **anon public key**: Uma chave longa começando com `eyJ...`
4. **COPIE E SALVE** essas duas informações em um bloco de notas (você vai precisar depois)

---

## 📦 Passo 2: Instalar Dependências do Supabase

No terminal do seu projeto, execute:

```bash
yarn add @supabase/supabase-js
```

Ou se usar npm:
```bash
npm install @supabase/supabase-js
```

**O que isso faz?** Instala a biblioteca oficial do Supabase para JavaScript/TypeScript que permite conectar com o banco de dados.

---

## 🔧 Passo 3: Criar Arquivo de Configuração

### 3.1 Criar pasta e arquivo
Crie um arquivo chamado `src/lib/supabase.ts`

**Estrutura de pastas que você precisa ter:**
```
src/
├── lib/
│   └── supabase.ts  ← VOCÊ VAI CRIAR ESTE ARQUIVO
```

### 3.2 Código do arquivo
Cole este código no arquivo `supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

// SUBSTITUA essas duas variáveis pelas suas credenciais do Supabase
const supabaseUrl = 'SUA_PROJECT_URL_AQUI';
const supabaseAnonKey = 'SUA_ANON_KEY_AQUI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### 3.3 Substituir as credenciais
1. Substitua `SUA_PROJECT_URL_AQUI` pela **Project URL** que você copiou
2. Substitua `SUA_ANON_KEY_AQUI` pela **anon public key** que você copiou

**Exemplo de como ficaria:**
```typescript
const supabaseUrl = 'https://abcdefghijklmnop.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY0NzE5ODAwMCwiZXhwIjoxOTYyNzc0MDAwfQ.exemplo123456789';
```

**⚠️ IMPORTANTE:** 
- Nunca commite essas credenciais no Git sem proteção
- A chave `anon` é pública, mas mesmo assim é melhor não compartilhar
- Em projetos reais, use variáveis de ambiente (vamos aprender isso depois)

---

## 🗄️ Passo 4: Criar Tabela no Supabase

### 4.1 Acessar o SQL Editor
1. No painel do Supabase, clique em **"SQL Editor"** no menu lateral
2. Clique em **"New query"**

### 4.2 Criar a tabela de usuários
Cole este SQL no editor:

```sql
-- Criar tabela de usuários
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Criar índice para busca rápida por email
CREATE INDEX idx_users_email ON users(email);

-- Habilitar Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Criar política para permitir leitura para usuários autenticados
CREATE POLICY "Users são públicos para leitura" ON users
  FOR SELECT USING (true);

-- Criar política para permitir inserção (criação)
CREATE POLICY "Permitir inserção de usuários" ON users
  FOR INSERT WITH CHECK (true);

-- Criar política para permitir atualização
CREATE POLICY "Permitir atualização de usuários" ON users
  FOR UPDATE USING (true);

-- Criar política para permitir exclusão
CREATE POLICY "Permitir exclusão de usuários" ON users
  FOR DELETE USING (true);
```

### 4.3 Executar o SQL
1. Clique no botão **"Run"** (ou pressione Ctrl+Enter)
2. Você deve ver uma mensagem de sucesso
3. Agora a tabela `users` foi criada!

### 4.4 Verificar a tabela
1. No menu lateral, clique em **"Table Editor"**
2. Você deve ver a tabela `users` listada
3. Clique nela para ver a estrutura

**O que esse SQL fez?**
- Criou uma tabela com os campos: id, name, email, password, role, created_at
- `UUID` é um tipo de ID único e seguro
- `UNIQUE` garante que não haverá emails duplicados
- `Row Level Security (RLS)` é um sistema de segurança do Supabase
- As políticas permitem que qualquer um leia/escreva (para desenvolvimento)

---

## 🔐 Passo 5: Modificar o Serviço de Usuários

Agora você vai modificar o arquivo `src/services/userService.ts` para usar o Supabase ao invés do array em memória.

### 5.1 Abrir o arquivo
Abra `src/services/userService.ts` no seu editor

### 5.2 Substituir o conteúdo
Substitua TODO o conteúdo do arquivo por este código:

```typescript
import type { User, CreateUserData, UpdateUserData } from '../types/user';
import { supabase } from '../lib/supabase';

export const userService = {
  // Buscar todos os usuários
  getAll: async (): Promise<User[]> => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    // Converter os dados do Supabase para o formato do nosso tipo User
    return (data || []).map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.created_at,
    }));
  },

  // Buscar um usuário por ID
  getById: async (id: string): Promise<User | null> => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Nenhum registro encontrado
        return null;
      }
      throw new Error(error.message);
    }

    if (!data) return null;

    return {
      id: data.id,
      name: data.name,
      email: data.email,
      role: data.role,
      createdAt: data.created_at,
    };
  },

  // Criar novo usuário
  create: async (data: CreateUserData): Promise<User> => {
    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        name: data.name,
        email: data.email,
        password: data.password, // Em produção, você deve criptografar!
        role: data.role,
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      createdAt: newUser.created_at,
    };
  },

  // Atualizar usuário
  update: async (id: string, data: UpdateUserData): Promise<User | null> => {
    // Preparar objeto de atualização (sem campos undefined)
    const updateData: Record<string, any> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.role !== undefined) updateData.role = data.role;
    if (data.password !== undefined) updateData.password = data.password;

    const { data: updatedUser, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    if (!updatedUser) return null;

    return {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      createdAt: updatedUser.created_at,
    };
  },

  // Excluir usuário
  delete: async (id: string): Promise<boolean> => {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(error.message);
    }

    return true;
  },
};
```

### 5.3 Explicação do código

**O que mudou?**

1. **Import do Supabase**: Agora importamos o cliente Supabase
2. **Queries ao invés de array**: Usamos `.from('users')` para acessar a tabela
3. **Métodos do Supabase**:
   - `.select('*')` - Seleciona todas as colunas
   - `.insert()` - Insere novo registro
   - `.update()` - Atualiza registro existente
   - `.delete()` - Remove registro
   - `.eq('id', id)` - Filtra por ID igual
   - `.single()` - Retorna apenas um resultado
   - `.order()` - Ordena os resultados

4. **Tratamento de erros**: Capturamos erros do Supabase e lançamos exceções
5. **Conversão de dados**: Convertemos `created_at` (Supabase) para `createdAt` (nosso tipo)

---

## 🧪 Passo 6: Testar a Conexão

### 6.1 Iniciar o servidor
```bash
yarn dev
```

### 6.2 Testar no navegador
1. Abra `http://localhost:5173`
2. Faça login (qualquer email e senha)
3. Tente criar um novo usuário
4. Verifique se aparece na lista

### 6.3 Verificar no Supabase
1. No painel do Supabase, vá em **"Table Editor"**
2. Clique na tabela `users`
3. Você deve ver os usuários que criou!

### 6.4 Testar persistência
1. Crie um usuário no sistema
2. Recarregue a página (F5)
3. O usuário ainda deve estar lá! ✅

---

## 🐛 Solução de Problemas Comuns

### Erro: "Invalid API key"
- Verifique se copiou corretamente a URL e a chave
- Certifique-se de que não há espaços extras

### Erro: "relation 'users' does not exist"
- Você esqueceu de executar o SQL para criar a tabela
- Volte ao Passo 4 e execute o SQL novamente

### Erro: "new row violates row-level security policy"
- As políticas RLS podem estar bloqueando
- Verifique se executou todas as políticas CREATE POLICY no SQL

### Dados não aparecem
- Abra o Console do navegador (F12) e veja os erros
- Verifique se a tabela foi criada corretamente no Supabase

---

## 📝 Próximos Passos (Opcional)

### 1. Usar Variáveis de Ambiente
Crie um arquivo `.env` na raiz do projeto:
```
VITE_SUPABASE_URL=sua_url_aqui
VITE_SUPABASE_ANON_KEY=sua_chave_aqui
```

E modifique `supabase.ts`:
```typescript
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
```

### 2. Criptografar Senhas
Atualmente as senhas são salvas em texto plano. Em produção, use:
- Hash com bcrypt
- Ou use a autenticação nativa do Supabase (Auth)

### 3. Usar Autenticação do Supabase
O Supabase tem sistema de autenticação próprio que é mais seguro. Você pode substituir o AuthContext para usar ele.

---

## ✅ Checklist Final

- [X] Criou conta no Supabase
- [X] Criou projeto no Supabase
- [X] Copiou Project URL e anon key
- [X] Instalou @supabase/supabase-js
- [X] Criou arquivo `src/lib/supabase.ts`
- [X] Configurou as credenciais no arquivo
- [X] Executou o SQL para criar a tabela
- [X] Modificou `userService.ts` para usar Supabase
- [X] Testou criar um usuário
- [X] Verificou que os dados persistem após recarregar

---

## 🎓 O que você aprendeu?

1. ✅ Como criar um projeto no Supabase
2. ✅ Como criar tabelas com SQL
3. ✅ Como conectar React com Supabase
4. ✅ Como fazer operações CRUD no Supabase
5. ✅ Como os dados agora persistem no banco de dados

Parabéns! Agora você tem um sistema com banco de dados real! 🎉

---

**Dúvidas?** Siga os passos e me avise se encontrar algum problema!

