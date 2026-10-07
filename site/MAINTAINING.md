# Updating Outbreak Ledger

The playbook for every update, whether a person or the scheduled Claude maintainer does it.
Change this file to change what the trackers follow; the schedule just runs it.

- Repo: `nhlebe1/ai-scheduler-platform`, branch `claude/plague-tracker-pixel-app-8eidzx`, folder `site/`
- Public site: https://nhlebe1.github.io/ai-scheduler-platform/ (deployed on every push by `.github/workflows/plague-watch-pages.yml`)
- Trackers are listed in `site/site.json`. Each lives in `site/<slug>/` with its own `data.json`.
- `site/<slug>/index.html`, `feed.xml`, `site/trackers.json` and `site/feed.xml` are generated. Never edit them by hand.

## 0. Who runs this

Routines on the owner's account wake the main Claude Code session that built the site (it has this repo
checked out with push access). That session hands each update to a Sonnet subagent following this
playbook, then checks the subagent's commit before telling the owner about anything material.
Fresh routine sessions can't push to this repo, and other sessions rightly ignore instructions relayed
between sessions, so keep updates in that main session.

## 1. Get the latest code

```bash
git fetch origin claude/plague-tracker-pixel-app-8eidzx
git checkout claude/plague-tracker-pixel-app-8eidzx
git pull --ff-only origin claude/plague-tracker-pixel-app-8eidzx
```

## 2. Research what changed since each tracker's `checked` time

Source priority:
1. Official: national health agencies (CDC, Rospotrebnadzor, DRC Ministry of Health, Uganda MoH, Italy's ISS, Santé publique France, Ethiopia and Madagascar health ministries), WHO (Disease Outbreak News, situation reports, AFRO bulletins), ECDC, Africa CDC, UNICEF, state and regional health departments
2. Major outlets: Reuters, AP, AFP, BBC, NBC, CNN, CNBC, ABC, CBS, CIDRAP, STAT, Health Policy Watch, The Moscow Times, Meduza, Euronews, RFE/RL
3. Social media and single anonymous sources: only as "Media report", only when a major outlet carries them

Many sites block direct fetching; search-result snippets are fine when two independent outlets agree.

Per-tracker search starters:
- **plague**: `Irkutsk plague`, `Russia plague contacts`, `WHO Russia plague`, `чума Иркутск`, `Роспотребнадзор чума`, `чума Алтай Тыва`
- **measles**: `CDC measles cases 2026`, `measles outbreak <state> 2026`, `measles death 2026`, `measles elimination status United States`. CDC updates its national count on Wednesdays.
- **ebola**: `Ebola Bundibugyo DRC cases`, `WHO Ebola Democratic Republic of the Congo situation report`, `Ebola Uganda 2026`, `Africa CDC Ebola`, `Ebola vaccine trial Bundibugyo`
- **mpox**: `WHO mpox multi-country external situation report`, `mpox Madagascar cases`, `Africa CDC mpox`, `ECDC mpox monthly clade I`, `CDC clade I mpox United States`. WHO and ECDC publish about monthly; the Africa figures are WHO's six-week counts, so replace all of them together from one report.
- **cholera**: `WHO multi-country cholera situation report`, `WHO Weekly Epidemiological Record cholera`, `ECDC cholera worldwide overview`, `NCDC cholera Nigeria`, `cholera DR Congo`, `Afghanistan acute watery diarrhoea WHO`. WHO's global totals come monthly; country totals in `regions` carry their own dates in each note.
- **dengue**: `dengue autoctono ISS bollettino`, `dengue autochtone Santé publique France`, `ECDC locally acquired dengue Europe`, `chikungunya autoctono`, `Vicenza dengue`. Italy (ISS) and France (Santé publique France) update weekly through the season, which ends with the first cold weather (usually November).
- **marburg**: `Marburg virus`, `Marburg WHO Disease Outbreak News`, `Africa CDC Marburg`, `Marburg Uganda`, `Marburg Ethiopia`. No outbreak is active. If one is confirmed, set `status` to `confirmed`, add a timeline entry, and put the new outbreak's numbers in `figures` (keep Ethiopia's record in the timeline and context).

## 3. Edit `site/<slug>/data.json`

Rules that protect credibility:
- Every new fact needs a source link. Numbers need an official statement or two independent outlets.
- Attribute claims ("officials said", "media report"). Never state a disputed claim as fact.
- Do not name patients or people who died unless they are public figures.
- Never call something an epidemic, outbreak or pandemic unless WHO or national authorities do. (The measles, Ebola, mpox, cholera, dengue and Marburg outbreaks named on the site are officially called outbreaks; that's fine.)
- No speculation, no fear language, no medical advice beyond the disclaimer.
- Keep the existing JSON shape. Valid `kind` values: `official`, `international`, `media`, `background`.

What to update:
- `timeline`: one entry per new development (`id`, `date`, `kind`, `title`, `body`, `sources`). `id` is `<date>-<first words of title, lowercase, hyphenated>` and never changes once published.
- `figures`: change a value only when a source states the new number; update its `note`.
- `history`: one snapshot per date of the numeric figures. Add today's snapshot when any figure changes (or update today's). The app shows "+N since <date>" from the last two snapshots.
- `trend.series`: append the new data point when the source publishes one (e.g. a new weekly total).
- `regions.values`: per-region numbers (or `true` in flag mode). Names must match the map exactly; `tools/check.py` catches typos. Update `regions.asOf`.
- `claims`, `watchlist`, `positions`, `risk`, `stage`, `counters`: as described by their contents; mark watchlist items `done` with a date when they happen.
- `status`: `level` + `label` + `summary`. Levels: `suspected`, `confirmed`, `resolved`, `active`, `growing`, `slowing`, `watch`.
- `headline`: one sentence, the most important current fact.
- `card`: share image text. `title` under ~40 characters, `sub` under ~150.
- `postExtra`: optional short sentence appended to "Copy today's update".
- `updated`: set to now (UTC, `2026-10-07T12:00:00Z` format) only when content changed. `checked`: always set to now.

## 4. Build and validate

```bash
python3 site/tools/build.py
```

It validates every tracker and stops with a list of problems. Fix them all before committing.

## 5. If anything material changed

Material: a new official statement, a changed figure, a status change, a new case or location, major international action.

1. Re-render that tracker's share images: `npm i --no-save playwright && node site/tools/render-share.mjs <slug>`
2. Write `site/<slug>/share/latest-post.md`: one X post of at most 280 characters (links count as 23), factual and calm, ending with the tracker's link (`https://nhlebe1.github.io/ai-scheduler-platform/<slug>/`). Add a one-line note of its sources.

## 6. Publish

Commit (`<Tracker>: <what changed>` or `Trackers: checked, no change`) and `git push -u origin claude/plague-tracker-pixel-app-8eidzx`. Pushing deploys the site.

## 7. Report

End with a short summary per tracker: what changed (or "no change") and the sources. If you wrote a post, include it.

## Adding a tracker

1. Create `site/<slug>/data.json` (copy the shape of an existing tracker) and add the slug to `site/site.json`.
2. For a map: add a builder to `site/tools/build-maps.mjs` and run it (`kind: "regions"` for a choropleth, `"points"` for markers).
3. Run `python3 site/tools/build.py`, then `node site/tools/render-share.mjs <slug>`.
4. Add search starters for it to step 2 above.
