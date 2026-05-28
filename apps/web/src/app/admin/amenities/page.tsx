"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Filter, Edit2, Trash2, Loader2, LayoutGrid, Wind, Wifi, Car, Armchair, Sofa, Coffee, Star, Shield, Sun, CheckCircle, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { toast } from "sonner";
import {
  deleteAmenity,
  fetchAmenitiesCatalog,
  saveAmenity,
} from "@/app/actions/amenities";
import { withTimeout } from "@/lib/promise-timeout";

const iconMap: Record<string, any> = {
  Wind,
  Wifi,
  Car,
  Armchair,
  Sofa,
  Coffee,
  Star,
  Shield,
  Sun,
  CheckCircle,
  Smartphone,
  LayoutGrid
};

export default function GlobalAmenitiesManagement() {
  const [amenities, setAmenities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingAmenity, setEditingAmenity] = useState<any>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await withTimeout(
        fetchAmenitiesCatalog(),
        20000,
        "Loading timed out. Check Vercel env (SUPABASE_SERVICE_ROLE_KEY) and refresh."
      );

      if (result.success === false) {
        throw new Error(result.error);
      }

      setAmenities(result.amenities || []);
    } catch (error: any) {
      toast.error("Failed to fetch records: " + (error.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void Promise.resolve().then(() => fetchData());
  }, []);

  const handleOpenDialog = (amenity: any = null) => {
    if (amenity) {
      setEditingAmenity({ ...amenity });
    } else {
      setEditingAmenity({
        name: "",
        type: "boolean",
        icon_name: "Star"
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editingAmenity.name || !editingAmenity.type || !editingAmenity.icon_name) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsSaving(true);
    try {
      const result = await withTimeout(
        saveAmenity({
          id: editingAmenity.id,
          name: editingAmenity.name,
          type: editingAmenity.type,
          icon_name: editingAmenity.icon_name,
        }),
        25000,
        "Save timed out after 25s. Check Vercel SUPABASE_SERVICE_ROLE_KEY, then try again."
      );

      if (result.success === false) {
        throw new Error(result.error);
      }

      const saved = result.amenity;
      setAmenities((prev) => {
        if (editingAmenity.id) {
          return prev
            .map((row) => (row.id === saved.id ? saved : row))
            .sort((a, b) => a.name.localeCompare(b.name));
        }
        return [...prev, saved].sort((a, b) => a.name.localeCompare(b.name));
      });

      toast.success(editingAmenity.id ? "Amenity updated" : "Global amenity created");
      setIsDialogOpen(false);
    } catch (error: any) {
      toast.error("Error saving: " + (error.message || "Unknown error"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure? This will remove the amenity from all salons as well.")) return;
    
    try {
      const result = await withTimeout(
        deleteAmenity(id),
        20000,
        "Delete timed out. Refresh the page and try again."
      );
      if (result.success === false) throw new Error(result.error);

      setAmenities((prev) => prev.filter((row) => row.id !== id));
      toast.success("Amenity deleted");
    } catch (error: any) {
      toast.error("Delete failed: " + (error.message || "Unknown error"));
    }
  };

  const filteredAmenities = amenities.filter(a => 
    a.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#1A1C29]">Global Amenities</h1>
          <p className="text-zinc-500 font-medium">Standardize the list of amenities that salons can offer.</p>
        </div>
        <Button 
          onClick={() => handleOpenDialog()}
          className="bg-brand hover:bg-brand-hover text-zinc-900 rounded-xl px-6 h-12 font-bold shadow-lg shadow-brand/20"
        >
          <Plus className="w-5 h-5 mr-2" />
          New Global Amenity
        </Button>
      </div>

      <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm overflow-hidden p-2">
        <div className="p-4 border-b border-zinc-50 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <Input 
              placeholder="Search amenities..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-11 h-12 bg-zinc-50 border-none rounded-2xl font-medium focus:ring-2 focus:ring-brand/10" 
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-zinc-50">
                <th className="px-6 py-4 text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Amenity Name</th>
                <th className="px-6 py-4 text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Data Type</th>
                <th className="px-6 py-4 text-[11px] font-bold text-zinc-500 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {loading ? (
                <tr>
                  <td colSpan={3} className="px-6 py-24 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-brand mx-auto mb-4" />
                    <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">Loading Amenities...</p>
                  </td>
                </tr>
              ) : filteredAmenities.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-24 text-center">
                    <div className="max-w-xs mx-auto space-y-4">
                      <LayoutGrid className="w-12 h-12 text-zinc-800 mx-auto" />
                      <div>
                        <p className="text-zinc-500 font-bold">No global amenities found</p>
                        <p className="text-zinc-500 text-xs mt-1">Add your first amenity to make it available for salons.</p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAmenities.map((amenity) => {
                  const IconComp = iconMap[amenity.icon_name] || LayoutGrid;
                  return (
                    <tr key={amenity.id} className="hover:bg-zinc-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center text-zinc-500 group-hover:bg-brand/10 group-hover:text-brand transition-colors">
                            <IconComp className="w-6 h-6" />
                          </div>
                          <div>
                            <div className="font-bold text-[#1A1C29]">{amenity.name}</div>
                            <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">icon: {amenity.icon_name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className="rounded-lg border-zinc-200 bg-white text-zinc-600 px-2.5 py-1 font-bold text-[10px] uppercase">
                          {amenity.type}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                           <Button 
                             variant="ghost" 
                             size="icon" 
                             onClick={() => handleOpenDialog(amenity)}
                             className="h-9 w-9 rounded-xl hover:bg-white hover:shadow-sm text-zinc-500 hover:text-emerald-600"
                           >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                           <Button 
                             variant="ghost" 
                             size="icon" 
                             onClick={() => handleDelete(amenity.id)}
                             className="h-9 w-9 rounded-xl hover:bg-white hover:shadow-sm text-zinc-500 hover:text-red-500"
                           >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-white p-8 text-zinc-900 relative">
            <LayoutGrid className="absolute -right-4 -bottom-4 w-32 h-32 opacity-10 rotate-12" />
            <DialogHeader className="relative z-10">
              <DialogTitle className="text-2xl font-bold tracking-tight">
                {editingAmenity?.id ? "Edit Global Amenity" : "Define Global Amenity"}
              </DialogTitle>
              <DialogDescription className="text-zinc-500 font-medium">
                Make this amenity available for salons to select in their profiles.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-8 space-y-6 bg-white max-h-[70vh] overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Amenity Name *</label>
                <Input 
                  value={editingAmenity?.name}
                  onChange={(e) => setEditingAmenity({ ...editingAmenity, name: e.target.value })}
                  placeholder="e.g. Free WiFi"
                  className="h-12 bg-zinc-50 border-none rounded-xl font-medium"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Data Type *</label>
                <Select 
                  value={editingAmenity?.type || undefined}
                  onValueChange={(val) => setEditingAmenity({ ...editingAmenity, type: val })}
                >
                  <SelectTrigger className="h-12 bg-zinc-50 border-none rounded-xl font-medium">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="boolean">Yes / No (Boolean)</SelectItem>
                    <SelectItem value="number">Number (e.g. Chairs)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Icon Styling *</label>
                <Select 
                  value={editingAmenity?.icon_name || undefined}
                  onValueChange={(val) => setEditingAmenity({ ...editingAmenity, icon_name: val })}
                >
                  <SelectTrigger className="h-12 bg-zinc-50 border-none rounded-xl font-medium">
                    <SelectValue placeholder="Select icon">
                      {editingAmenity?.icon_name && iconMap[editingAmenity.icon_name] ? (
                        <div className="flex items-center gap-2 text-zinc-700">
                          {(() => {
                            const IconComp = iconMap[editingAmenity.icon_name];
                            return <IconComp className="w-4 h-4 text-brand" />;
                          })()}
                          <span>{editingAmenity.icon_name}</span>
                        </div>
                      ) : "Select icon"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="rounded-xl max-h-64">
                    {Object.keys(iconMap).map(icon => {
                      const IconComp = iconMap[icon];
                      return (
                        <SelectItem key={icon} value={icon}>
                          <div className="flex items-center gap-2">
                            <IconComp className="w-4 h-4 text-zinc-500" />
                            <span>{icon}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
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
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Publish Amenity"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
