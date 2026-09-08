/** Read-only integration check. Use --local for configured DB, or pass a site origin. */
import assert from "node:assert/strict";
import dotenv from "dotenv";
import { salonBelongsToRequestedLocation } from "../src/lib/sri-lanka-locations";
import type { fetchBusinessListingCards } from "../src/lib/public-salon-search";

type Result = Awaited<ReturnType<typeof fetchBusinessListingCards>>;
const target = process.argv[2];
assert.ok(target, "Pass --local or the beta/live site origin.");
let localSearch: typeof fetchBusinessListingCards | undefined;
let client: import("@supabase/supabase-js").SupabaseClient | undefined;
if (target === "--local") {
  dotenv.config({ path: "apps/web/.env", quiet: true });
  dotenv.config({ path: ".env", quiet: true });
  localSearch = (await import("../src/lib/public-salon-search")).fetchBusinessListingCards;
  client = (await import("../src/config/supabase-admin")).createSupabaseAdminClient();
}
async function search(params: { location?: string; category?: string; categoryName?: string; offset?: number }): Promise<Result> {
  if (localSearch && client) return localSearch(client, { ...params, publishedOnly: true, limit: 8 });
  const query = new URLSearchParams({ publishedOnly: "true", limit: "8" });
  for (const [key, value] of Object.entries(params)) query.set(key, String(value));
  const response = await fetch(`${target}/api/business-listings/search?${query}`, { signal: AbortSignal.timeout(60000) });
  assert.ok(response.ok, `Listing request failed: ${response.status}`);
  return response.json();
}
for (const params of [
  {},
  { location: "Colombo" },
  { category: "barber-salon", categoryName: "Barber Salon" },
  { category: "barber-salon", categoryName: "Barber Salon", location: "Colombo" },
  { location: "Kadawatha, Gampaha" },
]) {
  const start = performance.now();
  const first = await search(params);
  const cards = [...first.featured, ...first.topRated, ...first.listings];
  const ids = cards.map((card) => card.id);
  assert.equal(new Set(ids).size, ids.length, "Sections must not duplicate businesses");
  assert.ok(first.featured.every((card) => card.isFeatured), "Featured cards must have an active promotion");
  if (first.totalCount > first.featured.length) assert.ok(first.topRated.length > 0, "Top Rated section is missing");
  if ("location" in params) {
    assert.ok(cards.every((card) => salonBelongsToRequestedLocation(card, params.location)), "Business outside selected geography");
  }
  if (first.hasMore) {
    const next = await search({ ...params, offset: first.listings.length });
    assert.ok(next.listings.length > 0, "Load more returned an empty page");
    assert.ok(next.listings.every((card) => !ids.includes(card.id)), "Load more repeated businesses");
    assert.deepEqual(next.featured.map((card) => card.id), first.featured.map((card) => card.id));
    assert.deepEqual(next.topRated.map((card) => card.id), first.topRated.map((card) => card.id));
  }
  console.log(JSON.stringify({ target, ...params, featured: first.featured.length, topRated: first.topRated.length,
    more: first.listings.length, total: first.totalCount, hasMore: first.hasMore,
    elapsedMs: Math.round(performance.now() - start) }));
}
