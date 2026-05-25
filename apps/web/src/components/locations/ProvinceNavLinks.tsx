import Link from "next/link";
import { SRI_LANKA_PROVINCES } from "@/lib/sri-lanka-locations";

type ProvinceNavLinksProps = {
  activeProvinceSlug?: string;
};

export function ProvinceNavLinks({ activeProvinceSlug }: ProvinceNavLinksProps) {
  return (
    <div className="flex gap-2 shrink-0">
      <Link
        href="/locations"
        className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all ${
          !activeProvinceSlug
            ? "bg-zinc-950 text-white shadow-sm"
            : "bg-slate-100 hover:bg-slate-200 text-zinc-700"
        }`}
      >
        All Regions
      </Link>
      {SRI_LANKA_PROVINCES.map((province) => (
        <Link
          key={province.slug}
          href={`/locations/${province.slug}`}
          className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all whitespace-nowrap ${
            activeProvinceSlug === province.slug
              ? "bg-zinc-950 text-white shadow-sm"
              : "bg-slate-100 hover:bg-slate-200 text-zinc-700"
          }`}
        >
          {province.shortName}
        </Link>
      ))}
    </div>
  );
}
