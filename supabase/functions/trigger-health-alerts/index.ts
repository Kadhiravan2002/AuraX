
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Manually triggering health alerts analysis...');

    // Call the health-alerts-analyzer function
    const analyzerUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/health-alerts-analyzer`;
    const response = await fetch(analyzerUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();
    console.log('Health alerts analysis result:', result);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Health alerts analysis triggered successfully',
        result 
      }),
      { 
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error triggering health alerts analysis:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
        status: 500 
      }
    );
  }
});
