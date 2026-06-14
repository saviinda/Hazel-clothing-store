export type AdminRole = 'Super Admin' | 'Admin' | 'Staff';

export interface User {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  is_active: boolean;
  created_at: string;
}

export interface Role {
  id: string;
  name: string;
  description: string | null;
  is_system: boolean;
  created_at: string;
  updated_at: string;
}

export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
  description: string | null;
  created_at: string;
}

export interface RolePermission {
  id: string;
  role_id: string;
  permission_id: string;
  created_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role_id: string;
  assigned_by: string | null;
  assigned_at: string;
}

export interface Category {
  id: string;
  name: string;
  parent_category_id: string | null;
  slug: string;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  description: string | null;
  sizes: string[];
  colors: string[];
  images: string[];
  material: string | null;
  stock_qty: number;
  category_id: string | null;
  sub_category_id: string | null;
  is_active: boolean;
  is_featured: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface CustomerAddress {
  street: string;
  city: string;
  postal_code: string;
  state?: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  address: CustomerAddress;
  created_at: string;
}

export interface OrderItem {
  product_id: string;
  name: string;
  price: number;
  qty: number;
  size: string;
  color: string;
  image_url?: string;
}

export type PaymentStatus = 'Pending' | 'Uploaded' | 'Verified' | 'Rejected';
export type OrderStatus =
  | 'Pending Payment'
  | 'Payment Verification'
  | 'Processing'
  | 'Packed'
  | 'Shipped'
  | 'Delivered'
  | 'Completed'
  | 'Cancelled';

export interface OrderStatusHistoryItem {
  status: OrderStatus;
  updated_at: string;
  updated_by: string; // User ID or 'system' / 'customer'
  reason?: string;
}

export interface Order {
  id: string;
  customer_id: string | null;
  items: OrderItem[];
  total_amount: number;
  payment_method: string; // default: 'Bank Transfer'
  payment_status: PaymentStatus;
  payment_proof_url: string | null;
  order_status: OrderStatus;
  shipping_address: {
    name: string;
    phone: string;
    street: string;
    city: string;
    postal_code: string;
  };
  courier: string | null;
  tracking_number: string | null;
  created_at: string;
  status_updated_at: string;
  status_history: OrderStatusHistoryItem[];
}

export interface InventoryLog {
  id: string;
  product_id: string;
  action: 'deduct' | 'add' | 'adjust';
  quantity_before: number;
  quantity_after: number;
  reason: string | null;
  performed_by: string | null;
  created_at: string;
}

export interface ContentSection {
  id: string;
  section_key: string;
  data: Record<string, any>;
  updated_at: string;
  updated_by: string | null;
}

export interface SystemNotification {
  id: string;
  type: string;
  recipient_email: string;
  subject: string;
  body: string;
  sent_at: string | null;
  status: 'Pending' | 'Sent' | 'Failed';
  created_at: string;
}

export interface AuditLog {
  id: string;
  admin_id: string | null;
  action: string;
  module: string;
  detail: Record<string, any> | null;
  ip_address: string | null;
  created_at: string;
}
