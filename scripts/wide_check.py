#!/usr/bin/env python3
"""横屏深度解读风成片的版式自查：每半秒测一次人脸，判断这一刻是「主持人大（全景、带右侧素材窗）/ 主持人小（名片、圆头像、小头像）/ 人不在」，统计占比并对照硬指标。
用法：scripts/wide_check.py <成片.mp4> [--full-w 0.10]
  --full-w  主持人全景时人脸宽占画面宽的比例（站着讲约 0.08，坐着讲约 0.11；按自己的原片填）
硬指标量自两条真实成片，见 docs/对标拆解-子祺见微.md 第二节。素材里别人的脸会被算进去，所以占比有几个点的误差。
还会查：顶上章节条和底下标志条是不是全程都在。"""
import sys as _sys
for _s in (_sys.stdout, _sys.stderr): getattr(_s, "reconfigure", lambda **k: None)(encoding="utf-8", errors="replace")
import argparse, glob, os, subprocess, sys, tempfile
import cv2
ap = argparse.ArgumentParser(); ap.add_argument("video"); ap.add_argument("--full-w", type=float, default=0.10); a = ap.parse_args()
m = os.path.expanduser("~/.cache/video-studio/yunet.onnx")
if not os.path.exists(m): sys.exit("缺少人脸模型：python3 scripts/doctor.py --line talk --fix")
d = tempfile.mkdtemp(); subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-i", a.video, "-vf", "fps=2,scale=480:-2", "-q:v", "4", d + "/%05d.jpg"], check=True)
det = None; modes = []; nobar = 0; lo = a.full_w * 0.72
for f in sorted(glob.glob(d + "/*.jpg")):
    im = cv2.imread(f); h, w = im.shape[:2]
    if det is None: det = cv2.FaceDetectorYN.create(m, "", (w, h), 0.6, 0.3, 50)
    if im[int(h * 0.93):].mean() > 40 or im[:int(h * 0.06)].std() < 4: nobar += 1
    _, fs = det.detect(im); fs = [] if fs is None else [(x[2] / w, (x[0] + x[2] / 2) / w, (x[1] + x[3] / 2) / h) for x in fs]
    big = [x for x in fs if x[0] >= lo and x[1] < 0.62 and 0.15 < x[2] < 0.5]
    small = [x for x in fs if 0.03 <= x[0] < lo and ((x[1] > 0.68 and 0.2 < x[2] < 0.6) or (x[1] < 0.2 and x[2] > 0.5))]
    modes.append("主持人大" if big else "主持人小" if small else "人不在")
for i in range(1, len(modes) - 1):
    if modes[i - 1] == modes[i + 1] != modes[i]: modes[i] = modes[i - 1]
segs = []
for i, x in enumerate(modes):
    if segs and segs[-1][0] == x: segs[-1][2] = (i + 1) / 2
    else: segs.append([x, i / 2, (i + 1) / 2])
T = len(modes) / 2; tot = {}; longest = {}
for x, s, e in segs: tot[x] = tot.get(x, 0) + e - s; longest[x] = max(longest.get(x, (0, 0)), (e - s, s))
print(f"全片 {T:.1f} 秒，版式切换 {len(segs) - 1} 次，平均每段 {T / len(segs):.1f} 秒")
for x in ("主持人大", "主持人小", "人不在"):
    if x in tot: print(f"  {x}  {tot[x]:6.1f} 秒  {tot[x] / T * 100:4.0f}%   最长 {longest[x][0]:.1f} 秒（从 {longest[x][1]:.1f} 秒起）")
big = tot.get("主持人大", 0) / T; small = tot.get("主持人小", 0) / T; off = tot.get("人不在", 0) / T; bad = []
if not 0.25 <= big <= 0.45: bad.append(f"主持人大 {big * 100:.0f}%，应在三成到四成")
if not 0.08 <= small <= 0.28: bad.append(f"主持人小 {small * 100:.0f}%，应在一成半到两成")
if not 0.35 <= off <= 0.60: bad.append(f"人不在 {off * 100:.0f}%，应在四成到五成半")
if T / len(segs) > 15: bad.append(f"平均 {T / len(segs):.1f} 秒才换一次版式，偏慢（目标 9 到 12 秒）")
for x, lim in (("主持人大", 32), ("主持人小", 28), ("人不在", 55)):
    if longest.get(x, (0, 0))[0] > lim: bad.append(f"「{x}」连续 {longest[x][0]:.1f} 秒（从 {longest[x][1]:.1f} 秒起），超过 {lim} 秒")
if nobar > len(modes) * 0.03: bad.append(f"有 {nobar / 2:.0f} 秒顶上的章节条或底下的标志条不在")
print("版式自查：", "通过" if not bad else "未通过"); [print("  -", b) for b in bad]
print("注意：素材多久换一个画面、素材窗有没有挡住主持人、章节条亮的是不是当前这一章，这个脚本查不了，要看关键帧。")
