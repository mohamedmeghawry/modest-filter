# Brand terms check: can we collect product samples? (2026-11-07)

A point-in-time read of the Canadian Terms of Use for the top 5 ranked brands. Each brand had one research agent; any verdict other than "prohibited" got a second agent that tried to refute it. The raw run is the workflow `wf_e9263a29-99a` in the session transcripts.

| Brand | Automated access (bots, agents) | Saving/copying content (photos, text) | Official data source | Verdict |
|---|---|---|---|---|
| Aritzia | **Banned by name**: "robots, spiders, or other automatic devices, programs or methodologies" (s.15) | Banned "for any purpose whatsoever" without written consent, including "indexed, catalogued" (s.4) | None; influencer program only (unverified) | **Out.** It also bans deep links without permission (s.15), which breaks our click-through model. |
| H&M | Banned: "agent or other device or mechanism ... to copy content" (read on 2026-09-29; the 2026-11-07 fetch was blocked by a 403) | Storing content for non-personal use is banned (2026-09-29 read) | Sovrn Commerce program (unverified) | Prohibited |
| Zara | Not named | "may not download or save a copy of any of the Materials ... for any purpose" | Ambassador program (unverified) | Prohibited |
| Simons | Not named (refute pass confirmed) | Copying or reproducing needs express consent; personal use only | Impact / FlexOffers (unverified) | Copying needs consent |
| Uniqlo | Could not read (the page timed out or returned 403) | Could not read | Rakuten / FlexOffers (unverified) | Unknown |

**What this means:** Saving product photos or page copies is barred for every brand whose terms we could read, whether a person or an agent does the saving. The question was never really human vs bot.

**What stays open:** recording objective facts (name, price, colour, material) with a link out, and tagging from the brand's own image URL without storing the file (ADR-0013 extraction-only). Neither stores the brand's content. This is not legal advice; it is the reading that decides how the demo gets built.

**Side finding:** a past session used Playwright on Aritzia (devlog). The eval-set photos are local only (gitignored, not in the public repo).
