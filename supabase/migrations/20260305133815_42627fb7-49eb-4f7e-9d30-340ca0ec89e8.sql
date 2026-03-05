
-- Fix search_path on validate_lead_input function
CREATE OR REPLACE FUNCTION public.validate_lead_input()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
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
