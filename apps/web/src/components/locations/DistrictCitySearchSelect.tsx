"use client";

import { Building2, MapPin } from "lucide-react";
import { useMemo } from "react";
import {
  normalizePlaceName,
  resolveLocationSearchScope,
  slugifyLocation,
  type SriLankaProvince,
} from "@/lib/sri-lanka-locations";
import { useGeographyCatalog } from "@/lib/use-geography-catalog";

type DistrictCitySelection = {
  district: string;
  city: string;
};

type Props = {
  value: string;
  onChange: (value: string) => void;
};

function findDistrict(
  provinces: SriLankaProvince[],
  districtNameOrSlug: string
) {
  const slug = slugifyLocation(districtNameOrSlug);
  const normalized = normalizePlaceName(districtNameOrSlug);
  for (const province of provinces) {
    const district = province.districts.find(
      (entry) =>
        entry.slug === slug || normalizePlaceName(entry.name) === normalized
    );
    if (district) return district;
  }
  return null;
}

function resolveSelection(
  provinces: SriLankaProvince[],
  value: string
): DistrictCitySelection {
  if (!value.trim()) return { district: "", city: "" };

  const canonical = resolveLocationSearchScope(value);
  if (canonical?.kind === "district") {
    const district = findDistrict(provinces, canonical.district.slug);
    return { district: district?.name || canonical.district.name, city: "" };
  }
  if (canonical?.kind === "city") {
    const district = findDistrict(provinces, canonical.district.slug);
    const city = district?.cities.find(
      (entry) => slugifyLocation(entry) === slugifyLocation(canonical.city)
    );
    return {
      district: district?.name || canonical.district.name,
      city: city || canonical.city,
    };
  }

  const normalized = normalizePlaceName(value);
  for (const province of provinces) {
    for (const district of province.districts) {
      if (normalizePlaceName(district.name) === normalized) {
        return { district: district.name, city: "" };
      }
      const city = district.cities.find(
        (entry) => normalizePlaceName(entry) === normalized
      );
      if (city) return { district: district.name, city };
    }
  }

  return { district: "", city: "" };
}

const fieldClassName =
  "flex min-w-0 items-center rounded-xl bg-zinc-50 px-4";
const selectClassName =
  "h-12 w-full min-w-0 cursor-pointer appearance-none bg-transparent text-sm font-bold text-zinc-900 outline-none disabled:cursor-not-allowed disabled:text-zinc-400";

export function DistrictCitySearchSelect({ value, onChange }: Props) {
  const provinces = useGeographyCatalog();
  const selection = useMemo(
    () => resolveSelection(provinces, value),
    [provinces, value]
  );
  const selectedDistrict = useMemo(
    () => findDistrict(provinces, selection.district),
    [provinces, selection.district]
  );
  const cities = selectedDistrict?.cities || [];

  return (
    <>
      <div className={fieldClassName}>
        <MapPin className="mr-3 h-5 w-5 shrink-0 text-brand-pink" />
        <select
          aria-label="District"
          value={selection.district}
          onChange={(event) => onChange(event.target.value)}
          className={selectClassName}
        >
          <option value="">Any district</option>
          {provinces.map((province) => (
            <optgroup key={province.slug} label={province.name}>
              {province.districts.map((district) => (
                <option key={district.slug} value={district.name}>
                  {district.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      <div className={fieldClassName}>
        <Building2 className="mr-3 h-5 w-5 shrink-0 text-brand-pink" />
        <select
          aria-label="City (optional)"
          value={selection.city}
          disabled={!selection.district}
          onChange={(event) =>
            onChange(event.target.value || selection.district)
          }
          className={selectClassName}
        >
          <option value="">
            {selection.district ? "Any city" : "Select district first"}
          </option>
          {cities.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>
      </div>
    </>
  );
}
