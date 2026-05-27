"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import ReactCrop, { type Crop, type PixelCrop, convertToPixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { ImageIcon, Loader2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { uploadGlobalServiceImage } from "@/app/actions/style-images";
import {
  DEFAULT_UPLOAD_EXT,
  DEFAULT_UPLOAD_MIME,
  centerAspectCrop,
  getCroppedImageBlob,
  prepareImageForCrop,
} from "@/lib/image-crop";

const SERVICE_IMAGE_ASPECT = 1;
export const SERVICE_IMAGE_WIDTH = 256;
export const SERVICE_IMAGE_HEIGHT = 256;
export const SERVICE_IMAGE_DIMENSION_LABEL = `${SERVICE_IMAGE_WIDTH} × ${SERVICE_IMAGE_HEIGHT} px`;

type UploadStage = "idle" | "preparing" | "compressing" | "uploading";

export type ServiceImageUploadResult =
  | { success: true; publicUrl: string; bytes: number }
  | { success: false; error: string };

type GlobalServiceIconUploadProps = {
  value?: string | null;
  onChange: (url: string) => void;
  onClear: () => void;
  size?: "sm" | "md";
  uploadAction?: (formData: FormData) => Promise<ServiceImageUploadResult>;
  uploadContextLabel?: string;
};

