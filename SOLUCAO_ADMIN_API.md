# Solução: Função SQL para Buscar Perfis com Emails

## 🎯 Problema

O código usa `supabase.auth.admin` que requer permissões de administrador. Para desenvolvimento, vamos criar uma função SQL que retorna perfis com emails sem precisar da API admin.

---

## 📝 Passo 1: Criar Função SQL no Supabase

### 1.1 Acessar SQL Editor

1. No painel do Supabase, vá em **"SQL Editor"**
2. Clique em **"New query"**

### 1.2 Criar Função para Buscar Perfis com Emails

Cole este SQL no editor:

```sql
-- Função para buscar todos os perfis com emails
CREATE OR REPLACE FUNCTION get_profiles_with_emails()
RETURNS TABLE (
  id UUID,
  email TEXT,
  name TEXT,
  role TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    au.email::TEXT,
    p.name,
    p.role,
    p.created_at,
    p.updated_at
  FROM profiles p
  INNER JOIN auth.users au ON p.id = au.id
  ORDER BY p.created_at DESC;
END;
$$;

-- Função para buscar um perfil específico com email
CREATE OR REPLACE FUNCTION get_profile_with_email(profile_id UUID)
RETURNS TABLE (
  id UUID,
  email TEXT,
  name TEXT,
  role TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    au.email::TEXT,
    p.name,
    p.role,
    p.created_at,
    p.updated_at
  FROM profiles p
  INNER JOIN auth.users au ON p.id = au.id
  WHERE p.id = profile_id;
END;
$$;

-- Dar permissão para a função ser chamada
GRANT EXECUTE ON FUNCTION get_profiles_with_emails() TO authenticated;
GRANT EXECUTE ON FUNCTION get_profiles_with_emails() TO anon;
GRANT EXECUTE ON FUNCTION get_profile_with_email(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_profile_with_email(UUID) TO anon;
```

### 1.3 Executar o SQL

1. Clique no botão **"Run"** (ou pressione Ctrl+Enter)
2. Você deve ver mensagens de sucesso

**O que isso faz?**
- Cria função `get_profiles_with_emails()` que retorna todos os perfis com emails
- Cria função `get_profile_with_email()` que retorna um perfil específico com email
- `SECURITY DEFINER` permite acessar `auth.users` mesmo sem permissão admin
- `INNER JOIN` junta `profiles` com `auth.users` para pegar o email

---

## 🔧 Passo 2: Atualizar userService.ts

Agora vamos atualizar o `userService` para usar essas funções SQL ao invés da API admin.

### 2.1 Substituir o código

Substitua TODO o conteúdo de `src/services/userService.ts` por:

