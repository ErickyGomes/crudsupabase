# Guia: Usando Autenticação do Supabase (Auth)

## 🎯 Objetivo
Aprender a usar o sistema de autenticação nativo do Supabase, que é mais seguro e já gerencia usuários, senhas criptografadas e tokens automaticamente.

---

## 📚 Por que usar Auth do Supabase?

**Vantagens:**
- ✅ **Senhas criptografadas** automaticamente (hash seguro)
- ✅ **Tokens JWT** gerenciados automaticamente
- ✅ **Recuperação de senha** pronta
- ✅ **Verificação de email** (opcional)
- ✅ **Sessões seguras** com refresh tokens
- ✅ **Tabela de usuários** já criada e gerenciada

**O que muda:**
- Não precisamos criar tabela `users` manualmente
- Usamos `auth.users` (gerenciada pelo Supabase)
- Criamos uma tabela `profiles` para dados extras (nome, role, etc.)

---

## 🚀 Passo 1: Configurar Auth no Supabase

### 1.1 Acessar Configurações de Auth

1. No painel do Supabase, vá em **"Authentication"** no menu lateral
2. Clique em **"Settings"** (ou "Configurações")
3. Você verá várias opções de autenticação

### 1.2 Configurar Email/Password (já vem habilitado)

O Supabase já vem com autenticação por email/senha habilitada. Você pode:
- Deixar como está (recomendado para começar)
- Ou desabilitar outros métodos se não precisar

### 1.3 (Opcional) Configurar Site URL

1. Em **"Site URL"**, coloque: `http://localhost:5173` (para desenvolvimento)
2. Isso permite redirecionamentos após login

---

## 🗄️ Passo 2: Criar Tabela de Perfis

O Supabase cria automaticamente a tabela `auth.users`, mas ela só tem dados básicos (email, senha, etc.). Para adicionar dados como `name` e `role`, vamos criar uma tabela `profiles` que se relaciona com `auth.users`.

### 2.1 Acessar SQL Editor

1. No painel do Supabase, clique em **"SQL Editor"**
2. Clique em **"New query"**

### 2.2 Criar Tabela de Perfis

Cole este SQL no editor:

```sql
-- Criar tabela de perfis (extensão dos dados do usuário)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Criar índice para busca rápida
CREATE INDEX idx_profiles_role ON profiles(role);

-- Habilitar Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem ver seu próprio perfil
CREATE POLICY "Usuários podem ver seu próprio perfil" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Política: Usuários podem ver todos os perfis (para listagem)
CREATE POLICY "Todos podem ver perfis" ON profiles
  FOR SELECT USING (true);

-- Política: Usuários podem atualizar seu próprio perfil
CREATE POLICY "Usuários podem atualizar próprio perfil" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Política: Permitir inserção de perfil (será feito via trigger)
CREATE POLICY "Permitir inserção de perfis" ON profiles
  FOR INSERT WITH CHECK (true);

-- Política: Apenas admins podem deletar perfis (opcional)
CREATE POLICY "Admins podem deletar perfis" ON profiles
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

### 2.3 Criar Função para Auto-criar Perfil

Quando um usuário se registra, queremos criar automaticamente um perfil. Vamos criar uma função que faz isso:

```sql
-- Função para criar perfil automaticamente quando usuário se registra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Usuário'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: executa a função quando um novo usuário é criado
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### 2.4 Executar o SQL

1. Cole todo o código SQL acima no editor
2. Clique em **"Run"** (ou Ctrl+Enter)
3. Você deve ver mensagens de sucesso

**O que isso fez?**
- Criou tabela `profiles` que se relaciona com `auth.users`
- Criou políticas de segurança (RLS)
- Criou função que cria perfil automaticamente ao registrar
- Criou trigger que executa a função automaticamente

---

## 🔧 Passo 3: Atualizar o AuthContext

Agora vamos modificar o `AuthContext` para usar o Auth do Supabase.

### 3.1 Abrir o arquivo

Abra `src/contexts/AuthContext.tsx`

### 3.2 Substituir TODO o conteúdo

Substitua por este código:

