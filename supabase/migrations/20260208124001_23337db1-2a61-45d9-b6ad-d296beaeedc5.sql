-- Add Evolution API fields to workspaces
ALTER TABLE public.workspaces 
ADD COLUMN IF NOT EXISTS evolution_api_url TEXT,
ADD COLUMN IF NOT EXISTS evolution_api_key TEXT,
ADD COLUMN IF NOT EXISTS evolution_instance_name TEXT;

-- Create whatsapp_messages table
CREATE TABLE IF NOT EXISTS public.whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  message_content TEXT NOT NULL,
  message_type TEXT NOT NULL CHECK (message_type IN ('first_message', 'last_message', 'other')),
  timestamp TIMESTAMPTZ NOT NULL,
  raw_payload JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_lead_id ON public.whatsapp_messages(lead_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_phone ON public.whatsapp_messages(phone_number);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_timestamp ON public.whatsapp_messages(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_type ON public.whatsapp_messages(message_type);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_lead_type ON public.whatsapp_messages(lead_id, message_type);

-- Enable RLS
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for whatsapp_messages

-- Admins can manage all messages
CREATE POLICY "Admins can manage all whatsapp_messages"
ON public.whatsapp_messages
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Users can view messages from their leads
CREATE POLICY "Users can view messages from their leads"
ON public.whatsapp_messages
FOR SELECT
USING (
  lead_id IN (
    SELECT l.id FROM public.leads l
    WHERE l.link_id IN (
      SELECT rl.id FROM public.redirect_links rl
      WHERE rl.workspace_id IN (
        SELECT w.id FROM public.workspaces w
        WHERE w.owner_id = auth.uid()
      )
    )
  )
);

-- Service role can insert messages (for webhook - bypasses RLS when using service role key)
-- Note: This is handled by using service role key in edge function