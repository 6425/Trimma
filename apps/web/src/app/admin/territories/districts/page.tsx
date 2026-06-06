"use client";

import React, { useState, useEffect } from "react";
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  MapPin,
  Layers,
  Loader2,
  Upload,
  Image as ImageIcon,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  deleteDistrict,
  fetchDistrictsCatalog,
  saveDistrict,
} from "@/app/actions/admin-territories";
import { withTimeout } from "@/lib/promise-timeout";
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import Image from "next/image";
import { supabase } from "@/config/supabase";
import {
  DEFAULT_UPLOAD_EXT,
  DEFAULT_UPLOAD_MIME,
  getCroppedImageBlobNative,
  uploadFileName,
} from "@/lib/image-crop";

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

export default function DistrictManagement() {
  const [districts, setDistricts] = useState<any[]>([]);
  const [provinces, setProvinces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [provinceFilter, setProvinceFilter] = useState("all");
  
  // Form State
  const [editId, setEditId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "", slug: "", province_id: "", image_url: "" });

  // Cropper State
  const [upImg, setUpImg] = useState<string>();
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [isCropping, setIsCropping] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const result = await withTimeout(
        fetchDistrictsCatalog(),
        20000,
        "Loading timed out. Check Vercel env (SUPABASE_SERVICE_ROLE_KEY) and refresh."
      );

      if (result.success === false) throw new Error(result.error);
      setDistricts(result.districts || []);
      setProvinces(result.provinces || []);
    } catch (error: any) {
      toast.error("Failed to load data: " + (error.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void Promise.resolve().then(() => fetchData());
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

      const fileName = uploadFileName("district", DEFAULT_UPLOAD_EXT);
      
      const { data, error } = await supabase.storage
        .from('public-assets')
        .upload(`districts/${fileName}`, imageBlob, {
          contentType: DEFAULT_UPLOAD_MIME,
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      const { data: publicUrlData } = supabase.storage
        .from('public-assets')
        .getPublicUrl(`districts/${fileName}`);

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
    if (!formData.name || !formData.province_id) return toast.error("Name and Province are required");

    try {
      setSaving(true);

      const result = await withTimeout(
        saveDistrict({
          id: editId || undefined,
          name: formData.name,
          slug: formData.slug || undefined,
          province_id: formData.province_id,
          image_url: formData.image_url || null,
        }),
        25000,
        "Save timed out after 25s. Check Vercel SUPABASE_SERVICE_ROLE_KEY, then try again."
      );

      if (result.success === false) throw new Error(result.error);

      const province = provinces.find((p) => p.id === formData.province_id);
      const existing = editId ? districts.find((d) => d.id === editId) : null;
      const saved = {
        ...result.district,
        provinces: province || null,
        cities: existing?.cities || [{ count: 0 }],
      };

      setDistricts((prev) => {
        if (editId) {
          return prev
            .map((row) => (row.id === saved.id ? saved : row))
            .sort((a, b) => a.name.localeCompare(b.name));
        }
        return [...prev, saved].sort((a, b) => a.name.localeCompare(b.name));
      });

      toast.success(editId ? "District updated successfully" : "District created successfully");
      setFormData({ name: "", slug: "", province_id: "", image_url: "" });
      setEditId(null);
    } catch (error: any) {
      toast.error("Error saving district: " + (error.message || "Unknown error"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure? This will delete the district and might affect linked cities.")) return;

    try {
      const result = await withTimeout(
        deleteDistrict(id),
        20000,
        "Delete timed out. Refresh the page and try again."
      );
      if (result.success === false) throw new Error(result.error);

      setDistricts((prev) => prev.filter((row) => row.id !== id));
      toast.success("District deleted");
    } catch (error: any) {
      toast.error("Error deleting district: " + (error.message || "Unknown error"));
    }
  };

  const handleEdit = (district: any) => {
    setEditId(district.id);
    setFormData({ name: district.name, slug: district.slug, province_id: district.province_id, image_url: district.image_url || "" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const filteredDistricts = districts.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (provinceFilter === "all" || d.province_id === provinceFilter)
  );

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto relative">
      
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
                aspect={16 / 9}
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

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#1A1C29] tracking-tight">District Management</h1>
          <p className="text-zinc-500 mt-1">Manage secondary level regions tied to provinces.</p>
        </div>
        {!editId && (
          <Button 
            onClick={() => { setEditId(null); setFormData({ name: "", slug: "", province_id: "", image_url: "" }); }}
            className="bg-brand hover:bg-brand-hover text-zinc-900 rounded-xl px-6 h-12 font-bold shadow-lg shadow-brand/20 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" /> Add New District
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-sm overflow-hidden rounded-3xl">
            <div className="p-6 bg-white border-b border-zinc-100 flex items-center justify-between gap-4">
               <div className="relative flex-1">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                 <Input 
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                   className="pl-11 bg-zinc-50 border-none h-11 rounded-xl" 
                   placeholder="Search districts..." 
                 />
               </div>
               <Select value={provinceFilter} onValueChange={setProvinceFilter}>
                 <SelectTrigger className="w-[200px] h-11 bg-zinc-50 border-none rounded-xl font-bold text-zinc-600">
                    <SelectValue placeholder="All Provinces" />
                 </SelectTrigger>
                 <SelectContent>
                    <SelectItem value="all">All Provinces</SelectItem>
                    {provinces.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                 </SelectContent>
               </Select>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-50 text-[11px] uppercase tracking-widest text-zinc-500 font-bold">
                    <th className="px-8 py-5">District Name</th>
                    <th className="px-8 py-5">Province</th>
                    <th className="px-8 py-5">Slug</th>
                    <th className="px-8 py-5 text-center">Cities</th>
                    <th className="px-8 py-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50 text-sm">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-8 py-12 text-center text-zinc-500">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                        Loading districts...
                      </td>
                    </tr>
                  ) : filteredDistricts.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-8 py-24 text-center">
                        <div className="max-w-xs mx-auto space-y-4">
                          <MapPin className="w-12 h-12 text-zinc-800 mx-auto" />
                          <div>
                            <p className="text-zinc-500 font-bold">No districts found</p>
                            <p className="text-zinc-500 text-xs mt-1">Populate your districts mapped to provinces.</p>
                          </div>
                          <Button 
                            onClick={async () => {
                              try {
                                setLoading(true);
                                const { seedMarketplaceData } = await import("@/services/seedService");
                                const res = await seedMarketplaceData();
                                if (res.success) {
                                  toast.success("Districts initialized!");
                                  fetchData();
                                } else {
                                  toast.error("Initialization failed");
                                }
                              } catch (e) {
                                console.error(e);
                              } finally {
                                setLoading(false);
                              }
                            }}
                            className="bg-brand hover:bg-brand-hover w-full"
                          >
                            Sync Districts
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredDistricts.map((district) => (
                      <tr key={district.id} className="hover:bg-zinc-50/50 transition-colors">
                        <td className="px-8 py-6">
                            <div className="flex items-center gap-4">
                               {district.image_url ? (
                                 <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden relative shadow-sm border border-slate-200 shrink-0">
                                   <Image src={district.image_url} alt={district.name} fill className="object-cover" />
                                 </div>
                               ) : (
                                 <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-zinc-400 shrink-0 border border-slate-200">
                                   <MapPin className="w-5 h-5" />
                                 </div>
                               )}
                               <span className="font-bold text-[#1A1C29]">{district.name}</span>
                            </div>
                        </td>
                        <td className="px-8 py-6">
                          <Badge variant="secondary" className="bg-zinc-100 text-zinc-600 border-none">
                            {district.provinces?.name}
                          </Badge>
                        </td>
                        <td className="px-8 py-6 text-zinc-500 font-mono text-xs">{district.slug}</td>
                        <td className="px-8 py-6 text-center">
                          <span className="font-bold text-zinc-600">
                            {district.cities?.[0]?.count || 0}
                          </span>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex items-center justify-end gap-2 text-zinc-500">
                            <Button 
                              onClick={() => handleEdit(district)}
                              variant="ghost" 
                              size="icon" 
                              className="hover:text-amber-600 hover:bg-amber-50"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button 
                              onClick={() => handleDelete(district.id)}
                              variant="ghost" 
                              size="icon" 
                              className="hover:text-rose-600 hover:bg-rose-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className={`border-none shadow-sm p-8 rounded-3xl text-zinc-900 relative overflow-hidden transition-all duration-300 ${editId ? 'bg-brand' : 'bg-slate-50'}`}>
            <Layers className="absolute -right-8 -bottom-8 w-40 h-40 text-zinc-900/5 rotate-12" />
            <h3 className="text-xl font-bold mb-2">{editId ? 'Update District' : 'Create District'}</h3>
            <p className="text-zinc-500 text-sm mb-6">Link a district to a parent province.</p>
            
            <form onSubmit={handleSave} className="space-y-4 relative z-10">
              <div className="space-y-2">
                 <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">District Map Image (16:9)</label>
                 <div className="relative">
                   {formData.image_url ? (
                     <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-slate-200 mb-3 group">
                       <Image src={formData.image_url} alt="District" fill className="object-cover" />
                       <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <label className="cursor-pointer bg-white text-zinc-900 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm hover:scale-105 transition-transform">
                            <Upload className="w-3 h-3 inline mr-1" /> Replace
                            <input type="file" accept="image/*" onChange={onSelectFile} className="hidden" />
                          </label>
                          <button type="button" onClick={() => setFormData({ ...formData, image_url: "" })} className="bg-rose-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm hover:scale-105 transition-transform">
                            Remove
                          </button>
                       </div>
                     </div>
                   ) : (
                     <label className="flex flex-col items-center justify-center w-full aspect-video border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer text-zinc-500 group">
                       <ImageIcon className="w-8 h-8 mb-2 text-zinc-400 group-hover:text-brand transition-colors" />
                       <span className="text-sm font-semibold">Upload Image</span>
                       <span className="text-[10px] uppercase tracking-widest mt-1">JPEG • Max 150KB • 16:9</span>
                       <input type="file" accept="image/*" onChange={onSelectFile} className="hidden" />
                     </label>
                   )}
                 </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">Parent Province</label>
                <Select 
                  value={formData.province_id} 
                  onValueChange={(val) => setFormData({ ...formData, province_id: val })}
                >
                  <SelectTrigger className="bg-slate-100 border-slate-200 text-zinc-900 h-12 rounded-xl">
                    <SelectValue placeholder="Select Province" />
                  </SelectTrigger>
                  <SelectContent>
                    {provinces.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">District Name</label>
                <Input 
                   value={formData.name}
                   onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                   className="bg-slate-100 border-slate-200 text-zinc-900 h-12 rounded-xl focus:ring-white/20" 
                   placeholder="e.g. Colombo District" 
                   required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">Slug (SEO)</label>
                <Input 
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="bg-slate-100 border-slate-200 text-zinc-900 h-12 rounded-xl font-mono text-xs" 
                  placeholder="e.g. colombo-district" 
                />
              </div>
              <div className="flex gap-2 pt-4">
                {editId && (
                  <Button 
                    type="button" 
                    onClick={() => { setEditId(null); setFormData({ name: "", slug: "", province_id: "", image_url: "" }); }}
                    variant="ghost" 
                    className="flex-1 text-zinc-900 hover:bg-slate-100 h-12 rounded-xl font-bold"
                  >
                    Cancel
                  </Button>
                )}
                <Button 
                  disabled={saving}
                  type="submit" 
                  className={`flex-[2] h-12 rounded-xl font-bold transition-all ${editId ? 'bg-white text-brand hover:bg-zinc-100' : 'bg-brand hover:bg-brand-hover text-zinc-900'}`}
                >
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : editId ? 'Update District' : 'Save District'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
