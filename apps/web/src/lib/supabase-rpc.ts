import { getSupabaseServerEnv } from "@/lib/supabase-server-env";

export async function postSupabaseRpc(
  name: string,
  args: Record<string, unknown> = {}
): Promise<unknown> {
  const { url, serviceRoleKey } = getSupabaseServerEnv();
  const response = await fetch(`${url}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "Content-Profile": "public",
    },
    body: JSON.stringify(args),
    cache: "no-store",
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`${name} failed (${response.status}): ${text.slice(0, 400)}`);
  }
  if (!text) return null;
  return JSON.parse(text) as unknown;
}
