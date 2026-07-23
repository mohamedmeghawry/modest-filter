import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b border-border">
      <nav
        aria-label="Main"
        className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4"
      >
        <Link
          href="/"
          className="rounded-sm text-base font-semibold tracking-tight outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          Kashf<span className="font-normal text-muted-foreground">&nbsp;Edit</span>
        </Link>

        <Link
          href="/products"
          className="rounded-sm text-sm font-medium text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          Browse
        </Link>
      </nav>
    </header>
  );
}
