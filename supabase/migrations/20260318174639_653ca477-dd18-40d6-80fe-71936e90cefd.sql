
-- Drop and recreate get_redirect_data with logo_url
DROP FUNCTION IF EXISTS public.get_redirect_data(text);

CREATE FUNCTION public.get_redirect_data(p_slug text)
 RETURNS TABLE(link_id uuid, mode text, name text, headline text, subtitle text, description text, button_text text, message_template text, capture_name boolean, capture_phone boolean, theme_bg_color text, theme_text_color text, theme_button_bg text, theme_button_text text, theme_font text, facebook_pixel_id text, logo_url text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT id, mode, name, headline, subtitle, description,
         button_text, message_template, capture_name, capture_phone,
         theme_bg_color, theme_text_color, theme_button_bg, theme_button_text, theme_font,
         facebook_pixel_id, logo_url
  FROM redirect_links WHERE slug = p_slug LIMIT 1;
$$;
