-- Function to update trainer rating and count
CREATE OR REPLACE FUNCTION public.update_trainer_rating()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
    UPDATE public.trainer_profiles
    SET 
      rating = (SELECT COALESCE(AVG(rating), 0) FROM public.reviews WHERE trainer_id = NEW.trainer_id),
      rating_count = (SELECT COUNT(*) FROM public.reviews WHERE trainer_id = NEW.trainer_id)
    WHERE user_id = NEW.trainer_id;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE public.trainer_profiles
    SET 
      rating = (SELECT COALESCE(AVG(rating), 0) FROM public.reviews WHERE trainer_id = OLD.trainer_id),
      rating_count = (SELECT COUNT(*) FROM public.reviews WHERE trainer_id = OLD.trainer_id)
    WHERE user_id = OLD.trainer_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for reviews table
DROP TRIGGER IF EXISTS on_review_change ON public.reviews;
CREATE TRIGGER on_review_change
AFTER INSERT OR UPDATE OR DELETE ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.update_trainer_rating();
