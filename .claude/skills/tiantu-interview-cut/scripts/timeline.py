#!/usr/bin/env python3
"""Print the output timeline of a plan: when each cue lands, which shot/title covers it.

    python3 timeline.py plan.json
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *
plan = load_plan(sys.argv[1])
cf, body, endf = timeline(plan)
own, tit = {}, {}
for si, (s, a, b) in enumerate(shot_ranges(plan) if plan.get("shots") else []):
    for i in range(a, b + 1):
        own[i] = "%2d %s" % (si, ("A:" + s.get("framing", "wide")) if s.get("type", "aroll") == "aroll" else "B:" + os.path.basename(s.get("src", "?")))
for t in plan.get("titles", []):
    for i in range(t["cues"][0], t["cues"][1] + 1):
        tit[i] = "T[" + "/".join(l["text"] for l in t["lines"]) + "]"
br = {r[3] for r in runs(plan)[1:]}
for i, c in enumerate(plan["cues"]):
    print("%3d %6.2f-%6.2f %s %-24s %-28s %s" % (i, cf[i][0] / FPS, cf[i][1] / FPS, "✂" if i in br else " ",
          c.get("text", "") + ("  *" + ",".join(c["kw"]) if c.get("kw") else ""), own.get(i, "-- no shot --"), tit.get(i, "")))
print("talk %.2fs + ending %.2fs = %.2fs" % (body / FPS, endf / FPS, (body + endf) / FPS))
