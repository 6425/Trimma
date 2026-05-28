const SEED_DUMMY_SALON_IDS = new Set([
  "10000000-0000-0000-0000-000000000001",
  "10000000-0000-0000-0000-000000000002",
  "10000000-0000-0000-0000-000000000003",
]);

const SEED_DUMMY_SLUGS = new Set(["the-crown", "sutra-wellness", "vogue-salon"]);

const SEED_DUMMY_NAMES = new Set([
  "The Crown Hair & Beauty",
  "Sutra Wellness Spa & Salon",
  "Vogue Salon & Academy",
]);

export function isSampathBarberSalon(salon: { name?: string | null }): boolean {
  return /sampath barber saloon/i.test((salon.name || "").trim());
}

export function isDummySalonRecord(salon: {
  id?: string | null;
  name?: string | null;
  slug?: string | null;
}): boolean {
  if (isSampathBarberSalon(salon)) return false;

  const name = (salon.name || "").trim();
  const slug = (salon.slug || "").trim().toLowerCase();
  const id = (salon.id || "").trim();

  if (!name) return true;
  if (name.startsWith("Trimma Test Salon")) return true;
  if (name.startsWith("Test Salon")) return true;
  if (/^unnamed salon$/i.test(name)) return true;
  if (SEED_DUMMY_NAMES.has(name)) return true;
  if (slug && SEED_DUMMY_SLUGS.has(slug)) return true;
  if (id && SEED_DUMMY_SALON_IDS.has(id)) return true;

  return false;
}

export function filterPublicSalons<T extends { id?: string | null; name?: string | null; slug?: string | null }>(
  rows: T[]
): T[] {
  return rows.filter((row) => !isDummySalonRecord(row));
}
