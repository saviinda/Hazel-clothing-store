// Read trigger function source by querying pg_proc through PostgREST views
const SUPABASE_URL = 'https://lcyphawmyidtefxkmioh.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxjeXBoYXdteWlkdGVmeGttaW9oIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTA3MTMwOCwiZXhwIjoyMDk2NjQ3MzA4fQ.-92Jlqbvbew9V0a1Tn6AoNrrODo40LV5fAEeEzK3lxY';

const HEADERS = {
  'Content-Type': 'application/json',
  'apikey': SERVICE_ROLE_KEY,
  'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
  'Accept': 'application/json'
};

async function readFunctions() {
  console.log('=== Reading Trigger Function Source Code ===\n');

  // Query information_schema.routines via PostgREST
  const resp = await fetch(
    `${SUPABASE_URL}/rest/v1/information_schema.routines?select=routine_name,routine_definition&routine_schema=eq.public&routine_name=in.(handle_new_user,handle_new_customer)`,
    { headers: HEADERS }
  );
  const text = await resp.text();
  console.log('Status:', resp.status);
  console.log('Routines:', text);

  // Also try reading triggers
  console.log('\n--- Triggers on auth.users ---');
  const trigResp = await fetch(
    `${SUPABASE_URL}/rest/v1/information_schema.triggers?select=trigger_name,event_object_table,action_statement&event_object_schema=eq.auth`,
    { headers: HEADERS }
  );
  const trigText = await trigResp.text();
  console.log('Status:', trigResp.status);
  console.log('Triggers:', trigText);

  // Check customers table columns/constraints
  console.log('\n--- Customers table columns ---');
  const colResp = await fetch(
    `${SUPABASE_URL}/rest/v1/information_schema.columns?select=column_name,data_type,is_nullable,column_default&table_schema=eq.public&table_name=eq.customers`,
    { headers: HEADERS }
  );
  const colText = await colResp.text();
  console.log('Status:', colResp.status);
  console.log('Columns:', colText);
}

readFunctions().catch(console.error);
