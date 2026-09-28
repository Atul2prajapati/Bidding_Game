// Downloads card photos and writes public/images/manifest.json.
//
//   npm run images                   every market with photos (football, cricket, anime, pokemon, heroes)
//   npm run images -- --only=football
//   npm run images -- --only=anime
//   npm run images -- --force        re-download photos you already have
//   npm run images -- --redo=Goku,L  re-download just these cards
//
// Football: free-licensed photos from Wikimedia Commons (the lead photo of each player's
//           Wikipedia article), with photographer + licence saved for the credits screen.
// Anime:    character art from AniList. It belongs to the studios, so it is marked
//           PRIVATE USE ONLY: fine for games with friends, not for publishing or selling.

import { mkdir, readFile, writeFile, access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { THEMES } from "../shared/themes.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "public", "images");
const MANIFEST = path.join(OUT, "manifest.json");
const UA = "HundredDollarDraft/1.0 (private hobby game; image fetch script)";
const args = process.argv.slice(2);
const only = (args.find(a => a.startsWith("--only=")) || "").split("=")[1];
const force = args.includes("--force");
const redo = new Set(((args.find(a => a.startsWith("--redo=")) || "").split("=")[1] || "").split(",").filter(Boolean));
const want = (kind, name, manifest) => force || redo.has(name) || !manifest[kind][name];

const sleep = ms => new Promise(r => setTimeout(r, ms));
const slug = s => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const stripHtml = s => String(s || "").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
const exists = f => access(f).then(() => true, () => false);

async function getJSON(url, opts = {}, tries = 4) {
  for (let t = 1; ; t++) {
    const res = await fetch(url, { ...opts, headers: { "User-Agent": UA, Accept: "application/json", ...(opts.headers || {}) } });
    if (res.ok) return res.json();
    if (t >= tries || ![429, 500, 502, 503, 504].includes(res.status)) throw new Error(`${res.status} from ${new URL(url).host}`);
    const wait = Number(res.headers.get("retry-after")) * 1000 || 3000 * t;
    await sleep(wait);
  }
}

/** Download, crop to the 4:5 card shape (keeping the face in frame), save as small WebP. */
async function saveImage(url, kind, name, { contain = false } = {}) {
  let res;
  for (let t = 1; t <= 4; t++) {                         // retry when the image host asks us to slow down
    res = await fetch(url, { headers: { "User-Agent": UA } });
    if (res.ok || ![429, 500, 502, 503, 504].includes(res.status)) break;
    await sleep((Number(res.headers.get("retry-after")) || 4 * t) * 1000);
  }
  if (!res.ok) throw new Error(`image ${res.status}`);
  const file = `${kind}/${slug(name)}.webp`;
  await sharp(Buffer.from(await res.arrayBuffer()))
    .resize(400, 500, contain
      ? { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }   // keep the whole Pokémon, transparent around it
      : { fit: "cover", position: sharp.strategy.attention })
    .webp({ quality: 80 })
    .toFile(path.join(OUT, file));
  return file;
}

/* ---------------- Football + Cricket: Wikipedia / Wikimedia Commons ---------------- */
// Card name -> Wikipedia article title.
const FOOTBALL_WIKI = {
  "Messi": "Lionel Messi", "Ronaldo": "Cristiano Ronaldo", "Mbappé": "Kylian Mbappé", "Haaland": "Erling Haaland",
  "Neymar": "Neymar", "Vinícius Jr": "Vinícius Júnior", "Yamal": "Lamine Yamal", "Kane": "Harry Kane", "Salah": "Mohamed Salah",
  "Bale": "Gareth Bale", "Benzema": "Karim Benzema", "Lewandowski": "Robert Lewandowski", "Saka": "Bukayo Saka",
  "Suárez": "Luis Suárez (Uruguayan footballer)", "Griezmann": "Antoine Griezmann", "Son": "Son Heung-min", "Rashford": "Marcus Rashford",
  "Grealish": "Jack Grealish", "Núñez": "Darwin Núñez", "Richarlison": "Richarlison", "Bellingham": "Jude Bellingham",
  "Rodri": "Rodri (footballer, born 1996)", "De Bruyne": "Kevin De Bruyne", "Modrić": "Luka Modrić", "Musiala": "Jamal Musiala",
  "Pedri": "Pedri", "Kimmich": "Joshua Kimmich", "Rice": "Declan Rice", "De Jong": "Frenkie de Jong", "Bruno F.": "Bruno Fernandes",
  "Casemiro": "Casemiro", "Mount": "Mason Mount", "Henderson": "Jordan Henderson", "Phillips": "Kalvin Phillips",
  "Van Dijk": "Virgil van Dijk", "Rúben Dias": "Rúben Dias", "Saliba": "William Saliba", "Hakimi": "Achraf Hakimi",
  "Rüdiger": "Antonio Rüdiger", "Theo": "Theo Hernandez", "Trent": "Trent Alexander-Arnold", "Marquinhos": "Marquinhos",
  "Walker": "Kyle Walker", "Ramos": "Sergio Ramos", "Maguire": "Harry Maguire", "Trippier": "Kieran Trippier",
  "Ben White": "Ben White (footballer)", "Chilwell": "Ben Chilwell", "Alisson": "Alisson Becker", "Courtois": "Thibaut Courtois",
  "Donnarumma": "Gianluigi Donnarumma", "Ter Stegen": "Marc-André ter Stegen", "Ederson": "Ederson (footballer, born 1993)",
  "Raya": "David Raya", "Pickford": "Jordan Pickford", "Ramsdale": "Aaron Ramsdale",
  // Legendary Icons
  "Pelé": "Pelé", "Maradona": "Diego Maradona", "Ronaldo Nazário": "Ronaldo (Brazilian footballer)", "Zidane": "Zinedine Zidane",
  "Cruyff": "Johan Cruyff", "Ronaldinho": "Ronaldinho", "Puskás": "Ferenc Puskás", "Beckenbauer": "Franz Beckenbauer",
  "Maldini": "Paolo Maldini", "Eusébio": "Eusébio", "Henry": "Thierry Henry", "Yashin": "Lev Yashin", "Iniesta": "Andrés Iniesta",
  "Xavi": "Xavi", "Rivaldo": "Rivaldo", "Buffon": "Gianluigi Buffon", "Kaká": "Kaká", "Pirlo": "Andrea Pirlo", "Figo": "Luís Figo",
  "Totti": "Francesco Totti", "Bergkamp": "Dennis Bergkamp", "Gerrard": "Steven Gerrard", "Vieira": "Patrick Vieira",
  "Roberto Carlos": "Roberto Carlos", "Cafu": "Cafu", "Nesta": "Alessandro Nesta", "Casillas": "Iker Casillas",
  "Drogba": "Didier Drogba", "Beckham": "David Beckham"
};

// Cricket cards use full names; only titles that differ from the card name are listed.
const CRICKET_WIKI = Object.fromEntries(THEMES.cricket.items.map(x => [x.n, x.n]));
Object.assign(CRICKET_WIKI, {
  "Steve Smith": "Steve Smith (cricketer)", "David Warner": "David Warner (cricketer)", "Cameron Green": "Cameron Green (cricketer)",
  "Mark Wood": "Mark Wood (cricketer)", "Harry Brook": "Harry Brook", "Shaheen Afridi": "Shaheen Shah Afridi",
  "Rashid Khan": "Rashid Khan (cricketer)", "Mohammad Rizwan": "Mohammad Rizwan (cricketer)", "Abhishek Sharma": "Abhishek Sharma (cricketer)",
  "Rinku Singh": "Rinku Singh (cricketer)", "Mukesh Kumar": "Mukesh Kumar (cricketer)", "Mitchell Marsh": "Mitchell Marsh", "Tilak Varma": "Tilak Varma"
});

/* ---------- Hand-picked photos ---------- */
// Chosen by eye from `node scripts/photo-candidates.mjs` contact sheets: players in kit, face visible.
// These always win over the automatic search. NO_PHOTO cards use the clean initials design instead
// (Commons only has suits, awards or casual shots of them).
const PHOTO_PICKS = {
  cricket: {
    "Virat Kohli": "File:Virat Kohli during the India vs Aus 4th Test match at Narendra Modi Stadium on 09 March 2023.jpg",
    "Kane Williamson": "File:Kane Williamson in 2019.jpg",
    "David Warner": "File:David Warner NSW v Tasmania.jpg",
    "Shubman Gill": "File:Prince Shubman Gill.jpg",
    "Shreyas Iyer": "File:Shreyas Iyer 2021.jpg",
    "KL Rahul": "File:LOKESH RAHUL-15573141953 (cropped).JPG",
    "Ben Stokes": "File:Ben Stokes, 2013 (cropped further).jpg",
    "Andre Russell": "File:Andre Russell (2).jpg",
    "Mitchell Starc": "File:Mitchell Starc 2008.jpg",
    "Kagiso Rabada": "File:KAGISO RABADA (15519760378).jpg",
    "Ravichandran Ashwin": "File:R Ashwin bowling at Trent Bridge 2018 (cropped).jpg",
    "Nathan Lyon": "File:Nathan Lyon 20251017.jpg",
    "Bhuvneshwar Kumar": "File:Bhuvneshwar kumar With Rashid Zirak (Bhuvneshwar Kumar cropped).jpg",
    "Dinesh Karthik": "File:Dinesh Karthik 2.jpg",
    "Mitchell Marsh": "File:Mitchell Marsh.jpg",
    "Ruturaj Gaikwad": "File:Ruturaj Gaikwad.jpeg",
    // Legends
    "Don Bradman": "File:Donald Bradman australian cricket player pic.JPG",
    "Jacques Kallis": "File:JAQUES KALLIS (3175901786).jpg",
    "Garfield Sobers": "File:Garfield Sobers, 1956.jpg",
    "Muttiah Muralitharan": "File:MUTTIAH MURALITHARAN (5155182417).jpg",
    "Wasim Akram": "File:Wasim Akram 1.jpg",
    "Ricky Ponting": "File:Australian cricket team captain Ricky Ponting tries to hook a ball off India's Asish Nehra at Vadodara.jpg",
    "Rahul Dravid": "File:Rahul Dravid in PMO New Delhi.jpg",
    "Kumar Sangakkara": "File:Kumar Sangakkara bat in hand.JPG",
    "Sanath Jayasuriya": "File:Jayasuriya.jpg",
    "Shane Warne": "File:Shane Warne bowling 2009.jpg"
  }
};
const NO_PHOTO = { cricket: ["Tilak Varma", "Ajinkya Rahane", "Mohammad Rizwan", "Ishan Kishan", "Deepak Chahar", "Umran Malik",
  "Viv Richards", "Kapil Dev", "Imran Khan", "Sourav Ganguly", "Shoaib Akhtar", "Ian Botham"] };

async function applyPicks(kind, manifest) {
  for (const card of NO_PHOTO[kind] || []) {
    if (manifest[kind][card]) { delete manifest[kind][card]; console.log(`  – ${card}: no in-kit photo, using the initials design`); }
  }
  const picks = Object.entries(PHOTO_PICKS[kind] || {}).filter(([card, title]) => force || redo.has(card) || manifest[kind][card]?.pick !== title);
  for (let b = 0; b < picks.length; b += 20) {
    const batch = picks.slice(b, b + 20);
    const info = await getJSON("https://commons.wikimedia.org/w/api.php?" + new URLSearchParams({
      action: "query", format: "json", prop: "imageinfo", iiprop: "url|extmetadata", iiurlwidth: "700",
      iiextmetadatafilter: "Artist|LicenseShortName|LicenseUrl", titles: batch.map(x => x[1]).join("|")
    }));
    const norm = {};
    (info.query.normalized || []).forEach(x => (norm[x.to] = x.from));
    const byTitle = {};
    Object.values(info.query.pages).forEach(p => { if (p.imageinfo) byTitle[norm[p.title] || p.title] = p.imageinfo[0]; });
    for (const [card, title] of batch) {
      const ii = byTitle[title];
      if (!ii) { console.log(`  ✗ ${card}: picked file not found (${title})`); continue; }
      try {
        const md = ii.extmetadata || {};
        const file = await saveImage(ii.thumburl || ii.url, kind, card);
        manifest[kind][card] = {
          file, private: false, pick: title,
          credit: `${stripHtml(md.Artist?.value) || "Unknown photographer"}, ${stripHtml(md.LicenseShortName?.value) || "free licence"}`,
          license: stripHtml(md.LicenseShortName?.value), licenseUrl: md.LicenseUrl?.value || null, source: ii.descriptionurl
        };
        console.log(`  ★ ${card}  (hand-picked)`);
      } catch (e) { console.log(`  ✗ ${card}: ${e.message}`); }
      await sleep(300);
    }
  }
}

/* ---------- Match photos from Wikimedia Commons (players in kit, not at events) ---------- */
const MATCH_WORDS = /\b(batting|bats|batsman|batter|bowling|bowls|bowler|fielding|fields|keeping|wicket|wicketkeeper|catch|appeal|celebrat|in action|during|innings|century|fifty)\b/i;
const GAME_WORDS = /\b(vs?\.?|versus|match|test|odi|t20i?|ipl|world cup|trophy|series|nets|practice|cricket ground|stadium|oval|lord'?s|mcg|scg|eden gardens|wankhede)\b/i;
const NOT_A_PHOTO = /(chart|graph|performance|statistic|career|scoreboard|plot|record|map|logo|signature|autograph|stamp|coin|poster|cartoon|drawing|wax)/i;
const OFF_FIELD = /\b(press|conference|award|ceremony|launch|event|meet(ing)?|wedding|with|and|family|statue|mural|signature|autograph|stamp|poster|premiere|rally|minister|office|interview|suit|party|dinner|visit|hosp|charity|book|film|movie|promo|shoot|photo ?shoot|expo|summit|felicitat|honou?r|portrait|selfie|fans?|wax|madame)\b/i;

async function commonsMatchPhoto(name) {
  const surname = name.split(/\s+/).pop().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const res = await getJSON("https://commons.wikimedia.org/w/api.php?" + new URLSearchParams({
    action: "query", format: "json", generator: "search", gsrnamespace: "6", gsrlimit: "40",
    gsrsearch: `"${name}" cricket filetype:bitmap`,
    prop: "imageinfo", iiprop: "url|size|extmetadata", iiurlwidth: "700",
    iiextmetadatafilter: "Artist|LicenseShortName|LicenseUrl|ImageDescription|Categories"
  }));
  const pages = Object.values(res.query?.pages || {});
  let best = null;
  for (const p of pages) {
    const ii = p.imageinfo?.[0]; if (!ii) continue;
    const title = p.title.replace(/^File:/, "");
    const plainTitle = title.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const desc = stripHtml(ii.extmetadata?.ImageDescription?.value).slice(0, 300);
    const cats = stripHtml(ii.extmetadata?.Categories?.value);
    const text = title + " " + desc;
    if (!plainTitle.includes(surname)) continue;                       // must name the player in the file name
    if (NOT_A_PHOTO.test(title)) continue;                             // career charts, scoreboards, posters…
    if (ii.width < 350 || ii.height < 350) continue;
    let sc = 0;
    if (MATCH_WORDS.test(text)) sc += 4;
    if (GAME_WORDS.test(text)) sc += 2;
    if (/cricket/i.test(text + cats)) sc += 1;
    if (OFF_FIELD.test(title)) sc -= 6;
    if (OFF_FIELD.test(desc)) sc -= 2;
    if (ii.height >= ii.width * 0.9) sc += 1;                          // portrait-ish crops fit the card better
    if (/\.(png|gif)$/i.test(title)) sc -= 2;
    if (!best || sc > best.sc) best = { sc, ii, title };
  }
  return best && best.sc >= 4 ? best : null;
}

// Any market of real people: lead photo of their Wikipedia article (free licences only), Wikidata as fallback.
async function wikiMarket(kind, WIKI, manifest, { matchPhotos = false } = {}) {
  const skip = new Set([...Object.keys(PHOTO_PICKS[kind] || {}), ...(NO_PHOTO[kind] || [])]);
  const names = THEMES[kind].items.map(x => x.n).filter(n => !skip.has(n) && want(kind, n, manifest));
  const missing = names.filter(n => !WIKI[n]);
  if (missing.length) console.log("  No Wikipedia title for:", missing.join(", "));
  const todo = names.filter(n => WIKI[n]);
  for (let b = 0; b < todo.length; b += 20) {
    const batch = todo.slice(b, b + 20);
    // 1) Lead photo of each article, free licences only.
    const q = await getJSON("https://en.wikipedia.org/w/api.php?" + new URLSearchParams({
      action: "query", format: "json", redirects: "1", prop: "pageimages|pageprops", piprop: "name", pilicense: "free", ppprop: "disambiguation",
      titles: batch.map(n => WIKI[n]).join("|")
    }));
    const titleOf = {};                                 // follow normalisation + redirects back to our title
    (q.query.normalized || []).forEach(x => (titleOf[x.to] = x.from));
    (q.query.redirects || []).forEach(x => (titleOf[x.to] = titleOf[x.from] || x.from));
    const fileFor = {};
    Object.values(q.query.pages).forEach(p => {
      const original = titleOf[p.title] || p.title;
      const card = batch.find(n => WIKI[n] === original || WIKI[n] === p.title);
      if (p.pageprops && "disambiguation" in p.pageprops) console.log(`  ! ${card}: "${p.title}" is a disambiguation page, fix its title in WIKI`);
      else if (card && p.pageimage) fileFor[card] = "File:" + p.pageimage;
    });
    // Fallback: the article has no free lead photo, so use the person's Wikidata image (always on Commons).
    for (const card of batch.filter(n => !fileFor[n])) {
      if (Object.values(q.query.pages).some(p => (titleOf[p.title] || p.title) === WIKI[card] && p.pageprops && "disambiguation" in p.pageprops)) continue;
      const pp = await getJSON("https://en.wikipedia.org/w/api.php?" + new URLSearchParams({
        action: "query", format: "json", redirects: "1", prop: "pageprops", ppprop: "wikibase_item", titles: WIKI[card]
      }));
      const qid = Object.values(pp.query.pages)[0]?.pageprops?.wikibase_item;
      if (!qid) continue;
      const claims = await getJSON("https://www.wikidata.org/w/api.php?" + new URLSearchParams({
        action: "wbgetclaims", format: "json", entity: qid, property: "P18"
      }));
      const img = claims.claims?.P18?.[0]?.mainsnak?.datavalue?.value;
      if (img) fileFor[card] = "File:" + img;
    }
    // Prefer a match photo from Commons when the market asks for it (cricket lead photos are often at events).
    if (matchPhotos) {
      for (const card of batch) {
        try {
          const hit = await commonsMatchPhoto(card);
          if (hit) {
            const md = hit.ii.extmetadata || {};
            const file = await saveImage(hit.ii.thumburl || hit.ii.url, kind, card);
            manifest[kind][card] = {
              file, private: false, matchPhoto: true,
              credit: `${stripHtml(md.Artist?.value) || "Unknown photographer"}, ${stripHtml(md.LicenseShortName?.value) || "free licence"}`,
              license: stripHtml(md.LicenseShortName?.value), licenseUrl: md.LicenseUrl?.value || null,
              source: hit.ii.descriptionurl, matched: hit.title
            };
            console.log(`  ✓ ${card}  (match photo: ${hit.title.slice(0, 60)})`);
            delete fileFor[card];
            batch.splice(batch.indexOf(card), 1, null);
          }
        } catch (e) { console.log(`  … ${card}: match-photo search failed (${e.message}), using Wikipedia photo`); }
        await sleep(250);
      }
    }
    // 2) URL, photographer and licence for each photo.
    const files = Object.values(fileFor);
    if (!files.length) { batch.filter(Boolean).forEach(c => console.log(`  ✗ ${c}: no free photo found`)); continue; }
    const info = await getJSON("https://commons.wikimedia.org/w/api.php?" + new URLSearchParams({
      action: "query", format: "json", prop: "imageinfo", iiprop: "url|extmetadata", iiurlwidth: "600",
      iiextmetadatafilter: "Artist|LicenseShortName|LicenseUrl", titles: files.join("|")
    }));
    const byFile = {};
    const norm = {};
    (info.query.normalized || []).forEach(x => (norm[x.to] = x.from));
    Object.values(info.query.pages).forEach(p => { if (p.imageinfo) byFile[norm[p.title] || p.title] = { ...p.imageinfo[0], title: p.title }; });

    for (const card of batch) {
      if (!card) continue;                              // already got a match photo
      const ii = byFile[fileFor[card]];
      if (!ii) { console.log(`  ✗ ${card}: no free photo found`); continue; }
      try {
        const md = ii.extmetadata || {};
        const file = await saveImage(ii.thumburl || ii.url, kind, card);
        manifest[kind][card] = {
          file, private: false,
          credit: `${stripHtml(md.Artist?.value) || "Unknown photographer"}, ${stripHtml(md.LicenseShortName?.value) || "free licence"}`,
          license: stripHtml(md.LicenseShortName?.value), licenseUrl: md.LicenseUrl?.value || null,
          source: ii.descriptionurl
        };
        console.log(`  ✓ ${card}`);
      } catch (e) { console.log(`  ✗ ${card}: ${e.message}`); }
      await sleep(150);
    }
  }
}

/* ---------------- Anime: AniList ---------------- */
// Series key -> pattern that must match one of the character's anime titles (to pick the right "Aqua").
const SERIES = {
  dbz: /dragon ball/i, nar: /naruto|boruto/i, op: /one piece/i, jjk: /jujutsu kaisen/i, aot: /shingeki no kyojin|attack on titan/i,
  ds: /kimetsu no yaiba|demon slayer/i, mha: /boku no hero|my hero academia/i, opm: /one.?punch/i, csm: /chainsaw/i,
  dn: /death note/i, hxh: /hunter.?x.?hunter/i, bl: /bleach/i, fma: /hagane no renkinjutsushi|fullmetal/i,
  sxf: /spy.?[x×].?family/i, kono: /kono subarashii|konosuba/i, bc: /black clover/i
};
// Card name -> better search text (AniList uses full names).
const SEARCH = {
  "Goku": "Son Goku", "Mr. Satan": "Hercule", "Gojo": "Satoru Gojo", "Sukuna": "Sukuna", "Yuji": "Itadori",
  "Megumi": "Megumi Fushiguro", "Eren": "Eren Yeager", "Mikasa": "Mikasa Ackerman", "Armin": "Armin Arlert",
  "Rengoku": "Rengoku", "Muzan": "Muzan Kibutsuji", "Tanjiro": "Tanjirou", "Nezuko": "Nezuko Kamado",
  "Zenitsu": "Zenitsu Agatsuma", "Inosuke": "Inosuke Hashibira", "Deku": "Izuku Midoriya", "Bakugo": "Katsuki Bakugo",
  "Todoroki": "Shoto Todoroki", "Uraraka": "Ochaco Uraraka", "Kaminari": "Denki Kaminari", "Mineta": "Minoru Mineta",
  "Kobeni": "Kobeni Higashiyama", "L": "L Lawliet", "Killua": "Killua Zoldyck", "Gon": "Gon Freecss", "Aizen": "Aizen",
  "Ichigo": "Ichigo Kurosaki", "Yor": "Yor Forger", "Loid": "Loid Forger", "Anya": "Anya Forger", "Kazuma": "Kazuma Sato",
  "Naruto": "Naruto Uzumaki", "Sasuke": "Sasuke Uchiha", "Madara": "Madara Uchiha", "Itachi": "Itachi Uchiha",
  "Kakashi": "Kakashi Hatake", "Sakura": "Sakura Haruno", "Shikamaru": "Shikamaru Nara", "Hinata": "Hinata Hyuuga",
  "Choji": "Chouji", "Luffy": "Monkey D. Luffy", "Zoro": "Roronoa Zoro", "Chopper": "Tony Tony Chopper",
  "Levi": "Levi"
};
const ANILIST_QUERY = `query($s:String){Page(perPage:10){characters(search:$s,sort:FAVOURITES_DESC){
  id siteUrl name{full native alternative} image{large} media(perPage:8,sort:POPULARITY_DESC){nodes{title{romaji english}}}}}}`;

async function anime(manifest) {
  const items = THEMES.anime.items.filter(x => want("anime", x.n, manifest));
  for (const it of items) {
    try {
      const r = await getJSON("https://graphql.anilist.co", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: ANILIST_QUERY, variables: { s: SEARCH[it.n] || it.n } })
      });
      const re = SERIES[it.e];
      // Right series AND a name that shares a word with what we searched (so "Satan" can't become Piccolo).
      const plain = x => String(x || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
      const words = plain(SEARCH[it.n] || it.n).split(/[^a-z0-9]+/).filter(w => w.length >= 3 || w === "l");
      const has = n => words.some(w => plain(n).split(/[^a-z0-9]+/).includes(w));
      const inSeries = c => c.media.nodes.some(m => re.test(m.title.romaji || "") || re.test(m.title.english || ""));
      // Prefer a match on the main name: "Sukuna" is also listed as one of Yuji's alternative names.
      const chars = r.data.Page.characters.filter(inSeries);
      const hit = chars.find(c => has(c.name.full)) || chars.find(c => (c.name.alternative || []).some(has));
      if (!hit || !hit.image?.large) { console.log(`  ✗ ${it.n}: not found in ${THEMES.anime.series[it.e][0]}`); }
      else {
        const file = await saveImage(hit.image.large, "anime", it.n);
        manifest.anime[it.n] = {
          file, private: true,
          credit: `${THEMES.anime.series[it.e][0]} © its creators and studio. Image via AniList. Private use only.`,
          source: hit.siteUrl, matched: hit.name.full
        };
        console.log(`  ✓ ${it.n}  (${hit.name.full})`);
      }
    } catch (e) { console.log(`  ✗ ${it.n}: ${e.message}`); }
    await sleep(2200);                                   // AniList allows ~30 requests a minute when busy
  }
}


