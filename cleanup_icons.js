import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function walkSync(dir, filelist = []) {
  if (!fs.existsSync(dir)) return filelist;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const dirFile = path.join(dir, file);
    if (fs.statSync(dirFile).isDirectory()) {
      if (file !== 'node_modules' && file !== '.next' && file !== '.git') {
        filelist = walkSync(dirFile, filelist);
      }
    } else {
      if (dirFile.endsWith('.tsx') || dirFile.endsWith('.ts') || dirFile.endsWith('.jsx') || dirFile.endsWith('.js')) {
        filelist.push(dirFile);
      }
    }
  }
  return filelist;
}

const files = walkSync(path.join(__dirname, 'apps', 'web', 'src'));
let totalRemoved = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  
  // Find lucide-react imports
  const importRegex = /import\s+\{([^}]+)\}\s+from\s+['"]lucide-react['"];?/g;
  let match;
  
  while ((match = importRegex.exec(content)) !== null) {
    const fullImport = match[0];
    const iconsText = match[1];
    
    // Split by comma, clean whitespace
    const icons = iconsText.split(',').map(i => i.trim()).filter(i => i);
    const usedIcons = [];
    const unusedIcons = [];
    
    // Remove the import block temporarily to check body
    const bodyContent = content.replace(fullImport, '');
    
    for (const icon of icons) {
      // Check if icon is used as a JSX component <Icon or <Icon... or icon used as variable
      // A simple regex: word boundary + icon name + word boundary
      // Need to be careful to not match just any word, but in React it's usually `<Icon`
      // We will check for the exact word boundary.
      const iconRegex = new RegExp(`\\b${icon}\\b`);
      if (iconRegex.test(bodyContent)) {
        usedIcons.push(icon);
      } else {
        unusedIcons.push(icon);
        totalRemoved++;
      }
    }
    
    if (unusedIcons.length > 0) {
      if (usedIcons.length === 0) {
        // Remove entire import
        content = content.replace(fullImport, '');
      } else {
        // Format new import with used icons
        const newImport = `import { ${usedIcons.join(', ')} } from "lucide-react";`;
        content = content.replace(fullImport, newImport);
      }
      fs.writeFileSync(file, content, 'utf8');
      console.log(`Cleaned up ${file}: Removed ${unusedIcons.join(', ')}`);
    }
  }
}

console.log(`Done! Removed ${totalRemoved} unused lucide-react icons across all files.`);
