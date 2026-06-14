// API Client utility for making requests to backend APIs

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new ApiError(
      data.error || 'Request failed',
      response.status,
      data
    );
  }

  return data.data;
}

// Website API Client
export const websiteApi = {
  // Products
  getProducts: (filters?: {
    category_id?: string;
    is_featured?: boolean;
    limit?: number;
  }) => request<any[]>('/api/v1/products', {
    method: 'GET',
  }).then(data => {
    // Add filters as query params
    const params = new URLSearchParams();
    if (filters?.category_id) params.append('category_id', filters.category_id);
    if (filters?.is_featured !== undefined) params.append('is_featured', String(filters.is_featured));
    if (filters?.limit) params.append('limit', String(filters.limit));
    
    return request<any[]>(`/api/v1/products?${params.toString()}`);
  }),

  getProductById: (id: string) => request<any>(`/api/v1/products/${id}`),

  // Categories
  getCategories: () => request<any[]>('/api/v1/categories'),
  getCategoryById: (id: string) => request<any>(`/api/v1/categories/${id}`),

  // Orders
  createOrder: (orderData: any) => request<any>('/api/v1/orders', {
    method: 'POST',
    body: JSON.stringify(orderData),
  }),

  getOrderById: (id: string) => request<any>(`/api/v1/orders/${id}`),

  updatePaymentProof: (orderId: string, paymentProofUrl: string) => 
    request<any>(`/api/v1/orders/${orderId}/payment-proof`, {
      method: 'PUT',
      body: JSON.stringify({ payment_proof_url: paymentProofUrl }),
    }),

  // Upload
  getUploadSignature: (folder: string, publicId?: string) => 
    request<any>('/api/v1/upload', {
      method: 'POST',
      body: JSON.stringify({ folder, publicId }),
    }),
};

