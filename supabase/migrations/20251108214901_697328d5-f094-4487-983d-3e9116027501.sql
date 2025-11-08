-- Add public profile fields to skill_profiles table
ALTER TABLE public.skill_profiles 
ADD COLUMN IF NOT EXISTS public_slug TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS display_name TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Create index for faster public profile lookups
CREATE INDEX IF NOT EXISTS idx_skill_profiles_public_slug ON public.skill_profiles(public_slug) WHERE is_public = true;

-- Function to generate unique slug from email or name
CREATE OR REPLACE FUNCTION public.generate_profile_slug(base_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql
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

-- Enable RLS policy for public profile viewing
CREATE POLICY "Public profiles are viewable by everyone"
ON public.skill_profiles
FOR SELECT
USING (is_public = true OR auth.uid() = user_id);

-- Update existing policy to allow users to update their public settings
DROP POLICY IF EXISTS "Users can update their own skill profiles" ON public.skill_profiles;
CREATE POLICY "Users can update their own skill profiles"
ON public.skill_profiles
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);