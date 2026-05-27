"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Filter, Edit2, Trash2, Loader2, LayoutGrid, Scissors, Sparkles, Heart, Droplet, Flower2, Activity, User, Users, PenTool, Paintbrush, Clock, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/config/supabase";
import { toast } from "sonner";
import {
  GlobalServiceIconPreview,
  GlobalServiceIconUpload,
  SERVICE_IMAGE_DIMENSION_LABEL,
} from "../../../components/admin/GlobalServiceIconUpload";

const iconMap: Record<string, any> = {
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

export default function GlobalServiceManagement() {
  const [services, setServices] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [servicesRes, categoriesRes] = await Promise.all([
        supabase.from("global_services").select("*, category:categories(name)").order("name"),
        supabase.from("categories").select("*").order("name")
      ]);

      if (servicesRes.error) throw servicesRes.error;
      if (categoriesRes.error) throw categoriesRes.error;

      setServices(servicesRes.data || []);
      setCategories(categoriesRes.data || []);
    } catch (error: any) {
      toast.error("Failed to fetch records: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void Promise.resolve().then(() => fetchData());
  }, []);

  const handleOpenDialog = (service: any = null) => {
    if (service) {
      setEditingService({ ...service });
    } else {
      setEditingService({
        name: "",
        slug: "",
        category_id: "",
        description: "",
        suggested_price: "",
        suggested_duration_minutes: 30,
        icon: "Scissors",
        icon_image_url: "",
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editingService.name || !editingService.category_id) {
      toast.error("Please fill in required fields");
      return;
    }

    setIsSaving(true);
    try {
      const basePayload = {
        name: editingService.name,
        slug: editingService.slug || editingService.name.toLowerCase().replace(/ /g, "-"),
        category_id: editingService.category_id,
        description: editingService.description || null,
        suggested_price: editingService.suggested_price || null,
        suggested_duration_minutes: Number(editingService.suggested_duration_minutes) || 30,
        icon: editingService.icon || "Scissors",
        icon_image_url: editingService.icon_image_url || null,
      };

      let error;
      if (editingService.id) {
        const { error: err } = await supabase
          .from("global_services")
          .update(basePayload)
          .eq("id", editingService.id);
        error = err;
      } else {
        const { error: err } = await supabase
          .from("global_services")
          .insert([basePayload]);
        error = err;
      }

      if (error) throw error;

      toast.success(editingService.id ? "Template updated" : "Global service created");
      setIsDialogOpen(false);
      fetchData();
    } catch (error: any) {
      const message = error.message || "Unknown error";
      if (message.includes("icon_image_url")) {
        toast.error(
          "Database missing icon_image_url column. Run packages/db/GLOBAL_SERVICES_ICON_IMAGE_PATCH.sql in Supabase SQL Editor, then try again."
        );
      } else {
        toast.error("Error saving: " + message);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure? This will remove the template but existing salon services will remain.")) return;
    
    try {
      const { error } = await supabase.from("global_services").delete().eq("id", id);
      if (error) throw error;
      toast.success("Service template deleted");
      fetchData();
    } catch (error: any) {
      toast.error("Delete failed: " + error.message);
    }
  };

  const filteredServices = services.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.category?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#1A1C29]">Global Service Catalog</h1>
          <p className="text-zinc-500 font-medium">Standardize service definitions for all salons on the platform.</p>
        </div>
        <Button 
          onClick={() => handleOpenDialog()}
          className="bg-brand hover:bg-brand-hover text-zinc-900 rounded-xl px-6 h-12 font-bold shadow-lg shadow-brand/20"
        >
          <Plus className="w-5 h-5 mr-2" />
          New Global Service
        </Button>
      </div>

      <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm overflow-hidden p-2">
        <div className="p-4 border-b border-zinc-50 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <Input 
              placeholder="Search master services..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-11 h-12 bg-zinc-50 border-none rounded-2xl font-medium focus:ring-2 focus:ring-brand/10" 
            />
          </div>
          <Button variant="outline" className="h-12 rounded-2xl px-5 border-zinc-100 font-bold text-zinc-500">
            <Filter className="w-4 h-4 mr-2" /> Filter
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-zinc-50">
                <th className="px-6 py-4 text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Master Service</th>
                <th className="px-6 py-4 text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Classification</th>
                <th className="px-6 py-4 text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Suggested Pricing</th>
                <th className="px-6 py-4 text-[11px] font-bold text-zinc-500 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-24 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-brand mx-auto mb-4" />
                    <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">Synchronizing Catalog...</p>
                  </td>
                </tr>
              ) : filteredServices.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-24 text-center">
                    <div className="max-w-xs mx-auto space-y-4">
                      <LayoutGrid className="w-12 h-12 text-zinc-800 mx-auto" />
                      <div>
                        <p className="text-zinc-500 font-bold">No global templates found</p>
                        <p className="text-zinc-500 text-xs mt-1">Initialize the master service catalog with default templates.</p>
                      </div>
                      <Button 
                        onClick={async () => {
                          try {
                            setLoading(true);
                            const { seedMarketplaceData } = await import("@/services/seedService");
                            const res = await seedMarketplaceData();
                            if (res.success) {
                              toast.success("Catalog initialized!");
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
                        Sync Global Templates
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredServices.map((service) => (
                    <tr key={service.id} className="hover:bg-zinc-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <GlobalServiceIconPreview
                            iconImageUrl={service.icon_image_url}
                            iconName={service.icon}
                            iconMap={iconMap}
                          />
                          <div>
                            <div className="font-bold text-[#1A1C29]">{service.name}</div>
                            <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">slug: {service.slug}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className="rounded-lg border-zinc-200 bg-white text-zinc-600 px-2.5 py-1 font-bold text-[10px] uppercase">
                          {service.category?.name || 'Uncategorized'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1.5 font-bold text-[#1A1C29]">
                            <Tag className="w-3.5 h-3.5 text-zinc-700" />
                            Rs. {service.suggested_price || '0.00'}
                          </div>
                          <div className="flex items-center gap-1.5 font-bold text-zinc-500">
                            <Clock className="w-3.5 h-3.5 text-zinc-700" />
                            {service.suggested_duration_minutes}m
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                           <Button 
                             variant="ghost" 
                             size="icon" 
                             onClick={() => handleOpenDialog(service)}
                             className="h-9 w-9 rounded-xl hover:bg-white hover:shadow-sm text-zinc-500 hover:text-emerald-600"
                           >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                           <Button 
                             variant="ghost" 
                             size="icon" 
                             onClick={() => handleDelete(service.id)}
                             className="h-9 w-9 rounded-xl hover:bg-white hover:shadow-sm text-zinc-500 hover:text-red-500"
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
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        {editingService && (
        <DialogContent className="sm:max-w-[600px] rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-white p-8 text-zinc-900 relative">
            <LayoutGrid className="absolute -right-4 -bottom-4 w-32 h-32 opacity-10 rotate-12" />
            <DialogHeader className="relative z-10">
              <DialogTitle className="text-2xl font-bold tracking-tight">
                {editingService?.id ? "Edit Global Template" : "Define Global Service"}
              </DialogTitle>
              <DialogDescription className="text-zinc-500 font-medium">
                Standardize this service for all registered salons in the marketplace.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-8 space-y-6 bg-white max-h-[70vh] overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Service Name *</label>
                <Input 
                  value={editingService?.name}
                  onChange={(e) => setEditingService({ ...editingService, name: e.target.value })}
                  placeholder="e.g. Classic Haircut"
                  className="h-12 bg-zinc-50 border-none rounded-xl font-medium"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Category *</label>
                <Select 
                  value={editingService?.category_id}
                  onValueChange={(val) => setEditingService({ ...editingService, category_id: val })}
                >
                  <SelectTrigger className="h-12 bg-zinc-50 border-none rounded-xl font-medium">
                    <SelectValue placeholder="Select classification">
                      {editingService?.category_id && categories.find(c => c.id === editingService.category_id) 
                        ? categories.find(c => c.id === editingService.category_id)?.name 
                        : editingService?.category_id 
                          ? <span className="text-red-500 font-semibold flex items-center gap-1">Invalid Category <Trash2 className="w-3 h-3"/></span>
                          : "Select classification"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {categories.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Service Image</label>
                <GlobalServiceIconUpload
                  value={editingService?.icon_image_url}
                  onChange={(url) =>
                    setEditingService({ ...editingService, icon_image_url: url })
                  }
                  onClear={() =>
                    setEditingService({ ...editingService, icon_image_url: "" })
                  }
                />
                <p className="text-[10px] text-zinc-400 font-medium">
                  Square service image ({SERVICE_IMAGE_DIMENSION_LABEL}) for the catalog. Lucide icon is used when no image is set.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Suggested Price (Rs.)</label>
                <Input 
                  type="number"
                  value={editingService?.suggested_price}
                  onChange={(e) => setEditingService({ ...editingService, suggested_price: e.target.value })}
                  placeholder="0.00"
                  className="h-12 bg-zinc-50 border-none rounded-xl font-medium"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Base Duration (Mins)</label>
                <Input 
                  type="number"
                  value={editingService?.suggested_duration_minutes}
                  onChange={(e) => setEditingService({ ...editingService, suggested_duration_minutes: e.target.value })}
                  placeholder="30"
                  className="h-12 bg-zinc-50 border-none rounded-xl font-medium"
                />
              </div>

              <div className="col-span-2 space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Brief Description</label>
                <Textarea 
                  value={editingService?.description}
                  onChange={(e) => setEditingService({ ...editingService, description: e.target.value })}
                  placeholder="What does this service include?"
                  className="bg-zinc-50 border-none rounded-xl font-medium min-h-[100px]"
                />
              </div>
            </div>

            <DialogFooter className="pt-4 gap-3">
              <Button 
                variant="ghost" 
                onClick={() => setIsDialogOpen(false)}
                className="flex-1 h-12 rounded-xl font-bold text-zinc-500 hover:text-zinc-600"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSave}
                disabled={isSaving}
                className="flex-[2] bg-brand hover:bg-brand-hover text-zinc-900 h-12 rounded-xl font-bold shadow-lg"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Publish Master Template"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
