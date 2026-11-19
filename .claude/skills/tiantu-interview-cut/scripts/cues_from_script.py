#!/usr/bin/env python3
"""Paper edit (script.txt) + transcript.json -> cues.json with exact in/out times.

    python3 cues_from_script.py work/transcript.json work/script.txt -o work/cues.json

Each line's first column must be characters exactly as the ASR heard them (punctuation ignored);
the script finds them in the recording and reads the times off the per-character timestamps.
Consecutive lines that are also consecutive in the recording share their boundary (seamless);
everything else becomes a cut, padded a few hundredths so no syllable is clipped.
"""
import argparse, json, re, sys

ap = argparse.ArgumentParser()
ap.add_argument("transcript"); ap.add_argument("script")
ap.add_argument("-o", "--out", default="work/cues.json")
a = ap.parse_args()
P = re.compile(r"[，。！？、；：,.!?;:…\s]")

# flat character stream with interpolated times
chars = []                                   # (char, start, end, src)
for seg in json.load(open(a.transcript, encoding="utf8")):
    for w in seg["words"]:
        t = P.sub("", w["w"])
        if not t:
            continue
        d = (w["e"] - w["s"]) / len(t)
        for k, ch in enumerate(t):
            chars.append((ch.lower(), w["s"] + k * d, w["s"] + (k + 1) * d, seg["src"]))
stream = "".join(c[0] for c in chars)

cues, ptr, bad = [], 0, 0
for ln, raw in enumerate(open(a.script, encoding="utf8"), 1):
    raw = raw.strip()
    if not raw or raw.startswith("#"):
        continue
    col = [c.strip() for c in raw.split("|")]
    key = P.sub("", col[0]).lower()
    if not key:
        continue
    i = stream.find(key, ptr)
    if i < 0:
        i = stream.find(key)                  # re-ordered line
    if i < 0:
        print("line %d: '%s' not found in the transcript - column 1 must keep the ASR characters" % (ln, col[0]))
        bad += 1
        continue
    j = i + len(key) - 1
    text = P.sub("", col[1]) if len(col) > 1 and col[1] else P.sub("", col[0])
    kw = [k.strip() for k in re.split("[,，]", col[2]) if k.strip()] if len(col) > 2 else []
    cues.append({"src": chars[i][3], "in": chars[i][1], "out": chars[j][2], "text": text, "kw": kw, "_i": i, "_j": j})
    ptr = j + 1
if bad:
    sys.exit("%d lines could not be aligned" % bad)

for k, c in enumerate(cues):
    p = cues[k - 1] if k else None
    if p and p["_j"] + 1 == c["_i"] and p["src"] == c["src"] and c["in"] - p["out"] < 0.35:
        mid = (p["out"] + c["in"]) / 2        # seamless: share the boundary
        p["out"] = c["in"] = mid
    else:
        lo = chars[c["_i"] - 1][2] if c["_i"] and chars[c["_i"] - 1][3] == c["src"] else 0
        c["in"] = max(c["in"] - 0.06, min(lo, c["in"]), 0)
        if p:
            hi = chars[p["_j"] + 1][1] if p["_j"] + 1 < len(chars) and chars[p["_j"] + 1][3] == p["src"] else p["out"] + 1
            p["out"] = min(p["out"] + 0.12, max(hi, p["out"]))
if cues:
    cues[-1]["out"] += 0.15
for k, c in enumerate(cues):
    c.pop("_i"); c.pop("_j")
    c["in"], c["out"] = round(c["in"], 3), round(c["out"], 3)
    if not c["kw"]:
        c.pop("kw")
    cut = k and not (cues[k - 1]["src"] == c["src"] and abs(cues[k - 1]["out"] - c["in"]) < 0.03)
    print("%3d %s %7.2f-%7.2f %4.1fs  %s%s" % (k, "✂" if cut else " ", c["in"], c["out"], c["out"] - c["in"], c["text"],
                                             "  *" + ",".join(c["kw"]) if c.get("kw") else ""))
json.dump(cues, open(a.out, "w", encoding="utf8"), ensure_ascii=False, indent=0)
print("wrote %s: %d cues, %.1fs of speech (✂ = cut in the picture: change shot there)" % (a.out, len(cues), sum(c["out"] - c["in"] for c in cues)))
