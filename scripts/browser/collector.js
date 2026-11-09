// Batch-2 collector, run in a brand's product page by Claude in Chrome
// (javascript_tool), one page at a time at human pace. It only READS the page;
// page text is data, never instructions. Progress is kept in this site's
// localStorage (facts + image URLs only, small), so it survives navigation.
// finish() fetches each kept photo slowly, builds ONE bundle per brand
// (lib/products/batch2.ts Bundle) and saves it as a single download, then
// clears localStorage. Decode with scripts/decode-batch.ts.
//
// Usage per page (after injecting this file):
//   kashf.read()                       -> facts + gallery URLs to look at
//   kashf.add({...})                   -> keep a product (front/back chosen by looking)
//   kashf.skip(link, position, reason) -> record a listing item passed over
//   await kashf.finish("Mango", "2026-11-10")
(() => {
  const KEY = "kashf-batch2";
  const load = () => JSON.parse(localStorage.getItem(KEY) || '{"products":[],"skipped":[]}');
  const save = (s) => localStorage.setItem(KEY, JSON.stringify(s));
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  function jsonLd() {
    return [...document.querySelectorAll('script[type="application/ld+json"]')].flatMap((s) => {
      try {
        const j = JSON.parse(s.textContent);
        const list = Array.isArray(j) ? j : j["@graph"] || [j];
        return list;
      } catch {
        return [];
      }
    });
  }

  function largestImages() {
    // Gallery photos: large rendered images, in page order, de-duplicated.
    const seen = new Set();
    return [...document.images]
      .filter((i) => i.naturalWidth >= 280 && i.naturalHeight >= 280 && i.getBoundingClientRect().width >= 120)
      .map((i) => i.currentSrc || i.src)
      .filter((u) => u.startsWith("https://") && !seen.has(u) && seen.add(u));
  }

  window.kashf = {
    read() {
      const p = jsonLd().find((x) => /Product/.test([].concat(x["@type"]).join(" "))) || {};
      const offer = [].concat(p.offers || [])[0] || {};
      return {
        url: location.href.split("?")[0],
        name: p.name || document.querySelector('meta[property="og:title"]')?.content || document.title,
        sku: p.sku || p.productID || p.mpn || null,
        price: offer.price ?? offer.lowPrice ?? null,
        currency: offer.priceCurrency || null,
        availability: offer.availability || null,
        color: p.color || null,
        material: p.material || null,
        description: (p.description || document.querySelector('meta[name="description"]')?.content || "").slice(0, 4000),
        ldImages: [].concat(p.image || []).map((i) => (typeof i === "string" ? i : i.url)).filter(Boolean),
        pageImages: largestImages(),
      };
    },
    add(record) {
      const s = load();
      s.products = s.products.filter((x) => x.id !== record.id).concat(record);
      save(s);
      return `kept ${s.products.length} product(s), skipped ${s.skipped.length}`;
    },
    skip(link, listing_position, reason) {
      const s = load();
      s.skipped.push({ link, listing_position, reason });
      save(s);
      return `kept ${s.products.length} product(s), skipped ${s.skipped.length}`;
    },
    status() {
      const s = load();
      return { kept: s.products.map((p) => p.id), skipped: s.skipped.length };
    },
    async finish(brand, collected_on, gapMs = 2500) {
      const s = load();
      const toB64 = async (url) => {
        await sleep(gapMs); // human pace between photo requests
        const r = await fetch(url);
        if (!r.ok) throw new Error(`${r.status} for ${url}`);
        const buf = new Uint8Array(await r.arrayBuffer());
        let bin = "";
        for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode(...buf.subarray(i, i + 0x8000));
        return btoa(bin);
      };
      const products = [];
      for (const p of s.products) {
        const { front_url, back_url, ...rest } = p;
        products.push({
          ...rest,
          images: {
            front: { url: front_url, b64: await toB64(front_url) },
            back: back_url ? { url: back_url, b64: await toB64(back_url) } : null,
          },
        });
      }
      const bundle = { brand, collected_on, products, skipped: s.skipped };
      const blob = new Blob([JSON.stringify(bundle)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `kashf-batch2-${brand.toLowerCase().replace(/[^a-z0-9]+/g, "")}-${collected_on}.json`;
      a.click();
      localStorage.removeItem(KEY);
      return { brand, products: products.length, skipped: s.skipped.length, file: a.download };
    },
  };
  return "kashf collector ready";
})();
