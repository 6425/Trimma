/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  LayoutGrid,
  Loader2,
  Sparkles,
  Heart,
  Droplet,
  Flower2,
  Activity,
  User,
  Users,
  PenTool,
  Paintbrush,
  Upload,
  Image as ImageIcon,
  X,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/config/supabase";
import { toast } from "sonner";
import {
  deleteInventoryCategory,
  fetchInventoryCategoriesCatalog,
  saveInventoryCategory,
} from "@/app/actions/inventory-categories";
import { withTimeout } from "@/lib/promise-timeout";
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import Image from "next/image";
import {
  DEFAULT_UPLOAD_EXT,
  DEFAULT_UPLOAD_MIME,
  getCroppedImageBlobNative,
  uploadFileName,
} from "@/lib/image-crop";
import { cn } from "@/lib/utils";

const CATEGORY_CROP_ASPECT = 16 / 9;

const IconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Scissors: LayoutGrid,
  Sparkles,
  Heart,
  Droplet,
  Flower2,
  Activity,
  User,
  Users,
  PenTool,
  Paintbrush,
  LayoutGrid,
  Package,
};

function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number) {
  return centerCrop(
    makeAspectCrop({ unit: "%", width: 90 }, aspect, mediaWidth, mediaHeight),
    mediaWidth,
    mediaHeight
  );
}

