import Link from "next/link";
import { brandImagesAllowed } from "@/lib/products/brand-images";

export function SampleCatalogueNotice() {
  // Previews show the real demo catalogue (ADR-0013 amendment); production
  // still shows the made-up sample items.
  const isDemoPreview = brandImagesAllowed(process.env.VERCEL_ENV);

  return (
    <p
      role="note"
      className="mb-6 rounded-lg border border-border bg-muted px-4 py-3 text-xs leading-relaxed text-muted-foreground"
    >
      {isDemoPreview ? (
        <>
          <span className="font-medium text-foreground">Private demo.</span>{" "}
          Real products from five brands, shown to a small test group. Photos
          load from each brand&apos;s own site. Tags are AI-generated and may
          be wrong. Kashf Edit is not affiliated with these brands.{" "}
        </>
      ) : (
        <>
          <span className="font-medium text-foreground">Sample catalogue.</span>{" "}
          These four items are made up. They are here so the filters can be
          built and tested before real brands are on board.{" "}
        </>
      )}
      <Link
        href="/about"
        className="underline underline-offset-2 transition-colors hover:text-foreground"
      >
        Read more
      </Link>
    </p>
  );
}
