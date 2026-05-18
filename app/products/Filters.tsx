"use client";

import { useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SleeveLength, HemLength, Opacity } from "@/lib/generated/prisma/enums";

// TODO: fetch category options from the DB (Category table) instead of hardcoding
const CATEGORY_OPTIONS = ["dresses", "tops", "bottoms"];

type FilterGroup = { key: string; label: string; options: string[] };

const FILTER_GROUPS: FilterGroup[] = [
  { key: "category", label: "Category", options: CATEGORY_OPTIONS },
  {
    key: "sleeveLength",
    label: "Sleeve Length",
    options: Object.values(SleeveLength),
  },
  { key: "hemLength", label: "Hem Length", options: Object.values(HemLength) },
  { key: "opacity", label: "Opacity", options: Object.values(Opacity) },
];

function humanize(value: string): string {
  return value.replace(/_/g, " ");
}

export default function Filters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const selectedFor = (key: string): string[] => {
    const raw = searchParams.get(key);
    return raw ? raw.split(",").filter(Boolean) : [];
  };

  const hasActiveFilters = FILTER_GROUPS.some(
    (g) => selectedFor(g.key).length > 0,
  );

  const toggle = (key: string, value: string, checked: boolean) => {
    const current = selectedFor(key);
    const next = checked
      ? [...current, value]
      : current.filter((v) => v !== value);

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

  const clearFilters = () => {
    startTransition(() => {
      router.replace(pathname);
    });
  };

  return (
    <div className={`flex flex-col gap-6 ${isPending ? "opacity-60" : ""}`}>
      {FILTER_GROUPS.map((group) => {
        const selected = selectedFor(group.key);
        return (
          <fieldset key={group.key} className="flex flex-col gap-2">
            <legend className="text-sm font-semibold">{group.label}</legend>
            <div className="flex flex-col gap-1.5">
              {group.options.map((option) => (
                <label
                  key={option}
                  className="flex items-center gap-2 text-sm capitalize opacity-80"
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(option)}
                    onChange={(e) =>
                      toggle(group.key, option, e.target.checked)
                    }
                    className="h-4 w-4 rounded border-black/20"
                  />
                  {humanize(option)}
                </label>
              ))}
            </div>
          </fieldset>
        );
      })}

      {hasActiveFilters && (
        <button
          type="button"
          onClick={clearFilters}
          className="self-start rounded-full border border-black/10 px-4 py-1.5 text-sm font-medium opacity-80 transition-opacity hover:opacity-100"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
