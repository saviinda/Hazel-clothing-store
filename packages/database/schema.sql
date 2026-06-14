-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS TABLE (Linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'Staff' CHECK (role IN ('Super Admin', 'Admin', 'Staff')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    parent_category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
    slug VARCHAR(255) UNIQUE NOT NULL,
    image_url VARCHAR(512),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    description TEXT,
    sizes VARCHAR(50)[] NOT NULL,
    colors VARCHAR(50)[] NOT NULL,
    material VARCHAR(100),
    stock_qty INTEGER NOT NULL DEFAULT 0 CHECK (stock_qty >= 0),
    images VARCHAR(512)[] NOT NULL DEFAULT '{}',
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    sub_category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL
);

-- 4. CUSTOMERS TABLE
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(50) NOT NULL,
    address JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    items JSONB NOT NULL, -- Array of OrderItem: [{product_id, name, price, qty, size, color}]
    total_amount DECIMAL(10, 2) NOT NULL CHECK (total_amount >= 0),
    payment_method VARCHAR(50) NOT NULL DEFAULT 'Bank Transfer',
    payment_status VARCHAR(50) NOT NULL DEFAULT 'Pending' CHECK (payment_status IN ('Pending', 'Uploaded', 'Verified', 'Rejected')),
    payment_proof_url VARCHAR(512),
    order_status VARCHAR(50) NOT NULL DEFAULT 'Pending Payment' CHECK (order_status IN ('Pending Payment', 'Payment Verification', 'Processing', 'Packed', 'Shipped', 'Delivered', 'Completed', 'Cancelled')),
    shipping_address JSONB NOT NULL, -- {name, phone, street, city, postal_code}
    courier VARCHAR(100),
    tracking_number VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status_history JSONB[] NOT NULL DEFAULT '{}'
);

-- 6. INVENTORY LOGS TABLE
CREATE TABLE IF NOT EXISTS public.inventory_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL CHECK (action IN ('deduct', 'add', 'adjust')),
    quantity_before INTEGER NOT NULL,
    quantity_after INTEGER NOT NULL,
    reason TEXT,
    performed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. CONTENT TABLE (CMS Banners & Text)
CREATE TABLE IF NOT EXISTS public.content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    section_key VARCHAR(100) UNIQUE NOT NULL,
    data JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL
);

-- 8. NOTIFICATIONS TABLE (Brevo Email Queue Log)
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(100) NOT NULL,
    recipient_email VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    sent_at TIMESTAMPTZ,
    status VARCHAR(50) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Sent', 'Failed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    action VARCHAR(255) NOT NULL,
    module VARCHAR(100) NOT NULL,
    detail JSONB,
    ip_address VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- INDEXES FOR FASTER LOOKUPS
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_sub_category ON public.products(sub_category_id);
CREATE INDEX IF NOT EXISTS idx_products_is_active_is_deleted ON public.products(is_active, is_deleted);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);

-- AUTOMATIC STOCK LEVEL ADJUSTMENT TRIGGER
CREATE OR REPLACE FUNCTION public.handle_order_status_change()
RETURNS TRIGGER AS $$
DECLARE
    item RECORD;
    prod_id UUID;
    qty_to_deduct INT;
    old_stock INT;
    new_stock INT;
BEGIN
    -- Deduct stock only when switching to 'Processing'
    IF NEW.order_status = 'Processing' AND (OLD.order_status IS NULL OR OLD.order_status != 'Processing') THEN
        FOR item IN SELECT * FROM jsonb_to_recordset(NEW.items) AS x(product_id UUID, qty INT)
        LOOP
            prod_id := item.product_id;
            qty_to_deduct := item.qty;

            -- Fetch current stock level with row lock
            SELECT stock_qty INTO old_stock FROM public.products WHERE id = prod_id FOR UPDATE;

            IF old_stock IS NOT NULL THEN
                new_stock := old_stock - qty_to_deduct;
                IF new_stock < 0 THEN
                    new_stock := 0;
                END IF;

                -- Update stock level
                UPDATE public.products SET stock_qty = new_stock, updated_at = NOW() WHERE id = prod_id;

                -- Log in inventory logs
                INSERT INTO public.inventory_logs (product_id, action, quantity_before, quantity_after, reason, performed_by)
                VALUES (prod_id, 'deduct', old_stock, new_stock, 'Order Processed - Order ID: ' || NEW.id, NULL);
            END IF;
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER tr_order_status_change
    AFTER UPDATE OF order_status ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_order_status_change();

-- AUTOMATIC PUBLIC USER ROLE SYNC TRIGGER (On Supabase Auth Signup)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, name, email, role, is_active)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_metadata->>'name', 'Administrator'),
        NEW.email,
        CASE 
            WHEN NEW.email = 'superadmin@hazel.lk' OR NEW.email = 'superadmin@hazelclothing.lk' THEN 'Super Admin'
            WHEN NEW.email = 'admin@hazel.com' OR NEW.email = 'admin@hazelclothing.lk' THEN 'Admin'
            ELSE 'Staff'
        END,
        true
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 1. Products RLS Policies
CREATE POLICY products_public_read ON public.products
    FOR SELECT USING (is_active = true AND is_deleted = false);

CREATE POLICY products_admin_all ON public.products
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid() AND users.is_active = true
        )
    );

-- 2. Categories RLS Policies
CREATE POLICY categories_public_read ON public.categories
    FOR SELECT USING (is_active = true);

CREATE POLICY categories_admin_all ON public.categories
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid() AND users.is_active = true
        )
    );

-- 3. Users RLS Policies
CREATE POLICY users_self_read ON public.users
    FOR SELECT USING (id = auth.uid());

CREATE POLICY users_admin_all ON public.users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid() AND users.role IN ('Super Admin', 'Admin') AND users.is_active = true
        )
    );

-- 4. Orders RLS Policies
CREATE POLICY orders_public_create ON public.orders
    FOR INSERT WITH CHECK (true); -- Guest checkouts allowed

CREATE POLICY orders_public_read_tracking ON public.orders
    FOR SELECT USING (true); -- Allowed for status tracking page

CREATE POLICY orders_admin_all ON public.orders
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid() AND users.is_active = true
        )
    );

-- 5. Customers RLS Policies
CREATE POLICY customers_public_create ON public.customers
    FOR INSERT WITH CHECK (true);

CREATE POLICY customers_admin_all ON public.customers
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid() AND users.is_active = true
        )
    );

-- 6. Inventory Logs RLS Policies
CREATE POLICY inventory_logs_admin_all ON public.inventory_logs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid() AND users.is_active = true
        )
    );

-- 7. Content RLS Policies
CREATE POLICY content_public_read ON public.content
    FOR SELECT USING (true);

CREATE POLICY content_admin_all ON public.content
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid() AND users.role IN ('Super Admin', 'Admin') AND users.is_active = true
        )
    );

-- 8. Notifications RLS Policies
CREATE POLICY notifications_admin_all ON public.notifications
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid() AND users.role IN ('Super Admin', 'Admin') AND users.is_active = true
        )
    );

-- 9. Audit Logs RLS Policies
CREATE POLICY audit_logs_admin_all ON public.audit_logs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid() AND users.role IN ('Super Admin', 'Admin') AND users.is_active = true
        )
    );
