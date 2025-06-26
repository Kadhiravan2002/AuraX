
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
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
    
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Check if customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    // Plan pricing in INR (paise)
    const planPricing = {
      quarterly: { amount: 19900, interval: "month", interval_count: 3 }, // ₹199 for 3 months
      halfyearly: { amount: 34900, interval: "month", interval_count: 6 }, // ₹349 for 6 months
      annual: { amount: 59900, interval: "year", interval_count: 1 } // ₹599 for 1 year
    };

    const pricing = planPricing[plan as keyof typeof planPricing];
    if (!pricing) throw new Error("Invalid plan");

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price_data: {
            currency: "inr",
            product_data: { 
              name: `AuraX ${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan`,
              description: `AuraX Premium Health Tracking - ${plan} subscription`
            },
            unit_amount: pricing.amount,
            recurring: { 
              interval: pricing.interval as "month" | "year",
              interval_count: pricing.interval_count
            },
          },
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${req.headers.get("origin")}/billing/success`,
      cancel_url: `${req.headers.get("origin")}/billing`,
      metadata: {
        user_id: user.id,
        plan: plan
      }
    });

    return new Response(JSON.stringify({ url: session.url }), {
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
