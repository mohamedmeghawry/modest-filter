import {
  extractAttributes,
  type ImageInput,
  type ModelConfig,
  type ExtractResult,
  type ExtractOptions,
} from "./extract";

/**
 * Outcome of tagging one product. Discriminated on `status` so callers can
 * never read `attributes`/`usage` off a failed run — the persistence layer
 * (tagStatus state machine) keys off this shape.
 */
export type TagOutcome =
  | {
      status: "tagged";
      attributes: ExtractResult["attributes"];
      usage: ExtractResult["usage"];
      attempts: number;
    }
  | {
      status: "failed";
      error: string;
      attempts: number;
      // Whether the underlying error was transient (retryable next run) vs a
      // deterministic error that needs a human. Persisted by the tagStatus state
      // machine: retryable → "failed" (auto-retried), else → "needs_review".
      // Required (not optional) so no construction site can silently omit it.
      retryable: boolean;
    };

type ExtractFn = (
  images: ImageInput | ImageInput[],
  modelConfig: ModelConfig,
  options?: ExtractOptions,
) => Promise<ExtractResult>;

export type TagOptions = {
  /** Total attempts before giving up. Architecture default is 3 (AGENTS.md). */
  maxAttempts?: number;
  /** First backoff delay; doubles each retry (baseDelayMs, 2×, 4×, …). */
  baseDelayMs?: number;
  /** Product description folded in as context (ADR-0014). */
  description?: string;
  /** Injectable for tests; defaults to a real timer. */
  sleep?: (ms: number) => Promise<void>;
  /** Injectable for tests; defaults to the live Anthropic extractor. */
  extract?: ExtractFn;
};

const defaultSleep = (ms: number) =>
  new Promise<void>((r) => setTimeout(r, ms));

/**
 * Transient errors are worth retrying: rate limits (429), server/overloaded
 * errors (5xx incl. Anthropic's 529), and network failures (no HTTP status).
 * Client errors (4xx other than 429) are deterministic — a bad image or
 * malformed request won't fix itself, so we fail fast.
 */
export function isRetryable(error: unknown): boolean {
  const status = (error as { status?: unknown })?.status;
  if (typeof status !== "number") return true; // network / unknown → retry
  if (status === 429) return true;
  return status >= 500;
}

/**
 * Tag a single product's image(s), retrying transient failures with
 * exponential backoff. Never throws — every path resolves to a TagOutcome.
 */
export async function tagProductWithRetry(
  images: ImageInput | ImageInput[],
  modelConfig: ModelConfig,
  options: TagOptions = {},
): Promise<TagOutcome> {
  const {
    maxAttempts = 3,
    baseDelayMs = 1_000,
    description,
    sleep = defaultSleep,
    extract = extractAttributes,
  } = options;

  let lastError = "unknown error";

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const { attributes, usage } = await extract(images, modelConfig, { description });
      return { status: "tagged", attributes, usage, attempts: attempt };
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      const canRetry = isRetryable(error) && attempt < maxAttempts;
      if (!canRetry) {
        // Derive retryability from the ERROR, not from `canRetry`: `canRetry` is
        // also false when a transient error simply exhausted its attempts, and
        // those must still be marked retryable (auto-retried next run).
        return {
          status: "failed",
          error: lastError,
          attempts: attempt,
          retryable: isRetryable(error),
        };
      }
      // attempt 1 → wait base, attempt 2 → wait 2×base, …
      await sleep(baseDelayMs * 2 ** (attempt - 1));
    }
  }

  // Unreachable (loop returns on the final attempt), but keeps types honest.
  return {
    status: "failed",
    error: lastError,
    attempts: maxAttempts,
    retryable: true,
  };
}
