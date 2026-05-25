export type SriLankaDistrict = {
  slug: string;
  name: string;
  cities: string[];
};

export type SriLankaProvince = {
  slug: string;
  dbSlug: string;
  name: string;
  shortName: string;
  description: string;
  image: string;
  districts: SriLankaDistrict[];
};

const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1574227492706-f65b24c3688a?q=80&w=2940&auto=format&fit=crop";

/** Canonical Province → District → City hierarchy for Sri Lanka. */
export const SRI_LANKA_PROVINCES: SriLankaProvince[] = [
  {
    slug: "western",
    dbSlug: "western-province",
    name: "Western Province",
    shortName: "Western",
    description:
      "Discover salons, spas, and barber shops across Colombo, Gampaha, and Kalutara — the beauty capital of Sri Lanka.",
    image: DEFAULT_IMAGE,
    districts: [
      { slug: "colombo", name: "Colombo", cities: ["Colombo", "Mount Lavinia", "Dehiwala", "Moratuwa", "Kotte", "Battaramulla", "Nugegoda", "Kolonnawa"] },
      { slug: "gampaha", name: "Gampaha", cities: ["Gampaha", "Negombo", "Kelaniya", "Wattala", "Kiribathgoda", "Ja-Ela", "Kadawatha"] },
      { slug: "kalutara", name: "Kalutara", cities: ["Kalutara", "Panadura", "Horana", "Beruwala", "Aluthgama"] },
    ],
  },
  {
    slug: "central",
    dbSlug: "central-province",
    name: "Central Province",
    shortName: "Central",
    description:
      "Explore premium grooming and wellness in the hill country — Kandy, Matale, and Nuwara Eliya.",
    image: "https://images.unsplash.com/photo-1546708973-b339540b5162?q=80&w=2836&auto=format&fit=crop",
    districts: [
      { slug: "kandy", name: "Kandy", cities: ["Kandy", "Peradeniya", "Gampola", "Katugastota"] },
      { slug: "matale", name: "Matale", cities: ["Matale", "Dambulla", "Sigiriya"] },
      { slug: "nuwara-eliya", name: "Nuwara Eliya", cities: ["Nuwara Eliya", "Hatton", "Talawakele"] },
    ],
  },
  {
    slug: "southern",
    dbSlug: "southern-province",
    name: "Southern Province",
    shortName: "Southern",
    description:
      "Coastal salons and wellness retreats across Galle, Matara, and Hambantota.",
    image: "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?q=80&w=2836&auto=format&fit=crop",
    districts: [
      { slug: "galle", name: "Galle", cities: ["Galle", "Hikkaduwa", "Ambalangoda", "Unawatuna"] },
      { slug: "matara", name: "Matara", cities: ["Matara", "Weligama", "Mirissa"] },
      { slug: "hambantota", name: "Hambantota", cities: ["Hambantota", "Tangalle", "Beliatta"] },
    ],
  },
  {
    slug: "northern",
    dbSlug: "northern-province",
    name: "Northern Province",
    shortName: "Northern",
    description: "Find trusted salons and grooming studios across Jaffna, Kilinochchi, Mannar, Vavuniya, and Mullaitivu.",
    image: DEFAULT_IMAGE,
    districts: [
      { slug: "jaffna", name: "Jaffna", cities: ["Jaffna", "Chavakachcheri"] },
      { slug: "kilinochchi", name: "Kilinochchi", cities: ["Kilinochchi"] },
      { slug: "mannar", name: "Mannar", cities: ["Mannar"] },
      { slug: "vavuniya", name: "Vavuniya", cities: ["Vavuniya"] },
      { slug: "mullaitivu", name: "Mullaitivu", cities: ["Mullaitivu"] },
    ],
  },
  {
    slug: "eastern",
    dbSlug: "eastern-province",
    name: "Eastern Province",
    shortName: "Eastern",
    description: "Beauty and grooming services across Trincomalee, Batticaloa, and Ampara.",
    image: DEFAULT_IMAGE,
    districts: [
      { slug: "trincomalee", name: "Trincomalee", cities: ["Trincomalee"] },
      { slug: "batticaloa", name: "Batticaloa", cities: ["Batticaloa"] },
      { slug: "ampara", name: "Ampara", cities: ["Ampara"] },
    ],
  },
  {
    slug: "north-western",
    dbSlug: "north-western-province",
    name: "North Western Province",
    shortName: "North Western",
    description: "Salons and spas in Kurunegala and Puttalam districts.",
    image: DEFAULT_IMAGE,
    districts: [
      { slug: "kurunegala", name: "Kurunegala", cities: ["Kurunegala", "Kuliyapitiya"] },
      { slug: "puttalam", name: "Puttalam", cities: ["Puttalam", "Chilaw", "Marawila"] },
    ],
  },
  {
    slug: "north-central",
    dbSlug: "north-central-province",
    name: "North Central Province",
    shortName: "North Central",
    description: "Discover grooming and wellness in Anuradhapura and Polonnaruwa.",
    image: DEFAULT_IMAGE,
    districts: [
      { slug: "anuradhapura", name: "Anuradhapura", cities: ["Anuradhapura"] },
      { slug: "polonnaruwa", name: "Polonnaruwa", cities: ["Polonnaruwa"] },
    ],
  },
  {
    slug: "uva",
    dbSlug: "uva-province",
    name: "Uva Province",
    shortName: "Uva",
    description: "Salons and wellness across Badulla and Monaragala.",
    image: DEFAULT_IMAGE,
    districts: [
      { slug: "badulla", name: "Badulla", cities: ["Badulla", "Bandarawela", "Ella"] },
      { slug: "monaragala", name: "Monaragala", cities: ["Monaragala"] },
    ],
  },
  {
    slug: "sabaragamuwa",
    dbSlug: "sabaragamuwa-province",
    name: "Sabaragamuwa Province",
    shortName: "Sabaragamuwa",
    description: "Beauty services in Ratnapura and Kegalle districts.",
    image: DEFAULT_IMAGE,
    districts: [
      { slug: "ratnapura", name: "Ratnapura", cities: ["Ratnapura", "Balangoda"] },
      { slug: "kegalle", name: "Kegalle", cities: ["Kegalle", "Mawanella"] },
    ],
  },
];

