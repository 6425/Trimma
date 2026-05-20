import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WEB_DIR = path.join(__dirname, 'src');
const APP_DIR = path.join(WEB_DIR, 'app');

console.log("🚀 Starting Trimma Migration Automation Script...");

// 1. DELETE CONFLICTING [id] FOLDERS (Fixes Next.js Build Error)
const conflictingFolders = [
  path.join(APP_DIR, 'city', '[id]'),
  path.join(APP_DIR, 'district', '[id]'),
  path.join(APP_DIR, 'province', '[id]'),
  path.join(APP_DIR, 'salons', '[id]')
];

console.log("\n🗑️  Cleaning up conflicting Next.js dynamic routes...");
conflictingFolders.forEach(folder => {
  if (fs.existsSync(folder)) {
    fs.rmSync(folder, { recursive: true, force: true });
    console.log(`   ✅ Deleted: ${folder}`);
  }
});

// 2. PHASE 5: FINAL CLEANUP (Removing legacy Vite files)
const legacyPaths = [
  path.join(WEB_DIR, 'pages_backup'),
  path.join(WEB_DIR, 'layouts_backup'),
  path.join(__dirname, 'vite.config.ts')
];

console.log("\n🧹 Executing Phase 5: Legacy Vite Cleanup...");
legacyPaths.forEach(legacyPath => {
  if (fs.existsSync(legacyPath)) {
    fs.rmSync(legacyPath, { recursive: true, force: true });
    console.log(`   ✅ Deleted legacy path: ${legacyPath}`);
  } else {
    console.log(`   ℹ️ Already removed: ${legacyPath}`);
  }
});

console.log("\n🎉 Automation Complete! Next.js routing conflicts are resolved and legacy files are cleaned up.");
console.log("👉 Please restart your Next.js server now!");
