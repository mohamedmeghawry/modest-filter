// Demo-catalogue brand images (ADR-0013 amendment, 2026-11-07).
//
// Images are hotlinked from the brand's own CDN: the browser fetches them
// straight from the brand, and this site never serves or caches a copy (so no
// next/image, whose optimizer would copy them onto Vercel). They are allowed
// ONLY on preview deployments, which sit behind Vercel Authentication. The
// public production domain must never show them, so both the CSP and the
// render path check the same gate.

// Origins of the image links in samples/demo/products.csv.
export const BRAND_IMAGE_ORIGINS = [
  "https://image.uniqlo.com",
  "https://image.hm.com",
  "https://static.zara.net",
  "https://imagescdn.simons.ca",
  "https://www.reitmans.com",
] as const;

/** True only on a Vercel preview deployment (`VERCEL_ENV=preview`). */
export function brandImagesAllowed(vercelEnv: string | undefined): boolean {
  return vercelEnv === "preview";
}

/** The CSP `img-src` sources: same-origin always, brand CDNs only when allowed. */
export function imgSrcSources(allowBrandImages: boolean): string {
  return ["'self'", "blob:", "data:", ...(allowBrandImages ? BRAND_IMAGE_ORIGINS : [])].join(" ");
}

/**
 * The image URL to render, or null to show the colour-swatch placeholder.
 * Null when brand images are not allowed here, when there is no URL, or when
 * the URL is not an https link on an allowed brand CDN (the CSP would block it
 * and the visitor would see a broken image).
 */
export function displayableImageUrl(
  url: string | null | undefined,
  allowBrandImages: boolean,
): string | null {
  if (!allowBrandImages || !url) return null;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  const allowed: readonly string[] = BRAND_IMAGE_ORIGINS;
  return parsed.protocol === "https:" && allowed.includes(parsed.origin)
    ? url
    : null;
}