export function slugifyLocation(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function normalizeProvinceSlug(slug: string | null | undefined): string {
  if (!slug) return "western";
  const value = slug.toLowerCase().trim();
  if (value.endsWith("-province")) {
    return value.replace(/-province$/, "");
  }
  return value;
}

export function toDbProvinceSlug(routeSlug: string): string {
  const normalized = normalizeProvinceSlug(routeSlug);
  const province = SRI_LANKA_PROVINCES.find((p) => p.slug === normalized);
  return province?.dbSlug || `${normalized}-province`;
}

export function getProvinceByRouteSlug(slug: string | null | undefined): SriLankaProvince | undefined {
  const normalized = normalizeProvinceSlug(slug);
  return SRI_LANKA_PROVINCES.find((p) => p.slug === normalized);
}

export function getDistrictBySlugs(
  provinceSlug: string | null | undefined,
  districtSlug: string | null | undefined
): { province: SriLankaProvince; district: SriLankaDistrict } | undefined {
  const province = getProvinceByRouteSlug(provinceSlug);
  if (!province || !districtSlug) return undefined;
  const normalizedDistrict = slugifyLocation(districtSlug);
  const district = province.districts.find(
    (d) => d.slug === normalizedDistrict || slugifyLocation(d.name) === normalizedDistrict
  );
  if (!district) return undefined;
  return { province, district };
}

export function findProvinceSlugForDistrict(districtSlug: string): string | undefined {
  const normalized = slugifyLocation(districtSlug);
  return SRI_LANKA_PROVINCES.find((province) =>
    province.districts.some((district) => district.slug === normalized)
  )?.slug;
}

export function findDistrictForCity(citySlug: string): { provinceSlug: string; districtSlug: string } | undefined {
  const normalizedCity = slugifyLocation(citySlug);
  for (const province of SRI_LANKA_PROVINCES) {
    for (const district of province.districts) {
      const match = district.cities.some(
        (city) => slugifyLocation(city) === normalizedCity || city.toLowerCase() === citySlug.toLowerCase()
      );
      if (match) {
        return { provinceSlug: province.slug, districtSlug: district.slug };
      }
    }
  }
  return undefined;
}

export function getDistrictsForProvinceName(provinceName: string): SriLankaDistrict[] {
  const province = SRI_LANKA_PROVINCES.find((p) => p.name === provinceName);
  return province?.districts || [];
}

export function getCitiesForDistrict(provinceName: string, districtName: string): string[] {
  const province = SRI_LANKA_PROVINCES.find((p) => p.name === provinceName);
  const district = province?.districts.find((d) => d.name === districtName);
  return district?.cities || [];
}

export function getAllProvinceNames(): string[] {
  return SRI_LANKA_PROVINCES.map((p) => p.name);
}

export function salonMatchesProvince(
  salon: { district?: string | null; city?: string | null; location?: string | null },
  provinceSlug: string
): boolean {
  const province = getProvinceByRouteSlug(provinceSlug);
  if (!province) return true;

  const haystack = `${salon.district || ""} ${salon.city || ""} ${salon.location || ""}`.toLowerCase();
  const provinceName = province.name.toLowerCase();

  if (haystack.includes(provinceName) || haystack.includes(province.shortName.toLowerCase())) {
    return true;
  }

  return province.districts.some((district) => {
    const districtName = district.name.toLowerCase();
    return haystack.includes(districtName) || haystack.includes(district.slug.replace(/-/g, " "));
  });
}

export function salonMatchesDistrict(
  salon: { district?: string | null; city?: string | null; location?: string | null },
  districtSlug: string
): boolean {
  const normalized = slugifyLocation(districtSlug);
  const haystack = `${salon.district || ""} ${salon.city || ""} ${salon.location || ""}`.toLowerCase();
  return haystack.includes(normalized.replace(/-/g, " "));
}

export type DistrictCard = {
  name: string;
  slug: string;
  count: number;
  top: string;
};

export function buildDistrictCards(province: SriLankaProvince, counts?: Record<string, number>): DistrictCard[] {
  return province.districts.map((district) => ({
    name: district.name,
    slug: district.slug,
    count: counts?.[district.slug] ?? 0,
    top: district.cities.slice(0, 3).join(" • ") || "Salon • Spa",
  }));
}

export function buildCityCards(district: SriLankaDistrict) {
  return district.cities.map((city) => ({
    name: city,
    slug: slugifyLocation(city),
    count: 0,
    top: "Salon • Grooming",
  }));
}
