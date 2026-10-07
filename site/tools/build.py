"""Builds the site from data. Run after every data change, before committing.

    python3 site/tools/build.py

For each tracker listed in site/site.json it:
  - validates <slug>/data.json (tools/check.py) and stops on problems
  - writes <slug>/index.html from app.html, filling in the page title, description and preview tags
  - writes <slug>/feed.xml (Atom) from the timeline
Then it writes trackers.json (read by the hub page), feed.xml (all trackers combined) and sitemap.xml.
"""
import html
import json
import os
import sys
from xml.sax.saxutils import escape

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from check import check_tracker  # noqa: E402

SITE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")


def attr(s):
    return escape(s, {'"': "&quot;"})


def feed(title, subtitle, link, updated, entries):
    parts = [
        '<?xml version="1.0" encoding="utf-8"?>',
        '<feed xmlns="http://www.w3.org/2005/Atom">',
        f"  <title>{escape(title)}</title>",
        f"  <subtitle>{escape(subtitle)}</subtitle>",
        f'  <link href="{attr(link)}"/>',
        f'  <link rel="self" href="{attr(link)}feed.xml"/>',
        f"  <id>{escape(link)}</id>",
        f"  <updated>{escape(updated)}</updated>",
        f"  <author><name>{escape(title)}</name></author>",
    ]
    for e, url, prefix in entries:
        sources = ", ".join(f'<a href="{attr(s["url"])}">{escape(s["name"])}</a>' for s in e.get("sources", []))
        body = f"<p>{escape(e['body'])}</p><p>Sources: {sources}</p>"
        parts += [
            "  <entry>",
            f"    <title>{escape(prefix + e['title'])}</title>",
            f'    <link href="{attr(url)}#{attr(e["id"])}"/>',
            f"    <id>{escape(url)}#{escape(e['id'])}</id>",
            f"    <updated>{escape(e['date'])}T12:00:00Z</updated>",
            f"    <category term=\"{attr(e['kind'])}\"/>",
            f"    <summary>{escape(e['body'])}</summary>",
            f'    <content type="html">{escape(body)}</content>',
            "  </entry>",
        ]
    parts.append("</feed>")
    return "\n".join(parts) + "\n"


def main():
    site = json.load(open(os.path.join(SITE, "site.json"), encoding="utf-8"))
    base = site["siteUrl"].rstrip("/") + "/"
    app = open(os.path.join(SITE, "app.html"), encoding="utf-8").read()
    failed = False
    hub, combined = [], []
    for slug in site["trackers"]:
        problems = check_tracker(slug)
        if problems:
            failed = True
            print(f"{slug}: {len(problems)} problem(s), not built")
            for p in problems:
                print("  -", p)
            continue
        d = json.load(open(os.path.join(SITE, slug, "data.json"), encoding="utf-8"))
        m = d["meta"]
        url = base + slug + "/"
        page = app
        for key, val in {
            "SLUG": slug, "TITLE": m["title"], "DESCRIPTION": m["description"], "URL": url,
            "IMAGE": url + "share/og-image.png", "SITE_NAME": site["name"], "SHORT": m["short"],
        }.items():
            page = page.replace("{{" + key + "}}", html.escape(val, quote=True))
        if "{{" in page:
            print(f"{slug}: unfilled template placeholder in app.html")
            failed = True
        with open(os.path.join(SITE, slug, "index.html"), "w", encoding="utf-8") as f:
            f.write(page)
        entries = sorted(d["timeline"], key=lambda e: e["date"], reverse=True)
        with open(os.path.join(SITE, slug, "feed.xml"), "w", encoding="utf-8") as f:
            f.write(feed(m["title"], m["description"], url, d["updated"], [(e, url, "") for e in entries[:30]]))
        combined += [(e, url, m["short"] + ": ") for e in entries[:15]]
        figs = {x["id"]: x for x in d["figures"]}
        hub.append({
            "slug": slug, "url": slug + "/", "title": m["title"], "short": m["short"], "description": m["description"],
            "status": d["status"], "headline": d["headline"], "updated": d["updated"], "checked": d.get("checked", d["updated"]),
            "figures": [{"label": figs[i]["label"], "value": figs[i]["value"], "unit": figs[i].get("unit", ""), "tone": figs[i]["tone"]}
                        for i in m.get("hubFigures", []) if i in figs],
            "latest": [{"date": e["date"], "title": e["title"], "id": e["id"]} for e in entries[:2]],
        })
        print(f"{slug}: built ({len(d['timeline'])} timeline entries)")
    with open(os.path.join(SITE, "trackers.json"), "w", encoding="utf-8") as f:
        json.dump({"site": {"name": site["name"], "tagline": site["tagline"], "social": site.get("social", {})}, "trackers": hub}, f, ensure_ascii=False, indent=2)
    combined.sort(key=lambda t: t[0]["date"], reverse=True)
    newest = max((t["updated"] for t in hub), default="1970-01-01T00:00:00Z")
    with open(os.path.join(SITE, "feed.xml"), "w", encoding="utf-8") as f:
        f.write(feed(site["name"], site["tagline"], base, newest, combined[:40]))
    urls = [(base, newest)] + [(base + t["slug"] + "/", t["updated"]) for t in hub]
    with open(os.path.join(SITE, "sitemap.xml"), "w", encoding="utf-8") as f:
        f.write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n')
        for loc, mod in urls:
            f.write(f"  <url><loc>{escape(loc)}</loc><lastmod>{escape(mod[:10])}</lastmod><changefreq>daily</changefreq></url>\n")
        f.write("</urlset>\n")
    print("trackers.json, feed.xml and sitemap.xml written")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
