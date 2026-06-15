import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { APP_BASE_URL } from "@/lib/email/config";
import { notifyAgentLeadAssigned } from "@/lib/agent-lead-notifications";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
  {
    auth: { autoRefreshToken: false, persistSession: false },
  }
);

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
    const body = await request.json();
    const agentEmail = String(body.agentEmail || "").trim().toLowerCase();
    const name = String(body.name || "").trim();

    if (!agentEmail || !name) {
      return NextResponse.json({ error: "Agent email and salon name are required." }, { status: 400 });
    }

    const slug = `${slugify(name)}-${Date.now()}`;
    const payload = {
      place_id: `manual_${Date.now()}`,
      name,
      slug,
      owner_email: `draft-${slug}@trimma.io`,
      assign_to: agentEmail,
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

    const { data, error } = await supabaseAdmin.from("salons").insert(payload).select("id, name").single();
    if (error) throw error;

    await supabaseAdmin.from("onboarding_logs").insert({
      salon_id: data.id,
      actor_email: agentEmail,
      action: "MANUAL_LEAD_CREATED",
      notes: `Agent created manual lead "${data.name}".`,
    });

    void notifyAgentLeadAssigned(supabaseAdmin, {
      salonId: data.id,
      salonName: data.name,
      salonAddress: String(body.address || "TBD"),
      assignToEmail: agentEmail,
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
