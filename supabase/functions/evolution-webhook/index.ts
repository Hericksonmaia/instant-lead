import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EvolutionPayload {
  event: string;
  instance: string;
  data: {
    key: {
      remoteJid: string;
      fromMe: boolean;
      id: string;
    };
    pushName?: string;
    message?: {
      conversation?: string;
      extendedTextMessage?: { text: string };
      imageMessage?: { caption?: string };
      videoMessage?: { caption?: string };
      documentMessage?: { fileName?: string; caption?: string };
      audioMessage?: { seconds?: number };
      locationMessage?: { degreesLatitude?: number; degreesLongitude?: number };
      contactMessage?: { displayName?: string };
      stickerMessage?: object;
      pollCreationMessage?: { name?: string };
      reactionMessage?: { text?: string };
      buttonsResponseMessage?: { selectedButtonId?: string };
      listResponseMessage?: { title?: string };
    };
    messageTimestamp: number | string;
  };
}

function normalizePhone(phone: string): string {
  // Remove @s.whatsapp.net and any non-numeric characters
  let normalized = phone.replace(/@s\.whatsapp\.net$/, '').replace(/\D/g, '');
  
  // If starts with 55 and has more than 11 digits, remove country code
  if (normalized.startsWith('55') && normalized.length > 11) {
    normalized = normalized.substring(2);
  }
  
  return normalized;
}

