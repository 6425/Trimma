"use client";

import { useMemo, useState } from "react";
import { Loader2, Pencil, Plus, Save, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ListingQueueRow } from "@/lib/listing-generation-queue";
import type { PublicCategory } from "@/lib/public-categories";
import { normalizePublicImageUrl } from "@/lib/public-image-url";
import { SALON_HERO_IMAGE_RESOLUTION_LABEL } from "@/lib/salon-hero-image";
import { saveCity } from "@/app/actions/admin-territories";
import {
  notifyGeographyCatalogChanged,
  useGeographyCatalog,
} from "@/lib/use-geography-catalog";

export type ListingEditValues = {
  name: string;
  category: string;
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

function initialValues(row: ListingQueueRow): ListingEditValues {
  return {
    name: row.name || "",
    category: row.category || "",
    province: row.province || "",
    district: row.district || "",
    city: row.city || "",
    address: row.address || "",
    phone: row.phone || "",
    rating: row.rating == null ? "" : String(row.rating),
    reviewCount: row.review_count == null ? "" : String(row.review_count),
    website: row.website || "",
    mapUrl: row.map_url || "",
    placeId: row.place_id || "",
    latitude: row.latitude == null ? "" : String(row.latitude),
    longitude: row.longitude == null ? "" : String(row.longitude),
    description: row.description || row.summary || "",
    logoUrl: row.logo_url || "",
    heroUrl: row.hero_url || "",
  };
}

const LABEL_CLASS = "text-[10px] font-bold uppercase tracking-wide text-zinc-500";
const INPUT_CLASS = "h-11 rounded-xl border-zinc-200 bg-zinc-50 text-xs";
const SELECT_CLASS =
  "h-11 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-xs font-medium text-zinc-800 disabled:opacity-40";

function isValidPublicImageUrl(value: string): boolean {
  if (!value.trim()) return true;
  return normalizePublicImageUrl(value) !== null;
}

export function ListingEditDialog({
  row,
  categories,
  saving,
  onCancel,
  onSave,
}: {
  row: ListingQueueRow;
  categories: PublicCategory[];
  saving: boolean;
  onCancel: () => void;
  onSave: (values: ListingEditValues) => void | Promise<void>;
}) {
  const [values, setValues] = useState<ListingEditValues>(() => initialValues(row));
  const [showNewCity, setShowNewCity] = useState(false);
  const [newCityName, setNewCityName] = useState("");
  const [addingCity, setAddingCity] = useState(false);
  const [localCities, setLocalCities] = useState<Record<string, string[]>>({});
  const geography = useGeographyCatalog();

  const update = (updates: Partial<ListingEditValues>) => {
    setValues((current) => ({ ...current, ...updates }));
  };

  const districts = useMemo(
    () => geography.find((province) => province.name === values.province)?.districts || [],
    [geography, values.province]
  );
  const selectedDistrict = districts.find((district) => district.name === values.district);
  const cities = [
    ...(selectedDistrict?.cities || []),
    ...(selectedDistrict?.id ? localCities[selectedDistrict.id] || [] : []),
  ].filter((city, index, list) => list.indexOf(city) === index);
  const categoryNames = useMemo(() => new Set(categories.map((category) => category.name)), [categories]);
  const knownProvince = geography.some((province) => province.name === values.province);
  const knownDistrict = districts.some((district) => district.name === values.district);
  const knownCity = cities.includes(values.city);

  const addCity = async () => {
    const name = newCityName.trim();
    if (!name || !selectedDistrict?.id) {
      toast.error("Choose a database-backed district and enter the new city name.");
      return;
    }
    try {
      setAddingCity(true);
      const result = await saveCity({ name, district_id: selectedDistrict.id });
      if (result.success === false) throw new Error(result.error);
      const savedName = result.city.name as string;
      setLocalCities((current) => ({
        ...current,
        [selectedDistrict.id as string]: [...(current[selectedDistrict.id as string] || []), savedName],
      }));
      update({ city: savedName });
      setNewCityName("");
      setShowNewCity(false);
      notifyGeographyCatalogChanged();
      toast.success(`${savedName} added to City Management and all location dropdowns.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add city.");
    } finally {
      setAddingCity(false);
    }
  };

  const submit = () => {
    if (
      !values.name.trim() ||
      !values.category ||
      !values.province ||
      !values.district ||
      !values.address.trim()
    ) {
      toast.error("Business name, category, province, district, and address are required.");
      return;
    }
    if (Boolean(values.latitude) !== Boolean(values.longitude)) {
      toast.error("Enter both latitude and longitude, or leave both empty.");
      return;
    }
    if (values.rating && (Number(values.rating) < 0 || Number(values.rating) > 5)) {
      toast.error("Google rating must be between 0 and 5.");
      return;
    }
    if (values.reviewCount && (!Number.isSafeInteger(Number(values.reviewCount)) || Number(values.reviewCount) < 0)) {
      toast.error("Google reviews must be a non-negative whole number.");
      return;
    }
    if (!isValidPublicImageUrl(values.logoUrl) || !isValidPublicImageUrl(values.heroUrl)) {
      toast.error("Use a public image URL or a full Google Maps photo URL.");
      return;
    }
    void onSave(values);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="listing-edit-title"
    >
      <div className="flex max-h-[96vh] w-full max-w-5xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-h-[92vh] sm:rounded-3xl">
        <div className="flex items-start justify-between gap-4 border-b border-zinc-100 px-5 py-4 sm:px-7">
          <div>
            <h2 id="listing-edit-title" className="flex items-center gap-2 text-lg font-bold text-zinc-900">
              <Pencil className="h-4 w-4 text-brand" /> Edit {row.name}
            </h2>
            <p className="mt-1 text-xs text-zinc-500">
              Update the complete public business listing. Publication and booking settings are unchanged.
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={saving}
            onClick={onCancel}
            aria-label="Close listing editor"
            className="shrink-0"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="overflow-y-auto px-5 py-5 sm:px-7">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-1.5 md:col-span-2">
              <label htmlFor="listing-edit-name" className={LABEL_CLASS}>Business name *</label>
              <Input id="listing-edit-name" value={values.name} maxLength={200} onChange={(event) => update({ name: event.target.value })} className={INPUT_CLASS} />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="listing-edit-category" className={LABEL_CLASS}>Trimma category *</label>
              <select id="listing-edit-category" value={values.category} onChange={(event) => update({ category: event.target.value })} className={SELECT_CLASS}>
                {!categoryNames.has(values.category) && values.category ? <option value={values.category}>{values.category}</option> : null}
                <option value="">Choose…</option>
                {categories.map((category) => <option key={category.id} value={category.name}>{category.name}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="listing-edit-province" className={LABEL_CLASS}>Province *</label>
              <select
                id="listing-edit-province"
                value={values.province}
                onChange={(event) => update({ province: event.target.value, district: "", city: "" })}
                className={SELECT_CLASS}
              >
                {!knownProvince && values.province ? <option value={values.province}>{values.province} (select a standard province)</option> : null}
                <option value="">Choose…</option>
                {geography.map((province) => <option key={province.slug} value={province.name}>{province.name}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="listing-edit-district" className={LABEL_CLASS}>District *</label>
              <select
                id="listing-edit-district"
                value={values.district}
                disabled={!values.province}
                onChange={(event) => update({ district: event.target.value, city: "" })}
                className={SELECT_CLASS}
              >
                {!knownDistrict && values.district ? <option value={values.district}>{values.district} (select a standard district)</option> : null}
                <option value="">Choose…</option>
                {districts.map((district) => <option key={district.slug} value={district.name}>{district.name}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <label htmlFor="listing-edit-city" className={LABEL_CLASS}>City</label>
                <button
                  type="button"
                  className="inline-flex items-center text-[10px] font-bold text-zinc-700 hover:text-black disabled:opacity-40"
                  disabled={!selectedDistrict?.id || saving}
                  onClick={() => setShowNewCity((current) => !current)}
                >
                  <Plus className="mr-1 h-3 w-3" /> Add new city
                </button>
              </div>
              <select id="listing-edit-city" value={values.city} disabled={!values.district} onChange={(event) => update({ city: event.target.value })} className={SELECT_CLASS}>
                {!knownCity && values.city ? <option value={values.city}>{values.city} (select a standard city)</option> : null}
                <option value="">Choose…</option>
                {cities.map((city) => <option key={city} value={city}>{city}</option>)}
              </select>
              {showNewCity ? (
                <div className="flex gap-2">
                  <Input
                    value={newCityName}
                    maxLength={120}
                    placeholder={`New city in ${values.district}`}
                    onChange={(event) => setNewCityName(event.target.value)}
                    className={INPUT_CLASS}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    disabled={addingCity || !newCityName.trim()}
                    onClick={() => void addCity()}
                    className="h-11 min-h-11 shrink-0 font-bold"
                  >
                    {addingCity ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
                  </Button>
                </div>
              ) : null}
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label htmlFor="listing-edit-address" className={LABEL_CLASS}>Full address *</label>
              <Input id="listing-edit-address" value={values.address} maxLength={500} onChange={(event) => update({ address: event.target.value })} className={INPUT_CLASS} />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="listing-edit-phone" className={LABEL_CLASS}>Phone</label>
              <Input id="listing-edit-phone" type="tel" value={values.phone} maxLength={50} onChange={(event) => update({ phone: event.target.value })} className={INPUT_CLASS} />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="listing-edit-rating" className={LABEL_CLASS}>Google rating</label>
              <Input id="listing-edit-rating" type="number" min={0} max={5} step={0.1} value={values.rating} onChange={(event) => update({ rating: event.target.value })} placeholder="4.8" className={INPUT_CLASS} />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="listing-edit-review-count" className={LABEL_CLASS}>Google reviews</label>
              <Input id="listing-edit-review-count" type="number" min={0} step={1} value={values.reviewCount} onChange={(event) => update({ reviewCount: event.target.value })} placeholder="125" className={INPUT_CLASS} />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="listing-edit-website" className={LABEL_CLASS}>Website</label>
              <Input id="listing-edit-website" type="url" value={values.website} onChange={(event) => update({ website: event.target.value })} placeholder="https://…" className={INPUT_CLASS} />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="listing-edit-map-url" className={LABEL_CLASS}>Google Maps URL</label>
              <Input id="listing-edit-map-url" type="url" value={values.mapUrl} onChange={(event) => update({ mapUrl: event.target.value })} placeholder="https://maps.google.com/…" className={INPUT_CLASS} />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="listing-edit-place-id" className={LABEL_CLASS}>Google Place ID</label>
              <Input id="listing-edit-place-id" value={values.placeId} maxLength={255} onChange={(event) => update({ placeId: event.target.value })} className={INPUT_CLASS} />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="listing-edit-latitude" className={LABEL_CLASS}>Latitude</label>
              <Input id="listing-edit-latitude" type="number" step="any" min={-90} max={90} value={values.latitude} onChange={(event) => update({ latitude: event.target.value })} className={INPUT_CLASS} />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="listing-edit-longitude" className={LABEL_CLASS}>Longitude</label>
              <Input id="listing-edit-longitude" type="number" step="any" min={-180} max={180} value={values.longitude} onChange={(event) => update({ longitude: event.target.value })} className={INPUT_CLASS} />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="listing-edit-logo" className={LABEL_CLASS}>Logo URL</label>
              <Input id="listing-edit-logo" type="url" value={values.logoUrl} onChange={(event) => update({ logoUrl: event.target.value })} placeholder="https://…" className={INPUT_CLASS} />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label htmlFor="listing-edit-hero" className={LABEL_CLASS}>Hero image URL ({SALON_HERO_IMAGE_RESOLUTION_LABEL}, 4:3)</label>
              <Input id="listing-edit-hero" type="url" value={values.heroUrl} onChange={(event) => update({ heroUrl: event.target.value })} placeholder="https://…" className={INPUT_CLASS} />
              <p className="text-[11px] text-zinc-400">Google and uploaded hero photos use the same 800×600 crop as claimed business profiles.</p>
            </div>

            <div className="space-y-1.5 md:col-span-3">
              <label htmlFor="listing-edit-description" className={LABEL_CLASS}>About the business</label>
              <textarea
                id="listing-edit-description"
                value={values.description}
                maxLength={4000}
                rows={5}
                onChange={(event) => update({ description: event.target.value })}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3 text-xs font-medium text-zinc-800 outline-none focus:border-zinc-400"
              />
              <p className="text-right text-[11px] text-zinc-400">{values.description.length} / 4000</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-zinc-100 bg-white px-5 py-4 sm:flex-row sm:justify-end sm:px-7">
          <Button type="button" variant="outline" disabled={saving} onClick={onCancel} className="h-11 min-h-11 w-full font-bold sm:w-auto">Cancel</Button>
          <Button type="button" variant="dark" disabled={saving} onClick={submit} className="h-11 min-h-11 w-full px-6 font-bold sm:w-auto">
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {saving ? "Saving…" : "Save listing"}
          </Button>
        </div>
      </div>
    </div>
  );
}
