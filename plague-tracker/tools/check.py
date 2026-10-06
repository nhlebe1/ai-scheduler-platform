"""Validates plague-tracker/data.json before anything is published.

    python3 plague-tracker/tools/check.py

Exits non-zero with a list of problems. Run it after every edit to data.json.
"""
import json
import os
import re
import sys
from datetime import datetime

root = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
problems = []


def bad(msg):
    problems.append(msg)


DATE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
KINDS = {"official", "international", "media", "background"}
CLAIM_STATUSES = {"confirmed", "unconfirmed", "disputed", "no-evidence", "denied", "false"}
LEVELS = {"suspected", "confirmed", "resolved"}
TONES = {"critical", "watch", "good", "neutral"}


def is_date(v):
    if not isinstance(v, str) or not DATE.match(v):
        return False
    try:
        datetime.strptime(v, "%Y-%m-%d")
        return True
    except ValueError:
        return False


def is_ts(v):
    try:
        datetime.strptime(v, "%Y-%m-%dT%H:%M:%SZ")
        return True
    except (TypeError, ValueError):
        return False


def check_sources(where, sources, required=True):
    if not sources:
        if required:
            bad(f"{where}: needs at least one source")
        return
    for s in sources:
        if not isinstance(s, dict) or not s.get("name") or not str(s.get("url", "")).startswith("https://"):
            bad(f"{where}: each source needs a name and an https url")


try:
    d = json.load(open(os.path.join(root, "data.json"), encoding="utf-8"))
except Exception as e:  # noqa: BLE001
    print("data.json is not valid JSON:", e)
    sys.exit(1)

for key in ["updated", "checked", "headline", "status", "figures", "watch", "positions", "timeline", "places", "facts", "follow", "card"]:
    if key not in d:
        bad(f"missing top-level key: {key}")

for key in ["updated", "checked"]:
    if key in d and not is_ts(d[key]):
        bad(f"{key} must look like 2026-10-06T21:00:00Z")
if is_ts(d.get("updated")) and is_ts(d.get("checked")) and d["checked"] < d["updated"]:
    bad("checked is earlier than updated")

st = d.get("status", {})
if st.get("level") not in LEVELS:
    bad(f"status.level must be one of {sorted(LEVELS)}")
for k in ["label", "summary"]:
    if not st.get(k):
        bad(f"status.{k} is empty")

ladder = d.get("ladder", [])
if ladder:
    ns = [s.get("n") for s in ladder]
    if ns != list(range(1, len(ladder) + 1)):
        bad("ladder steps must be numbered 1..N in order")
    stage = d.get("stage", {})
    if stage.get("current") not in ns:
        bad("stage.current must match a ladder step")
    if not is_date(stage.get("since")):
        bad("stage.since must be a YYYY-MM-DD date")

ids = set()
for f in d.get("figures", []):
    fid = f.get("id")
    if not fid or fid in ids:
        bad(f"figure id missing or duplicated: {fid}")
    ids.add(fid)
    if f.get("tone") not in TONES:
        bad(f"figure {fid}: tone must be one of {sorted(TONES)}")
    if not isinstance(f.get("value"), (int, float)) and not isinstance(f.get("value"), str):
        bad(f"figure {fid}: value must be a number or text")
    for k in ["label", "note"]:
        if not f.get(k):
            bad(f"figure {fid}: {k} is empty")

hist_dates = []
for h in d.get("history", []):
    if not is_date(h.get("date")):
        bad(f"history entry has a bad date: {h.get('date')}")
    hist_dates.append(h.get("date"))
    for k, v in (h.get("values") or {}).items():
        if k not in ids:
            bad(f"history {h.get('date')}: unknown figure id {k}")
        if not isinstance(v, (int, float)):
            bad(f"history {h.get('date')}: {k} must be a number")
if hist_dates != sorted(hist_dates) or len(hist_dates) != len(set(hist_dates)):
    bad("history must be in date order with one entry per date")

for c in d.get("counters", []):
    if not is_date(c.get("from")):
        bad(f"counter {c.get('id')}: from must be a date")

w = d.get("watch", {})
if not is_date(w.get("lastExposure")) or not isinstance(w.get("incubationDays"), int):
    bad("watch needs lastExposure (date) and incubationDays (integer)")

r = d.get("risk")
if r:
    scale = r.get("scale", [])
    for a in r.get("areas", []):
        if not (0 <= a.get("from", -1) <= a.get("to", -1) < len(scale)):
            bad(f"risk area {a.get('area')}: from/to must index the scale")
    check_sources("risk", r.get("sources"))

for c in d.get("claims", []):
    if c.get("status") not in CLAIM_STATUSES:
        bad(f"claim '{c.get('claim')}': status must be one of {sorted(CLAIM_STATUSES)}")
    check_sources(f"claim '{c.get('claim')}'", c.get("sources"))

for item in d.get("watchlist", []):
    if item.get("status") not in {"pending", "done"}:
        bad(f"watchlist '{item.get('label')}': status must be pending or done")
    if "date" in item and not is_date(item["date"]):
        bad(f"watchlist '{item.get('label')}': bad date")

for p in d.get("positions", []):
    if p.get("kind") not in KINDS or not is_date(p.get("date")):
        bad(f"position '{p.get('who')}': needs a valid kind and date")

tl_ids = set()
for e in d.get("timeline", []):
    where = f"timeline '{e.get('title')}'"
    if not e.get("id") or not re.match(r"^[A-Za-z0-9._~-]+$", e["id"]) or e["id"] in tl_ids:
        bad(f"{where}: id missing, duplicated, or has characters other than letters, digits, . _ ~ -")
    tl_ids.add(e.get("id"))
    if not is_date(e.get("date")):
        bad(f"{where}: bad date")
    if e.get("kind") not in KINDS:
        bad(f"{where}: kind must be one of {sorted(KINDS)}")
    check_sources(where, e.get("sources"))
    if e.get("date", "") > (d.get("checked") or "")[:10]:
        bad(f"{where}: dated after the last check")

for p in d.get("places", []):
    if p.get("map") and (not isinstance(p.get("lat"), (int, float)) or not isinstance(p.get("lon"), (int, float))):
        bad(f"place '{p.get('name')}': map places need lat and lon")

for f in (d.get("foci") or {}).get("items", []):
    if not isinstance(f.get("lat"), (int, float)) or not isinstance(f.get("lon"), (int, float)):
        bad(f"focus '{f.get('name')}': needs lat and lon")

card = d.get("card", {})
if len(card.get("title", "")) > 44:
    bad("card.title is too long for the share image (max ~44 characters)")
if len(card.get("sub", "")) > 160:
    bad("card.sub is too long for the share image (max ~160 characters)")
for sid in card.get("stats", []):
    if sid not in ids:
        bad(f"card.stats references unknown figure {sid}")

text = json.dumps(d, ensure_ascii=False).lower()
for word in ["pandemic", "epidemic"]:
    if word in text and word not in (d.get("allowWords") or []):
        bad(f"the word '{word}' appears; the playbook allows it only if WHO or Russian authorities use it (then add it to allowWords)")

if problems:
    print(f"data.json has {len(problems)} problem(s):")
    for p in problems:
        print(" -", p)
    sys.exit(1)
print(f"data.json OK: {len(d.get('timeline', []))} timeline entries, {len(ids)} figures, updated {d.get('updated')}")