/* ---------------- Pokémon: official artwork via PokeAPI ---------------- */
async function pokemon(manifest) {
  for (const it of THEMES.pokemon.items.filter(x => want("pokemon", x.n, manifest))) {
    try {
      const url = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${it.x}.png`;
      const file = await saveImage(url, "pokemon", it.n, { contain: true });
      manifest.pokemon[it.n] = { file, private: true, credit: "© Nintendo, Game Freak, The Pokémon Company. Artwork via PokeAPI. Private use only.",
        source: `https://pokeapi.co/api/v2/pokemon/${it.x}` };
      console.log(`  ✓ ${it.n}`);
    } catch (e) { console.log(`  ✗ ${it.n}: ${e.message}`); }
    await sleep(100);
  }
}

/* ---------------- Superheroes: open Superhero API ---------------- */
async function heroes(manifest) {
  const all = await getJSON("https://akabab.github.io/superhero-api/api/all.json");
  const byId = new Map(all.map(h => [h.id, h]));
  for (const it of THEMES.heroes.items.filter(x => want("heroes", x.n, manifest))) {
    const h = byId.get(it.x);
    if (!h) { console.log(`  ✗ ${it.n}: id ${it.x} not in the Superhero API`); continue; }
    try {
      const file = await saveImage(h.images.lg, "heroes", it.n);
      manifest.heroes[it.n] = { file, private: true, matched: h.name,
        credit: `${/DC/.test(h.biography.publisher) ? "DC Comics" : "Marvel"} character. Image via the open Superhero API. Private use only.`,
        source: `https://akabab.github.io/superhero-api/api/id/${it.x}.json` };
      console.log(`  ✓ ${it.n}  (${h.name})`);
    } catch (e) { console.log(`  ✗ ${it.n}: ${e.message}`); }
    await sleep(100);
  }
}

