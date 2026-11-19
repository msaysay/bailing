#!/usr/bin/env python3
"""相框口播线的成片自查：相框有没有被动过、画面窗有没有黑场、该有人的时候人在不在、时长对不对。
用法：scripts/frame_check.py <成片.mp4> <props.json>
每秒抽一帧。标题区和署名条和第一帧比（应当一模一样）；画面窗按 props.json 里这一秒的处理来查。
机器查不了的：口型对不对、卡片出现得早还是晚、素材和这句话搭不搭。这些交付时要明说，请人看一遍。"""
import sys as _sys
for _s in (_sys.stdout, _sys.stderr): getattr(_s, "reconfigure", lambda **k: None)(encoding="utf-8", errors="replace")   # Windows 终端也能打印中文
import glob, json, os, subprocess, sys, tempfile
import cv2, numpy as np
video, props = sys.argv[1], json.load(open(sys.argv[2], encoding="utf-8")); d = tempfile.mkdtemp()
subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-i", video, "-vf", "fps=1,scale=540:960", "-q:v", "3", d + "/%05d.jpg"], check=True)
fs = sorted(glob.glob(d + "/*.jpg")); first = cv2.imread(fs[0]).astype(int); bad, note = [], []
dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", video], capture_output=True, text=True).stdout)
if abs(dur - props["total"]) > 0.3: bad.append(f"成片 {dur:.1f} 秒，时间表是 {props['total']:.1f} 秒")
TITLE, BAR, WIN = (slice(110, 274), slice(0, 540)), (slice(745, 805), slice(60, 480)), (slice(278, 684), slice(0, 540))
model = os.path.expanduser("~/.cache/video-studio/yunet.onnx"); det = cv2.FaceDetectorYN.create(model, "", (540, 406), 0.6, 0.3, 50) if os.path.exists(model) else None
base = props["base"]; mode = lambda b: b.get("person") or ("off" if b["do"] in "RG" else "bubble" if b["do"] == "C" else "full")
seen = miss = 0
for i, f in enumerate(fs):
    t = i + 0.5; im = cv2.imread(f); b = [x for x in base if x["t"] <= t][-1]
    for name, reg in (("标题区", TITLE), ("署名条", BAR)):
        if np.abs(im[reg].astype(int) - first[reg]).mean() > 2.5: bad.append(f"{t:.0f} 秒：{name}和第一帧不一样（被遮住或被改了）")
    win = im[WIN]
    if win.mean() < 14 and b["do"] != "S": bad.append(f"{t:.0f} 秒：画面窗是黑的")
    if det is not None and mode(b) == "full" and b["do"] != "S" and all(abs(t - x["t"]) > 0.6 for x in base):
        _, faces = det.detect(win); seen += 1
        if faces is None: miss += 1
if seen and miss / seen > 0.15: note.append(f"该是人铺满的 {seen} 秒里，有 {miss} 秒没测到人脸：检查 meta.json 的 face 位置，或者原片这些时候人不在画面里")
for x in bad[:20]: print("不通过：" + x)
for x in note: print("提醒：" + x)
print(f"自查完成：抽查 {len(fs)} 帧，{'有 ' + str(len(bad)) + ' 处不通过' if bad else '相框完好，画面窗无黑场'}")
sys.exit(1 if bad else 0)
