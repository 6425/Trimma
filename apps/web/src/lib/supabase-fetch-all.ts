/** Page size kept well under PostgREST max_rows (often 500). */
export const SUPABASE_ID_PAGE_SIZE = 100;

/**
 * Load every matching row using id-cursor pages.
 * Stop if a page adds no new ids (PostgREST repeating the first 500).
 */
export async function fetchAllByIdCursor<T extends { id?: unknown }>(
  run: (afterId: string | null, pageSize: number) => Promise<T[] | null>
): Promise<T[]> {
  const rows: T[] = [];
  const seen = new Set<string>();
  let afterId: string | null = null;

  for (let i = 0; i < 5000; i++) {
    const page = (await run(afterId, SUPABASE_ID_PAGE_SIZE)) ?? [];
    if (page.length === 0) break;

    let added = 0;
    for (const row of page) {
      const id = row.id == null ? "" : String(row.id);
      if (!id || seen.has(id)) continue;
      seen.add(id);
      rows.push(row);
      added += 1;
    }

    if (added === 0) break;
    if (page.length < SUPABASE_ID_PAGE_SIZE) break;
    const lastId = page[page.length - 1]?.id;
    afterId = lastId == null ? null : String(lastId);
    if (!afterId) break;
  }

  return rows;
}
