-- Add commission fields to bookings table
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS commission_rate NUMERIC DEFAULT 0.1,
ADD COLUMN IF NOT EXISTS commission_amount NUMERIC,
ADD COLUMN IF NOT EXISTS net_amount NUMERIC;

-- Create a function to calculate commission automatically
CREATE OR REPLACE FUNCTION public.calculate_booking_commission()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.total_price IS NOT NULL THEN
        NEW.commission_rate := 0.1; -- 10%
        NEW.commission_amount := NEW.total_price * NEW.commission_rate;
        NEW.net_amount := NEW.total_price - NEW.commission_amount;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to run before insert or update on bookings
DROP TRIGGER IF EXISTS tr_calculate_booking_commission ON public.bookings;
CREATE TRIGGER tr_calculate_booking_commission
BEFORE INSERT OR UPDATE OF total_price ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.calculate_booking_commission();

-- Update existing bookings to calculate commission
UPDATE public.bookings 
SET total_price = total_price 
WHERE total_price IS NOT NULL AND (commission_amount IS NULL OR net_amount IS NULL);
