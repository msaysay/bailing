#!/usr/bin/env python3
"""transcript.json -> editable paper edit (work/script.txt).

    python3 draft_script.py work/transcript.json -o work/script.txt [--max 10]

One line = one subtitle = one cut unit:

    ASR原文 | 字幕文本(改错别字后) | 关键词,关键词

Only the first column is required. The editor (you) then
  * deletes lines        -> that speech is cut out
  * reorders lines       -> the speech is re-ordered
  * re-breaks lines      -> move characters between neighbouring lines (keep the ASR characters!)
  * fixes column 2, adds keywords in column 3
then runs cues_from_script.py. Lines starting with # are comments.
"""
import argparse, json, re

ap = argparse.ArgumentParser()
ap.add_argument("transcript")
ap.add_argument("-o", "--out", default="work/script.txt")
ap.add_argument("--max", type=int, default=10)
a = ap.parse_args()
P = re.compile(r"[，。！？、；：,.!?;:…\s]")
lines = []
for seg in json.load(open(a.transcript, encoding="utf8")):
    lines.append("# [%s %.1f-%.1f]" % (seg["src"], seg["start"], seg["end"]))
    cur = []

    def flush():
        global cur
        t = P.sub("", "".join(w["w"] for w in cur))
        if t:
            lines.append(t)
        cur = []

    ws = seg["words"]
    for i, w in enumerate(ws):
        n = len(P.sub("", "".join(x["w"] for x in cur)))
        glue = cur and re.search(r"[A-Za-z0-9%]$", cur[-1]["w"]) and re.match(r"[A-Za-z0-9%]", w["w"])
        if cur and not glue and (w["s"] - cur[-1]["e"] > 0.3 or n + len(P.sub("", w["w"])) > a.max):
            flush()
        cur.append(w)
        if w["w"] and P.search(w["w"][-1]):
            flush()
    flush()
open(a.out, "w", encoding="utf8").write("\n".join(lines) + "\n")
print("\n".join(lines))
print("# wrote %s - now edit it (delete / re-break / correct / keywords)" % a.out)
