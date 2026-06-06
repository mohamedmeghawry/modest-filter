"use client";

import { useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  SleeveLength,
  HemLength,
  Opacity,
  Material,
  PrimaryColor,
  TopLength,
} from "@/lib/generated/prisma/enums";
import { getSwatch, humanize } from "@/lib/products/display";
import type { FacetCounts } from "@/lib/data/products";

// TODO: fetch category options from the DB (Category table) instead of hardcoding
const CATEGORY_OPTIONS = ["dresses", "abayas", "tops"];

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
  { key: "material", label: "Material", options: Object.values(Material) },
  {
    key: "primaryColor",
    label: "Primary Color",
    options: Object.values(PrimaryColor),
  },
  { key: "topLength", label: "Top Length", options: Object.values(TopLength) },
];

// `multicolor` has no single honest hex, so render it as a spectrum chip.
const MULTICOLOR_GRADIENT =
  "conic-gradient(from 0deg, #dc2626, #eab308, #16a34a, #3b82f6, #9333ea, #dc2626)";

export default function Filters({ counts }: { counts?: FacetCounts }) {
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

  const countFor = (key: string, option: string): number | undefined =>
    counts?.[key]?.[option];

  return (
    <div className={`flex flex-col gap-4 ${isPending ? "opacity-60" : ""}`}>
      <Accordion type="multiple" defaultValue={["category"]}>
        {FILTER_GROUPS.map((group) => {
          const selected = selectedFor(group.key);
          const isColor = group.key === "primaryColor";
          return (
            <AccordionItem key={group.key} value={group.key}>
              <AccordionTrigger>{group.label}</AccordionTrigger>
              <AccordionContent>
                {isColor ? (
                  <div className="grid grid-cols-6 gap-2">
                    {group.options.map((option) => {
                      const isSelected = selected.includes(option);
                      const count = countFor(group.key, option);
                      const isEmpty = count === 0;
                      return (
                        <button
                          key={option}
                          type="button"
                          aria-pressed={isSelected}
                          aria-label={
                            count === undefined
                              ? humanize(option)
                              : `${humanize(option)}, ${count} products`
                          }
                          title={
                            count === undefined
                              ? humanize(option)
                              : `${humanize(option)} (${count})`
                          }
                          onClick={() =>
                            toggle(group.key, option, !isSelected)
                          }
                          style={
                            option === "multicolor"
                              ? { background: MULTICOLOR_GRADIENT }
                              : { backgroundColor: getSwatch(option as PrimaryColor) }
                          }
                          className={`aspect-square w-full rounded-full transition ${
                            isSelected
                              ? "ring-2 ring-foreground ring-offset-2 ring-offset-background"
                              : "border border-border"
                          } ${isEmpty && !isSelected ? "opacity-30" : ""}`}
                        />
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col">
                    {group.options.map((option) => {
                      const count = countFor(group.key, option);
                      return (
                        <label
                          key={option}
                          className="flex min-h-8 cursor-pointer items-center gap-2.5 py-1 text-sm capitalize"
                        >
                          <input
                            type="checkbox"
                            checked={selected.includes(option)}
                            onChange={(e) =>
                              toggle(group.key, option, e.target.checked)
                            }
                            className="h-4 w-4 rounded border-input"
                          />
                          <span className="flex-1">{humanize(option)}</span>
                          {count !== undefined && (
                            <span
                              className={`text-xs tabular-nums ${
                                count === 0
                                  ? "text-muted-foreground/50"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {count}
                            </span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      {hasActiveFilters && (
        <button
          type="button"
          onClick={clearFilters}
          className="min-h-8 self-start rounded-full border border-border px-4 py-1.5 text-sm font-medium transition-colors hover:bg-muted"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
