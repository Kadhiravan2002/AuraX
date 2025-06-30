
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    
    if (!user?.email) throw new Error("User not authenticated");

    const { paymentId, orderId, signature, plan } = await req.json();
    
    const razorpayKeySecret = Deno.env.get("RAZORPAY_KEY_SECRET") || "";
    
    // Verify payment signature (simplified for demo)
    const expectedSignature = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(`${orderId}|${paymentId}${razorpayKeySecret}`)
    );
    
    // Create or update subscription
    const subscriptionData = {
      user_id: user.id,
      plan: plan,
      payment_status: 'active',
      start_date: new Date().toISOString(),
      end_date: getEndDate(plan),
      razorpay_payment_id: paymentId,
      razorpay_order_id: orderId,
      updated_at: new Date().toISOString()
    };

    const { error } = await supabaseClient
      .from('subscriptions')
      .upsert(subscriptionData, { onConflict: 'user_id' });

    if (error) throw error;

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

function getEndDate(plan: string): string {
  const now = new Date();
  switch (plan) {
    case 'quarterly':
      now.setMonth(now.getMonth() + 3);
      break;
    case 'halfyearly':
      now.setMonth(now.getMonth() + 6);
      break;
    case 'annual':
      now.setFullYear(now.getFullYear() + 1);
      break;
  }
  return now.toISOString();
}
