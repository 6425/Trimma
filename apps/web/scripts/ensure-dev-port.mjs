import { execSync, spawnSync } from "child_process";
import { platform } from "os";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const WEB_DEV_PORT = 3000;
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function isPortListening(port) {
  if (platform() === "win32") {
    try {
      const output = execSync(`netstat -ano | findstr :${port}`, { encoding: "utf8" });
      return output.split("\n").some((line) => line.includes("LISTENING"));
    } catch {
      return false;
    }
  }

  try {
    execSync(`lsof -i :${port} -sTCP:LISTEN`, { encoding: "utf8", stdio: ["pipe", "pipe", "ignore"] });
    return true;
  } catch {
    return false;
  }
}

async function fetchStatus(path) {
  try {
    const response = await fetch(`http://127.0.0.1:${WEB_DEV_PORT}${path}`, {
      signal: AbortSignal.timeout(6000),
      cache: "no-store",
    });
    return response.status;
  } catch {
    return 0;
  }
}

async function isDevServerHealthy() {
  const checks = ["/api/health", "/", "/pricing"];
  const results = await Promise.all(checks.map((path) => fetchStatus(path)));
  return results.every((status) => status >= 200 && status < 500);
}

function restartDevCleanly() {
  console.warn("\nDev server looks unhealthy. Restarting with a clean .next cache...\n");
  const result = spawnSync("node", ["scripts/restart-dev.mjs"], {
    cwd: root,
    stdio: "inherit",
    shell: true,
  });
  process.exit(result.status ?? 1);
}

const requestedPort = Number(process.env.PORT);
if (requestedPort && requestedPort !== WEB_DEV_PORT) {
  console.error(
    `\nTrimma web dev must run on port ${WEB_DEV_PORT} only (got PORT=${requestedPort}).\n` +
      `Unset PORT or use: npm run dev\n`
  );
  process.exit(1);
}

if (isPortListening(WEB_DEV_PORT)) {
  const healthy = await isDevServerHealthy();

  if (!healthy) {
    restartDevCleanly();
  }

  console.error(
    `\nPort ${WEB_DEV_PORT} is already in use — only one Trimma web dev server is allowed.\n` +
      `If pages show Internal Server Error, run: npm run dev:restart\n`
  );
  process.exit(1);
}
