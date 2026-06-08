import { uploadAdminSalonImage } from "@/app/actions/admin-operations";

export async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.includes(",") ? result.split(",")[1] : result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

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
  
  // 1. Read file as Data URL to draw on canvas
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  // 2. Load into image object
  const img = new Image();
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
    img.src = dataUrl;
  });

  // 3. Setup Canvas for crop
  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext("2d");
  
  if (!ctx) throw new Error("Could not get canvas context");
  
  // Cover logic (crop to fill target ratio)
  const imgRatio = img.width / img.height;
  const targetRatio = targetWidth / targetHeight;
  
  let drawWidth = targetWidth;
  let drawHeight = targetHeight;
  let offsetX = 0;
  let offsetY = 0;
  
  if (imgRatio > targetRatio) {
    drawWidth = img.height * targetRatio;
    drawHeight = img.height;
    offsetX = (img.width - drawWidth) / 2;
  } else {
    drawWidth = img.width;
    drawHeight = img.width / targetRatio;
    offsetY = (img.height - drawHeight) / 2;
  }
  
  ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight, 0, 0, targetWidth, targetHeight);
  
  // 4. Export cropped JPEG
  const imageBlob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Canvas toBlob failed"));
    }, "image/jpeg", 0.82);
  });

  // 5. Upload to Supabase Storage
  const fileName = `leads/${field}_${Date.now()}.jpg`;
  const base64 = await blobToBase64(imageBlob);
  const uploadResult = await uploadAdminSalonImage(fileName, base64, "image/jpeg");
  if (uploadResult.success === false) throw new Error(uploadResult.error);
  
  return uploadResult.publicUrl;
}
