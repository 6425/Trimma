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

if (isPortListening(WEB_DEV_PORT)) {
  console.error(
    `\nBuild blocked: dev server is still running on port ${WEB_DEV_PORT}.\n` +
      `Running "npm run build" while "npm run dev" is active corrupts the .next cache\n` +
      `and causes Internal Server Error on every page until you restart.\n\n` +
      `Fix: stop dev (Ctrl+C) or run: npm run dev:restart\n` +
      `Then run build again in a separate terminal.\n`
  );
  process.exit(1);
}
