# Russia Plague Watch

A small installable web app (PWA) for Android/Pixel that tracks the suspected
plague case in Irkutsk Oblast and plague activity in Russia.

- **Status**: official position, case counts, and a 7-day incubation watch
- **Timeline**: dated events, each linked to its sources, with "NEW" badges since your last visit
- **Places**: hospital, institute and natural plague foci, with Open in Maps links
- **Learn**: plague basics and links to live coverage

All content lives in `data.json`. To update the tracker, edit that file and redeploy.

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
