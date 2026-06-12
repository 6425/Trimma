"use server";

import { createSupabaseAdminClient } from "@/config/supabase-admin";
import { requireAgentFromCookies } from "@/lib/server-agent-auth";
import {
  buildAgentTerritories,
  findAgentRecord,
  formatAgentTerritoryLabel,
} from "@/lib/agent-territory-resolve";
import { findAgentHierarchyRecord, isRegionalHeadAgent } from "@/lib/agent-hierarchy";

export async function getAgentProfile() {
  const auth = await requireAgentFromCookies();
  if ("error" in auth) return { success: false as const, error: auth.error };
  const user = { email: auth.email, id: auth.userId };

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("users")
    .select(`
      full_name,
      email,
      phone,
      avatar_url
    `)
    .eq("email", user.email)
    .single();

  if (error) {
    return { success: false as const, error: error.message };
  }

  const agentRow = await findAgentRecord(supabase, data.email, auth.userId);
  const hierarchyRow = await findAgentHierarchyRecord(supabase, data.email, auth.userId);
  const { data: roleRow } = await supabase
    .from("users")
    .select("global_role")
    .eq("email", data.email)
    .maybeSingle();
  const isRegionalHead = isRegionalHeadAgent(hierarchyRow, roleRow?.global_role);
  const territoryList = await buildAgentTerritories(supabase, data.email, agentRow);
  const territory = formatAgentTerritoryLabel(territoryList);

  return {
    success: true as const,
    profile: {
      fullName: data.full_name || "",
      email: data.email || "",
      phone: data.phone || "",
      avatarUrl: data.avatar_url || "",
      territory,
      agentTier: isRegionalHead ? "regional_head" : "field_agent",
      isRegionalHead,
    }
  };
}

export async function updateAgentProfile(input: { fullName: string; phone: string }) {
  const auth = await requireAgentFromCookies();
  if ("error" in auth) return { success: false as const, error: auth.error };
  const user = { email: auth.email };

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("users")
    .update({
      full_name: input.fullName,
      phone: input.phone,
    })
    .eq("email", user.email);

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

  const auth = await requireAgentFromCookies();
  if ("error" in auth) return { success: false as const, error: auth.error };

  const fileExt = file.name.split(".").pop();
  const fileName = `agent-avatars/${auth.userId}-${Date.now()}.${fileExt}`;
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
    .eq("email", auth.email);

  if (updateError) {
    return { success: false as const, error: updateError.message };
  }

  return { success: true as const, avatarUrl };
}
