import { connection } from "next/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThresholdDemo } from "@/components/home/ThresholdDemo";

// The handoff of responsibility is the product's actual thesis: we measure,
// you judge, the brand sells. Labelling each step by *who acts* encodes that,
// where generic step numbering would not.
const STEPS = [
  {
    actor: "Kashf Edit",
    title: "Reads the garment",
    body: "A vision model extracts objective attributes from each product photo — sleeve length, neckline, hem length, fit, opacity. Facts, not opinions.",
  },
  {
    actor: "You",
    title: "Set your lines",
    body: "Filter on those attributes directly. There is no modesty score and no presets, because no two people draw the line in the same place.",
  },
  {
    actor: "The brand",
    title: "Sells you the piece",
    body: "Kashf Edit holds no stock and sells nothing. When something works, you check out on the brand’s own site.",
  },
];

export default async function Home() {
  // Force dynamic rendering so the per-request CSP nonce (proxy.ts) applies;
  // a statically prerendered page has no request-time nonce for its scripts.
  await connection();

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-16 sm:py-24">
      <section className="max-w-2xl">
        <h1 className="text-[clamp(2rem,1.4rem+2.8vw,3.25rem)] font-semibold leading-[1.1] tracking-tight text-balance">
          Modest is a line you draw.
        </h1>

        <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
          Mainstream brands don’t let you filter for sleeve length, hem length,
          or opacity. Kashf Edit reads those facts for every piece — then gets
          out of the way while you decide which ones meet your standard.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Button asChild size="lg" className="rounded-full">
            <Link href="/products">Browse the catalogue</Link>
          </Button>
          <Button asChild variant="ghost" size="lg" className="rounded-full">
            <Link href="/about">What this is</Link>
          </Button>
        </div>

        <p className="mt-6 text-xs leading-relaxed text-muted-foreground">
          Early preview — the catalogue is a small sample while brand
          partnerships are being set up.
        </p>
      </section>

      <section className="mt-16 sm:mt-24" aria-labelledby="try-it">
        <h2 id="try-it" className="sr-only">
          Try setting a threshold
        </h2>
        <div className="max-w-3xl">
          <ThresholdDemo />
        </div>
      </section>

      <section className="mt-16 sm:mt-24" aria-labelledby="how-it-works">
        <h2
          id="how-it-works"
          className="text-[clamp(1.375rem,1.15rem+1.1vw,1.75rem)] font-semibold tracking-tight"
        >
          Who does what
        </h2>

        <div className="mt-8 grid gap-8 sm:grid-cols-3 sm:gap-6">
          {STEPS.map((step) => (
            <div
              key={step.actor}
              className="border-t border-border pt-4 sm:pt-5"
            >
              <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                {step.actor}
              </p>
              <h3 className="mt-2 text-base font-medium">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-16 max-w-2xl sm:mt-24">
        <p className="text-sm leading-relaxed text-muted-foreground">
          Kashf Edit is built by one person, in the open, for his wife and the
          women she shops with. It is early and it shows its work.{" "}
          <Link
            href="/about"
            className="rounded-sm text-foreground underline underline-offset-4 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            Read the longer version
          </Link>
          .
        </p>
      </section>
    </main>
  );
}
