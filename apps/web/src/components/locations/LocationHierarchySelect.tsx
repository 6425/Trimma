"use client";

import { useEffect, useMemo } from "react";
import {
  getCitiesForDistrict,
  SRI_LANKA_PROVINCES,
} from "@/lib/sri-lanka-locations";

type LocationHierarchySelectProps = {
  province: string;
  district: string;
  city?: string;
  onProvinceChange: (value: string) => void;
  onDistrictChange: (value: string) => void;
  onCityChange?: (value: string) => void;
  showCity?: boolean;
  availableDistricts?: string[]; // e.g. ["colombo", "gampaha", "kandy", "anuradhapura"]
  provinceClassName?: string;
  districtClassName?: string;
  cityClassName?: string;
  provinceLabel?: string;
  districtLabel?: string;
  cityLabel?: string;
};

export function LocationHierarchySelect({
  province,
  district,
  city = "",
  onProvinceChange,
  onDistrictChange,
  onCityChange,
  showCity = false,
  availableDistricts,
  provinceClassName = "flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 font-medium",
  districtClassName = "flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 font-medium",
  cityClassName = "flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 font-medium",
  provinceLabel = "Province",
  districtLabel = "District",
  cityLabel = "City",
}: LocationHierarchySelectProps) {
  
  const allProvinces = useMemo(() => {
    if (!availableDistricts || availableDistricts.length === 0) {
      return SRI_LANKA_PROVINCES;
    }
    return SRI_LANKA_PROVINCES.filter(p => 
      p.districts.some(d => availableDistricts.includes(d.slug))
    );
  }, [availableDistricts]);

  const allProvinceNames = useMemo(() => allProvinces.map(p => p.name), [allProvinces]);

  const districts = useMemo(() => {
    const p = allProvinces.find(p => p.name === province) || SRI_LANKA_PROVINCES.find(p => p.name === province);
    let dists = p?.districts || [];
    if (availableDistricts && availableDistricts.length > 0) {
      dists = dists.filter(d => availableDistricts.includes(d.slug));
    }
    return dists;
  }, [province, availableDistricts, allProvinces]);

  const cities = useMemo(() => getCitiesForDistrict(province, district), [province, district]);

  useEffect(() => {
    if (allProvinceNames.length > 0 && !allProvinceNames.includes(province)) {
      onProvinceChange(allProvinceNames[0]);
    }
  }, [allProvinceNames, province, onProvinceChange]);

  useEffect(() => {
    void Promise.resolve().then(() => {
      if (!province) return;
      if (districts.length > 0 && !districts.some((d) => d.name === district)) {
        onDistrictChange(districts[0].name);
      }
    });
  }, [province, district, onDistrictChange, districts]);

  useEffect(() => {
    void Promise.resolve().then(() => {
      if (!showCity || !onCityChange || !province || !district) return;
      if (cities.length > 0 && !cities.includes(city)) {
        onCityChange(cities[0]);
      }
    });
  }, [province, district, city, showCity, onCityChange, cities]);

  return (
    <>
      <div className="space-y-2">
        <label className="font-bold text-xs text-zinc-500">{provinceLabel}</label>
        <select
          value={province}
          onChange={(e) => onProvinceChange(e.target.value)}
          className={provinceClassName}
        >
          {allProvinceNames.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className="font-bold text-xs text-zinc-500">{districtLabel}</label>
        <select
          value={district}
          onChange={(e) => onDistrictChange(e.target.value)}
          className={districtClassName}
          disabled={districts.length === 0}
        >
          {districts.map((entry) => (
            <option key={entry.slug} value={entry.name}>
              {entry.name}
            </option>
          ))}
        </select>
      </div>

      {showCity && onCityChange && (
        <div className="space-y-2">
          <label className="font-bold text-xs text-zinc-500">{cityLabel}</label>
          <select
            value={city}
            onChange={(e) => onCityChange(e.target.value)}
            className={cityClassName}
            disabled={cities.length === 0}
          >
            {cities.map((entry) => (
              <option key={entry} value={entry}>
                {entry}
              </option>
            ))}
          </select>
        </div>
      )}
    </>
  );
}

export function getDefaultProvinceSelection() {
  const province = SRI_LANKA_PROVINCES[0];
  return {
    province: province.name,
    district: province.districts[0]?.name || "",
    city: province.districts[0]?.cities[0] || "",
  };
}
