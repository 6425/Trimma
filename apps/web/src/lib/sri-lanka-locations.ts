export type SriLankaDistrict = {
  id?: string;
  slug: string;
  name: string;
  cities: string[];
};

export type SriLankaProvince = {
  id?: string;
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
      {
        slug: "colombo",
        name: "Colombo",
        cities: [
          "Colombo",
          "Athurugiriya",
          "Battaramulla",
          "Boralesgamuwa",
          "Dehiwala",
          "Homagama",
          "Kaduwela",
          "Kesbewa",
          "Kolonnawa",
          "Kotte",
          "Maharagama",
          "Malabe",
          "Moratuwa",
          "Mount Lavinia",
          "Nugegoda",
          "Pannipitiya",
          "Piliyandala",
          "Rajagiriya",
          "Ratmalana",
          "Sri Jayawardenepura Kotte",
        ],
      },
      {
        slug: "gampaha",
        name: "Gampaha",
        cities: [
          "Gampaha",
          "Divulapitiya",
          "Ja-Ela",
          "Kadawatha",
          "Kandana",
          "Katunayake",
          "Kelaniya",
          "Kiribathgoda",
          "Minuwangoda",
          "Mirigama",
          "Negombo",
          "Nittambuwa",
          "Ragama",
          "Seeduwa",
          "Wattala",
          "Yakkala",
        ],
      },
      {
        slug: "kalutara",
        name: "Kalutara",
        cities: [
          "Kalutara",
          "Aluthgama",
          "Bandaragama",
          "Beruwala",
          "Horana",
          "Ingiriya",
          "Matugama",
          "Panadura",
          "Payagala",
          "Wadduwa",
        ],
      },
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
      {
        slug: "kandy",
        name: "Kandy",
        cities: [
          "Kandy",
          "Akurana",
          "Ampitiya",
          "Digana",
          "Gampola",
          "Kadugannawa",
          "Katugastota",
          "Kundasale",
          "Nawalapitiya",
          "Peradeniya",
          "Pilimathalawa",
          "Wattegama",
        ],
      },
      {
        slug: "matale",
        name: "Matale",
        cities: ["Matale", "Dambulla", "Galewela", "Palapathwela", "Rattota", "Sigiriya", "Ukuwela"],
      },
      {
        slug: "nuwara-eliya",
        name: "Nuwara Eliya",
        cities: [
          "Nuwara Eliya",
          "Ginigathena",
          "Hatton",
          "Kotagala",
          "Maskeliya",
          "Nanu Oya",
          "Ragala",
          "Talawakele",
          "Walapane",
        ],
      },
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
      {
        slug: "galle",
        name: "Galle",
        cities: [
          "Galle",
          "Ahangama",
          "Ambalangoda",
          "Baddegama",
          "Balapitiya",
          "Elpitiya",
          "Hikkaduwa",
          "Karapitiya",
          "Unawatuna",
        ],
      },
      {
        slug: "matara",
        name: "Matara",
        cities: ["Matara", "Akuressa", "Deniyaya", "Dickwella", "Hakmana", "Kamburupitiya", "Mirissa", "Weligama"],
      },
      {
        slug: "hambantota",
        name: "Hambantota",
        cities: ["Hambantota", "Ambalantota", "Beliatta", "Sooriyawewa", "Tangalle", "Tissamaharama", "Weeraketiya"],
      },
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
      {
        slug: "jaffna",
        name: "Jaffna",
        cities: ["Jaffna", "Chankanai", "Chavakachcheri", "Karainagar", "Kayts", "Kopay", "Nallur", "Point Pedro", "Velanai"],
      },
      {
        slug: "kilinochchi",
        name: "Kilinochchi",
        cities: ["Kilinochchi", "Pallai", "Paranthan", "Poonakary"],
      },
      {
        slug: "mannar",
        name: "Mannar",
        cities: ["Mannar", "Nanattan", "Pesalai", "Talaimannar"],
      },
      {
        slug: "vavuniya",
        name: "Vavuniya",
        cities: ["Vavuniya", "Cheddikulam", "Nedunkeni", "Omanthai"],
      },
      {
        slug: "mullaitivu",
        name: "Mullaitivu",
        cities: ["Mullaitivu", "Oddusuddan", "Puthukkudiyiruppu", "Welioya"],
      },
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
      {
        slug: "trincomalee",
        name: "Trincomalee",
        cities: ["Trincomalee", "Kantale", "Kinniya", "Mutur", "Nilaveli"],
      },
      {
        slug: "batticaloa",
        name: "Batticaloa",
        cities: ["Batticaloa", "Chenkalady", "Eravur", "Kaluwanchikudy", "Kattankudy", "Valaichchenai"],
      },
      {
        slug: "ampara",
        name: "Ampara",
        cities: ["Ampara", "Akkaraipattu", "Kalmunai", "Pottuvil", "Sainthamaruthu", "Sammanthurai", "Uhana"],
      },
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
      {
        slug: "kurunegala",
        name: "Kurunegala",
        cities: [
          "Kurunegala",
          "Alawwa",
          "Hettipola",
          "Ibbagamuwa",
          "Kuliyapitiya",
          "Mawathagama",
          "Narammala",
          "Pannala",
          "Polgahawela",
          "Wariyapola",
        ],
      },
      {
        slug: "puttalam",
        name: "Puttalam",
        cities: ["Puttalam", "Anamaduwa", "Chilaw", "Dankotuwa", "Kalpitiya", "Marawila", "Nattandiya", "Wennappuwa"],
      },
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
      {
        slug: "anuradhapura",
        name: "Anuradhapura",
        cities: [
          "Anuradhapura",
          "Eppawala",
          "Galenbindunuwewa",
          "Kekirawa",
          "Medawachchiya",
          "Mihintale",
          "Nochchiyagama",
          "Thambuttegama",
        ],
      },
      {
        slug: "polonnaruwa",
        name: "Polonnaruwa",
        cities: ["Polonnaruwa", "Bakamuna", "Dimbulagala", "Hingurakgoda", "Kaduruwela", "Medirigiriya"],
      },
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
      {
        slug: "badulla",
        name: "Badulla",
        cities: ["Badulla", "Bandarawela", "Diyatalawa", "Ella", "Hali-Ela", "Haputale", "Mahiyanganaya", "Passara", "Welimada"],
      },
      {
        slug: "monaragala",
        name: "Monaragala",
        cities: ["Monaragala", "Bibile", "Buttala", "Kataragama", "Siyambalanduwa", "Wellawaya"],
      },
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
      {
        slug: "ratnapura",
        name: "Ratnapura",
        cities: [
          "Ratnapura",
          "Balangoda",
          "Eheliyagoda",
          "Embilipitiya",
          "Godakawela",
          "Kuruwita",
          "Pelmadulla",
          "Rakwana",
        ],
      },
      {
        slug: "kegalle",
        name: "Kegalle",
        cities: ["Kegalle", "Dehiowita", "Deraniyagala", "Mawanella", "Rambukkana", "Ruwanwella", "Warakapola", "Yatiyantota"],
      },
    ],
  },
];

