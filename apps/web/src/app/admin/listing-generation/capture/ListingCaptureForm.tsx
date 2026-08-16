"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Loader2, ScanSearch, MapPin, Compass, Filter, Hash } from "lucide-react";
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

export function ListingCaptureForm({ categories, servicesByCategoryId }: Props) {
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState(() => categories[0]?.id || "");
  const [fetchLimit, setFetchLimit] = useState(0);
  const [capturing, setCapturing] = useState(false);

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
