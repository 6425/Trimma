"use client";

import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import type { PublicCategory } from "@/lib/public-categories";
import { SALON_HERO_IMAGE_RESOLUTION_LABEL } from "@/lib/salon-hero-image";
import { useGeographyCatalog } from "@/lib/use-geography-catalog";

export type BusinessListingFormState = {
  name: string;
  categoryId: string;
  province: string;
  district: string;
  city: string;
  address: string;
  phone: string;
  rating: string;
  reviewCount: string;
  website: string;
  mapUrl: string;
  placeId: string;
  latitude: string;
  longitude: string;
  description: string;
  logoUrl: string;
  heroUrl: string;
};

export function emptyBusinessListingForm(categoryId = ""): BusinessListingFormState {
  return {
    name: "",
    categoryId,
    province: "",
    district: "",
    city: "",
    address: "",
    phone: "",
    rating: "",
    reviewCount: "",
    website: "",
    mapUrl: "",
    placeId: "",
    latitude: "",
    longitude: "",
    description: "",
    logoUrl: "",
    heroUrl: "",
  };
}
type Props = {
  value: BusinessListingFormState;
  onChange: (updates: Partial<BusinessListingFormState>) => void;
  categories: PublicCategory[];
  idPrefix: string;
  showGoogleTrustFields?: boolean;
};

const labelClass = "text-[10px] font-bold uppercase tracking-wide text-zinc-500";
const inputClass = "h-11 rounded-xl border-zinc-200 bg-zinc-50 text-sm";
const selectClass =
  "h-11 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-sm font-medium text-zinc-800 disabled:opacity-40";

