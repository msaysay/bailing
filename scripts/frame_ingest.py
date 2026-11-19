#!/usr/bin/env python3
"""相框口播线第 1 步的前半：拿到口播原片后，转写、量人脸、算裁切，建好这一期的目录。
用法：scripts/frame_ingest.py <口播原片> <期目录> --slug <英文短名，如 yuedu-0312>
做五件事：
  1. 转写（本机识别，不上传录音）→ 03_制作过程/asr-原片.json
  2. 把转写结果按停顿分句、带时间写成 03_制作过程/转写稿.txt，并按 brands/yuedu/glossary.txt 把同音错字替换掉
  2.5 自动找语气词、口吃、重说，写成 03_制作过程/口误建议.md，并给出粗剪的 --drop 参数
  3. 抽帧量人脸，算出 4:3 裁切窗（脸在窗宽 55%、窗高 36% 附近），打印粗剪要用的 --vf
  4. 写 03_制作过程/meta.json（人物视频路径、尺寸、人脸位置、素材库路径）
下一步见 .claude/skills/frame-talk/steps/frame-01-cut.md：助手校对转写稿 → 发给用户确认 → 粗剪 → 对齐。"""
import sys as _sys
for _s in (_sys.stdout, _sys.stderr): getattr(_s, "reconfigure", lambda **k: None)(encoding="utf-8", errors="replace")   # Windows 终端也能打印中文
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

# 2.5 自动找口误：语气词、口吃（紧挨着重复）、重说（说了一半停下来从头再说）
PUNC = "，。！？、 "; ch = [(c, t["s"]) for t in tk for c in t["t"].strip() if c not in PUNC]; C = [c for c, _ in ch]; T = [s for _, s in ch]; n = len(C); sug = []
ctx = lambda i, j: "".join(C[max(0, i - 6):i]) + "【" + "".join(C[i:j]) + "】" + "".join(C[j:j + 8])
for i, c in enumerate(C):                               # 语气词：前后都有停顿才算
    if c in "呃嗯额唔" and i + 1 < n and (i == 0 or T[i] - T[i - 1] > 0.3) and T[i + 1] - T[i] > 0.3: sug.append((T[i], T[i + 1], "语气词", "确定", ctx(i, i + 1)))
i = 0
while i < n:                                            # 口吃：一到四个字紧挨着重复
    hit = 0
    for m in (4, 3, 2, 1):
        if i + 2 * m <= n and C[i:i + m] == C[i + m:i + 2 * m] and T[i + m] - T[i] < 2.5:
            if m == 1 and T[i + 1] - T[i] < 0.3 and not (i + 2 < n and C[i + 2] == C[i]): continue        # 「常常」「看看」这类叠字不算
            sug.append((T[i], T[i + m], "口吃", "确定" if m >= 2 or T[i + m] - T[i] >= 0.3 else "待定", ctx(i, i + m))); hit = m; break
    i += hit or 1
for j in range(3, n - 3):                               # 重说：停顿之后的三个字，在前面 8 秒内出现过
    if T[j] - T[j - 1] < 0.35: continue
    best = None
    for i in range(max(0, j - 30), j - 2):
        if C[i:i + 3] == C[j:j + 3] and T[j] - T[i] < 8 and not any(lo <= T[i] < hi for lo, hi, *_ in sug): best = i; break
    if best is not None:
        k = best
        while k > 0 and T[k] - T[k - 1] < 0.35 and best - k < 6: k -= 1                                 # 往前退到这半句的开头
        sug.append((T[k], T[j], "重说", "确定" if j - best >= 4 else "待定", ctx(k, j)))
sug.sort(); merged = []
for x in sug:
    if merged and x[0] < merged[-1][1]: merged[-1] = (merged[-1][0], max(merged[-1][1], x[1]), merged[-1][2] + "+" + x[2], merged[-1][3], merged[-1][4])
    else: merged.append(x)
pauses = sum(1 for p, q in zip(T, T[1:]) if q - p - 0.22 > 0.7)
md = ["# 口误建议（机器找的，助手逐条看过再用）", "", "方括号【】里是建议删掉的部分，后面紧跟的是保留的。「待定」的要对着转写稿判断：是口误就删，是正常的重复强调就留。", "",
      "| 原片时间 | 类型 | 把握 | 上下文 |", "|---|---|---|---|"] + [f"| {lo:.2f}–{hi:.2f} | {k} | {conf} | {c} |" for lo, hi, k, conf, c in merged]
sure = ",".join(f"{max(0, lo - 0.04):.2f}-{hi - 0.04:.2f}" for lo, hi, k, conf, c in merged if conf == "确定")
md += ["", f"另有 {pauses} 处超过 0.7 秒的停顿，粗剪时会自动收紧到 0.35 秒，不用列。", "", "「确定」的那些合起来，粗剪的参数是：", "", f'    --drop "{sure}"' if sure else "    （没有，不用写 --drop）"]
open(os.path.join(W, "口误建议.md"), "w", encoding="utf-8").write("\n".join(md) + "\n")

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
print(f"口误：找到 {len(merged)} 处（{sum(1 for x in merged if x[3] == '确定')} 处确定），{pauses} 处长停顿 → {W}/口误建议.md")
print(f"裁切（粗剪时用）：--vf \"{vf}\"    裁切后人脸：{face}")
for x in warn: print("提醒：" + x)
