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
  let normalized = phone.replace(/@s\.whatsapp\.net$/, '').replace(/\D/g, '');
  if (normalized.startsWith('55') && normalized.length > 11) {
    normalized = normalized.substring(2);
  }
  return normalized;
}

function generatePhoneVariants(phone: string): string[] {
  const variants = new Set<string>();
  let base = phone;
  if (base.startsWith('55') && base.length > 11) {
    base = base.substring(2);
  }
  variants.add(base);
  if (base.length === 10) {
    const withNinth = base.substring(0, 2) + '9' + base.substring(2);
    variants.add(withNinth);
    variants.add('55' + base);
    variants.add('55' + withNinth);
  }
  if (base.length === 11 && base[2] === '9') {
    const withoutNinth = base.substring(0, 2) + base.substring(3);
    variants.add(withoutNinth);
    variants.add('55' + base);
    variants.add('55' + withoutNinth);
  }
  variants.add('55' + base);
  return Array.from(variants);
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
    // Extract workspace_id from query param
    const url = new URL(req.url);
    const workspaceId = url.searchParams.get('workspace_id');
    
    if (!workspaceId) {
      console.error("Missing workspace_id query parameter");
      return new Response(JSON.stringify({ error: "Missing workspace_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload: EvolutionPayload = await req.json();
    
    console.log("Received Evolution webhook:", {
      event: payload.event,
      instance: payload.instance,
      fromMe: payload.data?.key?.fromMe,
      workspaceId,
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

    // Ignore group messages
    if (payload.data.key.remoteJid.endsWith('@g.us')) {
      return new Response(JSON.stringify({ message: "Group message ignored" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Ignore messages sent by the business
    if (payload.data.key.fromMe) {
      return new Response(JSON.stringify({ message: "Outgoing message ignored" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Validate workspace exists
    const { data: wsData, error: wsError } = await supabase
      .from('workspaces')
      .select('id, facebook_access_token, facebook_pixel_id')
      .eq('id', workspaceId)
      .single();

    if (wsError || !wsData) {
      console.error("Invalid workspace_id:", workspaceId);
      return new Response(JSON.stringify({ error: "Invalid workspace" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify the instance belongs to this workspace via evolution_instances table
    const { data: instanceData } = await supabase
      .from('evolution_instances')
      .select('id, instance_name')
      .eq('workspace_id', workspaceId)
      .eq('instance_name', payload.instance)
      .limit(1);

    if (!instanceData || instanceData.length === 0) {
      // Fallback: check legacy workspace columns
      const { data: legacyWs } = await supabase
        .from('workspaces')
        .select('evolution_instance_name')
        .eq('id', workspaceId)
        .single();

      if (legacyWs?.evolution_instance_name && legacyWs.evolution_instance_name !== payload.instance) {
        console.error("Instance mismatch:", { expected: legacyWs.evolution_instance_name, received: payload.instance });
        return new Response(JSON.stringify({ error: "Instance mismatch" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const workspaceData = wsData;

    // Extract and normalize phone number
    const rawPhone = payload.data.key.remoteJid;
    const normalizedPhone = normalizePhone(rawPhone);
    const messageContent = extractMessageContent(payload.data.message);
    
    const timestamp = typeof payload.data.messageTimestamp === 'string' 
      ? new Date(parseInt(payload.data.messageTimestamp) * 1000)
      : new Date(payload.data.messageTimestamp * 1000);

    console.log("Processing message:", {
      phone: normalizedPhone,
      content: messageContent.substring(0, 50),
      timestamp: timestamp.toISOString(),
    });

    // Find lead by phone number
    const phonesToCheck = generatePhoneVariants(normalizedPhone);
    let leadId: string | null = null;

    // Get all link IDs for this workspace
    const { data: workspaceLinks } = await supabase
      .from('redirect_links')
      .select('id')
      .eq('workspace_id', workspaceId);
    
    const linkIds = (workspaceLinks || []).map((l: any) => l.id);

    if (linkIds.length > 0) {
      for (const phone of phonesToCheck) {
        const { data: leads, error } = await supabase
          .from('leads')
          .select('id')
          .in('link_id', linkIds)
          .ilike('phone', `%${phone}%`)
          .order('created_at', { ascending: false })
          .limit(1);

        if (!error && leads && leads.length > 0) {
          leadId = leads[0].id;
          if (payload.data.pushName) {
            await supabase
              .from('leads')
              .update({ name: payload.data.pushName })
              .eq('id', leadId)
              .is('name', null);
          }
          break;
        }
      }
    }

    // If no lead found by phone, try phoneless lead or create organic
    if (!leadId && linkIds.length > 0) {
      const { data: recentLeads } = await supabase
        .from('leads')
        .select('id')
        .in('link_id', linkIds)
        .is('phone', null)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (recentLeads && recentLeads.length > 0) {
        leadId = recentLeads[0].id;
        const updateData: Record<string, any> = { phone: normalizedPhone };
        if (payload.data.pushName) updateData.name = payload.data.pushName;
        await supabase.from('leads').update(updateData).eq('id', leadId);
      }
      
      if (!leadId && linkIds.length > 0) {
        const { data: newLead, error: createError } = await supabase
          .from('leads')
          .insert({
            link_id: linkIds[0],
            phone: normalizedPhone,
            name: payload.data.pushName || null,
          })
          .select('id')
          .single();
        
        if (!createError && newLead) leadId = newLead.id;
      }
    }

    // Check if first message
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

    if (isFirstMessage && leadId) {
      await supabase.from('whatsapp_messages').insert({ ...baseMessage, message_type: 'first_message' });
    }

    if (leadId) {
      await supabase.from('whatsapp_messages').delete().eq('lead_id', leadId).eq('message_type', 'last_message');
      await supabase.from('whatsapp_messages').insert({ ...baseMessage, message_type: 'last_message' });
    }

    await supabase.from('whatsapp_messages').insert({ ...baseMessage, message_type: 'other' });

    // Send event to Meta CAPI - check link-level credentials first, then workspace fallback
    if (leadId) {
      try {
        // Get link-level credentials for this lead
        const { data: leadWithLink } = await supabase
          .from('leads')
          .select('link_id, redirect_links(facebook_pixel_id, facebook_access_token)')
          .eq('id', leadId)
          .single();

        const linkData = leadWithLink?.redirect_links as any;
        const accessToken = linkData?.facebook_access_token || workspaceData?.facebook_access_token;
        const pixelId = linkData?.facebook_pixel_id || workspaceData?.facebook_pixel_id;

        if (accessToken && pixelId) {
          const eventName = isFirstMessage ? 'Lead' : 'LeadEngagement';
          const eventTime = Math.floor(timestamp.getTime() / 1000);
          
          const metaEvent = {
            event_name: eventName,
            event_time: eventTime,
            event_id: `whatsapp_${payload.data.key.id}`,
            action_source: "website",
            user_data: { ph: normalizedPhone, external_id: leadId },
            custom_data: {
              message_content: messageContent.substring(0, 100),
              message_type: isFirstMessage ? 'first_message' : 'subsequent',
              source: 'whatsapp',
            },
          };

          await fetch(
            `https://graph.facebook.com/v18.0/${pixelId}/events`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                data: [metaEvent],
                access_token: accessToken,
              }),
            }
          );
        }
      } catch (metaError) {
        console.error("Error sending to Meta CAPI:", metaError);
      }
    }

    return new Response(
      JSON.stringify({ success: true, leadId, isFirstMessage }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in evolution-webhook:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
