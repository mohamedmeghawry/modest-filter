import { notFound } from "next/navigation";
import { getProductById } from "@/lib/data/products";
import { COLOR_HEX, formatPrice, humanize } from "@/lib/products/display";

export const dynamic = "force-dynamic";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProductById(id);

  if (!product) notFound();

  const swatch =
    (product.primaryColor && COLOR_HEX[product.primaryColor]) || "#9ca3af";

  const groups: { heading: string; items: [string, string | null][] }[] = [
    {
      heading: "Coverage",
      items: [
        ["Sleeve length", product.sleeveLength],
        ["Sleeve opacity", product.sleeveOpacity],
        ["Neckline", product.neckline],
        ["Back style", product.backStyle],
        ["Hem length", product.hemLength],
        ["Top length", product.topLength],
        ["Slit", product.slit],
      ],
    },
    {
      heading: "Fit & material",
      items: [
        ["Fit", product.fit],
        ["Opacity", product.opacity],
        ["Lined", product.lined],
        ["Cutouts", product.cutouts],
        ["Material", product.material],
      ],
    },
    {
      heading: "Visual",
      items: [
        ["Primary color", product.primaryColor],
        ["Pattern", product.pattern],
      ],
    },
  ];

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8">
      <div className="flex flex-col gap-8 lg:flex-row">
        <div
          className="h-64 w-full rounded-lg border border-black/10 lg:w-96 lg:shrink-0"
          style={{ backgroundColor: swatch }}
          aria-hidden="true"
        />

        <div className="flex flex-1 flex-col gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-wide opacity-60">
              {product.brand.name}
            </span>
            <h1 className="text-2xl font-semibold leading-tight">
              {product.name}
            </h1>
            <span className="text-xl font-semibold">
              {formatPrice(product.price)}
            </span>
          </div>

          <a
            href={product.affiliateUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="self-start rounded-full border border-black/10 px-5 py-2 text-sm font-medium opacity-80 transition-opacity hover:opacity-100"
          >
            Affiliate link
          </a>

          <div className="mt-2 flex flex-col gap-5">
            {groups.map((group) => {
              const populated = group.items.filter(
                (item): item is [string, string] => item[1] !== null,
              );
              if (populated.length === 0) return null;
              return (
                <section key={group.heading} className="flex flex-col gap-2">
                  <h2 className="text-sm font-semibold uppercase tracking-wide opacity-60">
                    {group.heading}
                  </h2>
                  <dl className="flex flex-col gap-1">
                    {populated.map(([label, value]) => (
                      <div
                        key={label}
                        className="flex justify-between border-b border-black/10 py-1 text-sm"
                      >
                        <dt className="opacity-60">{label}</dt>
                        <dd className="capitalize">{humanize(value)}</dd>
                      </div>
                    ))}
                  </dl>
                </section>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}
