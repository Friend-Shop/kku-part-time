-- Update reviews table foreign keys to point to public.profiles instead of auth.users
-- This makes joining for client info much more reliable in Supabase

ALTER TABLE public.reviews
DROP CONSTRAINT IF EXISTS reviews_client_id_fkey,
DROP CONSTRAINT IF EXISTS reviews_trainer_id_fkey;

ALTER TABLE public.reviews
ADD CONSTRAINT reviews_client_id_fkey 
FOREIGN KEY (client_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
ADD CONSTRAINT reviews_trainer_id_fkey 
FOREIGN KEY (trainer_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Ensure the avatars bucket is explicitly public (just in case)
UPDATE storage.buckets SET public = true WHERE id = 'avatars';
