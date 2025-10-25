import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ConversionEvent {
  pixelId: string;
  accessToken: string;
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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: ConversionEvent = await req.json();
    
    console.log("Received conversion event:", {
      pixelId: payload.pixelId,
      eventName: payload.eventName,
      eventId: payload.eventId,
    });

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

    // Send to Facebook Conversions API
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${payload.pixelId}/events`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: [event],
          access_token: payload.accessToken,
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error("Facebook API error:", result);
      throw new Error(`Facebook API error: ${JSON.stringify(result)}`);
    }

    console.log("Successfully sent to Facebook CAPI:", result);

    return new Response(
      JSON.stringify({ 
        success: true, 
        eventId: payload.eventId,
        facebookResponse: result 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in meta-conversions-api:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

function getCookie(req: Request, name: string): string | undefined {
  const cookies = req.headers.get("cookie");
  if (!cookies) return undefined;

  const cookieArr = cookies.split(";");
  for (const cookie of cookieArr) {
    const [cookieName, cookieValue] = cookie.trim().split("=");
    if (cookieName === name) {
      return cookieValue;
    }
  }
  return undefined;
}
