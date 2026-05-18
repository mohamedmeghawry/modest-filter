export const FILTER_KEYS = [
  "category",
  "sleeveLength",
  "hemLength",
  "opacity",
  "material",
  "primaryColor",
  "topLength",
] as const;

export function countActiveFilters(searchParams: {
  get: (key: string) => string | null;
}): number {
  return FILTER_KEYS.reduce((total, key) => {
    const raw = searchParams.get(key);
    return total + (raw ? raw.split(",").filter(Boolean).length : 0);
  }, 0);
}
