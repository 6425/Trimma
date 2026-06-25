"use server";

import { createSupabaseAdminClient } from "@/config/supabase-admin";
import { requireCustomerFromCookies } from "@/lib/server-customer-auth";

export async function uploadCustomerAvatar(formData: FormData) {
  const file = formData.get("file") as File | null;
  if (!file) {
    return { success: false as const, error: "No file provided." };
  }

  const auth = await requireCustomerFromCookies();
  if ("error" in auth) {
    return { success: false as const, error: auth.error };
  }

  const fileExt = file.name.split(".").pop() || "jpg";
  const fileName = `customer-avatars/${auth.userId}-${Date.now()}.${fileExt}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const supabase = createSupabaseAdminClient();
  const { error: uploadError } = await supabase.storage.from("public-assets").upload(fileName, buffer, {
    contentType: file.type || "image/jpeg",
    upsert: true,
    cacheControl: "3600",
  });

  if (uploadError) {
    return { success: false as const, error: uploadError.message };
  }

  const { data: publicUrlData } = supabase.storage.from("public-assets").getPublicUrl(fileName);
  const avatarUrl = publicUrlData.publicUrl;

  const { error: updateError } = await supabase
    .from("users")
    .update({ avatar_url: avatarUrl })
    .eq("email", auth.email);

  if (updateError) {
    return { success: false as const, error: updateError.message };
  }

  const { error: authError } = await supabase.auth.admin.updateUserById(auth.userId, {
    user_metadata: {
      ...auth.userMetadata,
      avatar_url: avatarUrl,
    },
  });

  if (authError) {
    return { success: false as const, error: authError.message };
  }

  return { success: true as const, avatarUrl };
}
