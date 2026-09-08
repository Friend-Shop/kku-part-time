-- Update profiles table for users
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS health_conditions text,
ADD COLUMN IF NOT EXISTS training_modality text DEFAULT 'gym', -- gym, home, online
ADD COLUMN IF NOT EXISTS sessions_per_week integer DEFAULT 3,
ADD COLUMN IF NOT EXISTS preferred_style text; -- strict, supportive, analytical, flexible

-- Update trainer_profiles table
ALTER TABLE public.trainer_profiles
ADD COLUMN IF NOT EXISTS training_style text DEFAULT 'flexible',
ADD COLUMN IF NOT EXISTS target_client_level text[] DEFAULT '{}', -- beginner, intermediate, advanced
ADD COLUMN IF NOT EXISTS training_modality text[] DEFAULT '{}', -- gym, home, online
ADD COLUMN IF NOT EXISTS response_rate numeric DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS retention_rate numeric DEFAULT 1.0;

-- Comment for clarity
COMMENT ON COLUMN public.profiles.training_modality IS 'Preferred training location: gym, home, or online';
COMMENT ON COLUMN public.trainer_profiles.training_style IS 'Teaching style: strict, supportive, analytical, or flexible';
