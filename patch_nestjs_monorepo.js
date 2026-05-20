import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const gatewayDir = path.join(__dirname, 'services', 'api-gateway');
const pkgPath = path.join(gatewayDir, 'package.json');

if (fs.existsSync(pkgPath)) {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  
  // Update name for Turborepo routing
  pkg.name = "@trimma/api-gateway";
  
  // Inject Shared Monorepo dependencies
  pkg.dependencies = pkg.dependencies || {};
  pkg.dependencies["@trimma/db"] = "workspace:*";
  pkg.dependencies["@trimma/types"] = "workspace:*";
  
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
  console.log("✅ Patched services/api-gateway/package.json for Monorepo compatibility.");
} else {
  console.error("❌ NestJS package.json not found. Did the CLI fail?");
}
