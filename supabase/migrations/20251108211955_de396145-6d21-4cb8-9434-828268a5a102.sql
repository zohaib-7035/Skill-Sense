-- Add new columns to skills table for enhanced features
ALTER TABLE public.skills 
ADD COLUMN IF NOT EXISTS state TEXT DEFAULT 'unlocked' CHECK (state IN ('locked', 'unlocked')),
ADD COLUMN IF NOT EXISTS cluster TEXT,
ADD COLUMN IF NOT EXISTS microstory TEXT;

-- Create quests table
CREATE TABLE IF NOT EXISTS public.quests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  skill_id UUID NOT NULL,
  quest_type TEXT NOT NULL,
  quest_description TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on quests
ALTER TABLE public.quests ENABLE ROW LEVEL SECURITY;

-- Create policies for quests
CREATE POLICY "Users can view quests for their skills"
ON public.quests
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM skills
    JOIN skill_profiles ON skills.profile_id = skill_profiles.id
    WHERE skills.id = quests.skill_id
    AND skill_profiles.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update quests for their skills"
ON public.quests
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM skills
    JOIN skill_profiles ON skills.profile_id = skill_profiles.id
    WHERE skills.id = quests.skill_id
    AND skill_profiles.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create quests for their skills"
ON public.quests
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM skills
    JOIN skill_profiles ON skills.profile_id = skill_profiles.id
    WHERE skills.id = quests.skill_id
    AND skill_profiles.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete quests for their skills"
ON public.quests
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM skills
    JOIN skill_profiles ON skills.profile_id = skill_profiles.id
    WHERE skills.id = quests.skill_id
    AND skill_profiles.user_id = auth.uid()
  )
);