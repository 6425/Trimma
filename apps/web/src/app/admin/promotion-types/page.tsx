"use client";

import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  LayoutGrid,
  Loader2,
  Sparkles,
  Gift,
  Percent,
  Tag,
  Star,
  Zap,
  Ticket,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/config/supabase";
import { toast } from "sonner";

const IconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Gift,
  Percent,
  Tag,
  Star,
  Sparkles,
  Zap,
  Ticket,
  LayoutGrid,
};

export default function PromotionTypeManagement() {
  const [promotionTypes, setPromotionTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "", slug: "", icon: "Gift", description: "" });

  const fetchPromotionTypes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("promotion_types")
        .select(`*, global_promotion_packages:global_promotion_packages(count)`)
        .order("name");

      if (error) throw error;
      setPromotionTypes(data || []);
    } catch (error: any) {
      toast.error("Failed to load promotion types: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void Promise.resolve().then(() => fetchPromotionTypes());
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return toast.error("Name is required");

    const slug = formData.slug || formData.name.toLowerCase().replace(/ /g, "-");

    try {
      setSaving(true);
      const payload = {
        name: formData.name,
        slug,
        icon: formData.icon,
        description: formData.description,
      };

      if (editId) {
        const { error } = await supabase.from("promotion_types").update(payload).eq("id", editId);
        if (error) throw error;
        toast.success("Promotion type updated");
      } else {
        const { error } = await supabase.from("promotion_types").insert([payload]);
        if (error) throw error;
        toast.success("Promotion type created");
      }

      setFormData({ name: "", slug: "", icon: "Gift", description: "" });
      setEditId(null);
      fetchPromotionTypes();
    } catch (error: any) {
      toast.error("Error saving promotion type: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this promotion type? Linked global packages may be affected.")) return;

    try {
      const { error } = await supabase.from("promotion_types").delete().eq("id", id);
      if (error) throw error;
      toast.success("Promotion type deleted");
      fetchPromotionTypes();
    } catch (error: any) {
      toast.error("Error deleting promotion type: " + error.message);
    }
  };

  const handleEdit = (item: any) => {
    setEditId(item.id);
    setFormData({
      name: item.name,
      slug: item.slug,
      icon: item.icon || "Gift",
      description: item.description || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const filteredTypes = promotionTypes.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Promotion Types</h1>
          <p className="text-zinc-500 mt-1">
            Define global promotion categories used by admin templates and salon owners.
          </p>
        </div>
        {!editId && (
          <Button
            onClick={() => {
              setEditId(null);
              setFormData({ name: "", slug: "", icon: "Gift", description: "" });
            }}
            className="bg-brand hover:bg-brand-hover text-zinc-900 rounded-xl px-6 h-12 font-bold shadow-lg shadow-brand/20 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" /> Add Promotion Type
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-sm overflow-hidden rounded-3xl">
            <div className="p-6 bg-white border-b border-zinc-100">
              <div className="relative max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-11 bg-slate-50 border-none h-11 rounded-xl"
                  placeholder="Search promotion types..."
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-50 text-[11px] uppercase tracking-widest text-zinc-500 font-bold">
                    <th className="px-8 py-5">Promotion Type</th>
                    <th className="px-8 py-5">Slug</th>
                    <th className="px-8 py-5 text-center">Global Packages</th>
                    <th className="px-8 py-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-sm bg-white">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="px-8 py-12 text-center text-zinc-500">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                        Loading promotion types...
                      </td>
                    </tr>
                  ) : filteredTypes.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-8 py-24 text-center">
                        <Gift className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
                        <p className="text-zinc-500 font-bold">No promotion types found</p>
                        <p className="text-zinc-400 text-xs mt-1">
                          Create types here, then add global promotion packages under Promotion Packages.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredTypes.map((item) => {
                      const IconComponent = IconMap[item.icon] || LayoutGrid;
                      return (
                        <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-brand shrink-0 border border-amber-100">
                                <IconComponent className="w-5 h-5" />
                              </div>
                              <div>
                                <span className="font-bold text-zinc-900 block">{item.name}</span>
                                {item.description && (
                                  <span className="text-xs text-zinc-400 line-clamp-1">{item.description}</span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6 text-zinc-500 font-mono text-xs">{item.slug}</td>
                          <td className="px-8 py-6 text-center">
                            <Badge variant="outline" className="rounded-full px-3 text-brand border-amber-200">
                              {item.global_promotion_packages?.[0]?.count || 0}
                            </Badge>
                          </td>
                          <td className="px-8 py-6 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                onClick={() => handleEdit(item)}
                                variant="ghost"
                                size="icon"
                                className="hover:text-amber-600 hover:bg-amber-50"
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                onClick={() => handleDelete(item.id)}
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

        <div>
          <Card
            className={`border-none shadow-sm p-8 rounded-3xl relative overflow-hidden ${
              editId ? "bg-amber-50 border border-brand/30" : "bg-white"
            }`}
          >
            <Gift className="absolute -right-8 -bottom-8 w-40 h-40 text-zinc-900/5 rotate-12" />
            <h3 className="text-xl font-bold mb-2 relative z-10">
              {editId ? "Update Promotion Type" : "Create Promotion Type"}
            </h3>
            <p className="text-zinc-500 text-sm mb-6 relative z-10">
              Group promotion packages (bundles, seasonal deals, memberships, etc.).
            </p>

            <form onSubmit={handleSave} className="space-y-4 relative z-10">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">
                  Name
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-slate-50 border-slate-200 h-12 rounded-xl"
                  placeholder="e.g. Seasonal Bundles"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">
                  Slug
                </label>
                <Input
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="bg-slate-50 border-slate-200 h-12 rounded-xl font-mono text-xs"
                  placeholder="e.g. seasonal-bundles"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">
                  Description
                </label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="bg-slate-50 border-slate-200 h-12 rounded-xl"
                  placeholder="Short summary for admins"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">
                  Icon (Lucide)
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {Object.keys(IconMap).map((iconName) => {
                    const Icon = IconMap[iconName];
                    return (
                      <button
                        key={iconName}
                        type="button"
                        onClick={() => setFormData({ ...formData, icon: iconName })}
                        className={`p-2 rounded-lg flex items-center justify-center border transition-all ${
                          formData.icon === iconName
                            ? "bg-brand text-zinc-900 border-brand shadow-sm"
                            : "bg-slate-50 border-slate-200 text-zinc-400 hover:bg-slate-100"
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                {editId && (
                  <Button
                    type="button"
                    onClick={() => {
                      setEditId(null);
                      setFormData({ name: "", slug: "", icon: "Gift", description: "" });
                    }}
                    variant="ghost"
                    className="flex-1 h-12 rounded-xl font-bold border border-slate-200"
                  >
                    Cancel
                  </Button>
                )}
                <Button
                  disabled={saving}
                  type="submit"
                  className={`flex-[2] h-12 rounded-xl font-bold ${
                    editId ? "bg-zinc-900 text-white hover:bg-zinc-800" : "bg-brand hover:bg-brand-hover text-zinc-900"
                  }`}
                >
                  {saving ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : editId ? "Update Type" : "Save Type"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
