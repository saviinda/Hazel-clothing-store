-- Fix 1: Add default UUID generation to customers.id so guest inserts never fail
ALTER TABLE public.customers 
  ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Fix 2: Recreate handle_new_customer with correct unqualified column references
CREATE OR REPLACE FUNCTION public.handle_new_customer()
RETURNS TRIGGER AS $$
BEGIN
  IF COALESCE(NEW.raw_user_metadata->>'role', '') = 'customer' THEN
    INSERT INTO public.customers (id, name, email, phone, address)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_metadata->>'name', 'Customer'),
      NEW.email,
      COALESCE(NEW.raw_user_metadata->>'phone', ''),
      COALESCE((NEW.raw_user_metadata->>'address')::jsonb, '{"street": "", "city": "", "postal_code": ""}')
    )
    ON CONFLICT (email) DO UPDATE SET
      name = COALESCE(NEW.raw_user_metadata->>'name', customers.name),
      phone = COALESCE(NEW.raw_user_metadata->>'phone', customers.phone),
      address = COALESCE((NEW.raw_user_metadata->>'address')::jsonb, customers.address);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix 3: Recreate handle_new_user with correct unqualified column references
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  IF COALESCE(NEW.raw_user_metadata->>'role', '') != 'customer' THEN
    INSERT INTO public.users (id, name, email, role, is_active)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_metadata->>'name', 'Administrator'),
      NEW.email,
      CASE 
        WHEN NEW.email IN ('superadmin@hazel.lk', 'superadmin@hazel.com', 'superadmin@hazelclothing.lk') THEN 'Super Admin'
        WHEN NEW.email IN ('admin@hazel.com', 'admin@hazelclothing.lk') THEN 'Admin'
        ELSE COALESCE(NULLIF(NEW.raw_user_metadata->>'role', ''), 'Staff')
      END,
      true
    )
    ON CONFLICT (id) DO UPDATE SET
      email = NEW.email,
      name = COALESCE(NEW.raw_user_metadata->>'name', users.name),
      role = CASE 
        WHEN NEW.email IN ('superadmin@hazel.lk', 'superadmin@hazel.com', 'superadmin@hazelclothing.lk') THEN 'Super Admin'
        WHEN NEW.email IN ('admin@hazel.com', 'admin@hazelclothing.lk') THEN 'Admin'
        ELSE COALESCE(NULLIF(NEW.raw_user_metadata->>'role', ''), users.role)
      END;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verify the default was set
SELECT column_name, column_default, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'customers' AND column_name = 'id';
