#!/usr/bin/env python3
"""《短视频剪辑正式进入 AI 时代》正文的粗剪：从五段原片里各取留下的那一遍，接成一条人物视频和一条人声，并把逐字时间换算到接好后的时间轴上。
用法：python3 studio/src/episodes/full01/prep.py <五段原片所在目录（p01.mp4 … p05.mp4 和同名的 -asr.json）>
产出：studio/public/open01/main.mp4（1920×1080，30 帧，无声）、main.wav（人声，-15 LUFS）、bed2.wav（合成的节奏底），
      studio/src/episodes/full01/data.json（每句字幕的起止、关键词的时刻、每个剪口的时刻、每段人脸位置）。
留哪一遍、从哪剪到哪写在下面 CUTS 里：出镜人一句话录了好几遍，留的都是最后一遍完整的。"""
import json, os, subprocess, sys
import numpy as np, soundfile as sf
src = sys.argv[1]; R = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))); pub = os.path.join(R, "studio", "public", "open01"); os.makedirs(pub, exist_ok=True)
# (段名, 原片, 起, 止, 字幕行[(文字, 这一行第一个字在识别结果里的原文)])
CUTS = [
 ("s2", "02", 5.04, 9.05, [("今天你看到的这条视频", "今"), ("就是我一句话", "就"), ("让AI自动剪辑生成的", "让")]),
 ("s4", "02", 22.76, 26.80, [("我拆解了十几个头部博主", "我"), ("比如说小Lin", "比"), ("蛋解创业等等的", "淡")]),
 ("s5", "03", 13.56, 15.36, [("工作流", "工"), ("并且把它给AI化了", "并")]),
 ("s6", "04", 22.43, 26.42, [("我的这套短视频剪辑流程", "我"), ("你可以完全不出镜", "你"), ("直接让AI自动生成", "直")]),
 ("s7a", "05", 0.42, 7.62, [("也可以你来出镜", "也"), ("然后让我的AI工作流", "然"), ("帮你剪掉气口", "帮"), ("帮你加素材", "素"), ("加特效", "特")]),
 ("s7b", "05", 11.32, 11.88, [("降噪", "降")]),
 ("s7c", "05", 15.94, 18.06, [("设计封面", "设"), ("最终输出成片", "最")]),
 ("s8", "05", 23.28, 27.56, [("现在你不再需要", "现"), ("一个专业的剪辑编导团队", "一"), ("你只需要这套工作流", "你")]),
]
tmp = os.path.join(pub, "_tmp"); os.makedirs(tmp, exist_ok=True); parts = []; lines = []; cuts = []; segs = {}; off = 0.0
for name, p, a, b, subs in CUTS:
    v = os.path.join(src, f"p{p}.mp4"); o = os.path.join(tmp, name + ".mp4"); d = b - a
    subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-ss", f"{a:.3f}", "-t", f"{d:.3f}", "-i", v, "-map", "0:v:0", "-map", "0:a:0", "-r", "30", "-c:v", "libx264", "-crf", "16", "-pix_fmt", "yuv420p", "-af", "afade=t=in:d=0.02,afade=t=out:st=%.3f:d=0.04" % (d - 0.04), "-ar", "48000", "-ac", "2", o], check=True)
    real = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", o], capture_output=True, text=True).stdout)
    tk = [x for x in json.load(open(os.path.join(src, f"p{p}-asr.json"), encoding="utf-8"))["tokens"] if a - 0.02 <= x["s"] <= b and x["t"].strip()]
    k = 0; starts = []
    for text, first in subs:                 # 每行的起点 = 这一行第一个字的识别时刻
        if first == "素": k = max(0, k - 3)      # 上一行也是「帮」字开头，这一行改按「素」字定位再往前让 0.3 秒
        while k < len(tk) and tk[k]["t"] != first: k += 1
        starts.append((tk[k]["s"] - (0.9 if first == "素" else 0.3 if first == "特" else 0)) - a + off if k < len(tk) else off); k += 1
    for i, (text, _) in enumerate(subs): lines.append({"seg": name, "text": text, "start": round(starts[i], 3), "end": round((starts[i + 1] if i + 1 < len(subs) else off + real) - 0.02, 3)})
    segs[name] = {"start": round(off, 3), "end": round(off + real, 3), "words": {x["t"] + f"@{j}": round(x["s"] - a + off, 3) for j, x in enumerate(tk)}}
    if off: cuts.append(round(off, 3))
    parts.append(o); off += real
