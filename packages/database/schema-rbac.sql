-- Role-Based Access Control (RBAC) Schema Extension
-- Add this to your existing schema.sql

-- 10. ROLES TABLE
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    is_system BOOLEAN NOT NULL DEFAULT false, -- System roles cannot be deleted
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. PERMISSIONS TABLE
CREATE TABLE IF NOT EXISTS public.permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    resource VARCHAR(50) NOT NULL, -- e.g., 'products', 'orders', 'categories'
    action VARCHAR(50) NOT NULL, -- e.g., 'create', 'read', 'update', 'delete'
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. ROLE_PERMISSIONS TABLE (Many-to-Many)
CREATE TABLE IF NOT EXISTS public.role_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES public.permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(role_id, permission_id)
);

-- 13. USER_ROLES TABLE (Many-to-Many - allows users to have multiple roles)
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, role_id)
);

-- Insert default roles
INSERT INTO public.roles (name, description, is_system) VALUES
    ('Super Admin', 'Full system access (manage admin accounts, all modules, settings, user management — top-level platform owner)', true),
    ('Admin', 'Full system access (all modules, settings, user and staff management — business owner level)', true),
    ('Staff', 'Order management, inventory management, limited reporting (no financials, no user role management, no content publishing)', true)
ON CONFLICT (name) DO NOTHING;

-- Insert default permissions
INSERT INTO public.permissions (name, resource, action, description) VALUES
    -- Product permissions
    ('products.create', 'products', 'create', 'Create new products'),
    ('products.read', 'products', 'read', 'View products'),
    ('products.update', 'products', 'update', 'Edit products'),
    ('products.delete', 'products', 'delete', 'Delete products'),
    
    -- Category permissions
    ('categories.create', 'categories', 'create', 'Create new categories'),
    ('categories.read', 'categories', 'read', 'View categories'),
    ('categories.update', 'categories', 'update', 'Edit categories'),
    ('categories.delete', 'categories', 'delete', 'Delete categories'),
    
    -- Order permissions
    ('orders.create', 'orders', 'create', 'Create orders'),
    ('orders.read', 'orders', 'read', 'View orders'),
    ('orders.update', 'orders', 'update', 'Update order status'),
    ('orders.delete', 'orders', 'delete', 'Delete orders'),
    ('orders.financials', 'orders', 'financials', 'Access financial reports and payment data'),
    
    -- Inventory permissions
    ('inventory.read', 'inventory', 'read', 'View inventory logs'),
    ('inventory.adjust', 'inventory', 'adjust', 'Adjust inventory levels'),
    ('inventory.reports', 'inventory', 'reports', 'View inventory reports'),
    
    -- User permissions
    ('users.create', 'users', 'create', 'Create new users'),
    ('users.read', 'users', 'read', 'View users'),
    ('users.update', 'users', 'update', 'Edit users'),
    ('users.delete', 'users', 'delete', 'Delete users'),
    ('users.manage_admins', 'users', 'manage_admins', 'Manage admin accounts'),
    ('users.manage_staff', 'users', 'manage_staff', 'Manage staff accounts'),
    
    -- Role permissions
    ('roles.create', 'roles', 'create', 'Create new roles'),
    ('roles.read', 'roles', 'read', 'View roles'),
    ('roles.update', 'roles', 'update', 'Edit roles'),
    ('roles.delete', 'roles', 'delete', 'Delete roles'),
    ('roles.assign', 'roles', 'assign', 'Assign roles to users'),
    ('roles.edit_staff', 'roles', 'edit_staff', 'Edit staff role permissions'),
    
    -- Content permissions
    ('content.read', 'content', 'read', 'View content sections'),
    ('content.update', 'content', 'update', 'Edit content sections'),
    ('content.publish', 'content', 'publish', 'Publish content'),
    
    -- Settings permissions
    ('settings.read', 'settings', 'read', 'View system settings'),
    ('settings.update', 'settings', 'update', 'Edit system settings'),
    ('settings.manage', 'settings', 'manage', 'Manage system settings'),
    
    -- Reporting permissions
    ('reports.view', 'reports', 'view', 'View basic reports'),
    ('reports.financial', 'reports', 'financial', 'View financial reports'),
    ('reports.advanced', 'reports', 'advanced', 'View advanced analytics')
ON CONFLICT (name) DO NOTHING;

-- Assign default permissions to Super Admin (ALL permissions - full system access)
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r, public.permissions p
WHERE r.name = 'Super Admin'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Assign default permissions to Admin (all modules, settings, user and staff management - no admin account management)
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r, public.permissions p
WHERE r.name = 'Admin' 
  AND p.name NOT IN ('users.manage_admins')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Assign default permissions to Staff (order management, inventory management, limited reporting)
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r, public.permissions p
WHERE r.name = 'Staff' 
  AND p.name IN (
    'products.read',
    'categories.read',
    'orders.read',
    'orders.update',
    'inventory.read',
    'inventory.adjust',
    'inventory.reports',
    'reports.view'
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Migrate existing users to new role system
INSERT INTO public.user_roles (user_id, role_id, assigned_by, assigned_at)
SELECT u.id, r.id, u.id, u.created_at
FROM public.users u, public.roles r
WHERE u.role = r.name
ON CONFLICT (user_id, role_id) DO NOTHING;

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON public.role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission ON public.role_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role_id);

-- RLS POLICIES
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Roles RLS
CREATE POLICY roles_admin_all ON public.roles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid() AND users.is_active = true
        )
    );

CREATE POLICY roles_public_read ON public.roles
    FOR SELECT USING (true);

-- Permissions RLS
CREATE POLICY permissions_admin_all ON public.permissions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid() AND users.is_active = true
        )
    );

CREATE POLICY permissions_public_read ON public.permissions
    FOR SELECT USING (true);

-- Role Permissions RLS
CREATE POLICY role_permissions_admin_all ON public.role_permissions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid() AND users.is_active = true
        )
    );

CREATE POLICY role_permissions_public_read ON public.role_permissions
    FOR SELECT USING (true);

-- User Roles RLS
CREATE POLICY user_roles_admin_all ON public.user_roles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid() AND users.is_active = true
        )
    );

CREATE POLICY user_roles_self_read ON public.user_roles
    FOR SELECT USING (user_id = auth.uid());
