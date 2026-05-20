const fs = require('fs');
const path = require('path');

const projectRoot = 'c:\\Users\\thusi\\Downloads\\Trimma';
const pagesBackupDir = path.join(projectRoot, 'apps/web/src/pages_backup');
const appDir = path.join(projectRoot, 'apps/web/src/app');
const componentsDir = path.join(projectRoot, 'apps/web/src/components');

function replaceReactRouter(content) {
  let newContent = content;
  // Replace imports
  newContent = newContent.replace(/import\s+\{([^}]*)\}\s+from\s+["']react-router-dom["'];/g, (match, importsStr) => {
    let nextImports = [];
    let nextLinkImport = '';
    
    if (importsStr.includes('Link')) {
      nextLinkImport = 'import Link from "next/link";\n';
    }
    
    const otherImports = importsStr.split(',').map(s => s.trim()).filter(s => s && s !== 'Link');
    if (otherImports.length > 0) {
      // Map useNavigate -> useRouter, useLocation -> usePathname
      const mappedImports = otherImports.map(imp => {
        if (imp === 'useNavigate') return 'useRouter';
        if (imp === 'useLocation') return 'usePathname';
        return imp;
      });
      nextImports.push(`import { ${mappedImports.join(', ')} } from "next/navigation";`);
    }
    
    return nextLinkImport + nextImports.join('\n');
  });

  // Replace usage
  newContent = newContent.replace(/const\s+navigate\s*=\s*useNavigate\(\);/g, 'const router = useRouter();');
  newContent = newContent.replace(/navigate\(/g, 'router.push(');

  // Ensure "use client" is at the top if it uses hooks
  if ((newContent.includes('useState') || newContent.includes('useEffect') || newContent.includes('useParams') || newContent.includes('useRouter')) && !newContent.includes('"use client"')) {
    newContent = '"use client";\n\n' + newContent;
  }

  return newContent;
}

const filesToMigrate = [
  { src: 'CategoryPage.tsx', dest: 'category/[slug]/page.tsx' },
  { src: 'ProvincesPage.tsx', dest: 'provinces/page.tsx' },
  { src: 'ProvinceDetailPage.tsx', dest: 'province/[slug]/page.tsx' },
  { src: 'CityDetailPage.tsx', dest: 'city/[slug]/page.tsx' },
  { src: 'DistrictDetailPage.tsx', dest: 'district/[slug]/page.tsx' }
];

// Migrate pages
filesToMigrate.forEach(({ src, dest }) => {
  const srcPath = path.join(pagesBackupDir, src);
  const destPath = path.join(appDir, dest);
  
  if (fs.existsSync(srcPath)) {
    let content = fs.readFileSync(srcPath, 'utf8');
    content = replaceReactRouter(content);
    
    // Fix components relative paths inside these pages since they moved deeper
    // Most were in pages_backup (1 level deep from src), now they are in app/foo/[slug] (3 levels deep from src)
    // Actually, just replace "@/components" since tsconfig supports it, but if they use "../components", replace it.
    content = content.replace(/\.\.\/components/g, '../../../components');
    
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    fs.writeFileSync(destPath, content);
    console.log(`Migrated ${src} to ${dest}`);
  } else {
    console.warn(`File not found: ${srcPath}`);
  }
});

// Fix Components
const componentsToFix = [
  'marketplace/SalonCard.tsx',
  'marketplace/DistrictDetailTemplate.tsx'
];

componentsToFix.forEach(comp => {
  const compPath = path.join(componentsDir, comp);
  if (fs.existsSync(compPath)) {
    let content = fs.readFileSync(compPath, 'utf8');
    content = replaceReactRouter(content);
    fs.writeFileSync(compPath, content);
    console.log(`Fixed component ${comp}`);
  }
});
