"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Package,
  Plus,
  Search,
  Loader2,
  Edit2,
  Trash2,
  AlertTriangle,
  ArrowDownCircle,
  ArrowUpCircle,
  Sparkles,
  Boxes,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { withTimeout } from "@/lib/promise-timeout";
import {
  formatInventoryQty,
  INVENTORY_TRACK_LABELS,
  isInventoryItemLowStock,
} from "@/lib/inventory";
import {
  discontinueSalonInventoryItem,
  fetchSalonInventoryPage,
  insertSalonInventoryItems,
  recordSalonInventoryTransaction,
  updateSalonInventoryItem,
  type GlobalInventoryProduct,
  type SalonInventoryItem,
  type SalonInventoryTransaction,
} from "@/app/actions/salon-inventory";
import { DashboardModal } from "../../../components/dashboard/DashboardModal";

type TrackFilter = "all" | "retail" | "backbar" | "disposable";

const emptyItemForm = {
  name: "",
  sku: "",
  unit: "pcs",
  inventory_track: "retail",
  cost_price: "",
  retail_price: "",
  reorder_level: "",
  manufacturer_barcode: "",
  initial_quantity: "",
  notes: "",
  global_product_id: "",
  category_id: "",
};

function trackBadgeClass(track: string): string {
  if (track === "backbar") return "bg-violet-50 text-violet-700 border-violet-200";
  if (track === "disposable") return "bg-slate-100 text-slate-700 border-slate-200";
  return "bg-amber-50 text-amber-800 border-amber-200";
}

