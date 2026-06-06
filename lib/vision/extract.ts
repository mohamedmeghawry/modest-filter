import Anthropic from "@anthropic-ai/sdk";
import { TAG_PRODUCT_TOOL, type ProductAttributes } from "./schema";
import { SYSTEM_PROMPT, USER_PROMPT, descriptionBlock } from "./prompt";

export type ExtractOptions = {
  /** Product description folded in as authoritative context (ADR-0014). */
  description?: string;
};

export type ModelConfig = { vendor: "anthropic"; model: string };
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

  const response = await client.messages.create({
    model: modelConfig.model,
    max_tokens: 1024,
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    tools: [TAG_PRODUCT_TOOL],
    tool_choice: { type: "tool", name: "tag_product" },
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
  });

  const toolUseBlock = response.content.find(
    (block): block is Anthropic.ToolUseBlock =>
      block.type === "tool_use" && block.name === "tag_product",
  );

  if (!toolUseBlock) {
    throw new Error(
      `Expected tool_use block "tag_product"; got stop_reason=${response.stop_reason}, content types=[${response.content.map((b) => b.type).join(", ")}]`,
    );
  }

  // tool_choice forced this exact tool, strict: true constrains parameters,
  // all 14 fields are required, and we throw above on a missing block. The
  // tool's input is structurally guaranteed to match ProductAttributes; this
  // cast trusts the API contract for the spike. If we hit malformed inputs
  // in practice, add a runtime validator (pure logic → unit-tested per
  // AGENTS.md test-as-we-go).
  const attributes = toolUseBlock.input as ProductAttributes;

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
