
import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

interface Subscription {
  id: string;
  plan: 'free' | 'quarterly' | 'halfyearly' | 'annual';
  payment_status: 'pending' | 'active' | 'cancelled' | 'expired';
  start_date: string;
  end_date: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
}

interface SubscriptionContextType {
  subscription: Subscription | null;
  loading: boolean;
  refreshSubscription: () => Promise<void>;
  createCheckoutSession: (plan: string) => Promise<string>;
  cancelSubscription: () => Promise<void>;
  createCustomerPortalSession: () => Promise<string>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};

interface SubscriptionProviderProps {
  children: ReactNode;
}

export const SubscriptionProvider = ({ children }: SubscriptionProviderProps) => {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const refreshSubscription = async () => {
    if (!user) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching subscription:', error);
        return;
      }

      if (data) {
        // Cast the data to match our Subscription interface
        const typedSubscription: Subscription = {
          id: data.id,
          plan: data.plan as 'free' | 'quarterly' | 'halfyearly' | 'annual',
          payment_status: data.payment_status as 'pending' | 'active' | 'cancelled' | 'expired',
          start_date: data.start_date,
          end_date: data.end_date,
          stripe_customer_id: data.stripe_customer_id,
          stripe_subscription_id: data.stripe_subscription_id
        };
        setSubscription(typedSubscription);
      } else {
        setSubscription(null);
      }
    } catch (error) {
      console.error('Error refreshing subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const createCheckoutSession = async (plan: string): Promise<string> => {
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase.functions.invoke('create-checkout', {
      body: { plan }
    });

    if (error) throw error;
    return data.url;
  };

  const cancelSubscription = async () => {
    if (!user || !subscription) throw new Error('No active subscription');

    const { error } = await supabase.functions.invoke('cancel-subscription');
    if (error) throw error;
    
    await refreshSubscription();
  };

  const createCustomerPortalSession = async (): Promise<string> => {
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase.functions.invoke('customer-portal');
    if (error) throw error;
    
    return data.url;
  };

  useEffect(() => {
    refreshSubscription();
  }, [user]);

  const value = {
    subscription,
    loading,
    refreshSubscription,
    createCheckoutSession,
    cancelSubscription,
    createCustomerPortalSession
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};
