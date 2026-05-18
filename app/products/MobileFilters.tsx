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
import Filters, { FILTER_GROUPS } from "@/app/products/Filters";

export default function MobileFilters() {
  const [open, setOpen] = useState(false);
  const searchParams = useSearchParams();

  const activeCount = FILTER_GROUPS.reduce((total, group) => {
    const raw = searchParams.get(group.key);
    return total + (raw ? raw.split(",").filter(Boolean).length : 0);
  }, 0);

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
          <Filters />
        </div>
      </SheetContent>
    </Sheet>
  );
}
