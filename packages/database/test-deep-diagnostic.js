// Deep diagnostic - test with verbose fetch error catching
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://lcyphawmyidtefxkmioh.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxjeXBoYXdteWlkdGVmeGttaW9oIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTA3MTMwOCwiZXhwIjoyMDk2NjQ3MzA4fQ.-92Jlqbvbew9V0a1Tn6AoNrrODo40LV5fAEeEzK3lxY';

async function deepDiagnostic() {
  console.log('=== Deep Diagnostic: createUser via raw fetch ===\n');

  const testEmail = `diag_test_${Date.now()}@deleteme.com`;

  // 1. Try via raw fetch to get the actual error body
  console.log('1. Raw fetch to GoTrue /admin/users endpoint...');
  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({
        email: testEmail,
        password: 'TestPass123!',
        email_confirm: false,
        user_metadata: {
          role: 'customer',
          name: 'Diag Test User',
          phone: '0700000000'
        }
      })
    });

    const responseText = await response.text();
    console.log('   HTTP Status:', response.status, response.statusText);
    console.log('   Response body:', responseText);

    if (response.ok) {
      const userData = JSON.parse(responseText);
      console.log('\n   ✅ User created! ID:', userData.id);

      // Clean up
      console.log('\n2. Cleaning up test user...');
      const deleteResponse = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userData.id}`, {
        method: 'DELETE',
        headers: {
          'apikey': SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
        }
      });
      console.log('   Delete status:', deleteResponse.status);
    }
  } catch (e) {
    console.log('   ❌ Fetch error:', e.message);
  }

  // 2. Check Supabase project health
  console.log('\n3. Checking Supabase project health...');
  try {
    const healthResponse = await fetch(`${SUPABASE_URL}/auth/v1/health`, {
      headers: {
        'apikey': SERVICE_ROLE_KEY
      }
    });
    const healthText = await healthResponse.text();
    console.log('   GoTrue health status:', healthResponse.status);
    console.log('   Health body:', healthText);
  } catch (e) {
    console.log('   ❌ Health check error:', e.message);
  }

  // 3. Check if triggers exist now
  console.log('\n4. Verifying triggers in DB...');
  const noRealtime = { global: { fetch: globalThis.fetch }, realtime: { transport: () => {} } };
  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    ...noRealtime,
    auth: { autoRefreshToken: false, persistSession: false }
  });

  // Use raw SQL via rpc if available
  const { data: triggerData, error: triggerError } = await adminClient
    .from('pg_trigger')
    .select('tgname')
    .limit(10);

  if (triggerError) {
    console.log('   Cannot query pg_trigger directly (expected):', triggerError.message);
  } else {
    console.log('   Triggers:', triggerData);
  }

  console.log('\n=== Diagnostic Complete ===');
}

deepDiagnostic().catch(console.error);
