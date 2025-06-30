
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
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    
    if (!user?.email) throw new Error("User not authenticated");

    const { plan } = await req.json();
    
    const razorpayKeyId = "rzp_test_mGGfOBXUQqWUmM";
    const razorpayKeySecret = Deno.env.get("RAZORPAY_KEY_SECRET") || "";

    // Plan pricing in INR (paise)
    const planPricing = {
      quarterly: { amount: 19900, duration: "3 months" }, // ₹199 for 3 months
      halfyearly: { amount: 34900, duration: "6 months" }, // ₹349 for 6 months
      annual: { amount: 59900, duration: "1 year" } // ₹599 for 1 year
    };

    const pricing = planPricing[plan as keyof typeof planPricing];
    if (!pricing) throw new Error("Invalid plan");

    // Create Razorpay order
    const orderData = {
      amount: pricing.amount,
      currency: "INR",
      receipt: `order_${user.id}_${Date.now()}`,
      notes: {
        user_id: user.id,
        plan: plan,
        email: user.email
      }
    };

    const auth = btoa(`${razorpayKeyId}:${razorpayKeySecret}`);
    
    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(orderData),
    });

    if (!response.ok) {
      throw new Error("Failed to create Razorpay order");
    }

    const order = await response.json();

    return new Response(JSON.stringify({ 
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: razorpayKeyId
    }), {
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
