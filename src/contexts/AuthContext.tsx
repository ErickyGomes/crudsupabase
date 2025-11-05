import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

interface LoginResult {
  success: boolean;
  errorMessage?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
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

  const login = async (email: string, password: string): Promise<LoginResult> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Erro no login:', error.message);
        
        // Verificar se o erro é de email não confirmado
        // O Supabase retorna diferentes mensagens dependendo da configuração
        const errorMessage = error.message.toLowerCase();
        if (errorMessage.includes('email not confirmed') || 
            errorMessage.includes('email_not_confirmed') ||
            errorMessage.includes('confirm your email') ||
            errorMessage.includes('email address not confirmed')) {
          return {
            success: false,
            errorMessage: 'Por favor, confirme seu email antes de fazer login. Verifique sua caixa de entrada.',
          };
        }
        
        return {
          success: false,
          errorMessage: 'Email ou senha inválidos',
        };
      }

      if (data.user) {
        // Verificar se o email está confirmado
        // Se o email não foi confirmado mas foi enviado um email de confirmação
        if (data.user.confirmation_sent_at && !data.user.email_confirmed_at) {
          return {
            success: false,
            errorMessage: 'Por favor, confirme seu email antes de fazer login. Verifique sua caixa de entrada.',
          };
        }
        
        setUser(data.user);
        return { success: true };
      }

      return {
        success: false,
        errorMessage: 'Erro ao fazer login',
      };
    } catch (error) {
      console.error('Erro no login:', error);
      return {
        success: false,
        errorMessage: 'Erro ao fazer login',
      };
    }
  };

  const signup = async (
    email: string,
    password: string,
    name: string,
    role: string = 'user'
  ): Promise<boolean> => {
    try {
      const { error } = await supabase.auth.signUp({
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
