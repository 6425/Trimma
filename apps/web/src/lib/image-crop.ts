import { centerCrop, makeAspectCrop, type PixelCrop } from "react-image-crop";

export const STYLE_CROP_ASPECT = 3 / 4;
export const STYLE_OUTPUT_WIDTH = 600;
export const STYLE_OUTPUT_HEIGHT = 800;

/** Crop UI max edge — output is only 600×800 so 1200 is plenty. */
export const CROP_PREP_MAX_DIMENSION = 1200;

export const DEFAULT_UPLOAD_MIME = "image/jpeg";
export const DEFAULT_UPLOAD_EXT = "jpg";

export function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number
) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: "%",
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  );
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality?: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Canvas is empty"))),
      type,
      quality
    );
  });
}

async function decodeImageFile(file: File): Promise<{
  source: CanvasImageSource;
  width: number;
  height: number;
  cleanup: () => void;
}> {
  if (typeof createImageBitmap !== "undefined") {
    try {
      const bitmap = await createImageBitmap(file);
      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        cleanup: () => bitmap.close(),
      };
    } catch {
      // fall through
    }
  }

  const objectUrl = URL.createObjectURL(file);
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error("Could not load image"));
    el.src = objectUrl;
  });

  return {
    source: img,
    width: img.naturalWidth,
    height: img.naturalHeight,
    cleanup: () => URL.revokeObjectURL(objectUrl),
  };
}

/**
 * Prepares a lightweight blob URL for the crop UI (never base64 — that was the main slowdown).
 */
export async function prepareImageForCrop(
  file: File,
  maxDimension = CROP_PREP_MAX_DIMENSION
): Promise<string> {
  const decoded = await decodeImageFile(file);
  try {
    const longest = Math.max(decoded.width, decoded.height);
    const needsResize = longest > maxDimension || file.size > 600 * 1024;

    if (!needsResize) {
      return URL.createObjectURL(file);
    }

    const scale = maxDimension / longest;
    const width = Math.max(1, Math.round(decoded.width * scale));
    const height = Math.max(1, Math.round(decoded.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("No 2d context");
    }

    ctx.drawImage(decoded.source, 0, 0, width, height);
    const jpegBlob = await canvasToBlob(canvas, DEFAULT_UPLOAD_MIME, 0.85);
    return URL.createObjectURL(jpegBlob);
  } finally {
    decoded.cleanup();
  }
}

type CropImageOptions = {
  outputWidth?: number;
  outputHeight?: number;
  quality?: number;
  mime?: string;
  maxBytes?: number;
};

async function encodeCanvasWithOptionalLimit(
  canvas: HTMLCanvasElement,
  options: CropImageOptions
): Promise<Blob> {
  const mime = options.mime ?? DEFAULT_UPLOAD_MIME;
  let quality = options.quality ?? 0.85;
  const maxBytes = options.maxBytes;

  if (!maxBytes) {
    return canvasToBlob(canvas, mime, quality);
  }

  while (quality >= 0.35) {
    const blob = await canvasToBlob(canvas, mime, quality);
    if (blob.size <= maxBytes) {
      return blob;
    }
    quality -= 0.08;
  }

  return canvasToBlob(canvas, mime, 0.35);
}

/** Final export at fixed dimensions (e.g. 600×800 style portraits). */
export async function getCroppedImageBlob(
  image: HTMLImageElement,
  crop: PixelCrop,
  options: CropImageOptions = {}
): Promise<Blob> {
  const outputWidth = options.outputWidth ?? STYLE_OUTPUT_WIDTH;
  const outputHeight = options.outputHeight ?? STYLE_OUTPUT_HEIGHT;

  const canvas = document.createElement("canvas");
  canvas.width = outputWidth;
  canvas.height = outputHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("No 2d context");
  }

  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;

  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    outputWidth,
    outputHeight
  );

  return encodeCanvasWithOptionalLimit(canvas, options);
}

/** Export at the crop region's native pixel size (e.g. 16:9 category banners). */
export async function getCroppedImageBlobNative(
  image: HTMLImageElement,
  crop: PixelCrop,
  options: CropImageOptions = {}
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  canvas.width = Math.max(1, Math.round(crop.width * scaleX));
  canvas.height = Math.max(1, Math.round(crop.height * scaleY));

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("No 2d context");
  }

  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    canvas.width,
    canvas.height
  );

  return encodeCanvasWithOptionalLimit(canvas, options);
}

export function uploadFileName(prefix: string, ext = DEFAULT_UPLOAD_EXT) {
  return `${prefix}_${Date.now()}.${ext}`;
}
