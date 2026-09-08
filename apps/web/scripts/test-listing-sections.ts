/** Run from the repo root: npx tsx --tsconfig apps/web/tsconfig.json apps/web/scripts/test-listing-sections.ts */
import assert from "node:assert/strict";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { PublicSalonSearchParams } from "../src/lib/public-salon-search";

type Row = Record<string, unknown>;
type Predicate = (row: Row) => boolean;

function splitFilters(value: string): string[] {
  let depth = 0;
  let quoted = false;
  let start = 0;
  const parts: string[] = [];
  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];
    if (char === '"') quoted = !quoted;
    if (quoted) continue;
    if (char === "(") depth += 1;
    if (char === ")") depth -= 1;
    if (char === "," && depth === 0) {
      parts.push(value.slice(start, index));
      start = index + 1;
    }
  }
  parts.push(value.slice(start));
  return parts;
}

function literal(value: string): unknown {
  if (value === "true") return true;
  if (value === "false") return false;
  if (value === "null") return null;
  return value.replace(/^"|"$/g, "");
}

function matches(row: Row, column: string, operator: string, operand: unknown): boolean {
  const actual = row[column];
  switch (operator) {
    case "eq": return actual === operand;
    case "is": return operand === null ? actual == null : actual === operand;
    case "gt": return actual != null && actual > operand;
    case "gte": return actual != null && actual >= operand;
    case "lt": return actual != null && actual < operand;
    case "lte": return actual != null && actual <= operand;
    case "in": return splitFilters(String(operand).replace(/^\(|\)$/g, "")).map(literal).includes(actual);
    case "ilike": {
      const pattern = String(operand).replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/%/g, ".*").replace(/_/g, ".");
      return new RegExp(`^${pattern}$`, "i").test(String(actual ?? ""));
    }
    default: throw new Error(`Unsupported fake database operator: ${operator}`);
  }
}

function filterPredicate(expression: string): Predicate {
  if (expression.startsWith("and(") || expression.startsWith("or(")) {
    const isAnd = expression.startsWith("and(");
    const children = splitFilters(expression.slice(isAnd ? 4 : 3, -1)).map(filterPredicate);
    return (row) => isAnd ? children.every((child) => child(row)) : children.some((child) => child(row));
  }
  const matched = expression.match(/^([^.]+)\.(?:(not)\.)?([^.]+)\.(.*)$/);
  assert.ok(matched, `Unsupported fake database expression: ${expression}`);
  const [, column, negate, operator, value] = matched;
  return (row) => Boolean(negate) !== matches(row, column, operator, literal(value));
}

/** A read-only PostgREST subset. Unsupported operations fail rather than silently passing. */
class FakeQuery {
  private predicates: Predicate[] = [];
  private ordering: Array<{ column: string; ascending: boolean; nullsFirst: boolean }> = [];
  private start = 0;
  private size = Infinity;
  private head = false;

  constructor(private rows: Row[], private maxRows = Infinity) {}

  select(_columns: string, options?: { head?: boolean; count?: string }) { this.head = options?.head === true; return this; }
  eq(column: string, value: unknown) { this.predicates.push((row) => matches(row, column, "eq", value)); return this; }
  is(column: string, value: unknown) { this.predicates.push((row) => matches(row, column, "is", value)); return this; }
  gt(column: string, value: unknown) { this.predicates.push((row) => matches(row, column, "gt", value)); return this; }
  gte(column: string, value: unknown) { this.predicates.push((row) => matches(row, column, "gte", value)); return this; }
  lt(column: string, value: unknown) { this.predicates.push((row) => matches(row, column, "lt", value)); return this; }
  lte(column: string, value: unknown) { this.predicates.push((row) => matches(row, column, "lte", value)); return this; }
  in(column: string, values: unknown[]) { this.predicates.push((row) => values.includes(row[column])); return this; }
  not(column: string, operator: string, value: unknown) { this.predicates.push((row) => !matches(row, column, operator, value)); return this; }
  or(expression: string) { const predicates = splitFilters(expression).map(filterPredicate); this.predicates.push((row) => predicates.some((predicate) => predicate(row))); return this; }
  order(column: string, options?: { ascending?: boolean; nullsFirst?: boolean }) { this.ordering.push({ column, ascending: options?.ascending !== false, nullsFirst: options?.nullsFirst ?? options?.ascending === false }); return this; }
  limit(size: number) { this.size = size; return this; }
  range(start: number, end: number) { this.start = start; this.size = end - start + 1; return this; }

