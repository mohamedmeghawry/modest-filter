import type { ExtractResult } from "./extract";

type Rates = { inputPerMTok: number; outputPerMTok: number; cacheReadPerMTok: number; cacheWritePerMTok: number };

// Per-model prices from the Anthropic claude-api skill (model table cached
// 2026-10-06). Cache writes are 1.25× input (5-minute TTL). Refresh from
// https://platform.claude.com/docs/en/pricing before quoting in production.
export const PRICING_BY_MODEL: Record<string, Rates> = {
  "claude-opus-4-7": { inputPerMTok: 5.0, outputPerMTok: 25.0, cacheReadPerMTok: 0.5, cacheWritePerMTok: 6.25 },
  "claude-opus-5-5": { inputPerMTok: 4.0, outputPerMTok: 20.0, cacheReadPerMTok: 0.2, cacheWritePerMTok: 5.0 },
};

/** Opus 4.7 rates, kept for callers that predate per-model pricing. */
export const PRICING = PRICING_BY_MODEL["claude-opus-4-7"];

/** The Message Batches API bills every token bucket at half price. */
export const BATCH_DISCOUNT = 0.5;

export type Usage = ExtractResult["usage"];

/**
 * Estimated USD cost of one extraction. Throws on an unpriced model rather
 * than returning 0, so a missing price can't look like a free run.
 */
export function estimateCost(usage: Usage, model = "claude-opus-4-7", opts: { batch?: boolean } = {}): number {
  const rates = PRICING_BY_MODEL[model];
  if (!rates) throw new Error(`No price for model "${model}"; add it to PRICING_BY_MODEL`);
  const full =
    (usage.inputTokens * rates.inputPerMTok +
      usage.cacheCreationInputTokens * rates.cacheWritePerMTok +
      usage.cacheReadInputTokens * rates.cacheReadPerMTok +
      usage.outputTokens * rates.outputPerMTok) /
    1_000_000;
  return opts.batch ? full * BATCH_DISCOUNT : full;
}
