import Anthropic from "@anthropic-ai/sdk";
import { TAG_PRODUCT_TOOL, type ProductAttributes } from "./schema";
import { SYSTEM_PROMPT, USER_PROMPT, descriptionBlock } from "./prompt";

export type ExtractOptions = {
  /** Product description folded in as authoritative context (ADR-0014). */
  description?: string;
};

export type Effort = "low" | "medium" | "high" | "xhigh" | "max";

/**
 * `effort` is sent explicitly: Opus 5.5 defaults to "medium" and always
 * thinks (thinking can't be disabled there), so effort is the cost lever.
 */
export type ModelConfig = { vendor: "anthropic"; model: string; effort?: Effort };

/**
 * A failure that will not fix itself on retry (refusal, truncated or invalid
 * output). `retryable: false` stops tagProductWithRetry paying for 2 more
 * identical attempts; the product goes to needs_review instead.
 */
export class TaggingError extends Error {
  readonly retryable = false;
}

/**
 * Turn a Messages API response into attributes. Structured outputs
 * (output_config.format) guarantee the JSON matches the schema when the
 * model finishes normally, so the checks here are about how it stopped.
 */
export function parseTaggingResponse(
  response: Pick<Anthropic.Message, "content" | "stop_reason">,
): ProductAttributes {
  if (response.stop_reason === "refusal") throw new TaggingError("Model declined to tag this product (refusal)");
  if (response.stop_reason === "max_tokens") throw new TaggingError("Output was cut off at max_tokens");
  const text = response.content.find((b): b is Anthropic.TextBlock => b.type === "text");
  if (!text) {
    throw new TaggingError(
      `No JSON in the response; stop_reason=${response.stop_reason}, content types=[${response.content.map((b) => b.type).join(", ")}]`,
    );
  }
  try {
    return JSON.parse(text.text) as ProductAttributes;
  } catch {
    throw new TaggingError(`Response is not valid JSON: ${text.text.slice(0, 120)}`);
  }
}
// Future shapes — additions to this discriminated union surface in the
// exhaustive guard inside extractAttributes() at compile time:
//   | { vendor: "google"; model: string }
//   | { vendor: "openai"; model: string }

export type ImageInput = Buffer | { type: "url"; url: string };

export type ExtractResult = {
  attributes: ProductAttributes;
  usage: {
    inputTokens: number;
    cacheCreationInputTokens: number;
    cacheReadInputTokens: number;
    outputTokens: number;
  };
};

type SupportedMediaType =
  | "image/jpeg"
  | "image/png"
  | "image/webp"
  | "image/gif";

function detectMediaType(buffer: Buffer): SupportedMediaType {
  if (buffer.length < 12) {
    throw new Error("Image buffer too small to detect media type");
  }
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return "image/png";
  }
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return "image/webp";
  }
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
    return "image/gif";
  }
  throw new Error(
    "Could not detect image media type (supported: jpeg, png, webp, gif)",
  );
}

function buildImageBlock(image: ImageInput): Anthropic.ImageBlockParam {
  if (Buffer.isBuffer(image)) {
    return {
      type: "image",
      source: {
        type: "base64",
        media_type: detectMediaType(image),
        data: image.toString("base64"),
      },
    };
  }
  return {
    type: "image",
    source: { type: "url", url: image.url },
  };
}

export async function extractAttributes(
  images: ImageInput | ImageInput[],
  modelConfig: ModelConfig,
  options: ExtractOptions = {},
): Promise<ExtractResult> {
  // Buffer is not Array.isArray, so this correctly disambiguates
  // single Buffer / single URL object from arrays of either.
  const imageArray = Array.isArray(images) ? images : [images];
  if (modelConfig.vendor !== "anthropic") {
    // Exhaustive guard: adding a new vendor to ModelConfig surfaces here at
    // compile time as `never` narrowing, so this branch can't silently swallow
    // future vendors.
    const _exhaustive: never = modelConfig.vendor;
    throw new Error(`Vendor not yet implemented: ${String(_exhaustive)}`);
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not set. See .env.local.example.");
  }

  const client = new Anthropic({ apiKey });
  const response = await client.messages.create(buildTaggingParams(imageArray, modelConfig, options));

  const attributes = parseTaggingResponse(response);

  return {
    attributes,
    usage: {
      inputTokens: response.usage.input_tokens,
      cacheCreationInputTokens: response.usage.cache_creation_input_tokens ?? 0,
      cacheReadInputTokens: response.usage.cache_read_input_tokens ?? 0,
      outputTokens: response.usage.output_tokens,
    },
  };
}

/**
 * The tagging request, shared by the direct call above and the Message
 * Batches API (scripts/tag-batch.ts), so both send exactly the same thing.
 *
 * Structured outputs instead of a forced tool call: Opus 5.5 rejects forced
 * tool_choice with a 400. Same schema, so the attribute contract is
 * unchanged. No `thinking` param: 5.5 thinks adaptively by default (and
 * 400s on "disabled"); 4.7 runs without thinking when it's omitted.
 * No refusal `fallbacks`: a silent switch to another model would corrupt
 * eval comparisons, and the Batches API rejects the parameter anyway.
 * A refusal becomes needs_review via TaggingError.
 */
export function buildTaggingParams(
  imageArray: ImageInput[],
  modelConfig: ModelConfig,
  options: ExtractOptions = {},
): Anthropic.MessageCreateParamsNonStreaming {
  return {
    model: modelConfig.model,
    max_tokens: 16000,
    output_config: {
      format: { type: "json_schema", schema: TAG_PRODUCT_TOOL.input_schema },
      ...(modelConfig.effort ? { effort: modelConfig.effort } : {}),
    },
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [
      {
        role: "user",
        content: [
          ...imageArray.map(buildImageBlock),
          { type: "text", text: USER_PROMPT },
          ...(options.description?.trim()
            ? [
                {
                  type: "text" as const,
                  text: descriptionBlock(options.description.trim()),
                },
              ]
            : []),
        ],
      },
    ],
  };
}
