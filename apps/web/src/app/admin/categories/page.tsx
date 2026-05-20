"use client";

import React, { useState, useEffect } from "react";
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Scissors,
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
  Paintbrush
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/config/supabase";
import { toast } from "sonner";

// Helper to map icon string to component
const IconMap: Record<string, any> = {
  Scissors,
  Sparkles,
  Heart,
  Droplet,
  Flower2,
  Activity,
  User,
  Users,
  PenTool,
  Paintbrush,
  LayoutGrid
};

export default function CategoryManagement() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Form State
  const [editId, setEditId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "", slug: "", icon: "" });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      // Joining with services and global_services to count them
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return toast.error("Name is required");
    
    const slug = formData.slug || formData.name.toLowerCase().replace(/ /g, "-");
    
    try {
      setSaving(true);
      if (editId) {
        const { error } = await supabase
          .from("categories")
          .update({ name: formData.name, slug, icon: formData.icon })
          .eq("id", editId);
        if (error) throw error;
        toast.success("Category updated successfully");
      } else {
        const { error } = await supabase
          .from("categories")
          .insert([{ name: formData.name, slug, icon: formData.icon }]);
        if (error) throw error;
        toast.success("Category created successfully");
      }
      setFormData({ name: "", slug: "", icon: "" });
      setEditId(null);
      fetchCategories();
    } catch (error: any) {
      toast.error("Error saving category: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure? This will delete the category and might affect linked services.")) return;
    
    try {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
      toast.success("Category deleted");
      fetchCategories();
    } catch (error: any) {
      toast.error("Error deleting category: " + error.message);
    }
  };

  const handleEdit = (cat: any) => {
    setEditId(cat.id);
    setFormData({ name: cat.name, slug: cat.slug, icon: cat.icon || "" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const filteredCategories = categories.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#1A1C29] tracking-tight">Service Categories</h1>
          <p className="text-zinc-500 mt-1">Manage core marketplace categories and SEO slugs.</p>
        </div>
        {!editId && (
          <Button 
            onClick={() => { setEditId(null); setFormData({ name: "", slug: "", icon: "" }); }}
            className="bg-[#D81E5B] hover:bg-[#BF1A50] text-white rounded-xl px-6 h-12 font-bold shadow-lg shadow-[#D81E5B]/20 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" /> Add New Category
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-sm overflow-hidden rounded-3xl">
            <div className="p-6 bg-white border-b border-zinc-100 flex items-center justify-between">
               <div className="relative flex-1 max-w-md">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                 <Input 
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                   className="pl-11 bg-zinc-50 border-none h-11 rounded-xl" 
                   placeholder="Search categories..." 
                 />
               </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-50 text-[11px] uppercase tracking-widest text-zinc-400 font-bold">
                    <th className="px-8 py-5">Category</th>
                    <th className="px-8 py-5">Slug</th>
                    <th className="px-8 py-5 text-center">Global Templates</th>
                    <th className="px-8 py-5 text-center">Salon Services</th>
                    <th className="px-8 py-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50 text-sm">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-8 py-12 text-center text-zinc-400">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                        Loading categories...
                      </td>
                    </tr>
                  ) : filteredCategories.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-8 py-24 text-center">
                        <div className="max-w-xs mx-auto space-y-4">
                          <LayoutGrid className="w-12 h-12 text-zinc-200 mx-auto" />
                          <div>
                            <p className="text-zinc-400 font-bold">No categories found</p>
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
                            className="bg-[#D81E5B] hover:bg-[#BF1A50] w-full"
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
                        <tr key={cat.id} className="hover:bg-zinc-50/50 transition-colors">
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-3">
                               <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-[#D81E5B]">
                                  <IconComponent className="w-5 h-5" />
                               </div>
                               <span className="font-bold text-[#1A1C29]">{cat.name}</span>
                            </div>
                          </td>
                          <td className="px-8 py-6 text-zinc-500 font-mono text-xs">{cat.slug}</td>
                          <td className="px-8 py-6 text-center">
                            <Badge variant="outline" className="rounded-full px-3 text-[#D81E5B] border-rose-100">
                              {cat.global_services?.[0]?.count || 0}
                            </Badge>
                          </td>
                          <td className="px-8 py-6 text-center">
                            <Badge variant="outline" className="rounded-full px-3 text-emerald-600 border-emerald-100">
                              {cat.services?.[0]?.count || 0}
                            </Badge>
                          </td>
                          <td className="px-8 py-6 text-right">
                            <div className="flex items-center justify-end gap-2 text-zinc-400">
                              <Button 
                                onClick={() => handleEdit(cat)}
                                variant="ghost" 
                                size="icon" 
                                className="hover:text-amber-600 hover:bg-amber-50"
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button 
                                onClick={() => handleDelete(cat.id)}
                                variant="ghost" 
                                size="icon" 
                                className="hover:text-rose-600 hover:bg-rose-50"
                              >
                                <Trash2 className="w-4 h-4" />
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
        </div>

        <div className="space-y-6">
          <Card className={`border-none shadow-sm p-8 rounded-3xl text-white relative overflow-hidden transition-all duration-300 ${editId ? 'bg-[#D81E5B]' : 'bg-zinc-900'}`}>
            <LayoutGrid className="absolute -right-8 -bottom-8 w-40 h-40 text-white/5 rotate-12" />
            <h3 className="text-xl font-bold mb-2">{editId ? 'Update Category' : 'Create Category'}</h3>
            <p className="text-white/60 text-sm mb-6">Add or manage a primary category for Trimma.</p>
            
            <form onSubmit={handleSave} className="space-y-4 relative z-10">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">Name</label>
                <Input 
                   value={formData.name}
                   onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                   className="bg-white/10 border-white/10 text-white h-12 rounded-xl focus:ring-white/20" 
                   placeholder="e.g. Skin Care" 
                   required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">Slug</label>
                <Input 
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="bg-white/10 border-white/10 text-white h-12 rounded-xl font-mono text-xs" 
                  placeholder="e.g. skin-care" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">Icon Name (Lucide)</label>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {Object.keys(IconMap).map((iconName) => {
                    const Icon = IconMap[iconName];
                    return (
                      <button
                        key={iconName}
                        type="button"
                        onClick={() => setFormData({ ...formData, icon: iconName })}
                        className={`p-2 rounded-lg flex items-center justify-center border transition-all ${
                          formData.icon === iconName ? 'bg-white text-[#D81E5B] border-white' : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </button>
                    );
                  })}
                </div>
                <Input 
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  className="bg-white/10 border-white/10 text-white h-12 rounded-xl" 
                  placeholder="Manual icon name..." 
                />
              </div>
              <div className="flex gap-2 pt-4">
                {editId && (
                  <Button 
                    type="button" 
                    onClick={() => { setEditId(null); setFormData({ name: "", slug: "", icon: "" }); }}
                    variant="ghost" 
                    className="flex-1 text-white hover:bg-white/10 h-12 rounded-xl font-bold"
                  >
                    Cancel
                  </Button>
                )}
                <Button 
                  disabled={saving}
                  type="submit" 
                  className={`flex-[2] h-12 rounded-xl font-bold transition-all ${editId ? 'bg-white text-[#D81E5B] hover:bg-zinc-100' : 'bg-[#D81E5B] hover:bg-[#BF1A50] text-white'}`}
                >
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : editId ? 'Update Category' : 'Save Category'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
