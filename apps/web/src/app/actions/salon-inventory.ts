"use server";

import { revalidatePath } from "next/cache";
import { sanitizeTextFields } from "@/lib/sanitize-input";
import { isSalonDbSuccess, salonDbFailure, withSalonDb } from "@/lib/with-salon-db";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { SalonOwnerContext } from "@/lib/server-salon-auth";
import { isInventoryItemLowStock } from "@/lib/inventory";

const INVENTORY_DB_HINT =
  "Inventory tables are missing. Run packages/db/INVENTORY_APPLY_ALL.sql in Supabase SQL Editor.";

export type SalonInventoryItem = {
  id: string;
  salon_id: string;
  global_product_id: string | null;
  category_id: string | null;
  name: string;
  sku: string | null;
  unit: string;
  inventory_track: string;
  cost_price: number | null;
  retail_price: number | null;
  quantity_on_hand: number;
  reorder_level: number | null;
  reorder_point: number | null;
  status: string;
  manufacturer_barcode: string | null;
  internal_barcode: string | null;
  abc_class: string | null;
  created_at: string;
  updated_at: string;
};

export type SalonInventoryTransaction = {
  id: string;
  inventory_item_id: string;
  transaction_type: string;
  quantity: number;
  notes: string | null;
  actor_email: string | null;
  created_at: string;
};

export type InventoryCategory = {
  id: string;
  name: string;
  slug: string;
};

export type GlobalInventoryProduct = {
  id: string;
  name: string;
  slug: string;
  brand: string | null;
  unit: string;
  suggested_cost_price: number | null;
  suggested_retail_price: number | null;
  category_id: string | null;
};

function isMissingInventoryTable(message: string): boolean {
  const lower = message.toLowerCase();
  return lower.includes("does not exist") || lower.includes("schema cache");
}

