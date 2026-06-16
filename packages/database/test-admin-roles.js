global.WebSocket = class {};
const fs = require('fs');
const path = require('path');

// Set env variables so packages/database can read them
const envPath = path.join(__dirname, '../../apps/admin/.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    process.env[match[1]] = (match[2] || '').replace(/['"]/g, '').trim();
  }
});

const { getRoles } = require('./src/index.ts');

async function test() {
  try {
    console.log('Fetching roles via getRoles()...');
    const roles = await getRoles();
    console.log('Success! Found roles:', roles);
  } catch (error) {
    console.error('Error fetching roles:', error);
  }
}

test();
