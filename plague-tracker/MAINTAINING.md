# Updating Plague Watch

This is the playbook for every update, whether a person or the scheduled Claude job does it.
Change this file to change what the tracker follows; the schedule just runs it.

- Repo: `nhlebe1/ai-scheduler-platform`, branch `claude/plague-tracker-pixel-app-8eidzx`
- Public site: https://nhlebe1.github.io/ai-scheduler-platform/ (deployed by `.github/workflows/plague-watch-pages.yml` on push)
- claude.ai copy: https://claude.ai/artifact/UqWypVALyHdQjYRuMP6Hzw
- All content: `plague-tracker/data.json`

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
- `timeline`: add one entry per new development (`date`, `kind`, `title`, `body`, `sources`). Newer facts don't erase older entries.
- `figures`: change a value only when a source states the new number; update its `note`. Add a figure (unique `id`) if a new metric matters, e.g. new cases.
- `positions`: refresh when an actor says something new; set its `date`.
- `status`: `level` is `suspected` until an official or WHO statement confirms plague (`confirmed`) or the event is closed out (`resolved`). Update `label` and `summary` to match.
- `headline`: one sentence, the most important current fact.
- `watch.lastExposure`: move it if officials report a new exposure or a new case. If the window has passed with no new cases, say so in `headline`/`summary`.
- `places`: add any new location that matters (`q` is a Google Maps search string).
- `card`: the share image text. Keep `title` under ~40 characters and `sub` under ~150.
- `updated`: set to now (UTC ISO) only when content changed.
- `checked`: always set to now (UTC ISO).

Validate: `python3 -m json.tool plague-tracker/data.json > /dev/null`

## 4. If anything material changed

Material means a new official statement, a changed figure, a status change, a new case or location, or major international action.

1. Re-render share images: `npm i --no-save playwright && node plague-tracker/tools/render-share.mjs`
2. Write `plague-tracker/share/latest-post.md`: one X post of at most 280 characters (links count as 23), factual and calm, that ends with the public site link. Include a one-line note of the sources behind it.

## 5. Publish

1. Commit (`Plague Watch: <what changed>` or `Plague Watch: checked, no change`) and `git push -u origin claude/plague-tracker-pixel-app-8eidzx`. Pushing deploys the public site.
2. Update the claude.ai copy: `python3 plague-tracker/tools/build-artifact.py <scratch dir>`, read the artifact first (Artifact tool, `action: "read"`, its URL), then publish `<scratch dir>/plague-watch.html` with `url` set to the artifact URL and `files: {"data.json": "<scratch dir>/data.json"}`.

## 6. Report

End with a short summary: what changed (or "no change"), the sources, and the draft X post if one was written.
