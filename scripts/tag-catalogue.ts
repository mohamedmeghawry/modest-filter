import prisma from "../lib/prisma";
import { tagProductWithRetry } from "../lib/vision/tag-product";
import { estimateCost } from "../lib/vision/cost";
import type { TagStatus } from "../lib/generated/prisma/enums";

// Validated default (ADR-0012). Override with --model; the Opus 4.8 cost/
// accuracy A/B belongs in the Session N+2 eval harness, not here.
const DEFAULT_MODEL = "claude-opus-4-7";

type Args = {
  id?: string;
  model: string;
  dryRun: boolean;
  includeReview: boolean;
};

function parseArgs(argv: string[]): Args {
  const args: Args = {
    model: DEFAULT_MODEL,
    dryRun: false,
    includeReview: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--dry-run") args.dryRun = true;
    else if (arg === "--include-review") args.includeReview = true;
    else if (arg === "--id") args.id = argv[++i];
    else if (arg === "--model") args.model = argv[++i];
    else {
      console.error(`Unknown argument: ${arg}`);
      process.exit(1);
    }
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  // Which products need tagging: pending (never tried) + failed (transient
  // last time). needs_review is excluded unless explicitly re-run, since it
  // means a human should look first.
  const statuses: TagStatus[] = args.includeReview
    ? ["pending", "failed", "needs_review"]
    : ["pending", "failed"];

  const products = await prisma.product.findMany({
    where: args.id ? { id: args.id } : { tagStatus: { in: statuses } },
    select: { id: true, name: true, imageUrl: true, tagStatus: true },
    orderBy: { createdAt: "asc" },
  });

  if (products.length === 0) {
    console.log("No products to tag. (Catalogue arrives with affiliate data.)");
    return;
  }

  console.log(
    `Tagging ${products.length} product(s) with ${args.model}` +
      (args.dryRun ? " [DRY RUN — no writes]" : ""),
  );

  let tagged = 0;
  let flagged = 0;
  let totalCost = 0;

  for (const product of products) {
    process.stdout.write(`\n• ${product.name} (${product.id}) … `);

    const outcome = await tagProductWithRetry(
      { type: "url", url: product.imageUrl },
      { vendor: "anthropic", model: args.model },
    );

    if (outcome.status === "tagged") {
      const cost = estimateCost(outcome.usage);
      totalCost += cost;
      tagged++;
      console.log(
        `tagged in ${outcome.attempts} attempt(s), cost≈$${cost.toFixed(4)}`,
      );
      if (!args.dryRun) {
        await prisma.product.update({
          where: { id: product.id },
          data: {
            ...outcome.attributes,
            // No model-provided confidence signal yet; leave tagConfidence null.
            tagStatus: "tagged",
            taggedAt: new Date(),
          },
        });
      }
    } else {
      flagged++;
      // Transient failures that merely exhausted their retries are re-runnable
      // next pass (the query above already re-picks "failed"); deterministic
      // failures need a human first, so route them to "needs_review".
      const nextStatus = outcome.retryable ? "failed" : "needs_review";
      console.log(
        `FAILED after ${outcome.attempts} attempt(s): ${outcome.error} → ${nextStatus}`,
      );
      if (!args.dryRun) {
        await prisma.product.update({
          where: { id: product.id },
          data: { tagStatus: nextStatus },
        });
      }
    }
  }

  console.log(
    `\n=== Done: ${tagged} tagged, ${flagged} flagged for review, cost≈$${totalCost.toFixed(4)} ===`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
