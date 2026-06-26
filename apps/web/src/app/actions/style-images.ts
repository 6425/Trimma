"use server";

import { createSupabaseAdminClient } from "@/config/supabase-admin";
import { requirePlatformAdminFromCookies } from "@/lib/server-admin-auth";
import { requireSalonOwnerFromCookies } from "@/lib/server-salon-auth";

function extensionForMime(mime: string) {
  if (mime.includes("png")) return "png";
  if (mime.includes("webp")) return "webp";
  if (mime.includes("gif")) return "gif";
  return "jpg";
}

async function uploadPublicAssetImage(
  formData: FormData,
  folder: string,
  filePrefix: string,
  requireAdmin = true
) {
  try {
    if (requireAdmin) {
      const auth = await requirePlatformAdminFromCookies();
      if ("error" in auth) {
        return { success: false as const, error: auth.error };
      }
    } else {
      const auth = await requireSalonOwnerFromCookies();
      if ("error" in auth) {
        return { success: false as const, error: auth.error };
      }
    }

    const file = formData.get("file");
    if (!(file instanceof Blob) || file.size === 0) {
      return { success: false as const, error: "No image file provided." };
    }

    if (file.size > 2 * 1024 * 1024) {
      return { success: false as const, error: "Image is too large after cropping." };
    }

    const contentType = file.type || "image/jpeg";
    const ext = extensionForMime(contentType);
    const fileName = `${filePrefix}_${Date.now()}.${ext}`;
    const path = `${folder}/${fileName}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.storage.from("public-assets").upload(path, buffer, {
      contentType,
      cacheControl: "31536000",
      upsert: true,
    });

    if (error) {
      const msg = error.message || "Storage upload failed.";
      if (msg.toLowerCase().includes("bucket")) {
        return {
          success: false as const,
          error:
            "Storage bucket 'public-assets' is missing. Run packages/db/STORAGE_PUBLIC_ASSETS_PATCH.sql in Supabase.",
        };
      }
      return { success: false as const, error: msg };
    }

    const { data } = supabase.storage.from("public-assets").getPublicUrl(path);
    return { success: true as const, publicUrl: data.publicUrl, bytes: file.size };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed.";
    if (message.includes("SUPABASE_SERVICE_ROLE_KEY")) {
      return {
        success: false as const,
        error: "Server is missing SUPABASE_SERVICE_ROLE_KEY. Add it in Vercel environment variables.",
      };
    }
    return {
      success: false as const,
      error: message,
    };
  }
}

export async function uploadStyleImage(formData: FormData) {
  return uploadPublicAssetImage(formData, "styles", "style");
}

export async function uploadGlobalServiceImage(formData: FormData) {
  return uploadPublicAssetImage(formData, "global-services", "gsvc");
}

export async function uploadSalonServiceImage(formData: FormData, salonId: string) {
  if (!salonId) {
    return { success: false as const, error: "Salon ID is required for service image upload." };
  }
  return uploadPublicAssetImage(formData, `salon-services/${salonId}`, "svc", false);
}

export async function uploadSalonPromotionPackageImage(formData: FormData, salonId: string) {
  if (!salonId) {
    return { success: false as const, error: "Salon ID is required for promotion image upload." };
  }
  return uploadPublicAssetImage(formData, `salon-promotions/${salonId}`, "promo", false);
}
