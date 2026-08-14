import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/config/supabase-admin";
import { requirePlatformAdminFromCookies } from "@/lib/server-admin-auth";
import { startBookingOnboardingFromListingRecord } from "@/lib/listing-generation-mutations";
import { notifyAgentOfSalonAssignment } from "@/app/actions/salon-onboarding-notifications";

export const dynamic = "force-dynamic";

function routeError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return "Failed to start booking onboarding.";
}

export async function POST(req: Request) {
  try {
    const adminAuth = await requirePlatformAdminFromCookies();
    if ("error" in adminAuth) {
      return NextResponse.json({ error: adminAuth.error }, { status: 401 });
    }

    const body = (await req.json().catch(() => ({}))) as {
      salonId?: string;
      assignAgent?: boolean;
      salonRequestId?: string | null;
      ownerEmail?: string | null;
      linkRequest?: boolean;
    };

    const salonId = String(body.salonId || "").trim();
    if (!salonId) {
      return NextResponse.json({ error: "salonId is required." }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();

    if (body.linkRequest && body.salonRequestId) {
      const { data: request, error: reqError } = await supabase
        .from("salon_requests")
        .select("id")
        .eq("id", body.salonRequestId)
        .maybeSingle();

      if (reqError) throw new Error(reqError.message);
      if (!request?.id) throw new Error("Salon request not found.");

      const { error: linkError } = await supabase
        .from("salon_requests")
        .update({
          salon_id: salonId,
          admin_notes: `listing_salon:${salonId}`,
        })
        .eq("id", body.salonRequestId);

      if (linkError) throw new Error(linkError.message);
    }

    const { assignedAgent } = await startBookingOnboardingFromListingRecord(supabase, {
      salonId,
      assignAgent: body.assignAgent,
      salonRequestId: body.salonRequestId,
      ownerEmail: body.ownerEmail,
    });

    if (assignedAgent) {
      try {
        await notifyAgentOfSalonAssignment(salonId);
      } catch (notifyError) {
        console.warn("[admin/listing-generation/start-booking] agent notify skipped:", notifyError);
      }
    }

    revalidatePath("/admin/listing-generation/queue");
    revalidatePath("/admin/leads");

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("[admin/listing-generation/start-booking]", error);
    return NextResponse.json({ error: routeError(error) }, { status: 500 });
  }
}
