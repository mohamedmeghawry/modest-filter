import { describe, it, expect, vi } from "vitest";
import { tagProductWithRetry, isRetryable, type TagOptions } from "./tag-product";
import type { ExtractResult } from "./extract";

const MODEL = { vendor: "anthropic", model: "claude-opus-4-7" } as const;
const IMAGE = { type: "url", url: "https://example.com/dress.png" } as const;

// Minimal valid ExtractResult; the worker only forwards it, never inspects it.
const OK: ExtractResult = {
  attributes: {
    sleeveLength: "short",
    sleeveOpacity: "opaque",
    neckline: "scoop",
    backStyle: "closed",
    hemLength: "midi",
    topLength: null,
    slit: "none",
    fit: "loose",
    opacity: "opaque",
    lined: "unlined",
    cutouts: "none",
    material: "linen",
    primaryColor: "beige",
    pattern: "solid",
  },
  usage: {
    inputTokens: 100,
    cacheCreationInputTokens: 0,
    cacheReadInputTokens: 0,
    outputTokens: 50,
  },
};

/** An error that looks like an Anthropic APIError with an HTTP status. */
function apiError(status: number): Error & { status: number } {
  return Object.assign(new Error(`HTTP ${status}`), { status });
}

/** A no-op sleep so tests don't actually wait on backoff. */
function harness(extract: TagOptions["extract"]) {
  const sleep = vi.fn(async () => {});
  return { sleep, opts: { extract, sleep } satisfies TagOptions };
}

describe("isRetryable", () => {
  it("retries rate limits, server errors, and network errors", () => {
    expect(isRetryable(apiError(429))).toBe(true);
    expect(isRetryable(apiError(500))).toBe(true);
    expect(isRetryable(apiError(529))).toBe(true); // Anthropic "overloaded"
    expect(isRetryable(new Error("ECONNRESET"))).toBe(true); // no status
  });

  it("fails fast on deterministic client errors", () => {
    expect(isRetryable(apiError(400))).toBe(false);
    expect(isRetryable(apiError(401))).toBe(false);
    expect(isRetryable(apiError(404))).toBe(false);
  });
});

describe("tagProductWithRetry", () => {
  it("returns tagged on first-attempt success", async () => {
    const extract = vi.fn().mockResolvedValue(OK);
    const { sleep, opts } = harness(extract);

    const outcome = await tagProductWithRetry(IMAGE, MODEL, opts);

    expect(outcome).toMatchObject({ status: "tagged", attempts: 1 });
    expect(extract).toHaveBeenCalledOnce();
    expect(sleep).not.toHaveBeenCalled();
  });

  it("recovers after a transient error and reports attempt count", async () => {
    const extract = vi
      .fn()
      .mockRejectedValueOnce(apiError(529))
      .mockResolvedValue(OK);
    const { sleep, opts } = harness(extract);

    const outcome = await tagProductWithRetry(IMAGE, MODEL, {
      ...opts,
      baseDelayMs: 1_000,
    });

    expect(outcome.status).toBe("tagged");
    expect(outcome.attempts).toBe(2);
    expect(sleep).toHaveBeenCalledExactlyOnceWith(1_000);
  });

  it("uses exponential backoff between attempts", async () => {
    const extract = vi
      .fn()
      .mockRejectedValueOnce(apiError(500))
      .mockRejectedValueOnce(apiError(500))
      .mockResolvedValue(OK);
    const { sleep, opts } = harness(extract);

    const outcome = await tagProductWithRetry(IMAGE, MODEL, {
      ...opts,
      maxAttempts: 3,
      baseDelayMs: 1_000,
    });

    expect(outcome.status).toBe("tagged");
    expect(sleep.mock.calls.map((c) => c[0])).toEqual([1_000, 2_000]);
  });

  it("fails after exhausting all attempts on persistent transient errors", async () => {
    const extract = vi.fn().mockRejectedValue(apiError(503));
    const { sleep, opts } = harness(extract);

    const outcome = await tagProductWithRetry(IMAGE, MODEL, {
      ...opts,
      maxAttempts: 3,
    });

    expect(outcome).toMatchObject({ status: "failed", attempts: 3 });
    expect(extract).toHaveBeenCalledTimes(3);
    expect(sleep).toHaveBeenCalledTimes(2); // no sleep after the final attempt
  });

  it("fails immediately on a non-retryable error without sleeping", async () => {
    const extract = vi.fn().mockRejectedValue(apiError(400));
    const { sleep, opts } = harness(extract);

    const outcome = await tagProductWithRetry(IMAGE, MODEL, opts);

    expect(outcome).toMatchObject({ status: "failed", attempts: 1 });
    if (outcome.status === "failed") {
      expect(outcome.error).toContain("400");
    }
    expect(extract).toHaveBeenCalledOnce();
    expect(sleep).not.toHaveBeenCalled();
  });
});
