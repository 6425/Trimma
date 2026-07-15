"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Scissors, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { StyleSaveButton } from "../../components/styles/StyleSaveButton";
import type { PublicPlatformStyle } from "../actions/platform-styles";

type StylesGalleryProps = {
  initialStyles: PublicPlatformStyle[];
  initialError: string | null;
};

export function StylesGallery({ initialStyles, initialError }: StylesGalleryProps) {
  const [activeCategoryId, setActiveCategoryId] = useState<string>("all");

  const groupedByCategory = useMemo(() => {
    const map = new Map<string, { category: NonNullable<PublicPlatformStyle["categories"]>; styles: PublicPlatformStyle[] }>();

    for (const style of initialStyles) {
      const category = style.categories;
      if (!category) continue;

      const existing = map.get(category.id);
      if (existing) {
        existing.styles.push(style);
      } else {
        map.set(category.id, { category, styles: [style] });
      }
    }

    // Within each category, sort by style family name then by trailing number
    // e.g. "3D Luxury Nail Art 03" → family="3D Luxury Nail Art", num=3
    function styleSort(a: PublicPlatformStyle, b: PublicPlatformStyle) {
      const parse = (title: string) => {
        const m = title.match(/^(.*?)\s*(\d+)\s*$/);
        return m ? { family: m[1].trim(), num: parseInt(m[2], 10) } : { family: title.trim(), num: 0 };
      };
      const pa = parse(a.title);
      const pb = parse(b.title);
      const famCmp = pa.family.localeCompare(pb.family);
      return famCmp !== 0 ? famCmp : pa.num - pb.num;
    }

    return Array.from(map.values())
      .map((group) => ({ ...group, styles: [...group.styles].sort(styleSort) }))
      .sort((a, b) => a.category.name.localeCompare(b.category.name));
  }, [initialStyles]);

  const visibleGroups =
    activeCategoryId === "all"
      ? groupedByCategory
      : groupedByCategory.filter((g) => g.category.id === activeCategoryId);

  return (
    <div className="min-h-screen bg-slate-50">
      <section className="page-hero-shell py-12 md:py-16">
        <div className="container mx-auto px-4 max-w-6xl relative z-10 text-center">
          <Badge variant="hero" className="mb-6">
            <Sparkles className="w-3.5 h-3.5 inline mr-1.5" />
            Trimma Style Lookbook
          </Badge>
          <h1 className="text-3xl md:text-5xl font-black text-zinc-900 tracking-tight mb-3">
            Latest Styles by Category
          </h1>
          <p className="text-zinc-700 text-sm md:text-base max-w-xl mx-auto">
            Browse looks grouped by salon service category. Bookmark styles to save them in your customer dashboard.
          </p>
          <Link
            href="/customer/styles"
            className="inline-flex mt-6 text-sm font-bold text-zinc-900 hover:underline underline-offset-4"
          >
            View my saved styles →
          </Link>
        </div>
      </section>

      <div className="container mx-auto px-4 max-w-6xl py-10 md:py-14">
        {initialError ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-red-200 max-w-lg mx-auto px-6">
            <Scissors className="w-12 h-12 mx-auto mb-4 text-red-300" />
            <h2 className="font-bold text-zinc-900">Could not load styles</h2>
            <p className="text-sm text-zinc-500 mt-2">{initialError}</p>
          </div>
        ) : groupedByCategory.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 max-w-lg mx-auto">
            <Scissors className="w-12 h-12 mx-auto mb-4 text-zinc-300" />
            <h2 className="font-bold text-zinc-900">No styles published yet</h2>
            <p className="text-sm text-zinc-500 mt-2">Check back soon for fresh looks from Trimma partners.</p>
          </div>
        ) : (
          <div className="space-y-10">
            <div className="flex flex-wrap gap-2 justify-center">
              <button
                type="button"
                onClick={() => setActiveCategoryId("all")}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                  activeCategoryId === "all"
                    ? "bg-[#ffde5a] text-black"
                    : "bg-white border border-slate-200 text-zinc-600 hover:border-[#ffde5a]/40"
                }`}
              >
                All Categories
              </button>
              {groupedByCategory.map(({ category }) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setActiveCategoryId(category.id)}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                    activeCategoryId === category.id
                      ? "bg-[#ffde5a] text-black"
                      : "bg-white border border-slate-200 text-zinc-600 hover:border-[#ffde5a]/40"
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>

            {visibleGroups.map(({ category, styles: categoryStyles }) => (
              <section key={category.id} id={`category-${category.slug}`} className="scroll-mt-24">
                <div className="flex items-end justify-between gap-4 mb-5">
                  <div>
                    <h2 className="text-2xl font-black text-zinc-900 tracking-tight">{category.name}</h2>
                    <p className="text-sm text-zinc-500 mt-1">
                      {categoryStyles.length} style{categoryStyles.length === 1 ? "" : "s"} in this category
                    </p>
                  </div>
                  <Link
                    href={`/category/${category.slug}`}
                    className="text-xs font-bold text-[#ffde5a] hover:underline shrink-0"
                  >
                    Find salons →
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                  {categoryStyles.map((style) => (
                    <article
                      key={style.id}
                      className="group bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-lg transition-all"
                    >
                      <div className="relative aspect-[4/5] bg-slate-100">
                        <Image
                          src={style.image_url}
                          alt={style.title}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 25vw"
                          className="object-cover"
                        />
                        <StyleSaveButton styleId={style.id} styleTitle={style.title} />
                      </div>
                      <div className="p-4 space-y-2">
                        <Badge variant="secondary" className="text-[10px] uppercase tracking-wide">
                          {category.name}
                        </Badge>
                        <h3 className="font-extrabold text-zinc-900">{style.title}</h3>
                        {style.description && (
                          <p className="text-xs text-zinc-500 leading-relaxed">{style.description}</p>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
