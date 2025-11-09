-- Create discovered_skills table for AI-inferred transferable skills
CREATE TABLE public.discovered_skills (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL,
  skill_name TEXT NOT NULL,
  inferred_from JSONB, -- Array of source skills that led to this inference
  confidence_score NUMERIC NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),
  reasoning TEXT, -- AI explanation of why this skill was inferred
  is_confirmed BOOLEAN DEFAULT false,
  is_rejected BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.discovered_skills ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their discovered skills"
  ON public.discovered_skills FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM skill_profiles
    WHERE skill_profiles.id = discovered_skills.profile_id
    AND skill_profiles.user_id = auth.uid()
  ));

CREATE POLICY "Users can create discovered skills for their profiles"
  ON public.discovered_skills FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM skill_profiles
    WHERE skill_profiles.id = discovered_skills.profile_id
    AND skill_profiles.user_id = auth.uid()
  ));

CREATE POLICY "Users can update their discovered skills"
  ON public.discovered_skills FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM skill_profiles
    WHERE skill_profiles.id = discovered_skills.profile_id
    AND skill_profiles.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their discovered skills"
  ON public.discovered_skills FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM skill_profiles
    WHERE skill_profiles.id = discovered_skills.profile_id
    AND skill_profiles.user_id = auth.uid()
  ));

-- Add trigger for updated_at
CREATE TRIGGER update_discovered_skills_updated_at
  BEFORE UPDATE ON public.discovered_skills
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create organization_members table for team intelligence
CREATE TABLE public.organization_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  user_id UUID NOT NULL,
  role TEXT DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

-- Create organizations table
CREATE TABLE public.organizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on organizations
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- Organization RLS policies
CREATE POLICY "Users can view organizations they belong to"
  ON public.organizations FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_members.organization_id = organizations.id
    AND organization_members.user_id = auth.uid()
  ));

CREATE POLICY "Users can create organizations"
  ON public.organizations FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Organization members RLS policies
CREATE POLICY "Users can view members of their organizations"
  ON public.organization_members FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM organization_members om2
    WHERE om2.organization_id = organization_members.organization_id
    AND om2.user_id = auth.uid()
  ));

CREATE POLICY "Organization creators can add members"
  ON public.organization_members FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM organizations
    WHERE organizations.id = organization_members.organization_id
    AND organizations.created_by = auth.uid()
  ));