
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Setting up daily health alerts cron job...');

    // Enable required extensions
    const { error: cronError } = await supabase.rpc('enable_pg_cron');
    if (cronError && !cronError.message.includes('already exists')) {
      console.error('Error enabling pg_cron:', cronError);
    }

    const { error: netError } = await supabase.rpc('enable_pg_net');
    if (netError && !netError.message.includes('already exists')) {
      console.error('Error enabling pg_net:', netError);
    }

    // Create the cron job to run daily at 8 AM UTC
    const cronJobName = 'daily-health-alerts-analysis';
    const functionUrl = `${supabaseUrl}/functions/v1/health-alerts-analyzer`;
    
    const cronQuery = `
      SELECT cron.schedule(
        '${cronJobName}',
        '0 8 * * *', -- Every day at 8 AM UTC
        $$
        SELECT
          net.http_post(
            url:='${functionUrl}',
            headers:='{"Content-Type": "application/json", "Authorization": "Bearer ${supabaseAnonKey}"}'::jsonb,
            body:='{"automated": true, "time": "' || now() || '"}'::jsonb
          ) as request_id;
        $$
      );
    `;

    // First, try to unschedule any existing job with the same name
    try {
      await supabase.rpc('unschedule_cron_job', { job_name: cronJobName });
    } catch (error) {
      // Ignore error if job doesn't exist
      console.log('No existing cron job to remove');
    }

    // Execute the cron setup
    const { error: setupError } = await supabase.rpc('execute_sql', { 
      sql: cronQuery 
    });

    if (setupError) {
      console.error('Error setting up cron job:', setupError);
      throw setupError;
    }

    console.log('Daily health alerts cron job set up successfully');
    console.log('The system will now automatically run health analysis every day at 8 AM UTC');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Daily health alerts cron job configured successfully',
        schedule: 'Every day at 8:00 AM UTC'
      }),
      { 
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in setup-health-alerts-cron:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
        status: 500 
      }
    );
  }
});
