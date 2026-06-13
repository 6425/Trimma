"use server";

import { createSupabaseAdminClient } from "@/config/supabase-admin";
import { adminDbFailure, isAdminDbSuccess, withAdminDb } from "@/lib/with-admin-db";
import { requirePlatformAdminFromCookies } from "@/lib/server-admin-auth";

export type AgentRequestRow = {
  id: string;
  created_at: string;
  updated_at: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  province: string;
  district: string;
  city: string | null;
  address: string;
  nic_no: string;
  account_details: string;
  status: "pending" | "reviewing" | "approved" | "rejected" | "provisioned";
  admin_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  assigned_regional_head_id: string | null;
  commission_rate: number;
  sub_agent_split_percent: number | null;
  provisioned_user_email: string | null;
  provisioned_at: string | null;
  regional_head?: { id: string; user_email: string } | null;
};

export async function fetchAdminAgentRequests() {
  const result = await withAdminDb(async (supabase) => {
    const { data, error } = await supabase
      .from("agent_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return { requests: (data || []) as AgentRequestRow[] };
  });

  if (!isAdminDbSuccess(result)) return adminDbFailure(result);
  return { success: true as const, requests: result.data.requests };
}

export async function updateAdminAgentRequest(input: {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string | null;
  province: string;
  district: string;
  city?: string | null;
  address: string;
  nic_no: string;
  account_details: string;
  status: AgentRequestRow["status"];
  admin_notes?: string | null;
  assigned_regional_head_id?: string | null;
  commission_rate: number;
  sub_agent_split_percent?: number | null;
}) {
  const result = await withAdminDb(async (supabase) => {
    const auth = await requirePlatformAdminFromCookies();
    if ("error" in auth) throw new Error(auth.error);

    const payload: Record<string, unknown> = {
      first_name: input.first_name.trim(),
      last_name: input.last_name.trim(),
      email: input.email.trim().toLowerCase(),
      phone: input.phone?.trim() || null,
      province: input.province.trim(),
      district: input.district.trim(),
      city: input.city?.trim() || null,
      address: input.address.trim(),
      nic_no: input.nic_no.trim(),
      account_details: input.account_details.trim(),
      status: input.status,
      admin_notes: input.admin_notes?.trim() || null,
      assigned_regional_head_id: input.assigned_regional_head_id || null,
      commission_rate: input.commission_rate,
      sub_agent_split_percent: input.sub_agent_split_percent ?? 50,
      reviewed_by: auth.email,
      reviewed_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("agent_requests").update(payload).eq("id", input.id);
    if (error) throw new Error(error.message);
  });

  if (!isAdminDbSuccess(result)) return adminDbFailure(result);
  return { success: true as const };
}

export async function provisionAgentFromRequest(input: {
  id: string;
  password: string;
  assigned_regional_head_id: string;
  commission_rate: number;
  sub_agent_split_percent?: number;
}) {
  const auth = await requirePlatformAdminFromCookies();
  if ("error" in auth) {
    return { success: false as const, error: auth.error };
  }

  const supabase = createSupabaseAdminClient();

  const { data: request, error: fetchError } = await supabase
    .from("agent_requests")
    .select("*")
    .eq("id", input.id)
    .maybeSingle();

  if (fetchError || !request) {
    return { success: false as const, error: fetchError?.message || "Application not found." };
  }

  if (request.status === "provisioned") {
    return { success: false as const, error: "This application was already provisioned." };
  }

  if (!input.assigned_regional_head_id) {
    return { success: false as const, error: "Assign a regional head before provisioning." };
  }

  if (!input.password || input.password.length < 6) {
    return { success: false as const, error: "Temporary password must be at least 6 characters." };
  }

  const email = String(request.email).trim().toLowerCase();
  const fullName = `${request.first_name} ${request.last_name}`.trim();

  const { data: headAgent, error: headError } = await supabase
    .from("agents")
    .select("id, agent_tier")
    .eq("id", input.assigned_regional_head_id)
    .maybeSingle();

  if (headError || !headAgent?.id || headAgent.agent_tier !== "regional_head") {
    return { success: false as const, error: "Selected regional head is invalid." };
  }

  const { data: existingUser } = await supabase
    .from("users")
    .select("email")
    .eq("email", email)
    .maybeSingle();

  if (existingUser?.email) {
    return {
      success: false as const,
      error: "A user with this email already exists. Link manually from User Mgmt.",
    };
  }

  const { data: createdUser, error: createError } = await supabase.auth.admin.createUser({
    email,
    password: input.password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      role: "agent",
      global_role: "agent",
      territory: request.district,
    },
  });

  if (createError || !createdUser.user) {
    return { success: false as const, error: createError?.message || "Failed to create auth user." };
  }

  const { error: profileError } = await supabase.from("users").upsert(
    {
      email,
      full_name: fullName,
      phone: request.phone,
      global_role: "agent",
    },
    { onConflict: "email" }
  );

  if (profileError) {
    return { success: false as const, error: "User created but profile sync failed: " + profileError.message };
  }

  const agentPayload = {
    user_id: createdUser.user.id,
    user_email: email,
    status: "active",
    commission_rate: input.commission_rate,
    territory: request.district,
    agent_tier: "field_agent",
    reports_to_agent_id: input.assigned_regional_head_id,
    sub_agent_split_percent: input.sub_agent_split_percent ?? 50,
  };

  const { data: existingAgent } = await supabase
    .from("agents")
    .select("id")
    .eq("user_email", email)
    .maybeSingle();

  if (existingAgent?.id) {
    const { error: agentUpdateError } = await supabase
      .from("agents")
      .update(agentPayload)
      .eq("id", existingAgent.id);
    if (agentUpdateError) {
      return { success: false as const, error: "Agent record update failed: " + agentUpdateError.message };
    }
  } else {
    const { error: agentInsertError } = await supabase.from("agents").insert(agentPayload);
    if (agentInsertError) {
      return { success: false as const, error: "Agent record failed: " + agentInsertError.message };
    }
  }

  await supabase.from("user_roles").upsert(
    { user_id: createdUser.user.id, role: "agent" },
    { onConflict: "user_id,role" }
  );

  const { error: requestUpdateError } = await supabase
    .from("agent_requests")
    .update({
      status: "provisioned",
      provisioned_user_email: email,
      provisioned_at: new Date().toISOString(),
      assigned_regional_head_id: input.assigned_regional_head_id,
      commission_rate: input.commission_rate,
      sub_agent_split_percent: input.sub_agent_split_percent ?? 50,
      reviewed_by: auth.email,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", input.id);

  if (requestUpdateError) {
    return {
      success: false as const,
      error: "Agent created but application status update failed: " + requestUpdateError.message,
    };
  }

  return {
    success: true as const,
    email,
    message: `Agent account created for ${email}.`,
  };
}
