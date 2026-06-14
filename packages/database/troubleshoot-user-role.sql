-- Troubleshooting Script for User Role Issues
-- Run this in Supabase SQL Editor to diagnose and fix role issues

-- Step 1: Check if RBAC tables exist
SELECT 
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('roles', 'permissions', 'role_permissions', 'user_roles')
ORDER BY table_name;

-- Step 2: Check existing users in the users table
SELECT 
    id,
    name,
    email,
    role,
    is_active,
    created_at
FROM public.users
ORDER BY created_at DESC;

-- Step 3: Check if user_roles table has any entries
SELECT 
    ur.id,
    ur.user_id,
    u.email as user_email,
    ur.role_id,
    r.name as role_name,
    ur.assigned_at
FROM public.user_roles ur
LEFT JOIN public.users u ON ur.user_id = u.id
LEFT JOIN public.roles r ON ur.role_id = r.id
ORDER BY ur.assigned_at DESC;

-- Step 4: Check Supabase Auth users (you can get this from Auth tab)
-- Note: This query won't work in SQL Editor - check Auth → Users in dashboard

-- Step 5: If admin user exists in Auth but not in users table, add them manually
-- Replace 'YOUR_ADMIN_USER_ID' with the actual UUID from Supabase Auth
-- Uncomment and run the following if needed:

/*
INSERT INTO public.users (id, name, email, role, is_active, created_at)
VALUES (
    'YOUR_ADMIN_USER_ID',  -- Get this from Supabase Auth → Users
    'Admin User',
    'admin@hazel.com',
    'Admin',
    true,
    NOW()
)
ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    is_active = EXCLUDED.is_active;
*/

-- Step 6: Assign Admin role to the user (if user_roles is empty)
-- Uncomment and run after updating the user ID:

/*
INSERT INTO public.user_roles (user_id, role_id, assigned_by, assigned_at)
SELECT 
    u.id,
    r.id,
    u.id,
    NOW()
FROM public.users u, public.roles r
WHERE u.email = 'admin@hazel.com' AND r.name = 'Admin'
ON CONFLICT (user_id, role_id) DO NOTHING;
*/

-- Step 7: Verify the fix
SELECT 
    u.id,
    u.name,
    u.email,
    u.role as legacy_role,
    r.name as rbac_role
FROM public.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
LEFT JOIN public.roles r ON ur.role_id = r.id
WHERE u.email = 'admin@hazel.com';
