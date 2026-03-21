import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export type AppRole = 'admin' | 'medico' | 'recepcao' | 'enfermagem' | 'financeiro';

export interface Clinica {
  id: string;
  nome: string;
  cnpj?: string;
  owner_id?: string;
}

interface UserProfile {
  id: string;
  nome: string;
  email: string;
  avatar?: string;
  telefone?: string;
  ativo: boolean;
}

interface UserWithRole extends UserProfile {
  role: AppRole | null;
  roles: AppRole[];
}

interface SupabaseAuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserWithRole | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, nome: string) => Promise<{ data: any; error: Error | null }>;
  signOut: () => Promise<void>;
  hasRole: (role: AppRole) => boolean;
  hasAnyRole: (roles: AppRole[]) => boolean;
  isAdmin: () => boolean;
  refreshProfile: () => Promise<void>;
}

const SupabaseAuthContext = createContext<SupabaseAuthContextType | undefined>(undefined);

export function SupabaseAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserWithRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        return null;
      }

      if (!profileData) {
        return null;
      }

      // Fetch roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (rolesError) {
        console.error('Error fetching roles:', rolesError);
      }

      const roles = (rolesData?.map(r => r.role) || []) as AppRole[];
      const primaryRole = roles.length > 0 ? roles[0] : null;

      return {
        id: profileData.id,
        nome: profileData.nome,
        email: profileData.email,
        avatar: profileData.avatar,
        telefone: profileData.telefone,
        ativo: profileData.ativo,
        role: primaryRole,
        roles,
      } as UserWithRole;
    } catch (error) {
      console.error('Error in fetchProfile:', error);
      return null;
    }
  };

  const refreshProfile = async () => {
    if (user) {
      const userProfile = await fetchProfile(user.id);
      setProfile(userProfile);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const syncSession = async (currentSession: Session | null) => {
      if (!isMounted) return;
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
    };

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, currentSession) => {
        void syncSession(currentSession);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      void syncSession(existingSession);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let isActive = true;

    const syncProfileFromUser = async () => {
      if (!user) {
        if (!isActive) return;
        setProfile(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      // Ensure session is fully available before running RLS-protected queries
      const { data: { session: latestSession } } = await supabase.auth.getSession();

      if (!isActive) return;

      if (!latestSession?.user || latestSession.user.id !== user.id) {
        setProfile(null);
        setIsLoading(false);
        return;
      }

      const userProfile = await fetchProfile(user.id);

      if (!isActive) return;
      setProfile(userProfile);
      setIsLoading(false);
    };

    void syncProfileFromUser();

    return () => {
      isActive = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally depends on user.id only, not the full user object
  }, [user?.id]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string, nome: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          nome,
          full_name: nome,
        },
      },
    });
    return { data, error: error as Error | null };
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setUser(null);
      setSession(null);
      setProfile(null);
    }
  };

  const hasRole = (role: AppRole): boolean => {
    if (!profile) return false;
    return profile.roles.includes(role);
  };

  const hasAnyRole = (roles: AppRole[]): boolean => {
    if (!profile) return false;
    if (profile.roles.includes('admin')) return true;
    return roles.some(role => profile.roles.includes(role));
  };

  const isAdmin = (): boolean => {
    return hasRole('admin');
  };

  return (
    <SupabaseAuthContext.Provider
      value={{
        user,
        session,
        profile,
        isLoading,
        signIn,
        signUp,
        signOut,
        hasRole,
        hasAnyRole,
        isAdmin,
        refreshProfile,
      }}
    >
      {children}
    </SupabaseAuthContext.Provider>
  );
}

export function useSupabaseAuth() {
  const context = useContext(SupabaseAuthContext);
  if (context === undefined) {
    throw new Error('useSupabaseAuth must be used within a SupabaseAuthProvider');
  }
  return context;
}
