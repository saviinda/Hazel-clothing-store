# Role-Based Access Control (RBAC) Guide

This guide explains the role-based permission system implemented in the Hazel Clothing Store admin panel.

## Overview

The RBAC system allows you to:
- Create custom roles with specific permissions
- Assign permissions to roles
- Assign multiple roles to users
- Control access to admin features based on permissions

## Database Schema

The RBAC system uses four new tables:

### 1. `roles` Table
Stores role definitions.
- `id` - UUID primary key
- `name` - Unique role name (e.g., "Super Admin", "Content Manager")
- `description` - Role description
- `is_system` - Boolean flag for system roles (cannot be deleted)
- `created_at`, `updated_at` - Timestamps

### 2. `permissions` Table
Stores individual permissions.
- `id` - UUID primary key
- `name` - Unique permission name (e.g., "products.create")
- `resource` - Resource type (e.g., "products", "orders")
- `action` - Action type (e.g., "create", "read", "update", "delete")
- `description` - Permission description
- `created_at` - Timestamp

### 3. `role_permissions` Table
Many-to-many relationship between roles and permissions.
- `id` - UUID primary key
- `role_id` - Foreign key to roles
- `permission_id` - Foreign key to permissions
- `created_at` - Timestamp

### 4. `user_roles` Table
Many-to-many relationship between users and roles.
- `id` - UUID primary key
- `user_id` - Foreign key to users
- `role_id` - Foreign key to roles
- `assigned_by` - User who assigned the role
- `assigned_at` - Timestamp

## Default Roles and Permissions

### Super Admin
- **Full system access** - Manage admin accounts, all modules, settings, user management
- Top-level platform owner
- All permissions including:
  - Product management (create, read, update, delete)
  - Category management (create, read, update, delete)
  - Order management (create, read, update, delete, financials)
  - Inventory management (read, adjust, reports)
  - User management (create, read, update, delete, manage admins, manage staff)
  - Role management (create, read, update, delete, assign, edit staff)
  - Content management (read, update, publish)
  - Settings management (read, update, manage)
  - Reporting (view, financial, advanced)
- Cannot be deleted (system role)

### Admin
- **Full system access** - All modules, settings, user and staff management
- Business owner level
- All permissions except:
  - `users.manage_admins` - Cannot manage admin accounts
- Can manage:
  - Products, categories, orders, inventory
  - Staff accounts
  - Content and settings
  - All reports including financials
- Cannot be deleted (system role)

### Staff
- **Order management, inventory management, limited reporting**
- No financials, no user role management, no content publishing
- Limited permissions:
  - `products.read` - View products
  - `categories.read` - View categories
  - `orders.read` - View orders
  - `orders.update` - Update order status
  - `inventory.read` - View inventory logs
  - `inventory.adjust` - Adjust inventory levels
  - `inventory.reports` - View inventory reports
  - `reports.view` - View basic reports
- Cannot access:
  - Financial reports
  - User management
  - Role management
  - Content publishing
  - System settings
- Cannot be deleted (system role)

## Permission Naming Convention

Permissions follow the pattern: `{resource}.{action}`

### Resources
- `products` - Product management
- `categories` - Category management
- `orders` - Order management
- `inventory` - Inventory management
- `users` - User management
- `roles` - Role management
- `content` - CMS content
- `settings` - System settings
- `reports` - Reporting and analytics

### Actions
- `create` - Create new items
- `read` - View items
- `update` - Edit items
- `delete` - Delete items
- `assign` - Assign roles to users
- `adjust` - Adjust inventory levels
- `financials` - Access financial data
- `reports` - View reports
- `publish` - Publish content
- `manage` - Full management access

### Examples
- `products.create` - Create new products
- `orders.update` - Update order status
- `orders.financials` - Access financial reports
- `roles.assign` - Assign roles to users
- `inventory.adjust` - Adjust inventory levels
- `users.manage_staff` - Manage staff accounts
- `content.publish` - Publish content

## API Endpoints

### Roles

**List all roles:**
```
GET /api/v1/roles
```

**Get single role:**
```
GET /api/v1/roles/{id}
```

**Create role:**
```
POST /api/v1/roles
Body: {
  name: "Content Manager",
  description: "Manages website content",
  created_by: "user_id"
}
```

**Update role:**
```
PUT /api/v1/roles/{id}
Body: {
  name: "Content Manager",
  description: "Updated description",
  updated_by: "user_id"
}
```

**Delete role:**
```
DELETE /api/v1/roles/{id}
Body: {
  deleted_by: "user_id"
}
```

### Role Permissions

**Get role permissions:**
```
GET /api/v1/roles/{id}/permissions
```

**Assign permission to role:**
```
POST /api/v1/roles/{id}/permissions
Body: {
  permission_id: "permission_uuid",
  assigned_by: "user_id"
}
```

**Remove permission from role:**
```
DELETE /api/v1/roles/{id}/permissions
Body: {
  permission_id: "permission_uuid",
  removed_by: "user_id"
}
```

### Permissions

**List all permissions:**
```
GET /api/v1/permissions
```

**Create permission:**
```
POST /api/v1/permissions
Body: {
  name: "reports.view",
  resource: "reports",
  action: "view",
  description: "View reports",
  created_by: "user_id"
}
```

### User Roles

