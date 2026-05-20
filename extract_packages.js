import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = __dirname;
const packagesDir = path.join(rootDir, 'packages');
const webAppDir = path.join(rootDir, 'apps', 'web');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

console.log("=========================================");
console.log("Extracting Shared Core Packages");
console.log("=========================================\n");

// 1. Setup @trimma/config
console.log("📦 Setting up @trimma/config...");
ensureDir(path.join(packagesDir, 'config'));
writeJson(path.join(packagesDir, 'config', 'package.json'), {
  name: "@trimma/config",
  version: "0.0.0",
  private: true,
  main: "index.js",
  dependencies: {}
});

// 2. Setup @trimma/types
console.log("📦 Setting up @trimma/types...");
ensureDir(path.join(packagesDir, 'types', 'src'));
writeJson(path.join(packagesDir, 'types', 'package.json'), {
  name: "@trimma/types",
  version: "0.0.0",
  private: true,
  main: "./src/index.ts",
  types: "./src/index.ts",
  dependencies: {}
});
fs.writeFileSync(path.join(packagesDir, 'types', 'src', 'index.ts'), `// Global TypeScript Interfaces\nexport interface User { id: string; name: string; }\n`);

// 3. Setup @trimma/db
console.log("📦 Setting up @trimma/db...");
ensureDir(path.join(packagesDir, 'db', 'src'));
writeJson(path.join(packagesDir, 'db', 'package.json'), {
  name: "@trimma/db",
  version: "0.0.0",
  private: true,
  main: "./src/index.ts",
  types: "./src/index.ts",
  dependencies: {
    "@supabase/supabase-js": "^2.0.0"
  }
});
fs.writeFileSync(path.join(packagesDir, 'db', 'src', 'index.ts'), `// Database Client Export\nexport const db = "Supabase Client Placeholder";\n`);

// 4. Setup @trimma/ui
console.log("📦 Setting up @trimma/ui...");
ensureDir(path.join(packagesDir, 'ui', 'src', 'components'));
writeJson(path.join(packagesDir, 'ui', 'package.json'), {
  name: "@trimma/ui",
  version: "0.0.0",
  private: true,
  main: "./src/index.ts",
  types: "./src/index.ts",
  dependencies: {
    "react": "^19.0.0",
    "lucide-react": "^0.546.0"
  }
});

// Create index.ts for UI package
fs.writeFileSync(path.join(packagesDir, 'ui', 'src', 'index.ts'), `export * from './components/Button';\n`);

// Create a sample Button component to prove it works
fs.writeFileSync(path.join(packagesDir, 'ui', 'src', 'components', 'Button.tsx'), `
import * as React from "react"
export const Button = React.forwardRef(({ className, ...props }, ref) => {
  return <button ref={ref} className={\`inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background \${className}\`} {...props} />
})
Button.displayName = "Button"
`);

// 5. Update apps/web/package.json to use these shared packages
console.log("🔗 Linking packages to apps/web...");
const webPackageJsonPath = path.join(webAppDir, 'package.json');
if (fs.existsSync(webPackageJsonPath)) {
  const webPkg = JSON.parse(fs.readFileSync(webPackageJsonPath, 'utf8'));
  webPkg.dependencies = webPkg.dependencies || {};
  webPkg.dependencies["@trimma/ui"] = "workspace:*";
  webPkg.dependencies["@trimma/db"] = "workspace:*";
  webPkg.dependencies["@trimma/types"] = "workspace:*";
  writeJson(webPackageJsonPath, webPkg);
}

console.log("\n🎉 Shared Packages Extraction Complete!");
console.log("Run 'npm install' from the root to link the workspaces.");
