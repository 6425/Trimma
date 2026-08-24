"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Loader2, ScanSearch, MapPin, Compass, Filter, Hash, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import type { PublicCategory } from "@/lib/public-categories";
import type { GlobalServiceSummary } from "@/lib/listing-generation-categories";
import { SRI_LANKA_PROVINCES } from "@/lib/sri-lanka-locations";
import { searchListingPlacesInBrowser } from "@/lib/google-places-browser";

type Props = {
  categories: PublicCategory[];
  servicesByCategoryId: Record<string, GlobalServiceSummary[]>;
};

type ManualListingFormState = {
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

function emptyManualListing(categoryId = ""): ManualListingFormState {
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

export function ListingCaptureForm({ categories, servicesByCategoryId }: Props) {
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState(() => categories[0]?.id || "");
  const [fetchLimit, setFetchLimit] = useState(0);
  const [capturing, setCapturing] = useState(false);
  const [manualListing, setManualListing] = useState<ManualListingFormState>(() =>
    emptyManualListing(categories[0]?.id || "")
  );
  const [savingManual, setSavingManual] = useState(false);

  const selectedCategory = useMemo(
    () => categories.find((category) => category.id === selectedCategoryId) || categories[0] || null,
    [categories, selectedCategoryId]
  );

  const relatedServices = useMemo(() => {
    if (!selectedCategory?.id) return [];
    return servicesByCategoryId[selectedCategory.id] || [];
  }, [selectedCategory, servicesByCategoryId]);

  const districts = useMemo(() => {
    if (!selectedProvince) return [];
    return SRI_LANKA_PROVINCES.find((province) => province.name === selectedProvince)?.districts || [];
  }, [selectedProvince]);

  const cities = useMemo(() => {
    if (!selectedDistrict) return [];
    return districts.find((district) => district.name === selectedDistrict)?.cities || [];
  }, [districts, selectedDistrict]);

  const manualDistricts = useMemo(() => {
    if (!manualListing.province) return [];
    return (
      SRI_LANKA_PROVINCES.find((province) => province.name === manualListing.province)?.districts || []
    );
  }, [manualListing.province]);

  const manualCities = useMemo(() => {
    if (!manualListing.district) return [];
    return manualDistricts.find((district) => district.name === manualListing.district)?.cities || [];
  }, [manualDistricts, manualListing.district]);

  const updateManualListing = (updates: Partial<ManualListingFormState>) => {
    setManualListing((current) => ({ ...current, ...updates }));
  };

  const handleCapture = async () => {
    if (!selectedProvince || !selectedDistrict) {
      toast.error("Select province and district.");
      return;
    }
    if (!selectedCategory?.name) {
      toast.error("Select a category.");
      return;
    }

    const areaLabel = selectedCity || selectedDistrict;

    try {
      setCapturing(true);
      toast.loading(`Capturing listing data in ${areaLabel}…`, { id: "listing_capture" });

      let places: Awaited<ReturnType<typeof searchListingPlacesInBrowser>>["places"] = [];
      try {
        const browserSearch = await searchListingPlacesInBrowser({
          categoryName: selectedCategory.name,
          city: selectedCity || "",
          district: selectedDistrict,
          province: selectedProvince,
          globalServices: relatedServices,
          limit: fetchLimit,
        });
        places = browserSearch.places;
      } catch {
        places = [];
      }

      const response = await fetch("/api/listing-generation/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          province: selectedProvince,
          district: selectedDistrict,
          city: selectedCity || "",
          category: selectedCategory.name,
          categoryId: selectedCategory.id,
          limit: fetchLimit,
          places,
        }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        message?: string;
        count?: number;
        queued?: number;
      };
      if (!response.ok) throw new Error(data.error || `Capture failed (${response.status})`);

      const queued = data.queued ?? data.count ?? 0;
      toast.success(data.message || "Listing data captured.", { id: "listing_capture" });
      if (queued > 0) {
        toast.message(`${queued} listing(s) added to the Pending queue.`, {
          action: {
            label: "Open Pending",
            onClick: () => {
              window.location.href = "/admin/listing-generation/queue?tab=pending";
            },
          },
        });
      }
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Capture failed", { id: "listing_capture" });
    } finally {
      setCapturing(false);
    }
  };

  const handleManualListingSave = async () => {
    if (
      !manualListing.name.trim() ||
      !manualListing.categoryId ||
      !manualListing.province ||
      !manualListing.district ||
      !manualListing.address.trim()
    ) {
      toast.error("Business name, category, province, district, and address are required.");
      return;
    }
    if (Boolean(manualListing.latitude) !== Boolean(manualListing.longitude)) {
      toast.error("Enter both latitude and longitude, or leave both empty.");
      return;
    }
    if (manualListing.rating && (Number(manualListing.rating) < 0 || Number(manualListing.rating) > 5)) {
      toast.error("Google rating must be between 0 and 5.");
      return;
    }
    if (
      manualListing.reviewCount &&
      (!Number.isSafeInteger(Number(manualListing.reviewCount)) || Number(manualListing.reviewCount) < 0)
    ) {
      toast.error("Google reviews must be a non-negative whole number.");
      return;
    }

    try {
      setSavingManual(true);
      toast.loading("Adding manual listing…", { id: "manual_listing_capture" });

      const response = await fetch("/api/listing-generation/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          mode: "manual",
          ...manualListing,
        }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        message?: string;
        salonId?: string;
      };
      if (!response.ok) throw new Error(data.error || `Save failed (${response.status})`);

      toast.success(data.message || "Manual listing added to the Pending queue.", {
        id: "manual_listing_capture",
      });
      setManualListing(emptyManualListing(categories[0]?.id || ""));
      toast.message("Review the new listing before publishing.", {
        action: {
          label: "Open Pending",
          onClick: () => {
            window.location.href = "/admin/listing-generation/queue?tab=pending";
          },
        },
      });
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Manual listing could not be saved.", {
        id: "manual_listing_capture",
      });
    } finally {
      setSavingManual(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6 pb-12 duration-500">
      <div>
        <Link
          href="/admin/listing-generation"
          className="text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-zinc-800"
        >
          ← Salon Listing Generation
        </Link>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#1A1C29]">Data Capture</h1>
        <p className="mt-2 max-w-3xl text-sm text-zinc-600">
          Import Google Places businesses for a Trimma global category. Province and district are required; city is optional.
          Captured rows land in the{" "}
          <strong>Pending</strong> queue with Trimma category tags (a salon can appear under multiple categories
          after publish).
        </p>
      </div>

      <Card className="rounded-3xl border-none bg-amber-50 p-6 shadow-md">
        <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-[#1A1C29]">
          <ScanSearch className="h-5 w-5 text-brand" />
          Google Places data capture
        </h2>

        <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-6">
          <div className="space-y-1.5">
            <label className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide text-zinc-500">
              <Compass className="h-3.5 w-3.5" /> Province
            </label>
            <select
              value={selectedProvince}
              onChange={(e) => {
                setSelectedProvince(e.target.value);
                setSelectedDistrict("");
                setSelectedCity("");
              }}
              className="h-11 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-xs font-medium text-zinc-800"
            >
              <option value="">Choose…</option>
              {SRI_LANKA_PROVINCES.map((province) => (
                <option key={province.slug} value={province.name}>
                  {province.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide text-zinc-500">
              <MapPin className="h-3.5 w-3.5" /> District
            </label>
            <select
              value={selectedDistrict}
              disabled={!selectedProvince}
              onChange={(e) => {
                setSelectedDistrict(e.target.value);
                setSelectedCity("");
              }}
              className="h-11 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-xs font-medium text-zinc-800 disabled:opacity-40"
            >
              <option value="">Choose…</option>
              {districts.map((district) => (
                <option key={district.slug} value={district.name}>
                  {district.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide text-zinc-500">
              <MapPin className="h-3.5 w-3.5" /> City (optional)
            </label>
            <select
              value={selectedCity}
              disabled={!selectedDistrict}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="h-11 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-xs font-medium text-zinc-800 disabled:opacity-40"
            >
              <option value="">Any city</option>
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5 md:col-span-1">
            <label className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide text-zinc-500">
              <Filter className="h-3.5 w-3.5" /> Trimma category
            </label>
            <select
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              className="h-11 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-xs font-medium text-zinc-800"
            >
              {categories.length === 0 ? (
                <option value="">No categories configured</option>
              ) : (
                categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide text-zinc-500">
              <Hash className="h-3.5 w-3.5" /> Limit (0 = all)
            </label>
            <Input
              type="number"
              min={0}
              value={fetchLimit}
              onChange={(e) => setFetchLimit(Math.max(0, parseInt(e.target.value, 10) || 0))}
              className="h-11 rounded-xl border-zinc-200 bg-zinc-50 text-xs"
            />
          </div>

          <Button
            type="button"
            variant="dark"
            disabled={capturing || !selectedProvince || !selectedDistrict || !selectedCategory?.name}
            onClick={() => void handleCapture()}
            className="h-11 min-h-11 w-full rounded-xl text-xs font-bold"
          >
            {capturing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Capture listings"}
          </Button>
        </div>

        {selectedCategory && (
          <p className="mt-4 text-xs text-zinc-600">
            Google search targets <strong>{selectedCategory.name}</strong>
            {relatedServices.length > 0 && (
              <>
                {" "}
                using global services:{" "}
                <span className="font-semibold text-zinc-800">
                  {relatedServices
                    .slice(0, 4)
                    .map((service) => service.name)
                    .join(", ")}
                  {relatedServices.length > 4 ? "…" : ""}
                </span>
              </>
            )}
            . Matching salons are tagged for Trimma category pages after publish.
          </p>
        )}
      </Card>

      <Card className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-md">
        <div className="mb-5">
          <h2 className="flex items-center gap-2 text-base font-bold text-[#1A1C29]">
            <Building2 className="h-5 w-5 text-brand" />
            Add listing manually
          </h2>
          <p className="mt-1 text-xs text-zinc-500">
            Add one business without Google capture. It will remain hidden and non-bookable until you review and
            publish it from the Pending queue.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="space-y-1.5 md:col-span-2">
            <label htmlFor="manual-business-name" className="text-[9px] font-bold uppercase tracking-wide text-zinc-500">
              Business name *
            </label>
            <Input
              id="manual-business-name"
              value={manualListing.name}
              maxLength={200}
              onChange={(event) => updateManualListing({ name: event.target.value })}
              placeholder="Salon or spa name"
              className="h-11 rounded-xl border-zinc-200 bg-zinc-50 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="manual-category" className="text-[9px] font-bold uppercase tracking-wide text-zinc-500">
              Trimma category *
            </label>
            <select
              id="manual-category"
              value={manualListing.categoryId}
              onChange={(event) => updateManualListing({ categoryId: event.target.value })}
              className="h-11 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-xs font-medium text-zinc-800"
            >
              {categories.length === 0 ? (
                <option value="">No categories configured</option>
              ) : (
                categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="manual-province" className="text-[9px] font-bold uppercase tracking-wide text-zinc-500">
              Province *
            </label>
            <select
              id="manual-province"
              value={manualListing.province}
              onChange={(event) =>
                updateManualListing({ province: event.target.value, district: "", city: "" })
              }
              className="h-11 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-xs font-medium text-zinc-800"
            >
              <option value="">Choose…</option>
              {SRI_LANKA_PROVINCES.map((province) => (
                <option key={province.slug} value={province.name}>
                  {province.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="manual-district" className="text-[9px] font-bold uppercase tracking-wide text-zinc-500">
              District *
            </label>
            <select
              id="manual-district"
              value={manualListing.district}
              disabled={!manualListing.province}
              onChange={(event) => updateManualListing({ district: event.target.value, city: "" })}
              className="h-11 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-xs font-medium text-zinc-800 disabled:opacity-40"
            >
              <option value="">Choose…</option>
              {manualDistricts.map((district) => (
                <option key={district.slug} value={district.name}>
                  {district.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="manual-city" className="text-[9px] font-bold uppercase tracking-wide text-zinc-500">
              City
            </label>
            <select
              id="manual-city"
              value={manualListing.city}
              disabled={!manualListing.district}
              onChange={(event) => updateManualListing({ city: event.target.value })}
              className="h-11 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-xs font-medium text-zinc-800 disabled:opacity-40"
            >
              <option value="">Choose…</option>
              {manualCities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <label htmlFor="manual-address" className="text-[9px] font-bold uppercase tracking-wide text-zinc-500">
              Full address *
            </label>
            <Input
              id="manual-address"
              value={manualListing.address}
              maxLength={500}
              onChange={(event) => updateManualListing({ address: event.target.value })}
              placeholder="Street address and area"
              className="h-11 rounded-xl border-zinc-200 bg-zinc-50 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="manual-phone" className="text-[9px] font-bold uppercase tracking-wide text-zinc-500">
              Phone
            </label>
            <Input
              id="manual-phone"
              type="tel"
              value={manualListing.phone}
              maxLength={50}
              onChange={(event) => updateManualListing({ phone: event.target.value })}
              placeholder="+94…"
              className="h-11 rounded-xl border-zinc-200 bg-zinc-50 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="manual-rating" className="text-[9px] font-bold uppercase tracking-wide text-zinc-500">
              Google rating
            </label>
            <Input
              id="manual-rating"
              type="number"
              min={0}
              max={5}
              step={0.1}
              value={manualListing.rating}
              onChange={(event) => updateManualListing({ rating: event.target.value })}
              placeholder="4.8"
              className="h-11 rounded-xl border-zinc-200 bg-zinc-50 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="manual-review-count" className="text-[9px] font-bold uppercase tracking-wide text-zinc-500">
              Google reviews
            </label>
            <Input
              id="manual-review-count"
              type="number"
              min={0}
              step={1}
              value={manualListing.reviewCount}
              onChange={(event) => updateManualListing({ reviewCount: event.target.value })}
              placeholder="125"
              className="h-11 rounded-xl border-zinc-200 bg-zinc-50 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="manual-website" className="text-[9px] font-bold uppercase tracking-wide text-zinc-500">
              Website
            </label>
            <Input
              id="manual-website"
              type="url"
              value={manualListing.website}
              onChange={(event) => updateManualListing({ website: event.target.value })}
              placeholder="https://…"
              className="h-11 rounded-xl border-zinc-200 bg-zinc-50 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="manual-map-url" className="text-[9px] font-bold uppercase tracking-wide text-zinc-500">
              Google Maps URL
            </label>
            <Input
              id="manual-map-url"
              type="url"
              value={manualListing.mapUrl}
              onChange={(event) => updateManualListing({ mapUrl: event.target.value })}
              placeholder="https://maps.google.com/…"
              className="h-11 rounded-xl border-zinc-200 bg-zinc-50 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="manual-place-id" className="text-[9px] font-bold uppercase tracking-wide text-zinc-500">
              Google Place ID
            </label>
            <Input
              id="manual-place-id"
              value={manualListing.placeId}
              maxLength={255}
              onChange={(event) => updateManualListing({ placeId: event.target.value })}
              placeholder="Optional deduplication ID"
              className="h-11 rounded-xl border-zinc-200 bg-zinc-50 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="manual-latitude" className="text-[9px] font-bold uppercase tracking-wide text-zinc-500">
              Latitude
            </label>
            <Input
              id="manual-latitude"
              type="number"
              step="any"
              min={-90}
              max={90}
              value={manualListing.latitude}
              onChange={(event) => updateManualListing({ latitude: event.target.value })}
              placeholder="6.9271"
              className="h-11 rounded-xl border-zinc-200 bg-zinc-50 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="manual-longitude" className="text-[9px] font-bold uppercase tracking-wide text-zinc-500">
              Longitude
            </label>
            <Input
              id="manual-longitude"
              type="number"
              step="any"
              min={-180}
              max={180}
              value={manualListing.longitude}
              onChange={(event) => updateManualListing({ longitude: event.target.value })}
              placeholder="79.8612"
              className="h-11 rounded-xl border-zinc-200 bg-zinc-50 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="manual-logo-url" className="text-[9px] font-bold uppercase tracking-wide text-zinc-500">
              Logo URL
            </label>
            <Input
              id="manual-logo-url"
              type="url"
              value={manualListing.logoUrl}
              onChange={(event) => updateManualListing({ logoUrl: event.target.value })}
              placeholder="https://…"
              className="h-11 rounded-xl border-zinc-200 bg-zinc-50 text-xs"
            />
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <label htmlFor="manual-hero-url" className="text-[9px] font-bold uppercase tracking-wide text-zinc-500">
              Hero image URL
            </label>
            <Input
              id="manual-hero-url"
              type="url"
              value={manualListing.heroUrl}
              onChange={(event) => updateManualListing({ heroUrl: event.target.value })}
              placeholder="https://…"
              className="h-11 rounded-xl border-zinc-200 bg-zinc-50 text-xs"
            />
          </div>

          <div className="space-y-1.5 md:col-span-3">
            <label htmlFor="manual-description" className="text-[9px] font-bold uppercase tracking-wide text-zinc-500">
              About the business
            </label>
            <textarea
              id="manual-description"
              value={manualListing.description}
              maxLength={4_000}
              rows={4}
              onChange={(event) => updateManualListing({ description: event.target.value })}
              placeholder="Short public description of the business…"
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3 text-xs font-medium text-zinc-800 outline-none focus:border-zinc-400"
            />
          </div>
        </div>

        <div className="mt-5 flex flex-col items-start justify-between gap-3 border-t border-zinc-100 pt-5 sm:flex-row sm:items-center">
          <p className="max-w-2xl text-xs text-zinc-500">
            Matching business name/address combinations and Google Place IDs are blocked before saving.
          </p>
          <Button
            type="button"
            variant="dark"
            disabled={
              savingManual ||
              !manualListing.name.trim() ||
              !manualListing.categoryId ||
              !manualListing.province ||
              !manualListing.district ||
              !manualListing.address.trim()
            }
            onClick={() => void handleManualListingSave()}
            className="h-11 min-h-11 w-full rounded-xl px-6 text-xs font-bold sm:w-auto"
          >
            {savingManual ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add to Pending Queue"}
          </Button>
        </div>
      </Card>

      <p className="text-sm text-zinc-500">
        Next step: review captured rows in the{" "}
        <Link href="/admin/listing-generation/queue?tab=pending" className="font-bold text-zinc-800 underline">
          Pending queue
        </Link>{" "}
        and publish to the customer directory.
      </p>
    </div>
  );
}
