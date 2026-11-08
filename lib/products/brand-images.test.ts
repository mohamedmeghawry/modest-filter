import { describe, it, expect } from "vitest";
import {
  brandImagesAllowed,
  imgSrcSources,
  displayableImageUrl,
} from "./brand-images";

const ZARA =
  "https://static.zara.net/assets/public/64ea/1aec/59b146d4931c/62414904e29f/08605934800-p/08605934800-p.jpg";

describe("brandImagesAllowed", () => {
  it("is true only on a Vercel preview deployment", () => {
    expect(brandImagesAllowed("preview")).toBe(true);
    expect(brandImagesAllowed("production")).toBe(false);
    expect(brandImagesAllowed("development")).toBe(false);
    // Local `next dev`/`next start` has no VERCEL_ENV at all.
    expect(brandImagesAllowed(undefined)).toBe(false);
  });
});

describe("imgSrcSources", () => {
  it("is same-origin only when brand images are not allowed (production)", () => {
    expect(imgSrcSources(false)).toBe("'self' blob: data:");
  });

  it("adds exactly the five brand CDNs on preview", () => {
    expect(imgSrcSources(true)).toBe(
      "'self' blob: data: https://image.uniqlo.com https://image.hm.com https://static.zara.net https://imagescdn.simons.ca https://www.reitmans.com",
    );
  });
});

describe("displayableImageUrl", () => {
  it("returns an allowed brand URL on preview", () => {
    expect(displayableImageUrl(ZARA, true)).toBe(ZARA);
  });

  it("returns null everywhere brand images are not allowed", () => {
    expect(displayableImageUrl(ZARA, false)).toBeNull();
  });

  it("returns null for empty, malformed, non-https or unlisted URLs", () => {
    expect(displayableImageUrl("", true)).toBeNull(); // seed rows have ""
    expect(displayableImageUrl(null, true)).toBeNull();
    expect(displayableImageUrl("not a url", true)).toBeNull();
    expect(displayableImageUrl(ZARA.replace("https:", "http:"), true)).toBeNull();
    expect(
      displayableImageUrl("https://images.example.com/dress.jpg", true),
    ).toBeNull();
    // A look-alike host must not pass as the brand's origin.
    expect(
      displayableImageUrl("https://static.zara.net.evil.example/x.jpg", true),
    ).toBeNull();
  });
});
