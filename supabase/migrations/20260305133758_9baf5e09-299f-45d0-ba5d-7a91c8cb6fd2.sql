
-- 1. Drop overly broad public SELECT policies
DROP POLICY IF EXISTS "Public can view redirect links by slug" ON redirect_links;
DROP POLICY IF EXISTS "Public can read links by slug" ON redirect_links;
DROP POLICY IF EXISTS "Public can read contacts for redirection" ON redirect_contacts;
DROP POLICY IF EXISTS "Anyone can view menu_items for public links" ON menu_items;

-- 2. Create scoped SECURITY DEFINER RPCs

-- Get redirect link data by slug (returns only what the public page needs)
CREATE OR REPLACE FUNCTION public.get_redirect_data(p_slug TEXT)
RETURNS TABLE (
  link_id uuid, mode text, name text, headline text, subtitle text,
  description text, button_text text, message_template text, capture_name bool,
  capture_phone bool, theme_bg_color text, theme_text_color text,
  theme_button_bg text, theme_button_text text, theme_font text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id, mode, name, headline, subtitle, description,
         button_text, message_template, capture_name, capture_phone,
         theme_bg_color, theme_text_color, theme_button_bg, theme_button_text, theme_font
  FROM redirect_links WHERE slug = p_slug LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.get_redirect_data TO anon, authenticated;

-- Get contacts for a specific link (only phone needed for redirect)
CREATE OR REPLACE FUNCTION public.get_link_contacts(p_link_id UUID)
RETURNS TABLE (contact_id uuid, phone text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id, phone FROM redirect_contacts
  WHERE link_id = p_link_id ORDER BY order_index;
$$;
GRANT EXECUTE ON FUNCTION public.get_link_contacts TO anon, authenticated;

-- Get menu items for a specific link
CREATE OR REPLACE FUNCTION public.get_menu_items(p_link_id UUID)
RETURNS TABLE (item_id uuid, label text, url text, icon text, order_index int)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id, label, url, icon, order_index FROM menu_items
  WHERE link_id = p_link_id ORDER BY order_index;
$$;
GRANT EXECUTE ON FUNCTION public.get_menu_items TO anon, authenticated;

-- 3. Add input length constraints on leads table using a validation trigger
CREATE OR REPLACE FUNCTION public.validate_lead_input()
RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.name IS NOT NULL AND length(NEW.name) > 100 THEN
    RAISE EXCEPTION 'Name exceeds maximum length of 100 characters';
  END IF;
  IF NEW.phone IS NOT NULL AND length(NEW.phone) > 20 THEN
    RAISE EXCEPTION 'Phone exceeds maximum length of 20 characters';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_lead_input
  BEFORE INSERT OR UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.validate_lead_input();
