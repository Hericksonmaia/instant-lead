import { supabase } from "@/integrations/supabase/client";

export interface WhatsAppMessage {
  id: string;
  lead_id: string | null;
  phone_number: string;
  message_content: string;
  message_type: 'first_message' | 'last_message' | 'other';
  timestamp: string;
  raw_payload: Record<string, unknown>;
  created_at: string;
}

export interface EvolutionAPISettings {
  evolution_api_url: string;
  evolution_api_key: string;
  evolution_instance_name: string;
}

export interface LeadWithMessages {
  first_message?: WhatsAppMessage;
  last_message?: WhatsAppMessage;
}

// Fetch messages for a specific lead with pagination
export async function getLeadMessages(
  leadId: string,
  page: number = 1,
  pageSize: number = 50
): Promise<WhatsAppMessage[]> {
  const offset = (page - 1) * pageSize;

  const { data, error } = await supabase
    .from('whatsapp_messages')
    .select('*')
    .eq('lead_id', leadId)
    .eq('message_type', 'other')
    .order('timestamp', { ascending: true })
    .range(offset, offset + pageSize - 1);

  if (error) {
    console.error('Error fetching lead messages:', error);
    throw error;
  }

  return (data || []) as WhatsAppMessage[];
}

// Fetch first and last messages for multiple leads
export async function getLeadsWithMessages(
  leadIds: string[]
): Promise<Map<string, LeadWithMessages>> {
  if (leadIds.length === 0) return new Map();

  const { data, error } = await supabase
    .from('whatsapp_messages')
    .select('*')
    .in('lead_id', leadIds)
    .in('message_type', ['first_message', 'last_message']);

  if (error) {
    console.error('Error fetching leads messages:', error);
    throw error;
  }

  const result = new Map<string, LeadWithMessages>();

  for (const msg of (data || []) as WhatsAppMessage[]) {
    if (!msg.lead_id) continue;

    if (!result.has(msg.lead_id)) {
      result.set(msg.lead_id, {});
    }

    const entry = result.get(msg.lead_id)!;
    if (msg.message_type === 'first_message') {
      entry.first_message = msg;
    } else if (msg.message_type === 'last_message') {
      entry.last_message = msg;
    }
  }

  return result;
}

// Check if last message was sent in the last 24 hours
export function hasRecentMessage(lastMessage?: WhatsAppMessage): boolean {
  if (!lastMessage) return false;

  const messageTime = new Date(lastMessage.timestamp).getTime();
  const now = Date.now();
  const twentyFourHours = 24 * 60 * 60 * 1000;

  return now - messageTime < twentyFourHours;
}

// Update Evolution API settings for a workspace
export async function updateEvolutionAPISettings(
  workspaceId: string,
  settings: EvolutionAPISettings
): Promise<void> {
  const { error } = await supabase
    .from('workspaces')
    .update({
      evolution_api_url: settings.evolution_api_url || null,
      evolution_api_key: settings.evolution_api_key || null,
      evolution_instance_name: settings.evolution_instance_name || null,
    })
    .eq('id', workspaceId);

  if (error) {
    console.error('Error updating Evolution API settings:', error);
    throw error;
  }
}

// Get Evolution API settings for a workspace
export async function getEvolutionAPISettings(
  workspaceId: string
): Promise<EvolutionAPISettings | null> {
  const { data, error } = await supabase
    .from('workspaces')
    .select('evolution_api_url, evolution_api_key, evolution_instance_name')
    .eq('id', workspaceId)
    .single();

  if (error) {
    console.error('Error fetching Evolution API settings:', error);
    throw error;
  }

  if (!data?.evolution_api_url) return null;

  return {
    evolution_api_url: data.evolution_api_url || '',
    evolution_api_key: data.evolution_api_key || '',
    evolution_instance_name: data.evolution_instance_name || '',
  };
}

// Test connection to Evolution API
export async function testEvolutionAPIConnection(
  settings: EvolutionAPISettings
): Promise<{ success: boolean; error?: string }> {
  try {
    const url = `${settings.evolution_api_url.replace(/\/$/, '')}/instance/connectionState/${settings.evolution_instance_name}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'apikey': settings.evolution_api_key,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.message || `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const data = await response.json();
    
    // Check if instance is connected
    if (data.instance?.state === 'open' || data.state === 'open') {
      return { success: true };
    }

    return {
      success: false,
      error: `Instância não conectada. Estado: ${data.instance?.state || data.state || 'desconhecido'}`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao conectar com a API',
    };
  }
}

// Validate Evolution API settings
export function validateEvolutionAPISettings(
  settings: Partial<EvolutionAPISettings>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!settings.evolution_api_url?.trim()) {
    errors.push('URL da API é obrigatória');
  } else {
    try {
      new URL(settings.evolution_api_url);
    } catch {
      errors.push('URL da API inválida');
    }
  }

  if (!settings.evolution_api_key?.trim()) {
    errors.push('API Key é obrigatória');
  }

  if (!settings.evolution_instance_name?.trim()) {
    errors.push('Nome da instância é obrigatório');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// Mask API Key (show only last 4 characters)
export function maskApiKey(apiKey: string): string {
  if (!apiKey || apiKey.length <= 4) return apiKey;
  return '*'.repeat(apiKey.length - 4) + apiKey.slice(-4);
}

// Truncate message content
export function truncateMessage(content: string, maxLength: number = 50): string {
  if (!content || content.length <= maxLength) return content;
  return content.substring(0, maxLength) + '...';
}
