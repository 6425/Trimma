import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcDir = path.join(__dirname, 'src');
const pagesDir = path.join(srcDir, 'pages');
const layoutsDir = path.join(srcDir, 'layouts');
const appDir = path.join(srcDir, 'app');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Function to migrate standard pages
function migratePage(oldPath, newPath) {
  if (!fs.existsSync(oldPath)) {
    console.warn(`File not found: ${oldPath}`);
    return;
  }
  
  let content = fs.readFileSync(oldPath, 'utf8');
  
  if (content.includes('useState') || content.includes('useParams') || content.includes('useEffect') || content.includes('useNavigate') || content.includes('useSearchParams')) {
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
  content = content.replace(/from\s+["']\.\.\/\.\.\/components/g, 'from "@/components');
  content = content.replace(/from\s+["']\.\.\/\.\.\/\.\.\/components/g, 'from "@/components');
  
  ensureDir(path.dirname(newPath));
  fs.writeFileSync(newPath, content);
  console.log(`Migrated Page to: ${newPath}`);
}

// Function to migrate layouts (replacing Outlet with children)
function migrateLayout(oldPath, newPath) {
  if (!fs.existsSync(oldPath)) return;
  
  let content = fs.readFileSync(oldPath, 'utf8');
  content = '"use client";\n\n' + content;
  
  // Replace Outlet with children
  content = content.replace(/import\s+\{([^}]*)Outlet([^}]*)\}\s+from\s+["']react-router-dom["'];/, 'import {$1$2} from "react-router-dom";');
  content = content.replace(/import \{\} from "react-router-dom";\n/, '');
  
  // Add children prop
  content = content.replace(/export default function (\w+)\(\)\s*\{/, 'export default function $1({ children }: { children: React.ReactNode }) {');
  
  // Replace <Outlet />
  content = content.replace(/<Outlet\s*\/>/g, '{children}');
  
  // Common router replacements
  content = content.replace(/import\s+\{([^}]*)\}\s+from\s+["']react-router-dom["'];/g, (match, imports) => {
    let nextImports = [];
    let nextNavigationImports = [];
    if (imports.includes('Link')) nextImports.push('import Link from "next/link";');
    if (imports.includes('useNavigate') || imports.includes('useLocation')) {
      const navs = [];
      if (imports.includes('useNavigate')) navs.push('useRouter');
      if (imports.includes('useLocation')) navs.push('usePathname');
      if (navs.length > 0) nextNavigationImports.push(`import { ${navs.join(', ')} } from "next/navigation";`);
    }
    return [...nextImports, ...nextNavigationImports].join('\n');
  });
  content = content.replace(/const\s+(\w+)\s*=\s*useNavigate\(\)/g, 'const $1 = useRouter()');
  content = content.replace(/<Link\s+([^>]*)to=/g, '<Link $1href=');
  
  ensureDir(path.dirname(newPath));
  fs.writeFileSync(newPath, content);
  console.log(`Migrated Layout to: ${newPath}`);
}

// 1. Layouts
migrateLayout(path.join(layoutsDir, 'DashboardLayout.tsx'), path.join(appDir, 'dashboard', 'layout.tsx'));
migrateLayout(path.join(layoutsDir, 'CustomerDashboardLayout.tsx'), path.join(appDir, 'customer', 'layout.tsx'));
migrateLayout(path.join(layoutsDir, 'AgentLayout.tsx'), path.join(appDir, 'agent', 'layout.tsx'));
migrateLayout(path.join(layoutsDir, 'AdminLayout.tsx'), path.join(appDir, 'admin', 'layout.tsx'));

// 2. Dashboards (Salon)
migratePage(path.join(pagesDir, 'dashboard', 'Dashboard.tsx'), path.join(appDir, 'dashboard', 'page.tsx'));
migratePage(path.join(pagesDir, 'dashboard', 'DashboardBookings.tsx'), path.join(appDir, 'dashboard', 'bookings', 'page.tsx'));
migratePage(path.join(pagesDir, 'dashboard', 'DashboardServices.tsx'), path.join(appDir, 'dashboard', 'services', 'page.tsx'));
migratePage(path.join(pagesDir, 'dashboard', 'DashboardStaff.tsx'), path.join(appDir, 'dashboard', 'staff', 'page.tsx'));

// 3. Customer & Agent
migratePage(path.join(pagesDir, 'customer', 'CustomerDashboard.tsx'), path.join(appDir, 'customer', 'page.tsx'));
migratePage(path.join(pagesDir, 'agent', 'AgentDashboard.tsx'), path.join(appDir, 'agent', 'page.tsx'));

// 4. Admin Top Level
migratePage(path.join(pagesDir, 'admin', 'AdminDashboard.tsx'), path.join(appDir, 'admin', 'page.tsx'));
migratePage(path.join(pagesDir, 'admin', 'AdminLogin.tsx'), path.join(appDir, 'admin', 'login', 'page.tsx'));
migratePage(path.join(pagesDir, 'admin', 'AdminAgents.tsx'), path.join(appDir, 'admin', 'agents', 'page.tsx'));
migratePage(path.join(pagesDir, 'admin', 'AdminBookings.tsx'), path.join(appDir, 'admin', 'bookings', 'page.tsx'));
migratePage(path.join(pagesDir, 'admin', 'AdminPayments.tsx'), path.join(appDir, 'admin', 'payments', 'page.tsx'));
migratePage(path.join(pagesDir, 'admin', 'AdminSeo.tsx'), path.join(appDir, 'admin', 'seo', 'page.tsx'));
migratePage(path.join(pagesDir, 'admin', 'AdminSettings.tsx'), path.join(appDir, 'admin', 'settings', 'page.tsx'));

// 5. Admin Nested (Users)
migratePage(path.join(pagesDir, 'admin', 'users', 'AdminUserDashboard.tsx'), path.join(appDir, 'admin', 'users', 'analytics', 'page.tsx'));
migratePage(path.join(pagesDir, 'admin', 'users', 'AdminUserList.tsx'), path.join(appDir, 'admin', 'users', 'all', 'page.tsx'));
migratePage(path.join(pagesDir, 'admin', 'users', 'AdminUserCreate.tsx'), path.join(appDir, 'admin', 'users', 'create', 'page.tsx'));
migratePage(path.join(pagesDir, 'admin', 'users', 'AdminAgentManagement.tsx'), path.join(appDir, 'admin', 'users', 'agents', 'page.tsx'));
migratePage(path.join(pagesDir, 'admin', 'users', 'AdminUserRoles.tsx'), path.join(appDir, 'admin', 'users', 'roles', 'page.tsx'));

// 6. Admin Nested (Territories & Marketplace)
migratePage(path.join(pagesDir, 'admin', 'territories', 'ProvinceManagement.tsx'), path.join(appDir, 'admin', 'territories', 'provinces', 'page.tsx'));
migratePage(path.join(pagesDir, 'admin', 'territories', 'DistrictManagement.tsx'), path.join(appDir, 'admin', 'territories', 'districts', 'page.tsx'));
migratePage(path.join(pagesDir, 'admin', 'territories', 'CityManagement.tsx'), path.join(appDir, 'admin', 'territories', 'cities', 'page.tsx'));
migratePage(path.join(pagesDir, 'admin', 'marketplace', 'CategoryManagement.tsx'), path.join(appDir, 'admin', 'categories', 'page.tsx'));
migratePage(path.join(pagesDir, 'admin', 'marketplace', 'GlobalServiceManagement.tsx'), path.join(appDir, 'admin', 'global-services', 'page.tsx'));
migratePage(path.join(pagesDir, 'admin', 'marketplace', 'SubscriptionPlanManagement.tsx'), path.join(appDir, 'admin', 'subscriptions', 'page.tsx'));

// 7. General Admin Routes
migratePage(path.join(pagesDir, 'salons', 'Salons.tsx'), path.join(appDir, 'admin', 'salons', 'page.tsx'));
migratePage(path.join(pagesDir, 'leads', 'Leads.tsx'), path.join(appDir, 'admin', 'leads', 'page.tsx'));

console.log("\nSprint 3 Dashboards Migration Complete!");
