// Shows photo options from Wikimedia Commons so a person can pick the best one for a card.
//   node scripts/photo-candidates.mjs out.jpg "Virat Kohli" "Joe Root" "Shane Warne=Warne bowling" ...
// Writes a contact sheet (one row per player, options numbered 1–6) and prints each option's file title.
// Put the chosen title in PHOTO_PICKS in scripts/fetch-images.js.

import sharp from "sharp";

const UA = "HundredDollarDraft/1.0 (private hobby game; image fetch script)";
const [out, ...names] = process.argv.slice(2);
const N = 6, W = 150, H = 188, LAB = 20, NAMEW = 170;
const NOT_A_PHOTO = /(chart|graph|performance|statistic|career|scoreboard|plot|record|map|logo|signature|autograph|stamp|coin|poster|cartoon|drawing|wax)/i;
const plain = s => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const esc = s => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function search(q) {
  const u = "https://commons.wikimedia.org/w/api.php?" + new URLSearchParams({
    action: "query", format: "json", generator: "search", gsrnamespace: "6", gsrlimit: "50", gsrsearch: q,
    prop: "imageinfo", iiprop: "url|size", iiurlwidth: "300"
  });
  for (let t = 1; t <= 5; t++) {
    let text = "";
    try { text = await (await fetch(u, { headers: { "User-Agent": UA } })).text(); } catch { /* network hiccup: retry below */ }
    try { return Object.values(JSON.parse(text).query?.pages || {}); }
    catch { await sleep(4000 * t); }            // "too many requests": wait and try again
  }
  return [];
}

const rows = [];
for (const arg of names) {
  // "Label=custom search words" lets you try other searches; the label's last word must appear in the file name.
  const [name, custom] = arg.split("=");
  const surname = plain(name.split(/\s+/).pop());
  let pages = custom ? await search(`${custom} filetype:bitmap`) : await search(`"${name}" cricket filetype:bitmap`);
  if (pages.length < N && !custom) pages = pages.concat(await search(`"${name}" filetype:bitmap`));
  const seen = new Set();
  const opts = pages
    .filter(p => p.imageinfo?.[0] && !seen.has(p.title) && seen.add(p.title))
    .filter(p => plain(p.title).includes(surname) && !NOT_A_PHOTO.test(p.title) && !/\.(png|gif|svg|tif)$/i.test(p.title))
    .filter(p => p.imageinfo[0].width >= 300 && p.imageinfo[0].height >= 300)
    .sort((a, b) => (a.index ?? 99) - (b.index ?? 99))
    .slice(0, N);
  console.log(`\n${name}`);
  opts.forEach((p, k) => console.log(`  ${k + 1}. ${p.title}`));
  const tiles = [];
  for (const [k, p] of opts.entries()) {
    try {
      const r = await fetch(p.imageinfo[0].thumburl, { headers: { "User-Agent": UA } });
      tiles.push({ k, buf: await sharp(Buffer.from(await r.arrayBuffer())).resize(W, H, { fit: "cover", position: sharp.strategy.attention }).toBuffer() });
    } catch { /* skip */ }
    await sleep(400);
  }
  rows.push({ name, tiles });
  await sleep(1500);
}

const width = NAMEW + N * W, rowH = H + LAB;
const comp = [];
rows.forEach((row, r) => {
  comp.push({ input: Buffer.from(`<svg width="${NAMEW}" height="${rowH}"><rect width="100%" height="100%" fill="#111"/><text x="8" y="${rowH / 2}" font-size="15" font-family="Arial" fill="#fff">${esc(row.name)}</text></svg>`), left: 0, top: r * rowH });
  for (const t of row.tiles) {
    const x = NAMEW + t.k * W, y = r * rowH;
    comp.push({ input: t.buf, left: x, top: y });
    comp.push({ input: Buffer.from(`<svg width="${W}" height="${LAB}"><rect width="100%" height="100%" fill="#0e9f5f"/><text x="6" y="15" font-size="13" font-family="Arial" fill="#fff">${t.k + 1}</text></svg>`), left: x, top: y + H });
  }
});
await sharp({ create: { width, height: rows.length * rowH, channels: 3, background: "#fff" } }).composite(comp).jpeg({ quality: 78 }).toFile(out);
console.log(`\nWrote ${out}`);
