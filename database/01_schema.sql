-- Family Budget V4: Consolidated Database Schema
-- This script contains all necessary table definitions, constraints, and triggers.

-- 1. Users Table
CREATE TABLE IF NOT EXISTS public.users (
    username text PRIMARY KEY,
    password text NOT NULL,
    role text NOT NULL,
    usertype text,
    village text,
    house text,
    name text,
    phone text,
    email text,
    created_at timestamp with time zone DEFAULT now()
);

-- 2. Houses Table
CREATE TABLE IF NOT EXISTS public.fb_houses (
    village text NOT NULL,
    house_no integer NOT NULL,
    assigned_mother_username text REFERENCES public.users(username) ON DELETE SET NULL,
    mother_name text,
    PRIMARY KEY (village, house_no),
    CONSTRAINT unique_active_mother UNIQUE (assigned_mother_username)
);

-- 3. Rate Variables Table
CREATE TABLE IF NOT EXISTS public.fb_rate_variables (
    village text NOT NULL,
    year integer NOT NULL,
    month integer NOT NULL,
    variable_key text NOT NULL,
    value numeric(14,4) NOT NULL,
    updated_by text,
    PRIMARY KEY (village, year, month, variable_key)
);

-- 4. Child Counts / Budget Ledger Table
CREATE TABLE IF NOT EXISTS public.fb_child_counts (
    village text NOT NULL,
    year integer NOT NULL,
    month integer NOT NULL,
    house_no integer NOT NULL,
    food_o12 integer DEFAULT 0,
    food_u12 integer DEFAULT 0,
    clothing_o12 numeric(14,3) DEFAULT 0,
    clothing_u12 numeric(14,3) DEFAULT 0,
    household numeric(14,3) DEFAULT 0,
    mother_count integer DEFAULT 0,
    aunt_amount numeric(14,3) DEFAULT 0,
    arrears numeric(14,3) DEFAULT 0,
    adjustment numeric(14,3) DEFAULT 0,
    remarks text,
    open_food numeric(14,3) DEFAULT 0,
    open_cloth numeric(14,3) DEFAULT 0,
    open_hh numeric(14,3) DEFAULT 0,
    open_int numeric(14,3) DEFAULT 0,
    manual_adj_food numeric(14,3) DEFAULT 0,
    manual_adj_cloth numeric(14,3) DEFAULT 0,
    manual_adj_hh numeric(14,3) DEFAULT 0,
    manual_adj_int numeric(14,3) DEFAULT 0,
    PRIMARY KEY (village, year, month, house_no)
);

-- 5. Trigger: Keep Users table 'house' column perfectly synced with fb_houses
CREATE OR REPLACE FUNCTION sync_user_house()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.users 
    SET house = '' 
    WHERE village = NEW.village AND house = NEW.house_no::text AND username != COALESCE(NEW.assigned_mother_username, '');
    
    IF NEW.assigned_mother_username IS NOT NULL THEN
        UPDATE public.users 
        SET house = NEW.house_no::text 
        WHERE username = NEW.assigned_mother_username;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_user_house ON public.fb_houses;
CREATE TRIGGER trg_sync_user_house
AFTER INSERT OR UPDATE OF assigned_mother_username ON public.fb_houses
FOR EACH ROW
EXECUTE FUNCTION sync_user_house();
