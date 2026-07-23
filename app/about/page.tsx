import type { Metadata } from "next";
import { connection } from "next/server";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About",
  description:
    "Why Kashf Edit exists, how it tags garments on objective attributes, and what it deliberately refuses to decide for you.",
};

export default async function AboutPage() {
  // Force dynamic rendering so the per-request CSP nonce (proxy.ts) applies.
  await connection();

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-16 sm:py-24">
      <div className="max-w-2xl">
        <h1 className="text-[clamp(1.75rem,1.35rem+2vw,2.5rem)] font-semibold leading-tight tracking-tight">
          About Kashf Edit
        </h1>

        <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
          A tool for finding modest clothing in the catalogues of mainstream
          brands — without scrolling past hundreds of pieces to find the few
          that work.
        </p>

        <h2 className="mt-12 text-lg font-medium">The problem</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Brands like Aritzia, Everlane, and Anthropologie carry plenty of
          pieces that would suit someone dressing modestly. Their websites just
          give you no way to find them. You can filter by size, colour, and
          price, but not by the things that actually decide the question: how
          long the sleeves are, where the hem falls, whether the fabric is sheer.
          So you check every product by hand, and usually give up.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Modest-specific retailers exist, but they carry modest-niche brands.
          They don’t answer “I want something modest from Aritzia.”
        </p>

        <h2 className="mt-12 text-lg font-medium">The principle</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Kashf Edit does not decide what counts as modest. That would be the
          easy build and the wrong one — modesty is personal, and it varies
          enormously between people who are equally sincere about it.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Instead, a vision model reads each garment for{" "}
          <span className="font-mono text-xs text-foreground">
            objective, checkable attributes
          </span>{" "}
          — sleeve length, neckline, hem length, fit, opacity, and a handful
          more. Those are facts about a piece of cloth, and reasonable people
          don’t disagree about them. You then filter on those facts using
          whatever thresholds are right for you.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          No modesty score. No “modest / very modest” presets. No opinion from us
          about where your line belongs.
        </p>

        <h2 className="mt-12 text-lg font-medium">The name</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          <span className="font-medium text-foreground">Kashf</span> (كشف) means
          to uncover or reveal. The job here is revealing what’s already sitting
          in these catalogues — not adding anything to them.
        </p>

        <h2 className="mt-12 text-lg font-medium">What this isn’t</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Kashf Edit is not a shop. It holds no stock, takes no payments, and
          ships nothing. Every piece links out to the brand’s own site, and you
          buy there on their terms. It is also not a religious authority — it’s a
          filter.
        </p>

        <h2 className="mt-12 text-lg font-medium">Where it is right now</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Early, and honest about it. The catalogue you can browse today is a
          small sample used to build and test the filtering, while brand and
          affiliate partnerships are being arranged. Product photography and a
          full catalogue follow once those are in place.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          It’s built and maintained by one person — Mohamed Meghawry, in Toronto
          — with his wife as the product and curation lead. She is the reason it
          exists and the reason it gets the details right.
        </p>

        <p className="mt-12 text-sm leading-relaxed text-muted-foreground">
          <Link
            href="/products"
            className="rounded-sm text-foreground underline underline-offset-4 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            Browse the catalogue
          </Link>{" "}
          or read the{" "}
          <Link
            href="/privacy"
            className="rounded-sm text-foreground underline underline-offset-4 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            privacy policy
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
