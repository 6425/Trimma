import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { linkInvitedOwnerAccount } from "@/lib/link-owner-account";

function getAccessToken(request: Request): string | null {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7).trim();
  }
  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader.match(/(?:^|;\s*)sb-access-token=([^;]+)/);
  return match?.[1] || null;
}

export async function POST(request: Request) {
  try {
    const token = getAccessToken(request);
    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !anonKey) {
      return NextResponse.json({ error: "Auth not configured" }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user?.email) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const result = await linkInvitedOwnerAccount(
      data.user.id,
      data.user.email,
      data.user.user_metadata?.full_name || data.user.user_metadata?.name,
      data.user.user_metadata?.avatar_url || data.user.user_metadata?.picture
    );

    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to link owner account";
    console.error("link-owner failed:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
