"use client";

import React, { useState, useEffect } from "react";
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  MapPin,
  Layers,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/config/supabase";
import { toast } from "sonner";

export default function DistrictManagement() {
  const [districts, setDistricts] = useState<any[]>([]);
  const [provinces, setProvinces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [provinceFilter, setProvinceFilter] = useState("all");
  
  // Form State
  const [editId, setEditId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "", slug: "", province_id: "" });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [districtsRes, provincesRes] = await Promise.all([
        supabase.from("districts").select(`*, provinces(name), cities(count)`).order("name"),
        supabase.from("provinces").select("*").order("name")
      ]);
      
      if (districtsRes.error) throw districtsRes.error;
      if (provincesRes.error) throw provincesRes.error;

      setDistricts(districtsRes.data || []);
      setProvinces(provincesRes.data || []);
    } catch (error: any) {
      toast.error("Failed to load data: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.province_id) return toast.error("Name and Province are required");
    
    const slug = formData.slug || formData.name.toLowerCase().replace(/ /g, "-");
    
    try {
      setSaving(true);
      if (editId) {
        const { error } = await supabase
          .from("districts")
          .update({ name: formData.name, slug, province_id: formData.province_id })
          .eq("id", editId);
        if (error) throw error;
        toast.success("District updated successfully");
      } else {
        const { error } = await supabase
          .from("districts")
          .insert([{ name: formData.name, slug, province_id: formData.province_id }]);
        if (error) throw error;
        toast.success("District created successfully");
      }
      setFormData({ name: "", slug: "", province_id: "" });
      setEditId(null);
      fetchData();
    } catch (error: any) {
      toast.error("Error saving district: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure? This will delete the district and might affect linked cities.")) return;
    
    try {
      const { error } = await supabase.from("districts").delete().eq("id", id);
      if (error) throw error;
      toast.success("District deleted");
      fetchData();
    } catch (error: any) {
      toast.error("Error deleting district: " + error.message);
    }
  };

  const handleEdit = (district: any) => {
    setEditId(district.id);
    setFormData({ name: district.name, slug: district.slug, province_id: district.province_id });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const filteredDistricts = districts.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (provinceFilter === "all" || d.province_id === provinceFilter)
  );

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#1A1C29] tracking-tight">District Management</h1>
          <p className="text-zinc-500 mt-1">Manage secondary level regions tied to provinces.</p>
        </div>
        {!editId && (
          <Button 
            onClick={() => { setEditId(null); setFormData({ name: "", slug: "", province_id: "" }); }}
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
                        <td className="px-8 py-6 font-bold text-[#1A1C29]">{district.name}</td>
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
                    onClick={() => { setEditId(null); setFormData({ name: "", slug: "", province_id: "" }); }}
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
