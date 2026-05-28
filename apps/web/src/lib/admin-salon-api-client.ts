import { buildAdminSalonFormPayload } from "@/lib/admin-salon-update";

export type AdminSalonFormInput = Parameters<typeof buildAdminSalonFormPayload>[0];

export async function patchAdminSalonViaApi(
  salonId: string,
  input: AdminSalonFormInput
): Promise<{ success: true } | { success: false; error: string }> {
  const payload = buildAdminSalonFormPayload(input);

  const response = await fetch(`/api/admin/salons/${encodeURIComponent(salonId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  let result: { success?: boolean; error?: string } = {};
  try {
    result = await response.json();
  } catch {
    return {
      success: false,
      error: response.ok
        ? "Save failed: invalid server response."
        : `Save failed (${response.status}). Refresh and try again.`,
    };
  }

  if (!response.ok || result.success === false) {
    return {
      success: false,
      error: result.error || `Save failed (${response.status}).`,
    };
  }

  return { success: true };
}
