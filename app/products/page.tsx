import { listProducts } from "@/lib/data/products";

export const dynamic = "force-dynamic";

const COLOR_HEX: Record<string, string> = {
  black: "#171717",
  white: "#f5f5f5",
  beige: "#e8dcc8",
  brown: "#8b5e3c",
  gray: "#9ca3af",
  navy: "#1e293b",
  blue: "#3b82f6",
  green: "#16a34a",
  yellow: "#eab308",
  orange: "#f97316",
  red: "#dc2626",
  pink: "#ec4899",
  purple: "#9333ea",
};

function formatPrice(price: unknown): string {
  return `$${Number(price).toLocaleString("en-US", {
    maximumFractionDigits: 0,
  })}`;
}

function humanize(value: string): string {
  return value.replace(/_/g, " ");
}

function notNull<T>(value: T): value is Exclude<T, null | undefined> {
  return value !== null && value !== undefined;
}

export default async function ProductsPage() {
  const products = await listProducts();

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold">Products</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => {
          const swatch =
            (product.primaryColor && COLOR_HEX[product.primaryColor]) ||
            "#9ca3af";

          const badges = [
            product.sleeveLength,
            product.hemLength,
            product.material,
          ].filter(notNull);

          return (
            <article
              key={product.id}
              className="flex flex-col overflow-hidden rounded-lg border border-black/10"
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
            </article>
          );
        })}
      </div>
    </main>
  );
}
