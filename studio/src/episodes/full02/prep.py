#!/usr/bin/env python3
"""《短视频剪辑正式进入 AI 时代》第二版的粗剪：六段原片是一条连续录的口播，先接成一条，再各取留下的那一遍。
用法：python3 studio/src/episodes/full02/prep.py <接好的原片 all.mp4> <它的识别结果 all.json>
产出：studio/public/full02/main.mp4（1920×1080，30 帧，无声）、main.wav（人声）、bed.wav（配乐，砸点落在「过去这样和这样的动效」）、
      studio/src/episodes/full02/data.json（字幕行、每段起止、逐字时刻、人脸位置）。
留哪一遍写在 CUTS 里（「除非你是特别专业的」按出镜人的意见删了）：一句话录了好几遍的，留最后一遍完整的；句子中间重说的（「这不就好，这不就搞定了吗」「而我，我的」）只留后半。"""
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
 ("s6", 63.60, 70.46, [("所以你现在看到的这条视频", "所"), ("华丽的动效、包装", "华"), ("都是我一句一句", "都"), ("跟 AI 提要求", "跟"), ("它帮我做出来的", "他")]),
 ("s7", 74.98, 79.52, [("而且我蒸馏了", "而"), ("很多头部博主的剪辑风格", "很"), ("而且在持续的扩充", "而")]),
 ("s8", 96.54, 100.24, [("过去这样", "过"), ("和这样的动效", "和"), ("要很贵的剪辑师才能完成", "要")]),
 ("s9", 104.20, 106.68, [("我的工作流里边", "我"), ("全部给大家做出来了", "全")]),
 ("s10", 110.07, 115.36, [("后面我还会持续更新", "后"), ("数字人的自动化的工作流", "数"), ("还有内容的创作工作台", "还")]),
 ("s11", 129.22, 133.78, [("如果你也对这套工作流感兴趣", "如"), ("你可以进粉丝群", "可"), ("或者在评论区打「工作流」", "或")]),
 ("s12", 140.92, 143.55, [("我是宁少", "我"), ("陪伴 AI 时代的超级个体", "陪")]),
]
toks = [dict(t=x["t"].strip(), s=x["s"]) for x in json.load(open(asr, encoding="utf-8"))["tokens"] if x["t"].strip()]
# 收气口：每段里超过 0.1 秒的空隙（含很轻的拖音）收短（小空隙留 0.06 秒，0.3 秒以上的句间停顿留 0.15 秒），段首段尾的空白也收掉。
# 所有切点对齐到 1/30 秒，声音按采样点切、画面按帧选，两边严格对齐。
SR = 48000; FR = 30
raw = os.path.join(pub, "_raw.wav"); subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-i", src, "-vn", "-ac", "2", "-ar", str(SR), raw], check=True)
A, _ = sf.read(raw); mono = A.mean(1); H = SR // 50
db = np.array([20 * np.log10(np.sqrt((mono[i:i + H] ** 2).mean()) + 1e-9) for i in range(0, len(mono) - H, H)]); dbt = np.arange(len(db)) * H / SR
snap = lambda x: round(x * FR) / FR
pieces = []; segs = {}; lines = []; cuts = []; micro = []; off = 0.0
for name, a, b, subs in CUTS:
    m = (dbt >= a) & (dbt < b); seg, ts = db[m], dbt[m]; thr = max(np.percentile(seg, 10) + 10, np.percentile(seg, 60) - 17); loud = seg >= thr
    on = np.where(loud)[0]; s0 = max(a, ts[on[0]] - 0.05); s1 = min(b, ts[on[-1]] + 0.02 + 0.12)          # 段首留 0.05 秒，段尾留 0.12 秒
    keep = []; cur = s0; i = on[0]
    while i <= on[-1]:
        if not loud[i]:
            j = i
            while j <= on[-1] and not loud[j]: j += 1
            g0, g1 = ts[i], ts[j] if j < len(ts) else ts[-1]; gap = g1 - g0
            if gap >= 0.1:
                leave = 0.15 if gap >= 0.3 else 0.06; cut0 = g0 + leave / 2; cut1 = g1 - leave / 2
                keep.append((cur, cut0)); micro.append([None, round(cut1 - cut0, 3)]); cur = cut1
            i = j
        else: i += 1
    keep.append((cur, s1)); keep = [(snap(x), snap(y)) for x, y in keep if snap(y) > snap(x)]
    start = off; mp_ = []
    for x, y in keep:
        mp_.append((x, y, off)); pieces.append((x, y)); off += y - x
    k_ = 0
    for mi in range(len(micro) - (len(keep) - 1), len(micro)): micro[mi][0] = round(mp_[mi - (len(micro) - (len(keep) - 1)) + 1][2], 3)
    def M(tt, mp_=mp_):
        for x, y, o in mp_:
            if tt < y: return o + max(0.0, tt - x)
        return mp_[-1][2] + mp_[-1][1] - mp_[-1][0]
    tk = [x for x in toks if a - 0.02 <= x["s"] <= b]; k = 0; starts = []
    for text, first in subs:
        while k < len(tk) and tk[k]["t"] != first: k += 1
        starts.append(M(tk[k]["s"] - (0.12 if first == "们" else 0)) if k < len(tk) else start); k += 1
    starts[0] = start
    for i_, (text, _) in enumerate(subs): lines.append({"seg": name, "text": text, "start": round(starts[i_], 3), "end": round((starts[i_ + 1] if i_ + 1 < len(subs) else off) - 0.03, 3)})
    segs[name] = {"start": round(start, 3), "end": round(off, 3), "words": [[x["t"], round(M(x["s"]), 3)] for x in tk]}
    if start: cuts.append(round(start, 3))
    print(f"  {name}: {b - a:.2f} → {off - start:.2f} 秒，收了 {len(keep) - 1} 个气口")
