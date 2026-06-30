// Check current state of triggers and functions in DB
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://lcyphawmyidtefxkmioh.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxjeXBoYXdteWlkdGVmeGttaW9oIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTA3MTMwOCwiZXhwIjoyMDk2NjQ3MzA4fQ.-92Jlqbvbew9V0a1Tn6AoNrrODo40LV5fAEeEzK3lxY';

async function checkTriggers() {
  console.log('=== Checking Current Trigger Functions ===\n');

  // Use raw SQL via PostgREST rpc
  // We'll query pg_proc to get the function source code
  const queries = [
    // Get trigger function bodies
    `SELECT routine_name, routine_definition 
     FROM information_schema.routines 
     WHERE routine_schema = 'public' 
     AND routine_name IN ('handle_new_user', 'handle_new_customer')`,

    // Get triggers on auth.users
    `SELECT trigger_name, event_manipulation, action_statement 
     FROM information_schema.triggers 
     WHERE event_object_schema = 'auth' AND event_object_table = 'users'`,

    // Check for any constraint that might fail  
    `SELECT conname, contype, pg_get_constraintdef(c.oid) 
     FROM pg_constraint c
     JOIN pg_class t ON c.conrelid = t.oid
     JOIN pg_namespace n ON t.relnamespace = n.oid
     WHERE n.nspname = 'public' AND t.relname = 'customers'`,
  ];

  for (const sql of queries) {
    console.log('Query:', sql.substring(0, 80) + '...\n');
    try {
      const resp = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
        },
        body: JSON.stringify({ sql })
      });
      const text = await resp.text();
      console.log('Status:', resp.status);
      console.log('Result:', text, '\n');
    } catch (e) {
      console.log('Error:', e.message, '\n');
    }
  }

  // Alternative: use pg_get_functiondef via a known RPC
  console.log('--- Trying pg_get_functiondef via direct query ---');
  const noRealtime = { global: { fetch: globalThis.fetch }, realtime: { transport: () => {} } };
  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    ...noRealtime,
    auth: { autoRefreshToken: false, persistSession: false }
  });

  // Check customers table constraints 
  const { data: constraints, error: constraintErr } = await adminClient
    .from('customers')
    .select('*')
    .limit(0);

  console.log('customers table accessible:', !constraintErr);
  if (constraintErr) console.log('Error:', constraintErr.message);

  // Try inserting a test customer directly
  console.log('\n--- Testing direct insert into customers table ---');
  const { data: insertData, error: insertErr } = await adminClient
    .from('customers')
    .insert({
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Test Customer Direct',
      email: `direct_test_${Date.now()}@deleteme.com`,
      phone: '0700000000',
      address: { street: '', city: '', postal_code: '' }
    })
    .select();

  if (insertErr) {
    console.log('Direct insert FAILED:', insertErr.message);
    console.log('Full error:', JSON.stringify(insertErr, null, 2));
  } else {
    console.log('Direct insert SUCCEEDED:', insertData?.[0]?.id);
    // Clean up
    if (insertData?.[0]?.id) {
      await adminClient.from('customers').delete().eq('id', insertData[0].id);
      console.log('Cleaned up test row.');
    }
  }
}

checkTriggers().catch(console.error);
