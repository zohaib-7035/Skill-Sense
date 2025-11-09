-- Drop the previous view
DROP VIEW IF EXISTS public.public_skill_profiles;

-- Create a view without SECURITY DEFINER (uses invoker's privileges)
CREATE VIEW public.public_skill_profiles AS
SELECT 
  id,
  profile_name,
  display_name,
  bio,
  avatar_url,
  public_slug,
  is_public,
  created_at,
  updated_at,
  raw_data
FROM public.skill_profiles
WHERE is_public = true;

-- Grant SELECT access to anonymous and authenticated users
GRANT SELECT ON public.public_skill_profiles TO anon, authenticated;

-- Add comment explaining the view's purpose
COMMENT ON VIEW public.public_skill_profiles IS 'Public view of skill profiles that excludes user_id for security. Uses invoker permissions.';
