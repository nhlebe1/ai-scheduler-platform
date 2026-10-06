// Renders share/share-card-x.png (attach to posts) and share/og-image.png (link previews)
// from data.json, using tools/share-card.html as the template.
//
//   npm i --no-save playwright && node plague-tracker/tools/render-share.mjs
//
// Uses the preinstalled Chromium at /opt/pw-browsers/chromium when present.
import { chromium } from "playwright";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const data = JSON.parse(readFileSync(join(root, "data.json"), "utf8"));
const exe = "/opt/pw-browsers/chromium";
const browser = await chromium.launch(existsSync(exe) ? { executablePath: exe } : {});

function fill(data) {
  const DAY = 864e5;
  const day = (iso) => new Date(iso + "T00:00:00Z");
  const fmt = (d, o) => d.toLocaleDateString("en-GB", { timeZone: "UTC", ...o });
  const $ = (id) => document.getElementById(id);
  const card = data.card;
  $("updated").textContent = "Updated " + fmt(new Date(data.updated), { day: "numeric", month: "short", year: "numeric" });
  $("chip").textContent = data.status.label;
  $("chip").dataset.level = data.status.level;
  $("title").textContent = card.title;
  $("sub").textContent = card.sub;
  $("sources").textContent = "Sources: " + card.sources;
  const tone = { critical: "crit", good: "good" };
  $("stats").innerHTML = "";
  for (const id of card.stats) {
    const f = data.figures.find((x) => x.id === id);
    if (!f) continue;
    const el = document.createElement("div");
    el.className = "stat " + (tone[f.tone] || "");
    const b = document.createElement("b");
    b.textContent = f.value;
    const s = document.createElement("span");
    s.textContent = (card.statLabels && card.statLabels[id]) || f.label;
    el.append(b, s);
    $("stats").append(el);
  }
  const w = data.watch;
  const start = day(w.lastExposure);
  const n0 = new Date(); const today = Date.UTC(n0.getUTCFullYear(), n0.getUTCMonth(), n0.getUTCDate());
  const n = Math.floor((today - start) / DAY);
  const end = new Date(+start + w.incubationDays * DAY);
  $("cells").innerHTML = Array.from({ length: w.incubationDays }, (_, i) =>
    `<i class="${i + 1 < n ? "p" : i + 1 === n ? "t" : ""}"></i>`).join("");
  $("watch").textContent = n > w.incubationDays
    ? `Incubation window closed ${fmt(end, { day: "numeric", month: "short" })}`
    : n < 1 ? `Incubation watch starts ${fmt(start, { day: "numeric", month: "short" })}`
    : `Incubation watch: day ${n} of ${w.incubationDays} · closes ${fmt(end, { day: "numeric", month: "short" })}`;
}

for (const [w, h, scale, name] of [[1200, 675, 2, "share-card-x.png"], [1200, 630, 1, "og-image.png"]]) {
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: scale });
  await page.goto(pathToFileURL(join(root, "tools", "share-card.html")).href, { waitUntil: "networkidle" });
  await page.evaluate(fill, data);
  await page.evaluate(() => document.fonts.ready);
  const fits = await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight);
  if (!fits) console.warn(`warning: ${name} content overflows; shorten card.title or card.sub in data.json`);
  await page.screenshot({ path: join(root, "share", name) });
  console.log("wrote share/" + name);
}
await browser.close();
