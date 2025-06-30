
import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { shouldGrantPremiumAccess } from '@/utils/premiumWhitelist';
import { toast } from '@/components/ui/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resendConfirmation: (email: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for email verification on page load
    const checkEmailVerification = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const accessToken = urlParams.get('access_token');
      const refreshToken = urlParams.get('refresh_token');
      const type = urlParams.get('type');

      if (type === 'email_confirmation' || type === 'signup') {
        if (accessToken && refreshToken) {
          // Set the session with the tokens from the URL
          supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          }).then(({ data, error }) => {
            if (error) {
              console.error('Error setting session:', error);
              toast({
                title: "Verification Error",
                description: "There was an issue verifying your email. Please try again.",
                variant: "destructive"
              });
            } else {
              toast({
                title: "Email Verified!",
                description: "Welcome to AuraX! Your email has been successfully verified.",
              });
              // Clean up the URL parameters
              window.history.replaceState({}, document.title, window.location.pathname);
            }
          });
        } else {
          // Handle case where user clicks verification link but is already verified
          toast({
            title: "Email already verified",
            description: "Welcome back to AuraX.",
          });
        }
      }
    };

    // Check for verification on mount
    checkEmailVerification();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Handle email confirmation event
        if (event === 'SIGNED_IN' && session?.user) {
          const urlParams = new URLSearchParams(window.location.search);
          const type = urlParams.get('type');
          
          if (type === 'email_confirmation' || type === 'signup') {
            toast({
              title: "Email Verified!",
              description: "Welcome to AuraX! Your email has been successfully verified.",
            });
            // Clean up the URL parameters
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        }

        // Auto-grant premium access for whitelisted users on login
        if (event === 'SIGNED_IN' && session?.user?.email) {
          const shouldGrant = shouldGrantPremiumAccess(session.user.email);
          const currentMetadata = session.user.user_metadata || {};
          
          if (shouldGrant && !currentMetadata.isPremium) {
            console.log('Granting premium access to whitelisted user:', session.user.email);
            try {
              await supabase.auth.updateUser({
                data: { ...currentMetadata, isPremium: true }
              });
            } catch (error) {
              console.error('Failed to update user metadata:', error);
            }
          }
        }
      }
    );

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName?: string) => {
    // Use the production domain for redirect
    const redirectUrl = 'https://aurax-track.lovable.app/';
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: fullName ? { full_name: fullName } : undefined
      }
    });
    
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const resendConfirmation = async (email: string) => {
    // Use the production domain for redirect
    const redirectUrl = 'https://aurax-track.lovable.app/';
    
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: redirectUrl
      }
    });
    
    return { error };
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    resendConfirmation
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
