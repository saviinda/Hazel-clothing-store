// Test Supabase connectivity for both admin and website
const { createClient } = require('@supabase/supabase-js');

// Disable WebSocket/Realtime for Node.js 20 compatibility
const noRealtime = { global: { fetch: globalThis.fetch }, realtime: { transport: () => {} } };

const SUPABASE_URL = 'https://lcyphawmyidtefxkmioh.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxjeXBoYXdteWlkdGVmeGttaW9oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwNzEzMDgsImV4cCI6MjA5NjY0NzMwOH0.8mnDtQdM3fknB1XILZMTBDgvQSI3JbJ949VoRGPmAhg';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxjeXBoYXdteWlkdGVmeGttaW9oIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTA3MTMwOCwiZXhwIjoyMDk2NjQ3MzA4fQ.-92Jlqbvbew9V0a1Tn6AoNrrODo40LV5fAEeEzK3lxY';

async function testConnection() {
  console.log('=== Supabase Connection Check ===\n');

  // 1. Test anon client (used by frontend/website)
  console.log('1. Testing ANON client (frontend/website)...');
  const anonClient = createClient(SUPABASE_URL, ANON_KEY, noRealtime);
  const { data: products, error: anonError } = await anonClient
    .from('products')
    .select('id, name')
    .limit(1);
  
  if (anonError) {
    console.log('   ❌ ANON client error:', anonError.message);
  } else {
    console.log('   ✅ ANON client connected. Sample product:', products?.[0]?.name || '(none in DB)');
  }

  // 2. Test service role client (used by API routes)
  console.log('\n2. Testing SERVICE ROLE client (API/admin)...');
  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    ...noRealtime,
    auth: { autoRefreshToken: false, persistSession: false }
  });

  // Test listing auth users
  const { data: authData, error: adminError } = await adminClient.auth.admin.listUsers({ perPage: 5 });
  if (adminError) {
    console.log('   ❌ SERVICE ROLE client error:', adminError.message);
  } else {
    console.log('   ✅ SERVICE ROLE client connected. Auth users (first 5):', authData?.users?.length);
    authData?.users?.forEach(u => console.log(`      - ${u.email} | confirmed=${!!u.email_confirmed_at}`));
  }

  // 3. Test reading from public.users table
  console.log('\n3. Testing public.users table...');
  const { data: dbUsers, error: usersError } = await adminClient
    .from('users')
    .select('id, name, email, role, is_active')
    .limit(5);
  if (usersError) {
    console.log('   ❌ public.users error:', usersError.message);
  } else {
    console.log('   ✅ public.users readable. Count:', dbUsers?.length);
    dbUsers?.forEach(u => console.log(`      - ${u.email} | ${u.role} | active=${u.is_active}`));
  }

  // 4. Test reading from public.customers table
  console.log('\n4. Testing public.customers table...');
  const { data: customers, error: customersError } = await adminClient
    .from('customers')
    .select('id, name, email')
    .limit(5);
  if (customersError) {
    console.log('   ❌ public.customers error:', customersError.message);
  } else {
    console.log('   ✅ public.customers readable. Count:', customers?.length);
    customers?.forEach(c => console.log(`      - ${c.email}`));
  }

  // 5. Test createUser (actual test with cleanup)
  console.log('\n5. Testing admin.createUser (signup simulation)...');
  const testEmail = `connectivity_test_${Date.now()}@test-delete-me.com`;
  const { data: testUser, error: createErr } = await adminClient.auth.admin.createUser({
    email: testEmail,
    password: 'TestPass123!',
    email_confirm: false,
    user_metadata: { role: 'customer', name: 'Test User', phone: '0000000000' }
  });

  if (createErr) {
    console.log('   ❌ createUser FAILED:', createErr.message, '| HTTP Status:', createErr.status);
    console.log('   Full error:', JSON.stringify(createErr, null, 2));
  } else {
    console.log('   ✅ createUser SUCCEEDED. User ID:', testUser?.user?.id);
    // Clean up
    if (testUser?.user?.id) {
      const { error: delErr } = await adminClient.auth.admin.deleteUser(testUser.user.id);
      if (delErr) {
        console.log('   ⚠️  Could not delete test user:', delErr.message);
      } else {
        console.log('   🗑️  Test user cleaned up successfully.');
      }
    }
  }

  console.log('\n=== Check Complete ===');
}

testConnection().catch(console.error);
