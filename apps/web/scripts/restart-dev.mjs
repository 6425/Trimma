import { execSync, spawnSync } from "child_process";
import { platform } from "os";
import { rmSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const WEB_DEV_PORT = 3000;
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function killPort(port) {
  if (platform() === "win32") {
    try {
      const output = execSync(`netstat -ano | findstr :${port}`, { encoding: "utf8" });
      const pids = new Set();
      for (const line of output.split("\n")) {
        if (!line.includes("LISTENING")) continue;
        const pid = line.trim().split(/\s+/).pop();
        if (pid && /^\d+$/.test(pid)) pids.add(pid);
      }
      for (const pid of pids) {
        execSync(`taskkill /PID ${pid} /F`, { stdio: "ignore" });
        console.log(`Stopped process on port ${port} (PID ${pid})`);
      }
    } catch {
      /* port already free */
    }
    return;
  }

  try {
    execSync(`lsof -ti :${port} | xargs kill -9`, { stdio: "ignore" });
    console.log(`Stopped process on port ${port}`);
  } catch {
    /* port already free */
  }
}

killPort(WEB_DEV_PORT);

const nextDir = resolve(root, ".next");
const nextCacheDir = resolve(nextDir, "cache");

function removeDir(target) {
  if (!existsSync(target)) return;
  try {
    rmSync(target, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 });
  } catch (error) {
    if (platform() === "win32") {
      spawnSync(
        "powershell",
        ["-NoProfile", "-Command", `Remove-Item -LiteralPath '${target.replace(/'/g, "''")}' -Recurse -Force -ErrorAction SilentlyContinue`],
        { stdio: "inherit" }
      );
    } else {
      throw error;
    }
  }
}

removeDir(nextDir);
if (existsSync(nextCacheDir)) {
  console.log("Cleared .next/cache");
}
console.log("Cleared .next cache");

console.log(`Starting Trimma web dev on http://localhost:${WEB_DEV_PORT} ...\n`);

const result = spawnSync("npx", ["next", "dev", "-p", String(WEB_DEV_PORT), "--turbo"], {
  cwd: root,
  stdio: "inherit",
  shell: true,
});

process.exit(result.status ?? 1);
