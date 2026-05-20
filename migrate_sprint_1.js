import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcDir = path.join(__dirname, 'src');
const pagesDir = path.join(srcDir, 'pages');
const appDir = path.join(srcDir, 'app');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function migrateFile(oldPath, newPath) {
  if (!fs.existsSync(oldPath)) return;
  
  let content = fs.readFileSync(oldPath, 'utf8');
  
  // 1. Add "use client" if it has hooks
  if (content.includes('useState') || content.includes('useParams') || content.includes('useEffect')) {
    content = '"use client";\n\n' + content;
  }
  
  // 2. Replace react-router-dom imports
  content = content.replace(/import\s+\{([^}]*)\}\s+from\s+["']react-router-dom["'];/g, (match, imports) => {
    let nextImports = [];
    let nextNavigationImports = [];
    
    if (imports.includes('Link')) {
      nextImports.push('import Link from "next/link";');
    }
    
    if (imports.includes('useParams') || imports.includes('useRouter') || imports.includes('useSearchParams')) {
      const navs = [];
      if (imports.includes('useParams')) navs.push('useParams');
      if (imports.includes('useNavigate')) navs.push('useRouter');
      if (navs.length > 0) {
        nextNavigationImports.push(`import { ${navs.join(', ')} } from "next/navigation";`);
      }
    }
    
    return [...nextImports, ...nextNavigationImports].join('\n');
  });
  
  // Replace useNavigate() with useRouter()
  content = content.replace(/useNavigate\(\)/g, 'useRouter()');
  
  // 3. Replace <Link to="..."> with <Link href="...">
  content = content.replace(/<Link\s+([^>]*)to=/g, '<Link $1href=');
  
  // 4. Fix relative imports that might break (e.g. ../components -> @/components)
  content = content.replace(/from\s+["']\.\.\/components/g, 'from "@/components');
  content = content.replace(/from\s+["']\.\.\/layouts/g, 'from "@/layouts');
  
  ensureDir(path.dirname(newPath));
  fs.writeFileSync(newPath, content);
  console.log(`Migrated to: ${newPath}`);
}

// Sprint 1 Routes
migrateFile(path.join(pagesDir, 'SalonPage.tsx'), path.join(appDir, 'salons', '[slug]', 'page.tsx'));
migrateFile(path.join(pagesDir, 'CategoryPage.tsx'), path.join(appDir, 'search', 'page.tsx'));
migrateFile(path.join(pagesDir, 'CategoryPage.tsx'), path.join(appDir, 'category', '[slug]', 'page.tsx'));
migrateFile(path.join(pagesDir, 'ProvincesPage.tsx'), path.join(appDir, 'provinces', 'page.tsx'));
migrateFile(path.join(pagesDir, 'ProvinceDetailPage.tsx'), path.join(appDir, 'province', '[id]', 'page.tsx'));
migrateFile(path.join(pagesDir, 'DistrictDetailPage.tsx'), path.join(appDir, 'district', '[id]', 'page.tsx'));
migrateFile(path.join(pagesDir, 'CityDetailPage.tsx'), path.join(appDir, 'city', '[id]', 'page.tsx'));

console.log("Sprint 1 Route Migration Complete.");
