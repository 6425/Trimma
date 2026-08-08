"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Loader2,
  LayoutGrid,
  Package,
  Tag,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
  deleteGlobalInventoryProduct,
  fetchGlobalInventoryProductsCatalog,
  saveGlobalInventoryProduct,
} from "@/app/actions/global-inventory-products";
import { withTimeout } from "@/lib/promise-timeout";
import {
  GlobalServiceIconPreview,
  GlobalServiceIconUpload,
  SERVICE_IMAGE_DIMENSION_LABEL,
} from "@/components/admin/GlobalServiceIconUpload";

const iconMap = { Package, LayoutGrid, Tag };

type ProductForm = {
  id?: string;
  name: string;
  slug: string;
  category_id: string;
  brand: string;
  description: string;
  unit: string;
  suggested_cost_price: string;
  suggested_retail_price: string;
  icon_image_url: string;
  is_active: boolean;
};

const emptyForm: ProductForm = {
  name: "",
  slug: "",
  category_id: "",
  brand: "",
  description: "",
  unit: "pcs",
  suggested_cost_price: "",
  suggested_retail_price: "",
  icon_image_url: "",
  is_active: true,
};

export default function GlobalInventoryProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState<ProductForm>(emptyForm);

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await withTimeout(
        fetchGlobalInventoryProductsCatalog(),
        20000,
        "Loading timed out."
      );
      if (result.success === false) throw new Error(result.error);
      setProducts(result.products || []);
      setCategories(result.categories || []);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to load catalog");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, []);

  const openDialog = (product: any = null) => {
    if (product) {
      setForm({
        id: product.id,
        name: product.name || "",
        slug: product.slug || "",
        category_id: product.category_id || "",
        brand: product.brand || "",
        description: product.description || "",
        unit: product.unit || "pcs",
        suggested_cost_price: product.suggested_cost_price ?? "",
        suggested_retail_price: product.suggested_retail_price ?? "",
        icon_image_url: product.icon_image_url || "",
        is_active: product.is_active !== false,
      });
    } else {
      setForm(emptyForm);
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Product name is required");
      return;
    }
    setIsSaving(true);
    try {
      const result = await saveGlobalInventoryProduct({
        id: form.id,
        name: form.name,
        slug: form.slug,
        category_id: form.category_id || null,
        brand: form.brand,
        description: form.description,
        unit: form.unit,
        suggested_cost_price: form.suggested_cost_price,
        suggested_retail_price: form.suggested_retail_price,
        icon_image_url: form.icon_image_url,
        is_active: form.is_active,
      });
      if (result.success === false) throw new Error(result.error);

      const saved = result.product;
      const category = categories.find((c) => c.id === saved.category_id);
      setProducts((prev) => {
        const nextRow = { ...saved, category: category ? { name: category.name } : null };
        if (form.id) return prev.map((row) => (row.id === saved.id ? nextRow : row));
        return [...prev, nextRow].sort((a, b) => a.name.localeCompare(b.name));
      });

      toast.success(form.id ? "Product updated" : "Product created");
      setIsDialogOpen(false);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Save failed");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this global product template? Salon copies will remain.")) return;
    try {
      const result = await deleteGlobalInventoryProduct(id);
      if (result.success === false) throw new Error(result.error);
      setProducts((prev) => prev.filter((row) => row.id !== id));
      toast.success("Product deleted");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Delete failed");
    }
  };

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.brand || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.category?.name || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6 pb-12 duration-500">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#1A1C29]">Global Inventory Products</h1>
          <p className="font-medium text-zinc-500">
            Master product catalog salons import into their inventory.
          </p>
        </div>
        <Button
          type="button"
          onClick={() => openDialog()}
          className="h-12 rounded-xl bg-brand px-6 font-bold text-zinc-900 shadow-lg shadow-brand/20 hover:bg-brand-hover"
        >
          <Plus className="mr-2 h-5 w-5" />
          New Product
        </Button>
      </div>

      <div className="overflow-hidden rounded-3xl border border-zinc-100 bg-white p-2 shadow-sm">
        <div className="flex items-center gap-4 border-b border-zinc-50 p-4">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <Input
              placeholder="Search products, brands, categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-12 rounded-2xl border-none bg-zinc-50 pl-11 font-medium"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-50 text-left">
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-zinc-500">Product</th>
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-zinc-500">Category</th>
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-zinc-500">Pricing</th>
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-zinc-500">Status</th>
                <th className="px-6 py-4 text-right text-[11px] font-bold uppercase tracking-widest text-zinc-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-24 text-center">
                    <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-brand" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Loading catalog...</p>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-24 text-center text-zinc-500">
                    No global inventory products yet. Create categories first, then add products.
                  </td>
                </tr>
              ) : (
                filtered.map((product) => (
                  <tr key={product.id} className="group transition-colors hover:bg-zinc-50/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <GlobalServiceIconPreview
                          iconImageUrl={product.icon_image_url}
                          iconName="Package"
                          iconMap={iconMap}
                        />
                        <div>
                          <div className="font-bold text-[#1A1C29]">{product.name}</div>
                          <div className="text-[10px] font-bold uppercase tracking-tighter text-zinc-500">
                            {product.brand || "No brand"} · {product.unit} · {product.slug}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className="rounded-lg border-zinc-200 bg-white px-2.5 py-1 text-[10px] font-bold uppercase">
                        {product.category?.name || "Uncategorized"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 text-sm">
                        <span className="flex items-center gap-1.5 font-bold text-[#1A1C29]">
                          <DollarSign className="h-3.5 w-3.5" />
                          Cost LKR {Number(product.suggested_cost_price || 0).toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1.5 text-zinc-500">
                          <Tag className="h-3.5 w-3.5" />
                          Retail LKR {Number(product.suggested_retail_price || 0).toLocaleString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        variant="outline"
                        className={
                          product.is_active !== false
                            ? "border-emerald-200 text-emerald-700"
                            : "border-zinc-200 text-zinc-500"
                        }
                      >
                        {product.is_active !== false ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="ghost" size="icon" className="h-9 w-9 rounded-xl" onClick={() => openDialog(product)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button type="button" variant="ghost" size="icon" className="h-9 w-9 rounded-xl" onClick={() => void handleDelete(product.id)}>
                          <Trash2 className="h-4 w-4" />
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-[2rem] border-none p-0 shadow-2xl sm:max-w-[640px]">
          <div className="border-b border-zinc-100 p-6">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">
                {form.id ? "Edit Global Product" : "New Global Product"}
              </DialogTitle>
              <DialogDescription className="text-zinc-500">
                Salons can import this template into their inventory catalog.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="space-y-4 p-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Product name *</label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-11 rounded-xl" />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Category</label>
                <Select value={form.category_id || undefined} onValueChange={(v) => setForm({ ...form, category_id: v })}>
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Brand</label>
                <Input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} className="h-11 rounded-xl" />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Unit</label>
                <Select value={form.unit} onValueChange={(v) => setForm({ ...form, unit: v })}>
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pcs">Pieces (pcs)</SelectItem>
                    <SelectItem value="ml">Millilitres (ml)</SelectItem>
                    <SelectItem value="g">Grams (g)</SelectItem>
                    <SelectItem value="sheet">Sheets</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Slug</label>
                <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="h-11 rounded-xl font-mono text-sm" placeholder="auto-generated" />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Suggested cost (LKR)</label>
                <Input type="number" min="0" step="0.01" value={form.suggested_cost_price} onChange={(e) => setForm({ ...form, suggested_cost_price: e.target.value })} className="h-11 rounded-xl" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Suggested retail (LKR)</label>
                <Input type="number" min="0" step="0.01" value={form.suggested_retail_price} onChange={(e) => setForm({ ...form, suggested_retail_price: e.target.value })} className="h-11 rounded-xl" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Description</label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="rounded-xl" />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Product image ({SERVICE_IMAGE_DIMENSION_LABEL})</label>
              <GlobalServiceIconUpload
                value={form.icon_image_url}
                onChange={(url) => setForm({ ...form, icon_image_url: url })}
                onClear={() => setForm({ ...form, icon_image_url: "" })}
                uploadContextLabel="global inventory catalog"
              />
            </div>

            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-3">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                className="h-4 w-4"
              />
              <span className="text-sm font-medium text-zinc-800">Active in catalog (visible for salon import)</span>
            </label>
          </div>

          <DialogFooter className="gap-2 border-t border-zinc-100 p-6 sm:justify-end">
            <Button type="button" variant="outline" className="h-11 min-h-11" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" variant="default" className="h-11 min-h-11 font-bold" disabled={isSaving} onClick={() => void handleSave()}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
