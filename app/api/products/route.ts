import { NextRequest, NextResponse } from "next/server";
import { listProducts, type ProductFilters } from "@/lib/data/products";
import { SleeveLength, HemLength, Opacity } from "@/lib/generated/prisma/enums";

export const dynamic = "force-dynamic";

function parseEnumValues<E extends string>(
  raw: string | null,
  allowed: Record<string, E>,
): E[] | undefined {
  if (!raw) return undefined;
  const valid = new Set<string>(Object.values(allowed));
  const result = raw
    .split(",")
    .map((v) => v.trim())
    .filter((v): v is E => valid.has(v));
  return result.length ? result : undefined;
}

function parseStrings(raw: string | null): string[] | undefined {
  if (!raw) return undefined;
  const result = raw
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
  return result.length ? result : undefined;
}

export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;

    const filters: ProductFilters = {
      category: parseStrings(sp.get("category")),
      sleeveLength: parseEnumValues(sp.get("sleeveLength"), SleeveLength),
      hemLength: parseEnumValues(sp.get("hemLength"), HemLength),
      opacity: parseEnumValues(sp.get("opacity"), Opacity),
    };

    const products = await listProducts(filters);
    return NextResponse.json({ products });
  } catch (error) {
    console.error("GET /api/products failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 },
    );
  }
}
