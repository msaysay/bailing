#!/usr/bin/env python3
"""《短视频剪辑正式进入 AI 时代》第二版的粗剪：六段原片是一条连续录的口播，先接成一条，再各取留下的那一遍。
用法：python3 studio/src/episodes/full02/prep.py <接好的原片 all.mp4> <它的识别结果 all.json>
产出：studio/public/full02/main.mp4（1920×1080，30 帧，无声）、main.wav（人声）、bed.wav（配乐，砸点落在「过去这样和这样的动效」）、
      studio/src/episodes/full02/data.json（字幕行、每段起止、逐字时刻、人脸位置）。
留哪一遍写在 CUTS 里：一句话录了好几遍的，留最后一遍完整的；句子中间重说的（「这不就好，这不就搞定了吗」「而我，我的」）只留后半。"""
import json, os, subprocess, sys
import numpy as np, soundfile as sf
src, asr = sys.argv[1], sys.argv[2]; HERE = os.path.dirname(os.path.abspath(__file__)); R = os.path.abspath(os.path.join(HERE, "..", "..", "..", "..")); pub = os.path.join(R, "studio", "public", "full02"); os.makedirs(pub, exist_ok=True)
sys.path.insert(0, os.path.join(R, "scripts"))
# (段名, 起, 止, [(字幕, 这一行第一个字)])
CUTS = [
 ("s1", 0.42, 6.92, [("兄弟们，我宣布", "兄"), ("短视频剪辑", "短"), ("正式进入 AI 时代", "正"), ("你现在看到的这条视频", "你"), ("也是我用 AI 一键剪辑生成的", "也")]),
 ("s2", 24.15, 27.32, [("你看到最后", "你"), ("我会把这套工作流", "我"), ("开源给大家", "开")]),
 ("s3", 36.33, 40.08, [("有人问我说", "有"), ("你做这事三个月之后", "你"), ("剪映不就超过你了吗", "剪")]),
 ("s4a", 44.33, 50.02, [("但我想说的是", "但"), ("AI 时代", "a"), ("我们为什么还需要一个剪映", "们"), ("一个视频出来", "视"), ("交给 AI", "交"), ("让它自动剪出来", "让")]),
 ("s4b", 50.80, 51.98, [("这不就搞定了吗", "这")]),
 ("s5", 53.50, 55.40, [("除非你是特别专业的", "除")]),
 ("s6", 63.60, 70.46, [("所以你现在看到的这条视频", "所"), ("华丽的动效、包装", "华"), ("都是我一句一句", "都"), ("跟 AI 提要求", "跟"), ("它帮我做出来的", "他")]),
 ("s7", 74.98, 79.52, [("而且我蒸馏了", "而"), ("很多头部博主的剪辑风格", "很"), ("而且在持续的扩充", "而")]),
 ("s8", 96.54, 100.24, [("过去这样", "过"), ("和这样的动效", "和"), ("要很贵的剪辑师才能完成", "要")]),
 ("s9", 104.20, 106.68, [("我的工作流里边", "我"), ("全部给大家做出来了", "全")]),
 ("s10", 110.07, 115.36, [("后面我还会持续更新", "后"), ("数字人的自动化的工作流", "数"), ("还有内容的创作工作台", "还")]),
 ("s11", 129.22, 133.78, [("如果你也对这套工作流感兴趣", "如"), ("你可以进粉丝群", "可"), ("或者在评论区打「工作流」", "或")]),
 ("s12", 140.92, 143.55, [("我是宁少", "我"), ("陪伴 AI 时代的超级个体", "陪")]),
]
toks = [dict(t=x["t"].strip(), s=x["s"]) for x in json.load(open(asr, encoding="utf-8"))["tokens"] if x["t"].strip()]
tmp = os.path.join(pub, "_tmp"); os.makedirs(tmp, exist_ok=True); parts = []; lines = []; cuts = []; segs = {}; off = 0.0
for name, a, b, subs in CUTS:
    o = os.path.join(tmp, name + ".mp4"); d = b - a
    subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-ss", f"{a:.3f}", "-t", f"{d:.3f}", "-i", src, "-map", "0:v:0", "-map", "0:a:0", "-r", "30", "-c:v", "libx264", "-crf", "16", "-pix_fmt", "yuv420p", "-af", "afade=t=in:d=0.03,afade=t=out:st=%.3f:d=0.05" % (d - 0.05), "-ar", "48000", "-ac", "2", o], check=True)
    real = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", o], capture_output=True, text=True).stdout)
    tk = [x for x in toks if a - 0.02 <= x["s"] <= b]; k = 0; starts = []
    for text, first in subs:
        while k < len(tk) and tk[k]["t"] != first: k += 1
        starts.append((tk[k]["s"] - (0.12 if first == "们" else 0) - a + off) if k < len(tk) else off); k += 1
    starts[0] = off
    for i, (text, _) in enumerate(subs): lines.append({"seg": name, "text": text, "start": round(starts[i], 3), "end": round((starts[i + 1] if i + 1 < len(subs) else off + real) - 0.03, 3)})
    segs[name] = {"start": round(off, 3), "end": round(off + real, 3), "words": [[x["t"], round(x["s"] - a + off, 3)] for x in tk]}
    if off: cuts.append(round(off, 3))
    parts.append(o); off += real
