import Link from "next/link";

const footerLinkClass =
  "rounded-sm outline-none transition-colors hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:flex-row sm:items-start sm:justify-between">
        <p className="max-w-md text-xs leading-relaxed text-muted-foreground">
          Kashf Edit doesn’t sell clothing. You buy from the brand’s own site.
          Some outbound links may earn us a commission, at no extra cost to you.
        </p>

        <nav
          aria-label="Footer"
          className="flex gap-5 text-xs text-muted-foreground"
        >
          <Link href="/about" className={footerLinkClass}>
            About
          </Link>
          <Link href="/privacy" className={footerLinkClass}>
            Privacy
          </Link>
        </nav>
      </div>
    </footer>
  );
}
