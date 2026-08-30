"use client";

import { useGeographyCatalog } from "@/lib/use-geography-catalog";
import { buildScopedCitySearchValue } from "@/lib/sri-lanka-locations";

type SriLankaLocationSelectProps = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  anyLabel?: string;
  optionClassName?: string;
};

export function SriLankaLocationSelect({
  value,
  onChange,
  className,
  anyLabel = "Any location",
  optionClassName,
}: SriLankaLocationSelectProps) {
  const provinces = useGeographyCatalog();
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={className}>
      <option value="" className={optionClassName}>
        {anyLabel}
      </option>
      <optgroup label="Provinces">
        {provinces.map((province) => (
          <option key={`province-${province.slug}`} value={province.name} className={optionClassName}>
            {province.name}
          </option>
        ))}
      </optgroup>
      {provinces.map((province) => (
        <optgroup key={`districts-${province.slug}`} label={`${province.shortName} — Districts`}>
          {province.districts.map((district) => (
            <option
              key={`district-${province.slug}-${district.slug}`}
              value={district.name}
              className={optionClassName}
            >
              {district.name}
            </option>
          ))}
        </optgroup>
      ))}
      {provinces.map((province) => (
        <optgroup key={`cities-${province.slug}`} label={`${province.shortName} — Cities`}>
          {province.districts.flatMap((district) =>
            district.cities.map((city) => (
              <option
                key={`city-${province.slug}-${district.slug}-${city}`}
                value={buildScopedCitySearchValue(city, district.name)}
                className={optionClassName}
              >
                {city} ({district.name})
              </option>
            ))
          )}
        </optgroup>
      ))}
    </select>
  );
}
