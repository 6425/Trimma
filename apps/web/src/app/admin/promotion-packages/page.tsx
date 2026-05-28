"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Loader2,
  LayoutGrid,
  Gift,
  Percent,
  Tag,
  Star,
  Sparkles,
  Zap,
  Ticket,
} from "lucide-react";
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
import { toast } from "sonner";
import {
  deletePromotionPackage,
  fetchPromotionPackagesCatalog,
  savePromotionPackage,
} from "@/app/actions/promotion-packages";
import { withTimeout } from "@/lib/promise-timeout";
import {
  getPromotionPeriodLabel,
  getRemainingDaysLabel,
  validatePromotionDates,
  toDateInputValue,
} from "@/lib/promotion-package-dates";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Gift,
  Percent,
  Tag,
  Star,
  Sparkles,
  Zap,
  Ticket,
  LayoutGrid,
};

function parseIncludedServices(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function formatIncludedServices(services: string[] | null | undefined): string {
  return (services || []).join("\n");
}

export default function GlobalPromotionPackageManagement() {
  const [packages, setPackages] = useState<any[]>([]);
  const [promotionTypes, setPromotionTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingPackage, setEditingPackage] = useState<any>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await withTimeout(
        fetchPromotionPackagesCatalog(),
        20000,
        "Loading timed out. Check Vercel env (SUPABASE_SERVICE_ROLE_KEY) or run PROMOTION_PACKAGES_PATCH.sql."
      );

      if (!result.success) {
        throw new Error(result.error);
      }

      setPackages(result.packages || []);
      setPromotionTypes(result.promotionTypes || []);
    } catch (error: any) {
      toast.error("Failed to fetch records: " + (error.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void Promise.resolve().then(() => fetchData());
  }, []);

  const handleOpenDialog = (pkg: any = null) => {
    if (pkg) {
      setEditingPackage({
        id: pkg.id,
        name: pkg.name || "",
        slug: pkg.slug || "",
        promotion_type_id: pkg.promotion_type_id || "",
        description: pkg.description || "",
        package_price: pkg.package_price ?? "",
        original_price: pkg.original_price ?? "",
        included_services_text: formatIncludedServices(pkg.included_services),
        start_date: toDateInputValue(pkg.start_date),
        end_date: toDateInputValue(pkg.end_date),
        is_active: pkg.is_active !== false,
      });
    } else {
      setEditingPackage({
        name: "",
        slug: "",
        promotion_type_id: "",
        description: "",
        package_price: "",
        original_price: "",
        included_services_text: "",
        start_date: "",
        end_date: "",
        is_active: true,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editingPackage.name || !editingPackage.promotion_type_id) {
      toast.error("Please fill in required fields");
      return;
    }

    const dateError = validatePromotionDates(
      editingPackage.start_date || "",
      editingPackage.end_date || ""
    );
    if (dateError) {
      toast.error(dateError);
      return;
    }

    setIsSaving(true);
    try {
      const included_services = parseIncludedServices(editingPackage.included_services_text || "");
      const selectedType = promotionTypes.find((type) => type.id === editingPackage.promotion_type_id);

      const result = await withTimeout(
        savePromotionPackage({
          id: editingPackage.id,
          name: editingPackage.name,
          slug: editingPackage.slug,
          promotion_type_id: editingPackage.promotion_type_id,
          description: editingPackage.description,
          package_price: editingPackage.package_price,
          original_price: editingPackage.original_price,
          included_services,
          icon: selectedType?.icon || "Gift",
          start_date: editingPackage.start_date,
          end_date: editingPackage.end_date,
          is_active: editingPackage.is_active !== false,
        }),
        25000,
        "Save timed out after 25s. Check Vercel SUPABASE_SERVICE_ROLE_KEY, then try again."
      );

      if (!result.success) {
        throw new Error(result.error);
      }

      const saved = result.pkg;
      const promotionType = promotionTypes.find((type) => type.id === saved.promotion_type_id);
      const nextRow = {
        ...saved,
        promotion_type: promotionType
          ? { name: promotionType.name, icon: promotionType.icon }
          : null,
      };

      setPackages((prev) => {
        if (editingPackage.id) {
          return prev.map((row) => (row.id === saved.id ? nextRow : row));
        }
        return [...prev, nextRow].sort((a, b) => a.name.localeCompare(b.name));
      });

      toast.success(editingPackage.id ? "Promotion package updated" : "Global promotion package created");
      setIsDialogOpen(false);
    } catch (error: any) {
      toast.error("Error saving: " + (error.message || "Unknown error"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this global promotion package template?")) return;

    try {
      const result = await withTimeout(
        deletePromotionPackage(id),
        20000,
        "Delete timed out. Refresh the page and try again."
      );
      if (!result.success) throw new Error(result.error);

      setPackages((prev) => prev.filter((row) => row.id !== id));
      toast.success("Promotion package template deleted");
    } catch (error: any) {
      toast.error("Delete failed: " + error.message);
    }
  };

  const filteredPackages = packages.filter(
    (pkg) =>
      pkg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pkg.promotion_type?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getSavingsLabel = (pkg: any) => {
    const original = parseFloat(pkg.original_price) || 0;
    const price = parseFloat(pkg.package_price) || 0;
    if (original <= price) return null;
    return `Save LKR ${(original - price).toLocaleString()}`;
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#1A1C29]">Global Promotion Packages</h1>
          <p className="text-zinc-500 font-medium">
            Standardize promotional bundles that salon owners can publish within their plan limits.
          </p>
        </div>
        <Button
          onClick={() => handleOpenDialog()}
          className="bg-brand hover:bg-brand-hover text-zinc-900 rounded-xl px-6 h-12 font-bold shadow-lg shadow-brand/20"
        >
          <Plus className="w-5 h-5 mr-2" />
          New Promotion Package
        </Button>
      </div>

      <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm overflow-hidden p-2">
        <div className="p-4 border-b border-zinc-50">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <Input
              placeholder="Search promotion packages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-11 h-12 bg-zinc-50 border-none rounded-2xl font-medium"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-zinc-50">
                <th className="px-6 py-4 text-[11px] font-bold text-zinc-500 uppercase tracking-widest">
                  Promotion Package
                </th>
                <th className="px-6 py-4 text-[11px] font-bold text-zinc-500 uppercase tracking-widest">
                  Promotion Type
                </th>
                <th className="px-6 py-4 text-[11px] font-bold text-zinc-500 uppercase tracking-widest">
                  Pricing
                </th>
                <th className="px-6 py-4 text-[11px] font-bold text-zinc-500 uppercase tracking-widest">
                  Tentative Period
                </th>
                <th className="px-6 py-4 text-[11px] font-bold text-zinc-500 uppercase tracking-widest text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-24 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-brand mx-auto mb-4" />
                    <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">
                      Synchronizing promotion catalog...
                    </p>
                  </td>
                </tr>
              ) : filteredPackages.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-24 text-center">
                    <Gift className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
                    <p className="text-zinc-500 font-bold">No promotion packages found</p>
                    <p className="text-zinc-400 text-xs mt-1">
                      Create promotion types first, then add global package templates here.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredPackages.map((pkg) => {
                  const IconComp = iconMap[pkg.promotion_type?.icon || pkg.icon] || LayoutGrid;
                  const savings = getSavingsLabel(pkg);
                  return (
                    <tr key={pkg.id} className="hover:bg-zinc-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center text-zinc-500 group-hover:bg-brand/10 group-hover:text-brand transition-colors">
                            <IconComp className="w-6 h-6" />
                          </div>
                          <div>
                            <div className="font-bold text-[#1A1C29]">{pkg.name}</div>
                            <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">
                              {(pkg.included_services || []).length} services included
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          variant="outline"
                          className="rounded-lg border-zinc-200 bg-white text-zinc-600 px-2.5 py-1 font-bold text-[10px] uppercase"
                        >
                          {pkg.promotion_type?.name || "Uncategorized"}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-[#1A1C29]">
                          LKR {parseFloat(pkg.package_price || 0).toLocaleString()}
                        </div>
                        {savings && (
                          <div className="text-[10px] font-bold text-emerald-600">{savings}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs font-semibold text-zinc-700">
                          {getPromotionPeriodLabel(pkg.start_date, pkg.end_date)}
                        </div>
                        <div className="text-[10px] font-bold text-sky-700 mt-1">
                          {getRemainingDaysLabel(pkg.end_date)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog(pkg)}
                            className="h-9 w-9 rounded-xl hover:bg-white hover:shadow-sm text-zinc-500 hover:text-emerald-600"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(pkg.id)}
                            className="h-9 w-9 rounded-xl hover:bg-white hover:shadow-sm text-zinc-500 hover:text-red-500"
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
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        {editingPackage && (
        <DialogContent className="sm:max-w-[640px] rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-white p-8 text-zinc-900 relative">
            <Gift className="absolute -right-4 -bottom-4 w-32 h-32 opacity-10 rotate-12" />
            <DialogHeader className="relative z-10">
              <DialogTitle className="text-2xl font-bold tracking-tight">
                {editingPackage?.id ? "Edit Promotion Package" : "Define Promotion Package"}
              </DialogTitle>
              <DialogDescription className="text-zinc-500 font-medium">
                Salon owners can import and publish this template within their subscription limits.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-8 space-y-6 bg-white max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                  Package Name *
                </label>
                <Input
                  value={editingPackage?.name || ""}
                  onChange={(e) => setEditingPackage({ ...editingPackage, name: e.target.value })}
                  placeholder="e.g. Bridal Glow Premium Bundle"
                  className="h-12 bg-zinc-50 border-none rounded-xl font-medium"
                />
              </div>

              <div className="col-span-2 space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                  Promotion Type *
                </label>
                <Select
                  value={editingPackage?.promotion_type_id || undefined}
                  onValueChange={(val) => setEditingPackage({ ...editingPackage, promotion_type_id: val })}
                >
                  <SelectTrigger className="h-12 bg-zinc-50 border-none rounded-xl font-medium">
                    <SelectValue placeholder="Select promotion type">
                      {editingPackage?.promotion_type_id &&
                      promotionTypes.find((type) => type.id === editingPackage.promotion_type_id) ? (
                        <span>
                          {promotionTypes.find((type) => type.id === editingPackage.promotion_type_id)?.name}
                        </span>
                      ) : (
                        "Select promotion type"
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {promotionTypes.map((type) => {
                      const TypeIcon = iconMap[type.icon] || Gift;
                      return (
                        <SelectItem key={type.id} value={type.id}>
                          <div className="flex items-center gap-2">
                            <TypeIcon className="w-4 h-4 text-brand" />
                            <span>{type.name}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-zinc-400 pl-1">
                  Package icon is inherited from the selected promotion type.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                  Package Price (LKR)
                </label>
                <Input
                  type="number"
                  value={editingPackage?.package_price || ""}
                  onChange={(e) => setEditingPackage({ ...editingPackage, package_price: e.target.value })}
                  placeholder="18500"
                  className="h-12 bg-zinc-50 border-none rounded-xl font-medium"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                  Original Price (LKR)
                </label>
                <Input
                  type="number"
                  value={editingPackage?.original_price || ""}
                  onChange={(e) => setEditingPackage({ ...editingPackage, original_price: e.target.value })}
                  placeholder="22700"
                  className="h-12 bg-zinc-50 border-none rounded-xl font-medium"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                  Start Date
                </label>
                <Input
                  type="date"
                  value={editingPackage?.start_date || ""}
                  onChange={(e) => setEditingPackage({ ...editingPackage, start_date: e.target.value })}
                  className="h-12 bg-zinc-50 border-none rounded-xl font-medium"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                  End Date
                </label>
                <Input
                  type="date"
                  value={editingPackage?.end_date || ""}
                  onChange={(e) => setEditingPackage({ ...editingPackage, end_date: e.target.value })}
                  className="h-12 bg-zinc-50 border-none rounded-xl font-medium"
                />
              </div>
              <div className="col-span-2">
                <p className="text-[10px] text-zinc-400 pl-1">
                  Tentative promotion window copied to salon packages on import.{" "}
                  {editingPackage?.end_date
                    ? getRemainingDaysLabel(editingPackage.end_date)
                    : "Set an end date to show remaining days."}
                </p>
              </div>

              <div className="col-span-2 space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                  Included Services (one per line)
                </label>
                <Textarea
                  value={editingPackage?.included_services_text || ""}
                  onChange={(e) =>
                    setEditingPackage({ ...editingPackage, included_services_text: e.target.value })
                  }
                  placeholder={"Luxury Hair Spa\nComplete Hair Makeover\nClassic Mani-Pedi"}
                  className="bg-zinc-50 border-none rounded-xl font-medium min-h-[120px]"
                />
              </div>

              <div className="col-span-2 space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                  Description
                </label>
                <Textarea
                  value={editingPackage?.description || ""}
                  onChange={(e) => setEditingPackage({ ...editingPackage, description: e.target.value })}
                  placeholder="What makes this promotional package special?"
                  className="bg-zinc-50 border-none rounded-xl font-medium min-h-[80px]"
                />
              </div>
            </div>

            <DialogFooter className="pt-4 gap-3">
              <Button
                variant="ghost"
                onClick={() => setIsDialogOpen(false)}
                className="flex-1 h-12 rounded-xl font-bold text-zinc-500"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-[2] bg-brand hover:bg-brand-hover text-zinc-900 h-12 rounded-xl font-bold shadow-lg"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  "Publish Global Package"
                )}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
