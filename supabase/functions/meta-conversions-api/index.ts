import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ConversionEvent {
  linkId: string;
  eventName: string;
  eventId: string;
  eventSourceUrl: string;
  userData: {
    em?: string;
    ph?: string;
    fn?: string;
    ln?: string;
    external_id?: string;
  };
  customData: Record<string, any>;
  userAgent: string;
  timestamp: number;
}

// Allowed event names to prevent abuse
const ALLOWED_EVENTS = new Set(["PageView", "Contact", "Lead", "ViewContent"]);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: ConversionEvent = await req.json();
    
    // Validate required fields
    if (!payload.linkId || !payload.eventName || !payload.eventId) {
      throw new Error("Missing required fields: linkId, eventName, or eventId");
    }

    // Validate event name against allowlist
    if (!ALLOWED_EVENTS.has(payload.eventName)) {
      return new Response(
        JSON.stringify({ error: "Invalid event name" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate eventId format (prevent injection)
    if (typeof payload.eventId !== 'string' || payload.eventId.length > 200) {
      return new Response(
        JSON.stringify({ error: "Invalid eventId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch link and workspace to get token (link-level overrides workspace)
    const { data: link, error: linkError } = await supabase
      .from('redirect_links')
      .select('workspace_id, facebook_pixel_id, facebook_access_token, workspaces(facebook_access_token, facebook_pixel_id)')
      .eq('id', payload.linkId)
      .single();

    if (linkError || !link) {
      console.error("Error fetching link:", linkError);
      throw new Error("Link not found");
    }

    const workspace = (link.workspaces as any);
    // Link-level credentials take priority, fallback to workspace
    const accessToken = link.facebook_access_token || workspace?.facebook_access_token;
    const pixelId = link.facebook_pixel_id || workspace?.facebook_pixel_id;

    if (!accessToken || !pixelId) {
      console.error("Missing Facebook credentials for workspace");
      throw new Error("Facebook Pixel not configured for this workspace");
    }

    // Get client IP from request headers
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || 
                     req.headers.get("x-real-ip") || 
                     "unknown";

    // Build the conversion event for Facebook
    const event = {
      event_name: payload.eventName,
      event_time: payload.timestamp,
      event_id: payload.eventId,
      event_source_url: payload.eventSourceUrl,
      action_source: "website",
      user_data: {
        ...payload.userData,
        client_ip_address: clientIp,
        client_user_agent: payload.userAgent,
        fbc: getCookie(req, "_fbc"),
        fbp: getCookie(req, "_fbp"),
      },
      custom_data: payload.customData,
    };

    console.log("Sending to Facebook CAPI:", { pixelId, eventName: payload.eventName });

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

    return new Response(
      JSON.stringify({ success: true, eventId: payload.eventId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("Error in meta-conversions-api:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

function getCookie(req: Request, name: string): string | undefined {
  const cookies = req.headers.get("cookie");
  if (!cookies) return undefined;
  const cookieArr = cookies.split(";");
  for (const cookie of cookieArr) {
    const [cookieName, cookieValue] = cookie.trim().split("=");
    if (cookieName === name) return cookieValue;
  }
  return undefined;
}
