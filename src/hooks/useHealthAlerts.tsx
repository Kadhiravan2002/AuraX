
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

export interface HealthAlert {
  id: string;
  user_id: string;
  alert_type: 'sleep_deficiency' | 'high_stress';
  alert_message: string;
  triggered_date: string;
  dismissed_at: string | null;
  created_at: string;
  updated_at: string;
}

export const useHealthAlerts = () => {
  const [alerts, setAlerts] = useState<HealthAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchAlerts = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      console.log('Fetching health alerts for user:', user.id);
      
      const { data, error } = await supabase
        .from('health_alerts')
        .select('*')
        .eq('user_id', user.id)
        .is('dismissed_at', null) // Only get non-dismissed alerts
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching health alerts:', error);
        toast({
          title: "Error loading alerts",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      console.log('Fetched health alerts:', data);
      setAlerts(data || []);
    } catch (error) {
      console.error('Error in fetchAlerts:', error);
      toast({
        title: "Error",
        description: "Failed to load health alerts",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const dismissAlert = async (alertId: string) => {
    try {
      console.log('Dismissing alert:', alertId);
      
      const { error } = await supabase
        .from('health_alerts')
        .update({ dismissed_at: new Date().toISOString() })
        .eq('id', alertId);

      if (error) {
        console.error('Error dismissing alert:', error);
        toast({
          title: "Error dismissing alert",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      // Remove the dismissed alert from local state
      setAlerts(prev => prev.filter(alert => alert.id !== alertId));
      
      toast({
        title: "Alert dismissed",
        description: "The health alert has been dismissed.",
      });
    } catch (error) {
      console.error('Error in dismissAlert:', error);
      toast({
        title: "Error",
        description: "Failed to dismiss alert",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    if (user) {
      fetchAlerts();
    }
  }, [user]);

  return {
    alerts,
    loading,
    fetchAlerts,
    dismissAlert
  };
};
