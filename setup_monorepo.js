import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = __dirname;

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function moveFileOrDir(src, dest) {
  if (fs.existsSync(src)) {
    fs.renameSync(src, dest);
    console.log(`Moved: ${path.basename(src)} -> ${dest}`);
  }
}

console.log("=========================================");
console.log("Initializing Trimma Monorepo Architecture");
console.log("=========================================\n");

// 1. Create Monorepo Folders
const folders = [
  'apps/web', 'apps/admin', 'apps/salon', 'apps/mobile',
  'packages/ui/components', 'packages/config', 'packages/types', 'packages/utils', 'packages/db',
  'services/api-gateway', 'services/auth-service', 'services/salon-service', 'services/booking-service',
  'infrastructure', 'tools', 'docs', 'scripts'
];

folders.forEach(f => ensureDir(path.join(rootDir, f)));
console.log("✅ Created Monorepo Directory Skeleton");

// 2. Generate Root Files
const rootPackageJson = {
  name: "trimma-monorepo",
  private: true,
  workspaces: [
    "apps/*",
    "packages/*",
    "services/*"
  ],
  scripts: {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "clean": "turbo run clean"
  },
  devDependencies: {
    "turbo": "latest"
  }
};
fs.writeFileSync(path.join(rootDir, 'package.json.monorepo'), JSON.stringify(rootPackageJson, null, 2));

const turboJson = {
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "lint": {},
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
};
fs.writeFileSync(path.join(rootDir, 'turbo.json'), JSON.stringify(turboJson, null, 2));

const tsconfigBase = {
  "compilerOptions": {
    "target": "es2022",
    "module": "esnext",
    "lib": ["es2022", "dom", "dom.iterable"],
    "declaration": true,
    "sourceMap": true,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "bundler"
  }
};
fs.writeFileSync(path.join(rootDir, 'tsconfig.base.json'), JSON.stringify(tsconfigBase, null, 2));
console.log("✅ Generated turbo.json & Root Configurations");

// 3. Extract Web App (Move existing Next.js logic to apps/web)
console.log("\n📦 Extracting current Next.js App to apps/web...");
const webAppDir = path.join(rootDir, 'apps', 'web');

// Files to move to apps/web
const toMove = [
  'src', 'public', 'next.config.js', 'postcss.config.js', 'tailwind.config.ts', 'components.json',
  'tsconfig.json', 'package.json', 'vite.config.ts', '.env'
];

toMove.forEach(item => {
  const srcPath = path.join(rootDir, item);
  const destPath = path.join(webAppDir, item);
  moveFileOrDir(srcPath, destPath);
});

// Rename the temporary root package.json to the actual one
fs.renameSync(path.join(rootDir, 'package.json.monorepo'), path.join(rootDir, 'package.json'));

console.log("\n🎉 Monorepo Transformation Complete!");
console.log("Your current application is now safely located inside apps/web/");
