import type { ExtractResult } from "./extract";

// Opus 4.7 pricing per the Anthropic claude-api skill (cached 2026-04-29).
// Refresh via `client.models.retrieve("claude-opus-4-7")` or
// https://platform.claude.com/docs/en/pricing before quoting in production.
export const PRICING = {
  inputPerMTok: 5.0,
  outputPerMTok: 25.0,
  cacheReadPerMTok: 0.5, // ~0.1× input
  cacheWritePerMTok: 6.25, // ~1.25× input (5-minute TTL)
};

export type Usage = ExtractResult["usage"];

/** Estimated USD cost of a single extraction, from token usage. */
export function estimateCost(usage: Usage): number {
  return (
    (usage.inputTokens * PRICING.inputPerMTok +
      usage.cacheCreationInputTokens * PRICING.cacheWritePerMTok +
      usage.cacheReadInputTokens * PRICING.cacheReadPerMTok +
      usage.outputTokens * PRICING.outputPerMTok) /
    1_000_000
  );
}
