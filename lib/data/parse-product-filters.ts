import type { ProductFilters } from "@/lib/data/products";
import { SleeveLength, HemLength, Opacity } from "@/lib/generated/prisma/enums";

type ParamSource =
  | URLSearchParams
  | Record<string, string | string[] | undefined>;

function rawValues(source: ParamSource, key: string): string[] {
  const collected: string[] =
    source instanceof URLSearchParams
      ? source.getAll(key)
      : ([] as string[]).concat(source[key] ?? []);
  return collected
    .flatMap((v) => v.split(","))
    .map((v) => v.trim())
    .filter(Boolean);
}

function parseEnumValues<E extends string>(
  values: string[],
  allowed: Record<string, E>,
): E[] | undefined {
  const valid = new Set<string>(Object.values(allowed));
  const result = values.filter((v): v is E => valid.has(v));
  return result.length ? result : undefined;
}

function parseStrings(values: string[]): string[] | undefined {
  return values.length ? values : undefined;
}

export function parseProductFilters(source: ParamSource): ProductFilters {
  return {
    category: parseStrings(rawValues(source, "category")),
    sleeveLength: parseEnumValues(
      rawValues(source, "sleeveLength"),
      SleeveLength,
    ),
    hemLength: parseEnumValues(rawValues(source, "hemLength"), HemLength),
    opacity: parseEnumValues(rawValues(source, "opacity"), Opacity),
  };
}
