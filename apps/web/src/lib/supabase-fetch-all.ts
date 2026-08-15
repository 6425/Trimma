const SUPABASE_PAGE_SIZE = 1000;

/** Load every matching row. Pages in chunks of 1000 — not a listing cap. */
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
