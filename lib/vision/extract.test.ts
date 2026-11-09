import { describe, it, expect } from "vitest";
import type Anthropic from "@anthropic-ai/sdk";
import { parseTaggingResponse, TaggingError } from "./extract";

const ATTRS = {
  sleeveLength: "long", sleeveOpacity: "opaque", neckline: "crew", backStyle: "closed",
  hemLength: "midi", topLength: null, slit: "none", fit: "loose", opacity: "opaque",
  lined: null, cutouts: "none", material: null, primaryColor: "black", pattern: "solid",
};

type Res = Pick<Anthropic.Message, "content" | "stop_reason">;
const text = (t: string) => ({ type: "text", text: t, citations: null }) as Anthropic.TextBlock;
const thinking = { type: "thinking", thinking: "", signature: "sig" } as Anthropic.ThinkingBlock;

describe("parseTaggingResponse", () => {
  it("reads the JSON text block, skipping thinking blocks (Opus 5.5 always thinks)", () => {
    const res: Res = { stop_reason: "end_turn", content: [thinking, text(JSON.stringify(ATTRS))] };
    expect(parseTaggingResponse(res)).toEqual(ATTRS);
  });

  it("throws a non-retryable TaggingError on a refusal", () => {
    const res: Res = { stop_reason: "refusal", content: [] };
    expect(() => parseTaggingResponse(res)).toThrow(TaggingError);
    expect(() => parseTaggingResponse(res)).toThrow(/refusal/);
  });

  it("throws on output cut off at max_tokens instead of parsing half a JSON", () => {
    const res: Res = { stop_reason: "max_tokens", content: [text('{"sleeveLength": "lo')] };
    expect(() => parseTaggingResponse(res)).toThrow(/max_tokens/);
  });

  it("throws when there is no text block or the text is not JSON", () => {
    expect(() => parseTaggingResponse({ stop_reason: "end_turn", content: [thinking] })).toThrow(/No JSON/);
    expect(() => parseTaggingResponse({ stop_reason: "end_turn", content: [text("Sure! Here it is")] })).toThrow(/not valid JSON/);
  });

  it("marks every failure as not retryable", () => {
    try {
      parseTaggingResponse({ stop_reason: "refusal", content: [] });
    } catch (e) {
      expect((e as TaggingError).retryable).toBe(false);
    }
  });
});
