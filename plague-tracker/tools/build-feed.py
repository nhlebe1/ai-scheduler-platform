"""Writes plague-tracker/feed.xml (Atom) from the timeline in data.json.

    python3 plague-tracker/tools/build-feed.py

Run after every content update so feed readers (and any auto-posting tools) see new entries.
"""
import json
import os
from xml.sax.saxutils import escape

root = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
d = json.load(open(os.path.join(root, "data.json"), encoding="utf-8"))
site = d.get("siteUrl", "").rstrip("/") + "/"


def attr(s):
    return escape(s, {'"': "&quot;"})


entries = sorted(d["timeline"], key=lambda e: e["date"], reverse=True)[:30]
parts = [
    '<?xml version="1.0" encoding="utf-8"?>',
    '<feed xmlns="http://www.w3.org/2005/Atom">',
    "  <title>Russia Plague Watch</title>",
    "  <subtitle>Independent, sourced updates on the suspected plague case in Irkutsk, Russia.</subtitle>",
    f'  <link href="{attr(site)}"/>',
    f'  <link rel="self" href="{attr(site)}feed.xml"/>',
    f"  <id>{escape(site)}</id>",
    f"  <updated>{escape(d['updated'])}</updated>",
    "  <author><name>Russia Plague Watch</name></author>",
]
for e in entries:
    sources = ", ".join(f'<a href="{attr(s["url"])}">{escape(s["name"])}</a>' for s in e.get("sources", []))
    html = f"<p>{escape(e['body'])}</p><p>Sources: {sources}</p>"
    parts += [
        "  <entry>",
        f"    <title>{escape(e['title'])}</title>",
        f'    <link href="{attr(site)}#{attr(e["id"])}"/>',
        f"    <id>{escape(site)}#{escape(e['id'])}</id>",
        f"    <updated>{escape(e['date'])}T12:00:00Z</updated>",
        f"    <category term=\"{attr(e['kind'])}\"/>",
        f"    <summary>{escape(e['body'])}</summary>",
        f'    <content type="html">{escape(html)}</content>',
        "  </entry>",
    ]
parts.append("</feed>")
with open(os.path.join(root, "feed.xml"), "w", encoding="utf-8") as f:
    f.write("\n".join(parts) + "\n")
print(f"wrote feed.xml with {len(entries)} entries")
