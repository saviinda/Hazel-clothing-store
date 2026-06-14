-- Default Admin and Staff Accounts Setup
-- Run this after setting up Supabase Auth and the RBAC schema

-- IMPORTANT: You must first create the users in Supabase Auth, then run this script
-- to link them to the users table and assign roles.

-- Default Admin Account
-- Email: admin@hazel.com
-- Password: (Set in Supabase Auth)
-- Role: Admin

INSERT INTO public.users (id, name, email, role, is_active, created_at)
VALUES (
    'd916ede9-efb2-44dc-b11e-6d2d67cd7f1e', -- Replace with actual Supabase Auth user ID
    'Admin User',
    'admin@hazel.com',
    'Admin',
    true,
    NOW()
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    is_active = EXCLUDED.is_active;

-- Assign Admin role to the admin user
INSERT INTO public.user_roles (user_id, role_id, assigned_by, assigned_at)
SELECT 
    u.id,
    r.id,
    u.id,
    NOW()
FROM public.users u, public.roles r
WHERE u.email = 'admin@hazel.com' AND r.name = 'Admin'
ON CONFLICT (user_id, role_id) DO NOTHING;

-- Default Staff Account
-- Email: staff@hazel.com
-- Password: (Set in Supabase Auth)
-- Role: Staff

INSERT INTO public.users (id, name, email, role, is_active, created_at)
VALUES (
    '41bc3d2d-9fac-4f14-bec0-9237898ef81b', -- Replace with actual Supabase Auth user ID
    'Staff User',
    'staff@hazel.com',
    'Staff',
    true,
    NOW()
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    is_active = EXCLUDED.is_active;

-- Assign Staff role to the staff user
INSERT INTO public.user_roles (user_id, role_id, assigned_by, assigned_at)
SELECT 
    u.id,
    r.id,
    u.id,
    NOW()
FROM public.users u, public.roles r
WHERE u.email = 'staff@hazel.com' AND r.name = 'Staff'
ON CONFLICT (user_id, role_id) DO NOTHING;

-- Default Super Admin Account
-- Email: superadmin@hazel.com
-- Password: (Set in Supabase Auth)
-- Role: Super Admin

INSERT INTO public.users (id, name, email, role, is_active, created_at)
VALUES (
    '5d33dff0-c437-405f-999b-b0bdb1e325f6', -- Replace with actual Supabase Auth user ID
    'Super Admin',
    'superadmin@hazel.com',
    'Super Admin',
    true,
    NOW()
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    is_active = EXCLUDED.is_active;

-- Assign Super Admin role to the super admin user
INSERT INTO public.user_roles (user_id, role_id, assigned_by, assigned_at)
SELECT 
    u.id,
    r.id,
    u.id,
    NOW()
FROM public.users u, public.roles r
WHERE u.email = 'superadmin@hazel.com' AND r.name = 'Super Admin'
ON CONFLICT (user_id, role_id) DO NOTHING;
