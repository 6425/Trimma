import fs from "fs";
import path from "path";

type FacebookEnvValues = {
  appId: string;
  appSecret: string;
  redirectUri: string;
  loginConfigId?: string;
};

function upsertEnvLine(content: string, key: string, value: string): string {
  const escaped = value.replace(/"/g, '\\"');
  const line = `${key}="${escaped}"`;
  const regex = new RegExp(`^${key}=.*$`, "m");

  if (regex.test(content)) {
    return content.replace(regex, line);
  }

  const trimmed = content.replace(/\s*$/, "");
  return `${trimmed}\n${line}\n`;
}

function syncEnvFile(filePath: string, values: FacebookEnvValues): boolean {
  if (!fs.existsSync(filePath)) return false;

  let content = fs.readFileSync(filePath, "utf8");
  content = upsertEnvLine(content, "FACEBOOK_APP_ID", values.appId);
  content = upsertEnvLine(content, "FACEBOOK_APP_SECRET", values.appSecret);
  content = upsertEnvLine(content, "FACEBOOK_REDIRECT_URI", values.redirectUri);
  content = upsertEnvLine(content, "APPID", values.appId);
  content = upsertEnvLine(content, "APP_SECRET", values.appSecret);
  if (values.loginConfigId) {
    content = upsertEnvLine(content, "FACEBOOK_LOGIN_CONFIG_ID", values.loginConfigId);
  }

  fs.writeFileSync(filePath, content, "utf8");
  return true;
}

export type SyncFacebookEnvResult = {
  synced: boolean;
  paths: string[];
  skippedReason?: string;
};

/** Best-effort local .env sync (no-op on Vercel read-only filesystem). */
export function syncFacebookCredentialsToEnvFiles(values: FacebookEnvValues): SyncFacebookEnvResult {
  const webRoot = process.cwd();
  const targets = [
    path.join(webRoot, ".env"),
    path.join(webRoot, "..", "..", ".env"),
  ];

  const syncedPaths: string[] = [];

  for (const filePath of targets) {
    try {
      if (syncEnvFile(filePath, values)) {
        syncedPaths.push(filePath);
      }
    } catch (err) {
      console.warn(`Could not sync Facebook credentials to ${filePath}:`, err);
    }
  }

  if (syncedPaths.length === 0) {
    return {
      synced: false,
      paths: [],
      skippedReason: "Local .env files are not writable (normal on Vercel). Credentials are stored in Supabase.",
    };
  }

  return { synced: true, paths: syncedPaths };
}
