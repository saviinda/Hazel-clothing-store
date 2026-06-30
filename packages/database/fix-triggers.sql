-- Fix Database Triggers for User and Customer Creation (Robust Version)
-- Run this in your Supabase project's SQL Editor (https://supabase.com/dashboard/project/lcyphawmyidtefxkmioh/sql)

-- Drop existing triggers and functions first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_customer_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.handle_new_customer();

-- 1. Create a corrected handle_new_user function
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
            COALESCE(
                NULLIF(NEW.raw_user_metadata->>'role', ''),
                CASE
                    WHEN NEW.email = 'superadmin@hazel.lk' OR NEW.email = 'superadmin@hazel.com' OR NEW.email = 'superadmin@hazelclothing.lk' THEN 'Super Admin'
                    WHEN NEW.email = 'admin@hazel.com' OR NEW.email = 'admin@hazelclothing.lk' THEN 'Admin'
                    ELSE 'Staff'
                END
            ),
            true
        )
        ON CONFLICT (id) DO UPDATE SET
            role = COALESCE(
                NULLIF(NEW.raw_user_metadata->>'role', ''),
                role
            ),
            email = NEW.email,
            name = COALESCE(NEW.raw_user_metadata->>'name', name);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create a corrected handle_new_customer function
CREATE OR REPLACE FUNCTION public.handle_new_customer()
RETURNS TRIGGER AS $$
BEGIN
    -- Only insert into customers table if the user IS a customer
    IF COALESCE(NEW.raw_user_metadata->>'role', '') = 'customer' THEN
        INSERT INTO public.customers (id, name, email, phone, address)
        VALUES (
            NEW.id,
            COALESCE(NEW.raw_user_metadata->>'name', 'Customer'),
            NEW.email,
            COALESCE(NEW.raw_user_metadata->>'phone', ''),
            COALESCE(NEW.raw_user_metadata->>'address', '{"street": "", "city": "", "postal_code": ""}')::jsonb
        )
        ON CONFLICT (email) DO UPDATE SET
            name = COALESCE(NEW.raw_user_metadata->>'name', name),
            phone = COALESCE(NEW.raw_user_metadata->>'phone', phone),
            address = COALESCE((NEW.raw_user_metadata->>'address')::jsonb, address);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate triggers
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER on_auth_customer_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_customer();
