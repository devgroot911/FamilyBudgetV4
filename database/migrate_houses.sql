-- ============================================================================
-- ARCHITECTURE UPDATE: DECOUPLING HOUSES (migrate_houses.sql)
-- ============================================================================
-- OVERVIEW:
-- Historically, houses were just a text field attached to a Mother's profile.
-- This script restructures the database by creating a dedicated `fb_houses` 
-- table, making "Houses" independent entities. This ensures that if a mother 
-- leaves or is reassigned, the house's financial history remains intact.
-- ============================================================================

-- 1. Create the fb_houses table
CREATE TABLE IF NOT EXISTS public.fb_houses (
    house_no text PRIMARY KEY,
    village text NOT NULL,
    assigned_mother_username text REFERENCES public.users(username) ON DELETE SET NULL,
    created_at timestamp with time zone DEFAULT now()
);

-- 2. Populate fb_houses from existing users (Mothers)
INSERT INTO public.fb_houses (house_no, village, assigned_mother_username)
SELECT DISTINCT house, village, username 
FROM public.users 
WHERE house IS NOT NULL AND house != '' AND house != 'Master'
ON CONFLICT (house_no) DO UPDATE 
SET assigned_mother_username = EXCLUDED.assigned_mother_username;

-- 3. Add explicit balance columns to fb_child_counts (if not already there)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fb_child_counts' AND column_name='clothing_balance') THEN
        ALTER TABLE public.fb_child_counts ADD COLUMN clothing_balance numeric DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fb_child_counts' AND column_name='household_balance') THEN
        ALTER TABLE public.fb_child_counts ADD COLUMN household_balance numeric DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fb_child_counts' AND column_name='food_balance') THEN
        ALTER TABLE public.fb_child_counts ADD COLUMN food_balance numeric DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fb_child_counts' AND column_name='interest_balance') THEN
        ALTER TABLE public.fb_child_counts ADD COLUMN interest_balance numeric DEFAULT 0;
    END IF;
END $$;
