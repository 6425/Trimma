"use server";

import { createSupabaseAdminClient } from "@/config/supabase-admin";

function extensionForMime(mime: string) {
  if (mime.includes("png")) return "png";
  if (mime.includes("webp")) return "webp";
  if (mime.includes("gif")) return "gif";
  return "jpg";
}

export async function uploadStyleImage(formData: FormData) {
  try {
    const file = formData.get("file");
    if (!(file instanceof Blob) || file.size === 0) {
      return { success: false as const, error: "No image file provided." };
    }

    if (file.size > 2 * 1024 * 1024) {
      return { success: false as const, error: "Image is too large after cropping." };
    }

    const contentType = file.type || "image/jpeg";
    const ext = extensionForMime(contentType);
    const fileName = `style_${Date.now()}.${ext}`;
    const path = `styles/${fileName}`;
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
    return {
      success: false as const,
      error: err instanceof Error ? err.message : "Upload failed.",
    };
  }
}
