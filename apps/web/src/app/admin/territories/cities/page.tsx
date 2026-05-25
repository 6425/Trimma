"use client";

import React, { useState, useEffect } from "react";
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Navigation,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/config/supabase";
import { toast } from "sonner";

export default function CityManagement() {
  const [cities, setCities] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [districtFilter, setDistrictFilter] = useState("all");
  
  // Form State
  const [editId, setEditId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "", slug: "", district_id: "" });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [citiesRes, districtsRes] = await Promise.all([
        supabase.from("cities").select(`*, districts(name), salons(count)`).order("name"),
        supabase.from("districts").select("*").order("name")
      ]);
      
      if (citiesRes.error) throw citiesRes.error;
      if (districtsRes.error) throw districtsRes.error;

      setCities(citiesRes.data || []);
      setDistricts(districtsRes.data || []);
    } catch (error: any) {
      toast.error("Failed to load data: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void Promise.resolve().then(() => fetchData());
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.district_id) return toast.error("Name and District are required");
    
    const slug = formData.slug || formData.name.toLowerCase().replace(/ /g, "-");
    
    try {
      setSaving(true);
      if (editId) {
        const { error } = await supabase
          .from("cities")
          .update({ name: formData.name, slug, district_id: formData.district_id })
          .eq("id", editId);
        if (error) throw error;
        toast.success("City updated successfully");
      } else {
        const { error } = await supabase
          .from("cities")
          .insert([{ name: formData.name, slug, district_id: formData.district_id }]);
        if (error) throw error;
        toast.success("City created successfully");
      }
      setFormData({ name: "", slug: "", district_id: "" });
      setEditId(null);
      fetchData();
    } catch (error: any) {
      toast.error("Error saving city: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure? This will delete the city and might affect linked salons.")) return;
    
    try {
      const { error } = await supabase.from("cities").delete().eq("id", id);
      if (error) throw error;
      toast.success("City deleted");
      fetchData();
    } catch (error: any) {
      toast.error("Error deleting city: " + error.message);
    }
  };

  const handleEdit = (city: any) => {
    setEditId(city.id);
    setFormData({ name: city.name, slug: city.slug, district_id: city.district_id });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const filteredCities = cities.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (districtFilter === "all" || c.district_id === districtFilter)
  );

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#1A1C29] tracking-tight">City Management</h1>
          <p className="text-zinc-500 mt-1">Manage the most granular level of geographic discovery.</p>
        </div>
        {!editId && (
          <Button 
            onClick={() => { setEditId(null); setFormData({ name: "", slug: "", district_id: "" }); }}
            className="bg-brand hover:bg-brand-hover text-zinc-900 rounded-xl px-6 h-12 font-bold shadow-lg shadow-brand/20 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" /> Add New City
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-sm overflow-hidden rounded-3xl">
            <div className="p-6 bg-white border-b border-zinc-100 flex flex-wrap items-center justify-between gap-4">
               <div className="relative flex-1 min-w-[200px]">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                 <Input 
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                   className="pl-11 bg-zinc-50 border-none h-11 rounded-xl" 
                   placeholder="Search cities..." 
                 />
               </div>
               <div className="flex gap-2">
                 <Select value={districtFilter} onValueChange={setDistrictFilter}>
                   <SelectTrigger className="w-[160px] h-11 bg-zinc-50 border-none rounded-xl font-bold text-zinc-600">
                      <SelectValue placeholder="District" />
                   </SelectTrigger>
                   <SelectContent>
                      <SelectItem value="all">All Districts</SelectItem>
                      {districts.map(d => (
                        <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                      ))}
                   </SelectContent>
                 </Select>
               </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-50 text-[11px] uppercase tracking-widest text-zinc-500 font-bold">
                    <th className="px-8 py-5">City Name</th>
                    <th className="px-8 py-5">District</th>
                    <th className="px-8 py-5">Slug</th>
                    <th className="px-8 py-5 text-center">Salons</th>
                    <th className="px-8 py-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50 text-sm">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-8 py-12 text-center text-zinc-500">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                        Loading cities...
                      </td>
                    </tr>
                  ) : filteredCities.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-8 py-12 text-center text-zinc-500">
                        No cities found.
                      </td>
                    </tr>
                  ) : (
                    filteredCities.map((city) => (
                      <tr key={city.id} className="hover:bg-zinc-50/50 transition-colors">
                        <td className="px-8 py-6 font-bold text-[#1A1C29]">{city.name}</td>
                        <td className="px-8 py-6">
                          <Badge variant="secondary" className="bg-zinc-100 text-zinc-600 border-none">
                            {city.districts?.name}
                          </Badge>
                        </td>
                        <td className="px-8 py-6 text-zinc-500 font-mono text-xs">{city.slug}</td>
                        <td className="px-8 py-6 text-center">
                          <span className="font-bold text-brand">
                            {city.salons?.[0]?.count || 0}
                          </span>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex items-center justify-end gap-2 text-zinc-500">
                            <Button 
                              onClick={() => handleEdit(city)}
                              variant="ghost" 
                              size="icon" 
                              className="hover:text-amber-600 hover:bg-amber-50"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button 
                              onClick={() => handleDelete(city.id)}
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
            <Navigation className="absolute -right-8 -bottom-8 w-40 h-40 text-zinc-900/5 rotate-12" />
            <h3 className="text-xl font-bold mb-2">{editId ? 'Update City' : 'Create City'}</h3>
            <p className="text-zinc-500 text-sm mb-6">Add a specific city location to the platform.</p>
            
            <form onSubmit={handleSave} className="space-y-4 relative z-10">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">Parent District</label>
                <Select 
                   value={formData.district_id} 
                   onValueChange={(val) => setFormData({ ...formData, district_id: val })}
                >
                  <SelectTrigger className="bg-slate-100 border-slate-200 text-zinc-900 h-12 rounded-xl text-left">
                    <SelectValue placeholder="Select District" />
                  </SelectTrigger>
                  <SelectContent>
                    {districts.map(d => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">City Name</label>
                <Input 
                   value={formData.name}
                   onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                   className="bg-slate-100 border-slate-200 text-zinc-900 h-12 rounded-xl focus:ring-white/20" 
                   placeholder="e.g. Colombo 05" 
                   required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">Slug (SEO)</label>
                <Input 
                   value={formData.slug}
                   onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                   className="bg-slate-100 border-slate-200 text-zinc-900 h-12 rounded-xl font-mono text-xs" 
                   placeholder="e.g. colombo-05" 
                />
              </div>
              <div className="flex gap-2 pt-4">
                {editId && (
                  <Button 
                    type="button" 
                    onClick={() => { setEditId(null); setFormData({ name: "", slug: "", district_id: "" }); }}
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
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : editId ? 'Update City' : 'Save City'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
