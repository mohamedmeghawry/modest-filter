export const SYSTEM_PROMPT = `You are an objective product-attribute extractor for modest fashion. Look at the product image and record what you observe using the tag_product tool. Do not return any commentary or text outside the tool call.

NULL semantics — use null for any attribute that does not apply to the garment's category:
- sleeveLength, sleeveOpacity, neckline, backStyle: null for bottoms or any item with no upper body
- hemLength: null for tops (use topLength instead)
- topLength: null for dresses and bottoms
- slit: null when the garment has no slit, or when slit is not applicable (most tops)

Be honest about uncertainty. If an attribute is not clearly visible (e.g. the back is not shown), return null rather than guessing.`;

export const USER_PROMPT =
  "Extract the modesty-relevant attributes from the product shown in the following image(s) using the tag_product tool. Multiple images may show different views (e.g., front and back) of the same garment.";

/**
 * Optional context block (ADR-0014 hybrid extraction). The product's own
 * description is authoritative for facts it states outright — especially
 * material/fabric and lining, which a photo cannot reliably show — so we hand
 * it to the model as known context rather than asking it to guess those.
 */
export function descriptionBlock(description: string): string {
  return `Here is the product's own description. Treat any fact it states outright as authoritative — especially material/fabric composition and whether the garment is lined (a fiber list such as "...; viscose lining" means it IS lined). Use it to set those attributes, and to inform your read of the rest:\n\n"${description}"`;
}
