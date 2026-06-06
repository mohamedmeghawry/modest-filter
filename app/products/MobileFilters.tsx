"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import Filters from "@/app/products/Filters";
import { countActiveFilters } from "@/lib/products/filter-state";
import type { FacetCounts } from "@/lib/data/products";

export default function MobileFilters({ counts }: { counts?: FacetCounts }) {
  const [open, setOpen] = useState(false);
  const searchParams = useSearchParams();

  const activeCount = countActiveFilters(searchParams);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="w-full">
          Filter{activeCount > 0 ? ` (${activeCount})` : ""}
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Filter</SheetTitle>
          <SheetDescription>
            Narrow the catalogue by attribute.
          </SheetDescription>
        </SheetHeader>
        <div className="px-4 pb-8">
          <Filters counts={counts} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
