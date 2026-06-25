"use client";

import { useRef, useState } from "react";
import ReactCrop, { type Crop, type PixelCrop, centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { Loader2, Upload } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type ProfileAvatarUploadProps = {
  avatarUrl?: string | null;
  fallbackLabel: string;
  uploading?: boolean;
  onUpload: (file: Blob) => Promise<void>;
  className?: string;
  avatarClassName?: string;
};

export function ProfileAvatarUpload({
  avatarUrl,
  fallbackLabel,
  uploading = false,
  onUpload,
  className = "",
  avatarClassName = "w-16 h-16 border-2 border-zinc-200",
}: ProfileAvatarUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [imgSrc, setImgSrc] = useState("");
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const previewUrl = localPreviewUrl || avatarUrl || undefined;
  const isBusy = uploading || processing;

  function onSelectFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload a valid image file.");
      return;
    }

    setCrop(undefined);
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      setImgSrc(reader.result?.toString() || "");
      setIsCropModalOpen(true);
    });
    reader.readAsDataURL(file);
  }

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget;
    const nextCrop = centerCrop(
      makeAspectCrop({ unit: "%", width: 90 }, 1, width, height),
      width,
      height
    );
    setCrop(nextCrop);
  }

  async function handleConfirmCrop() {
    if (!completedCrop || !imgRef.current) return;

    setProcessing(true);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 250;
      canvas.height = 250;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not process image.");

      const scaleX = imgRef.current.naturalWidth / imgRef.current.width;
      const scaleY = imgRef.current.naturalHeight / imgRef.current.height;
      const cropX = completedCrop.x * scaleX;
      const cropY = completedCrop.y * scaleY;
      const cropWidth = completedCrop.width * scaleX;
      const cropHeight = completedCrop.height * scaleY;

      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(imgRef.current, cropX, cropY, cropWidth, cropHeight, 0, 0, 250, 250);

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((result) => {
          if (result) resolve(result);
          else reject(new Error("Could not process image."));
        }, "image/jpeg", 0.9);
      });

      const preview = URL.createObjectURL(blob);
      setLocalPreviewUrl(preview);
      setIsCropModalOpen(false);
      setImgSrc("");
      await onUpload(blob);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not upload profile photo.");
    } finally {
      setProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <>
      <div className={`relative group ${className}`}>
        <Avatar className={avatarClassName}>
          {previewUrl ? <AvatarImage src={previewUrl} className="object-cover" /> : null}
          <AvatarFallback className="bg-[#ffc800] text-black font-black text-xl">
            {fallbackLabel}
          </AvatarFallback>
        </Avatar>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isBusy}
          className="absolute inset-0 rounded-full flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-100"
          aria-label="Upload profile photo"
        >
          {isBusy ? (
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          ) : (
            <Upload className="w-6 h-6 text-white" />
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onSelectFile}
        />
      </div>

      {isCropModalOpen && imgSrc ? (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-black text-zinc-900 mb-4">Position your photo</h3>
            <div className="bg-slate-100 rounded-xl overflow-hidden flex justify-center items-center h-64 mb-6">
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={(value) => setCompletedCrop(value)}
                aspect={1}
                circularCrop
                className="max-h-full"
              >
                <img
                  ref={imgRef}
                  alt="Crop profile photo"
                  src={imgSrc}
                  onLoad={onImageLoad}
                  className="max-h-64 object-contain"
                />
              </ReactCrop>
            </div>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsCropModalOpen(false);
                  setImgSrc("");
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="flex-1 rounded-xl h-11 font-bold text-xs"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => void handleConfirmCrop()}
                disabled={processing}
                className="flex-1 rounded-xl h-11 font-bold text-xs bg-zinc-900 text-white hover:bg-black"
              >
                {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
