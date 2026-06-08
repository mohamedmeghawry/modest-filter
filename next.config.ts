import type { NextConfig } from "next";

// Pre-launch security headers (Phase 3, security-review.md "No security headers").
// Applied to every route. Full Content-Security-Policy is deliberately deferred:
// a correct CSP for a Next.js app needs per-request nonces via middleware, and a
// too-strict policy silently breaks inline scripts and external product images.
// Tracked as a before-launch follow-up.
const securityHeaders = [
  // Force HTTPS for 2 years, including subdomains.
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  // Disallow framing entirely (clickjacking). App is never meant to be embedded.
  { key: "X-Frame-Options", value: "DENY" },
  // Don't let the browser MIME-sniff responses.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Send origin only on cross-origin navigations.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Turn off browser features the app doesn't use.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
