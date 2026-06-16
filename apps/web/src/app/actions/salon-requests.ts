"use server";

import { adminDbFailure, isAdminDbSuccess, withAdminDb } from "@/lib/with-admin-db";
import { getAdminActorEmail, requirePlatformAdminFromCookies } from "@/lib/server-admin-auth";

export type SalonRequestRow = {
  id: string;
  created_at: string;
  updated_at: string;
  full_name: string;
  email: string;
  phone: string | null;
  business_name: string | null;
  business_type: string | null;
  inquiry_type: string;
  message: string;
  source: string;
  status: "new" | "reviewing" | "contacted" | "converted" | "closed" | "spam";
  admin_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
};

export async function fetchAdminSalonRequests() {
  const result = await withAdminDb(async (supabase) => {
    const { data, error } = await supabase
      .from("salon_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return { requests: (data || []) as SalonRequestRow[] };
  });

  if (!isAdminDbSuccess(result)) return adminDbFailure(result);
  return { success: true as const, requests: result.data.requests };
}

export async function updateAdminSalonRequest(input: {
  id: string;
  status: SalonRequestRow["status"];
  admin_notes?: string | null;
}) {
  const result = await withAdminDb(async (supabase) => {
    const auth = await requirePlatformAdminFromCookies();
    if ("error" in auth) throw new Error(auth.error);

    const reviewedBy = await getAdminActorEmail();

    const { error } = await supabase
      .from("salon_requests")
      .update({
        status: input.status,
        admin_notes: input.admin_notes?.trim() || null,
        reviewed_by: reviewedBy,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", input.id);

    if (error) throw new Error(error.message);
  });

  if (!isAdminDbSuccess(result)) return adminDbFailure(result);
  return { success: true as const };
}
