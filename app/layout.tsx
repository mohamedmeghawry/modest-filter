import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://kashfedit.com"),
  title: {
    default: "Kashf Edit — modest clothing from mainstream brands",
    template: "%s · Kashf Edit",
  },
  description:
    "Mainstream brands don’t let you filter for sleeve length, hem length, or opacity. Kashf Edit reads those facts for every piece, so you can set your own standard.",
};

// impact.com website-ownership verification (affiliate playbook section 4).
// Impact's snippet uses a `value` attribute, which React's <meta> typings
// don't know, so it is spread in; `content` is included too in case the
// checker reads that instead.
const IMPACT_SITE_VERIFICATION = "4400bac6-7394-4980-b345-8fb2c1967ce4";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <meta
          name="impact-site-verification"
          content={IMPACT_SITE_VERIFICATION}
          {...{ value: IMPACT_SITE_VERIFICATION }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
