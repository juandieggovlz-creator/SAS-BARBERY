const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(fullPath));
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      results.push(fullPath);
    }
  });
  return results;
}

const dir = path.join(__dirname, '..', 'app', 'api', 'superadmin');
const files = walk(dir);

let modifiedCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Replace checks like: session.role !== 'SUPER_ADMIN'
  // when not already checking ROOT_PLATFORM_OWNER
  content = content.replace(
    /session\.role\s*!==\s*'SUPER_ADMIN'(?!\s*&&\s*session\.role\s*!==\s*'ROOT_PLATFORM_OWNER')/g,
    "(session.role !== 'SUPER_ADMIN' && session.role !== 'ROOT_PLATFORM_OWNER')"
  );

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated: ${path.relative(path.join(__dirname, '..'), file)}`);
    modifiedCount++;
  }
});

console.log(`\nTotal files updated: ${modifiedCount}`);

