/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import ReactCrop, { type Crop, type PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Loader2,
  Upload,
  Image as ImageIcon,
  X,
  Scissors,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  STYLE_CROP_ASPECT,
  centerAspectCrop,
  getCroppedImageBlob,
  prepareImageForCrop,
  DEFAULT_UPLOAD_EXT,
} from "@/lib/image-crop";
import { uploadStyleImage } from "@/app/actions/style-images";
import {
  deletePlatformStyle,
  fetchAdminPlatformStylesCatalog,
  savePlatformStyle,
} from "@/app/actions/platform-styles";
import { withTimeout } from "@/lib/promise-timeout";

type SalonCategory = {
  id: string;
  name: string;
  slug: string;
};

type PlatformStyle = {
  id: string;
  title: string;
  description: string | null;
  category_id: string | null;
  category: string | null;
  tags: string[] | null;
  image_url: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  categories: SalonCategory | null;
};

const emptyForm = {
  title: "",
  description: "",
  category_id: "",
  tags: "",
  image_url: "",
  is_active: true,
  sort_order: 0,
};

export default function AdminStyleManagementPage() {
  const [styles, setStyles] = useState<PlatformStyle[]>([]);
  const [categories, setCategories] = useState<SalonCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [formData, setFormData] = useState(emptyForm);

  const [upImg, setUpImg] = useState<string>();
  const cropPreviewRevokeRef = useRef<(() => void) | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [isCropping, setIsCropping] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadStage, setUploadStage] = useState<"idle" | "preparing" | "compressing" | "uploading">("idle");

  const revokeCropPreview = () => {
    cropPreviewRevokeRef.current?.();
    cropPreviewRevokeRef.current = null;
  };

  const fetchCatalog = async (options?: { silent?: boolean }) => {
    try {
      if (!options?.silent) {
        setLoading(true);
      }
      const result = await withTimeout(
        fetchAdminPlatformStylesCatalog(),
        20000,
        "Loading timed out. Check Vercel env (SUPABASE_SERVICE_ROLE_KEY) and refresh."
      );

      if (result.success === false) {
        throw new Error(result.error);
      }

      setStyles((result.styles as PlatformStyle[]) || []);
      setCategories((result.categories as SalonCategory[]) || []);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to load styles";
      toast.error(message);
    } finally {
      if (!options?.silent) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    return () => revokeCropPreview();
  }, []);

  useEffect(() => {
    void Promise.resolve().then(async () => {
      await fetchCatalog();
    });
  }, []);

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      toast.error("Image is too large. Please use a photo under 25 MB.");
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
        const message = error instanceof Error ? error.message : "Could not load image";
        toast.error(message);
      } finally {
        setUploadStage("idle");
      }
    })();
  };

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height, STYLE_CROP_ASPECT));
  };

  const handleCropSave = async () => {
    if (!completedCrop || !imgRef.current) return;

    try {
      setIsUploadingImage(true);
      setUploadStage("compressing");
      const imageBlob = await getCroppedImageBlob(imgRef.current, completedCrop);

      setUploadStage("uploading");
      const formDataUpload = new FormData();
      formDataUpload.append("file", imageBlob, `style.${DEFAULT_UPLOAD_EXT}`);
      const result = await uploadStyleImage(formDataUpload);

      if (result.success === false) {
        throw new Error(result.error);
      }

      setFormData((prev) => ({ ...prev, image_url: result.publicUrl }));
      setIsCropping(false);
      revokeCropPreview();
      setUpImg(undefined);
      toast.success(`Style image saved (${Math.max(1, Math.round(result.bytes / 1024))} KB).`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Upload failed";
      toast.error(message);
    } finally {
      setIsUploadingImage(false);
      setUploadStage("idle");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.category_id) return toast.error("Salon category is required");
    if (!formData.title.trim()) return toast.error("Style name is required");
    if (!formData.image_url) return toast.error("Upload a style image first");

    const selectedCategory = categories.find((c) => c.id === formData.category_id);
    const tags = formData.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      setSaving(true);

      const result = await savePlatformStyle({
        id: editId ?? undefined,
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        category_id: formData.category_id,
        category: selectedCategory?.name || null,
        tags,
        image_url: formData.image_url,
        is_active: formData.is_active,
        sort_order: Number(formData.sort_order) || 0,
      });

      if (result.success === false) {
        toast.error(result.error);
        return;
      }

      const saved = result.style as PlatformStyle;
      if (editId) {
        setStyles((prev) => prev.map((s) => (s.id === editId ? saved : s)));
        toast.success("Style updated");
      } else {
        setStyles((prev) => [saved, ...prev]);
        toast.success("Style published");
      }

      setFormData(emptyForm);
      setEditId(null);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Save failed";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this style from the catalog? Customers who saved it will lose the reference.")) {
      return;
    }

    try {
      const result = await deletePlatformStyle(id);
      if (result.success === false) {
        toast.error(result.error);
        return;
      }

      setStyles((prev) => prev.filter((s) => s.id !== id));
      toast.success("Style deleted");
      if (editId === id) {
        setEditId(null);
        setFormData(emptyForm);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Delete failed";
      toast.error(message);
    }
  };

  const closeCropModal = () => {
    setIsCropping(false);
    revokeCropPreview();
    setUpImg(undefined);
  };

  const handleEdit = (style: PlatformStyle) => {
    setEditId(style.id);
    setFormData({
      title: style.title,
      description: style.description || "",
      category_id: style.category_id || style.categories?.id || "",
      tags: (style.tags || []).join(", "),
      image_url: style.image_url,
      is_active: style.is_active,
      sort_order: style.sort_order,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const getCategoryName = (style: PlatformStyle) =>
    style.categories?.name || style.category || "Uncategorized";

  const filtered = styles.filter((s) => {
    const q = searchTerm.toLowerCase();
    return (
      s.title.toLowerCase().includes(q) ||
      getCategoryName(s).toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-[1600px] mx-auto relative flex flex-col gap-4 lg:h-[calc(100dvh-7.5rem)] lg:min-h-0 p-4 md:p-6">
      {isCropping && !!upImg && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-900/90 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-zinc-900">Crop Style Image (1080 × 1350 Portrait)</h3>
              <button type="button" onClick={closeCropModal} className="text-zinc-500 hover:text-zinc-900">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-zinc-500 mb-3">
              Output: 1080×1350 portrait — shown on the public Styles gallery and customer saved styles.
            </p>

            <div className="flex-1 overflow-auto bg-zinc-100 rounded-xl flex items-center justify-center border border-zinc-200">
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={STYLE_CROP_ASPECT}
                className="max-h-[60vh]"
              >
                <img
                  ref={imgRef}
                  alt="Crop style"
                  src={upImg}
                  onLoad={onImageLoad}
                  className="max-h-[60vh] w-auto object-contain"
                />
              </ReactCrop>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button variant="ghost" onClick={closeCropModal} className="rounded-xl font-bold h-12">
                Cancel
              </Button>
              <Button onClick={handleCropSave} disabled={isUploadingImage} className="rounded-xl font-bold h-12 px-8">
                {isUploadingImage ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                {uploadStage === "compressing"
                  ? "Compressing..."
                  : uploadStage === "uploading"
                    ? "Uploading..."
                    : isUploadingImage
                      ? "Processing..."
                      : "Apply & Upload"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight flex items-center gap-2">
            <Scissors className="w-7 h-7 text-[#ffde5a]" />
            Style Management
          </h1>
          <p className="text-zinc-500 text-sm mt-0.5">
            Assign each look to a salon service category. Styles appear on /styles under that category.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.65fr)_minmax(300px,380px)] gap-4 flex-1 min-h-0">
        <Card className="border border-zinc-100 shadow-sm overflow-hidden rounded-2xl flex flex-col min-h-[420px] lg:min-h-0">
          <div className="px-4 py-3 bg-white border-b border-zinc-100 shrink-0">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-50 border-none h-10 rounded-xl text-sm"
                placeholder="Search styles..."
              />
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-auto p-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 text-zinc-500">
                <Loader2 className="w-6 h-6 animate-spin mb-2" />
                <span className="text-xs font-semibold">Loading styles...</span>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 text-zinc-500">
                <ImageIcon className="w-10 h-10 mx-auto mb-3 text-zinc-300" />
                <p className="font-bold text-sm">No styles yet</p>
                <p className="text-xs mt-1">Add your first style image using the form on the right.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filtered.map((style) => (
                  <div key={style.id} className="rounded-2xl border border-zinc-100 overflow-hidden bg-white shadow-sm">
                    <div className="relative aspect-[4/5] bg-zinc-100">
                      <Image src={style.image_url} alt={style.title} fill className="object-cover" sizes="200px" />
                      {!style.is_active && (
                        <Badge className="absolute top-2 left-2 bg-zinc-800/90 text-white text-[9px]">Hidden</Badge>
                      )}
                    </div>
                    <div className="p-3 space-y-2">
                      <div className="font-bold text-sm text-zinc-900 line-clamp-1">{style.title}</div>
                      <div className="text-[10px] text-zinc-500 uppercase tracking-wide">
                        {getCategoryName(style)}
                      </div>
                      <div className="flex gap-1.5">
                        <Button size="sm" variant="outline" className="flex-1 h-8 text-xs" onClick={() => handleEdit(style)}>
                          <Edit2 className="w-3 h-3 mr-1" /> Edit
                        </Button>
                        <Button size="sm" variant="outline" className="h-8 px-2 text-red-500" onClick={() => handleDelete(style.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        <Card className="border border-zinc-100 shadow-sm rounded-2xl p-5 h-fit xl:sticky xl:top-4">
          <h2 className="font-extrabold text-zinc-900 mb-4">{editId ? "Edit Style" : "Add New Style"}</h2>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="style_category_id">Salon Category *</Label>
              <select
                id="style_category_id"
                value={formData.category_id}
                onChange={(e) => setFormData((p) => ({ ...p, category_id: e.target.value }))}
                required
                className="w-full h-11 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus:outline-none focus:border-[#ffde5a]"
              >
                <option value="">Select a salon category...</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              {categories.length === 0 && (
                <p className="text-[10px] text-amber-600">
                  No categories found. Add service categories under Admin → Service Mgmt → Service Categories first.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="style_title">Style Name *</Label>
              <Input
                id="style_title"
                value={formData.title}
                onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                placeholder="e.g. Textured Crop Fade"
                required
                disabled={!formData.category_id}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-zinc-500">Style Image (3:4)</Label>
              {formData.image_url ? (
                <div className="relative aspect-[4/5] w-full max-w-[200px] rounded-xl overflow-hidden border border-zinc-200">
                  <Image src={formData.image_url} alt="Preview" fill className="object-cover" sizes="200px" />
                  <button
                    type="button"
                    onClick={() => setFormData((p) => ({ ...p, image_url: "" }))}
                    className="absolute top-2 right-2 p-1 bg-white rounded-full shadow"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center aspect-[4/5] w-full max-w-[200px] rounded-xl border-2 border-dashed border-zinc-200 bg-slate-50 cursor-pointer hover:border-[#ffde5a]/50 transition-colors">
                  <Upload className="w-6 h-6 text-zinc-400 mb-2" />
                  <span className="text-[10px] font-bold text-zinc-500 text-center px-2">Upload &amp; crop</span>
                  <input type="file" accept="image/*" className="hidden" onChange={onSelectFile} />
                </label>
              )}
              {formData.image_url && (
                <label className="inline-flex items-center gap-2 text-xs font-bold text-[#ffde5a] cursor-pointer">
                  <Upload className="w-3.5 h-3.5" /> Replace image
                  <input type="file" accept="image/*" className="hidden" onChange={onSelectFile} />
                </label>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="style_tags">Tags (comma separated)</Label>
              <Input
                id="style_tags"
                value={formData.tags}
                onChange={(e) => setFormData((p) => ({ ...p, tags: e.target.value }))}
                placeholder="men, short, summer"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="style_desc">Description</Label>
              <textarea
                id="style_desc"
                value={formData.description}
                onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                rows={3}
                className="w-full rounded-xl border border-zinc-200 p-3 text-sm"
                placeholder="Short stylist notes for customers..."
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="sort_order">Sort priority</Label>
                <Input
                  id="sort_order"
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData((p) => ({ ...p, sort_order: Number(e.target.value) }))}
                />
              </div>
              <div className="flex items-end pb-2">
                <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData((p) => ({ ...p, is_active: e.target.checked }))}
                  />
                  Visible on /styles
                </label>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={saving} className="flex-1 rounded-xl font-bold h-11">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {editId ? "Update Style" : "Publish Style"}
              </Button>
              {editId && (
                <Button
                  type="button"
                  variant="ghost"
                  className="rounded-xl"
                  onClick={() => {
                    setEditId(null);
                    setFormData(emptyForm);
                  }}
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
