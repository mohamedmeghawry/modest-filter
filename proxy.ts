import { NextRequest, NextResponse } from "next/server";
import { brandImagesAllowed, imgSrcSources } from "@/lib/products/brand-images";

// Content-Security-Policy with a per-request nonce (Phase 3 hardening,
// security-review.md). In Next.js 16 this file is "Proxy" — the former
// Middleware; the nonce pattern follows Next's own CSP guide.
//
// Policy decisions, made deliberately for this catalogue app:
//   - script-src is STRICT: 'nonce-<n>' + 'strict-dynamic', no 'unsafe-inline'.
//     This is where CSP earns its keep against XSS. Next auto-applies the nonce
//     to its framework/bundle scripts. ('unsafe-eval' is added in dev only,
//     because React uses eval for richer error overlays; not needed in prod.)
//   - style-src allows 'unsafe-inline' ON PURPOSE: the color-swatch UI sets
//     dynamic inline `style={{ backgroundColor }}` (colors are data, not classes),
//     which a strict style-src would silently block. Inline *style* injection
//     executes no script and is low-severity for a no-auth catalogue, so this is
//     an accepted trade for keeping script-src strict.
//   - img-src is 'self' blob: data: everywhere, plus the demo brands' image
//     CDNs on Vercel preview deployments ONLY (ADR-0013 amendment 2026-11-07:
//     hotlinked demo images, never on the public production domain). The same
//     gate decides whether pages render the images; see
//     lib/products/brand-images.ts.
export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const isDev = process.env.NODE_ENV === "development";
  const imgSrc = imgSrcSources(brandImagesAllowed(process.env.VERCEL_ENV));

  const csp = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""};
    style-src 'self' 'unsafe-inline';
    img-src ${imgSrc};
    font-src 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
  `
    .replace(/\s{2,}/g, " ")
    .trim();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  // Run on page routes only. Skip API routes, Next static/image assets, the
  // favicon, and link prefetches (which don't need the CSP header).
  matcher: [
    {
      source: "/((?!api|_next/static|_next/image|favicon.ico).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
