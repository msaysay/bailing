#!/usr/bin/env python3
"""相框口播线第 1 步的前半：拿到口播原片后，转写、量人脸、算裁切，建好这一期的目录。
用法：scripts/frame_ingest.py <口播原片> <期目录> --slug <英文短名，如 yuedu-0312>
做四件事：
  1. 转写（本机识别，不上传录音）→ 03_制作过程/asr-原片.json
  2. 把转写结果按停顿分句、带时间写成 03_制作过程/转写稿.txt，并按 brands/yuedu/glossary.txt 把同音错字替换掉
  3. 抽帧量人脸，算出 4:3 裁切窗（脸在窗宽 55%、窗高 36% 附近），打印粗剪要用的 --vf
  4. 写 03_制作过程/meta.json（人物视频路径、尺寸、人脸位置、素材库路径）
下一步见 skills/frame-01-cut/SKILL.md：助手校对转写稿 → 发给用户确认 → 粗剪 → 对齐。"""
import argparse, glob, json, os, shutil, subprocess, sys, tempfile
import cv2, numpy as np
ap = argparse.ArgumentParser(); ap.add_argument("video"); ap.add_argument("ep"); ap.add_argument("--slug", required=True); ap.add_argument("--brand", default=None); a = ap.parse_args()
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); brand = a.brand or os.path.join(ROOT, "brands", "yuedu")
W = os.path.join(a.ep, "03_制作过程"); os.makedirs(W, exist_ok=True); os.makedirs(os.path.join(a.ep, "01_输入素材"), exist_ok=True); os.makedirs(os.path.join(ROOT, "studio/public", a.slug, "clips"), exist_ok=True)
raw = os.path.join(a.ep, "01_输入素材", "口播原片" + os.path.splitext(a.video)[1])
if os.path.abspath(a.video) != os.path.abspath(raw): shutil.copy(a.video, raw)

# 1 转写
asr = os.path.join(W, "asr-原片.json")
if not os.path.exists(asr): subprocess.run([sys.executable, os.path.join(ROOT, "scripts/asr.py"), raw, asr], check=True)
d = json.load(open(asr, encoding="utf-8")); tk = d["tokens"]

# 2 分句、按专名表纠错
gl = []
gp = os.path.join(brand, "glossary.txt")
if os.path.exists(gp):
    for ln in open(gp, encoding="utf-8"):
        ln = ln.split("#")[0].strip()
        if "=>" in ln: w, r = [x.strip() for x in ln.split("=>")]; gl.append((w, r))
sents, cur, last = [], None, -9
for t in tk:
    if cur is None or t["s"] - last > 0.5: cur = {"s": t["s"], "t": ""}; sents.append(cur)
    cur["t"] += t["t"].strip(); last = t["s"]
fixed = 0; out = ["# 转写稿（机器识别，已按专名表替换）。方括号里是原片时间（秒）。", "# 助手：通读一遍改错字，标出拿不准的词；整句重说的口误记下起止时间，粗剪时删。", ""]
for s in sents:
    x = s["t"]
    for w, r in gl:
        if w in x: fixed += x.count(w); x = x.replace(w, r)
    out.append(f"[{s['s']:.1f}] {x}")
open(os.path.join(W, "转写稿.txt"), "w", encoding="utf-8").write("\n".join(out) + "\n")

# 3 人脸和裁切
model = os.path.expanduser("~/.cache/video-studio/yunet.onnx")
if not os.path.exists(model): sys.exit("缺少人脸模型，下载办法见 scripts/faces.py 开头")
tmp = tempfile.mkdtemp(); subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-i", raw, "-vf", f"fps=1/{max(2, int(d['dur'] / 40))}", "-q:v", "3", tmp + "/%04d.jpg"], check=True)
B = []; sw = sh = 0
for f in sorted(glob.glob(tmp + "/*.jpg")):
    im = cv2.imread(f); sh, sw = im.shape[:2]; _, fs = cv2.FaceDetectorYN.create(model, "", (sw, sh), 0.8, 0.3, 50).detect(im)
    if fs is not None: b = max(fs, key=lambda x: x[2] * x[3]); B.append((b[0] + b[2] / 2, b[1] + b[3] / 2, b[2]))
shutil.rmtree(tmp)
if len(B) < 3: sys.exit("原片里几乎测不到人脸，确认这是不是口播原片")
fx, fy, fw = np.median(np.array(B), axis=0)
if sw / sh >= 4 / 3: ch = sh; cw = int(sh * 4 / 3) // 2 * 2; cx = int(min(max(0, fx - cw * 0.55), sw - cw)); cy = 0
else: cw = sw; ch = int(sw * 3 / 4) // 2 * 2; cx = 0; cy = int(min(max(0, fy - ch * 0.36), sh - ch))
k = 1440 / cw; face = {"x": round((fx - cx) * k), "y": round((fy - cy) * k), "w": round(fw * k)}
vf = f"crop={cw}:{ch}:{cx}:{cy},scale=1440:1080:flags=lanczos"
fps = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=r_frame_rate", "-of", "csv=p=0", raw], capture_output=True, text=True).stdout.strip().split("/")
fps = round(int(fps[0]) / int(fps[1] or 1)) if len(fps) == 2 else 30

# 4 meta
meta = {"slug": a.slug, "person": f"{a.slug}/person.mp4", "voice": f"{a.slug}/voice.wav", "vw": 1440, "vh": 1080, "fps": 30, "face": face, "library": f"studio/public/{a.slug}/clips/library.json", "raw": {"w": sw, "h": sh, "fps": fps, "dur": d["dur"], "vf": vf}}
json.dump(meta, open(os.path.join(W, "meta.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
warn = []
if face["w"] < 110: warn.append(f"人脸偏小（裁切后宽 {face['w']} 像素，建议 130 到 200）：推近后会糊")
if face["w"] > 260: warn.append(f"人脸偏大（裁切后宽 {face['w']} 像素）：两侧放不下贴纸")
if min(sw, sh) < 1000: warn.append(f"原片只有 {sw}×{sh}，低于 1080p，画面窗里会发虚")
if face["x"] < 520 or face["x"] > 1000: warn.append("人不在画面中间偏右：贴纸默认放左边，写 edl 时把 side 改到空的那一侧")
print(f"原片 {sw}×{sh}，{d['dur']:.1f} 秒，{len(tk)} 个字，分成 {len(sents)} 句；按专名表替换了 {fixed} 处")
print(f"转写稿：{W}/转写稿.txt")
print(f"裁切（粗剪时用）：--vf \"{vf}\"    裁切后人脸：{face}")
for x in warn: print("提醒：" + x)
