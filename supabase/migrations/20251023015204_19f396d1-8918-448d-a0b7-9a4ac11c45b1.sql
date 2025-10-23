-- Add customizable fields for redirect page UI
ALTER TABLE public.redirect_links
ADD COLUMN headline TEXT DEFAULT 'Entre em contato',
ADD COLUMN subtitle TEXT DEFAULT 'Preencha os dados abaixo para ser atendido via WhatsApp',
ADD COLUMN button_text TEXT DEFAULT 'Continuar para WhatsApp';