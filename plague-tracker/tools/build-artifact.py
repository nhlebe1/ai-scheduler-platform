"""Builds the claude.ai Artifact copy of the app.

    python3 plague-tracker/tools/build-artifact.py OUT_DIR

Writes OUT_DIR/plague-watch.html (index.html without the document wrapper, which the
Artifact host adds itself) and OUT_DIR/data.json. Publish plague-watch.html with
data.json as a supporting file.
"""
import os
import re
import shutil
import sys

root = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
out = sys.argv[1]
os.makedirs(out, exist_ok=True)
src = open(os.path.join(root, "index.html"), encoding="utf-8").read()
head = re.search(r"<head>(.*?)</head>", src, re.S).group(1)
body = re.search(r"<body>(.*?)</body>", src, re.S).group(1)
keep = [re.search(r"<title>.*?</title>", head).group(0)]
keep += re.findall(r'<link rel="(?:preconnect|stylesheet)"[^>]*>', head)
keep.append(re.search(r"<style>.*?</style>", head, re.S).group(0))
with open(os.path.join(out, "plague-watch.html"), "w", encoding="utf-8") as f:
    f.write("\n".join(keep) + "\n" + body.strip() + "\n")
shutil.copy(os.path.join(root, "data.json"), os.path.join(out, "data.json"))
print("wrote", os.path.join(out, "plague-watch.html"), "and data.json")
