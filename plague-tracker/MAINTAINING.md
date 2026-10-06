# Updating Plague Watch

This is the playbook for every update, whether a person or the scheduled Claude job does it.
Change this file to change what the tracker follows; the schedule just runs it.

- Repo: `nhlebe1/ai-scheduler-platform`, branch `claude/plague-tracker-pixel-app-8eidzx`
- Public site: https://nhlebe1.github.io/ai-scheduler-platform/ (deployed by `.github/workflows/plague-watch-pages.yml` on push)
- claude.ai copy: https://claude.ai/artifact/UqWypVALyHdQjYRuMP6Hzw
- All content: `plague-tracker/data.json`

## 0. Repo access (scheduled runs)

If the repo is not in your working directory, attach it first. The tool is deferred: load it with
ToolSearch (`select:mcp__claude-code-remote__add_repo`), call it with owner `nhlebe1`, repo
`ai-scheduler-platform`, access `push`, then run the clone command it returns.

## 1. Get the latest code

```bash
git fetch origin claude/plague-tracker-pixel-app-8eidzx
git checkout claude/plague-tracker-pixel-app-8eidzx
git pull --ff-only origin claude/plague-tracker-pixel-app-8eidzx
```

## 2. Research what changed since `checked` in data.json

Search in English and Russian. Useful queries:
- `Irkutsk plague`, `Irkutsk anti-plague institute`, `Russia plague contacts`, `WHO Russia plague`
- `чума Иркутск`, `Роспотребнадзор чума`, `Шелехов больница карантин`, `противочумный институт Иркутск`
- Wider Russia: `plague Russia Altai`, `чума Алтай Тыва 2026`, `Sailyugem plague`

Source priority:
1. Official: Rospotrebnadzor, Irkutsk regional government, WHO, ECDC, US CDC/State Dept, EU Commission
2. Major outlets: Reuters, AP, AFP, BBC, NBC, CNN, CNBC, The Moscow Times, Meduza, Euronews, RFE/RL, Novaya Gazeta
3. Telegram channels and single anonymous sources: only as "Media report", only when a major outlet carries them

Many sites block direct fetching; search-result snippets are fine when two independent outlets agree.

## 3. Edit data.json

Rules that protect the tracker's credibility:
- Every new fact needs a source link. Numbers need an official statement or two independent outlets.
- Attribute claims ("officials said", "media report"). Never state a disputed claim as fact.
- Do not name the deceased worker or any patient.
- Never call it an epidemic, outbreak or pandemic unless WHO or Russian authorities do.
- No speculation, no fear language, no medical advice beyond the existing disclaimer.
- Keep the existing JSON shape. Valid `kind` values: `official`, `international`, `media`, `background`.

What to update:
- `timeline`: add one entry per new development (`id`, `date`, `kind`, `title`, `body`, `sources`). Newer facts don't erase older entries.
  `id` is `<date>-<first words of the title, lowercase, hyphenated>` (letters, digits and hyphens only) and never changes once published: people share links to it.
- `figures`: change a value only when a source states the new number; update its `note`. Add a figure (unique `id`) if a new metric matters, e.g. new cases.
- `history`: keep one snapshot per date of the numeric figures (`{"date": "...", "values": {"contacts": 197, ...}}`). Add today's snapshot when any figure changes, or update today's if it already exists. The app shows "+N since <date>" from the last two snapshots.
- `positions`: refresh when an actor says something new; set its `date`.
- `claims`: the claim-check board. Update a claim's `status` (`confirmed`, `unconfirmed`, `disputed`, `no-evidence`, `denied`, `false`) and `detail` when new evidence lands; add claims that are spreading widely online. Every claim needs sources.
- `watchlist`: things readers should watch for. Mark an item `done` (with its `date`) when it happens; add new pending items as they come up.
- `risk`: WHO's risk levels. Update only from a WHO statement; `from`/`to` index into `scale`.
- `stage`: the escalation ladder. Move `current` only when the step's test in `ladder` is met by an official or WHO statement; set `since` to that date.
- `counters`: `no-new-cases` counts from the most recent new case. If officials report a new case, set its `from` to that date.
- `status`: `level` is `suspected` until an official or WHO statement confirms plague (`confirmed`) or the event is closed out (`resolved`). Update `label` and `summary` to match.
- `headline`: one sentence, the most important current fact.
- `watch.lastExposure`: move it if officials report a new exposure or a new case. If the window has passed with no new cases, say so in `headline`/`summary`.
- `places`: add any new location that matters (`q` is a Google Maps search string; `lat`/`lon` and `"map": true` put it on the map).
- `card`: the share image text. Keep `title` under ~40 characters and `sub` under ~150.
- `updated`: set to now (UTC ISO) only when content changed.
- `checked`: always set to now (UTC ISO).

Validate, and fix everything it reports before going on:

```bash
python3 plague-tracker/tools/check.py
python3 plague-tracker/tools/build-feed.py
```

## 4. If anything material changed

Material means a new official statement, a changed figure, a status change, a new case or location, or major international action.

1. Re-render share images: `npm i --no-save playwright && node plague-tracker/tools/render-share.mjs`
2. Write `plague-tracker/share/latest-post.md`: one X post of at most 280 characters (links count as 23), factual and calm, that ends with the public site link. Include a one-line note of the sources behind it.

## 5. Publish

1. Commit (`Plague Watch: <what changed>` or `Plague Watch: checked, no change`) and `git push -u origin claude/plague-tracker-pixel-app-8eidzx`. Pushing deploys the public site.
2. Update the claude.ai copy: `python3 plague-tracker/tools/build-artifact.py <scratch dir>`, read the artifact first (Artifact tool, `action: "read"`, its URL), then publish `<scratch dir>/plague-watch.html` with `url` set to the artifact URL and `files: {"data.json": "<scratch dir>/data.json", "map.json": "<scratch dir>/map.json"}`.

## 6. Report

End with a short summary: what changed (or "no change"), the sources, and the draft X post if one was written.

## Changing the app itself

- `index.html` is the whole app (no build step). `map.json` is generated by `tools/build-map.mjs`.
- After any change, run `tools/check.py`, open the site locally (`python3 -m http.server` in `plague-tracker/`), and check phone width.
