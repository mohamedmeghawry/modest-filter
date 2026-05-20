import { readFileSync, existsSync } from "node:fs";
import { resolve, basename } from "node:path";
import { extractAttributes } from "../lib/vision/extract";

// Opus 4.7 pricing per the Anthropic claude-api skill (cached 2026-04-29).
// Refresh via `client.models.retrieve("claude-opus-4-7")` or
// https://platform.claude.com/docs/en/pricing before quoting in production.
const PRICING = {
  inputPerMTok: 5.0,
  outputPerMTok: 25.0,
  cacheReadPerMTok: 0.5, // ~0.1× input
  cacheWritePerMTok: 6.25, // ~1.25× input (5-minute TTL)
};

type Usage = {
  inputTokens: number;
  cacheCreationInputTokens: number;
  cacheReadInputTokens: number;
  outputTokens: number;
};

function estimateCost(usage: Usage): number {
  return (
    (usage.inputTokens * PRICING.inputPerMTok +
      usage.cacheCreationInputTokens * PRICING.cacheWritePerMTok +
      usage.cacheReadInputTokens * PRICING.cacheReadPerMTok +
      usage.outputTokens * PRICING.outputPerMTok) /
    1_000_000
  );
}

async function main() {
  const paths = process.argv.slice(2);
  if (paths.length === 0) {
    console.error(
      "Usage: npm run vision:spike -- <image-path> [<image-path> ...]",
    );
    process.exit(1);
  }

  const totals: Usage & { cost: number } = {
    inputTokens: 0,
    cacheCreationInputTokens: 0,
    cacheReadInputTokens: 0,
    outputTokens: 0,
    cost: 0,
  };

  for (const path of paths) {
    const absolute = resolve(path);
    if (!existsSync(absolute)) {
      console.error(`Skipping (not found): ${path}`);
      continue;
    }
    const buffer = readFileSync(absolute);
    console.log(`\n=== ${basename(path)} ===`);

    const { attributes, usage } = await extractAttributes(buffer, {
      vendor: "anthropic",
      model: "claude-opus-4-7",
    });

    console.log(JSON.stringify(attributes, null, 2));
    const cost = estimateCost(usage);
    console.log(
      `tokens: input=${usage.inputTokens} cache_write=${usage.cacheCreationInputTokens} cache_read=${usage.cacheReadInputTokens} output=${usage.outputTokens}  cost≈$${cost.toFixed(4)}`,
    );

    totals.inputTokens += usage.inputTokens;
    totals.cacheCreationInputTokens += usage.cacheCreationInputTokens;
    totals.cacheReadInputTokens += usage.cacheReadInputTokens;
    totals.outputTokens += usage.outputTokens;
    totals.cost += cost;
  }

  console.log(`\n=== TOTAL across ${paths.length} image(s) ===`);
  console.log(
    `tokens: input=${totals.inputTokens} cache_write=${totals.cacheCreationInputTokens} cache_read=${totals.cacheReadInputTokens} output=${totals.outputTokens}`,
  );
  console.log(`cost≈$${totals.cost.toFixed(4)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