async function assertSalonInventoryItem(
  supabase: SupabaseClient,
  ctx: SalonOwnerContext,
  itemId: string
) {
  const { data, error } = await supabase
    .from("salon_inventory_items")
    .select("id")
    .eq("id", itemId)
    .eq("salon_id", ctx.salonId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Inventory item not found for your salon.");
}

async function ensureDefaultLocations(supabase: SupabaseClient, salonId: string) {
  const { error } = await supabase.rpc("ensure_salon_inventory_defaults", { p_salon_id: salonId });
  if (error && !isMissingInventoryTable(error.message)) {
    throw new Error(error.message);
  }
}

export async function fetchSalonInventoryPage() {
  const result = await withSalonDb(async (supabase, ctx) => {
    await ensureDefaultLocations(supabase, ctx.salonId);

    const [itemsRes, categoriesRes, globalProductsRes, transactionsRes] = await Promise.all([
      supabase
        .from("salon_inventory_items")
        .select("*")
        .eq("salon_id", ctx.salonId)
        .neq("status", "discontinued")
        .order("name"),
      supabase.from("inventory_categories").select("id, name, slug").order("name"),
      supabase.from("global_inventory_products").select("*").eq("is_active", true).order("name"),
      supabase
        .from("salon_inventory_transactions")
        .select("id, inventory_item_id, transaction_type, quantity, notes, actor_email, created_at")
        .eq("salon_id", ctx.salonId)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

    if (itemsRes.error) {
      if (isMissingInventoryTable(itemsRes.error.message)) {
        return {
          salon: ctx.salon,
          items: [] as SalonInventoryItem[],
          categories: [] as InventoryCategory[],
          globalProducts: [] as GlobalInventoryProduct[],
          recentTransactions: [] as SalonInventoryTransaction[],
          inventoryTableMissing: true,
        };
      }
      throw new Error(itemsRes.error.message);
    }

    if (categoriesRes.error && !isMissingInventoryTable(categoriesRes.error.message)) {
      throw new Error(categoriesRes.error.message);
    }
    if (globalProductsRes.error && !isMissingInventoryTable(globalProductsRes.error.message)) {
      throw new Error(globalProductsRes.error.message);
    }
    if (transactionsRes.error && !isMissingInventoryTable(transactionsRes.error.message)) {
      throw new Error(transactionsRes.error.message);
    }

    const items = (itemsRes.data || []) as SalonInventoryItem[];
    const lowStockCount = items.filter(isInventoryItemLowStock).length;

    return {
      salon: ctx.salon,
      items,
      categories: (categoriesRes.data || []) as InventoryCategory[],
      globalProducts: (globalProductsRes.data || []) as GlobalInventoryProduct[],
      recentTransactions: (transactionsRes.data || []) as SalonInventoryTransaction[],
      lowStockCount,
      inventoryTableMissing: false,
    };
  });

  if (!isSalonDbSuccess(result)) return salonDbFailure(result, INVENTORY_DB_HINT);
  return { success: true as const, ...result.data };
}

type InventoryItemPayload = {
  name: string;
  sku?: string | null;
  unit?: string;
  inventory_track?: string;
  cost_price?: number | null;
  retail_price?: number | null;
  reorder_level?: number | null;
  reorder_point?: number | null;
  status?: string;
  global_product_id?: string | null;
  category_id?: string | null;
  manufacturer_barcode?: string | null;
  initial_quantity?: number;
  notes?: string | null;
};

function buildInventoryItemRow(payload: InventoryItemPayload, salonId: string) {
  const { initial_quantity: _initialQty, notes: _notes, ...rest } = payload;
  return {
    ...sanitizeTextFields(rest, ["name", "sku", "manufacturer_barcode"]),
    salon_id: salonId,
    unit: rest.unit || "pcs",
    inventory_track: rest.inventory_track || "retail",
    status: rest.status || "active",
    quantity_on_hand: 0,
  };
}

export async function insertSalonInventoryItems(payloads: InventoryItemPayload[]) {
  if (!payloads.length) {
    return { success: false as const, error: "Add at least one inventory item." };
  }

  const result = await withSalonDb(async (supabase, ctx) => {
    await ensureDefaultLocations(supabase, ctx.salonId);

    for (const payload of payloads) {
      if (!payload.name?.trim()) throw new Error("Product name is required.");

      const row = buildInventoryItemRow(payload, ctx.salonId);
      const { data: inserted, error } = await supabase
        .from("salon_inventory_items")
        .insert(row)
        .select("id")
        .single();
      if (error) throw new Error(error.message);

      const initialQty = Number(payload.initial_quantity ?? 0);
      if (initialQty > 0) {
        const { error: txError } = await supabase.from("salon_inventory_transactions").insert({
          salon_id: ctx.salonId,
          inventory_item_id: inserted.id,
          transaction_type: "restock",
          quantity: initialQty,
          notes: payload.notes?.trim() || "Initial stock",
          actor_email: ctx.email,
        });
        if (txError) throw new Error(txError.message);
      }
    }

    revalidatePath("/dashboard/inventory");
  });

  if (!isSalonDbSuccess(result)) return salonDbFailure(result, INVENTORY_DB_HINT);
  return { success: true as const };
}

export async function updateSalonInventoryItem(itemId: string, payload: InventoryItemPayload) {
  if (!payload.name?.trim()) {
    return { success: false as const, error: "Product name is required." };
  }

  const result = await withSalonDb(async (supabase, ctx) => {
    await assertSalonInventoryItem(supabase, ctx, itemId);

    const { initial_quantity: _initialQty, notes: _notes, ...rest } = payload;
    const updates = sanitizeTextFields(
      {
        name: rest.name,
        sku: rest.sku ?? null,
        unit: rest.unit || "pcs",
        inventory_track: rest.inventory_track || "retail",
        cost_price: rest.cost_price ?? null,
        retail_price: rest.retail_price ?? null,
        reorder_level: rest.reorder_level ?? null,
        reorder_point: rest.reorder_point ?? null,
        status: rest.status || "active",
        global_product_id: rest.global_product_id ?? null,
        category_id: rest.category_id ?? null,
        manufacturer_barcode: rest.manufacturer_barcode ?? null,
      },
      ["name", "sku", "manufacturer_barcode"]
    );

    const { error } = await supabase
      .from("salon_inventory_items")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", itemId)
      .eq("salon_id", ctx.salonId);
    if (error) throw new Error(error.message);

    revalidatePath("/dashboard/inventory");
  });

  if (!isSalonDbSuccess(result)) return salonDbFailure(result, INVENTORY_DB_HINT);
  return { success: true as const };
}

export async function discontinueSalonInventoryItem(itemId: string) {
  const result = await withSalonDb(async (supabase, ctx) => {
    await assertSalonInventoryItem(supabase, ctx, itemId);

    const { error } = await supabase
      .from("salon_inventory_items")
      .update({ status: "discontinued", updated_at: new Date().toISOString() })
      .eq("id", itemId)
      .eq("salon_id", ctx.salonId);
    if (error) throw new Error(error.message);

    revalidatePath("/dashboard/inventory");
  });

  if (!isSalonDbSuccess(result)) return salonDbFailure(result, INVENTORY_DB_HINT);
  return { success: true as const };
}

export async function recordSalonInventoryTransaction(input: {
  itemId: string;
  transactionType: "restock" | "wastage" | "adjustment";
  quantity: number;
  notes?: string | null;
  shrinkageReason?: string | null;
}) {
  const qty = Number(input.quantity);
  if (!Number.isFinite(qty) || qty === 0) {
    return { success: false as const, error: "Enter a valid quantity." };
  }

  let signedQty = qty;
  if (input.transactionType === "wastage") {
    signedQty = -Math.abs(qty);
  } else if (input.transactionType === "restock") {
    signedQty = Math.abs(qty);
  }

  const result = await withSalonDb(async (supabase, ctx) => {
    await assertSalonInventoryItem(supabase, ctx, input.itemId);
    await ensureDefaultLocations(supabase, ctx.salonId);

    const { error } = await supabase.from("salon_inventory_transactions").insert({
      salon_id: ctx.salonId,
      inventory_item_id: input.itemId,
      transaction_type: input.transactionType,
      quantity: signedQty,
      notes: input.notes?.trim() || null,
      shrinkage_reason: input.shrinkageReason?.trim() || null,
      actor_email: ctx.email,
    });
    if (error) throw new Error(error.message);

    revalidatePath("/dashboard/inventory");
  });

  if (!isSalonDbSuccess(result)) return salonDbFailure(result, INVENTORY_DB_HINT);
  return { success: true as const };
}

/** Set on-hand quantity to an exact count (records an adjustment transaction for the delta). */
export async function setSalonInventoryOnHand(input: {
  itemId: string;
  quantityOnHand: number;
  notes?: string | null;
}) {
  const targetQty = Number(input.quantityOnHand);
  if (!Number.isFinite(targetQty) || targetQty < 0) {
    return { success: false as const, error: "Enter a valid on-hand quantity (0 or more)." };
  }

  const result = await withSalonDb(async (supabase, ctx) => {
    const { data: item, error: fetchError } = await supabase
      .from("salon_inventory_items")
      .select("id, quantity_on_hand")
      .eq("id", input.itemId)
      .eq("salon_id", ctx.salonId)
      .maybeSingle();
    if (fetchError) throw new Error(fetchError.message);
    if (!item) throw new Error("Inventory item not found for your salon.");

    const currentQty = Number(item.quantity_on_hand) || 0;
    const delta = targetQty - currentQty;
    if (delta === 0) {
      return { unchanged: true as const };
    }

    await ensureDefaultLocations(supabase, ctx.salonId);

    const { error } = await supabase.from("salon_inventory_transactions").insert({
      salon_id: ctx.salonId,
      inventory_item_id: input.itemId,
      transaction_type: "adjustment",
      quantity: delta,
      notes: input.notes?.trim() || `Count set to ${targetQty}`,
      actor_email: ctx.email,
    });
    if (error) throw new Error(error.message);

    revalidatePath("/dashboard/inventory");
    return { unchanged: false as const };
  });

  if (!isSalonDbSuccess(result)) return salonDbFailure(result, INVENTORY_DB_HINT);
  if (result.data.unchanged) {
    return { success: true as const, unchanged: true as const };
  }
  return { success: true as const, unchanged: false as const };
}
