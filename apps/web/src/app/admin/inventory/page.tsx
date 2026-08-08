"use client";

import Link from "next/link";
import { FolderTree, Package, ArrowRight, Boxes } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";

const cards = [
  {
    title: "Inventory Categories",
    description: "Global taxonomy for retail, backbar, and disposable products — names, slugs, icons, and images.",
    href: "/admin/inventory/categories",
    icon: FolderTree,
    cta: "Manage categories",
  },
  {
    title: "Global Inventory Products",
    description: "Master product templates salons import into their stock — brand, unit, cost, and retail pricing.",
    href: "/admin/inventory/products",
    icon: Package,
    cta: "Manage products",
  },
];

export default function AdminInventoryHubPage() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 space-y-8 pb-12 duration-500">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-amber-800">
            <Boxes className="h-3.5 w-3.5" />
            Platform catalog
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-[#1A1C29]">Inventory Management</h1>
          <p className="mt-1 max-w-2xl font-medium text-zinc-500">
            Curate the global inventory catalog salon owners import from. Categories first, then products.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.href}
              href={card.href}
              className="group rounded-3xl border border-zinc-100 bg-white p-8 shadow-sm transition-all hover:border-amber-200 hover:shadow-md"
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/20 text-zinc-900">
                <Icon className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold text-[#1A1C29]">{card.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-zinc-500">{card.description}</p>
              <span className={buttonVariants({ variant: "dark" }) + " mt-6 inline-flex h-11 min-h-11 items-center rounded-xl px-5 text-xs font-bold"}>
                {card.cta}
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          );
        })}
      </div>

      <div className="rounded-3xl border border-zinc-100 bg-zinc-50 p-6">
        <h3 className="text-sm font-bold text-zinc-900">Salon owner flow</h3>
        <p className="mt-1 text-sm text-zinc-500">
          After you publish categories and products here, salon owners open{" "}
          <strong className="text-zinc-800">Dashboard → Inventory → Import Catalog</strong> to add items to their salon stock.
        </p>
        <Button asChild variant="outline" className="mt-4 h-11 min-h-11 rounded-xl font-bold">
          <Link href="/dashboard/inventory">Preview salon inventory UI</Link>
        </Button>
      </div>
    </div>
  );
}