# 声音：按采样点拼，每个切口 6 毫秒淡入淡出
F = int(0.006 * SR); out = []
for x, y in pieces:
    c = A[int(round(x * SR)):int(round(y * SR))].copy(); r = np.linspace(0, 1, min(F, len(c) // 2))[:, None]; c[:len(r)] *= r; c[len(c) - len(r):] *= r[::-1]; out.append(c)
vraw = os.path.join(pub, "_voice.wav"); sf.write(vraw, np.concatenate(out), SR)
subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-i", vraw, "-af", "highpass=f=70,afftdn=nr=10:nf=-45,loudnorm=I=-15:TP=-1.5:LRA=9", "-ar", str(SR), "-ac", "2", os.path.join(pub, "main.wav")], check=True)
# 画面：先转 30 帧，再按同样的区间选帧
sel = "+".join(f"between(n,{int(round(x * FR))},{int(round(y * FR)) - 1})" for x, y in pieces)
subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-i", src, "-an", "-vf", f"fps={FR},select='{sel}',setpts=N/{FR}/TB", "-r", str(FR), "-c:v", "libx264", "-crf", "17", "-g", "15", "-pix_fmt", "yuv420p", os.path.join(pub, "main.mp4")], check=True)
for f_ in (raw, vraw): os.remove(f_)
import cv2
det = None; cap = cv2.VideoCapture(os.path.join(pub, "main.mp4"))
for name, s in segs.items():
    cap.set(cv2.CAP_PROP_POS_MSEC, (s["start"] + s["end"]) / 2 * 1000); ok, im = cap.read(); h, w = im.shape[:2]
    det = det or cv2.FaceDetectorYN.create(os.path.expanduser("~/.cache/video-studio/yunet.onnx"), "", (w, h), .6, .3, 50); f = det.detect(im)[1]
    if f is not None: f = max(f, key=lambda x: x[2]); s["face"] = [int(f[0] + f[2] / 2), int(f[1] + f[3] / 2), int(f[2])]
# 配乐：用手势全息风那套合成器，砸点对在 s8 开头；人声在的时候压低，结尾卡片推上去
import hud_music
END = 3.2; T = off + END; drop = segs["s8"]["start"]; st, _, bpm = hud_music.make(drop, T, [(c, "whoosh") for c in cuts], seed=5, key=38)
n = len(st); t = np.arange(n) / hud_music.SR; g = np.where(t < drop, 0.16, 0.10); g = np.where((t >= drop) & (t < segs["s9"]["end"]), 0.15, g); g = np.where(t >= off - 0.1, 0.55, g)      # 人声在的时候配乐比人声低 8 分贝以上
k = int(0.25 * hud_music.SR); g = np.convolve(g, np.ones(k) / k, "same"); sf.write(os.path.join(pub, "bed.wav"), st * g[:, None], hud_music.SR, subtype="PCM_16")
json.dump({"total": round(off, 3), "end": END, "micro": [m for m in micro if m[1] >= 0.15], "bpm": round(bpm, 2), "drop": round(drop, 3), "lines": lines, "cuts": cuts, "segs": segs}, open(os.path.join(HERE, "data.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(f"正文 {off:.2f} 秒，{len(lines)} 行字幕，{len(cuts)} 个剪口；配乐 {bpm:.1f} 拍/分，第 {drop:.2f} 秒砸下去")
for l in lines: print(f"  {l['start']:6.2f}–{l['end']:6.2f}  {l['text']}")
print({k: v.get("face") for k, v in segs.items()})
