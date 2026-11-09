import type { ProductAttributes } from "./schema";

/**
 * Mohamed's tagging rules (2026-11-08), applied to vision output before it is
 * stored. One function so the direct tagger (tag-demo) and the batch tagger
 * (tag-batch) can't drift apart.
 *
 * - material: the product text wins when it states one (ADR-0014); otherwise vision.
 * - lined: product text only. A photo can't show lining, so silence = unknown.
 * - backStyle: unknown when no photo shows the back, whatever vision guessed.
 */
export type TextFacts = {
  material: ProductAttributes["material"];
  lined: ProductAttributes["lined"];
};

export function applyTaggingRules(
  vision: ProductAttributes,
  text: TextFacts,
  opts: { hasBackPhoto: boolean },
): ProductAttributes {
  return {
    ...vision,
    material: text.material ?? vision.material,
    lined: text.lined ?? null,
    backStyle: opts.hasBackPhoto ? vision.backStyle : null,
  };
}
