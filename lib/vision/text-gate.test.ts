import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { textGate } from "./text-gate";
import { parseCsv } from "@/lib/products/demo-csv";

describe("textGate", () => {
  it("rejects stated short or missing sleeves", () => {
    expect(textGate("Short-Sleeve Crew-Neck Satin Maxi Dress").reasons).toEqual(["sleeves"]);
    expect(textGate("LACE AND BEAD CAMISOLE").reasons).toEqual(["sleeves"]);
    expect(textGate("Rayon Skipper Collar Blouse | 3/4 Sleeve").reasons).toEqual(["sleeves"]);
    expect(textGate("Strapless Midi Dress").reasons).toEqual(["sleeves"]);
  });

  it("rejects back, slit, neckline and cut-out words", () => {
    expect(textGate("Open-Back Maxi Dress").reasons).toEqual(["back"]);
    expect(textGate("Backless Satin Dress").reasons).toEqual(["back"]);
    expect(textGate("Dress with High Slit").reasons).toEqual(["slit"]);
    expect(textGate("Glittery Halterneck Dress").reasons).toEqual(["neckline"]);
    expect(textGate("One-Shoulder Top").reasons).toEqual(["neckline"]);
    expect(textGate("Long-Sleeve Fitted Maxi Dress with Cut-Out Details").reasons).toEqual(["cutouts"]);
  });

  it("passes long sleeves and silence (silence goes to vision)", () => {
    expect(textGate("Long-Sleeve Mock-Neck Blouse with Metallic Fibres").pass).toBe(true);
    expect(textGate("Shirt Dress").pass).toBe(true);
  });

  it("reads the description but ignores styling advice", () => {
    expect(textGate("Midi Dress", "A flowing dress with an open back.").reasons).toEqual(["back"]);
    expect(textGate("Midi Dress", "Wear it with a strapless bra.").pass).toBe(true);
  });

  it("does not match inside other words", () => {
    expect(textGate("Feedback Blouse").pass).toBe(true); // "back" inside a word
    expect(textGate("Splitting Image Top").pass).toBe(true);
  });

  it("rejects 6 of the 25 demo products for free, all of which vision also failed", () => {
    const rows = parseCsv(readFileSync("samples/demo/products.csv", "utf8"));
    const rejected = rows.filter((r) => !textGate(r.title).pass).map((r) => r.id).sort();
    expect(rejected).toEqual([
      "hm-1376060001", // halterneck
      "reitmans-499371", // cut-out
      "reitmans-500718", // short sleeve
      "reitmans-502097", // short sleeve
      "uniqlo-479073", // 3/4 sleeve
      "zara-07521149", // camisole
    ]);
  });
});
