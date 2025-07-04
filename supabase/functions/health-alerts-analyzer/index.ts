
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface HealthData {
  user_id: string;
  date: string;
  sleep_hours: number | null;
  stress_level: number | null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting health alerts analysis...');

    // Get the date range for analysis (last 7 days)
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);

    const todayStr = today.toISOString().split('T')[0];
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

    console.log(`Analyzing data from ${sevenDaysAgoStr} to ${todayStr}`);

    // Fetch all health data from the last 7 days
    const { data: healthData, error: healthError } = await supabase
      .from('health_data')
      .select('user_id, date, sleep_hours, stress_level')
      .gte('date', sevenDaysAgoStr)
      .lte('date', todayStr)
      .order('user_id')
      .order('date');

    if (healthError) {
      console.error('Error fetching health data:', healthError);
      throw healthError;
    }

    console.log(`Found ${healthData?.length || 0} health records to analyze`);

    // Group data by user
    const userDataMap = new Map<string, HealthData[]>();
    
    healthData?.forEach((record) => {
      const userId = record.user_id;
      if (!userDataMap.has(userId)) {
        userDataMap.set(userId, []);
      }
      userDataMap.get(userId)!.push(record);
    });

    console.log(`Analyzing data for ${userDataMap.size} users`);

    const alertsToInsert = [];

    // Analyze each user's data
    for (const [userId, userHealthData] of userDataMap) {
      console.log(`Analyzing user ${userId} with ${userHealthData.length} records`);
      
      // Sort by date to ensure proper order
      userHealthData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // Check for sleep deficiency (less than 5 hours for 3+ consecutive days)
      let consecutiveLowSleepDays = 0;
      let maxConsecutiveLowSleep = 0;

      for (const record of userHealthData) {
        if (record.sleep_hours !== null && record.sleep_hours < 5) {
          consecutiveLowSleepDays++;
          maxConsecutiveLowSleep = Math.max(maxConsecutiveLowSleep, consecutiveLowSleepDays);
        } else {
          consecutiveLowSleepDays = 0;
        }
      }

      if (maxConsecutiveLowSleep >= 3) {
        console.log(`User ${userId} has ${maxConsecutiveLowSleep} consecutive low sleep days`);
        alertsToInsert.push({
          user_id: userId,
          alert_type: 'sleep_deficiency',
          alert_message: `You've had less than 5 hours of sleep for ${maxConsecutiveLowSleep} days — consider adjusting your sleep cycle.`,
          triggered_date: todayStr
        });
      }

      // Check for high stress (stress_level > 6 for 4+ days in current week)
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay()); // Go to Sunday
      const startOfWeekStr = startOfWeek.toISOString().split('T')[0];

      const thisWeekData = userHealthData.filter(record => 
        record.date >= startOfWeekStr && record.stress_level !== null
      );

      const highStressDays = thisWeekData.filter(record => 
        record.stress_level! > 6
      ).length;

      if (highStressDays >= 4) {
        console.log(`User ${userId} has ${highStressDays} high stress days this week`);
        alertsToInsert.push({
          user_id: userId,
          alert_type: 'high_stress',
          alert_message: 'Stress levels have been consistently high this week. Try relaxation activities.',
          triggered_date: todayStr
        });
      }
    }

    console.log(`Generated ${alertsToInsert.length} alerts to insert`);

    // Insert alerts (using upsert to avoid duplicates due to unique constraint)
    if (alertsToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('health_alerts')
        .upsert(alertsToInsert, {
          onConflict: 'user_id,alert_type,triggered_date',
          ignoreDuplicates: true
        });

      if (insertError) {
        console.error('Error inserting alerts:', insertError);
        throw insertError;
      }

      console.log(`Successfully inserted/updated ${alertsToInsert.length} alerts`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Analyzed ${userDataMap.size} users, generated ${alertsToInsert.length} alerts` 
      }),
      { 
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in health-alerts-analyzer:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
        status: 500 
      }
    );
  }
});
