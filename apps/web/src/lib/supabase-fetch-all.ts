const SUPABASE_PAGE_SIZE = 100;

/**
 * Load every matching row by paging.
 * Supabase/PostgREST often caps a single request at 500 or 1000 rows.
 * Using 100-row pages avoids that hard stop.
 */
export async function fetchAllQueryPages<T>(
  run: (from: number, to: number) => Promise<T[] | null>
): Promise<T[]> {
  const rows: T[] = [];
  let from = 0;

  while (true) {
    const page = (await run(from, from + SUPABASE_PAGE_SIZE - 1)) ?? [];
    rows.push(...page);
    if (page.length < SUPABASE_PAGE_SIZE) break;
    from += SUPABASE_PAGE_SIZE;
  }

  return rows;
}
