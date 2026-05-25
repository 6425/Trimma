"use client";

import { useEffect, useMemo } from "react";
import {
  getAllProvinceNames,
  getCitiesForDistrict,
  getDistrictsForProvinceName,
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
  provinceClassName = "flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 font-medium",
  districtClassName = "flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 font-medium",
  cityClassName = "flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 font-medium",
  provinceLabel = "Province",
  districtLabel = "District",
  cityLabel = "City",
}: LocationHierarchySelectProps) {
  const districts = useMemo(() => getDistrictsForProvinceName(province), [province]);
  const cities = useMemo(() => getCitiesForDistrict(province, district), [province, district]);

  useEffect(() => {
    void Promise.resolve().then(() => {
      if (!province) return;
      const validDistricts = getDistrictsForProvinceName(province);
      if (validDistricts.length > 0 && !validDistricts.some((d) => d.name === district)) {
      onDistrictChange(validDistricts[0].name);
      }
    });
  }, [province, district, onDistrictChange]);

  useEffect(() => {
    void Promise.resolve().then(() => {
      if (!showCity || !onCityChange || !province || !district) return;
      const validCities = getCitiesForDistrict(province, district);
      if (validCities.length > 0 && !validCities.includes(city)) {
      onCityChange(validCities[0]);
      }
    });
  }, [province, district, city, showCity, onCityChange]);

  return (
    <>
      <div className="space-y-2">
        <label className="font-bold text-xs text-zinc-500">{provinceLabel}</label>
        <select
          value={province}
          onChange={(e) => onProvinceChange(e.target.value)}
          className={provinceClassName}
        >
          {getAllProvinceNames().map((name) => (
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
