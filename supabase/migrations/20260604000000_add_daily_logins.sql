-- Create daily_logins table
CREATE TABLE IF NOT EXISTS public.daily_logins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    login_date DATE NOT NULL DEFAULT CURRENT_DATE,
    streak_count INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, login_date)
);

-- Add RLS policies
ALTER TABLE public.daily_logins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own daily logins"
    ON public.daily_logins FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own daily logins"
    ON public.daily_logins FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Create a function to handle daily login logic
CREATE OR REPLACE FUNCTION public.record_daily_login(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
    v_today DATE := CURRENT_DATE;
    v_yesterday DATE := v_today - INTERVAL '1 day';
    v_last_login DATE;
    v_streak INTEGER := 1;
    v_result JSON;
BEGIN
    -- Get the last login date and streak
    SELECT login_date, streak_count INTO v_last_login, v_streak
    FROM public.daily_logins
    WHERE user_id = p_user_id
    ORDER BY login_date DESC
    LIMIT 1;

    IF v_last_login = v_today THEN
        -- Already logged in today, just return current state
        v_result := json_build_object(
            'status', 'already_logged_in',
            'streak', v_streak
        );
    ELSIF v_last_login = v_yesterday THEN
        -- Logged in yesterday, increment streak
        v_streak := v_streak + 1;
        INSERT INTO public.daily_logins (user_id, login_date, streak_count)
        VALUES (p_user_id, v_today, v_streak);
        
        v_result := json_build_object(
            'status', 'success',
            'streak', v_streak,
            'new_login', true
        );
    ELSE
        -- First login or streak broken
        v_streak := 1;
        INSERT INTO public.daily_logins (user_id, login_date, streak_count)
        VALUES (p_user_id, v_today, v_streak);
        
        v_result := json_build_object(
            'status', 'success',
            'streak', v_streak,
            'new_login', true
        );
    END IF;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
