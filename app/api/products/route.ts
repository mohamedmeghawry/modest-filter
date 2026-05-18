import { NextRequest, NextResponse } from "next/server";
import { listProducts } from "@/lib/data/products";
import { parseProductFilters } from "@/lib/data/parse-product-filters";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const filters = parseProductFilters(request.nextUrl.searchParams);
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
