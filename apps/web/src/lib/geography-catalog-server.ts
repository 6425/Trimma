import type { SupabaseClient } from "@supabase/supabase-js";
import {
  SRI_LANKA_PROVINCES,
  slugifyLocation,
  type SriLankaDistrict,
  type SriLankaProvince,
} from "@/lib/sri-lanka-locations";

type ProvinceRow = { id: string; name: string; slug: string; image_url?: string | null };
type DistrictRow = { id: string; province_id: string; name: string; slug: string };
type CityRow = { id: string; district_id: string; name: string; slug: string };

function mergeCityNames(staticNames: string[], databaseRows: CityRow[]): string[] {
  const databaseBySlug = new Map(databaseRows.map((city) => [city.slug, city.name]));
  const names = staticNames.map((name) => databaseBySlug.get(slugifyLocation(name)) || name);
  const seen = new Set(names.map((name) => name.toLocaleLowerCase()));
  for (const city of databaseRows) {
    const key = city.name.toLocaleLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    names.push(city.name);
  }
  return names.sort((a, b) => a.localeCompare(b));
}

export async function loadGeographyCatalog(supabase: SupabaseClient): Promise<SriLankaProvince[]> {
  const [provinceResult, districtResult, cityResult] = await Promise.all([
    supabase.from("provinces").select("id,name,slug,image_url").order("name"),
    supabase.from("districts").select("id,province_id,name,slug").order("name"),
    supabase.from("cities").select("id,district_id,name,slug").order("name"),
  ]);

  if (provinceResult.error) throw new Error(provinceResult.error.message);
  if (districtResult.error) throw new Error(districtResult.error.message);
  if (cityResult.error) throw new Error(cityResult.error.message);

  const provinceRows = (provinceResult.data || []) as ProvinceRow[];
  const districtRows = (districtResult.data || []) as DistrictRow[];
  const cityRows = (cityResult.data || []) as CityRow[];
  if (!provinceRows.length || !districtRows.length) return SRI_LANKA_PROVINCES;

  return provinceRows.map((provinceRow) => {
    const staticProvince = SRI_LANKA_PROVINCES.find(
      (province) =>
        province.dbSlug === provinceRow.slug ||
        province.slug === provinceRow.slug ||
        province.name.toLocaleLowerCase() === provinceRow.name.toLocaleLowerCase()
    );
    const provinceDistricts = districtRows.filter(
      (district) => district.province_id === provinceRow.id
    );
    const districts: SriLankaDistrict[] = provinceDistricts.map((districtRow) => {
      const staticDistrict = staticProvince?.districts.find(
        (district) =>
          district.slug === districtRow.slug ||
          district.name.toLocaleLowerCase() === districtRow.name.toLocaleLowerCase()
      );
      return {
        id: districtRow.id,
        slug: districtRow.slug,
        name: districtRow.name,
        cities: mergeCityNames(
          staticDistrict?.cities || [],
          cityRows.filter((city) => city.district_id === districtRow.id)
        ),
      };
    });

    return {
      id: provinceRow.id,
      slug: staticProvince?.slug || provinceRow.slug.replace(/-province$/, ""),
      dbSlug: provinceRow.slug,
      name: provinceRow.name,
      shortName: staticProvince?.shortName || provinceRow.name.replace(/\s+Province$/, ""),
      description: staticProvince?.description || `Discover beauty businesses across ${provinceRow.name}.`,
      image: provinceRow.image_url || staticProvince?.image || SRI_LANKA_PROVINCES[0].image,
      districts,
    };
  });
}
