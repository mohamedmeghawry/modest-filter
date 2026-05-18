import { listProducts } from "@/lib/data/products";
import { parseProductFilters } from "@/lib/data/parse-product-filters";
import { Suspense } from "react";
import Link from "next/link";
import Filters from "@/app/products/Filters";
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
  const products = await listProducts(filters);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold">Products</h1>

      <div className="flex flex-col gap-8 lg:flex-row">
        <aside className="lg:w-64 lg:shrink-0">
          <Suspense fallback={null}>
            <Filters />
          </Suspense>
        </aside>

        <div className="flex-1">
          {products.length === 0 ? (
            <p className="rounded-lg border border-black/10 p-8 text-center text-sm opacity-60">
              No products match your filters
            </p>
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
                    className="flex flex-col overflow-hidden rounded-lg border border-black/10 transition-opacity hover:opacity-90"
                  >
                    <div
                      className="h-44 w-full"
                      style={{ backgroundColor: swatch }}
                      aria-hidden="true"
                    />

                    <div className="flex flex-col gap-2 p-4">
                      <span className="text-xs uppercase tracking-wide opacity-60">
                        {product.brand.name}
                      </span>

                      <h3 className="text-base font-medium leading-snug">
                        {product.name}
                      </h3>

                      <span className="text-lg font-semibold">
                        {formatPrice(product.price)}
                      </span>

                      {badges.length > 0 && (
                        <ul className="mt-1 flex flex-wrap gap-1.5">
                          {badges.slice(0, 3).map((badge) => (
                            <li
                              key={badge}
                              className="rounded-full border border-black/10 px-2 py-0.5 text-xs opacity-80"
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
