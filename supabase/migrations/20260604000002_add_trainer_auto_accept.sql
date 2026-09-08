-- Add auto_accept field to trainer_profiles table
ALTER TABLE public.trainer_profiles 
ADD COLUMN IF NOT EXISTS auto_accept BOOLEAN DEFAULT false;
