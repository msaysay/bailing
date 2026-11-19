#!/usr/bin/env python3
"""自查：组件有没有压住人脸。
用法：scripts/facecheck.py <成片.mp4> --timing timing.json --shots shots.json --faces faces.json --footage <片段目录> [--max 0.15]
做法：对每个带人脸的镜头，在它出现的时间段里每秒取一帧成片；按实拍层同样的算法（放大、平移、压暗）
从原片段重建「没有组件时这块画面应该长什么样」，和成片里人脸框内的画面比。差异大的像素占比超过 --max
就判为压脸。做旧的镜头（old）颜色被改过，按灰度比较。字幕条在画面底部，不算。
这是近似检查：能抓住面板、大字盖在脸上，抓不住很细的线。结果要配合每秒联系表人眼复核。"""
import argparse, json, subprocess, sys
import numpy as np
ap = argparse.ArgumentParser(); ap.add_argument("video"); ap.add_argument("--timing", required=True); ap.add_argument("--shots", required=True)
ap.add_argument("--faces", required=True); ap.add_argument("--footage", required=True); ap.add_argument("--max", type=float, default=0.15)
ap.add_argument("--ignore", default="", help="不检查的时间段，如 4.8-6.8,70.6-72.6（章节页这类有意的整屏覆盖）"); a = ap.parse_args()
ign = [tuple(float(v) for v in r.split("-")) for r in a.ignore.split(",") if r.strip()]
tm = json.load(open(a.timing)); shots = json.load(open(a.shots)); faces = json.load(open(a.faces)); fps = tm["fps"]; F = 0.4; W, H = 480, 270
seg = lambda k: next(s for s in tm["segments"] if s["name"] == k)
def say(sn, ph):
    s = seg(sn); l = next(x for x in tm["lines"] if x["seg"] == s["id"] and ph in x["text"]); p = l["text"].index(ph)
    return next((c["t"] for c in l["chars"] if c["i"] >= p), l["chars"][-1]["t"])
def when(k):
    p = k.split(":"); return (seg(p[1])["end"] if len(p) > 2 else seg(p[1])["start"]) if p[0] == "seg" else say(p[1], p[2]) - 0.2
def frame(path, t):
    raw = subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-ss", f"{max(0, t):.3f}", "-i", path, "-frames:v", "1", "-vf", f"scale={W}:{H}", "-f", "rawvideo", "-pix_fmt", "gray", "-"], capture_output=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(H, W).astype(np.float32) if len(raw) == W * H else None
def reframe(box, to, mx=1.5):
    if not to: return 1, 0, 0
    cx, cy = (box[0] + box[2]) / 2, (box[1] + box[3]) / 2; s = min(mx, 1 + 2 * max(abs(to[0] - cx), abs(to[1] - cy))); lim = (s - 1) / 2; c = lambda v: max(-lim, min(lim, v))
    return s, c(to[0] - (0.5 + (cx - 0.5) * s)), c(to[1] - (0.5 + (cy - 0.5) * s))
bad = []; checked = 0
for sh in shots:
    fc = faces.get(sh["file"])
    if not fc: continue
    t0, t1 = when(sh["from"]), when(sh["to"]); box = fc["box"]; s, dx, dy = reframe(box, sh.get("faceTo")); d = sh.get("dim", 0.66)
    fb = [0.5 + (box[0] - 0.5) * s + dx, 0.5 + (box[1] - 0.5) * s + dy, 0.5 + (box[2] - 0.5) * s + dx, 0.5 + (box[3] - 0.5) * s + dy]      # 成片里的人脸框
    x0, y0, x1, y1 = [int(max(0, min(1, v)) * n) for v, n in zip(fb, (W, H, W, H))]
    if x1 - x0 < 6 or y1 - y0 < 6: continue
    worst = 0.0; wt = None
    for t in np.arange(t0 + 0.6, t1 - 0.2, 1.0):
        if any(lo <= t <= hi for lo, hi in ign): continue
        fin = frame(a.video, t); src = frame(f"{a.footage}/{sh['file']}", t - (t0 - F))
        if fin is None or src is None: continue
        ys, xs = np.mgrid[0:H, 0:W]; sx = ((xs / W - 0.5 - dx) / s + 0.5) * W; sy = ((ys / H - 0.5 - dy) / s + 0.5) * H     # 成片像素对应原片位置
        ok = (sx >= 0) & (sx < W - 1) & (sy >= 0) & (sy < H - 1); exp = np.zeros((H, W), np.float32); exp[ok] = src[sy[ok].astype(int), sx[ok].astype(int)]
        if sh.get("old"): exp = np.clip((exp - 128) * 1.15 + 128, 0, 255) * 0.85
        yy = ys / H; alpha = np.where(yy < 0.55, (d - 0.04) + (0.12) * (yy / 0.55), (d + 0.08) + (0.93 - d - 0.08) * ((yy - 0.55) / 0.45)); exp = exp * (1 - alpha) + 12 * alpha
        diff = np.abs(fin[y0:y1, x0:x1] - exp[y0:y1, x0:x1]); r = float((diff > 26).mean()); checked += 1
        if r > worst: worst, wt = r, float(t)
    flag = worst > a.max
    print(f"{sh['file']:<18} {t0:6.1f}–{t1:6.1f}s  脸框 x {fb[0]:.2f}–{fb[2]:.2f} y {fb[1]:.2f}–{fb[3]:.2f}  最大遮挡 {worst:.0%}" + (f"  ← 压脸，约 {wt:.0f}s" if flag else ""))
    if flag: bad.append(sh["file"])
print(f"检查 {checked} 帧；压脸镜头 {len(bad)} 个" + ("：" + "、".join(bad) if bad else ""))
sys.exit(1 if bad else 0)
