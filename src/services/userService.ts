import type { UserProfile, UpdateUserData } from '../types/user';
import { supabase } from '../lib/supabase';

export const userService = {
  // Buscar todos os perfis (com email do auth.users)
  getAll: async (): Promise<UserProfile[]> => {
    // Usar função SQL customizada que retorna perfis com emails
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
    // Usar função SQL customizada que retorna perfil com email
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

    // Buscar email usando função SQL ou do usuário atual
    const { data: { user } } = await supabase.auth.getUser();
    
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