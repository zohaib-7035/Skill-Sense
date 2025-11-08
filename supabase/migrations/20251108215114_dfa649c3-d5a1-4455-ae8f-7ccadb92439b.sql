-- Fix search path security issue for generate_profile_slug function
DROP FUNCTION IF EXISTS public.generate_profile_slug(TEXT);

CREATE OR REPLACE FUNCTION public.generate_profile_slug(base_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Clean and format base text
  slug := lower(regexp_replace(base_text, '[^a-zA-Z0-9]+', '-', 'g'));
  slug := trim(both '-' from slug);
  
  -- Check if slug exists, append number if needed
  WHILE EXISTS (SELECT 1 FROM skill_profiles WHERE public_slug = slug) LOOP
    counter := counter + 1;
    slug := lower(regexp_replace(base_text, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || counter;
  END LOOP;
  
  RETURN slug;
END;
$$;