function extractMessageContent(message: EvolutionPayload['data']['message']): string {
  if (!message) return '[Mensagem vazia]';
  
  if (message.conversation) return message.conversation;
  if (message.extendedTextMessage?.text) return message.extendedTextMessage.text;
  if (message.imageMessage) return message.imageMessage.caption || '[Imagem]';
  if (message.videoMessage) return message.videoMessage.caption || '[Vídeo]';
  if (message.documentMessage) return message.documentMessage.caption || `[Documento: ${message.documentMessage.fileName || 'arquivo'}]`;
  if (message.audioMessage) return `[Áudio: ${message.audioMessage.seconds || '?'}s]`;
  if (message.locationMessage) return `[Localização: ${message.locationMessage.degreesLatitude}, ${message.locationMessage.degreesLongitude}]`;
  if (message.contactMessage) return `[Contato: ${message.contactMessage.displayName || 'desconhecido'}]`;
  if (message.stickerMessage) return '[Figurinha]';
  if (message.pollCreationMessage) return `[Enquete: ${message.pollCreationMessage.name || ''}]`;
  if (message.reactionMessage) return `[Reação: ${message.reactionMessage.text || ''}]`;
  if (message.buttonsResponseMessage) return `[Botão: ${message.buttonsResponseMessage.selectedButtonId || ''}]`;
  if (message.listResponseMessage) return `[Lista: ${message.listResponseMessage.title || ''}]`;
  
  return '[Mensagem não suportada]';
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const payload: EvolutionPayload = await req.json();
    
    console.log("Received Evolution webhook:", {
      event: payload.event,
      instance: payload.instance,
      fromMe: payload.data?.key?.fromMe,
    });

    // Validate payload structure
    if (!payload.event || !payload.instance || !payload.data?.key || !payload.data?.messageTimestamp) {
      console.error("Invalid payload structure:", payload);
      return new Response(JSON.stringify({ error: "Invalid payload structure" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Only process MESSAGES_UPSERT events
    if (payload.event !== "messages.upsert" && payload.event !== "MESSAGES_UPSERT") {
      console.log("Ignoring event:", payload.event);
      return new Response(JSON.stringify({ message: "Event ignored", event: payload.event }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Ignore messages sent by the business (fromMe = true)
    if (payload.data.key.fromMe) {
      console.log("Ignoring outgoing message");
      return new Response(JSON.stringify({ message: "Outgoing message ignored" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Extract and normalize phone number
    const rawPhone = payload.data.key.remoteJid;
    const normalizedPhone = normalizePhone(rawPhone);
    
    // Extract message content
    const messageContent = extractMessageContent(payload.data.message);
    
    // Convert timestamp
    const timestamp = typeof payload.data.messageTimestamp === 'string' 
      ? new Date(parseInt(payload.data.messageTimestamp) * 1000)
      : new Date(payload.data.messageTimestamp * 1000);

    console.log("Processing message:", {
      phone: normalizedPhone,
      content: messageContent.substring(0, 50),
      timestamp: timestamp.toISOString(),
    });

    // Find lead by phone number (try multiple formats)
    const phonesToCheck = [
      normalizedPhone,
      `55${normalizedPhone}`,
      normalizedPhone.startsWith('55') ? normalizedPhone.substring(2) : null,
    ].filter(Boolean);

    let leadId: string | null = null;
    let workspaceData: any = null;

    for (const phone of phonesToCheck) {
      const { data: leads, error } = await supabase
        .from('leads')
        .select(`
          id,
          redirect_links (
            workspace_id,
            workspaces (
              facebook_access_token,
              facebook_pixel_id
            )
          )
        `)
        .ilike('phone', `%${phone}%`)
        .order('created_at', { ascending: false })
        .limit(1);

      if (!error && leads && leads.length > 0) {
        leadId = leads[0].id;
        const link = leads[0].redirect_links as any;
        workspaceData = link?.workspaces;
        console.log("Found lead:", leadId);
        break;
      }
    }

    if (!leadId) {
      console.log("No lead found for phone:", normalizedPhone);
    }

    // Check if this is the first message for this lead
    let isFirstMessage = false;
    if (leadId) {
      const { data: existingFirst } = await supabase
        .from('whatsapp_messages')
        .select('id')
        .eq('lead_id', leadId)
        .eq('message_type', 'first_message')
        .limit(1);
      
      isFirstMessage = !existingFirst || existingFirst.length === 0;
    }

    // Create message records
    const baseMessage = {
      lead_id: leadId,
      phone_number: normalizedPhone,
      message_content: messageContent,
      timestamp: timestamp.toISOString(),
      raw_payload: payload,
    };

    // If first message, create first_message record
    if (isFirstMessage && leadId) {
      const { error: firstError } = await supabase
        .from('whatsapp_messages')
        .insert({ ...baseMessage, message_type: 'first_message' });
      
      if (firstError) {
        console.error("Error inserting first_message:", firstError);
      } else {
        console.log("Created first_message record");
      }
    }

    // Delete existing last_message and create new one
    if (leadId) {
      await supabase
        .from('whatsapp_messages')
        .delete()
        .eq('lead_id', leadId)
        .eq('message_type', 'last_message');

      const { error: lastError } = await supabase
        .from('whatsapp_messages')
        .insert({ ...baseMessage, message_type: 'last_message' });
      
      if (lastError) {
        console.error("Error inserting last_message:", lastError);
      } else {
        console.log("Created last_message record");
      }
    }

    // Always create 'other' record for history
    const { error: otherError } = await supabase
      .from('whatsapp_messages')
      .insert({ ...baseMessage, message_type: 'other' });
    
    if (otherError) {
      console.error("Error inserting other message:", otherError);
    }

    // Send event to Meta Conversions API if configured
    if (leadId && workspaceData?.facebook_access_token && workspaceData?.facebook_pixel_id) {
      try {
        const eventName = isFirstMessage ? 'Lead' : 'LeadEngagement';
        const eventTime = Math.floor(timestamp.getTime() / 1000);
        
        const metaEvent = {
          event_name: eventName,
          event_time: eventTime,
          event_id: `whatsapp_${payload.data.key.id}`,
          action_source: "website",
          user_data: {
            ph: normalizedPhone,
            external_id: leadId,
          },
          custom_data: {
            message_content: messageContent.substring(0, 100),
            message_type: isFirstMessage ? 'first_message' : 'subsequent',
            source: 'whatsapp',
          },
        };

        const metaResponse = await fetch(
          `https://graph.facebook.com/v18.0/${workspaceData.facebook_pixel_id}/events`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              data: [metaEvent],
              access_token: workspaceData.facebook_access_token,
            }),
          }
        );

        const metaResult = await metaResponse.json();
        console.log("Meta CAPI response:", metaResult);
      } catch (metaError) {
        console.error("Error sending to Meta CAPI:", metaError);
        // Continue processing even if Meta API fails
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        leadId,
        isFirstMessage,
        messageType: isFirstMessage ? 'first_message' : 'subsequent',
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in evolution-webhook:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