```typescript
import type { UserProfile, UpdateUserData } from '../types/user';
import { supabase } from '../lib/supabase';

export const userService = {
  // Buscar todos os perfis (com email do auth.users)
  getAll: async (): Promise<UserProfile[]> => {
    // Usar função SQL customizada
    const { data, error } = await supabase.rpc('get_profiles_with_emails');

    if (error) {
      throw new Error(error.message);
    }

    return (data || []).map((profile: any) => ({
      id: profile.id,
      email: profile.email || '',
      name: profile.name,
      role: profile.role,
      createdAt: profile.created_at,
      updatedAt: profile.updated_at,
    }));
  },

  // Buscar perfil por ID
  getById: async (id: string): Promise<UserProfile | null> => {
    // Usar função SQL customizada
    const { data, error } = await supabase.rpc('get_profile_with_email', {
      profile_id: id,
    });

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(error.message);
    }

    if (!data || data.length === 0) return null;

    const profile = data[0];

    return {
      id: profile.id,
      email: profile.email || '',
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

    // Para o próprio usuário, podemos pegar email diretamente
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

  // Excluir perfil (apenas o próprio usuário pode deletar)
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

    // Deletar perfil (cascade vai deletar automaticamente do auth se necessário)
    // Mas para deletar do auth, precisaríamos de admin API
    // Por enquanto, só deletamos o perfil
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

### 2.2 Explicação das Mudanças

**O que mudou?**

1. **`getAll()`**: Usa `supabase.rpc('get_profiles_with_emails')` ao invés de API admin
2. **`getById()`**: Usa `supabase.rpc('get_profile_with_email')` ao invés de API admin
3. **`getCurrentProfile()`**: Mantém como estava (já funciona sem admin)
4. **`update()`**: Usa função SQL quando precisa buscar email de outro usuário
5. **`delete()`**: Deleta apenas o perfil (sem deletar do auth, pois requer admin)

**Novo método usado:**
- `supabase.rpc('nome_funcao', { parametros })` - Chama função SQL customizada

---

## 🧪 Passo 3: Testar

### 3.1 Testar getAll

1. Execute `yarn dev`
2. Faça login
3. Vá para a página de usuários
4. Verifique se os emails aparecem na lista

### 3.2 Testar getById

1. Clique em editar um usuário
2. Verifique se o email aparece no formulário

### 3.3 Verificar no Console

Se houver erros, abra o Console do navegador (F12) e verifique as mensagens.

---

## 🐛 Solução de Problemas

### Erro: "function get_profiles_with_emails() does not exist"

- Você esqueceu de executar o SQL
- Volte ao Passo 1 e execute o SQL novamente

### Erro: "permission denied for function"

- Verifique se executou os `GRANT EXECUTE` no SQL
- Execute novamente a parte dos GRANTs

### Emails não aparecem

- Verifique se a função SQL foi criada corretamente
- Veja se há erros no Console do navegador
- Teste a função diretamente no SQL Editor do Supabase

### Testar a Função SQL Diretamente

No SQL Editor do Supabase, teste:

```sql
-- Testar função
SELECT * FROM get_profiles_with_emails();
```

Se funcionar, deve retornar os perfis com emails.

---

## ✅ Checklist

- [ ] Criou função `get_profiles_with_emails()` no Supabase
- [ ] Criou função `get_profile_with_email()` no Supabase
- [ ] Executou os GRANTs de permissão
- [ ] Atualizou `userService.ts` com o novo código
- [ ] Testou `getAll()` - emails aparecem na lista
- [ ] Testou `getById()` - email aparece ao editar
- [ ] Verificou que não há erros no console

---

## 🎓 O que você aprendeu?

1. ✅ Como criar funções SQL no Supabase
2. ✅ Como usar `SECURITY DEFINER` para acessar `auth.users`
3. ✅ Como chamar funções SQL via `supabase.rpc()`
4. ✅ Como fazer JOIN entre tabelas no SQL
5. ✅ Como resolver problemas de permissão sem API admin

---

## 📚 Próximos Passos (Opcional)

### 1. Adicionar Filtros na Função SQL

Você pode adicionar parâmetros opcionais para filtrar:

```sql
CREATE OR REPLACE FUNCTION get_profiles_with_emails(
  filter_role TEXT DEFAULT NULL
)
RETURNS TABLE (...) AS $$
BEGIN
  RETURN QUERY
  SELECT ...
  FROM profiles p
  INNER JOIN auth.users au ON p.id = au.id
  WHERE (filter_role IS NULL OR p.role = filter_role)
  ORDER BY p.created_at DESC;
END;
$$;
```

### 2. Adicionar Busca por Nome

```sql
CREATE OR REPLACE FUNCTION search_profiles(search_term TEXT)
RETURNS TABLE (...) AS $$
BEGIN
  RETURN QUERY
  SELECT ...
  FROM profiles p
  INNER JOIN auth.users au ON p.id = au.id
  WHERE p.name ILIKE '%' || search_term || '%'
     OR au.email ILIKE '%' || search_term || '%'
  ORDER BY p.created_at DESC;
END;
$$;
```

---

**Pronto!** Agora você tem uma solução que funciona sem precisar da API admin! 🎉