export default function InventoryPage() {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [inventoryTableMissing, setInventoryTableMissing] = useState(false);
  const [items, setItems] = useState<SalonInventoryItem[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<SalonInventoryTransaction[]>([]);
  const [globalProducts, setGlobalProducts] = useState<GlobalInventoryProduct[]>([]);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [trackFilter, setTrackFilter] = useState<TrackFilter>("all");
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [stockMode, setStockMode] = useState<"restock" | "wastage">("restock");
  const [activeItem, setActiveItem] = useState<SalonInventoryItem | null>(null);
  const [itemForm, setItemForm] = useState(emptyItemForm);
  const [stockQty, setStockQty] = useState("");
  const [stockNotes, setStockNotes] = useState("");
  const [wastageReason, setWastageReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [selectedImports, setSelectedImports] = useState<Record<string, boolean>>({});

  const loadInventory = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const result = await withTimeout(fetchSalonInventoryPage(), 20000, "Loading timed out.");
      if (result.success === false) throw new Error(result.error);

      setItems(result.items || []);
      setRecentTransactions(result.recentTransactions || []);
      setGlobalProducts(result.globalProducts || []);
      setLowStockCount(result.lowStockCount ?? 0);
      setInventoryTableMissing(Boolean(result.inventoryTableMissing));

      const initialImports: Record<string, boolean> = {};
      (result.globalProducts || []).forEach((p) => {
        initialImports[p.id] = false;
      });
      setSelectedImports(initialImports);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to load inventory.";
      setLoadError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadInventory();
  }, [loadInventory]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (trackFilter !== "all" && item.inventory_track !== trackFilter) return false;
      if (showLowStockOnly && !isInventoryItemLowStock(item)) return false;
      const q = searchTerm.trim().toLowerCase();
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        (item.sku || "").toLowerCase().includes(q) ||
        (item.manufacturer_barcode || "").toLowerCase().includes(q)
      );
    });
  }, [items, searchTerm, trackFilter, showLowStockOnly]);

  const totalRetailValue = useMemo(() => {
    return items.reduce((sum, item) => {
      const cost = Number(item.cost_price) || 0;
      return sum + Number(item.quantity_on_hand) * cost;
    }, 0);
  }, [items]);

  const openAddModal = () => {
    setItemForm(emptyItemForm);
    setShowAddModal(true);
  };

  const openEditModal = (item: SalonInventoryItem) => {
    setActiveItem(item);
    setItemForm({
      name: item.name,
      sku: item.sku || "",
      unit: item.unit || "pcs",
      inventory_track: item.inventory_track || "retail",
      cost_price: item.cost_price != null ? String(item.cost_price) : "",
      retail_price: item.retail_price != null ? String(item.retail_price) : "",
      reorder_level: item.reorder_level != null ? String(item.reorder_level) : "",
      manufacturer_barcode: item.manufacturer_barcode || "",
      initial_quantity: "",
      notes: "",
      global_product_id: item.global_product_id || "",
      category_id: item.category_id || "",
    });
    setShowEditModal(true);
  };

  const openStockModal = (item: SalonInventoryItem, mode: "restock" | "wastage") => {
    setActiveItem(item);
    setStockMode(mode);
    setStockQty("");
    setStockNotes("");
    setWastageReason("");
    setShowStockModal(true);
  };

  const handleSaveItem = async (isEdit: boolean) => {
    if (!itemForm.name.trim()) {
      toast.error("Product name is required.");
      return;
    }

    const payload = {
      name: itemForm.name.trim(),
      sku: itemForm.sku.trim() || null,
      unit: itemForm.unit || "pcs",
      inventory_track: itemForm.inventory_track,
      cost_price: itemForm.cost_price ? parseFloat(itemForm.cost_price) : null,
      retail_price: itemForm.retail_price ? parseFloat(itemForm.retail_price) : null,
      reorder_level: itemForm.reorder_level ? parseFloat(itemForm.reorder_level) : null,
      manufacturer_barcode: itemForm.manufacturer_barcode.trim() || null,
      global_product_id: itemForm.global_product_id || null,
      category_id: itemForm.category_id || null,
      initial_quantity: !isEdit && itemForm.initial_quantity ? parseFloat(itemForm.initial_quantity) : undefined,
      notes: itemForm.notes.trim() || null,
    };

    try {
      setSaving(true);
      const result = isEdit && activeItem
        ? await updateSalonInventoryItem(activeItem.id, payload)
        : await insertSalonInventoryItems([payload]);
      if (result.success === false) throw new Error(result.error);
      toast.success(isEdit ? "Item updated." : "Item added.");
      setShowAddModal(false);
      setShowEditModal(false);
      await loadInventory();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const handleStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeItem) return;
    const qty = parseFloat(stockQty);
    if (!Number.isFinite(qty) || qty <= 0) {
      toast.error("Enter a valid quantity.");
      return;
    }

    try {
      setSaving(true);
      const result = await recordSalonInventoryTransaction({
        itemId: activeItem.id,
        transactionType: stockMode,
        quantity: qty,
        notes: stockNotes.trim() || null,
        shrinkageReason: stockMode === "wastage" ? wastageReason.trim() || null : null,
      });
      if (result.success === false) throw new Error(result.error);
      toast.success(stockMode === "restock" ? "Stock added." : "Wastage recorded.");
      setShowStockModal(false);
      await loadInventory();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Could not save transaction.");
    } finally {
      setSaving(false);
    }
  };

  const handleDiscontinue = async (item: SalonInventoryItem) => {
    if (!window.confirm(`Remove "${item.name}" from your inventory list?`)) return;
    try {
      const result = await discontinueSalonInventoryItem(item.id);
      if (result.success === false) throw new Error(result.error);
      toast.success("Item removed.");
      await loadInventory();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Remove failed.");
    }
  };

  const handleImportSelected = async () => {
    const toImport = globalProducts.filter((p) => selectedImports[p.id]);
    if (!toImport.length) {
      toast.error("Select at least one catalog product.");
      return;
    }

    const existingGlobalIds = new Set(
      items.map((i) => i.global_product_id).filter(Boolean) as string[]
    );
    const payloads = toImport
      .filter((p) => !existingGlobalIds.has(p.id))
      .map((p) => ({
        name: p.name,
        unit: p.unit || "pcs",
        inventory_track: "retail" as const,
        cost_price: p.suggested_cost_price,
        retail_price: p.suggested_retail_price,
        global_product_id: p.id,
        category_id: p.category_id,
      }));

    if (!payloads.length) {
      toast.error("Selected products are already in your inventory.");
      return;
    }

    try {
      setSaving(true);
      const result = await insertSalonInventoryItems(payloads);
      if (result.success === false) throw new Error(result.error);
      toast.success(`${payloads.length} product(s) imported.`);
      setShowImportModal(false);
      await loadInventory();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Import failed.");
    } finally {
      setSaving(false);
    }
  };

  const itemNameById = useMemo(() => {
    const map = new Map<string, string>();
    items.forEach((item) => map.set(item.id, item.name));
    return map;
  }, [items]);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Inventory</h1>
          <p className="text-sm text-zinc-500">Track stock, restock products, and log wastage.</p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Button
            type="button"
            variant="dark"
            className="h-11 min-h-11 w-full rounded-xl font-bold sm:w-auto"
            onClick={() => setShowImportModal(true)}
            disabled={inventoryTableMissing}
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Import Catalog
          </Button>
          <Button
            type="button"
            className="h-11 min-h-11 w-full rounded-xl bg-brand font-bold text-black hover:bg-brand-hover sm:w-auto"
            onClick={openAddModal}
            disabled={inventoryTableMissing}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </Button>
        </div>
      </div>

      {inventoryTableMissing && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Inventory tables are not on this database. Run{" "}
          <code className="rounded bg-white px-1">packages/db/INVENTORY_APPLY_ALL.sql</code> in Supabase SQL Editor.
        </div>
      )}

      {loadError && !inventoryTableMissing && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{loadError}</div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100">
              <Boxes className="h-5 w-5 text-zinc-600" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Active SKUs</p>
              <p className="text-xl font-extrabold text-[#1A1C29]">{items.length}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50">
              <AlertTriangle className="h-5 w-5 text-rose-600" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Low stock</p>
              <p className="text-xl font-extrabold text-[#1A1C29]">{lowStockCount}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/20">
              <Package className="h-5 w-5 text-zinc-800" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Stock value (cost)</p>
              <p className="text-xl font-extrabold text-[#1A1C29]">LKR {totalRetailValue.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, SKU, or barcode…"
            className="h-11 pl-9"
          />
        </div>
        <Select value={trackFilter} onValueChange={(v) => setTrackFilter(v as TrackFilter)}>
          <SelectTrigger className="h-11 w-full sm:w-[180px]">
            <SelectValue placeholder="Track" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All tracks</SelectItem>
            <SelectItem value="retail">Retail</SelectItem>
            <SelectItem value="backbar">Backbar</SelectItem>
            <SelectItem value="disposable">Disposable</SelectItem>
          </SelectContent>
        </Select>
        <Button
          type="button"
          variant={showLowStockOnly ? "default" : "outline"}
          className="h-11 min-h-11 w-full sm:w-auto"
          onClick={() => setShowLowStockOnly((v) => !v)}
        >
          <AlertTriangle className="mr-2 h-4 w-4" />
          Low stock only
        </Button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b border-zinc-100 bg-zinc-50 text-left text-xs font-bold uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Track</th>
                <th className="px-4 py-3">On hand</th>
                <th className="px-4 py-3">Reorder at</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-zinc-500">
                    {items.length === 0
                      ? "No inventory items yet. Add a product or import from the Trimma catalog."
                      : "No items match your filters."}
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const low = isInventoryItemLowStock(item);
                  const reorderAt = item.reorder_point ?? item.reorder_level;
                  return (
                    <tr key={item.id} className="border-b border-zinc-50 hover:bg-zinc-50/80">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-zinc-900">{item.name}</div>
                        <div className="text-xs text-zinc-500">
                          {item.sku ? `SKU ${item.sku}` : "No SKU"}
                          {item.manufacturer_barcode ? ` · ${item.manufacturer_barcode}` : ""}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={trackBadgeClass(item.inventory_track)}>
                          {INVENTORY_TRACK_LABELS[item.inventory_track] || item.inventory_track}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <span className={low ? "font-bold text-rose-600" : "font-medium text-zinc-800"}>
                          {formatInventoryQty(Number(item.quantity_on_hand), item.unit)}
                        </span>
                        {low && (
                          <div className="mt-0.5 text-[10px] font-bold uppercase text-rose-500">Low stock</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-zinc-600">
                        {reorderAt != null ? formatInventoryQty(Number(reorderAt), item.unit) : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="capitalize">
                          {item.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9"
                            title="Restock"
                            onClick={() => openStockModal(item, "restock")}
                          >
                            <ArrowDownCircle className="h-4 w-4 text-emerald-600" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9"
                            title="Log wastage"
                            onClick={() => openStockModal(item, "wastage")}
                          >
                            <ArrowUpCircle className="h-4 w-4 text-rose-600" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9"
                            title="Edit"
                            onClick={() => openEditModal(item)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9"
                            title="Remove"
                            onClick={() => void handleDiscontinue(item)}
                          >
                            <Trash2 className="h-4 w-4 text-zinc-400" />
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

      {recentTransactions.length > 0 && (
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-zinc-500">Recent movements</h2>
          <ul className="space-y-2">
            {recentTransactions.map((tx) => (
              <li key={tx.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-zinc-50 px-3 py-2 text-sm">
                <span className="font-medium text-zinc-800">{itemNameById.get(tx.inventory_item_id) || "Item"}</span>
                <span className="capitalize text-zinc-500">{tx.transaction_type}</span>
                <span className={Number(tx.quantity) < 0 ? "font-semibold text-rose-600" : "font-semibold text-emerald-700"}>
                  {Number(tx.quantity) > 0 ? "+" : ""}
                  {tx.quantity}
                </span>
                <span className="text-xs text-zinc-400">{new Date(tx.created_at).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <ItemFormModal
        open={showAddModal}
        title="Add inventory item"
        description="Create a custom product for your salon. Initial stock is recorded as a restock entry."
        form={itemForm}
        setForm={setItemForm}
        saving={saving}
        showInitialQty
        onClose={() => setShowAddModal(false)}
        onSubmit={() => void handleSaveItem(false)}
      />

      <ItemFormModal
        open={showEditModal}
        title="Edit item"
        description="Update product details. Use Restock or Wastage actions to change quantity."
        form={itemForm}
        setForm={setItemForm}
        saving={saving}
        showInitialQty={false}
        onClose={() => setShowEditModal(false)}
        onSubmit={() => void handleSaveItem(true)}
      />

      <DashboardModal
        open={showStockModal}
        onClose={() => setShowStockModal(false)}
        title={stockMode === "restock" ? "Restock" : "Log wastage"}
        description={activeItem ? activeItem.name : undefined}
        size="md"
        footer={
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" className="h-11 min-h-11" onClick={() => setShowStockModal(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="inventory-stock-form"
              variant="default"
              className="h-11 min-h-11 font-bold"
              disabled={saving}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
            </Button>
          </div>
        }
      >
        <form id="inventory-stock-form" onSubmit={handleStockSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-bold uppercase text-zinc-500">Quantity</label>
            <Input
              type="number"
              min="0"
              step="any"
              value={stockQty}
              onChange={(e) => setStockQty(e.target.value)}
              className="h-11"
              required
            />
          </div>
          {stockMode === "wastage" && (
            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-zinc-500">Reason</label>
              <Select value={wastageReason} onValueChange={setWastageReason}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="spill">Spill / accident</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="damaged">Damaged</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <div>
            <label className="mb-1 block text-xs font-bold uppercase text-zinc-500">Notes (optional)</label>
            <Textarea value={stockNotes} onChange={(e) => setStockNotes(e.target.value)} rows={3} />
          </div>
        </form>
      </DashboardModal>

      <DashboardModal
        open={showImportModal}
        onClose={() => setShowImportModal(false)}
        title="Import from Trimma catalog"
        description="Add platform products to your salon inventory. You can set stock levels after import."
        size="lg"
        footer={
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" className="h-11 min-h-11" onClick={() => setShowImportModal(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="default"
              className="h-11 min-h-11 font-bold"
              disabled={saving}
              onClick={() => void handleImportSelected()}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Import selected"}
            </Button>
          </div>
        }
      >
        {globalProducts.length === 0 ? (
          <p className="text-sm text-zinc-500">No global catalog products yet. Add items manually or ask Trimma admin to seed the catalog.</p>
        ) : (
          <ul className="max-h-[50vh] space-y-2 overflow-y-auto">
            {globalProducts.map((product) => (
              <li
                key={product.id}
                className="flex items-start gap-3 rounded-xl border border-zinc-100 p-3 hover:bg-zinc-50"
              >
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4"
                  checked={Boolean(selectedImports[product.id])}
                  onChange={(e) =>
                    setSelectedImports((prev) => ({ ...prev, [product.id]: e.target.checked }))
                  }
                />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-zinc-900">{product.name}</p>
                  <p className="text-xs text-zinc-500">
                    {product.brand || "—"} · {product.unit}
                    {product.suggested_retail_price != null
                      ? ` · LKR ${Number(product.suggested_retail_price).toLocaleString()} retail`
                      : ""}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </DashboardModal>
    </div>
  );
}

type ItemFormState = typeof emptyItemForm;

function ItemFormModal({
  open,
  title,
  description,
  form,
  setForm,
  saving,
  showInitialQty,
  onClose,
  onSubmit,
}: {
  open: boolean;
  title: string;
  description: string;
  form: ItemFormState;
  setForm: React.Dispatch<React.SetStateAction<ItemFormState>>;
  saving: boolean;
  showInitialQty: boolean;
  onClose: () => void;
  onSubmit: () => void;
}) {
  return (
    <DashboardModal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      size="lg"
      footer={
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" className="h-11 min-h-11" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" variant="default" className="h-11 min-h-11 font-bold" disabled={saving} onClick={onSubmit}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-bold uppercase text-zinc-500">Name</label>
          <Input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="h-11"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold uppercase text-zinc-500">Track</label>
          <Select value={form.inventory_track} onValueChange={(v) => setForm((f) => ({ ...f, inventory_track: v }))}>
            <SelectTrigger className="h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="retail">Retail</SelectItem>
              <SelectItem value="backbar">Backbar</SelectItem>
              <SelectItem value="disposable">Disposable</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold uppercase text-zinc-500">Unit</label>
          <Select value={form.unit} onValueChange={(v) => setForm((f) => ({ ...f, unit: v }))}>
            <SelectTrigger className="h-11">
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
        <div>
          <label className="mb-1 block text-xs font-bold uppercase text-zinc-500">SKU (optional)</label>
          <Input value={form.sku} onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))} className="h-11" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold uppercase text-zinc-500">Barcode (optional)</label>
          <Input
            value={form.manufacturer_barcode}
            onChange={(e) => setForm((f) => ({ ...f, manufacturer_barcode: e.target.value }))}
            className="h-11"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold uppercase text-zinc-500">Cost price (LKR)</label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={form.cost_price}
            onChange={(e) => setForm((f) => ({ ...f, cost_price: e.target.value }))}
            className="h-11"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold uppercase text-zinc-500">Retail price (LKR)</label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={form.retail_price}
            onChange={(e) => setForm((f) => ({ ...f, retail_price: e.target.value }))}
            className="h-11"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold uppercase text-zinc-500">Reorder level</label>
          <Input
            type="number"
            min="0"
            step="any"
            value={form.reorder_level}
            onChange={(e) => setForm((f) => ({ ...f, reorder_level: e.target.value }))}
            className="h-11"
          />
        </div>
        {showInitialQty ? (
          <div>
            <label className="mb-1 block text-xs font-bold uppercase text-zinc-500">Initial quantity</label>
            <Input
              type="number"
              min="0"
              step="any"
              value={form.initial_quantity}
              onChange={(e) => setForm((f) => ({ ...f, initial_quantity: e.target.value }))}
              className="h-11"
            />
          </div>
        ) : null}
      </div>
    </DashboardModal>
  );
}
