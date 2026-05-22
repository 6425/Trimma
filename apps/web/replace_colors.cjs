const fs = require('fs');
const path = require('path');

function replaceInDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      replaceInDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts') || fullPath.endsWith('.css')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      const original = content;
      
      // Replace arbitrary hex classes with semantic theme classes
      content = content.replace(/\[#D81E5B\]/g, 'brand');
      content = content.replace(/\[#BF1A50\]/g, 'brand-hover');
      content = content.replace(/\[#c2144d\]/g, 'brand-hover');
      
      // Also replace standalone hex codes (e.g. in svg stroke="#D81E5B")
      content = content.replace(/"#D81E5B"/g, '"var(--color-brand)"');
      content = content.replace(/'#D81E5B'/g, "'var(--color-brand)'");
      
      if (content !== original) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log('Updated:', fullPath);
      }
    }
  }
}

replaceInDir('c:/Users/thusi/Downloads/Trimma/apps/web/src');