lst = os.path.join(tmp, "list.txt"); open(lst, "w").write("".join(f"file '{p}'\n" for p in parts))
subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", lst, "-an", "-c:v", "libx264", "-crf", "17", "-g", "15", "-pix_fmt", "yuv420p", os.path.join(pub, "main.mp4")], check=True)
subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", lst, "-vn", "-af", "highpass=f=70,afftdn=nr=10:nf=-45,loudnorm=I=-15:TP=-1.5:LRA=9", "-ar", "48000", "-ac", "2", os.path.join(pub, "main.wav")], check=True)
import cv2
det = None; cap = cv2.VideoCapture(os.path.join(pub, "main.mp4"))
for name, s in segs.items():
    cap.set(cv2.CAP_PROP_POS_MSEC, (s["start"] + s["end"]) / 2 * 1000); ok, im = cap.read(); h, w = im.shape[:2]
    det = det or cv2.FaceDetectorYN.create(os.path.expanduser("~/.cache/video-studio/yunet.onnx"), "", (w, h), .6, .3, 50); f = det.detect(im)[1]
    if f is not None: f = max(f, key=lambda x: x[2]); s["face"] = [int(f[0] + f[2] / 2), int(f[1] + f[3] / 2), int(f[2])]
# 配乐：用手势全息风那套合成器，砸点对在 s8 开头；人声在的时候压低，结尾卡片推上去
import hud_music
END = 3.2; T = off + END; drop = segs["s8"]["start"]; st, _, bpm = hud_music.make(drop, T, [(c, "whoosh") for c in cuts], seed=5, key=38)
n = len(st); t = np.arange(n) / hud_music.SR; g = np.where(t < drop, 0.20, 0.30); g = np.where((t >= drop) & (t < segs["s9"]["end"]), 0.42, g); g = np.where(t >= off - 0.1, 0.8, g)
k = int(0.25 * hud_music.SR); g = np.convolve(g, np.ones(k) / k, "same"); sf.write(os.path.join(pub, "bed.wav"), st * g[:, None], hud_music.SR, subtype="PCM_16")
json.dump({"total": round(off, 3), "end": END, "bpm": round(bpm, 2), "drop": round(drop, 3), "lines": lines, "cuts": cuts, "segs": segs}, open(os.path.join(HERE, "data.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(f"正文 {off:.2f} 秒，{len(lines)} 行字幕，{len(cuts)} 个剪口；配乐 {bpm:.1f} 拍/分，第 {drop:.2f} 秒砸下去")
for l in lines: print(f"  {l['start']:6.2f}–{l['end']:6.2f}  {l['text']}")
print({k: v.get("face") for k, v in segs.items()})