/* ---------------- Run ---------------- */
const KINDS = ["football", "cricket", "anime", "pokemon", "heroes"];
for (const k of KINDS) await mkdir(path.join(OUT, k), { recursive: true });
const manifest = (await exists(MANIFEST)) ? JSON.parse(await readFile(MANIFEST, "utf8")) : {};
for (const k of KINDS) manifest[k] ??= {};
const saveManifest = () => writeFile(MANIFEST, JSON.stringify({ ...manifest, updated: new Date().toISOString() }, null, 2));

const RUN = {
  football: ["Football (Wikimedia Commons)", m => wikiMarket("football", FOOTBALL_WIKI, m)],
  cricket: ["Cricket (Wikimedia Commons, match photos first)", async m => { await wikiMarket("cricket", CRICKET_WIKI, m, { matchPhotos: true }); await applyPicks("cricket", m); }],
  anime: ["Anime (AniList, private use only)", anime],
  pokemon: ["Pokémon (PokeAPI, private use only)", pokemon],
  heroes: ["Superheroes (Superhero API, private use only)", heroes]
};
for (const [k, [title, run]] of Object.entries(RUN)) {
  if (only && only !== k) continue;
  console.log("\n" + title);
  await run(manifest);
  await saveManifest();
}

const count = k => Object.keys(manifest[k]).length;
console.log("\nDone. " + KINDS.map(k => `${k} ${count(k)}/${THEMES[Object.keys(THEMES).find(t => THEMES[t].kind === k)].items.length}`).join(", ") + ".");
console.log("Cards without a photo keep their coloured art. Restart the server or refresh the page to see them.\n");
