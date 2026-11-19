#!/usr/bin/env python3
"""Find the speaker's face in an A-roll clip -> suggested framing for plan.sources.

    python3 probe_aroll.py raw/a.mp4

Prints e.g. {"focus_x": 0.47, "focus_y": 0.31, "zoom": 1.0, "tight_zoom": 1.35}
focus_* = face centre in the source frame (0..1). Always confirm on a sheet.
"""
import json, sys, os
import cv2, numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import probe

p = sys.argv[1]
inf = probe(p)
cap = cv2.VideoCapture(p)
try:
    cas = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
except Exception:      # OpenCV 5 dropped Haar cascades: fall back to judging by eye
    print(json.dumps({"focus_x": 0.5, "focus_y": 0.4, "src": "%dx%d" % (inf["width"], inf["height"]),
                      "note": "face detector unavailable - run sheet.py and estimate the face centre (0..1) by eye"}))
    sys.exit(0)
xs, ys, hs = [], [], []
for k in range(24):
    cap.set(cv2.CAP_PROP_POS_MSEC, (k + 0.5) / 24 * inf["duration"] * 1000)
    ok, f = cap.read()
    if not ok:
        continue
    g = cv2.cvtColor(f, cv2.COLOR_BGR2GRAY)
    s = 960 / max(g.shape)
    g = cv2.resize(g, None, fx=s, fy=s)
    faces = cas.detectMultiScale(g, 1.1, 6, minSize=(60, 60))
    if len(faces):
        x, y, w, h = max(faces, key=lambda r: r[2] * r[3])
        xs.append((x + w / 2) / g.shape[1]); ys.append((y + h / 2) / g.shape[0]); hs.append(h / g.shape[0])
if not xs:
    print(json.dumps({"focus_x": 0.5, "focus_y": 0.4, "note": "no face found - set focus by eye from a sheet"}))
    sys.exit(0)
fx, fy, fh = float(np.median(xs)), float(np.median(ys)), float(np.median(hs))
# reference film: wide framing face ~17% of frame height, tight ~24%
cover = max(1080 / inf["width"], 1920 / inf["height"]) * inf["height"] / 1920   # source-height share after cover
face_out = fh * cover
zoom = max(1.0, round(0.17 / face_out, 2)) if face_out else 1.0
tight = max(zoom * 1.3, round(0.24 / face_out, 2)) if face_out else 1.35
print(json.dumps({"focus_x": round(fx, 3), "focus_y": round(fy, 3), "zoom": min(zoom, 1.6),
                  "tight_zoom": min(round(tight, 2), 2.2), "face_h": round(fh, 3),
                  "src": "%dx%d" % (inf["width"], inf["height"])}))