export function GlobalServiceIconUpload({
  value,
  onChange,
  onClear,
  size = "md",
  uploadAction,
  uploadContextLabel = "global service catalog",
}: GlobalServiceIconUploadProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const cropPreviewRevokeRef = useRef<(() => void) | null>(null);
  const [upImg, setUpImg] = useState<string>();
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [isCropping, setIsCropping] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStage, setUploadStage] = useState<UploadStage>("idle");

  const boxClass = size === "sm" ? "w-12 h-12 rounded-2xl" : "w-28 h-28 rounded-2xl";

  const revokeCropPreview = () => {
    cropPreviewRevokeRef.current?.();
    cropPreviewRevokeRef.current = null;
  };

  const closeCropModal = () => {
    setIsCropping(false);
    revokeCropPreview();
    setUpImg(undefined);
    setCrop(undefined);
    setCompletedCrop(undefined);
    setUploadStage("idle");
  };

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }

    void (async () => {
      try {
        setUploadStage("preparing");
        revokeCropPreview();
        const previewUrl = await prepareImageForCrop(file);
        cropPreviewRevokeRef.current = () => URL.revokeObjectURL(previewUrl);
        setUpImg(previewUrl);
        setIsCropping(true);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Could not load image.";
        toast.error(message);
      } finally {
        setUploadStage("idle");
      }
    })();
  };

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    const nextCrop = centerAspectCrop(width, height, SERVICE_IMAGE_ASPECT);
    setCrop(nextCrop);
    setCompletedCrop(convertToPixelCrop(nextCrop, width, height));
  };

  const resolvePixelCrop = (): PixelCrop | null => {
    if (!imgRef.current) return null;

    if (completedCrop?.width && completedCrop?.height) {
      return completedCrop;
    }

    if (crop) {
      return convertToPixelCrop(crop, imgRef.current.width, imgRef.current.height);
    }

    return null;
  };

  const handleCropSave = async () => {
    const pixelCrop = resolvePixelCrop();
    if (!pixelCrop?.width || !pixelCrop?.height || !imgRef.current) {
      toast.error("Adjust the crop area, then try again.");
      return;
    }

    try {
      setIsUploading(true);
      setUploadStage("compressing");

      const imageBlob = await getCroppedImageBlob(imgRef.current, pixelCrop, {
        outputWidth: SERVICE_IMAGE_WIDTH,
        outputHeight: SERVICE_IMAGE_HEIGHT,
        mime: DEFAULT_UPLOAD_MIME,
      });

      setUploadStage("uploading");
      const formData = new FormData();
      formData.append("file", imageBlob, `service.${DEFAULT_UPLOAD_EXT}`);

      const upload = uploadAction ?? uploadGlobalServiceImage;
      const result = await upload(formData);
      if (!result.success) {
        throw new Error("error" in result ? result.error : "Upload failed.");
      }

      onChange(result.publicUrl);
      closeCropModal();
      toast.success(`Service image saved (${Math.max(1, Math.round(result.bytes / 1024))} KB).`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Upload failed.";
      toast.error(message);
    } finally {
      setIsUploading(false);
      setUploadStage("idle");
    }
  };

  const uploadButtonLabel =
    uploadStage === "compressing"
      ? "Compressing..."
      : uploadStage === "uploading"
        ? "Uploading..."
        : isUploading
          ? "Processing..."
          : "Apply & upload";

  return (
    <>
      {isCropping && upImg && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-900/90 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-zinc-900">
                Crop service image ({SERVICE_IMAGE_DIMENSION_LABEL})
              </h3>
              <button
                type="button"
                onClick={closeCropModal}
                className="text-zinc-500 hover:text-zinc-900"
                aria-label="Close cropper"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-zinc-500 mb-3">
              Output: {SERVICE_IMAGE_DIMENSION_LABEL} square JPG for the {uploadContextLabel}.
            </p>

            <div className="flex-1 overflow-auto bg-zinc-100 rounded-xl flex items-center justify-center border border-zinc-200 p-4">
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={SERVICE_IMAGE_ASPECT}
                className="max-h-[50vh]"
              >
                <img
                  ref={imgRef}
                  alt="Crop service image"
                  src={upImg}
                  onLoad={onImageLoad}
                  className="max-h-[50vh] w-auto object-contain"
                />
              </ReactCrop>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={closeCropModal}
                disabled={isUploading}
                className="rounded-xl font-bold text-zinc-600 h-11"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleCropSave}
                disabled={isUploading}
                className="rounded-xl font-bold bg-brand hover:bg-brand-hover text-zinc-900 h-11 px-8"
              >
                {isUploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {uploadButtonLabel}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {value ? (
          <div className={`relative ${boxClass} overflow-hidden border border-slate-200 group bg-slate-50`}>
            <Image src={value} alt="Service image" fill className="object-cover" sizes="112px" />
            {size === "md" && (
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <label className="cursor-pointer bg-white text-zinc-900 px-2 py-1 rounded-lg text-[10px] font-bold shadow-sm">
                  <Upload className="w-3 h-3 inline mr-1" />
                  Replace
                  <input type="file" accept="image/*" onChange={onSelectFile} className="hidden" />
                </label>
                <button
                  type="button"
                  onClick={onClear}
                  className="bg-rose-500 text-white px-2 py-1 rounded-lg text-[10px] font-bold shadow-sm"
                >
                  Remove
                </button>
              </div>
            )}
          </div>
        ) : (
          <label
            className={`flex flex-col items-center justify-center ${boxClass} border-2 border-dashed border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-brand/30 transition-colors cursor-pointer text-zinc-500 ${uploadStage === "preparing" ? "pointer-events-none opacity-60" : ""}`}
          >
            {uploadStage === "preparing" ? (
              <Loader2 className="w-6 h-6 mb-1 animate-spin text-zinc-400" />
            ) : (
              <ImageIcon className={`${size === "sm" ? "w-4 h-4" : "w-6 h-6"} mb-1 text-zinc-400`} />
            )}
            {size === "md" && (
              <>
                <span className="text-[10px] font-bold uppercase tracking-wide">
                  {uploadStage === "preparing" ? "Preparing..." : "Upload image"}
                </span>
                <span className="text-[9px] text-zinc-400 mt-0.5">{SERVICE_IMAGE_DIMENSION_LABEL} • JPG</span>
              </>
            )}
            <input type="file" accept="image/*" onChange={onSelectFile} className="hidden" />
          </label>
        )}
      </div>
    </>
  );
}

export function GlobalServiceIconPreview({
  iconImageUrl,
  iconName,
  iconMap,
  className = "w-12 h-12 rounded-2xl",
}: {
  iconImageUrl?: string | null;
  iconName?: string | null;
  iconMap: Record<string, React.ComponentType<{ className?: string }>>;
  className?: string;
}) {
  if (iconImageUrl) {
    return (
      <div className={`relative overflow-hidden border border-slate-200 bg-slate-100 shrink-0 ${className}`}>
        <Image src={iconImageUrl} alt="" fill className="object-cover" sizes="48px" />
      </div>
    );
  }

  const FallbackIcon = iconMap.LayoutGrid;
  const IconComp = (iconName && iconMap[iconName]) || FallbackIcon;
  return (
    <div
      className={`flex items-center justify-center bg-zinc-100 text-zinc-500 group-hover:bg-brand/10 group-hover:text-brand transition-colors shrink-0 ${className}`}
    >
      <IconComp className="w-6 h-6" />
    </div>
  );
}

/** Preferred naming — service image, not icon. */
export const GlobalServiceImageUpload = GlobalServiceIconUpload;
export const GlobalServiceImagePreview = GlobalServiceIconPreview;
