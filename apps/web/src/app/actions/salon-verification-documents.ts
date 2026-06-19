"use server";

import { createSupabaseAdminClient } from "@/config/supabase-admin";
import { canAgentAccessSalonAssignee } from "@/lib/agent-hierarchy";
import {
  extractSalonVerificationDocumentPaths,
  SALON_VERIFICATION_DOCUMENTS,
  type SalonVerificationDocumentView,
} from "@/lib/salon-verification-documents";
import { requireAgentFromCookies } from "@/lib/server-agent-auth";
import { requirePlatformAdminFromCookies } from "@/lib/server-admin-auth";

const SIGNED_URL_TTL_SECONDS = 60 * 60;

async function assertCanViewSalonDocuments(
  salonId: string
): Promise<{ error: string } | { actor: "admin" } | { actor: "agent"; email: string; userId: string }> {
  const adminAuth = await requirePlatformAdminFromCookies();
  if (!("error" in adminAuth)) {
    return { actor: "admin" };
  }

  const agentAuth = await requireAgentFromCookies();
  if ("error" in agentAuth) {
    return { error: "You must be signed in as admin, agent, or regional head to view verification documents." };
  }

  const supabase = createSupabaseAdminClient();
  const { data: salon, error } = await supabase
    .from("salons")
    .select("id, assign_to")
    .eq("id", salonId)
    .maybeSingle();

  if (error || !salon) {
    return { error: "Salon not found." };
  }

  const allowed = await canAgentAccessSalonAssignee(
    supabase,
    agentAuth.email,
    agentAuth.userId,
    salon.assign_to
  );

  if (!allowed) {
    return { error: "You are not assigned to review this salon." };
  }

  return { actor: "agent", email: agentAuth.email, userId: agentAuth.userId };
}

export async function getSalonVerificationDocumentUrls(salonId: string): Promise<
  | { success: true; documents: SalonVerificationDocumentView[] }
  | { success: false; error: string }
> {
  if (!salonId?.trim()) {
    return { success: false, error: "Salon id is required." };
  }

  const access = await assertCanViewSalonDocuments(salonId);
  if ("error" in access) {
    return { success: false, error: access.error };
  }

  try {
    const supabase = createSupabaseAdminClient();
    const { data: salon, error: salonError } = await supabase
      .from("salons")
      .select("bank_info")
      .eq("id", salonId)
      .maybeSingle();

    if (salonError || !salon) {
      return { success: false, error: "Salon not found." };
    }

    const paths = extractSalonVerificationDocumentPaths(
      (salon.bank_info as Record<string, unknown> | null) || null
    );

    const documents: SalonVerificationDocumentView[] = [];

    for (const meta of SALON_VERIFICATION_DOCUMENTS) {
      const storagePath = paths[meta.key];
      let signedUrl: string | null = null;

      if (storagePath) {
        const { data, error } = await supabase.storage
          .from("salon-documents")
          .createSignedUrl(storagePath, SIGNED_URL_TTL_SECONDS);

        if (!error && data?.signedUrl) {
          signedUrl = data.signedUrl;
        }
      }

      documents.push({
        key: meta.key,
        label: meta.label,
        storagePath,
        signedUrl,
      });
    }

    return { success: true, documents };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load verification documents.";
    return { success: false, error: message };
  }
}
