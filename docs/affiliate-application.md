# Affiliate application playbook

**Status:** not yet submitted (as of 2026-09-15). **Owner:** Mohamed. **Why this doc exists:** the v1 goal has been gated on affiliate-feed access since May; the application has never been started. This is the checklist, the answers, and the tracker so it can be done in one evening and picked up by any future session.

Related: ADR-0013 (image sourcing, affiliate feeds as Tier 1), `docs/audit-2026-09-01.md` §B and §C, wargame 08 Move A3 (`projects\wargames\wargames\08-mf-future.md`, outside the repo).

---

## 1. How approval actually works

Two gates, not one.

- **Gate 1: the network** lets you in as a publisher. This is where the site is reviewed. Clearing it is what the demo site has to do.
- **Gate 2: each brand's program** inside the network approves you separately. Rejections here are routine for a new publisher ("temporary rejection until you build activity" is Rakuten's own wording) and are not a verdict on the site.

Feeds and links can come from different networks. FlexOffers is the feed workhorse (daily product feeds via API/FTP). Sovrn is links-only with no traffic minimum. Rakuten and CJ grant feed access per advertiser, not at signup.

## 2. Reviewer checklist against the live site

| Reviewer check | Status | Action |
|---|---|---|
| Live site with real, indexed content | ✅ since 2026-07-22 | none |
| Working privacy policy | ✅ `/privacy` | none |
| Affiliate disclosure | ✅ footer, `/about`, `/privacy` | none |
| No fabricated brand claims | ✅ 2026-09-15 (`48de681`) | none |
| `rel="sponsored"` on outbound links | ✅ 2026-09-15 | none |
| Cookie consent | n/a: the site sets no cookies and `/privacy` says so | none |
| Prose reads as human-written | ✅ 2026-09-15 (`07c369b`) | none |
| Contact email on own domain | ⬜ personal Gmail on `/privacy` | Cloudflare Email Routing → `hello@kashfedit.com`, then update `/privacy` |
| Clear description of promotion method | ⬜ | §5 below |
| Traffic / social presence | ⬜ none | be honest; describe the plan (§5) |
| Tax ID and payout details ready | ⬜ | business number, bank details; Awin asks for tax ID at onboarding (DAC7) |
| Awin recovery code stored safely | ⬜ plaintext in `affiliates-info.txt` (gitignored) | move to Bitwarden, delete the file |

## 3. Brand list (ranked 2026-09-15)

Mohamed's call: "the 8 most mainstream brands women shop at in Canada." Ranked by reach in Canada: Aritzia leads elevated womenswear, Reitmans holds about 21 % of dedicated women's clothing stores (IBISWorld), and the rest are mass-market chains with a store in every major mall. Activewear (Lululemon) is excluded because v1 covers dresses, abayas, and tops. Rows marked "aggregator" come from third-party directories and must be confirmed inside each network after signup; "recon" rows are from wargame 08 (2026-07-06).

| # | Brand | Program? | Where | Classification | Source |
|---|---|---|---|---|---|
| 1 | Aritzia | **no** (influencer program only) | none | link-only, $0 | ⚠️ recon |
| 2 | H&M | yes (~7 %, 30-day cookie) | Sovrn Commerce (no traffic minimum) | monetizable | ⚠️ recon |
| 3 | Zara | gated creator program only (Captiv8, LTK) | not open to site publishers | link-only, $0 | ⚠️ aggregator |
| 4 | Uniqlo | yes (~2–5 %) | Awin (primary); also Sovrn, FlexOffers, Skimlinks | monetizable | ⚠️ aggregator |
| 5 | Simons | yes (2–4 %, free, no minimum sales) | Impact; also FlexOffers | monetizable | ✅ simons.ca affiliate page |
| 6 | Reitmans | yes (1.6–4 %, 3-day cookie) | Impact; also FlexOffers, Sovrn | monetizable | ⚠️ aggregator |
| 7 | Dynamite / Garage | yes (own program page) | network unknown; ambassador program is separate | monetizable, recon needed | ⚠️ brand page |
| 8 | Old Navy / Gap | US-only creator program, 1,000+ followers | ineligible | link-only | ⚠️ recon |

