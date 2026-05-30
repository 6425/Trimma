"use server";

import { createSupabaseAdminClient } from "@/config/supabase-admin";
import { getSalonAccessTokenFromCookies } from "@/lib/server-salon-auth";

async function getAuthedUser() {
  const accessToken = await getSalonAccessTokenFromCookies();
  if (!accessToken) return null;
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase.auth.getUser(accessToken);
  return data.user || null;
}

export async function getAgentProfile() {
  const user = await getAuthedUser();
  if (!user) return { success: false as const, error: "Not authenticated" };

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("users")
    .select(`
      full_name,
      email,
      phone,
      avatar_url
    `)
    .eq("id", user.id)
    .single();

  if (error) {
    return { success: false as const, error: error.message };
  }

  // Get agent's territory
  let territory = "Unassigned";
  const { data: agentData } = await supabase
    .from("agents")
    .select("id")
    .eq("user_email", data.email)
    .maybeSingle();

  if (agentData?.id) {
    const { data: territoryData } = await supabase
      .from("agent_territories")
      .select("territories ( name )")
      .eq("agent_id", agentData.id);

    if (territoryData && territoryData.length > 0) {
      territory = territoryData
        .map((t: any) => t.territories?.name)
        .filter(Boolean)
        .join(" · ") || "Unassigned";
    }
  }

  return {
    success: true as const,
    profile: {
      fullName: data.full_name || "",
      email: data.email || "",
      phone: data.phone || "",
      avatarUrl: data.avatar_url || "",
      territory,
    }
  };
}

export async function updateAgentProfile(input: { fullName: string; phone: string }) {
  const user = await getAuthedUser();
  if (!user) return { success: false as const, error: "Not authenticated" };

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("users")
    .update({
      full_name: input.fullName,
      phone: input.phone,
    })
    .eq("id", user.id);

  if (error) {
    return { success: false as const, error: error.message };
  }

  return { success: true as const };
}

export async function uploadAgentAvatar(formData: FormData) {
  const file = formData.get("file") as File;
  if (!file) {
    return { success: false as const, error: "No file provided" };
  }

  const user = await getAuthedUser();
  if (!user) return { success: false as const, error: "Not authenticated" };

  const fileExt = file.name.split(".").pop();
  const fileName = `agent-avatars/${user.id}-${Date.now()}.${fileExt}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const supabase = createSupabaseAdminClient();
  const { error: uploadError } = await supabase.storage
    .from("public-assets")
    .upload(fileName, buffer, {
      contentType: file.type,
      upsert: true,
      cacheControl: "3600"
    });

  if (uploadError) {
    return { success: false as const, error: uploadError.message };
  }

  const { data: publicUrlData } = supabase.storage
    .from("public-assets")
    .getPublicUrl(fileName);

  const avatarUrl = publicUrlData.publicUrl;

  const { error: updateError } = await supabase
    .from("users")
    .update({ avatar_url: avatarUrl })
    .eq("id", user.id);

  if (updateError) {
    return { success: false as const, error: updateError.message };
  }

  return { success: true as const, avatarUrl };
}