**Get user roles:**
```
GET /api/v1/users/{id}/roles
```

**Assign role to user:**
```
POST /api/v1/users/{id}/roles
Body: {
  role_id: "role_uuid",
  assigned_by: "user_id"
}
```

**Remove role from user:**
```
DELETE /api/v1/users/{id}/roles
Body: {
  role_id: "role_uuid",
  removed_by: "user_id"
}
```

## React Hooks

### `useRoles()`
```typescript
const { roles, loading, error, refetch } = useRoles();
```

### `useRole(id)`
```typescript
const { role, loading, error } = useRole(roleId);
```

### `useRoleMutations()`
```typescript
const { createRole, updateRole, deleteRole, loading, error } = useRoleMutations();

// Create role
await createRole({ name: 'Manager', description: '...' }, userId);

// Update role
await updateRole(roleId, { description: 'Updated' }, userId);

// Delete role
await deleteRole(roleId, userId);
```

### `usePermissions()`
```typescript
const { permissions, loading, error } = usePermissions();
```

### `useRolePermissions(roleId)`
```typescript
const { permissions, loading, error, assignPermission, removePermission, refetch } = useRolePermissions(roleId);

// Assign permission
await assignPermission(permissionId, userId);

// Remove permission
await removePermission(permissionId, userId);
```

### `useUserRoles(userId)`
```typescript
const { roles, loading, error, assignRole, removeRole, refetch } = useUserRoles(userId);

// Assign role
await assignRole(roleId, userId);

// Remove role
await removeRole(roleId, userId);
```

## Permission Checking

### Database Functions

```typescript
import { checkPermission, requirePermission, checkAnyPermission, checkAllPermissions } from '@hazel/database';

// Check single permission
const hasPermission = await checkPermission(userId, 'products.create');

// Require permission (throws error if not granted)
await requirePermission(userId, 'products.create');

// Check if user has ANY of the permissions
const hasAny = await checkAnyPermission(userId, ['products.create', 'products.update']);

// Check if user has ALL of the permissions
const hasAll = await checkAllPermissions(userId, ['products.read', 'categories.read']);
```

## Setup Instructions

### 1. Run the RBAC Schema

Execute the SQL file in your Supabase SQL editor:

```sql
-- Run the contents of packages/database/schema-rbac.sql
```

This will:
- Create the four RBAC tables
- Insert default roles (Super Admin, Admin, Staff)
- Insert default permissions
- Assign default permissions to roles
- Migrate existing users to the new role system
- Set up RLS policies

### 2. Verify the Setup

Check that the tables were created:

```sql
SELECT * FROM public.roles;
SELECT * FROM public.permissions;
SELECT * FROM public.role_permissions;
SELECT * FROM public.user_roles;
```

### 3. Test the API

```bash
# Get all roles
curl http://localhost:3001/api/v1/roles

# Get all permissions
curl http://localhost:3001/api/v1/permissions

# Create a new role
curl -X POST http://localhost:3001/api/v1/roles \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Role","description":"Test","created_by":"user_id"}'
```

## Best Practices

### 1. Role Design
- Create roles based on job functions, not individual users
- Use descriptive role names (e.g., "Content Manager" vs "Level 2")
- Document the purpose of each custom role

### 2. Permission Assignment
- Follow the principle of least privilege
- Grant only the permissions needed for the role
- Regularly review and audit role permissions

### 3. User Role Assignment
- Assign roles based on responsibilities
- Users can have multiple roles if needed
- Log all role assignments for audit purposes

### 4. System Roles
- Never delete system roles (Super Admin, Admin, Staff)
- You can modify their permissions if needed
- Create custom roles instead of modifying system roles

### 5. Permission Naming
- Follow the `{resource}.{action}` convention
- Use lowercase with dots as separators
- Be descriptive and consistent

## Security Considerations

1. **RLS Policies** - All RBAC tables have Row Level Security enabled
2. **Audit Logging** - All role/permission changes are logged to audit_logs table
3. **System Role Protection** - System roles cannot be deleted
4. **Permission Checks** - Always verify permissions before allowing actions
5. **Service Role Key** - Use service role key for privileged operations in admin app

## Troubleshooting

### Users not getting permissions
- Check that the user has roles assigned in `user_roles` table
- Verify that the roles have permissions in `role_permissions` table
- Ensure the user is active in the `users` table

### Permission checks failing
- Verify the permission name matches exactly (case-sensitive)
- Check that the permission exists in the `permissions` table
- Ensure the user's role has the permission assigned

### Cannot delete a role
- Check if the role is marked as `is_system = true`
- System roles cannot be deleted for safety reasons
- Create a custom role instead

### API returning 403 errors
- Verify the user has the required permission
- Check that the user is active (`is_active = true`)
- Ensure the user has at least one role assigned

## Migration from Legacy System

The schema includes automatic migration from the legacy `role` column in the `users` table:

```sql
-- This is automatically run in schema-rbac.sql
INSERT INTO public.user_roles (user_id, role_id, assigned_by, assigned_at)
SELECT u.id, r.id, u.id, u.created_at
FROM public.users u, public.roles r
WHERE u.role = r.name
ON CONFLICT (user_id, role_id) DO NOTHING;
```

After migration, you can:
1. Keep the legacy `role` column for backward compatibility
2. Or remove it and rely entirely on the new RBAC system