**Second tier** (programs exist, less mainstream in Canada; the original brief's targets): Anthropologie (Rakuten, FlexOffers, Skimlinks), Everlane (Ascend, FlexOffers, Sovrn), Reformation (direct, CJ, Rakuten), Mango (CJ). Recon-sourced.

ShareASale closed 2025-10-06 and merged into Awin; treat every doc mention as "Awin."

**What the ranking changes:** five of the top eight are monetizable and three are link-only, which is inside the wargame-08 fork threshold (at least 3 of 8 viable). **Impact** joins the application list because Simons and Reitmans both run there. **Awin** matters more (Uniqlo). **Rakuten** is now only needed for second-tier brands.

Classification rule: **monetizable** = a joinable program exists; **link-only** = plain outbound link, no commission, images and data via ADR-0013 Tier 2 extraction-only.

## 4. Application sequence (parallel, same evening)

1. **Impact.** Simons (free, no minimum sales) and Reitmans. Apply as a content / tool publisher, then request both programs.
2. **Awin Canada.** First, log in with the recovery code and establish what the account already is (the ShareASale migration may have created it). Recon says a $1 refundable deposit and near-real-time review. Then request Uniqlo. Awin keeps application data 60 days; reapply after that if rejected.
3. **Sovrn Commerce.** No traffic minimum. Covers H&M, and gives a fallback for Uniqlo and Reitmans if they reject a new publisher elsewhere.
4. **FlexOffers.** Application review; unrestricted programs approve in about five business days. Simons, Reitmans, and Uniqlo all list here, and its daily product feeds are the ingestion path.
5. **Rakuten Advertising.** Open network, no screening at signup. Only needed for second-tier brands (Anthropologie, Reformation).
6. **Groupe Dynamite direct** (Dynamite / Garage): find the network behind their affiliate page after the above accounts exist.

## 5. Application answers (paste-ready)

**Publisher type:** content / comparison / tool. **Not** coupon, deal, cashback, or loyalty.

**Site description (short):**
> Kashf Edit is a discovery tool that lets shoppers filter mainstream brands' catalogues by objective garment attributes (sleeve length, neckline, hem length, fit, opacity) and links out to the brand's own site to buy. It holds no stock and takes no payments.

**Site description (long):**
> Kashf Edit helps women who dress modestly find suitable pieces in mainstream catalogues. Brand sites let you filter by size, colour and price, but not by sleeve length, hem, or opacity, so shoppers check products one at a time and give up. We extract those attributes from product listings with a vision model, store the attributes, and let the shopper set their own thresholds. Every product links out to the brand's own storefront. We do not sell, do not hold stock, and do not republish product imagery; images are used for attribute extraction only. The site is built and run by one person in Toronto with his wife as curation lead.

**Promotional methods:**
> Organic search for attribute-specific queries ("long-sleeve midi dress opaque"); the Toronto modest-fashion community (RIS convention, MuslimFest, local creators); Reddit communities where modest shopping is discussed (e.g. r/Hijabis, within their self-promotion rules); and the curation lead's Instagram channel. No paid search on brand terms, no email lists, no incentives.

**Traffic (be exact):**
> Pre-launch. The site is live at kashfedit.com with a sample catalogue while brand partnerships are arranged. No traffic figures yet; launch follows the first approved feeds.

**Monetization:**
> Affiliate commission on outbound clicks that convert. Commission never affects which products are shown or how they are ordered (stated on `/privacy`).

**Product data and images:**
> Feed data is used to populate the catalogue; images are fetched for attribute extraction and are not stored or republished. Read each network's product-data and image clause at signup and save the quote into this file (ADR-0013's licensing assumption).

## 6. Prep before the evening

- [ ] Ranked brand list from the curation lead (§3)
- [ ] `hello@kashfedit.com` live and forwarding; `/privacy` updated
- [ ] Business number and bank details at hand (sole-prop)
- [ ] Awin recovery code moved to Bitwarden; `affiliates-info.txt` deleted
- [ ] `/products` re-checked in a browser the same day

## 7. Rejection playbook

1. Read the stated reason. Awin's most common are: placeholder or one-page site, missing privacy policy, unclear traffic source. Rakuten advertisers reject new publishers "temporarily" until they see activity.
2. Fix the named thing. Reapplying without addressing it rarely changes the outcome.
3. Awin: wait out the 60-day data-retention window, then reapply with the same email.
4. Route the rejected brand through Sovrn meanwhile (no minimum) and build click activity there.
5. Reapply to Gate 2 with a screenshot of a real catalogue once ingestion lands (wargame 08 Move A4).
6. If after 60 days fewer than 3 of the top 8 brands are monetizable or link-only-viable, that is a re-scope decision for Mohamed, not something to improvise around (wargame 08 fork).

## 8. What not to do

- Put real brand names back on the sample catalogue to look bigger.
- Describe the site as a store or a marketplace.
- Inflate traffic, or leave it blank; state "pre-launch" explicitly.
- Apply as a coupon or deals publisher.
- Apply to individual advertisers before the network account exists.
- Store network credentials or recovery codes in the project folder.

## 9. Tracker

| Network | Applied | Status | Notes |
|---|---|---|---|
| Rakuten Advertising | | | |
| FlexOffers | | | |
| Sovrn Commerce | | | |
| Awin Canada | | | recovery code exists since 2026-05-22; account state unknown |
| Ascend (Everlane) | | | |
| Reformation direct | | | |

## Sources

- Awin, "Why was my network application rejected?": https://success.awin.com/s/article/Why-was-my-network-application-rejected?language=en_US
- Awin, "Why was I rejected from an advertiser programme?": https://success.awin.com/s/article/Why-was-I-rejected-from-an-advertiser-programme?language=en_US
- Rakuten Advertising, "Requirements for New Publishers": https://pubhelp.rakutenadvertising.com/hc/en-us/articles/360060314292-Requirements-for-New-Publishers
- Rakuten Advertising, "Partnership Request Rejections": https://pubhelp.rakutenadvertising.com/hc/en-us/articles/360060740551-Partnership-Request-Rejections
- Rakuten Advertising, "Publisher Sign Up Process": https://pubhelp.rakutenadvertising.com/hc/en-us/articles/20898125890573-Publisher-Sign-Up-Process
- Wargame 08 recon (2026-07-06), `projects\wargames\wargames\08-mf-future.md`
