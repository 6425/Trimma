"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, ScanSearch, MapPin, Compass, Filter, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { normalizeAdminLeadCategoryOptions } from "@/lib/admin-lead-categories";

const SRI_LANKA_GEOGRAPHY: Record<string, Record<string, string[]>> = {
  "Western Province": {
    Colombo: ["Colombo", "Mount Lavinia", "Dehiwala", "Moratuwa", "Kotte"],
    Gampaha: ["Gampaha", "Negombo", "Kelaniya", "Wattala"],
    Kalutara: ["Kalutara", "Panadura", "Horana"],
  },
  "Central Province": {
    Kandy: ["Kandy", "Peradeniya", "Gampola"],
    Matale: ["Matale", "Dambulla"],
    "Nuwara Eliya": ["Nuwara Eliya", "Hatton"],
  },
  "Southern Province": {
    Galle: ["Galle", "Hikkaduwa", "Unawatuna"],
    Matara: ["Matara", "Weligama"],
    Hambantota: ["Hambantota", "Tangalle"],
  },
};

export default function ListingDataCapturePage() {
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(
    () => normalizeAdminLeadCategoryOptions([])[0]?.value || "beauty salon"
  );
  const [fetchLimit, setFetchLimit] = useState(15);
  const [capturing, setCapturing] = useState(false);

  const handleCapture = async () => {
    if (!selectedProvince || !selectedDistrict || !selectedCity) {
      toast.error("Select province, district, and city.");
      return;
    }
    if (!selectedCategory) {
      toast.error("Select a category.");
      return;
    }

    try {
      setCapturing(true);
      toast.loading(`Capturing listing data in ${selectedCity}…`, { id: "listing_capture" });

      const response = await fetch("/api/listing-generation/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          province: selectedProvince,
          district: selectedDistrict,
          city: selectedCity,
          category: selectedCategory,
          limit: fetchLimit,
        }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        message?: string;
        count?: number;
      };
      if (!response.ok) throw new Error(data.error || `Capture failed (${response.status})`);

      toast.success(data.message || "Listing data captured.", { id: "listing_capture" });
      if (typeof data.count === "number" && data.count > 0) {
        toast.message(`${data.count} listing(s) captured. Open the queue to review and publish.`, {
          action: {
            label: "Open queue",
            onClick: () => {
              window.location.href = "/admin/listing-generation/queue";
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
        <Link href="/admin/listing-generation" className="text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-zinc-800">
          ← Salon Listing Generation
        </Link>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#1A1C29]">Data Capture</h1>
        <p className="mt-2 max-w-3xl text-sm text-zinc-600">
          Import Google Places beauty businesses into the listing pipeline as{" "}
          <strong>LISTING_CAPTURED</strong>. Records stay hidden until you publish them from the listing queue.
          Does not enter the agent Lead Mgmt pipeline.
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
              {Object.keys(SRI_LANKA_GEOGRAPHY).map((p) => (
                <option key={p} value={p}>
                  {p}
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
              {selectedProvince &&
                Object.keys(SRI_LANKA_GEOGRAPHY[selectedProvince] || {}).map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide text-zinc-500">
              <MapPin className="h-3.5 w-3.5" /> City
            </label>
            <select
              value={selectedCity}
              disabled={!selectedDistrict}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="h-11 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-xs font-medium text-zinc-800 disabled:opacity-40"
            >
              <option value="">Choose…</option>
              {selectedProvince &&
                selectedDistrict &&
                (SRI_LANKA_GEOGRAPHY[selectedProvince]?.[selectedDistrict] || []).map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide text-zinc-500">
              <Filter className="h-3.5 w-3.5" /> Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="h-11 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-xs font-medium text-zinc-800"
            >
              {normalizeAdminLeadCategoryOptions([]).map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide text-zinc-500">
              <Hash className="h-3.5 w-3.5" /> Limit
            </label>
            <Input
              type="number"
              min={1}
              max={60}
              value={fetchLimit}
              onChange={(e) => setFetchLimit(Math.max(1, parseInt(e.target.value, 10) || 15))}
              className="h-11 rounded-xl border-zinc-200 bg-zinc-50 text-xs"
            />
          </div>

          <Button
            type="button"
            variant="dark"
            disabled={capturing || !selectedCity}
            onClick={() => void handleCapture()}
            className="h-11 min-h-11 w-full rounded-xl text-xs font-bold"
          >
            {capturing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Capture listings"}
          </Button>
        </div>
      </Card>

      <p className="text-sm text-zinc-500">
        Next step: review captured rows in{" "}
        <Link href="/admin/listing-generation/queue" className="font-bold text-zinc-800 underline">
          Listing queue
        </Link>{" "}
        and publish to the customer directory.
      </p>
    </div>
  );
}
