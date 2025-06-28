
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface HealthDataEntry {
  id?: string;
  user_id?: string;
  date: string;
  mood: number;
  energy: number;
  sleep_hours: number;
  exercise_minutes: number;
  stress_level: number;
  water_intake: number;
  created_at?: string;
  updated_at?: string;
}

export const useHealthData = () => {
  const [healthData, setHealthData] = useState<HealthDataEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchHealthData = async () => {
    if (!user) {
      setHealthData([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('health_data')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) {
        console.error('Error fetching health data:', error);
        toast.error('Failed to load health data');
        return;
      }

      setHealthData(data || []);
    } catch (error) {
      console.error('Error fetching health data:', error);
      toast.error('Failed to load health data');
    } finally {
      setLoading(false);
    }
  };

  const insertHealthData = async (entries: HealthDataEntry[], insertMode: 'merge' | 'overwrite' | 'new' = 'merge') => {
    if (!user) {
      toast.error('User not authenticated');
      return { success: false, added: 0, skipped: 0, replaced: 0 };
    }

    try {
      let added = 0;
      let skipped = 0;
      let replaced = 0;

      if (insertMode === 'overwrite') {
        // Delete existing data for the date range
        const dates = entries.map(entry => entry.date);
        const { error: deleteError } = await supabase
          .from('health_data')
          .delete()
          .eq('user_id', user.id)
          .in('date', dates);

        if (deleteError) {
          console.error('Error deleting existing data:', deleteError);
          toast.error('Failed to overwrite existing data');
          return { success: false, added: 0, skipped: 0, replaced: 0 };
        }
      }

      for (const entry of entries) {
        const dataToInsert = {
          ...entry,
          user_id: user.id,
        };

        if (insertMode === 'merge') {
          // Try to upsert (insert or update)
          const { error: upsertError } = await supabase
            .from('health_data')
            .upsert(dataToInsert, { 
              onConflict: 'user_id,date',
              ignoreDuplicates: false 
            });

          if (upsertError) {
            console.error('Error upserting data:', upsertError);
            skipped++;
          } else {
            // Check if this was an update or insert by querying
            const { data: existing } = await supabase
              .from('health_data')
              .select('created_at, updated_at')
              .eq('user_id', user.id)
              .eq('date', entry.date)
              .single();

            if (existing && existing.created_at !== existing.updated_at) {
              replaced++;
            } else {
              added++;
            }
          }
        } else {
          // Insert only (for 'new' mode or after 'overwrite')
          const { error: insertError } = await supabase
            .from('health_data')
            .insert(dataToInsert);

          if (insertError) {
            console.error('Error inserting data:', insertError);
            skipped++;
          } else {
            added++;
          }
        }
      }

      // Refresh the data after insertion
      await fetchHealthData();

      const successMessage = `✅ CSV import complete! ${added} entries added${replaced > 0 ? `, ${replaced} updated` : ''}${skipped > 0 ? `, ${skipped} skipped` : ''}.`;
      toast.success(successMessage);

      return { success: true, added, skipped, replaced };
    } catch (error) {
      console.error('Error inserting health data:', error);
      toast.error('Failed to save health data');
      return { success: false, added: 0, skipped: 0, replaced: 0 };
    }
  };

  const addSingleEntry = async (entry: Omit<HealthDataEntry, 'user_id'>) => {
    if (!user) {
      toast.error('User not authenticated');
      return false;
    }

    try {
      const { error } = await supabase
        .from('health_data')
        .insert({
          ...entry,
          user_id: user.id,
        });

      if (error) {
        console.error('Error adding health entry:', error);
        toast.error('Failed to save health entry');
        return false;
      }

      toast.success('Health entry saved successfully!');
      await fetchHealthData(); // Refresh data
      return true;
    } catch (error) {
      console.error('Error adding health entry:', error);
      toast.error('Failed to save health entry');
      return false;
    }
  };

  useEffect(() => {
    fetchHealthData();
  }, [user]);

  return {
    healthData,
    loading,
    fetchHealthData,
    insertHealthData,
    addSingleEntry,
    refreshData: fetchHealthData
  };
};
