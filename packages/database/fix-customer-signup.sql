-- Fix customer account creation issue
-- Run this in Supabase SQL Editor to apply the fix

-- First, make phone and address nullable in customers table and remove default ID generation
ALTER TABLE public.customers
ALTER COLUMN phone DROP NOT NULL,
ALTER COLUMN address DROP NOT NULL,
ALTER COLUMN id DROP DEFAULT;

-- Drop ALL triggers to isolate the issue
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_customer_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.handle_new_customer();

-- Recreate user trigger (skips customers) - WITHOUT customer trigger for now
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Only insert into users table if the user is NOT a customer
    IF COALESCE(NEW.raw_user_metadata->>'role', '') != 'customer' THEN
        INSERT INTO public.users (id, name, email, role, is_active)
        VALUES (
            NEW.id,
            COALESCE(NEW.raw_user_metadata->>'name', 'Administrator'),
            NEW.email,
            CASE
                WHEN NEW.email = 'superadmin@hazel.lk' OR NEW.email = 'superadmin@hazel.com' OR NEW.email = 'superadmin@hazelclothing.lk' THEN 'Super Admin'
                WHEN NEW.email = 'admin@hazel.com' OR NEW.email = 'admin@hazelclothing.lk' THEN 'Admin'
                ELSE 'Staff'
            END,
            true
        )
        ON CONFLICT (id) DO UPDATE SET
            role = CASE
                WHEN NEW.email = 'superadmin@hazel.lk' OR NEW.email = 'superadmin@hazel.com' OR NEW.email = 'superadmin@hazelclothing.lk' THEN 'Super Admin'
                WHEN NEW.email = 'admin@hazel.com' OR NEW.email = 'admin@hazelclothing.lk' THEN 'Admin'
                ELSE 'Staff'
            END,
            email = NEW.email,
            name = COALESCE(NEW.raw_user_metadata->>'name', public.users.name);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Verify the trigger is created
SELECT
    trigger_name,
    event_manipulation,
    event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';
