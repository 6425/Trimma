import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/config/supabase-admin";
import { sendTriggeredEmail } from "@/app/actions/email-settings";
import { notifyAgentLeadAssigned } from "@/lib/agent-lead-notifications";
import {
  insertOnboardingSalonLead,
  type OnboardingLeadFormInput,
} from "@/lib/onboarding-lead-insert";
import { mirrorOnboardingLeadToSalonRequests } from "@/lib/salon-request-insert";
import { APP_BASE_URL } from "@/lib/email/config";
import { isSalonClaimable, isSalonPubliclyListable } from "@/lib/salon-public-listing";

export async function POST(request: Request) {
  try {
    let body = (await request.json()) as OnboardingLeadFormInput;

    const supabase = createSupabaseAdminClient();
    if (body.claimSalonId) {
      const claimSalonId = body.claimSalonId.trim();
      const { data: listing, error: listingError } = await supabase
        .from("salons")
        .select("id, name, address, city, district, province, latitude, longitude, owner_email, owner_gmail, is_verified, onboarding_status, status, public_visibility, booking_enabled, source_type")
        .eq("id", claimSalonId)
        .maybeSingle();

      if (
        listingError ||
        !listing ||
        !isSalonPubliclyListable(listing) ||
        !isSalonClaimable(listing)
      ) {
        return NextResponse.json(
          { success: false, error: "This listing is not available to claim." },
          { status: 409 }
        );
      }

      body = {
        ...body,
        claimSalonId,
        businessName: listing.name || body.businessName,
        address: listing.address || body.address,
        city: listing.city || body.city,
        district: listing.district || body.district,
        province: listing.province || body.province,
        latitude: listing.latitude ?? body.latitude,
        longitude: listing.longitude ?? body.longitude,
      };
    }

    const { id: leadId, assignedAgent, isWaitingList } = await insertOnboardingSalonLead(
      supabase,
      body
    );

    await mirrorOnboardingLeadToSalonRequests(supabase, body, leadId);

    const salonAddress = [body.address, body.city, body.district, body.province]
      .filter(Boolean)
      .join(", ");

    const applicantEmail = body.email.trim().toLowerCase();
    if (applicantEmail) {
      void sendTriggeredEmail({
        triggerId: "partner-lead-received",
        to: applicantEmail,
        variables: {
          owner_name: body.ownerName || body.businessName,
          salon_name: body.businessName,
          salon_address: salonAddress || "Sri Lanka",
        },
        rateLimitKey: `partner-lead:${leadId}`,
        idempotencyKey: `partner-lead/${leadId}`,
      }).catch((err) => console.error("Partner lead confirmation email failed:", err));
    }

    if (assignedAgent) {
      void notifyAgentLeadAssigned(supabase, {
        salonId: leadId,
        salonName: body.businessName,
        salonAddress,
        assignToEmail: assignedAgent,
        onboardingStatus: "ASSIGNED_TO_AGENT",
        dashboardLink: `${APP_BASE_URL}/agent/leads`,
      }).catch((err) => console.error("Agent lead assignment notification failed:", err));
    }

    return NextResponse.json({ success: true, leadId, isWaitingList });
  } catch (err: unknown) {
    console.error("[api/onboarding/lead]", err);
    const message = err instanceof Error ? err.message : "Failed to submit lead.";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
