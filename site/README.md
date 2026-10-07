# Outbreak Ledger

Independent, sourced outbreak trackers, published at https://nhlebe1.github.io/ai-scheduler-platform/
(working name; change it in `site.json`).

| Tracker | Folder | What it covers |
|---|---|---|
| US Measles | `measles/` | 2026 US measles cases by state, outbreaks, year-over-year trend |
| Ebola · DR Congo | `ebola/` | The Bundibugyo Ebola outbreak in DR Congo and neighbours |
| Mpox | `mpox/` | WHO counts for Africa, countries with active transmission, clade Ib spread in Europe and the US |
| Cholera | `cholera/` | 2026 cholera cases and deaths worldwide, by country (WHO, ECDC) |
| Dengue · Europe | `dengue/` | Locally acquired dengue and chikungunya in Europe this season |
| Russia Plague Watch | `plague/` | The suspected plague case in Irkutsk and Russia's natural plague areas |
| Marburg Watch | `marburg/` | Any new Marburg cases in Africa, and the record of Ethiopia's 2025–26 outbreak |

Each tracker is the same app (`app.html`) driven by its own `data.json`. Sections appear only when
their data exists: live countdown, escalation ladder, case counts with day-over-day changes, trend
chart, map (markers or shaded regions), regions table, WHO risk level, claim check, watch list,
timeline with shareable links, context and RSS.

## Updating

Scheduled updates are done by a Claude maintainer session following [MAINTAINING.md](MAINTAINING.md).
By hand: edit `<slug>/data.json`, then

```bash
python3 site/tools/build.py          # validates and generates pages, feeds and trackers.json
```

and push. Pushing to the branch redeploys the site.

## Tools

| Script | What it does |
|---|---|
| `tools/build.py` | Validates every tracker and generates `<slug>/index.html`, feeds and `trackers.json` |
| `tools/check.py` | Validation only (`python3 site/tools/check.py <slug>`) |
| `tools/render-share.mjs` | Share images for X and link previews (`node site/tools/render-share.mjs <slug>`) |
| `tools/build-maps.mjs` | Regenerates map files (only needed to change a map) |

## Run locally

```bash
cd site && python3 -m http.server 8080   # open http://localhost:8080
```

## Install on a phone

Open the site in Chrome, tap ⋮ → **Install app** (or **Add to Home screen**).
