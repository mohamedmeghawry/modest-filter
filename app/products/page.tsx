import { listProducts, getFacetCounts } from "@/lib/data/products";
import { parseProductFilters } from "@/lib/data/parse-product-filters";
import { Suspense } from "react";
import Link from "next/link";
import Filters from "@/app/products/Filters";
import MobileFilters from "@/app/products/MobileFilters";
import ActiveFilterChips from "@/app/products/ActiveFilterChips";
import {
  formatPrice,
  getSwatch,
  humanize,
  notNull,
} from "@/lib/products/display";

export const dynamic = "force-dynamic";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const filters = parseProductFilters(params);
  const [products, facetCounts] = await Promise.all([
    listProducts(filters),
    getFacetCounts(filters),
  ]);
  const hasActiveFilters = Object.values(filters).some(
    (v) => Array.isArray(v) && v.length > 0,
  );

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-[clamp(1.5rem,1.15rem+1.6vw,2.125rem)] font-semibold leading-tight tracking-tight">
        Products
      </h1>

      <div className="flex flex-col gap-8 lg:flex-row">
        <aside className="hidden lg:block lg:w-64 lg:shrink-0">
          <Suspense fallback={null}>
            <Filters counts={facetCounts} />
          </Suspense>
        </aside>

        <div className="flex-1">
          <div className="mb-4 lg:hidden">
            <Suspense fallback={null}>
              <MobileFilters counts={facetCounts} />
            </Suspense>
          </div>

          <Suspense fallback={null}>
            <ActiveFilterChips />
          </Suspense>

          {products.length === 0 ? (
            <div className="rounded-lg border border-border p-8 text-center">
              <p className="text-sm text-muted-foreground">
                No products match your filters
              </p>
              {hasActiveFilters && (
                <Link
                  href="/products"
                  className="mt-3 inline-block min-h-8 rounded-full border border-border px-4 py-1.5 text-sm font-medium transition-colors hover:bg-muted"
                >
                  Clear filters
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => {
                const swatch = getSwatch(product.primaryColor);

                const badges = [
                  product.sleeveLength,
                  product.hemLength,
                  product.material,
                ].filter(notNull);

                return (
                  <Link
                    key={product.id}
                    href={`/products/${product.id}`}
                    className="flex flex-col overflow-hidden rounded-lg border border-border transition-shadow hover:shadow-md"
                  >
                    <div
                      className="aspect-[3/4] w-full"
                      style={{ backgroundColor: swatch }}
                      aria-hidden="true"
                    />

                    <div className="flex flex-col gap-2 p-4">
                      <span className="text-xs uppercase tracking-wide text-muted-foreground">
                        {product.brand.name}
                      </span>

                      <h3 className="text-base font-medium leading-snug">
                        {product.name}
                      </h3>

                      <span className="text-lg font-semibold tabular-nums">
                        {formatPrice(product.price)}
                      </span>

                      {badges.length > 0 && (
                        <ul className="mt-1 flex flex-wrap gap-1.5">
                          {badges.slice(0, 3).map((badge) => (
                            <li
                              key={badge}
                              className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground"
                            >
                              {humanize(badge)}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
