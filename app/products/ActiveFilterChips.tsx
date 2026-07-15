"use client";

import { useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FILTER_KEYS, activeFilterValues } from "@/lib/products/filter-state";
import { humanize } from "@/lib/products/display";

// Active filters shown as removable chips above the grid, so the current
// selection stays visible without opening the filter panel (Baymard: ~20% of
// stores hide applied filters). Remove logic mirrors Filters.tsx `toggle`.
export default function ActiveFilterChips() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const active = FILTER_KEYS.flatMap((key) =>
    activeFilterValues(searchParams, key).map((value) => ({ key, value })),
  );

  if (active.length === 0) return null;

  const remove = (key: string, value: string) => {
    const current = activeFilterValues(searchParams, key);
    const next = current.filter((v) => v !== value);

    const params = new URLSearchParams(searchParams.toString());
    if (next.length) {
      params.set(key, next.join(","));
    } else {
      params.delete(key);
    }

    const qs = params.toString();
    startTransition(() => {
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    });
  };

  return (
    <ul
      aria-label="Active filters"
      className={`mb-4 flex flex-wrap gap-2 ${isPending ? "opacity-60" : ""}`}
    >
      {active.map(({ key, value }) => (
        <li key={`${key}:${value}`}>
          <button
            type="button"
            onClick={() => remove(key, value)}
            aria-label={`Remove filter ${humanize(value)}`}
            className="flex min-h-8 items-center gap-1.5 rounded-full border border-border px-3 py-1 text-sm capitalize transition-colors hover:bg-muted"
          >
            {humanize(value)}
            <span aria-hidden="true" className="text-muted-foreground">
              ×
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
