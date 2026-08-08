export type InventoryStockFields = {
  quantity_on_hand: number;
  reorder_level?: number | null;
  reorder_point?: number | null;
};

export function isInventoryItemLowStock(item: InventoryStockFields): boolean {
  const threshold = item.reorder_point ?? item.reorder_level;
  if (threshold == null || Number(threshold) <= 0) return false;
  return Number(item.quantity_on_hand) <= Number(threshold);
}

export const INVENTORY_TRACK_LABELS: Record<string, string> = {
  retail: "Retail",
  backbar: "Backbar",
  disposable: "Disposable",
};

export function formatInventoryQty(qty: number, unit: string): string {
  const n = Number(qty);
  if (Number.isInteger(n)) return `${n} ${unit}`;
  return `${n.toFixed(2)} ${unit}`;
}
