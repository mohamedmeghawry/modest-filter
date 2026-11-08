"use client";

import { useState } from "react";

// A hotlinked brand image that falls back to the colour swatch if the brand's
// CDN refuses it (hotlink block, product removed) — never a broken-image icon.
// Callers pass `src` only when lib/products/brand-images allows it.
export function ProductImage({
  src,
  alt,
  swatch,
  className,
  eager = false,
}: {
  src: string;
  alt: string;
  swatch: string;
  className: string;
  eager?: boolean;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className={className}
        style={{ backgroundColor: swatch }}
        aria-hidden="true"
      />
    );
  }

  return (
    // Plain <img>, not next/image: the optimizer would fetch the brand's photo
    // and serve a copy from our domain, which ADR-0013's amendment rules out.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={`${className} object-cover`}
      style={{ backgroundColor: swatch }}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}