```typescript
import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string, name: string, role?: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Verificar se há sessão ativa ao carregar
  useEffect(() => {
    // Verificar sessão atual
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Escutar mudanças de autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Erro no login:', error.message);
        return false;
      }

      if (data.user) {
        setUser(data.user);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Erro no login:', error);
      return false;
    }
  };

  const signup = async (
    email: string,
    password: string,
    name: string,
    role: string = 'user'
  ): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
            role: role,
          },
        },
      });

      if (error) {
        console.error('Erro no cadastro:', error.message);
        return false;
      }

      // Se o email precisa ser confirmado, o usuário será null até confirmar
      // Mas retornamos true para mostrar mensagem de sucesso
      return true;
    } catch (error) {
      console.error('Erro no cadastro:', error);
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        login,
        signup,
        logout,
      }}
    >
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

### 3.3 Explicação do código

**O que mudou?**

1. **Import do Supabase**: Importamos o cliente e o tipo `User` do Supabase
2. **Estado do usuário**: Agora guardamos o objeto `user` completo do Supabase
3. **getSession()**: Verifica se há sessão ativa ao carregar
4. **onAuthStateChange()**: Escuta mudanças de autenticação (login/logout)
5. **signInWithPassword()**: Método do Supabase para fazer login
6. **signUp()**: Método do Supabase para criar conta
7. **signOut()**: Método do Supabase para fazer logout
8. **Metadata**: Passamos `name` e `role` no signup para criar o perfil

---

## 📝 Passo 4: Atualizar Tipos

Vamos atualizar os tipos para trabalhar com o sistema de perfis.

### 4.1 Abrir o arquivo

Abra `src/types/user.ts`

### 4.2 Adicionar novos tipos

Adicione estes tipos ao final do arquivo:

```typescript
// Tipo para perfil do Supabase (combina auth.users + profiles)
export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
  updatedAt?: string;
}

// Tipo para criar perfil (usado no signup)
export interface SignupData {
  email: string;
  password: string;
  name: string;
  role?: string;
}
```

**O arquivo completo deve ficar assim:**

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

// Novos tipos para Auth do Supabase
export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
  updatedAt?: string;
}

export interface SignupData {
  email: string;
  password: string;
  name: string;
  role?: string;
}
```

---

## 🔄 Passo 5: Atualizar userService

Agora vamos modificar o `userService` para trabalhar com perfis ao invés de uma tabela users separada.

### 5.1 Abrir o arquivo

Abra `src/services/userService.ts`

### 5.2 Substituir TODO o conteúdo

Substitua por este código:

```typescript
import type { UserProfile, UpdateUserData } from '../types/user';
import { supabase } from '../lib/supabase';

export const userService = {
  // Buscar todos os perfis (com email do auth.users)
  getAll: async (): Promise<UserProfile[]> => {
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (profilesError) {
      throw new Error(profilesError.message);
    }

    // Buscar emails dos usuários
    const userIds = profiles?.map((p) => p.id) || [];
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();

    // Se não tiver permissão admin, buscar emails individualmente
    // Para desenvolvimento, vamos usar uma abordagem diferente
    const profilesWithEmail: UserProfile[] = (profiles || []).map((profile) => ({
      id: profile.id,
      email: '', // Vamos buscar depois ou exibir apenas nos detalhes
      name: profile.name,
      role: profile.role,
      createdAt: profile.created_at,
      updatedAt: profile.updated_at,
    }));

    // Buscar emails via RPC ou função customizada
    // Por enquanto, retornamos sem email (você pode adicionar depois)
    return profilesWithEmail;
  },

  // Buscar perfil por ID
  getById: async (id: string): Promise<UserProfile | null> => {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(error.message);
    }

    if (!profile) return null;

    // Buscar email do usuário
    const { data: userData } = await supabase.auth.admin.getUserById(id);
    const email = userData?.user?.email || '';

    return {
      id: profile.id,
      email,
      name: profile.name,
      role: profile.role,
      createdAt: profile.created_at,
      updatedAt: profile.updated_at,
    };
  },

  // Buscar perfil do usuário atual
  getCurrentProfile: async (): Promise<UserProfile | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return null;

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(error.message);
    }

    if (!profile) return null;

    return {
      id: profile.id,
      email: user.email || '',
      name: profile.name,
      role: profile.role,
      createdAt: profile.created_at,
      updatedAt: profile.updated_at,
    };
  },

  // Atualizar perfil
  update: async (id: string, data: UpdateUserData): Promise<UserProfile | null> => {
    const updateData: Record<string, any> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.role !== undefined) updateData.role = data.role;
    updateData.updated_at = new Date().toISOString();

    // Se mudou senha, atualizar no auth
    if (data.password) {
      const { error: passwordError } = await supabase.auth.updateUser({
        password: data.password,
      });
      if (passwordError) {
        throw new Error(passwordError.message);
      }
    }

    // Atualizar perfil
    const { data: updatedProfile, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    if (!updatedProfile) return null;

    // Buscar email
    const { data: userData } = await supabase.auth.admin.getUserById(id);
    const email = userData?.user?.email || '';

    return {
      id: updatedProfile.id,
      email,
      name: updatedProfile.name,
      role: updatedProfile.role,
      createdAt: updatedProfile.created_at,
      updatedAt: updatedProfile.updated_at,
    };
  },

  // Excluir usuário (remove do auth e do perfil)
  delete: async (id: string): Promise<boolean> => {
    // Deletar usuário (remove automaticamente o perfil por CASCADE)
    const { error } = await supabase.auth.admin.deleteUser(id);

    if (error) {
      throw new Error(error.message);
    }

    return true;
  },
};
```

