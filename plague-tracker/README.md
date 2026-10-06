# Russia Plague Watch

A small installable web app (PWA) for Android/Pixel that tracks the suspected
plague case in Irkutsk Oblast and plague activity in Russia.

- **Today**: live incubation countdown, days-since counters, "since your last visit" changes,
  escalation-stage ladder, case counts with day-over-day changes, WHO risk levels, a map,
  a claim-check board, what to watch next, and who says what
- **Timeline**: dated, sourced entries with shareable links to each update
- **Map**: the case location and Russia's 11 natural plague areas
- **Context**: how rare plague is, Russia's recent cases, plague basics, RSS feed and open data

All content lives in `data.json`. A scheduled Claude job checks the news and updates it, following
[MAINTAINING.md](MAINTAINING.md). Pushing to the branch redeploys the public site:
https://nhlebe1.github.io/ai-scheduler-platform/

## Run locally

```bash
cd plague-tracker
python3 -m http.server 8080
# open http://localhost:8080
```

## Install on a Pixel

The app must be served over HTTPS to install. Any static host works
(GitHub Pages, Netlify, Cloudflare Pages, Vercel): publish the `plague-tracker/`
folder as-is, no build step.

1. Open the site in Chrome on the phone.
2. Tap the ⋮ menu, then **Install app** (or **Add to Home screen**).
3. Launch "Plague Watch" from the home screen. It opens full-screen and works offline with the last data it loaded.

## Share publicly

- `share/share-card-x.png`: 16:9 image to attach to posts on X and elsewhere
- `share/og-image.png`: link-preview image (1200×630) used by the `og:image` tag
- `share/post-copy.md`: ready-to-paste text for X, LinkedIn/Facebook and Reddit

`tools/render-share.mjs` redraws both images from `data.json`.

## Tools

| Script | What it does |
|---|---|
| `tools/check.py` | Validates `data.json` (run after every edit) |
| `tools/build-feed.py` | Writes `feed.xml` (Atom) from the timeline |
| `tools/render-share.mjs` | Redraws the share images from `data.json` |
| `tools/build-artifact.py` | Builds the claude.ai copy of the app |
| `tools/build-map.mjs` | Regenerates `map.json` (only needed to change the map) |

If you move the site to another address, update `og:url` and `og:image` in `index.html`
(they must be absolute URLs for X and Facebook previews).

No GitHub needed: drag the `plague-tracker/` folder onto Netlify Drop
(https://app.netlify.com/drop) or Cloudflare Pages "Upload assets" to get an HTTPS URL in about a minute.