// Admin API Client
export const adminApi = {
  // Products
  getProducts: (filters?: {
    category_id?: string;
    limit?: number;
  }) => {
    const params = new URLSearchParams();
    if (filters?.category_id) params.append('category_id', filters.category_id);
    if (filters?.limit) params.append('limit', String(filters.limit));
    
    return request<any[]>(`/api/v1/products?${params.toString()}`);
  },

  getProductById: (id: string) => request<any>(`/api/v1/products/${id}`),

  createProduct: (productData: any, createdBy: string) => 
    request<any>('/api/v1/products', {
      method: 'POST',
      body: JSON.stringify({ ...productData, created_by: createdBy }),
    }),

  updateProduct: (id: string, productData: any, updatedBy: string) => 
    request<any>(`/api/v1/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ ...productData, updated_by: updatedBy }),
    }),

  deleteProduct: (id: string, deletedBy: string) => 
    request<any>(`/api/v1/products/${id}`, {
      method: 'DELETE',
      body: JSON.stringify({ deleted_by: deletedBy }),
    }),

  // Categories
  getCategories: () => request<any[]>('/api/v1/categories'),
  getCategoryById: (id: string) => request<any>(`/api/v1/categories/${id}`),

  createCategory: (categoryData: any, updatedBy: string) => 
    request<any>('/api/v1/categories', {
      method: 'POST',
      body: JSON.stringify({ ...categoryData, updated_by: updatedBy }),
    }),

  updateCategory: (id: string, categoryData: any, updatedBy: string) => 
    request<any>(`/api/v1/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ ...categoryData, updated_by: updatedBy }),
    }),

  deleteCategory: (id: string, deletedBy: string) => 
    request<any>(`/api/v1/categories/${id}`, {
      method: 'DELETE',
      body: JSON.stringify({ deleted_by: deletedBy }),
    }),

  // Orders
  getOrders: (filters?: {
    order_status?: string;
    payment_status?: string;
    limit?: number;
  }) => {
    const params = new URLSearchParams();
    if (filters?.order_status) params.append('order_status', filters.order_status);
    if (filters?.payment_status) params.append('payment_status', filters.payment_status);
    if (filters?.limit) params.append('limit', String(filters.limit));
    
    return request<any[]>(`/api/v1/orders?${params.toString()}`);
  },

  getOrderById: (id: string) => request<any>(`/api/v1/orders/${id}`),

  updateOrderStatus: (
    id: string,
    orderStatus: string,
    paymentStatus?: string,
    updatedBy?: string,
    reason?: string
  ) => request<any>(`/api/v1/orders/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      order_status: orderStatus,
      payment_status: paymentStatus,
      updated_by: updatedBy,
      reason,
    }),
  }),

  updateOrderShipping: (
    id: string,
    courier: string,
    trackingNumber: string
  ) => request<any>(`/api/v1/orders/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      courier,
      tracking_number: trackingNumber,
    }),
  }),

  // Inventory
  getInventoryLogs: (productId?: string) => {
    const params = new URLSearchParams();
    if (productId) params.append('product_id', productId);
    
    return request<any[]>(`/api/v1/inventory?${params.toString()}`);
  },

  adjustInventory: (
    productId: string,
    action: 'add' | 'deduct' | 'adjust',
    quantity: number,
    reason: string,
    performedBy: string
  ) => request<any>('/api/v1/inventory', {
    method: 'POST',
    body: JSON.stringify({
      product_id: productId,
      action,
      quantity,
      reason,
      performed_by: performedBy,
    }),
  }),

  // Content
  getContent: (sectionKey: string) => {
    const params = new URLSearchParams();
    params.append('section_key', sectionKey);
    
    return request<any>(`/api/v1/content?${params.toString()}`);
  },

  setContent: (sectionKey: string, data: any, updatedBy: string) => 
    request<any>('/api/v1/content', {
      method: 'PUT',
      body: JSON.stringify({
        section_key: sectionKey,
        data,
        updated_by: updatedBy,
      }),
    }),

  // Upload
  getUploadSignature: (folder: string, publicId?: string) => 
    request<any>('/api/v1/upload', {
      method: 'POST',
      body: JSON.stringify({ folder, publicId }),
    }),

  // Roles
  getRoles: () => request<any[]>('/api/v1/roles'),
  getRoleById: (id: string) => request<any>(`/api/v1/roles/${id}`),
  createRole: (roleData: any, createdBy: string) => 
    request<any>('/api/v1/roles', {
      method: 'POST',
      body: JSON.stringify({ ...roleData, created_by: createdBy }),
    }),
  updateRole: (id: string, roleData: any, updatedBy: string) => 
    request<any>(`/api/v1/roles/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ ...roleData, updated_by: updatedBy }),
    }),
  deleteRole: (id: string, deletedBy: string) => 
    request<any>(`/api/v1/roles/${id}`, {
      method: 'DELETE',
      body: JSON.stringify({ deleted_by: deletedBy }),
    }),

  // Permissions
  getPermissions: () => request<any[]>('/api/v1/permissions'),
  getRolePermissions: (roleId: string) => request<any[]>(`/api/v1/roles/${roleId}/permissions`),
  assignPermissionToRole: (roleId: string, permissionId: string, assignedBy: string) => 
    request<any>(`/api/v1/roles/${roleId}/permissions`, {
      method: 'POST',
      body: JSON.stringify({ permission_id: permissionId, assigned_by: assignedBy }),
    }),
  removePermissionFromRole: (roleId: string, permissionId: string, removedBy: string) => 
    request<any>(`/api/v1/roles/${roleId}/permissions`, {
      method: 'DELETE',
      body: JSON.stringify({ permission_id: permissionId, removed_by: removedBy }),
    }),

  // User Roles
  getUserRoles: (userId: string) => request<any[]>(`/api/v1/users/${userId}/roles`),
  assignRoleToUser: (userId: string, roleId: string, assignedBy: string) => 
    request<any>(`/api/v1/users/${userId}/roles`, {
      method: 'POST',
      body: JSON.stringify({ role_id: roleId, assigned_by: assignedBy }),
    }),
  removeRoleFromUser: (userId: string, roleId: string, removedBy: string) => 
    request<any>(`/api/v1/users/${userId}/roles`, {
      method: 'DELETE',
      body: JSON.stringify({ role_id: roleId, removed_by: removedBy }),
    }),
};