**⚠️ NOTA IMPORTANTE:** 
O código acima usa `supabase.auth.admin` que requer permissões de admin. Para desenvolvimento, você pode criar uma função SQL no Supabase que retorna perfis com emails, ou usar uma abordagem diferente.

**Versão simplificada (sem admin API):**

Se você não tiver acesso à API admin, use esta versão:

  // Buscar perfil do usuário atual
  getCurrentProfile: async (): Promise<UserProfile | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return null;

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(error.message);
    }

    if (!profile) return null;

    return {
      id: profile.id,
      email: user.email || '',
      name: profile.name,
      role: profile.role,
      createdAt: profile.created_at,
      updatedAt: profile.updated_at,
    };
  },

  // Atualizar perfil
  update: async (id: string, data: UpdateUserData): Promise<UserProfile | null> => {
    const updateData: Record<string, any> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.role !== undefined) updateData.role = data.role;
    updateData.updated_at = new Date().toISOString();

    // Se mudou senha, atualizar no auth (apenas para usuário atual)
    const { data: { user } } = await supabase.auth.getUser();
    if (data.password && user?.id === id) {
      const { error: passwordError } = await supabase.auth.updateUser({
        password: data.password,
      });
      if (passwordError) {
        throw new Error(passwordError.message);
      }
    }

    // Atualizar perfil
    const { data: updatedProfile, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    if (!updatedProfile) return null;

    // Buscar email usando função SQL ou do usuário atual
    if (user?.id === id) {
      // Se for o próprio usuário, usar email da sessão
      return {
        id: updatedProfile.id,
        email: user.email || '',
        name: updatedProfile.name,
        role: updatedProfile.role,
        createdAt: updatedProfile.created_at,
        updatedAt: updatedProfile.updated_at,
      };
    } else {
      // Para outros usuários, usar função SQL
      const { data: profileData } = await supabase.rpc('get_profile_with_email', {
        profile_id: id,
      });

      const email = profileData && profileData[0] ? profileData[0].email : '';

      return {
        id: updatedProfile.id,
        email,
        name: updatedProfile.name,
        role: updatedProfile.role,
        createdAt: updatedProfile.created_at,
        updatedAt: updatedProfile.updated_at,
      };
    }
  },

  // Excluir perfil (apenas o próprio usuário ou admin pode deletar)
  delete: async (id: string): Promise<boolean> => {
    const { data: { user } } = await supabase.auth.getUser();
    
    // Verificar se é o próprio usuário ou admin
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    // Buscar role do perfil para verificar se é admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin = profile?.role === 'admin';
    const isOwnProfile = user.id === id;

    // Só pode deletar se for o próprio perfil ou se for admin
    if (!isOwnProfile && !isAdmin) {
      throw new Error('Você não tem permissão para deletar este perfil');
    }

    // Deletar perfil
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(error.message);
    }

    // Se for o próprio usuário, fazer logout
    if (isOwnProfile) {
      await supabase.auth.signOut();
    }

    return true;
  },
};
```

### 6.3 Explicação do código

**O que mudou?**

1. **`getAll()`**: Usa `supabase.rpc('get_profiles_with_emails')` - chama função SQL que retorna perfis com emails
2. **`getById()`**: Usa `supabase.rpc('get_profile_with_email')` - chama função SQL para buscar um perfil específico
3. **`getCurrentProfile()`**: Mantém como estava (já funciona sem admin)
4. **`update()`**: Usa função SQL quando precisa buscar email de outro usuário
5. **`delete()`**: Verifica permissões (próprio usuário ou admin) antes de deletar

**Métodos importantes:**
- `supabase.rpc('nome_funcao', { parametros })` - Chama função SQL customizada
- `SECURITY DEFINER` - Permite função acessar `auth.users` sem API admin
- `INNER JOIN` - Junta tabelas para pegar dados relacionados

**Vantagens desta abordagem:**
- ✅ Não precisa de API admin
- ✅ Emails aparecem corretamente
- ✅ Mais seguro (função SQL com permissões controladas)
- ✅ Funciona em desenvolvimento e produção

---

## 🔐 Passo 6: Atualizar Página de Login

Vamos atualizar a página de login para usar o novo AuthContext.

### 6.1 Abrir o arquivo

Abra `src/pages/Login.tsx`

### 6.2 Atualizar o handleSubmit

O código do login já deve funcionar, mas vamos melhorar as mensagens de erro:

```typescript
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
```

O código já está assim, então não precisa mudar muito. Mas você pode adicionar um link para "Criar conta" se quiser.

---

## 👥 Passo 7: Atualizar Página de Usuários

Agora vamos atualizar a página de usuários para usar o novo sistema.

### 7.1 Mudanças principais

1. Usar `userService.getAll()` (já funciona)
2. Para criar usuário, usar `signup()` do AuthContext ao invés de `create()`
3. Atualizar tipos para `UserProfile`

### 7.2 Atualizar imports

No `src/pages/Users.tsx`, atualize os imports:

```typescript
import type { UserProfile, UpdateUserData } from '../types/user';
```

### 7.3 Atualizar estado

```typescript
const [users, setUsers] = useState<UserProfile[]>([]);
```

### 7.4 Atualizar função de criar usuário

Substitua a função `handleSubmit` no modal de criar:

```typescript
const handleSubmit = async (values: typeof form.values) => {
  try {
    if (editingUser) {
      // Atualizar (mesmo código)
      const updateData: UpdateUserData = {
        name: values.name,
        role: values.role,
      };
      if (values.password) {
        updateData.password = values.password;
      }
      await userService.update(editingUser.id, updateData);
      notifications.show({
        title: 'Sucesso',
        message: 'Usuário atualizado com sucesso!',
        color: 'green',
      });
    } else {
      // Criar novo usuário usando signup
      const success = await signup(
        values.email,
        values.password,
        values.name,
        values.role
      );
      
      if (success) {
        notifications.show({
          title: 'Sucesso',
          message: 'Usuário criado com sucesso!',
          color: 'green',
        });
      } else {
        notifications.show({
          title: 'Erro',
          message: 'Erro ao criar usuário',
          color: 'red',
        });
        return; // Não fechar modal se erro
      }
    }
    handleCloseModal();
    loadUsers();
  } catch (error: any) {
    notifications.show({
      title: 'Erro',
      message: error.message || (editingUser ? 'Erro ao atualizar usuário' : 'Erro ao criar usuário'),
      color: 'red',
    });
  }
};
```

### 7.5 Adicionar signup no useAuth

No início do componente:

```typescript
const { logout, signup } = useAuth();
```

---

## 🧪 Passo 8: Testar

### 8.1 Criar primeiro usuário

1. Execute `yarn dev`
2. Acesse `http://localhost:5173`
3. Você não conseguirá fazer login ainda (não há usuários)
4. Vá para a página de usuários (será redirecionado para login)
5. Crie um usuário diretamente no Supabase ou adicione um botão de cadastro