lst = os.path.join(tmp, "list.txt"); open(lst, "w").write("".join(f"file '{p}'\n" for p in parts))
subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", lst, "-an", "-c:v", "copy", os.path.join(pub, "main.mp4")], check=True)
subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", lst, "-vn", "-af", "highpass=f=70,loudnorm=I=-15:TP=-1.5:LRA=9", "-ar", "48000", "-ac", "2", os.path.join(pub, "main.wav")], check=True)
# 人脸位置（每段取中间一帧）
import cv2
det = None; cap = cv2.VideoCapture(os.path.join(pub, "main.mp4"))
for name, s in segs.items():
    cap.set(cv2.CAP_PROP_POS_MSEC, (s["start"] + s["end"]) / 2 * 1000); ok, im = cap.read(); h, w = im.shape[:2]
    det = det or cv2.FaceDetectorYN.create(os.path.expanduser("~/.cache/video-studio/yunet.onnx"), "", (w, h), .6, .3, 50); f = det.detect(im)[1]
    if f is not None: f = max(f, key=lambda x: x[2]); s["face"] = [int(f[0] + f[2] / 2), int(f[1] + f[3] / 2), int(f[2])]
# 节奏底：正文很轻的脉冲加镲，结尾卡片进来时推上去
SR = 48000; T = off + 3.4; n = int(SR * T); out = np.zeros(n); beat = 0.5
def add(sig, at):
    i = int(at * SR); e = min(n, i + len(sig))
    if i < n: out[i:e] += sig[:e - i]
def bass(f, dur, amp): m = int(dur * SR); t = np.arange(m) / SR; return (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(4 * np.pi * f * t)) * np.minimum(1, t / 0.01) * np.exp(-t * 2.4) * amp
def kick(amp): m = int(0.35 * SR); t = np.arange(m) / SR; return np.sin(2 * np.pi * np.cumsum(45 + 90 * np.exp(-t * 28)) / SR) * np.exp(-t * 9) * amp
def hat(amp, seed): m = int(0.05 * SR); return np.diff(np.random.default_rng(seed).normal(0, 1, m) * np.exp(-np.arange(m) / SR * 90) * amp, prepend=0)
k = 0.0; b = 0
while k < T - 0.4:
    loud = k >= off - 0.1; add(bass([55, 55, 65.4, 49][(b // 4) % 4], beat * 0.95, 0.3 if loud else 0.11), k); add(hat(0.12 if loud else 0.045, b), k + beat / 2)
    if loud or b % 2 == 0: add(kick(0.9 if loud else 0.22), k)
    k += beat; b += 1
for c in cuts: add(kick(0.5), c)
env = np.ones(n); f0 = int((T - 0.5) * SR); env[f0:] = np.linspace(1, 0, n - f0) ** 1.5; out = np.tanh(out * env * 1.4) * 0.7
sf.write(os.path.join(pub, "bed2.wav"), np.stack([out, out], 1), SR)
json.dump({"total": round(off, 3), "lines": lines, "cuts": cuts, "segs": segs}, open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "data.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(f"正文 {off:.2f} 秒，{len(lines)} 行字幕，{len(cuts)} 个剪口：{cuts}")
for l in lines: print(f"  {l['start']:6.2f}–{l['end']:6.2f}  {l['text']}")
