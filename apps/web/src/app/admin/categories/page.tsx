"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Plus, Search, Edit2, Trash2, Scissors, LayoutGrid, Loader2, Sparkles, Heart, Droplet, Flower2, Activity, User, Users, PenTool, Paintbrush, Upload, Image as ImageIcon, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/config/supabase";
import { toast } from "sonner";
import { deleteCategory, saveCategory } from "@/app/actions/categories";
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import Image from "next/image";
import {
  DEFAULT_UPLOAD_EXT,
  DEFAULT_UPLOAD_MIME,
  getCroppedImageBlobNative,
  uploadFileName,
} from "@/lib/image-crop";
import { cn } from "@/lib/utils";

const CATEGORY_CROP_ASPECT = 16 / 9;

// Helper to map icon string to component
const IconMap: Record<string, any> = {
  Scissors, Sparkles, Heart, Droplet, Flower2, Activity, User, Users, PenTool, Paintbrush, LayoutGrid
};

// Helper for initial 16:9 crop
function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number,
) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  )
}

export default function CategoryManagement() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Form State
  const [editId, setEditId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "", slug: "", icon: "", image_url: "" });

  // Cropper State
  const [upImg, setUpImg] = useState<string>();
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [isCropping, setIsCropping] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("categories")
        .select(`*, services:services(count), global_services:global_services(count)`)
        .order("name");
      
      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      toast.error("Failed to load categories: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void Promise.resolve().then(() => fetchCategories());
  }, []);

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setUpImg(reader.result?.toString() || '');
        setIsCropping(true);
      });
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height, 16 / 9));
  };

  const handleCropSave = async () => {
    if (!completedCrop || !imgRef.current) return;
    
    try {
      setIsUploadingImage(true);
      const imageBlob = await getCroppedImageBlobNative(imgRef.current, completedCrop, {
        maxBytes: 150 * 1024,
      });
      
      if (imageBlob.size > 150 * 1024) {
         toast.warning("Image is slightly above 150KB even after compression. Proceeding anyway.");
      }

      const fileName = uploadFileName("cat", DEFAULT_UPLOAD_EXT);
      
      const { data, error } = await supabase.storage
        .from('public-assets')
        .upload(`categories/${fileName}`, imageBlob, {
          contentType: DEFAULT_UPLOAD_MIME,
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      const { data: publicUrlData } = supabase.storage
        .from('public-assets')
        .getPublicUrl(`categories/${fileName}`);

      setFormData({ ...formData, image_url: publicUrlData.publicUrl });
      setIsCropping(false);
      setUpImg(undefined);
      toast.success("Image cropped and uploaded successfully!");

    } catch (error: any) {
      toast.error("Failed to upload cropped image: " + error.message);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return toast.error("Name is required");
    
    const slug = formData.slug || formData.name.toLowerCase().replace(/ /g, "-");
    
    try {
      setSaving(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        toast.error("Please sign in again at /admin/login.");
        return;
      }

      const result = await saveCategory({
        accessToken: session.access_token,
        id: editId || undefined,
        name: formData.name,
        slug,
        icon: formData.icon,
        image_url: formData.image_url,
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      toast.success(editId ? "Category updated successfully" : "Category created successfully");
      setFormData({ name: "", slug: "", icon: "", image_url: "" });
      setEditId(null);
      fetchCategories();
    } catch (error: any) {
      toast.error("Error saving category: " + (error.message || "Unknown error"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure? This will delete the category and might affect linked services.")) return;
    
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        toast.error("Please sign in again at /admin/login.");
        return;
      }

      const result = await deleteCategory(session.access_token, id);
      if (!result.success) throw new Error(result.error);

      toast.success("Category deleted");
      fetchCategories();
    } catch (error: any) {
      toast.error("Error deleting category: " + error.message);
    }
  };

  const handleEdit = (cat: any) => {
    setEditId(cat.id);
    setFormData({ name: cat.name, slug: cat.slug, icon: cat.icon || "", image_url: cat.image_url || "" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const filteredCategories = categories.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-[1600px] mx-auto relative flex flex-col gap-4 lg:h-[calc(100dvh-7.5rem)] lg:min-h-0">
      
      {/* Cropper Modal Overlay */}
      {isCropping && !!upImg && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-900/90 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
               <h3 className="text-xl font-bold text-zinc-900">Crop Image (16:9)</h3>
               <button onClick={() => setIsCropping(false)} className="text-zinc-500 hover:text-zinc-900">
                 <X className="w-5 h-5" />
               </button>
            </div>
            
            <div className="flex-1 overflow-auto bg-zinc-100 rounded-xl flex items-center justify-center border border-zinc-200">
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={CATEGORY_CROP_ASPECT}
                className="max-h-[60vh]"
              >
                <img
                  ref={imgRef}
                  alt="Crop me"
                  src={upImg}
                  onLoad={onImageLoad}
                  className="max-h-[60vh] w-auto object-contain"
                />
              </ReactCrop>
            </div>
            
            <div className="mt-6 flex justify-end gap-3">
               <Button variant="ghost" onClick={() => setIsCropping(false)} className="rounded-xl font-bold text-zinc-600 hover:bg-slate-100 h-12">Cancel</Button>
               <Button onClick={handleCropSave} disabled={isUploadingImage} className="rounded-xl font-bold bg-brand hover:bg-brand-hover text-zinc-900 h-12 px-8 shadow-md">
                 {isUploadingImage ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                 {isUploadingImage ? 'Processing...' : 'Apply & Upload'}
               </Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Service Categories</h1>
          <p className="text-zinc-500 text-sm mt-0.5">Manage marketplace categories, images, and SEO slugs.</p>
        </div>
        {!editId && (
          <Button 
            onClick={() => { setEditId(null); setFormData({ name: "", slug: "", icon: "", image_url: "" }); }}
            className="bg-brand hover:bg-brand-hover text-zinc-900 rounded-xl px-5 h-10 font-bold shadow-md shadow-brand/20 flex items-center gap-2 shrink-0"
          >
            <Plus className="w-4 h-4" /> Add Category
          </Button>
        )}
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
                placeholder="Search categories..." 
              />
            </div>
          </div>
          <div className="flex-1 min-h-0 overflow-auto">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 z-10 bg-white">
                <tr className="border-b border-slate-100 text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3 hidden md:table-cell">Slug</th>
                  <th className="px-3 py-3 text-center">Templates</th>
                  <th className="px-3 py-3 text-center">Services</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-sm bg-white">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-zinc-500">
                        <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                        <span className="text-xs font-semibold">Loading categories...</span>
                      </td>
                    </tr>
                  ) : filteredCategories.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-16 text-center">
                        <div className="max-w-xs mx-auto space-y-3">
                          <LayoutGrid className="w-10 h-10 text-zinc-300 mx-auto" />
                          <div>
                            <p className="text-zinc-500 font-bold text-sm">No categories found</p>
                            <p className="text-zinc-400 text-xs mt-1">Your marketplace database appears to be empty.</p>
                          </div>
                          <Button 
                            onClick={async () => {
                              try {
                                setLoading(true);
                                const { seedMarketplaceData } = await import("@/services/seedService");
                                const res = await seedMarketplaceData();
                                if (res.success) {
                                  toast.success("Marketplace initialized!");
                                  fetchCategories();
                                } else {
                                  toast.error("Initialization failed");
                                }
                              } catch (e) {
                                console.error(e);
                              } finally {
                                setLoading(false);
                              }
                            }}
                            className="bg-brand hover:bg-brand-hover text-zinc-900 w-full h-10 rounded-xl"
                          >
                            Initialize Marketplace
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredCategories.map((cat) => {
                      const IconComponent = IconMap[cat.icon] || LayoutGrid;
                      return (
                        <tr key={cat.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3 min-w-0">
                               {cat.image_url ? (
                                 <div className="w-10 h-10 rounded-lg bg-slate-100 overflow-hidden relative shadow-sm border border-slate-200 shrink-0">
                                   <Image src={cat.image_url} alt={cat.name} fill className="object-cover" sizes="40px" />
                                 </div>
                               ) : (
                                 <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-brand shrink-0 border border-amber-100">
                                   <IconComponent className="w-4 h-4" />
                                 </div>
                               )}
                               <div className="min-w-0">
                                 <span className="font-bold text-zinc-900 text-sm block truncate">{cat.name}</span>
                                 <span className="text-[10px] text-zinc-400 font-mono truncate block md:hidden">{cat.slug}</span>
                               </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-zinc-500 font-mono text-[11px] hidden md:table-cell max-w-[140px] truncate">{cat.slug}</td>
                          <td className="px-3 py-3 text-center">
                            <Badge variant="outline" className="rounded-full px-2.5 py-0.5 text-[10px] text-brand border-amber-200">
                              {cat.global_services?.[0]?.count || 0}
                            </Badge>
                          </td>
                          <td className="px-3 py-3 text-center">
                            <Badge variant="outline" className="rounded-full px-2.5 py-0.5 text-[10px] text-emerald-600 border-emerald-200">
                              {cat.services?.[0]?.count || 0}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1 text-zinc-500">
                              <Button 
                                onClick={() => handleEdit(cat)}
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 hover:text-amber-600 hover:bg-amber-50"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </Button>
                              <Button 
                                onClick={() => handleDelete(cat.id)}
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 hover:text-rose-600 hover:bg-rose-50"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
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
            "border shadow-sm rounded-2xl text-zinc-900 relative overflow-hidden flex flex-col min-h-[420px] lg:min-h-0 transition-all duration-300",
            editId ? "bg-amber-50 border-brand" : "bg-white border-zinc-100"
          )}
        >
            <LayoutGrid className="absolute -right-6 -bottom-6 w-28 h-28 text-zinc-900/5 rotate-12 pointer-events-none" />
            <div className="px-4 py-3 border-b border-zinc-100/80 shrink-0 relative z-10">
              <h3 className="text-base font-bold">{editId ? 'Update Category' : 'Create Category'}</h3>
              <p className="text-zinc-500 text-xs mt-0.5">Add or manage a primary category for Trimma.</p>
            </div>
            
            <form onSubmit={handleSave} className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-3 relative z-10">
              
              <div className="space-y-1.5">
                 <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-0.5">Category Image (16:9)</label>
                 <div className="relative">
                   {formData.image_url ? (
                     <div className="relative w-full h-28 rounded-xl overflow-hidden border border-slate-200 group">
                       <Image src={formData.image_url} alt="Category" fill className="object-cover" sizes="380px" />
                       <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <label className="cursor-pointer bg-white text-zinc-900 px-2.5 py-1 rounded-lg text-[10px] font-bold shadow-sm">
                            <Upload className="w-3 h-3 inline mr-1" /> Replace
                            <input type="file" accept="image/*" onChange={onSelectFile} className="hidden" />
                          </label>
                          <button type="button" onClick={() => setFormData({ ...formData, image_url: "" })} className="bg-rose-500 text-white px-2.5 py-1 rounded-lg text-[10px] font-bold shadow-sm">
                            Remove
                          </button>
                       </div>
                     </div>
                   ) : (
                     <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer text-zinc-500 group">
                       <ImageIcon className="w-6 h-6 mb-1 text-zinc-400 group-hover:text-brand transition-colors" />
                       <span className="text-xs font-semibold">Upload Image</span>
                       <span className="text-[9px] uppercase tracking-widest mt-0.5">JPEG • Max 150KB • 16:9</span>
                       <input type="file" accept="image/*" onChange={onSelectFile} className="hidden" />
                     </label>
                   )}
                 </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-0.5">Name</label>
                  <Input 
                     value={formData.name}
                     onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                     className="bg-slate-50 border-slate-200 text-zinc-900 h-10 rounded-xl text-sm focus:ring-brand/50 focus:border-brand/50" 
                     placeholder="e.g. Skin Care" 
                     required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-0.5">Slug</label>
                  <Input 
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="bg-slate-50 border-slate-200 text-zinc-900 h-10 rounded-xl font-mono text-xs focus:ring-brand/50 focus:border-brand/50" 
                    placeholder="e.g. skin-care" 
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-0.5">Fallback Icon (Lucide)</label>
                <div className="grid grid-cols-6 gap-1.5">
                  {Object.keys(IconMap).map((iconName) => {
                    const Icon = IconMap[iconName];
                    return (
                      <button
                        key={iconName}
                        type="button"
                        onClick={() => setFormData({ ...formData, icon: iconName })}
                        className={`p-1.5 rounded-md flex items-center justify-center border transition-all ${
                          formData.icon === iconName ? 'bg-brand text-zinc-900 border-brand shadow-sm' : 'bg-slate-50 border-slate-200 text-zinc-400 hover:bg-slate-100 hover:text-zinc-600'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </button>
                    );
                  })}
                </div>
                <Input 
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  className="bg-slate-50 border-slate-200 text-zinc-900 h-9 rounded-xl text-xs font-mono focus:ring-brand/50 focus:border-brand/50" 
                  placeholder="Manual icon name..." 
                />
              </div>

              <div className="flex gap-2 pt-1 sticky bottom-0 bg-inherit pb-1">
                {editId && (
                  <Button
                    type="button"
                    onClick={() => {
                      setEditId(null);
                      setFormData({ name: "", slug: "", icon: "", image_url: "" });
                    }}
                    variant="ghost"
                    className="flex-1 text-zinc-900 hover:bg-slate-100 h-10 rounded-xl font-bold border border-slate-200 text-xs"
                  >
                    Cancel
                  </Button>
                )}
                <Button
                  disabled={saving || isUploadingImage}
                  type="submit"
                  className={cn(
                    "flex-[2] h-10 rounded-xl font-bold text-sm transition-all shadow-md",
                    editId
                      ? "bg-zinc-900 text-white hover:bg-zinc-800"
                      : "bg-brand hover:bg-brand-hover text-zinc-900"
                  )}
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                  ) : editId ? (
                    "Update Category"
                  ) : (
                    "Save Category"
                  )}
                </Button>
              </div>
            </form>
        </Card>
      </div>
    </div>
  );
}
