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
  
  if (content.includes('useState') || content.includes('useParams') || content.includes('useEffect') || content.includes('useNavigate')) {
    content = '"use client";\n\n' + content;
  }
  
  content = content.replace(/import\s+\{([^}]*)\}\s+from\s+["']react-router-dom["'];/g, (match, imports) => {
    let nextImports = [];
    let nextNavigationImports = [];
    
    if (imports.includes('Link')) {
      nextImports.push('import Link from "next/link";');
    }
    
    if (imports.includes('useParams') || imports.includes('useNavigate') || imports.includes('useSearchParams') || imports.includes('useLocation')) {
      const navs = [];
      if (imports.includes('useParams')) navs.push('useParams');
      if (imports.includes('useNavigate')) navs.push('useRouter');
      if (imports.includes('useSearchParams')) navs.push('useSearchParams');
      if (imports.includes('useLocation')) navs.push('usePathname');
      if (navs.length > 0) {
        nextNavigationImports.push(`import { ${navs.join(', ')} } from "next/navigation";`);
      }
    }
    
    return [...nextImports, ...nextNavigationImports].join('\n');
  });
  
  content = content.replace(/const\s+(\w+)\s*=\s*useNavigate\(\)/g, 'const $1 = useRouter()');
  content = content.replace(/<Link\s+([^>]*)to=/g, '<Link $1href=');
  content = content.replace(/from\s+["']\.\.\/components/g, 'from "@/components');
  content = content.replace(/from\s+["']\.\.\/layouts/g, 'from "@/layouts');
  
  ensureDir(path.dirname(newPath));
  fs.writeFileSync(newPath, content);
  console.log(`Migrated to: ${newPath}`);
}

// Sprint 2 Routes
migrateFile(path.join(pagesDir, 'LoginPage.tsx'), path.join(appDir, 'login', 'page.tsx'));
migrateFile(path.join(pagesDir, 'SignupPage.tsx'), path.join(appDir, 'signup', 'page.tsx'));
migrateFile(path.join(pagesDir, 'OnboardingPage.tsx'), path.join(appDir, 'onboarding', 'page.tsx'));
migrateFile(path.join(pagesDir, 'AuthCallback.tsx'), path.join(appDir, 'auth', 'callback', 'page.tsx'));

console.log("Sprint 2 Authentication Route Migration Complete.");
