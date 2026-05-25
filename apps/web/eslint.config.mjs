import { defineConfig } from "eslint/config";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig([{
    extends: [...nextCoreWebVitals],
    rules: {
      // Phase 1 complete — function hoisting fixed across src
      "react-hooks/immutability": "error",
      // Phase 2 complete — deferred effect callbacks for fetch/sync-on-mount patterns
      "react-hooks/set-state-in-effect": "error",
      "react-hooks/purity": "off",
      "react/no-unescaped-entities": "warn",
      "@next/next/no-img-element": "warn",
    },
}]);