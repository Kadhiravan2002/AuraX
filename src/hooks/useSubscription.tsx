
import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

interface Subscription {
  id: string;
  plan: 'free' | 'quarterly' | 'halfyearly' | 'annual';
  payment_status: 'pending' | 'active' | 'cancelled' | 'expired';
  start_date: string;
  end_date: string | null;
  razorpay_payment_id: string | null;
  razorpay_order_id: string | null;
}

interface SubscriptionContextType {
  subscription: Subscription | null;
  loading: boolean;
  refreshSubscription: () => Promise<void>;
  createRazorpayOrder: (plan: string) => Promise<any>;
  verifyPayment: (paymentData: any) => Promise<void>;
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
        // Type assertion to handle the fact that the database now has Razorpay fields
        const rawData = data as any;
        const typedSubscription: Subscription = {
          id: rawData.id,
          plan: rawData.plan as 'free' | 'quarterly' | 'halfyearly' | 'annual',
          payment_status: rawData.payment_status as 'pending' | 'active' | 'cancelled' | 'expired',
          start_date: rawData.start_date,
          end_date: rawData.end_date,
          razorpay_payment_id: rawData.razorpay_payment_id || null,
          razorpay_order_id: rawData.razorpay_order_id || null
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

  const createRazorpayOrder = async (plan: string): Promise<any> => {
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase.functions.invoke('create-razorpay-order', {
      body: { plan }
    });

    if (error) throw error;
    return data;
  };

  const verifyPayment = async (paymentData: any) => {
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase.functions.invoke('verify-razorpay-payment', {
      body: paymentData
    });

    if (error) throw error;
    await refreshSubscription();
  };

  useEffect(() => {
    refreshSubscription();
  }, [user]);

  const value = {
    subscription,
    loading,
    refreshSubscription,
    createRazorpayOrder,
    verifyPayment
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};
