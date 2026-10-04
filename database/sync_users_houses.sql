-- 1. First, clear all house assignments in the users table to reset the display data
UPDATE public.users SET house = '';

-- 2. Re-apply the accurate house assignments strictly from the fb_houses table (the source of truth)
UPDATE public.users u
SET house = h.house_no
FROM public.fb_houses h
WHERE u.username = h.assigned_mother_username;

-- 3. Create a trigger function to permanently keep them in sync moving forward
CREATE OR REPLACE FUNCTION sync_user_house()
RETURNS TRIGGER AS $$
BEGIN
    -- Whenever a house assignment changes in fb_houses:
    
    -- a. Strip the house number from ANY other user in the same village who previously claimed this house
    UPDATE public.users 
    SET house = '' 
    WHERE village = NEW.village AND house = NEW.house_no AND username != COALESCE(NEW.assigned_mother_username, '');
    
    -- b. Update the newly assigned mother to show this house
    IF NEW.assigned_mother_username IS NOT NULL THEN
        UPDATE public.users 
        SET house = NEW.house_no 
        WHERE username = NEW.assigned_mother_username;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Attach the trigger
DROP TRIGGER IF EXISTS trg_sync_user_house ON public.fb_houses;
CREATE TRIGGER trg_sync_user_house
AFTER INSERT OR UPDATE OF assigned_mother_username ON public.fb_houses
FOR EACH ROW
EXECUTE FUNCTION sync_user_house();
