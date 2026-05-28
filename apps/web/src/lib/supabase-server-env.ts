function cleanEnvValue(raw: string | undefined): string | undefined {
  if (!raw) return undefined;

  let value = raw.replace(/\r/g, "").trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1).trim();
  }

  return value || undefined;
}

function readFirstEnv(...names: string[]): string | undefined {
  for (const name of names) {
    const value = cleanEnvValue(process.env[name]);
    if (value) return value;
  }
  return undefined;
}

export function getSupabaseServerEnv(): {
  url: string;
  serviceRoleKey: string;
  anonKey?: string;
} {
  const url = readFirstEnv(
    "NEXT_PUBLIC_SUPABASE_URL",
    "SUPABASE_URL",
    "VITE_SUPABASE_URL"
  );
  const serviceRoleKey = readFirstEnv(
    "SUPABASE_SERVICE_ROLE_KEY",
    "NEXT_SUPABASE_SERVICE_ROLE_KEY",
    "SUPABASE_SERVICE_KEY"
  );
  const anonKey = readFirstEnv(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_ANON_KEY",
    "VITE_SUPABASE_ANON_KEY"
  );

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Supabase server credentials are missing. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  return { url, serviceRoleKey, anonKey };
}
