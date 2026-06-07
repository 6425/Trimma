"use client";

import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";

export type SalonFilters = {
  minRating: number;
  maxPrice: number | null;
  verifiedOnly: boolean;
  openNowOnly: boolean;
  selectedCategories: string[];
  minDiscount: number;
};

type Category = { slug: string; name: string };

type SalonFiltersPanelProps = {
  filters: SalonFilters;
  categories: Category[];
  onChange: (next: SalonFilters) => void;
  onApply?: () => void;
  onClear: () => void;
  compact?: boolean;
};

const PRICE_OPTIONS = [
  { label: "Any price", value: null },
  { label: "Under LKR 2,000", value: 2000 },
  { label: "Under LKR 5,000", value: 5000 },
  { label: "Under LKR 10,000", value: 10000 },
];

const RATING_OPTIONS = [
  { label: "Any rating", value: 0 },
  { label: "3+ stars", value: 3 },
  { label: "4+ stars", value: 4 },
  { label: "4.5+ stars", value: 4.5 },
];

const DISCOUNT_OPTIONS = [
  { label: "Any deals", value: 0 },
  { label: "10%+ off", value: 10 },
  { label: "20%+ off", value: 20 },
  { label: "50%+ off", value: 50 },
];

export function SalonFiltersPanel({
  filters,
  categories,
  onChange,
  onApply,
  onClear,
  compact = false,
}: SalonFiltersPanelProps) {
  const set = (patch: Partial<SalonFilters>) => onChange({ ...filters, ...patch });

  const toggleCategory = (slug: string) => {
    const selected = filters.selectedCategories.includes(slug)
      ? filters.selectedCategories.filter((s) => s !== slug)
      : [...filters.selectedCategories, slug];
    set({ selectedCategories: selected });
  };

  return (
    <div className={`space-y-6 ${compact ? "" : "sticky top-[calc(3.5rem+1px)]"}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black uppercase tracking-wider text-[#1A1C29]">Filters</h3>
        <button
          type="button"
          onClick={onClear}
          className="text-xs font-bold text-brand hover:text-brand-hover transition-colors"
        >
          Clear all
        </button>
      </div>

      <div className="space-y-3 pb-4 border-b border-slate-100">
        <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">Budget (per service)</p>
        <div className="space-y-2">
          {PRICE_OPTIONS.map((opt) => (
            <label key={String(opt.value)} className="flex items-center gap-2.5 cursor-pointer text-sm text-zinc-700 hover:text-zinc-900">
              <input
                type="radio"
                name="price"
                checked={filters.maxPrice === opt.value}
                onChange={() => set({ maxPrice: opt.value })}
                className="accent-brand"
              />
              {opt.label}
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-3 pb-4 border-b border-slate-100">
        <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">Review score</p>
        <div className="space-y-2">
          {RATING_OPTIONS.map((opt) => (
            <label key={opt.value} className="flex items-center gap-2.5 cursor-pointer text-sm text-zinc-700 hover:text-zinc-900">
              <input
                type="radio"
                name="rating"
                checked={filters.minRating === opt.value}
                onChange={() => set({ minRating: opt.value })}
                className="accent-brand"
              />
              <span className="inline-flex items-center gap-1">
                {opt.value > 0 && (
                  <>
                    {opt.label.replace("+ stars", "")}
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />+
                  </>
                )}
                {opt.value === 0 && opt.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-3 pb-4 border-b border-slate-100">
        <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">Deals & Discount %</p>
        <div className="space-y-2">
          {DISCOUNT_OPTIONS.map((opt) => (
            <label key={opt.value} className="flex items-center gap-2.5 cursor-pointer text-sm text-zinc-700 hover:text-zinc-900">
              <input
                type="radio"
                name="discount"
                checked={filters.minDiscount === opt.value}
                onChange={() => set({ minDiscount: opt.value })}
                className="accent-brand"
              />
              {opt.label}
            </label>
          ))}
        </div>
      </div>

      {categories.length > 0 && (
        <div className="space-y-3 pb-4 border-b border-slate-100">
          <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">Salon type</p>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1 scrollbar-none">
            {categories.map((cat) => (
              <label key={cat.slug} className="flex items-center gap-2.5 cursor-pointer text-sm text-zinc-700 hover:text-zinc-900">
                <input
                  type="checkbox"
                  checked={filters.selectedCategories.includes(cat.slug)}
                  onChange={() => toggleCategory(cat.slug)}
                  className="accent-brand rounded"
                />
                {cat.name}
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">Availability & trust</p>
        <label className="flex items-center gap-2.5 cursor-pointer text-sm text-zinc-700 hover:text-zinc-900">
          <input
            type="checkbox"
            checked={filters.openNowOnly}
            onChange={(e) => set({ openNowOnly: e.target.checked })}
            className="accent-brand rounded"
          />
          Open now
        </label>
        <label className="flex items-center gap-2.5 cursor-pointer text-sm text-zinc-700 hover:text-zinc-900">
          <input
            type="checkbox"
            checked={filters.verifiedOnly}
            onChange={(e) => set({ verifiedOnly: e.target.checked })}
            className="accent-brand rounded"
          />
          Verified partners only
        </label>
      </div>

      {compact && onApply && (
        <Button
          type="button"
          onClick={onApply}
          className="w-full h-11 rounded-xl bg-brand hover:bg-brand-hover text-black font-bold shadow-md shadow-brand/20"
        >
          Show results
        </Button>
      )}
    </div>
  );
}

export const defaultSalonFilters: SalonFilters = {
  minRating: 0,
  maxPrice: null,
  verifiedOnly: false,
  openNowOnly: false,
  selectedCategories: [],
  minDiscount: 0,
};

export function countActiveFilters(filters: SalonFilters): number {
  let n = 0;
  if (filters.minRating > 0) n++;
  if (filters.maxPrice != null) n++;
  if (filters.verifiedOnly) n++;
  if (filters.openNowOnly) n++;
  if (filters.minDiscount > 0) n++;
  n += filters.selectedCategories.length;
  return n;
}
