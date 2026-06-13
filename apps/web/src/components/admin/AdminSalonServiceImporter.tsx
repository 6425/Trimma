"use client";

import { useMemo } from "react";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

type GlobalService = {
  id: string;
  name: string;
  category: string | null;
  default_price: number;
  default_duration: number;
};

type AdminSalonServiceImporterProps = {
  allowedCategories: Array<{ id: string; name: string }>;
  maxServices: number;
  planName: string;
  globalServices: GlobalService[];
  existingGlobalServiceIds: string[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  selectedServiceIds: Record<string, boolean>;
  onToggleService: (serviceId: string, enabled: boolean) => void;
  onImport: () => Promise<void>;
  importing: boolean;
  currentServiceCount: number;
};

export function AdminSalonServiceImporter({
  allowedCategories,
  maxServices,
  planName,
  globalServices,
  existingGlobalServiceIds,
  selectedCategory,
  onCategoryChange,
  selectedServiceIds,
  onToggleService,
  onImport,
  importing,
  currentServiceCount,
}: AdminSalonServiceImporterProps) {
  const selectedCount = Object.values(selectedServiceIds).filter(Boolean).length;
  const remainingSlots = Math.max(0, maxServices - currentServiceCount);

  const visibleServices = useMemo(() => {
    return globalServices.filter((svc) => {
      if (!svc.category) return false;
      if (selectedCategory && svc.category !== selectedCategory) return false;
      return allowedCategories.some((cat) => cat.name === svc.category);
    });
  }, [allowedCategories, globalServices, selectedCategory]);

  return (
    <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-zinc-900">Import Services by Category</p>
          <p className="text-xs text-zinc-500 mt-1">
            {planName} plan allows up to {maxServices} services. {remainingSlots} slot
            {remainingSlots === 1 ? "" : "s"} remaining.
          </p>
        </div>
        <Badge className="bg-white text-emerald-700 border-emerald-200">
          {selectedCount} selected
        </Badge>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onCategoryChange("")}
          className={`px-3 py-1.5 rounded-full text-xs font-bold ${
            !selectedCategory ? "bg-emerald-600 text-white" : "bg-white text-zinc-600 border border-zinc-200"
          }`}
        >
          All allowed
        </button>
        {allowedCategories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => onCategoryChange(cat.name)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold ${
              selectedCategory === cat.name
                ? "bg-emerald-600 text-white"
                : "bg-white text-zinc-600 border border-zinc-200"
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      <div className="max-h-56 overflow-y-auto rounded-xl border border-zinc-100 bg-white p-3 space-y-2">
        {visibleServices.length === 0 ? (
          <p className="text-xs text-zinc-500 text-center py-4">
            No global services available for the selected category.
          </p>
        ) : (
          visibleServices.map((svc) => {
            const alreadyAdded = existingGlobalServiceIds.includes(svc.id);
            const checked = Boolean(selectedServiceIds[svc.id]);
            return (
              <label
                key={svc.id}
                className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2 ${
                  alreadyAdded ? "border-zinc-100 bg-zinc-50 opacity-70" : "border-zinc-200 bg-white"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <input
                    type="checkbox"
                    disabled={alreadyAdded}
                    checked={alreadyAdded || checked}
                    onChange={(e) => {
                      if (alreadyAdded) return;
                      const nextEnabled = e.target.checked;
                      const nextSelected = Object.values(selectedServiceIds).filter(Boolean).length;
                      if (nextEnabled && nextSelected >= remainingSlots) {
                        toast.error(`Only ${remainingSlots} more service(s) can be added on this plan.`);
                        return;
                      }
                      onToggleService(svc.id, nextEnabled);
                    }}
                    className="rounded border-zinc-300 text-emerald-600"
                  />
                  <span className="text-xs font-semibold text-zinc-800 truncate">{svc.name}</span>
                </div>
                <span className="text-[10px] text-zinc-500 shrink-0">
                  {svc.category} · LKR {svc.default_price}
                </span>
              </label>
            );
          })
        )}
      </div>

      <Button
        type="button"
        onClick={() => void onImport()}
        disabled={importing || selectedCount === 0}
        className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
      >
        {importing ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Importing…
          </>
        ) : (
          <>
            <Plus className="w-4 h-4 mr-2" />
            Import Selected Services
          </>
        )}
      </Button>
    </div>
  );
}
