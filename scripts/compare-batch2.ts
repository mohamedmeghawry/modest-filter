// Jev vs Opus on batch 2, and Mohamed's local review page.
//
//   npx tsx scripts/compare-batch2.ts
//
// Reads samples/demo/products-batch2.csv, tag-results-products-batch2.json
// (Opus) and jev-products-batch2.json (Jev). Writes:
//   samples/demo/compare-batch2.json  per-product verdicts + summary
//   samples/demo/review-batch2.html   blind review page: front/back photos and
//     5 yes/no questions per product, answers saved in the browser and
//     downloaded as JSON. It shows no Opus/Jev verdicts, so answers aren't
//     anchored. Photos load from images/<id>/ next to it (gitignored, local
//     only), so the page works only on this PC, never served.
// Judging rules (fixed 2026-11-09): lib/products/review.ts.
import { readFileSync, writeFileSync } from "node:fs";
import { parseCsv } from "../lib/products/demo-csv";
import { baselineFailures } from "../lib/products/modest-baseline";
import { classify, pickReviewSet, type Agreement, type JevDecision } from "../lib/products/review";

const CSV = "samples/demo/products-batch2.csv";
const OPUS = "samples/demo/tag-results-products-batch2.json";
const JEV = "samples/demo/jev-products-batch2.json";
const SLUG: Record<string, string> = { dress: "dresses", top: "tops" };

type OpusRow = { id: string; taggedAt: string; costUsd: number; final: Record<string, string | null> };
type JevRow = { id: string; decision: JevDecision; rules: Record<string, string> };

function main() {
  const rows = parseCsv(readFileSync(CSV, "utf8"));
  const opus = new Map<string, OpusRow>();
  for (const r of JSON.parse(readFileSync(OPUS, "utf8")) as OpusRow[]) {
    const prev = opus.get(r.id);
    if (!prev || prev.taggedAt < r.taggedAt) opus.set(r.id, r); // latest tagging wins
  }
  const jev = new Map((JSON.parse(readFileSync(JEV, "utf8")).rows as JevRow[]).map((r) => [r.id, r]));

  const items: { id: string; brand: string; category: string; title: string; link: string; agreement: Agreement; opusShown: boolean; opusFails: string[]; jev: JevDecision; jevFails: string[] }[] = [];
  const textRejected: { id: string; brand: string; reasons: string }[] = [];
  const pending: string[] = [];
  for (const r of rows) {
    if (r.gate_reasons) { textRejected.push({ id: r.id, brand: r.brand, reasons: r.gate_reasons }); continue; }
    const o = opus.get(r.id), j = jev.get(r.id);
    if (!o || !j) { pending.push(`${r.id} (${!o ? "Opus" : ""}${!o && !j ? "+" : ""}${!j ? "Jev" : ""} missing)`); continue; }
    const f = o.final;
    const fails = baselineFailures({ tagStatus: "tagged", categorySlug: SLUG[r.category], sleeveLength: f.sleeveLength, backStyle: f.backStyle, cutouts: f.cutouts, slit: f.slit, neckline: f.neckline });
    items.push({
      id: r.id, brand: r.brand, category: r.category, title: r.title, link: r.link,
      opusShown: fails.length === 0, opusFails: fails, jev: j.decision,
      jevFails: Object.entries(j.rules).filter(([, v]) => v === "fail").map(([k]) => k),
      agreement: classify(fails.length === 0, j.decision),
    });
  }
  if (pending.length) {
    console.log(`Not compared yet (${pending.length}): ${pending.join(", ")}`);
    if (!process.argv.includes("--partial")) process.exit(1);
  }

  const count = (pred: (i: (typeof items)[number]) => boolean) => items.filter(pred).length;
  const brands = [...new Set(rows.map((r) => r.brand))];
  const summary = {
    products: rows.length,
    textGateRejected: textRejected.length,
    compared: items.length,
    opus: { shown: count((i) => i.opusShown), hidden: count((i) => !i.opusShown), costUsd: Number([...opus.values()].reduce((s, o) => s + o.costUsd, 0).toFixed(3)) },
    jev: { reject: count((i) => i.jev === "reject"), unsure: count((i) => i.jev === "unsure"), pass: count((i) => i.jev === "pass"), costUsd: JSON.parse(readFileSync(JEV, "utf8")).costUsd },
    agreement: Object.fromEntries((["agree-hidden", "agree-shown", "jev-rejects-opus-shows", "jev-passes-opus-hides", "jev-unsure"] as Agreement[]).map((a) => [a, count((i) => i.agreement === a)])),
    shownByBrand: Object.fromEntries(brands.map((b) => [b, `${count((i) => i.brand === b && i.opusShown)}/${rows.filter((r) => r.brand === b).length}`])),
  };
  const review = pickReviewSet(items, 10);
  writeFileSync("samples/demo/compare-batch2.json", JSON.stringify({ generatedAt: new Date().toISOString(), summary, reviewIds: review.map((r) => r.id), textRejected, items }, null, 2) + "\n");
  writeFileSync("samples/demo/review-batch2.html", page(review.map(({ id, brand, category, title, link }) => ({ id, brand, category, title, link }))));
  console.log(JSON.stringify(summary, null, 2));
  console.log(`Review set: ${review.length} products -> samples/demo/review-batch2.html`);
}

