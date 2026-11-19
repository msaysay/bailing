#!/usr/bin/env python3
"""Turn a still (photo / AI-generated key frame) into a moving 9:16 B-roll clip.

    python3 still_to_clip.py img.png -o broll/x.mp4 [--dur 4] [--move push|pull|left|right|up|down] [--amount 0.10]

Slow, linear, no bounce: the SOP forbids flashy motion. Minimum source: 1080px on the short side.
"""
import argparse, os, subprocess
ap = argparse.ArgumentParser()
ap.add_argument("image"); ap.add_argument("-o", "--out", required=True)
ap.add_argument("--dur", type=float, default=4.0)
ap.add_argument("--move", default="push", choices=["push", "pull", "left", "right", "up", "down"])
ap.add_argument("--amount", type=float, default=0.10)
ap.add_argument("--focus", default="0.5,0.5", help="x,y focus (0..1) for push/pull")
a = ap.parse_args()
W, H, FPS = 1080, 1920, 30
n = int(a.dur * FPS); fx, fy = map(float, a.focus.split(","))
k = a.amount
if a.move in ("push", "pull"):
    z = "1+%f*on/%d" % (k, n) if a.move == "push" else "1+%f-%f*on/%d" % (k, k, n)
    x, y = "(iw-iw/zoom)*%f" % fx, "(ih-ih/zoom)*%f" % fy
else:
    z = str(1 + k)
    t = "on/%d" % n
    x = {"left": "(iw-iw/zoom)*(1-%s)" % t, "right": "(iw-iw/zoom)*%s" % t}.get(a.move, "(iw-iw/zoom)/2")
    y = {"up": "(ih-ih/zoom)*(1-%s)" % t, "down": "(ih-ih/zoom)*%s" % t}.get(a.move, "(ih-ih/zoom)/2")
vf = ("scale=%d:%d:force_original_aspect_ratio=increase,crop=%d:%d,"
      "zoompan=z='%s':x='%s':y='%s':d=%d:s=%dx%d:fps=%d,format=yuv420p" % (W * 2, H * 2, W * 2, H * 2, z, x, y, n, W, H, FPS))
os.makedirs(os.path.dirname(os.path.abspath(a.out)), exist_ok=True)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", a.image, "-vf", vf, "-frames:v", str(n),
                "-c:v", "libx264", "-crf", "16", "-pix_fmt", "yuv420p", a.out], check=True)
print("wrote", a.out)
