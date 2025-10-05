import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, AuthError } from '@supabase/supabase-js';
import { supabase, Profile, UserRole } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  isSigningUp: boolean;
  signUp: (email: string, password: string, fullName: string, role: UserRole) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSigningUp, setIsSigningUp] = useState(false);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (data && !error) {
      setProfile(data);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
        }
        setLoading(false);
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string, role: UserRole) => {
    setIsSigningUp(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        setIsSigningUp(false);
        return { error };
      }

      // ensure we have a user before creating profile rows
      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            role,
            full_name: fullName,
            email,
          });

        // If we couldn't create the base profile, return the error and stop
        if (profileError) {
          setIsSigningUp(false);
          return { error: profileError as unknown as AuthError };
        }

        // Create role-specific extended profiles, but don't block signup on failures here
        if (role === 'doctor') {
          try {
            await supabase
              .from('doctor_profiles')
              .insert({
                user_id: data.user.id,
                category_id: (await supabase.from('medical_categories').select('id').limit(1).single()).data?.id,
                qualifications: '',
                experience_years: 0,
              });
          } catch (err) {
            console.warn('doctor_profiles insert failed, continuing signup', err);
          }
        } else if (role === 'patient') {
          try {
            await supabase
              .from('patient_profiles')
              .insert({
                user_id: data.user.id,
              });
          } catch (err) {
            // don't block signup if patient_profiles insert fails (server policies/misconfig can cause 500s)
            console.warn('patient_profiles insert failed, continuing signup', err);
          }
        }
      }

      setIsSigningUp(false);
      return { error: null };
    } catch (err: any) {
      setIsSigningUp(false);
      return { error: err as AuthError };
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, isSigningUp, signUp, signIn, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
