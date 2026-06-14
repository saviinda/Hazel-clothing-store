import { supabase, getSupabaseAdminClient } from './supabase';
import { Product, Category, Order, Customer, User, InventoryLog, ContentSection, SystemNotification, AuditLog } from '@hazel/shared';

// ==================== PRODUCTS ====================
export async function getProducts(filters?: {
  category_id?: string;
  is_featured?: boolean;
  limit?: number;
}): Promise<Product[]> {
  let query = supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false });

  if (filters?.category_id) {
    query = query.eq('category_id', filters.category_id);
  }

  if (filters?.is_featured !== undefined) {
    query = query.eq('is_featured', filters.is_featured);
  }

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as Product[];
}

export async function getProductById(id: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .eq('is_active', true)
    .eq('is_deleted', false)
    .single();

  if (error) throw error;
  return data as Product;
}

export async function createProduct(product: Partial<Product>, createdBy: string): Promise<Product> {
  const admin = getSupabaseAdminClient();
  const { data, error } = await admin
    .from('products')
    .insert({
      ...product,
      created_by: createdBy,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Product;
}

export async function updateProduct(id: string, product: Partial<Product>): Promise<Product> {
  const admin = getSupabaseAdminClient();
  const { data, error } = await admin
    .from('products')
    .update({
      ...product,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Product;
}

export async function deleteProduct(id: string): Promise<void> {
  const admin = getSupabaseAdminClient();
  const { error } = await admin
    .from('products')
    .update({ is_deleted: true, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;
}

// ==================== CATEGORIES ====================
export async function getCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (error) throw error;
  return data as Category[];
}

export async function getCategoryById(id: string): Promise<Category | null> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as Category;
}

export async function createCategory(category: Partial<Category>, updatedBy: string): Promise<Category> {
  const admin = getSupabaseAdminClient();
  const { data, error } = await admin
    .from('categories')
    .insert({
      ...category,
      updated_by: updatedBy,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Category;
}

export async function updateCategory(id: string, category: Partial<Category>, updatedBy: string): Promise<Category> {
  const admin = getSupabaseAdminClient();
  const { data, error } = await admin
    .from('categories')
    .update({
      ...category,
      updated_at: new Date().toISOString(),
      updated_by: updatedBy,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Category;
}

export async function deleteCategory(id: string): Promise<void> {
  const admin = getSupabaseAdminClient();
  const { error } = await admin
    .from('categories')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;
}

// ==================== ORDERS ====================
export async function createOrder(order: Partial<Order>): Promise<Order> {
  const { data, error } = await supabase
    .from('orders')
    .insert({
      ...order,
      created_at: new Date().toISOString(),
      status_updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data as Order;
}

export async function getOrderById(id: string): Promise<Order | null> {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as Order;
}

export async function getOrders(filters?: {
  order_status?: string;
  payment_status?: string;
  limit?: number;
}): Promise<Order[]> {
  let query = supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters?.order_status) {
    query = query.eq('order_status', filters.order_status);
  }

  if (filters?.payment_status) {
    query = query.eq('payment_status', filters.payment_status);
  }

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as Order[];
}

export async function updateOrderStatus(
  id: string,
  orderStatus: string,
  paymentStatus?: string,
  updatedBy?: string,
  reason?: string
): Promise<Order> {
  const admin = getSupabaseAdminClient();
  
  const { data: currentOrder } = await admin
    .from('orders')
    .select('status_history')
    .eq('id', id)
    .single();

  const statusHistory = currentOrder?.status_history || [];
  statusHistory.push({
    status: orderStatus,
    updated_at: new Date().toISOString(),
    updated_by: updatedBy || 'system',
    reason,
  });

  const { data, error } = await admin
    .from('orders')
    .update({
      order_status: orderStatus,
      payment_status: paymentStatus,
      status_updated_at: new Date().toISOString(),
      status_history,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Order;
}

export async function updateOrderPaymentProof(id: string, paymentProofUrl: string): Promise<Order> {
  const admin = getSupabaseAdminClient();
  const { data, error } = await admin
    .from('orders')
    .update({
      payment_proof_url: paymentProofUrl,
      payment_status: 'Uploaded',
      status_updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Order;
}

export async function updateOrderShipping(id: string, courier: string, trackingNumber: string): Promise<Order> {
  const admin = getSupabaseAdminClient();
  const { data, error } = await admin
    .from('orders')
    .update({
      courier,
      tracking_number: trackingNumber,
      status_updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Order;
}

// ==================== CUSTOMERS ====================
export async function createCustomer(customer: Partial<Customer>): Promise<Customer> {
  const { data, error } = await supabase
    .from('customers')
    .insert({
      ...customer,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data as Customer;
}

export async function getCustomerById(id: string): Promise<Customer | null> {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as Customer;
}

export async function getCustomers(): Promise<Customer[]> {
  const admin = getSupabaseAdminClient();
  const { data, error } = await admin
    .from('customers')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Customer[];
}

// ==================== USERS ====================
export async function getUsers(): Promise<User[]> {
  const admin = getSupabaseAdminClient();
  const { data, error } = await admin
    .from('users')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as User[];
}

export async function getUserById(id: string): Promise<User | null> {
  const admin = getSupabaseAdminClient();
  const { data, error } = await admin
    .from('users')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as User;
}

export async function createUser(user: Partial<User>): Promise<User> {
  const admin = getSupabaseAdminClient();
  const { data, error } = await admin
    .from('users')
    .insert(user)
    .select()
    .single();

  if (error) throw error;
  return data as User;
}

export async function updateUser(id: string, user: Partial<User>): Promise<User> {
  const admin = getSupabaseAdminClient();
  const { data, error } = await admin
    .from('users')
    .update(user)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as User;
}

// ==================== INVENTORY LOGS ====================
export async function getInventoryLogs(productId?: string): Promise<InventoryLog[]> {
  const admin = getSupabaseAdminClient();
  let query = admin
    .from('inventory_logs')
    .select('*')
    .order('created_at', { ascending: false });

  if (productId) {
    query = query.eq('product_id', productId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as InventoryLog[];
}

export async function createInventoryLog(log: Partial<InventoryLog>): Promise<InventoryLog> {
  const admin = getSupabaseAdminClient();
  const { data, error } = await admin
    .from('inventory_logs')
    .insert({
      ...log,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data as InventoryLog;
}

export async function adjustInventory(
  productId: string,
  action: 'add' | 'deduct' | 'adjust',
  quantity: number,
  reason: string,
  performedBy: string
): Promise<void> {
  const admin = getSupabaseAdminClient();
  
  const { data: product } = await admin
    .from('products')
    .select('stock_qty')
    .eq('id', productId)
    .single();

  if (!product) throw new Error('Product not found');

  const quantityBefore = product.stock_qty;
  let quantityAfter = quantityBefore;

  if (action === 'add') {
    quantityAfter += quantity;
  } else if (action === 'deduct') {
    quantityAfter = Math.max(0, quantityAfter - quantity);
  } else if (action === 'adjust') {
    quantityAfter = quantity;
  }

  await admin
    .from('products')
    .update({ stock_qty: quantityAfter, updated_at: new Date().toISOString() })
    .eq('id', productId);

  await createInventoryLog({
    product_id: productId,
    action,
    quantity_before: quantityBefore,
    quantity_after: quantityAfter,
    reason,
    performed_by: performedBy,
  });
}

// ==================== CONTENT ====================
export async function getContent(sectionKey: string): Promise<ContentSection | null> {
  const { data, error } = await supabase
    .from('content')
    .select('*')
    .eq('section_key', sectionKey)
    .single();

  if (error) throw error;
  return data as ContentSection;
}

export async function setContent(sectionKey: string, data: Record<string, any>, updatedBy: string): Promise<ContentSection> {
  const admin = getSupabaseAdminClient();
  const { data: content, error } = await admin
    .from('content')
    .upsert({
      section_key: sectionKey,
      data,
      updated_at: new Date().toISOString(),
      updated_by: updatedBy,
    })
    .select()
    .single();

  if (error) throw error;
  return content as ContentSection;
}

// ==================== NOTIFICATIONS ====================
export async function createNotification(notification: Partial<SystemNotification>): Promise<SystemNotification> {
  const admin = getSupabaseAdminClient();
  const { data, error } = await admin
    .from('notifications')
    .insert({
      ...notification,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data as SystemNotification;
}

export async function updateNotificationStatus(id: string, status: 'Sent' | 'Failed'): Promise<SystemNotification> {
  const admin = getSupabaseAdminClient();
  const { data, error } = await admin
    .from('notifications')
    .update({
      status,
      sent_at: status === 'Sent' ? new Date().toISOString() : null,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as SystemNotification;
}

export async function getNotifications(): Promise<SystemNotification[]> {
  const admin = getSupabaseAdminClient();
  const { data, error } = await admin
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) throw error;
  return data as SystemNotification[];
}

// ==================== AUDIT LOGS ====================
export async function createAuditLog(log: Partial<AuditLog>): Promise<AuditLog> {
  const admin = getSupabaseAdminClient();
  const { data, error } = await admin
    .from('audit_logs')
    .insert({
      ...log,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data as AuditLog;
}

export async function getAuditLogs(filters?: {
  admin_id?: string;
  module?: string;
  limit?: number;
}): Promise<AuditLog[]> {
  const admin = getSupabaseAdminClient();
  let query = admin
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters?.admin_id) {
    query = query.eq('admin_id', filters.admin_id);
  }

  if (filters?.module) {
    query = query.eq('module', filters.module);
  }

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as AuditLog[];
}

// ==================== ROLES ====================
export async function getRoles(): Promise<any[]> {
  const { data, error } = await supabase
    .from('roles')
    .select('*')
    .order('name', { ascending: true });

  if (error) throw error;
  return data;
}

export async function getRoleById(id: string): Promise<any | null> {
  const { data, error } = await supabase
    .from('roles')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function createRole(role: Partial<any>): Promise<any> {
  const admin = getSupabaseAdminClient();
  const { data, error } = await admin
    .from('roles')
    .insert({
      ...role,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateRole(id: string, role: Partial<any>): Promise<any> {
  const admin = getSupabaseAdminClient();
  const { data, error } = await admin
    .from('roles')
    .update({
      ...role,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteRole(id: string): Promise<void> {
  const admin = getSupabaseAdminClient();
  
  // Check if it's a system role
  const role = await getRoleById(id);
  if (role?.is_system) {
    throw new Error('Cannot delete system roles');
  }

  const { error } = await admin
    .from('roles')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ==================== PERMISSIONS ====================
export async function getPermissions(): Promise<any[]> {
  const { data, error } = await supabase
    .from('permissions')
    .select('*')
    .order('resource', { ascending: true });

  if (error) throw error;
  return data;
}

export async function getPermissionById(id: string): Promise<any | null> {
  const { data, error } = await supabase
    .from('permissions')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function createPermission(permission: Partial<any>): Promise<any> {
  const admin = getSupabaseAdminClient();
  const { data, error } = await admin
    .from('permissions')
    .insert({
      ...permission,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deletePermission(id: string): Promise<void> {
  const admin = getSupabaseAdminClient();
  const { error } = await admin
    .from('permissions')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ==================== ROLE PERMISSIONS ====================
export async function getRolePermissions(roleId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('role_permissions')
    .select('*, permissions(*)')
    .eq('role_id', roleId);

  if (error) throw error;
  return data;
}

export async function assignPermissionToRole(roleId: string, permissionId: string): Promise<void> {
  const admin = getSupabaseAdminClient();
  const { error } = await admin
    .from('role_permissions')
    .insert({
      role_id: roleId,
      permission_id: permissionId,
      created_at: new Date().toISOString(),
    });

  if (error) throw error;
}

export async function removePermissionFromRole(roleId: string, permissionId: string): Promise<void> {
  const admin = getSupabaseAdminClient();
  const { error } = await admin
    .from('role_permissions')
    .delete()
    .eq('role_id', roleId)
    .eq('permission_id', permissionId);

  if (error) throw error;
}

// ==================== USER ROLES ====================
export async function getUserRoles(userId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('user_roles')
    .select('*, roles(*)')
    .eq('user_id', userId);

  if (error) throw error;
  return data;
}

export async function assignRoleToUser(userId: string, roleId: string, assignedBy: string): Promise<void> {
  const admin = getSupabaseAdminClient();
  const { error } = await admin
    .from('user_roles')
    .insert({
      user_id: userId,
      role_id: roleId,
      assigned_by: assignedBy,
      assigned_at: new Date().toISOString(),
    });

  if (error) throw error;
}

export async function removeRoleFromUser(userId: string, roleId: string): Promise<void> {
  const admin = getSupabaseAdminClient();
  const { error } = await admin
    .from('user_roles')
    .delete()
    .eq('user_id', userId)
    .eq('role_id', roleId);

  if (error) throw error;
}

export async function getUserPermissions(userId: string): Promise<any[]> {
  const admin = getSupabaseAdminClient();
  const { data, error } = await admin
    .from('user_roles')
    .select('role_permissions(*)')
    .eq('user_id', userId);

  if (error) throw error;
  return data;
}

export async function hasPermission(userId: string, permissionName: string): Promise<boolean> {
  const admin = getSupabaseAdminClient();
  const { data, error } = await admin
    .from('user_roles')
    .select('role_permissions!inner(permissions!inner(*))')
    .eq('user_id', userId)
    .eq('role_permissions.permissions.name', permissionName);

  if (error) throw error;
  return data && data.length > 0;
}
