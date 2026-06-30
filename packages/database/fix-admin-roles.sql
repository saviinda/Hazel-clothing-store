-- Fix existing admin/super admin roles in users table
-- Run this in Supabase SQL Editor to correct role assignments

UPDATE public.users
SET role = CASE 
    WHEN email = 'superadmin@hazel.lk' OR email = 'superadmin@hazelclothing.lk' THEN 'Super Admin'
    WHEN email = 'admin@hazel.com' OR email = 'admin@hazelclothing.lk' THEN 'Admin'
    WHEN email = 'staff@hazel.com' OR email = 'staff@hazelclothing.lk' THEN 'Staff'
    ELSE role
END
WHERE email IN ('superadmin@hazel.lk', 'superadmin@hazelclothing.lk', 'admin@hazel.com', 'admin@hazelclothing.lk', 'staff@hazel.com', 'staff@hazelclothing.lk');

-- Verify the changes
SELECT id, name, email, role, is_active, created_at
FROM public.users
WHERE email IN ('superadmin@hazel.lk', 'superadmin@hazelclothing.lk', 'admin@hazel.com', 'admin@hazelclothing.lk', 'staff@hazel.com', 'staff@hazelclothing.lk')
ORDER BY email;
