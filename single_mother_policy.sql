-- Clean up any existing duplicates first
UPDATE public.fb_houses 
SET assigned_mother_username = NULL 
WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY assigned_mother_username ORDER BY house_no) as rn
    FROM public.fb_houses
    WHERE assigned_mother_username IS NOT NULL AND assigned_mother_username != ''
  ) t WHERE rn > 1
);

-- Add unique constraint
ALTER TABLE public.fb_houses 
DROP CONSTRAINT IF EXISTS unique_active_mother;

ALTER TABLE public.fb_houses 
ADD CONSTRAINT unique_active_mother UNIQUE (assigned_mother_username);
