import type { Metadata } from "next";
import { connection } from "next/server";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy",
  description:
    "Kashf Edit has no accounts, sets no cookies, and runs no analytics or tracking. Here is exactly what that means.",
};

export default async function PrivacyPage() {
  // Force dynamic rendering so the per-request CSP nonce (proxy.ts) applies.
  await connection();

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-16 sm:py-24">
      <div className="max-w-2xl">
        <h1 className="text-[clamp(1.75rem,1.35rem+2vw,2.5rem)] font-semibold leading-tight tracking-tight">
          Privacy
        </h1>
        <p className="mt-3 font-mono text-xs uppercase tracking-widest text-muted-foreground">
          Last updated 22 July 2026
        </p>

        <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
          The short version: Kashf Edit has no accounts, sets no cookies, and
          runs no analytics or tracking of any kind. There is no profile of you
          here, because nothing is collected to build one from.
        </p>

        <h2 className="mt-12 text-lg font-medium">What we collect</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Nothing personal. To be specific about what that means:
        </p>
        <ul className="mt-3 flex flex-col gap-2 text-sm leading-relaxed text-muted-foreground">
          <li className="border-l border-border pl-4">
            There are no user accounts, logins, or profiles. You can’t create
            one, so we can’t hold one.
          </li>
          <li className="border-l border-border pl-4">
            We set no cookies. Your filter selections live in the page URL, not
            in storage on your device.
          </li>
          <li className="border-l border-border pl-4">
            There is no analytics, no tracking pixel, no advertising network, and
            no third-party script measuring your visit.
          </li>
          <li className="border-l border-border pl-4">
            We ask for no email address, name, location, or payment details —
            there is nowhere on this site to enter them.
          </li>
        </ul>

        <h2 className="mt-12 text-lg font-medium">What our host sees</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          The site is hosted on Vercel and its database is hosted on Supabase.
          Like any web host, Vercel processes standard technical request data —
          such as your IP address, browser user-agent, and the page requested —
          in order to serve the page and to protect the service from abuse. That
          is infrastructure logging, and it is handled under their terms rather
          than ours. We do not build our own records on top of it.
        </p>

        <h2 className="mt-12 text-lg font-medium">What’s in the database</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Product information only: brands, garment names, prices, and the
          attributes extracted from product photos. No user data of any kind is
          stored, because none is collected.
        </p>

        <h2 className="mt-12 text-lg font-medium">Links to brand sites</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Kashf Edit sells nothing. When you click through to buy, you leave this
          site and land on the brand’s own storefront, where their privacy policy
          and cookies apply, not ours. Some of those outbound links may be
          affiliate links, meaning we could earn a small commission if you buy —
          at no extra cost to you. That never changes which pieces are shown to
          you or how they’re ordered.
        </p>

        <h2 className="mt-12 text-lg font-medium">Children</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          This site is intended for adults shopping for women’s clothing. It
          collects no data from anyone, including children.
        </p>

        <h2 className="mt-12 text-lg font-medium">Changes</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          If this ever changes — for example if analytics are added — this page
          is updated and the date at the top changes with it.
        </p>

        <h2 className="mt-12 text-lg font-medium">Contact</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Questions about any of this can go to{" "}
          <a
            href="mailto:meghawry.medo@gmail.com"
            className="rounded-sm text-foreground underline underline-offset-4 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            meghawry.medo@gmail.com
          </a>
          .
        </p>

        <p className="mt-12 text-sm leading-relaxed text-muted-foreground">
          <Link
            href="/about"
            className="rounded-sm text-foreground underline underline-offset-4 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            About Kashf Edit
          </Link>{" "}
          or{" "}
          <Link
            href="/products"
            className="rounded-sm text-foreground underline underline-offset-4 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            browse the catalogue
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