### 8.2 Criar usuário via Supabase (temporário)

1. No painel do Supabase, vá em **"Authentication"**
2. Clique em **"Users"**
3. Clique em **"Add user"** ou **"Create new user"**
4. Preencha:
   - Email: `admin@test.com`
   - Password: `senha123`
   - Auto Confirm User: ✅ (marca isso)
5. Clique em **"Create user"**

### 8.3 Testar login

1. Volte para a aplicação
2. Faça login com o usuário criado
3. Deve funcionar! ✅

### 8.4 Verificar perfil

1. No Supabase, vá em **"Table Editor"**
2. Clique na tabela `profiles`
3. Você deve ver o perfil criado automaticamente!

---

## 🎨 Passo 9: (Opcional) Adicionar Página de Cadastro

Você pode criar uma página separada para cadastro de novos usuários.

### 9.1 Criar arquivo

Crie `src/pages/Signup.tsx`:

```typescript
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Container,
  Paper,
  Title,
  TextInput,
  PasswordInput,
  Button,
  Stack,
  Text,
  Select,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useAuth } from '../contexts/AuthContext';
import { notifications } from '@mantine/notifications';

export default function Signup() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [loading, setLoading] = useState(false);

  const form = useForm({
    initialValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'user',
    },
    validate: {
      name: (value) => (!value ? 'Nome é obrigatório' : null),
      email: (value) => (!value ? 'Email é obrigatório' : /^\S+@\S+$/.test(value) ? null : 'Email inválido'),
      password: (value) => (!value ? 'Senha é obrigatória' : value.length < 6 ? 'Senha deve ter pelo menos 6 caracteres' : null),
      confirmPassword: (value, values) => 
        value !== values.password ? 'Senhas não coincidem' : null,
      role: (value) => (!value ? 'Perfil é obrigatório' : null),
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);
    try {
      const success = await signup(
        values.email,
        values.password,
        values.name,
        values.role
      );
      
      if (success) {
        notifications.show({
          title: 'Sucesso',
          message: 'Conta criada com sucesso! Faça login para continuar.',
          color: 'green',
        });
        navigate('/login');
      } else {
        notifications.show({
          title: 'Erro',
          message: 'Erro ao criar conta',
          color: 'red',
        });
      }
    } catch (error) {
      notifications.show({
        title: 'Erro',
        message: 'Erro ao criar conta',
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
          Criar Conta
        </Title>
        <Text c="dimmed" size="sm" ta="center" mt={5} mb="xl">
          Preencha os dados para criar sua conta
        </Text>

        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            <TextInput
              label="Nome"
              placeholder="Seu nome completo"
              required
              {...form.getInputProps('name')}
            />
            <TextInput
              label="Email"
              placeholder="seu@email.com"
              required
              {...form.getInputProps('email')}
            />
            <PasswordInput
              label="Senha"
              placeholder="Mínimo 6 caracteres"
              required
              {...form.getInputProps('password')}
            />
            <PasswordInput
              label="Confirmar Senha"
              placeholder="Digite a senha novamente"
              required
              {...form.getInputProps('confirmPassword')}
            />
            <Select
              label="Perfil"
              placeholder="Selecione o perfil"
              required
              data={[
                { value: 'user', label: 'Usuário' },
                { value: 'admin', label: 'Administrador' },
              ]}
              {...form.getInputProps('role')}
            />
            <Button type="submit" fullWidth mt="md" loading={loading}>
              Criar Conta
            </Button>
            <Text size="sm" ta="center" mt="md">
              Já tem uma conta?{' '}
              <Link to="/login" style={{ color: 'var(--mantine-color-blue-6)' }}>
                Fazer login
              </Link>
            </Text>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}
```

### 9.2 Adicionar rota

No `src/App.tsx`, adicione:

```typescript
<Route path="/signup" element={<Signup />} />
```

---

## ✅ Checklist Final

- [X] Configurou Auth no Supabase
- [X] Criou tabela `profiles` com SQL
- [X] Criou função e trigger para auto-criar perfil
- [X] Atualizou `AuthContext.tsx`
- [X] Atualizou tipos em `user.ts`
- [X] Atualizou `userService.ts`
- [X] Atualizou página de Login
- [X] Atualizou página de Usuários
- [ ] Criou usuário de teste no Supabase
- [ ] Testou login
- [ ] Verificou que perfil foi criado automaticamente

---

## 🎓 O que você aprendeu?

1. ✅ Como usar Auth do Supabase (mais seguro)
2. ✅ Como criar tabela de perfis relacionada com auth.users
3. ✅ Como usar triggers para criar dados automaticamente
4. ✅ Como gerenciar sessões com Supabase Auth
5. ✅ Como fazer signup, login e logout com Supabase

Parabéns! Agora você tem um sistema de autenticação profissional! 🎉

---

**Dúvidas?** Siga os passos e me avise se encontrar algum problema!

