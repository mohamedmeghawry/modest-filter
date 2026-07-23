"use client";

import { useState } from "react";

// The modesty-relevant attributes Kashf Edit extracts are *ordinal*: each scale
// runs from least to most coverage. That property is the whole reason a single
// threshold — "a line" — is a meaningful filter, so the landing page makes the
// idea tangible instead of describing it.
const SLEEVE_LENGTHS = [
  "sleeveless",
  "cap",
  "short",
  "elbow",
  "three-quarter",
  "long",
] as const;

export function ThresholdDemo() {
  // Defaults to "three-quarter": a real, common line, not the extreme.
  const [lineIndex, setLineIndex] = useState(4);
  const chosen = SLEEVE_LENGTHS[lineIndex];

  return (
    <div className="rounded-lg border border-border p-6 sm:p-8">
      <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
        Sleeve length
      </p>

      <div
        role="group"
        aria-label="Set your sleeve length threshold"
        className="mt-5 flex flex-wrap gap-2"
      >
        {SLEEVE_LENGTHS.map((value, index) => {
          const isLine = index === lineIndex;
          const isIncluded = index >= lineIndex;

          return (
            <button
              key={value}
              type="button"
              onClick={() => setLineIndex(index)}
              aria-pressed={isLine}
              className={[
                "min-h-8 rounded-full border px-3 py-1.5 font-mono text-xs outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50 sm:text-sm",
                isLine
                  ? "border-foreground font-medium text-foreground"
                  : isIncluded
                    ? "border-border text-foreground hover:border-foreground/40"
                    : "border-transparent text-muted-foreground/60 hover:border-border hover:text-muted-foreground",
              ].join(" ")}
            >
              {value}
            </button>
          );
        })}
      </div>

      <p className="mt-5 text-sm leading-relaxed">
        Your line sits at <span className="font-mono font-medium">{chosen}</span>
        {lineIndex === 0
          ? " — the lowest setting, so nothing is filtered out."
          : ". Anything shorter is filtered out."}
      </p>

      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Move it. Someone else draws their line somewhere else — same catalogue,
        different results. That’s the whole idea.
      </p>
    </div>
  );
}
