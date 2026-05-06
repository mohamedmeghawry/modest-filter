# ADR 0005: Use Claude Vision API for Product Tagging

- Status: Accepted
- Date: 2026-04-29
- Decision makers: Mohamed Meghawry

## Context

The product's core differentiator is the AI-extracted attribute set on each item: sleeve length, neckline shape, hem length, fit, and opacity. These attributes are extracted from product images sourced from affiliate feeds. The chosen vision model must support structured output, achieve high accuracy on objective attribute extraction, and be cost-effective at v1 catalogue size (estimated 1,000–3,000 products).

## Decision

Use the Anthropic Claude Vision API for all product image tagging. Tagging happens server-side, asynchronously, when a product is ingested from an affiliate feed. Tags are stored in the database alongside the product and are not re-computed unless the source image changes.

## Consequences

### Positive

- Single Anthropic account already used for development; no new vendor onboarding.
- Strong performance on structured output via tool-calling or JSON mode.
- Consistent with the conversational AI used during the project's planning phase, simplifying mental model.
- Cost is negligible at v1 scale: at roughly $0.01–0.02 per image, full catalogue tagging stays well under $50 one-time, with under $20/month ongoing for catalogue refresh.

### Negative

- Vendor lock-in to Anthropic. Mitigated by abstracting the tagging logic behind a `lib/tagging/` interface so the underlying provider can be swapped.
- API rate limits apply; ingestion pipeline must handle retries and backoff.
- Accuracy on lifestyle shots (model in complex pose, partial occlusion) is lower than on clean product shots. A human-in-the-loop tag-review workflow is planned for post-v1.

## Alternatives considered

- **OpenAI GPT-4 Vision:** Comparable quality and pricing. Rejected only because adding a second AI provider adds cognitive overhead with no clear benefit for v1.
- **Google Cloud Vision:** Strong on object detection but weaker on the structured, fashion-specific attribute extraction this project requires. Rejected.
- **Self-hosted open-source vision models (LLaVA, CLIP-based classifiers):** Possible, but operational burden is high and accuracy on fashion-specific attributes requires fine-tuning. Rejected for v1; reconsider if costs grow.
- **Manual tagging by the founder's wife:** Considered as a fallback. Acceptable for the first 50 items as a sanity check on AI accuracy, but not scalable to v1 catalogue size.

## Implementation notes

- Tagging logic lives in `lib/tagging/`, exposing a single `tagProduct(imageUrl)` function. The implementation can be swapped without changing callers.
- API key lives in environment variables; never reaches the browser.
- Failed tag attempts are logged and retried up to 3 times with exponential backoff. Permanent failures flag the product for manual review.
- A small evaluation set of 20 products is hand-tagged by the founder's wife and used to validate AI accuracy before committing to the full pipeline.
