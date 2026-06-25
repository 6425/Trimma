import type { SupabaseClient } from "@supabase/supabase-js";
import type { CustomerContext } from "@/lib/server-customer-auth";

export type CustomerProfileData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatarUrl: string;
};

export type CustomerProfileSaveInput = {
  firstName: string;
  lastName: string;
  phone: string;
};

export type CustomerProfileSaveResult =
  | { success: true }
  | { success: false; error: string };

function splitFullName(fullName: string | null | undefined): { firstName: string; lastName: string } {
  const trimmed = (fullName || "").trim();
  if (!trimmed) return { firstName: "", lastName: "" };
  const parts = trimmed.split(/\s+/);
  return {
    firstName: parts[0] || "",
    lastName: parts.slice(1).join(" "),
  };
}

export async function loadCustomerProfile(
  supabase: SupabaseClient,
  ctx: CustomerContext
): Promise<CustomerProfileData> {
  const { data: profile } = await supabase
    .from("users")
    .select("full_name, phone, avatar_url")
    .eq("email", ctx.email)
    .maybeSingle();

  const fromDb = splitFullName(profile?.full_name);
  const firstName =
    (ctx.userMetadata.first_name as string | undefined) ||
    fromDb.firstName ||
    (ctx.userMetadata.full_name as string | undefined)?.split(/\s+/)[0] ||
    "";
  const lastName =
    (ctx.userMetadata.last_name as string | undefined) ||
    fromDb.lastName ||
    "";

  return {
    firstName,
    lastName,
    email: ctx.email,
    phone:
      profile?.phone ||
      ctx.phone ||
      (ctx.userMetadata.phone as string | undefined) ||
      "",
    avatarUrl:
      profile?.avatar_url ||
      (ctx.userMetadata.avatar_url as string | undefined) ||
      (ctx.userMetadata.picture as string | undefined) ||
      "",
  };
}

export async function saveCustomerProfileRecord(
  supabase: SupabaseClient,
  ctx: CustomerContext,
  input: CustomerProfileSaveInput
): Promise<CustomerProfileSaveResult> {
  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  const phone = input.phone.trim();
  const fullName = `${firstName} ${lastName}`.trim();

  if (!firstName) {
    return { success: false, error: "First name is required." };
  }
  if (!lastName) {
    return { success: false, error: "Last name is required." };
  }
  if (!phone) {
    return { success: false, error: "WhatsApp number is required for booking updates." };
  }

  const { error: authError } = await supabase.auth.admin.updateUserById(ctx.userId, {
    user_metadata: {
      first_name: firstName,
      last_name: lastName,
      full_name: fullName,
      phone,
    },
  });
  if (authError) {
    return { success: false, error: authError.message };
  }

  const { error: dbError } = await supabase.from("users").upsert(
    {
      email: ctx.email,
      full_name: fullName,
      phone,
      global_role: "customer",
    },
    { onConflict: "email" }
  );
  if (dbError) {
    return { success: false, error: dbError.message };
  }

  return { success: true };
}
