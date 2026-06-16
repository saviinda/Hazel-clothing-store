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
const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !anonKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY not found in env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, anonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  realtime: {
    transport: class {}
  }
});

async function testRoles() {
  console.log('Testing roles table query using anon client...');
  const { data, error } = await supabase
    .from('roles')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error returned by Supabase:', error.message, error.details, error.hint);
  } else {
    console.log(`Success! Found ${data.length} roles:`, data);
  }
}

testRoles();
