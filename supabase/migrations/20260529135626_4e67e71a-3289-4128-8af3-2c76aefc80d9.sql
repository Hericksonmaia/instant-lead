
-- Drop unused logs table (has RLS but no policies)
DROP TABLE IF EXISTS public.logs;

-- Harden handle_new_user with input validation/length limits
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_full_name TEXT;
  v_company_name TEXT;
BEGIN
  v_full_name := COALESCE(
    NULLIF(substring(NEW.raw_user_meta_data->>'full_name', 1, 100), ''),
    NEW.email
  );
  v_company_name := COALESCE(
    NULLIF(substring(NEW.raw_user_meta_data->>'company_name', 1, 100), ''),
    'Meu Workspace'
  );

  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, v_full_name);

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'client');

  INSERT INTO public.workspaces (owner_id, name)
  VALUES (NEW.id, v_company_name);

  RETURN NEW;
END;
$$;
