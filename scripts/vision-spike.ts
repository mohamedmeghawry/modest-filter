import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { extractAttributes } from "../lib/vision/extract";
import { estimateCost, type Usage } from "../lib/vision/cost";

// Only the fields this script consumes. Manifest may carry additional
// fields (sourceUrl, notes, groundTruth) that Phase D's eval harness uses;
// they're ignored here.
type ManifestEntry = {
  id: string;
  images: string[];
};

async function main() {
  const manifestArg = process.argv[2];
  if (!manifestArg) {
    console.error("Usage: npm run vision:spike -- <manifest.json>");
    process.exit(1);
  }

  const manifestPath = resolve(manifestArg);
  if (!existsSync(manifestPath)) {
    console.error(`Manifest not found: ${manifestPath}`);
    process.exit(1);
  }

  const manifestDir = dirname(manifestPath);
  const manifest = JSON.parse(
    readFileSync(manifestPath, "utf8"),
  ) as ManifestEntry[];

  if (!Array.isArray(manifest)) {
    console.error("Manifest must be a JSON array of product entries");
    process.exit(1);
  }

  const totals: Usage & { cost: number } = {
    inputTokens: 0,
    cacheCreationInputTokens: 0,
    cacheReadInputTokens: 0,
    outputTokens: 0,
    cost: 0,
  };

  for (const product of manifest) {
    console.log(`\n=== ${product.id} (${product.images.length} image(s)) ===`);

    const buffers: Buffer[] = [];
    let missing = false;
    for (const imagePath of product.images) {
      const absoluteImage = resolve(manifestDir, imagePath);
      if (!existsSync(absoluteImage)) {
        console.error(`  missing image: ${imagePath}`);
        missing = true;
        continue;
      }
      buffers.push(readFileSync(absoluteImage));
    }
    if (missing || buffers.length === 0) {
      console.error(`  skipping ${product.id} (missing images)`);
      continue;
    }

    const { attributes, usage } = await extractAttributes(buffers, {
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

  console.log(`\n=== TOTAL across ${manifest.length} product(s) ===`);
  console.log(
    `tokens: input=${totals.inputTokens} cache_write=${totals.cacheCreationInputTokens} cache_read=${totals.cacheReadInputTokens} output=${totals.outputTokens}`,
  );
  console.log(`cost≈$${totals.cost.toFixed(4)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
