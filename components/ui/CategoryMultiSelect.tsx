"use client";

import { useEffect, useState } from "react";
import { Check, Loader2, Lock, Sparkles, Tag } from "lucide-react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

import Link from "next/link";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface CategoryMultiSelectProps {
  /** Currently selected category names (comma-separated string or array) */
  value: string | string[];
  /** Called with updated array of selected category names */
  onChange: (selected: string[]) => void;
  /** Max number of categories allowed (from subscription plan). Default 2. */
  maxCategories?: number;
  /** Plan name shown in upgrade prompt */
  planName?: string;
  /** Visual theme: "dark" for dashboard/agent dark surfaces, "light" for light forms */
  theme?: "dark" | "light";
  /** Show upgrade link or just a message */
  showUpgradeLink?: boolean;
  /** Optional class on the root wrapper */
  className?: string;
}

export function CategoryMultiSelect({
  value,
  onChange,
  maxCategories = 2,
  planName = "Beginner",
  theme = "dark",
  showUpgradeLink = true,
  className = "",
}: CategoryMultiSelectProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Normalize value to a string array of names
  const selected: string[] = Array.isArray(value)
    ? value.filter(Boolean)
    : (value || "").split(",").map((s) => s.trim()).filter(Boolean);

  useEffect(() => {
    void (async () => {
      // 1. Fast path: check session storage first
      const cached = sessionStorage.getItem("trimma_categories_cache");
      if (cached) {
        setCategories(JSON.parse(cached));
        setLoading(false);
      }

      try {
        const { data } = await supabase
          .from("categories")
          .select("id, name, slug")
          .order("name");
        if (data) {
          setCategories(data);
          sessionStorage.setItem("trimma_categories_cache", JSON.stringify(data));
        } else {
          console.error("Categories data is null or empty");
        }
      } catch (err) {
        console.error("Failed to load categories from Supabase:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const toggle = (name: string) => {
    const isSelected = selected.includes(name);
    if (isSelected) {
      onChange(selected.filter((s) => s !== name));
    } else {
      if (selected.length >= maxCategories) return; // blocked — upgrade needed
      onChange([...selected, name]);
    }
  };

  const atLimit = selected.length >= maxCategories;
  const isUnlimited = maxCategories >= 999;

  // ── Theme tokens ───────────────────────────────────────────────────────────
  const containerCls =
    theme === "dark"
      ? "bg-[#0D0D0D] border border-white/10 rounded-xl p-3 space-y-1 max-h-64 overflow-y-auto scrollbar-none"
      : "bg-white border border-zinc-200 rounded-xl p-3 space-y-1 max-h-64 overflow-y-auto scrollbar-none";

  const itemBase =
    "flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all select-none";
  const itemActive =
    theme === "dark"
      ? "bg-[#ffde5a]/15 border border-[#ffde5a]/30"
      : "bg-[#ffde5a]/10 border border-[#ffde5a]/30";
  const itemIdle =
    theme === "dark"
      ? "hover:bg-white/5 border border-transparent"
      : "hover:bg-zinc-50 border border-transparent";
  const itemLocked =
    theme === "dark"
      ? "opacity-40 cursor-not-allowed border border-transparent"
      : "opacity-40 cursor-not-allowed border border-transparent";

  const checkboxBase =
    "w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all";
  const checkboxActive = "bg-[#ffde5a] border-[#ffde5a]";
  const checkboxIdle =
    theme === "dark" ? "border-white/30 bg-transparent" : "border-zinc-300 bg-transparent";

  const labelActive =
    theme === "dark" ? "text-white font-semibold" : "text-zinc-900 font-semibold";
  const labelIdle =
    theme === "dark" ? "text-zinc-400 font-medium" : "text-zinc-600 font-medium";

  if (loading) {
    return (
      <div
        className={`${containerCls} flex items-center justify-center h-24 ${className}`}
      >
        <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
        <span className="ml-2 text-xs text-zinc-400">Loading categories…</span>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Counter + limit badge */}
      <div className="flex items-center justify-between mb-1">
        <span
          className={`text-[10px] font-bold uppercase tracking-widest ${
            theme === "dark" ? "text-zinc-500" : "text-zinc-400"
          }`}
        >
          {selected.length} / {isUnlimited ? "∞" : maxCategories} selected
        </span>
        {!isUnlimited && (
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              atLimit
                ? "bg-amber-500/15 text-amber-400 border border-amber-500/20"
                : "bg-[#ffde5a]/10 text-[#ffde5a] border border-[#ffde5a]/20"
            }`}
          >
            {planName} Plan · {maxCategories} max
          </span>
        )}
      </div>

      {/* Checkbox list */}
      <div className={containerCls}>
        {categories.length === 0 ? (
          <p className="text-xs text-zinc-400 text-center py-4">
            No categories found. Ask your admin to create some.
          </p>
        ) : (
          categories.map((cat) => {
            const isActive = selected.includes(cat.name);
            const isBlocked = atLimit && !isActive;
            return (
              <div
                key={cat.id}
                role="checkbox"
                aria-checked={isActive}
                tabIndex={0}
                onClick={() => toggle(cat.name)}
                onKeyDown={(e) => e.key === " " && toggle(cat.name)}
                className={`${itemBase} ${
                  isActive ? itemActive : isBlocked ? itemLocked : itemIdle
                }`}
              >
                {/* Custom checkbox */}
                <span
                  className={`${checkboxBase} ${
                    isActive ? checkboxActive : checkboxIdle
                  }`}
                >
                  {isActive && <Check className="w-2.5 h-2.5 text-black" strokeWidth={3} />}
                </span>

                {/* Category name */}
                <span
                  className={`text-sm flex-1 ${
                    isActive ? labelActive : labelIdle
                  }`}
                >
                  {cat.name}
                </span>

                {/* Lock icon when at limit and not selected */}
                {isBlocked && (
                  <Lock className="w-3 h-3 text-zinc-500 shrink-0" />
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Upgrade prompt — shown when at limit */}
      {atLimit && !isUnlimited && (
        <div
          className={`flex items-start gap-3 rounded-xl p-3 border ${
            theme === "dark"
              ? "bg-amber-500/8 border-amber-500/20"
              : "bg-amber-50 border-amber-200"
          }`}
        >
          <Sparkles
            className={`w-4 h-4 shrink-0 mt-0.5 ${
              theme === "dark" ? "text-amber-400" : "text-amber-600"
            }`}
          />
          <div className="flex-1 min-w-0">
            <p
              className={`text-xs font-bold ${
                theme === "dark" ? "text-amber-300" : "text-amber-700"
              }`}
            >
              Category limit reached for {planName} plan
            </p>
            <p
              className={`text-[11px] mt-0.5 ${
                theme === "dark" ? "text-amber-400/80" : "text-amber-600"
              }`}
            >
              Upgrade to Starter (5 categories) or Pro (unlimited) to unlock more.
            </p>
            {showUpgradeLink && (
              <Link
                href="/dashboard/billing"
                className="inline-flex items-center gap-1 mt-2 text-[11px] font-bold text-[#ffde5a] hover:underline"
              >
                <Sparkles className="w-3 h-3" />
                Upgrade plan
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Selected tags display */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {selected.map((name) => (
            <span
              key={name}
              className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full ${
                theme === "dark"
                  ? "bg-[#ffde5a]/15 text-[#ffde5a] border border-[#ffde5a]/25"
                  : "bg-[#ffde5a]/10 text-[#C99700] border border-[#ffde5a]/30"
              }`}
            >
              <Tag className="w-2.5 h-2.5" />
              {name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
