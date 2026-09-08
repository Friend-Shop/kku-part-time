-- Add reward_points to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS reward_points INTEGER DEFAULT 0;

-- Update record_daily_login function to award points
CREATE OR REPLACE FUNCTION public.record_daily_login(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
    v_today DATE := CURRENT_DATE;
    v_yesterday DATE := v_today - INTERVAL '1 day';
    v_last_login DATE;
    v_streak INTEGER := 1;
    v_points_awarded INTEGER := 10;
    v_bonus_points INTEGER := 0;
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
            'streak', v_streak,
            'points_awarded', 0
        );
    ELSE
        IF v_last_login = v_yesterday THEN
            -- Logged in yesterday, increment streak
            v_streak := v_streak + 1;
        ELSE
            -- Streak broken
            v_streak := 1;
        END IF;

        -- Check for bonus (e.g., every 7 days)
        IF v_streak % 7 = 0 THEN
            v_bonus_points := 50;
        END IF;

        -- Award points
        UPDATE public.profiles
        SET reward_points = COALESCE(reward_points, 0) + v_points_awarded + v_bonus_points
        WHERE id = p_user_id;

        -- Record the login
        INSERT INTO public.daily_logins (user_id, login_date, streak_count)
        VALUES (p_user_id, v_today, v_streak)
        ON CONFLICT (user_id, login_date) DO UPDATE
        SET streak_count = EXCLUDED.streak_count;
        
        v_result := json_build_object(
            'status', 'success',
            'streak', v_streak,
            'new_login', true,
            'points_awarded', v_points_awarded + v_bonus_points,
            'is_bonus', v_bonus_points > 0
        );
    END IF;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
