import { createClient } from "@supabase/supabase-js";

export type VerifiedAccessToken = {
  accessToken: string;
  userId: string;
  email: string | null;
};

export async function verifyAccessToken(
  accessToken: string | null | undefined
): Promise<VerifiedAccessToken | null> {
  if (!accessToken) return null;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) return null;

  const supabase = createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(accessToken);

  if (error || !user?.id) return null;

  return {
    accessToken,
    userId: user.id,
    email: user.email ?? null,
  };
}
