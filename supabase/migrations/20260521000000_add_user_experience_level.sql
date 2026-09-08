-- Add experience_level to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS experience_level text DEFAULT 'beginner'; -- beginner, intermediate, advanced

-- Ensure other fields from previous migration are present (in case they weren't applied)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS health_conditions text,
ADD COLUMN IF NOT EXISTS training_modality text DEFAULT 'gym',
ADD COLUMN IF NOT EXISTS sessions_per_week integer DEFAULT 3,
ADD COLUMN IF NOT EXISTS preferred_style text;

ALTER TABLE public.trainer_profiles
ADD COLUMN IF NOT EXISTS training_style text DEFAULT 'flexible',
ADD COLUMN IF NOT EXISTS target_client_level text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS training_modality text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS response_rate numeric DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS retention_rate numeric DEFAULT 1.0;