  then(resolve: (result: { data: Row[] | null; count: number; error: null }) => unknown) {
    const rows = this.rows.filter((row) => this.predicates.every((predicate) => predicate(row)));
    rows.sort((a, b) => {
      for (const { column, ascending, nullsFirst } of this.ordering) {
        const left = a[column];
        const right = b[column];
        if (left == null && right == null) continue;
        if (left == null) return nullsFirst ? -1 : 1;
        if (right == null) return nullsFirst ? 1 : -1;
        const delta = left < right ? -1 : left > right ? 1 : 0;
        if (delta) return ascending ? delta : -delta;
      }
      return 0;
    });
    return Promise.resolve({ data: this.head ? null : rows.slice(this.start, this.start + Math.min(this.size, this.maxRows)), count: rows.length, error: null }).then(resolve);
  }
}

function fakeClient(rows: Row[], maxRows = Infinity): SupabaseClient {
  return { from: (table: string) => { assert.equal(table, "salons"); return new FakeQuery(rows, maxRows); } } as unknown as SupabaseClient;
}

function salon(index: number, overrides: Row = {}): Row {
  return {
    id: `listing-${String(index).padStart(5, "0")}`,
    name: `Business ${String(index).padStart(5, "0")}`,
    slug: `business-${index}`,
    city: "Kadawatha", district: "Gampaha", province: "Western Province",
    category: "Barber Salon", onboarding_status: "LISTING_PUBLISHED",
    status: "active", source_type: "LISTING_GENERATION", public_visibility: "public",
    booking_enabled: false, is_verified: false,
    rating: 4.5, review_count: 10, phone: "0771234567",
    is_featured: false, featured_starts_at: null, featured_ends_at: null,
    ...overrides,
  };
}

const activePeriod = { is_featured: true, featured_starts_at: "2000-01-01", featured_ends_at: "2099-12-31" };

