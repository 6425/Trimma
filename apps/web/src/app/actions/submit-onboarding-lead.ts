"use server";

import { createSupabaseAdminClient } from "@/config/supabase-admin";
import { normalizeEmail } from "@/lib/normalize-email";

export async function submitOnboardingLead(formData: {
  businessName: string;
  ownerName: string;
  email: string;
  whatsapp: string;
  province: string;
  district: string;
  city: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  notes: string;
}) {
  const supabase = createSupabaseAdminClient();

  try {
    // 1. Determine Lead Assignment
    // Hardcoded logic based on district. In a real scenario, this could query a territory_assignments table.
    let assignedAgent = null;
    const districtLower = formData.district.toLowerCase();

    // Map districts to agent emails (replace with real agent emails)
    const agentMap: Record<string, string> = {
      colombo: "agent-colombo@trimma.io",
      gampaha: "agent-gampaha@trimma.io",
      kandy: "agent-kandy@trimma.io",
      anuradhapura: "agent-anura@trimma.io",
    };

    if (agentMap[districtLower]) {
      assignedAgent = agentMap[districtLower];
    }

    const isWaitingList = !assignedAgent;

    // 2. Insert into salon_leads
    const { data: newLead, error: insertError } = await supabase
      .from("salon_leads")
      .insert({
        name: formData.businessName,
        owner_name: formData.ownerName,
        owner_email: normalizeEmail(formData.email),
        phone: formData.whatsapp, // Assuming phone column is used for WhatsApp
        whatsapp_number: formData.whatsapp,
        province: formData.province,
        district: formData.district,
        city: formData.city,
        address: formData.address,
        latitude: formData.latitude,
        longitude: formData.longitude,
        summary: formData.notes, // Notes map to summary
        assign_to: assignedAgent,
        status: isWaitingList ? "new" : "assigned",
        lead_status: isWaitingList ? "NEW" : "ASSIGNED_TO_AGENT",
        onboarding_stage: "NOT_STARTED"
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Lead insert error:", insertError);
      throw insertError;
    }

    // 3. Stub for Email Notifications
    // TODO: Send confirmation email to formData.email
    // TODO: Notify assignedAgent if applicable
    console.log(`[Email Stub] Sending confirmation to ${formData.email}`);
    if (assignedAgent) {
      console.log(`[Email Stub] Notifying agent ${assignedAgent} about new lead ${newLead.id}`);
    }

    return { success: true as const, leadId: newLead.id, isWaitingList };
  } catch (err: any) {
    console.error("Failed to submit onboarding lead:", err);
    return { success: false as const, error: err.message || "Failed to submit lead." };
  }
}
