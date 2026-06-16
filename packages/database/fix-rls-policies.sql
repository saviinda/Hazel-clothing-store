-- SQL script to fix the infinite recursion in Supabase Row Level Security (RLS) policies.
-- Run this in your Supabase project's SQL Editor.

-- 1. Create SECURITY DEFINER functions to query public.users.
-- Since these functions are SECURITY DEFINER, they run with the privileges of the database owner (bypassing RLS).
-- This completely avoids the infinite recursion when a policy checks public.users.

CREATE OR REPLACE FUNCTION public.check_user_role_and_active(user_id UUID, roles_list text[])
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.users
        WHERE id = user_id AND role = ANY(roles_list) AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.check_user_active(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.users
        WHERE id = user_id AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop and re-create RLS Policy on public.users
DROP POLICY IF EXISTS users_admin_all ON public.users;
CREATE POLICY users_admin_all ON public.users
    FOR ALL USING (
        public.check_user_role_and_active(auth.uid(), ARRAY['Super Admin', 'Admin'])
    );

-- 3. Drop and re-create RLS Policy on public.products
DROP POLICY IF EXISTS products_admin_all ON public.products;
CREATE POLICY products_admin_all ON public.products
    FOR ALL USING (
        public.check_user_active(auth.uid())
    );

-- 4. Drop and re-create RLS Policy on public.categories
DROP POLICY IF EXISTS categories_admin_all ON public.categories;
CREATE POLICY categories_admin_all ON public.categories
    FOR ALL USING (
        public.check_user_active(auth.uid())
    );

-- 5. Drop and re-create RLS Policy on public.orders
DROP POLICY IF EXISTS orders_admin_all ON public.orders;
CREATE POLICY orders_admin_all ON public.orders
    FOR ALL USING (
        public.check_user_active(auth.uid())
    );

-- 6. Drop and re-create RLS Policy on public.customers
DROP POLICY IF EXISTS customers_admin_all ON public.customers;
CREATE POLICY customers_admin_all ON public.customers
    FOR ALL USING (
        public.check_user_active(auth.uid())
    );

-- 7. Drop and re-create RLS Policy on public.inventory_logs
DROP POLICY IF EXISTS inventory_logs_admin_all ON public.inventory_logs;
CREATE POLICY inventory_logs_admin_all ON public.inventory_logs
    FOR ALL USING (
        public.check_user_active(auth.uid())
    );

-- 8. Drop and re-create RLS Policy on public.content
DROP POLICY IF EXISTS content_admin_all ON public.content;
CREATE POLICY content_admin_all ON public.content
    FOR ALL USING (
        public.check_user_role_and_active(auth.uid(), ARRAY['Super Admin', 'Admin'])
    );

-- 9. Drop and re-create RLS Policy on public.notifications;
DROP POLICY IF EXISTS notifications_admin_all ON public.notifications;
CREATE POLICY notifications_admin_all ON public.notifications
    FOR ALL USING (
        public.check_user_role_and_active(auth.uid(), ARRAY['Super Admin', 'Admin'])
    );

-- 10. Drop and re-create RLS Policy on public.audit_logs
DROP POLICY IF EXISTS audit_logs_admin_all ON public.audit_logs;
CREATE POLICY audit_logs_admin_all ON public.audit_logs
    FOR ALL USING (
        public.check_user_role_and_active(auth.uid(), ARRAY['Super Admin', 'Admin'])
    );

-- 11. Drop and re-create RLS Policy on public.roles
DROP POLICY IF EXISTS roles_admin_all ON public.roles;
CREATE POLICY roles_admin_all ON public.roles
    FOR ALL USING (
        public.check_user_active(auth.uid())
    );

-- 12. Drop and re-create RLS Policy on public.permissions
DROP POLICY IF EXISTS permissions_admin_all ON public.permissions;
CREATE POLICY permissions_admin_all ON public.permissions
    FOR ALL USING (
        public.check_user_active(auth.uid())
    );

-- 13. Drop and re-create RLS Policy on public.role_permissions
DROP POLICY IF EXISTS role_permissions_admin_all ON public.role_permissions;
CREATE POLICY role_permissions_admin_all ON public.role_permissions
    FOR ALL USING (
        public.check_user_active(auth.uid())
    );

-- 14. Drop and re-create RLS Policy on public.user_roles
DROP POLICY IF EXISTS user_roles_admin_all ON public.user_roles;
CREATE POLICY user_roles_admin_all ON public.user_roles
    FOR ALL USING (
        public.check_user_active(auth.uid())
    );
