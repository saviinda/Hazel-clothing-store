const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read env variables from apps/admin/.env.local
const envPath = path.join(__dirname, '../../apps/admin/.env.local');
if (!fs.existsSync(envPath)) {
  console.error('Error: apps/admin/.env.local not found.');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.substring(1, value.length - 1);
    } else if (value.startsWith("'") && value.endsWith("'")) {
      value = value.substring(1, value.length - 1);
    }
    env[key] = value.trim();
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not found in env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  realtime: {
    transport: class {}
  }
});

async function fixRoles() {
  console.log('Connecting to Supabase at:', supabaseUrl);
  
  // 1. Fetch users from auth.users
  const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
  if (authError) {
    console.error('Error listing auth users:', authError.message);
    process.exit(1);
  }

  console.log(`Found ${users.length} user(s) in Supabase Auth.`);

  for (const user of users) {
    console.log(`- User email: "${user.email}" (ID: ${user.id})`);
    let role = 'Staff';
    if (user.email === 'superadmin@hazel.lk') {
      role = 'Super Admin';
    } else if (user.email === 'admin@hazel.com') {
      role = 'Admin';
    } else if (user.email === 'staff@hazel.com') {
      role = 'Staff';
    } else {
      continue; // Skip other users
    }

    console.log(`Setting role of ${user.email} (${user.id}) to: ${role}...`);

    // Upsert into public.users
    const { error: upsertError } = await supabase
      .from('users')
      .upsert({
        id: user.id,
        name: user.user_metadata?.name || (role === 'Super Admin' ? 'Super Admin' : 'Admin'),
        email: user.email,
        role: role,
        is_active: true,
        created_at: user.created_at || new Date().toISOString()
      }, { onConflict: 'id' });

    if (upsertError) {
      console.error(`Failed to update role for ${user.email} in public.users:`, upsertError.message);
    } else {
      console.log(`Successfully updated ${user.email} in public.users to ${role}.`);
    }

    // Now upsert into public.user_roles and roles if they exist
    try {
      const { data: roleData } = await supabase
        .from('roles')
        .select('id')
        .eq('name', role)
        .single();

      if (roleData) {
        const { error: userRoleError } = await supabase
          .from('user_roles')
          .upsert({
            user_id: user.id,
            role_id: roleData.id,
            assigned_by: user.id,
            assigned_at: new Date().toISOString()
          }, { onConflict: 'user_id,role_id' });

        if (userRoleError) {
          console.log(`Note: Failed to update user_roles for ${user.email} (might not use RBAC schema):`, userRoleError.message);
        } else {
          console.log(`Successfully updated user_roles for ${user.email}.`);
        }
      }
    } catch (e) {
      console.log('RBAC roles/user_roles tables not set up or queried.');
    }
  }

  console.log('Fix roles script finished.');
}

fixRoles();
