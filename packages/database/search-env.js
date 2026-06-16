const fs = require('fs');
const path = require('path');

function searchFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('password') || content.includes('postgres:') || content.includes('postgresql:')) {
      console.log(`Found match in: ${filePath}`);
      const lines = content.split('\n');
      lines.forEach((line, index) => {
        if (line.includes('password') || line.includes('postgres:') || line.includes('postgresql:')) {
          console.log(`  L${index + 1}: ${line.trim()}`);
        }
      });
    }
  } catch (err) {
    // Ignore errors
  }
}

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (file === 'node_modules' || file === '.git' || file === '.next') continue;
    
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walk(fullPath);
    } else {
      if (file.endsWith('.env') || file.endsWith('.local') || file.endsWith('.json') || file.endsWith('.js') || file.endsWith('.ts') || file.endsWith('.yml') || file.endsWith('.toml')) {
        searchFile(fullPath);
      }
    }
  }
}

console.log('Searching workspace for database credentials...');
walk('G:\\Codezela\\Hazel clothing store');
