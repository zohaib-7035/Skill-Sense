-- Create skill_profiles table to store user skill profiles
CREATE TABLE public.skill_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_name TEXT NOT NULL DEFAULT 'My Profile',
  raw_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create skills table to store individual skills
CREATE TABLE public.skills (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.skill_profiles(id) ON DELETE CASCADE,
  skill_name TEXT NOT NULL,
  skill_type TEXT NOT NULL CHECK (skill_type IN ('explicit', 'implicit')),
  confidence_score DECIMAL(3,2) NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),
  evidence TEXT[],
  is_confirmed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create target_roles table for job descriptions
CREATE TABLE public.target_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  role_title TEXT NOT NULL,
  role_description TEXT NOT NULL,
  required_skills TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create skill_gaps table for gap analysis results
CREATE TABLE public.skill_gaps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.skill_profiles(id) ON DELETE CASCADE,
  target_role_id UUID NOT NULL REFERENCES public.target_roles(id) ON DELETE CASCADE,
  missing_skills TEXT[],
  matching_skills TEXT[],
  recommendations JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.skill_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.target_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_gaps ENABLE ROW LEVEL SECURITY;

-- RLS Policies for skill_profiles
CREATE POLICY "Users can view their own skill profiles"
  ON public.skill_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own skill profiles"
  ON public.skill_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own skill profiles"
  ON public.skill_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own skill profiles"
  ON public.skill_profiles FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for skills
CREATE POLICY "Users can view skills from their profiles"
  ON public.skills FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.skill_profiles
    WHERE skill_profiles.id = skills.profile_id
    AND skill_profiles.user_id = auth.uid()
  ));

CREATE POLICY "Users can create skills in their profiles"
  ON public.skills FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.skill_profiles
    WHERE skill_profiles.id = skills.profile_id
    AND skill_profiles.user_id = auth.uid()
  ));

CREATE POLICY "Users can update skills in their profiles"
  ON public.skills FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.skill_profiles
    WHERE skill_profiles.id = skills.profile_id
    AND skill_profiles.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete skills in their profiles"
  ON public.skills FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.skill_profiles
    WHERE skill_profiles.id = skills.profile_id
    AND skill_profiles.user_id = auth.uid()
  ));

-- RLS Policies for target_roles
CREATE POLICY "Users can view their own target roles"
  ON public.target_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own target roles"
  ON public.target_roles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own target roles"
  ON public.target_roles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own target roles"
  ON public.target_roles FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for skill_gaps
CREATE POLICY "Users can view their skill gaps"
  ON public.skill_gaps FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.skill_profiles
    WHERE skill_profiles.id = skill_gaps.profile_id
    AND skill_profiles.user_id = auth.uid()
  ));

CREATE POLICY "Users can create skill gaps for their profiles"
  ON public.skill_gaps FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.skill_profiles
    WHERE skill_profiles.id = skill_gaps.profile_id
    AND skill_profiles.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their skill gaps"
  ON public.skill_gaps FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.skill_profiles
    WHERE skill_profiles.id = skill_gaps.profile_id
    AND skill_profiles.user_id = auth.uid()
  ));

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_skill_profiles_updated_at
  BEFORE UPDATE ON public.skill_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_skills_updated_at
  BEFORE UPDATE ON public.skills
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();