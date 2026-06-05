import { describe, it, expect } from "vitest";
import { estimateCost, PRICING } from "./cost";

describe("estimateCost", () => {
  it("prices each token bucket at its per-MTok rate", () => {
    // 1M of each bucket → the sum of the four rates.
    const oneMillionEach = estimateCost({
      inputTokens: 1_000_000,
      cacheCreationInputTokens: 1_000_000,
      cacheReadInputTokens: 1_000_000,
      outputTokens: 1_000_000,
    });
    expect(oneMillionEach).toBeCloseTo(
      PRICING.inputPerMTok +
        PRICING.cacheWritePerMTok +
        PRICING.cacheReadPerMTok +
        PRICING.outputPerMTok,
      6,
    );
  });

  it("returns zero for zero usage", () => {
    expect(
      estimateCost({
        inputTokens: 0,
        cacheCreationInputTokens: 0,
        cacheReadInputTokens: 0,
        outputTokens: 0,
      }),
    ).toBe(0);
  });

  it("scales linearly with token counts", () => {
    const usage = {
      inputTokens: 2_400,
      cacheCreationInputTokens: 0,
      cacheReadInputTokens: 0,
      outputTokens: 300,
    };
    const expected =
      (2_400 * PRICING.inputPerMTok + 300 * PRICING.outputPerMTok) / 1_000_000;
    expect(estimateCost(usage)).toBeCloseTo(expected, 9);
  });
});
