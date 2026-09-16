import Link from "next/link";

export function SampleCatalogueNotice() {
  return (
    <p
      role="note"
      className="mb-6 rounded-lg border border-border bg-muted px-4 py-3 text-xs leading-relaxed text-muted-foreground"
    >
      <span className="font-medium text-foreground">Sample catalogue.</span>{" "}
      These four items are made up. They are here so the filters can be built
      and tested before real brands are on board.{" "}
      <Link
        href="/about"
        className="underline underline-offset-2 transition-colors hover:text-foreground"
      >
        Read more
      </Link>
    </p>
  );
}
