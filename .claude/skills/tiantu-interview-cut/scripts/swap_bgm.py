#!/usr/bin/env python3
"""Change (or remove) the music of a rendered film in seconds - picture is not re-encoded.

    python3 swap_bgm.py plan.json out/final.mp4 --bgm bgm/other.mp3 [--src-in 3.2] [--level -13] -o out/final_B.mp4
    python3 swap_bgm.py plan.json out/final.mp4 --all bgm/candidates.json     # one version per candidate: _A _B _C
    python3 swap_bgm.py plan.json out/final.mp4 --none -o out/final_nobgm.mp4

Needs out/final.voice.wav + out/final.mix.json, which render.py leaves next to the film.
"""
import argparse, json, os, sys, tempfile
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import run
import audiomix

ap = argparse.ArgumentParser()
ap.add_argument("plan"); ap.add_argument("video")
ap.add_argument("--bgm"); ap.add_argument("--src-in", type=float, default=0); ap.add_argument("--level", type=float, default=-13)
ap.add_argument("--all"); ap.add_argument("--none", action="store_true"); ap.add_argument("-o", "--out")
a = ap.parse_args()
base = os.path.splitext(a.video)[0]
if not os.path.exists(base + ".voice.wav"):
    sys.exit("missing %s.voice.wav - render the film with render.py first" % base)
mx = json.load(open(base + ".mix.json"))
jobs = []
if a.all:
    for k, c in enumerate(json.load(open(a.all, encoding="utf8"))):
        jobs.append(({"src": c["file"], "src_in": c.get("src_in", 0), "level": a.level}, "%s_%s.mp4" % (base, "ABCDEFGH"[k]), c.get("title")))
elif a.none:
    jobs.append((None, a.out or base + "_nobgm.mp4", "no music"))
elif a.bgm:
    jobs.append(({"src": a.bgm, "src_in": a.src_in, "level": a.level}, a.out or base + "_bgm.mp4", os.path.basename(a.bgm)))
else:
    sys.exit("give --bgm, --all or --none")
tmp = tempfile.mkdtemp()
for bgm, out, name in jobs:
    snd = os.path.join(tmp, "s.m4a")
    audiomix.mix(base + ".voice.wav", mx["voice_lufs"], bgm, mx["total"], mx["ending"], snd)
    run(["ffmpeg", "-v", "error", "-y", "-i", a.video, "-i", snd, "-map", "0:v", "-map", "1:a", "-c", "copy", "-movflags", "+faststart", out])
    print("wrote %s  (%s)" % (out, name))