export function BusinessListingDetailsFields({
  value,
  onChange,
  categories,
  idPrefix,
  showGoogleTrustFields = false,
}: Props) {
  const geography = useGeographyCatalog();
  const districts = useMemo(() => {
    if (!value.province) return [];
    return geography.find((province) => province.name === value.province)?.districts || [];
  }, [geography, value.province]);
  const cities = useMemo(() => {
    if (!value.district) return [];
    return districts.find((district) => district.name === value.district)?.cities || [];
  }, [districts, value.district]);
  const fieldId = (name: string) => `${idPrefix}-${name}`;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <div className="space-y-1.5 md:col-span-2">
        <label htmlFor={fieldId("business-name")} className={labelClass}>Business name *</label>
        <Input id={fieldId("business-name")} value={value.name} maxLength={200} onChange={(event) => onChange({ name: event.target.value })} placeholder="Salon, spa or wellness business name" className={inputClass} />
      </div>
      <div className="space-y-1.5">
        <label htmlFor={fieldId("category")} className={labelClass}>Trimma category *</label>
        <select id={fieldId("category")} value={value.categoryId} onChange={(event) => onChange({ categoryId: event.target.value })} className={selectClass}>
          <option value="">Choose a category…</option>
          {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
        </select>
      </div>
      <div className="space-y-1.5">
        <label htmlFor={fieldId("province")} className={labelClass}>Province *</label>
        <select id={fieldId("province")} value={value.province} onChange={(event) => onChange({ province: event.target.value, district: "", city: "" })} className={selectClass}>
          <option value="">Choose…</option>
          {geography.map((province) => <option key={province.slug} value={province.name}>{province.name}</option>)}
        </select>
      </div>
      <div className="space-y-1.5">
        <label htmlFor={fieldId("district")} className={labelClass}>District *</label>
        <select id={fieldId("district")} value={value.district} disabled={!value.province} onChange={(event) => onChange({ district: event.target.value, city: "" })} className={selectClass}>
          <option value="">Choose…</option>
          {districts.map((district) => <option key={district.slug} value={district.name}>{district.name}</option>)}
        </select>
      </div>
      <div className="space-y-1.5">
        <label htmlFor={fieldId("city")} className={labelClass}>City</label>
        <select id={fieldId("city")} value={value.city} disabled={!value.district} onChange={(event) => onChange({ city: event.target.value })} className={selectClass}>
          <option value="">Choose…</option>
          {cities.map((city) => <option key={city} value={city}>{city}</option>)}
        </select>
      </div>
      <div className="space-y-1.5 md:col-span-2">
        <label htmlFor={fieldId("address")} className={labelClass}>Full address *</label>
        <Input id={fieldId("address")} value={value.address} maxLength={500} onChange={(event) => onChange({ address: event.target.value })} placeholder="Street address and area" className={inputClass} />
      </div>
      <div className="space-y-1.5">
        <label htmlFor={fieldId("phone")} className={labelClass}>Business phone *</label>
        <Input id={fieldId("phone")} type="tel" value={value.phone} maxLength={50} onChange={(event) => onChange({ phone: event.target.value })} placeholder="+94…" className={inputClass} />
      </div>
      {showGoogleTrustFields && (
        <>
          <div className="space-y-1.5">
            <label htmlFor={fieldId("rating")} className={labelClass}>Google rating</label>
            <Input id={fieldId("rating")} type="number" min={0} max={5} step={0.1} value={value.rating} onChange={(event) => onChange({ rating: event.target.value })} placeholder="4.8" className={inputClass} />
          </div>
          <div className="space-y-1.5">
            <label htmlFor={fieldId("review-count")} className={labelClass}>Google reviews</label>
            <Input id={fieldId("review-count")} type="number" min={0} step={1} value={value.reviewCount} onChange={(event) => onChange({ reviewCount: event.target.value })} placeholder="125" className={inputClass} />
          </div>
        </>
      )}
      <div className="space-y-1.5">
        <label htmlFor={fieldId("website")} className={labelClass}>Website</label>
        <Input id={fieldId("website")} type="url" value={value.website} onChange={(event) => onChange({ website: event.target.value })} placeholder="https://…" className={inputClass} />
      </div>
      <div className="space-y-1.5">
        <label htmlFor={fieldId("map-url")} className={labelClass}>Google Maps URL</label>
        <Input id={fieldId("map-url")} type="url" value={value.mapUrl} onChange={(event) => onChange({ mapUrl: event.target.value })} placeholder="https://maps.google.com/…" className={inputClass} />
      </div>
      <div className="space-y-1.5">
        <label htmlFor={fieldId("place-id")} className={labelClass}>Google Place ID</label>
        <Input id={fieldId("place-id")} value={value.placeId} maxLength={255} onChange={(event) => onChange({ placeId: event.target.value })} placeholder="Optional exact-match ID" className={inputClass} />
      </div>
      <div className="space-y-1.5">
        <label htmlFor={fieldId("latitude")} className={labelClass}>Latitude</label>
        <Input id={fieldId("latitude")} type="number" step="any" min={-90} max={90} value={value.latitude} onChange={(event) => onChange({ latitude: event.target.value })} placeholder="6.9271" className={inputClass} />
      </div>
      <div className="space-y-1.5">
        <label htmlFor={fieldId("longitude")} className={labelClass}>Longitude</label>
        <Input id={fieldId("longitude")} type="number" step="any" min={-180} max={180} value={value.longitude} onChange={(event) => onChange({ longitude: event.target.value })} placeholder="79.8612" className={inputClass} />
      </div>
      <div className="space-y-1.5">
        <label htmlFor={fieldId("logo-url")} className={labelClass}>Logo URL</label>
        <Input id={fieldId("logo-url")} type="url" value={value.logoUrl} onChange={(event) => onChange({ logoUrl: event.target.value })} placeholder="https://…" className={inputClass} />
      </div>
      <div className="space-y-1.5 md:col-span-2">
        <label htmlFor={fieldId("hero-url")} className={labelClass}>Hero image URL ({SALON_HERO_IMAGE_RESOLUTION_LABEL}, 4:3)</label>
        <Input id={fieldId("hero-url")} type="url" value={value.heroUrl} onChange={(event) => onChange({ heroUrl: event.target.value })} placeholder="https://…" className={inputClass} />
        <p className="text-[11px] text-zinc-400">Hero photos use the same 800×600 display size across claimed and newly listed businesses.</p>
      </div>
      <div className="space-y-1.5 md:col-span-3">
        <label htmlFor={fieldId("description")} className={labelClass}>About the business</label>
        <textarea id={fieldId("description")} value={value.description} maxLength={4_000} rows={4} onChange={(event) => onChange({ description: event.target.value })} placeholder="Short description of the business…" className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3 text-sm font-medium text-zinc-800 outline-none focus:border-zinc-400" />
      </div>
    </div>
  );
}