async function main() {
  // No live database or network access is possible from this process.
  for (const key of ["SUPABASE_SERVICE_ROLE_KEY", "NEXT_SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_SERVICE_KEY"]) delete process.env[key];
  globalThis.fetch = async () => { throw new Error("Network access is forbidden in listing regression tests"); };
  const { fetchBusinessListingCards } = await import("../src/lib/public-salon-search");
  type CardsResult = Awaited<ReturnType<typeof fetchBusinessListingCards>>;
  const ids = (cards: Array<{ id: string }>) => cards.map((card) => card.id);
  const sectionIds = (result: CardsResult) => ids([...result.featured, ...result.topRated, ...result.listings]);
  const assertReviewOrder = (cards: Array<{ reviews: number; rating: number }>) => {
    for (let index = 1; index < cards.length; index += 1) {
      const previous = cards[index - 1];
      const current = cards[index];
      assert.ok(previous.reviews > current.reviews || (previous.reviews === current.reviews && previous.rating >= current.rating),
        `Review count must rank first, then rating: ${JSON.stringify(previous)} before ${JSON.stringify(current)}`);
    }
  };
  const scope = { publishedOnly: true, location: "Gampaha", category: "barber-salon", categoryName: "Barber Salon", limit: 8 };
  let checks = 0;

  async function check(label: string, work: () => Promise<void>) {
    await work(); checks += 1; console.log(`PASS ${label}`);
  }

  async function collectAll(rows: Row[], params: PublicSalonSearchParams = {}) {
    const client = fakeClient(rows);
    const first = await fetchBusinessListingCards(client, { ...scope, ...params, offset: 0 });
    const collected = sectionIds(first);
    const rankedCards = [...first.topRated, ...first.listings];
    assert.equal(new Set(collected).size, collected.length, "First page sections must be disjoint");
    let page = first;
    let offset = first.listings.length;
    for (let pageNumber = 1; page.hasMore; pageNumber += 1) {
      assert.ok(pageNumber < 200, "Load more must terminate");
      page = await fetchBusinessListingCards(client, { ...scope, ...params, offset });
      assert.deepEqual(ids(page.featured), ids(first.featured), "Featured selection must remain stable on later pages");
      assert.deepEqual(ids(page.topRated), ids(first.topRated), "Top Rated selection must remain stable on later pages");
      assert.ok(page.listings.length > 0, "Load more must not advertise an empty next page");
      for (const id of ids(page.listings)) assert.ok(!collected.includes(id), `Duplicate listing across pages: ${id}`);
      collected.push(...ids(page.listings));
      rankedCards.push(...page.listings);
      offset += page.listings.length;
    }
    const pastEnd = await fetchBusinessListingCards(client, { ...scope, ...params, offset });
    assert.equal(pastEnd.hasMore, false);
    assert.equal(pastEnd.listings.length, 0, "No rows should repeat after the last page");
    assertReviewOrder(rankedCards);
    return { first, collected, rankedCards };
  }

  await check("Location/category sections include only matching published businesses", async () => {
    const matching = Array.from({ length: 25 }, (_, index) => salon(index, index < 3 ? activePeriod : {}));
    const excluded = [
      salon(101, { ...activePeriod, city: "Kandy", district: "Kandy", province: "Central Province" }),
      salon(102, { ...activePeriod, category: "Nail Salon" }),
      salon(103, { ...activePeriod, onboarding_status: "LISTING_CAPTURED" }),
      salon(104, { ...activePeriod, status: "inactive" }),
      salon(105, { ...activePeriod, status: "rejected" }),
    ];
    const { first, collected } = await collectAll([...matching, ...excluded]);
    assert.equal(first.featured.length, 3);
    assert.equal(first.topRated.length, 4);
    assert.equal(first.listings.length, 8);
    assert.equal(first.totalCount, matching.length);
    assert.deepEqual(new Set(collected), new Set(matching.map((row) => row.id)));
  });

  await check("City searches do not include other cities in the same district", async () => {
    const rows = Array.from({ length: 20 }, (_, index) => salon(index, { ...(index < 4 ? activePeriod : {}), city: index % 2 ? "Ja-Ela" : "Kadawatha" }));
    const { first, collected } = await collectAll(rows, { location: "Kadawatha, Gampaha" });
    assert.equal(first.featured.length, 2);
    assert.deepEqual(new Set(collected), new Set(rows.filter((row) => row.city === "Kadawatha").map((row) => row.id)));
  });

  await check("Expired and scheduled features are ordinary listings; active features lead", async () => {
    const rows = Array.from({ length: 16 }, (_, index) => salon(index));
    Object.assign(rows[0], activePeriod);
    Object.assign(rows[1], { is_featured: true, featured_starts_at: "2000-01-01", featured_ends_at: "2000-01-02" });
    Object.assign(rows[2], { is_featured: true, featured_starts_at: "2099-01-01", featured_ends_at: "2099-12-31" });
    const { first, collected } = await collectAll(rows);
    assert.deepEqual(ids(first.featured), [rows[0].id]);
    assert.ok([...first.topRated, ...first.listings].filter((row) => [rows[1].id, rows[2].id].includes(row.id)).every((row) => !row.isFeatured));
    assert.equal(collected.length, rows.length);
  });

  await check("No featured businesses and small result sets terminate correctly", async () => {
    for (const count of [0, 1, 3, 4, 5, 12, 13, 21]) {
      const rows = Array.from({ length: count }, (_, index) => salon(index));
      const { first, collected } = await collectAll(rows);
      assert.equal(first.featured.length, 0);
      assert.equal(first.topRated.length, Math.min(count, 4));
      assert.equal(first.totalCount, count);
      assert.equal(collected.length, count);
    }
  });

  await check("Top Rated and every later page rank by reviews, then rating, then contactability", async () => {
    const rows = [
      salon(0, { ...activePeriod, rating: 1, review_count: 1 }),
      salon(1, { rating: 3.1, review_count: 1000, phone: null }),
      salon(2, { rating: 4.9, review_count: 900, phone: null }),
      salon(3, { rating: 4.2, review_count: 900, phone: "0771234567" }),
      salon(4, { rating: 4, review_count: 800, phone: "0771234567", name: "Zeta with contact" }),
      salon(5, { rating: 4, review_count: 800, phone: null, name: "Alpha without contact" }),
      ...Array.from({ length: 25 }, (_, index) => salon(index + 6, {
        rating: index % 2 ? 5 : 2, review_count: 790 - index * 10,
        phone: index % 2 ? "0771234567" : null,
      })),
      salon(31, { rating: 5, review_count: 1 }),
      salon(32, { rating: null, review_count: null, phone: null }),
    ];
    const { first, rankedCards } = await collectAll([...rows].reverse());
    assert.deepEqual(ids(first.featured), [rows[0].id], "Active Featured stays separate even with few reviews");
    assert.deepEqual(ids(first.topRated), rows.slice(1, 5).map((row) => row.id), "Most-reviewed businesses must fill Top Rated before 5-star low-review businesses");
    assert.deepEqual(ids(rankedCards), rows.slice(1).map((row) => row.id), "Rating and contactability must never override a larger review count");
  });

  await check("More than 400 matches paginate without loss, duplicates or moving Top Rated rows", async () => {
    const rows = Array.from({ length: 527 }, (_, index) => salon(index, {
      ...(index < 7 ? activePeriod : {}),
      rating: index < 450 ? 4.9 : 3.2,
      review_count: index % 3 === 0 ? 20 : 10,
      phone: index < 450 ? null : "0771234567",
    }));
    const { collected } = await collectAll(rows);
    assert.equal(collected.length, rows.length);
    assert.deepEqual(new Set(collected), new Set(rows.map((row) => row.id)));
  });

  await check("The featured batch limit does not remove additional active businesses", async () => {
    const rows = Array.from({ length: 69 }, (_, index) => salon(index, index < 45 ? activePeriod : {}));
    const { first, collected } = await collectAll(rows);
    assert.equal(first.featured.length, 40);
    assert.equal(collected.length, rows.length);
  });

  await check("Featured selection respects rating and verified filters", async () => {
    const rows = Array.from({ length: 20 }, (_, index) => salon(index, {
      ...activePeriod, rating: index % 2 ? 4.9 : 2.1, is_verified: index < 10,
    }));
    const result = await fetchBusinessListingCards(fakeClient(rows), { ...scope, minRating: 4, verifiedOnly: true });
    assert.deepEqual(new Set(sectionIds(result)), new Set(rows.filter((row) => Number(row.rating) >= 4 && row.is_verified).map((row) => row.id)));
    assert.equal(result.hasMore, false);
  });

  await check("Name search scans database matches independently of the displayed page", async () => {
    const rows = Array.from({ length: 510 }, (_, index) => salon(index));
    const target = salon(900, { name: "Shangri-La Hambantota", slug: "shangri-la-hambantota", rating: 1, review_count: 1 });
    const result = await fetchBusinessListingCards(fakeClient([...rows, target]), { ...scope, q: "Shangri-La Hambantota" });
    assert.deepEqual(ids(result.listings), [target.id]);
    assert.equal(result.featured.length, 0);
    assert.equal(result.topRated.length, 0);
    assert.equal(result.hasMore, false);
    assert.equal(result.totalCount, 1);
  });

  await check("A smaller database row cap cannot hide high-ranking businesses on later database pages", async () => {
    const rows = Array.from({ length: 530 }, (_, index) => salon(index, {
      ...(index === 529 ? activePeriod : {}),
      rating: index === 528 ? 3 : 5,
      review_count: index === 528 ? 1000 : 10,
      phone: index === 528 ? null : "0771234567",
    }));
    const result = await fetchBusinessListingCards(fakeClient(rows, 100), scope);
    assert.equal(result.totalCount, 530);
    assert.deepEqual(ids(result.featured), [rows[529].id]);
    assert.equal(result.topRated[0].id, rows[528].id);
  });

  console.log(`${checks} listing section regression checks passed.`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
