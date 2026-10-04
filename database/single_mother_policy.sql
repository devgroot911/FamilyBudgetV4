-- ============================================================================
-- SECURITY POLICY: SINGLE MOTHER CONSTRAINT (single_mother_policy.sql)
-- ============================================================================
-- OVERVIEW:
-- This script enforces a strict business rule: A mother can only be assigned 
-- to ONE house at a time across the entire system.
-- 
-- MECHANISM: 
-- It cleans up any existing duplicate assignments and applies a UNIQUE 
-- constraint on the `assigned_mother_username` column in `fb_houses`.
-- ============================================================================

-- Clean up any existing duplicates first using the correct primary keys
UPDATE public.fb_houses 
SET assigned_mother_username = NULL 
WHERE (village, house_no) IN (
  SELECT village, house_no FROM (
    SELECT village, house_no, ROW_NUMBER() OVER (PARTITION BY assigned_mother_username ORDER BY house_no) as rn
    FROM public.fb_houses
    WHERE assigned_mother_username IS NOT NULL AND assigned_mother_username != ''
  ) t WHERE rn > 1
);

-- Add unique constraint
ALTER TABLE public.fb_houses 
DROP CONSTRAINT IF EXISTS unique_active_mother;

ALTER TABLE public.fb_houses 
ADD CONSTRAINT unique_active_mother UNIQUE (assigned_mother_username);
