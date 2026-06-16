const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '../../apps/admin/.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    env[match[1]] = (match[2] || '').replace(/['"]/g, '').trim();
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
  realtime: { transport: class {} }
});

async function inspect() {
  console.log('Fetching policies on roles and users...');
  
  // We can query pg_policies using RPC or direct supabase request if the table is exposed, 
  // but pg_catalog tables might not be exposed on Postgrest by default.
  // Let's try to query public schemas or see what happens.
  const { data: policies, error: polError } = await supabase
    .from('pg_policies')
    .select('*')
    .limit(10);
    
  if (polError) {
    console.log('Could not query pg_policies directly:', polError.message);
  } else {
    console.log('Policies:', policies);
  }
}

inspect();
