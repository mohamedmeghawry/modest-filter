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
import { humanize } from "@/lib/products/display";

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
    <div className={`flex flex-col gap-4 ${isPending ? "opacity-60" : ""}`}>
      <Accordion type="multiple" defaultValue={["category"]}>
        {FILTER_GROUPS.map((group) => {
          const selected = selectedFor(group.key);
          return (
            <AccordionItem key={group.key} value={group.key}>
              <AccordionTrigger>{group.label}</AccordionTrigger>
              <AccordionContent>
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
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

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