/** Province → district → cities map for admin discovery dropdowns. */
export function buildSriLankaGeographyRecord(
  provinces: SriLankaProvince[] = SRI_LANKA_PROVINCES
): Record<string, Record<string, string[]>> {
  const record: Record<string, Record<string, string[]>> = {};
  for (const province of provinces) {
    record[province.name] = {};
    for (const district of province.districts) {
      record[province.name][district.name] = [...district.cities];
    }
  }
  return record;
}

export function getAllDistrictNamesFlat(): string[] {
  return SRI_LANKA_PROVINCES.flatMap((province) => province.districts.map((district) => district.name));
}

export function getDistrictFilterOptions(): Array<{
  value: string;
  label: string;
  provinceName: string;
}> {
  return SRI_LANKA_PROVINCES.flatMap((province) =>
    province.districts.map((district) => ({
      value: district.slug,
      label: district.name,
      provinceName: province.name,
    }))
  );
}

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

/** Home directory search URL — same pattern districts use in the nav (`/?l=Colombo`). */
export function buildLocationSearchHref(location: string): string {
  return `/?l=${encodeURIComponent(location)}`;
}

export function resolveLocationDisplayLabel(location: string): string {
  const trimmed = location.trim();
  if (!trimmed) return "Sri Lanka";

  const scope = resolveLocationSearchScope(trimmed);
  if (scope?.kind === "province") return scope.province.name;
  if (scope?.kind === "district") return scope.district.name;
  if (scope?.kind === "city") return `${scope.city}, ${scope.district.name}`;

  const province = resolveProvinceForLocationQuery(trimmed);
  if (province) return province.name;

  const lower = trimmed.toLowerCase();
  for (const entry of SRI_LANKA_PROVINCES) {
    for (const district of entry.districts) {
      if (district.slug === slugifyLocation(trimmed) || district.name.toLowerCase() === lower) {
        return district.name;
      }
      for (const city of district.cities) {
        if (slugifyLocation(city) === slugifyLocation(trimmed) || city.toLowerCase() === lower) {
          return city;
        }
      }
    }
  }

  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

/** Canonical province / district / city name for search params and selects. */
export function resolveLocationSearchValue(location: string): string {
  const trimmed = location.trim();
  if (!trimmed) return "";
  return resolveLocationDisplayLabel(trimmed);
}

/** Strip province/district suffixes so "Central" never equals "North Central". */
export function normalizePlaceName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/\bsri lanka\b/g, " ")
    .replace(/\bdistrict\b/g, " ")
    .replace(/\bprovince\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function placeNamesMatch(a: string, b: string): boolean {
  const left = normalizePlaceName(a);
  const right = normalizePlaceName(b);
  return Boolean(left) && left === right;
}

export type LocationSearchScope =
  | { kind: "province"; province: SriLankaProvince }
  | { kind: "district"; province: SriLankaProvince; district: SriLankaDistrict }
  | { kind: "city"; province: SriLankaProvince; district: SriLankaDistrict; city: string };

function matchProvinceName(value: string): SriLankaProvince | undefined {
  const needle = normalizePlaceName(value);
  if (!needle) return undefined;
  return SRI_LANKA_PROVINCES.find((province) =>
    [province.name, province.shortName, province.slug.replace(/-/g, " "), province.dbSlug.replace(/-/g, " ")].some(
      (name) => normalizePlaceName(name) === needle
    )
  );
}

function matchDistrictInProvince(
  province: SriLankaProvince,
  value: string
): SriLankaDistrict | undefined {
  const needle = normalizePlaceName(value);
  const slug = slugifyLocation(value);
  if (!needle && !slug) return undefined;
  return province.districts.find(
    (district) => placeNamesMatch(district.name, value) || district.slug === slug
  );
}

function matchCityInDistrict(district: SriLankaDistrict, value: string): string | undefined {
  const slug = slugifyLocation(value);
  return district.cities.find(
    (city) => placeNamesMatch(city, value) || slugifyLocation(city) === slug
  );
}

function resolveDistrictScope(value: string): Extract<LocationSearchScope, { kind: "district" }> | undefined {
  for (const province of SRI_LANKA_PROVINCES) {
    const district = matchDistrictInProvince(province, value);
    if (district) return { kind: "district", province, district };
  }
  return undefined;
}

function resolveCityScope(value: string): Extract<LocationSearchScope, { kind: "city" }> | undefined {
  const scopedParts = value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  if (scopedParts.length >= 2) {
    const cityValue = scopedParts[0];
    const districtValue = scopedParts[scopedParts.length - 1];
    const districtScope = resolveDistrictScope(districtValue);
    if (districtScope && cityValue) {
      return {
        kind: "city",
        province: districtScope.province,
        district: districtScope.district,
        city: matchCityInDistrict(districtScope.district, cityValue) || cityValue,
      };
    }
  }

  for (const province of SRI_LANKA_PROVINCES) {
    for (const district of province.districts) {
      const city = matchCityInDistrict(district, value);
      if (city) return { kind: "city", province, district, city };
      if (placeNamesMatch(district.name, value)) {
        return { kind: "city", province, district, city: district.name };
      }
    }
  }
  return undefined;
}

/** Resolve a free-text location query to a known province (name, short name, or slug). */
export function resolveProvinceForLocationQuery(location: string): SriLankaProvince | undefined {
  return matchProvinceName(location);
}

/** Province first, then district, then city — exact names only, never substring. */
export function resolveLocationSearchScope(location: string): LocationSearchScope | null {
  const trimmed = location.trim();
  if (!trimmed) return null;

  const province = matchProvinceName(trimmed);
  if (province) return { kind: "province", province };

  const district = resolveDistrictScope(trimmed);
  if (district) return district;

  const city = resolveCityScope(trimmed);
  if (city) return city;

  return null;
}

function postgrestExactIlike(column: string, value: string): string | null {
  const safe = value.replace(/[%_,"()\\]/g, "").trim();
  if (!safe) return null;
  return `${column}.ilike."${safe}"`;
}

function exactFieldClauses(column: string, values: string[]): string[] {
  const seen = new Set<string>();
  const clauses: string[] = [];
  for (const value of values) {
    const clause = postgrestExactIlike(column, value);
    if (!clause) continue;
    const key = clause.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    clauses.push(clause);
  }
  return clauses;
}

/**
 * PostgREST `.or(...)` filter for salon location search.
 * Uses exact province/district/city names so Central does not match North Central
 * (Polonnaruwa) and Western does not match North Western.
 * Provinces still expand to their districts and cities when `salons.province` is empty.
 */
export function buildSalonLocationOrFilter(location: string): string {
  const trimmed = location.trim();
  if (!trimmed) return "";

  const scope = resolveLocationSearchScope(trimmed);
  if (scope?.kind === "province") {
    const { province } = scope;
    return [
      ...exactFieldClauses("province", [province.name, province.shortName, province.dbSlug, province.slug]),
      ...exactFieldClauses(
        "district",
        province.districts.map((district) => district.name)
      ),
      ...exactFieldClauses(
        "city",
        province.districts.flatMap((district) => [district.name, ...district.cities])
      ),
    ].join(",");
  }

  if (scope?.kind === "district") {
    const { district } = scope;
    return [
      ...exactFieldClauses("district", [district.name, district.slug]),
      ...exactFieldClauses("city", [district.name, ...district.cities]),
    ].join(",");
  }

  if (scope?.kind === "city") {
    return exactFieldClauses("city", [scope.city]).join(",");
  }

  return [
    ...exactFieldClauses("city", [trimmed]),
    ...exactFieldClauses("district", [trimmed]),
    ...exactFieldClauses("province", [trimmed]),
  ].join(",");
}

type SalonLocationFields = {
  province?: string | null;
  district?: string | null;
  city?: string | null;
  location?: string | null;
};

function identifySalonGeography(
  salon: SalonLocationFields
): { province: SriLankaProvince; district?: SriLankaDistrict; city?: string } | null {
  const parts = [salon.city, salon.district, salon.province, salon.location]
    .map((value) => String(value || "").trim())
    .filter(Boolean);

  for (const part of parts) {
    const city = resolveCityScope(part);
    if (city) return { province: city.province, district: city.district, city: city.city };
  }
  for (const part of parts) {
    const district = resolveDistrictScope(part);
    if (district) return { province: district.province, district: district.district };
  }
  for (const part of parts) {
    const province = matchProvinceName(part);
    if (province) return { province };
  }

  const blob = parts.join(", ");
  if (blob) {
    for (const piece of blob.split(/[,/|]/).map((value) => value.trim()).filter(Boolean)) {
      const city = resolveCityScope(piece);
      if (city) return { province: city.province, district: city.district, city: city.city };
      const district = resolveDistrictScope(piece);
      if (district) return { province: district.province, district: district.district };
      const province = matchProvinceName(piece);
      if (province) return { province };
    }
  }

  return null;
}

/** True only when the salon belongs to the selected province, district, or city. */
export function salonBelongsToRequestedLocation(
  salon: SalonLocationFields,
  location: string
): boolean {
  const trimmed = location.trim();
  if (!trimmed) return true;

  const scope = resolveLocationSearchScope(trimmed);
  const geo = identifySalonGeography(salon);

  if (!scope) {
    const needle = normalizePlaceName(trimmed);
    if (!needle) return true;
    return [salon.city, salon.district, salon.province, salon.location].some(
      (value) => value && normalizePlaceName(String(value)) === needle
    );
  }

  if (!geo) return false;

  if (scope.kind === "province") {
    return geo.province.slug === scope.province.slug;
  }
  if (scope.kind === "district") {
    return geo.district?.slug === scope.district.slug;
  }
  return Boolean(
    geo.district?.slug === scope.district.slug &&
      geo.city &&
      placeNamesMatch(geo.city, scope.city)
  );
}

/** Canonical city search value that preserves its district for strict filtering. */
export function buildScopedCitySearchValue(city: string, district: string): string {
  const cityName = city.trim();
  const districtName = district.trim();
  if (!cityName) return districtName;
  if (!districtName) return cityName;
  return `${cityName}, ${districtName}`;
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
  salon: {
    province?: string | null;
    district?: string | null;
    city?: string | null;
    location?: string | null;
  },
  provinceSlug: string
): boolean {
  const province = getProvinceByRouteSlug(provinceSlug);
  if (!province) return true;
  return salonBelongsToRequestedLocation(salon, province.name);
}

export function salonMatchesDistrict(
  salon: {
    province?: string | null;
    district?: string | null;
    city?: string | null;
    location?: string | null;
  },
  districtSlug: string
): boolean {
  const district = SRI_LANKA_PROVINCES.flatMap((province) => province.districts).find(
    (entry) => entry.slug === slugifyLocation(districtSlug)
  );
  if (!district) return false;
  return salonBelongsToRequestedLocation(salon, district.name);
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