export default function InventoryCategoryManagement() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    icon: "",
    image_url: "",
    description: "",
  });

  const [upImg, setUpImg] = useState<string>();
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [isCropping, setIsCropping] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const result = await withTimeout(
        fetchInventoryCategoriesCatalog(),
        20000,
        "Loading timed out. Check Vercel env and refresh."
      );
      if (result.success === false) throw new Error(result.error);
      setCategories(result.categories || []);
    } catch (error: unknown) {
      toast.error(
        "Failed to load inventory categories: " +
          (error instanceof Error ? error.message : "Unknown error")
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchCategories();
  }, []);

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        setUpImg(reader.result?.toString() || "");
        setIsCropping(true);
      });
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height, CATEGORY_CROP_ASPECT));
  };

  const handleCropSave = async () => {
    if (!completedCrop || !imgRef.current) return;
    try {
      setIsUploadingImage(true);
      const imageBlob = await getCroppedImageBlobNative(imgRef.current, completedCrop, {
        maxBytes: 150 * 1024,
      });
      const fileName = uploadFileName("inv-cat", DEFAULT_UPLOAD_EXT);
      const { error } = await supabase.storage
        .from("public-assets")
        .upload(`inventory-categories/${fileName}`, imageBlob, {
          contentType: DEFAULT_UPLOAD_MIME,
          cacheControl: "3600",
          upsert: false,
        });
      if (error) throw error;
      const { data: publicUrlData } = supabase.storage
        .from("public-assets")
        .getPublicUrl(`inventory-categories/${fileName}`);
      setFormData({ ...formData, image_url: publicUrlData.publicUrl });
      setIsCropping(false);
      setUpImg(undefined);
      toast.success("Image uploaded.");
    } catch (error: unknown) {
      toast.error(
        "Failed to upload image: " + (error instanceof Error ? error.message : "Unknown error")
      );
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return toast.error("Name is required");
    try {
      setSaving(true);
      const result = await saveInventoryCategory({
        id: editId || undefined,
        name: formData.name,
        slug: formData.slug || formData.name.toLowerCase().replace(/ /g, "-"),
        icon: formData.icon,
        image_url: formData.image_url,
        description: formData.description,
      });
      if (result.success === false) throw new Error(result.error);
      toast.success(editId ? "Category updated" : "Category created");
      setFormData({ name: "", slug: "", icon: "", image_url: "", description: "" });
      setEditId(null);
      void fetchCategories();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this inventory category? Linked products may lose their category.")) return;
    try {
      const result = await deleteInventoryCategory(id);
      if (result.success === false) throw new Error(result.error);
      toast.success("Category deleted");
      void fetchCategories();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Delete failed");
    }
  };

  const handleEdit = (cat: any) => {
    setEditId(cat.id);
    setFormData({
      name: cat.name,
      slug: cat.slug,
      icon: cat.icon || "",
      image_url: cat.image_url || "",
      description: cat.description || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="relative mx-auto flex max-w-[1600px] flex-col gap-4 lg:h-[calc(100dvh-7.5rem)] lg:min-h-0">
      {isCropping && !!upImg && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-900/90 p-4 backdrop-blur-sm">
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-zinc-900">Crop Image (16:9)</h3>
              <button type="button" onClick={() => setIsCropping(false)} className="text-zinc-500">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex flex-1 items-center justify-center overflow-auto rounded-xl border border-zinc-200 bg-zinc-100">
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={CATEGORY_CROP_ASPECT}
                className="max-h-[60vh]"
              >
                <img ref={imgRef} alt="Crop" src={upImg} onLoad={onImageLoad} className="max-h-[60vh] w-auto" />
              </ReactCrop>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button type="button" variant="ghost" onClick={() => setIsCropping(false)} className="h-11">
                Cancel
              </Button>
              <Button type="button" onClick={() => void handleCropSave()} disabled={isUploadingImage} className="h-11 font-bold">
                {isUploadingImage ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Apply & Upload
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex shrink-0 flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Inventory Categories</h1>
          <p className="mt-0.5 text-sm text-zinc-500">
            Global taxonomy for retail, backbar, and disposable products.
          </p>
        </div>
        {!editId && (
          <Button
            type="button"
            onClick={() => {
              setEditId(null);
              setFormData({ name: "", slug: "", icon: "", image_url: "", description: "" });
            }}
            className="h-10 shrink-0 rounded-xl bg-brand px-5 font-bold text-zinc-900 hover:bg-brand-hover"
          >
            <Plus className="mr-2 h-4 w-4" /> Add Category
          </Button>
        )}
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(300px,380px)]">
        <Card className="flex min-h-[420px] flex-col overflow-hidden rounded-2xl border border-zinc-100 shadow-sm lg:min-h-0">
          <div className="shrink-0 border-b border-zinc-100 px-4 py-3">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-10 rounded-xl border-none bg-slate-50 pl-10 text-sm"
                placeholder="Search categories..."
              />
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-auto">
            <table className="w-full border-collapse text-left">
              <thead className="sticky top-0 z-10 bg-white">
                <tr className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                  <th className="px-4 py-3">Category</th>
                  <th className="hidden px-4 py-3 md:table-cell">Slug</th>
                  <th className="px-3 py-3 text-center">Global products</th>
                  <th className="px-3 py-3 text-center">Salon items</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 bg-white text-sm">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-zinc-500">
                      <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />
                      Loading categories...
                    </td>
                  </tr>
                ) : filteredCategories.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-16 text-center text-zinc-500">
                      No inventory categories yet. Create one using the form on the right.
                    </td>
                  </tr>
                ) : (
                  filteredCategories.map((cat) => {
                    const IconComponent = IconMap[cat.icon] || Package;
                    return (
                      <tr key={cat.id} className="transition-colors hover:bg-slate-50/70">
                        <td className="px-4 py-3">
                          <div className="flex min-w-0 items-center gap-3">
                            {cat.image_url ? (
                              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-slate-200">
                                <Image src={cat.image_url} alt={cat.name} fill className="object-cover" sizes="40px" />
                              </div>
                            ) : (
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-amber-100 bg-amber-50 text-brand">
                                <IconComponent className="h-4 w-4" />
                              </div>
                            )}
                            <span className="block truncate text-sm font-bold text-zinc-900">{cat.name}</span>
                          </div>
                        </td>
                        <td className="hidden max-w-[140px] truncate px-4 py-3 font-mono text-[11px] text-zinc-500 md:table-cell">
                          {cat.slug}
                        </td>
                        <td className="px-3 py-3 text-center">
                          <Badge variant="outline" className="rounded-full border-amber-200 px-2.5 py-0.5 text-[10px] text-brand">
                            {cat.global_products?.[0]?.count || 0}
                          </Badge>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <Badge variant="outline" className="rounded-full border-emerald-200 px-2.5 py-0.5 text-[10px] text-emerald-600">
                            {cat.salon_items?.[0]?.count || 0}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-1">
                            <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(cat)}>
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => void handleDelete(cat.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Card
          className={cn(
            "relative flex min-h-[420px] flex-col overflow-hidden rounded-2xl border shadow-sm lg:min-h-0",
            editId ? "border-brand bg-amber-50" : "border-zinc-100 bg-white"
          )}
        >
          <div className="relative z-10 shrink-0 border-b border-zinc-100/80 px-4 py-3">
            <h3 className="text-base font-bold">{editId ? "Update Category" : "Create Category"}</h3>
            <p className="mt-0.5 text-xs text-zinc-500">Platform-wide inventory taxonomy.</p>
          </div>
          <form onSubmit={handleSave} className="relative z-10 min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-3">
            <div className="space-y-1.5">
              <label className="pl-0.5 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Image (16:9)</label>
              {formData.image_url ? (
                <div className="group relative h-28 w-full overflow-hidden rounded-xl border border-slate-200">
                  <Image src={formData.image_url} alt="Category" fill className="object-cover" sizes="380px" />
                  <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                    <label className="cursor-pointer rounded-lg bg-white px-2.5 py-1 text-[10px] font-bold">
                      Replace
                      <input type="file" accept="image/*" onChange={onSelectFile} className="hidden" />
                    </label>
                    <button type="button" onClick={() => setFormData({ ...formData, image_url: "" })} className="rounded-lg bg-rose-500 px-2.5 py-1 text-[10px] font-bold text-white">
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <label className="flex h-28 w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 text-zinc-500 hover:bg-slate-100">
                  <ImageIcon className="mb-1 h-6 w-6" />
                  <span className="text-[10px] font-bold uppercase">Upload image</span>
                  <input type="file" accept="image/*" onChange={onSelectFile} className="hidden" />
                </label>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Name *</label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="h-10 rounded-xl" required />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Slug</label>
              <Input value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} className="h-10 rounded-xl font-mono text-sm" placeholder="auto-generated" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Icon key</label>
              <Input value={formData.icon} onChange={(e) => setFormData({ ...formData, icon: e.target.value })} className="h-10 rounded-xl" placeholder="Package, Sparkles..." />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Description</label>
              <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} className="rounded-xl" />
            </div>
            <div className="flex gap-2 pt-2">
              {editId && (
                <Button type="button" variant="outline" className="h-11 min-h-11 flex-1" onClick={() => { setEditId(null); setFormData({ name: "", slug: "", icon: "", image_url: "", description: "" }); }}>
                  Cancel
                </Button>
              )}
              <Button type="submit" disabled={saving} className="h-11 min-h-11 flex-1 font-bold" variant="default">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editId ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
