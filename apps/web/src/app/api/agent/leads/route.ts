import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/config/supabase-admin";
import { APP_BASE_URL } from "@/lib/email/config";
import { notifyAgentLeadAssigned } from "@/lib/agent-lead-notifications";
import { normalizeEmail } from "@/lib/normalize-email";
import {
  isRequestAuthError,
  requireAgentFromRequest,
} from "@/lib/server-request-auth";

function slugify(value: string) {
  const base = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return base || `manual-${Date.now()}`;
}

export async function POST(request: Request) {
  try {
    const auth = await requireAgentFromRequest(request);
    if (isRequestAuthError(auth)) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const name = String(body.name || "").trim();

    if (!name) {
      return NextResponse.json({ error: "Salon name is required." }, { status: 400 });
    }

    const assignToEmail =
      auth.role === "admin"
        ? normalizeEmail(String(body.agentEmail || body.assignTo || auth.email || ""))
        : normalizeEmail(auth.email || "");

    if (!assignToEmail) {
      return NextResponse.json({ error: "Agent email is required." }, { status: 400 });
    }

    const supabaseAdmin = createSupabaseAdminClient();
    const slug = `${slugify(name)}-${Date.now()}`;
    const payload = {
      place_id: `manual_${Date.now()}`,
      name,
      slug,
      owner_email: `draft-${slug}@trimma.io`,
      assign_to: assignToEmail,
      onboarding_status: "ASSIGNED_TO_AGENT",
      activation_status: "INACTIVE",
      source_type: "MANUAL",
      phone: body.phone || null,
      address: body.address || null,
      category: body.category || null,
      owner_gmail: body.owner_gmail || null,
      agent_notes: body.agent_notes || null,
      website: body.website || null,
      summary: body.summary || null,
    };

    const { data, error } = await supabaseAdmin
      .from("salons")
      .insert(payload)
      .select("id, name")
      .single();
    if (error) throw error;

    await supabaseAdmin.from("onboarding_logs").insert({
      salon_id: data.id,
      actor_email: auth.email || assignToEmail,
      action: "MANUAL_LEAD_CREATED",
      notes: `Agent created manual lead "${data.name}".`,
    });

    void notifyAgentLeadAssigned(supabaseAdmin, {
      salonId: data.id,
      salonName: data.name,
      salonAddress: String(body.address || "TBD"),
      assignToEmail,
      onboardingStatus: "ASSIGNED_TO_AGENT",
      dashboardLink: `${APP_BASE_URL}/agent/leads?open=${data.id}`,
    }).catch((err) => console.error("Agent lead assignment notification failed:", err));

    return NextResponse.json({ success: true, salon: data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create lead.";
    console.error("Agent manual lead create failed:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
