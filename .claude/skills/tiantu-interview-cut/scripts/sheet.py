#!/usr/bin/env python3
"""Contact sheet with timecodes -- how the AI editor 'watches' footage.

    python3 sheet.py clip.mp4 [-o sheet.jpg] [--fps 1] [--cols 8] [--start 0 --dur 30]

Look at the sheet with the Read tool. Use it on A-roll (framing, face position),
on every B-roll candidate (pick src_in, reject watermarks/text/low quality) and
on the final film (compare with assets/reference/*.jpg).
"""
import argparse, os, subprocess, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import probe

ap = argparse.ArgumentParser()
ap.add_argument("video")
ap.add_argument("-o", "--out")
ap.add_argument("--fps", type=float, default=1)
ap.add_argument("--cols", type=int, default=8)
ap.add_argument("--start", type=float, default=0)
ap.add_argument("--dur", type=float, default=0)
ap.add_argument("--width", type=int, default=240)
a = ap.parse_args()
inf = probe(a.video)
dur = a.dur or max(inf["duration"] - a.start, 0.1)
n = max(int(dur * a.fps), 1)
rows = min((n + a.cols - 1) // a.cols, 6)
out = a.out or os.path.splitext(a.video)[0] + "_sheet.jpg"
vf = ("fps=%s,scale=%d:-2,drawtext=text='%%{pts\\:hms}':x=4:y=4:fontsize=16:fontcolor=yellow:box=1:boxcolor=black@0.6,"
      "tile=%dx%d" % (a.fps, a.width, a.cols, rows))
pat = out if n <= a.cols * rows else out.replace(".jpg", "_%02d.jpg")
subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", str(a.start), "-t", str(dur), "-copyts", "-i", a.video,
                "-vf", vf, "-q:v", "4"] + (["-frames:v", "1"] if pat == out else []) + [pat], check=True)
print("wrote", pat, "| %dx%d %.1fs %.0ffps" % (inf.get("width", 0), inf.get("height", 0), inf["duration"], inf.get("fps", 0)))
