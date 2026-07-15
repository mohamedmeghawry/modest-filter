export const FILTER_KEYS = [
  "category",
  "sleeveLength",
  "hemLength",
  "opacity",
  "material",
  "primaryColor",
  "topLength",
] as const;

// Read ALL values for a filter key, mirroring the server parser's `rawValues`
// (parse-product-filters.ts): repeated params AND comma-separated lists are both
// supported, trimmed, and emptied. Client code must read every occurrence — a
// shareable `?material=cotton&material=linen` URL carries both, and `.get` would
// silently drop all but the first. Kept as a structural `{ getAll }` type so
// plain URLSearchParams and Next's ReadonlyURLSearchParams both satisfy it
// without importing Prisma-coupled server code into client components.
export function activeFilterValues(
  searchParams: { getAll: (key: string) => string[] },
  key: string,
): string[] {
  return searchParams
    .getAll(key)
    .flatMap((v) => v.split(","))
    .map((v) => v.trim())
    .filter(Boolean);
}

export function countActiveFilters(searchParams: {
  getAll: (key: string) => string[];
}): number {
  return FILTER_KEYS.reduce(
    (total, key) => total + activeFilterValues(searchParams, key).length,
    0,
  );
}
