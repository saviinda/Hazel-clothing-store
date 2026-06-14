# Default Admin Accounts Setup

This document provides the default admin accounts and setup instructions for the Hazel Clothing Store admin panel.

## Default Accounts

### Super Admin Account
- **Email:** `superadmin@hazel.com`
- **Password:** `SuperAdmin123!`
- **Role:** Super Admin
- **Access:** Full system access (manage admin accounts, all modules, settings, user management)

### Admin Account
- **Email:** `admin@hazel.com`
- **Password:** `Admin123!`
- **Role:** Admin
- **Access:** Full system access (all modules, settings, user and staff management)

### Staff Account
- **Email:** `staff@hazel.com`
- **Password:** `Staff123!`
- **Role:** Staff
- **Access:** Order management, inventory management, limited reporting

## Setup Instructions

### Step 1: Create Users in Supabase Auth

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **Users**
3. Click **Add user** for each account:

**Super Admin:**
- Email: `superadmin@hazel.com`
- Password: `SuperAdmin123!`
- Auto-confirm user: Yes
- Set user role: `authenticated`

**Admin:**
- Email: `admin@hazel.com`
- Password: `Admin123!`
- Auto-confirm user: Yes
- Set user role: `authenticated`

**Staff:**
- Email: `staff@hazel.com`
- Password: `Staff123!`
- Auto-confirm user: Yes
- Set user role: `authenticated`

### Step 2: Get User IDs

After creating users in Supabase Auth, copy the UUID of each user from the Users table.

### Step 3: Update the SQL Script

Open `packages/database/default-accounts.sql` and replace the placeholder UUIDs with the actual Supabase Auth user IDs:

```sql
-- Replace these with actual Supabase Auth user IDs
'00000000-0000-0000-0000-000000000001' -- Super Admin
'00000000-0000-0000-0000-000000000002' -- Admin
'00000000-0000-0000-0000-000000000003' -- Staff
```

### Step 4: Run the SQL Script

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Run the contents of `packages/database/default-accounts.sql`

This will:
- Create entries in the `users` table
- Assign the appropriate roles to each user
- Set up the role-permission relationships

### Step 5: Verify Setup

Run this query to verify the accounts were created correctly:

```sql
SELECT 
    u.id,
    u.name,
    u.email,
    u.role,
    u.is_active,
    r.name as assigned_role
FROM public.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
LEFT JOIN public.roles r ON ur.role_id = r.id
ORDER BY u.email;
```

## Role Permissions Summary

### Super Admin
- ✅ All permissions
- ✅ Can manage admin accounts
- ✅ Can edit all roles
- ✅ Full system access

### Admin
- ✅ All modules access
- ✅ Can manage staff accounts
- ✅ Can edit staff role permissions
- ❌ Cannot manage admin accounts

### Staff
- ✅ View products and categories
- ✅ View and update orders
- ✅ View and adjust inventory
- ✅ View basic reports
- ❌ No financial access
- ❌ No user management
- ❌ No role management
- ❌ No content publishing

## Security Notes

⚠️ **Important Security Reminders:**

1. **Change default passwords** after first login
2. **Enable 2FA** for all admin accounts
3. **Use strong passwords** (minimum 12 characters, mixed case, numbers, symbols)
4. **Limit admin access** to only necessary personnel
5. **Regularly review** user access and permissions
6. **Monitor audit logs** for suspicious activity

## Testing the Accounts

### Test Super Admin
1. Login at `http://localhost:3001/login` with superadmin credentials
2. Navigate to Settings → Users
3. Verify you can create/edit/delete admin accounts
4. Navigate to Settings → Roles
5. Verify you can edit all role permissions

### Test Admin
1. Login at `http://localhost:3001/login` with admin credentials
2. Navigate to Settings → Users
3. Verify you can create/edit staff accounts
4. Verify you CANNOT manage admin accounts
5. Navigate to Settings → Roles
6. Verify you can edit Staff role permissions
7. Verify you CANNOT edit Super Admin or Admin roles

### Test Staff
1. Login at `http://localhost:3001/login` with staff credentials
2. Navigate to Orders
3. Verify you can view and update orders
4. Navigate to Inventory
5. Verify you can view and adjust inventory
6. Navigate to Reports
7. Verify you can view basic reports
8. Verify you CANNOT access financial reports
9. Navigate to Settings → Users
10. Verify you CANNOT access user management
11. Navigate to Settings → Roles
12. Verify you CANNOT access role management

## Troubleshooting

### Login fails
- Verify user exists in Supabase Auth
- Check user is confirmed (auto-confirm enabled)
- Verify user exists in `public.users` table
- Check user has role assigned in `public.user_roles` table

### Permissions not working
- Verify role permissions are set in `public.role_permissions` table
- Check user has role assigned in `public.user_roles` table
- Verify permission checking logic is implemented in API routes

### Cannot access certain features
- Check the specific permission for that feature
- Verify the user's role has that permission assigned
- Review the permission matrix in RBAC_GUIDE.md