function page(products: { id: string; brand: string; category: string; title: string; link: string }[]) {
  const data = JSON.stringify(products).replace(/</g, "\\u003c");
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Batch 2 Review</title>
<style>
:root{--bg:#fafaf7;--fg:#1c1c1a;--muted:#6b6b66;--card:#fff;--line:#e2e1db;--accent:#2f5d50}
@media (prefers-color-scheme:dark){:root{--bg:#161614;--fg:#ecebe6;--muted:#a3a29b;--card:#20201d;--line:#34332f;--accent:#7fb8a6}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font:15px/1.45 system-ui,sans-serif}
header{position:sticky;top:0;background:var(--bg);border-bottom:1px solid var(--line);padding:12px 16px;display:flex;gap:12px;align-items:center;flex-wrap:wrap;z-index:1}
header h1{font-size:17px;margin:0;flex:1}button{font:inherit;padding:8px 14px;border-radius:8px;border:1px solid var(--accent);background:var(--accent);color:#fff;cursor:pointer}
main{max-width:980px;margin:0 auto;padding:16px}.card{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:16px;margin-bottom:16px}
.meta{color:var(--muted);font-size:13px}.photos{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:12px 0}
.photos img{width:100%;aspect-ratio:2/3;object-fit:contain;background:var(--bg);border-radius:8px;cursor:zoom-in}
.q{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:8px 0;border-top:1px solid var(--line);flex-wrap:wrap}
.q span{flex:1;min-width:200px}.q label{margin-left:10px;white-space:nowrap}textarea{width:100%;margin-top:8px;font:inherit;padding:6px;border-radius:6px;border:1px solid var(--line);background:var(--bg);color:var(--fg)}
.done{outline:2px solid var(--accent)}
</style></head><body>
<header><h1>Batch 2 review: is each product modest? <span class="meta" id="progress"></span></h1><button id="dl">Download answers</button></header>
<main><p class="meta">Blind review: Opus and Jev verdicts are not shown. Answer from the photos (open the brand link if a photo is unclear). Answers are saved in this browser as you go; press Download when finished and put the file in samples/demo/.</p><div id="list"></div></main>
<script>
const P=${data};
const Q=[["sleeves","Do the sleeves reach the wrist?"],["back","Is the back closed (no open, low or cut-out back)?"],["cutouts","Is it free of cut-outs?"],["slit","Is any slit low (below the knee) or absent?"],["neckline","Does the neckline cover both shoulders (not off-shoulder or halter)?"]];
const KEY="kashf-review-batch2";let A={};try{A=JSON.parse(localStorage.getItem(KEY)||"{}")}catch(e){}
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(A))}catch(e){}prog()};
const prog=()=>{const n=P.filter(p=>Q.every(([k])=>A[p.id]?.[k])).length;document.getElementById("progress").textContent=n+" of "+P.length+" done";P.forEach(p=>document.getElementById("c-"+p.id)?.classList.toggle("done",Q.every(([k])=>A[p.id]?.[k])))};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
document.getElementById("list").innerHTML=P.map((p,i)=>'<section class="card" id="c-'+p.id+'"><div><b>'+(i+1)+'. '+esc(p.title)+'</b></div><div class="meta">'+esc(p.brand)+' · '+p.category+' · <a href="'+esc(p.link)+'" target="_blank" rel="noopener">brand page</a> · '+p.id+'</div><div class="photos"><img src="images/'+p.id+'/front.jpg" alt="front"><img src="images/'+p.id+'/back.jpg" alt="back"></div>'+Q.map(([k,t])=>{const opts=(k==="slit"&&p.category==="top")?["yes","no","n/a"]:["yes","no","can't tell"];return '<div class="q"><span>'+t+'</span>'+opts.map(o=>'<label><input type="radio" name="'+p.id+'-'+k+'" value="'+o+'"'+(A[p.id]?.[k]===o?" checked":"")+'> '+o+'</label>').join("")+'</div>'}).join("")+'<textarea placeholder="Note (optional)" data-id="'+p.id+'">'+esc(A[p.id]?.note||"")+'</textarea></section>').join("");
document.addEventListener("change",e=>{const t=e.target;if(t.type==="radio"){const i=t.name.lastIndexOf("-");const id=t.name.slice(0,i),k=t.name.slice(i+1);(A[id]=A[id]||{})[k]=t.value;save()}});
document.addEventListener("input",e=>{const t=e.target;if(t.tagName==="TEXTAREA"){(A[t.dataset.id]=A[t.dataset.id]||{}).note=t.value;save()}});
document.addEventListener("click",e=>{if(e.target.tagName==="IMG")window.open(e.target.src,"_blank")});
document.getElementById("dl").onclick=()=>{const b=new Blob([JSON.stringify({reviewedAt:new Date().toISOString(),answers:A},null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(b);a.download="review-batch2-answers.json";a.click()};
prog();
</script></body></html>
`;
}

main();
