#!/usr/bin/env python3
"""竖屏口播成片的版式自查：每半秒测一次人脸，判断这一刻是「人全屏 / 小圆头像 / 人物卡片 / 人不在」，统计占比并对照硬指标。
用法：scripts/talk_check.py <成片.mp4> [--full-w 0.40]
  --full-w  全屏且景别为 1 时，人脸宽占画面宽的比例（小 Lin 约 0.20；脸大的素材按实际量的填）
硬指标见 skills/talk-03-layout/SKILL.md。测不出「全屏时有没有叠加组件」，所以 A、B 合并成「人全屏」。
依赖：opencv-python-headless、ffmpeg；人脸模型同 scripts/faces.py（~/.cache/video-studio/yunet.onnx）。"""
import argparse, glob, os, subprocess, sys, tempfile
import cv2
ap = argparse.ArgumentParser(); ap.add_argument("video"); ap.add_argument("--full-w", type=float, default=0.22); a = ap.parse_args()
m = os.path.expanduser("~/.cache/video-studio/yunet.onnx")
if not os.path.exists(m): sys.exit("缺少人脸模型，下载办法见 scripts/faces.py 开头")
d = tempfile.mkdtemp(); subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-i", a.video, "-vf", "fps=2,scale=360:-1", "-q:v", "4", d + "/%05d.jpg"], check=True)
det = None; modes = []
for f in sorted(glob.glob(d + "/*.jpg")):
    im = cv2.imread(f); h, w = im.shape[:2]
    if det is None: det = cv2.FaceDetectorYN.create(m, "", (w, h), 0.6, 0.3, 50)
    _, fs = det.detect(im)
    if fs is None: modes.append("无人"); continue
    b = max(fs, key=lambda x: x[2] * x[3]); fw = b[2] / w
    modes.append("全屏" if fw >= a.full_w * 0.8 else "小圆" if fw < a.full_w * 0.36 else "卡片")
for i in range(1, len(modes) - 1):                                  # 抹掉半秒的抖动
    if modes[i - 1] == modes[i + 1] != modes[i]: modes[i] = modes[i - 1]
segs = []
for i, x in enumerate(modes):
    if segs and segs[-1][0] == x: segs[-1][2] = (i + 1) / 2
    else: segs.append([x, i / 2, (i + 1) / 2])
T = len(modes) / 2; tot = {}; longest = {}
for x, s, e in segs: tot[x] = tot.get(x, 0) + e - s; longest[x] = max(longest.get(x, (0, 0)), (e - s, s))
print(f"全片 {T:.1f} 秒，版式切换 {len(segs) - 1} 次，平均每段 {T / len(segs):.1f} 秒")
for x in ("全屏", "小圆", "卡片", "无人"):
    if x in tot: print(f"  {x}  {tot[x]:6.1f} 秒  {tot[x] / T * 100:4.0f}%   最长 {longest[x][0]:.1f} 秒（从 {longest[x][1]:.1f} 秒起）")
on = (T - tot.get("无人", 0)) / T; full = tot.get("全屏", 0) / T; bad = []
if on < 0.8: bad.append(f"人脸出镜 {on * 100:.0f}%，低于 80%")
if not 0.40 <= full <= 0.60: bad.append(f"人全屏 {full * 100:.0f}%，应在 40% 到 55% 左右")
if T / len(segs) > 9: bad.append(f"平均 {T / len(segs):.1f} 秒才换一次版式，偏慢（目标 5 到 7 秒）")
for x, lim in (("全屏", 20), ("小圆", 22), ("卡片", 20), ("无人", 15)):
    if longest.get(x, (0, 0))[0] > lim: bad.append(f"「{x}」连续 {longest[x][0]:.1f} 秒（从 {longest[x][1]:.1f} 秒起），超过 {lim} 秒")
print("版式自查：", "通过" if not bad else "未通过"); [print("  -", b) for b in bad]
print("注意：全屏时的景别切换、组件是否压脸、剪口是否盖住，这个脚本查不了，要看关键帧。")
