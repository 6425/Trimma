import { uploadAdminSalonImage } from "@/app/actions/admin-operations";
import { blobToBase64, cropImageFile } from "@/lib/crop-image-file";

export { blobToBase64 } from "@/lib/crop-image-file";

/**
 * Automatically crops an image to fill the target width and height using object-cover logic,
 * then uploads it via the admin server action.
 */
export async function autoCropAndUpload(
  file: File,
  targetWidth: number,
  targetHeight: number,
  field: string
): Promise<string> {
  const imageBlob = await cropImageFile(file, targetWidth, targetHeight);

  // Upload to Supabase Storage
  const fileName = `leads/${field}_${Date.now()}.jpg`;
  const base64 = await blobToBase64(imageBlob);
  const uploadResult = await uploadAdminSalonImage(fileName, base64, "image/jpeg");
  if (uploadResult.success === false) throw new Error(uploadResult.error);
  
  return uploadResult.publicUrl;
}
