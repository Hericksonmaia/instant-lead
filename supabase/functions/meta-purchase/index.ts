import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

async function sha256(str: string): Promise<string> {
  const buffer = new TextEncoder().encode(str);
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { leadId, saleValue, saleCurrency } = await req.json();

    if (!leadId || !saleValue) {
      throw new Error("Missing required fields: leadId, saleValue");
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch lead with link and workspace
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select(`
        *,
        redirect_links (
          name,
          workspace_id,
          workspaces (
            facebook_access_token,
            facebook_pixel_id
          )
        )
      `)
      .eq('id', leadId)
      .single();

    if (leadError || !lead) {
      console.error("Error fetching lead:", leadError);
      throw new Error("Lead not found");
    }

    const workspace = (lead.redirect_links as any)?.workspaces;
    const accessToken = workspace?.facebook_access_token;
    const pixelId = workspace?.facebook_pixel_id;

    if (!accessToken || !pixelId) {
      throw new Error("Facebook Pixel not configured for this workspace");
    }

    // Update lead as sold
    const { error: updateError } = await supabase
      .from('leads')
      .update({
        sold: true,
        sale_value: saleValue,
        sale_currency: saleCurrency || 'BRL',
        sale_date: new Date().toISOString(),
      })
      .eq('id', leadId);

    if (updateError) {
      console.error("Error updating lead:", updateError);
      throw new Error("Failed to update lead");
    }

    // Build user_data with hashing
    const userData: Record<string, any> = {};
    
    if (lead.phone) {
      userData.ph = [await sha256(lead.phone.replace(/\D/g, ""))];
    }
    if (lead.name) {
      const nameParts = lead.name.trim().split(" ");
      if (nameParts[0]) {
        userData.fn = [await sha256(nameParts[0].toLowerCase())];
      }
      if (nameParts.length > 1) {
        userData.ln = [await sha256(nameParts[nameParts.length - 1].toLowerCase())];
      }
    }
    userData.external_id = [await sha256(leadId)];
    
    if (lead.user_agent) {
      userData.client_user_agent = lead.user_agent;
    }
    if (lead.ip_address) {
      userData.client_ip_address = lead.ip_address;
    }
    if (lead.fbc) {
      userData.fbc = lead.fbc;
    }
    if (lead.fbp) {
      userData.fbp = lead.fbp;
    }

    const eventId = `purchase_${leadId}_${Date.now()}`;
    const eventTime = Math.floor(Date.now() / 1000);

    const event = {
      event_name: "Purchase",
      event_time: eventTime,
      event_id: eventId,
      event_source_url: lead.event_source_url || undefined,
      action_source: "website",
      user_data: userData,
      custom_data: {
        currency: saleCurrency || "BRL",
        value: parseFloat(saleValue),
        content_name: (lead.redirect_links as any)?.name || undefined,
        content_type: "product",
        order_id: `order_${leadId}`,
      },
    };

    console.log("Sending Purchase event to Meta CAPI:", {
      pixelId,
      eventId,
      value: saleValue,
      currency: saleCurrency,
    });

    const response = await fetch(
      `https://graph.facebook.com/v18.0/${pixelId}/events`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: [event],
          access_token: accessToken,
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error("Facebook API error:", result);
      throw new Error(`Facebook API error: ${JSON.stringify(result)}`);
    }

    console.log("Purchase event sent successfully:", result);

    return new Response(
      JSON.stringify({
        success: true,
        eventId,
        facebookResponse: result,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in meta-purchase:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
