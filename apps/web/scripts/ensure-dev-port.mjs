import { execSync } from "child_process";
import { platform } from "os";

const WEB_DEV_PORT = 3000;

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

const requestedPort = Number(process.env.PORT);
if (requestedPort && requestedPort !== WEB_DEV_PORT) {
  console.error(
    `\nTrimma web dev must run on port ${WEB_DEV_PORT} only (got PORT=${requestedPort}).\n` +
      `Unset PORT or use: npm run dev\n`
  );
  process.exit(1);
}

if (isPortListening(WEB_DEV_PORT)) {
  console.error(
    `\nPort ${WEB_DEV_PORT} is already in use — only one Trimma web dev server is allowed.\n` +
      `Stop the existing server first, or run: npm run dev:restart\n`
  );
  process.exit(1);
}
