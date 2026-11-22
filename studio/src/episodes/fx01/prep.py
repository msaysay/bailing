#!/usr/bin/env python3
"""《今天我们来炫个技》的粗剪：五段原片接成一条，说话的部分取最后一遍、收气口；中间没说话的手势段挑 10 个动作剪成炫技段，
每个镜头的长度卡在配乐的半拍上。配乐也在这里合成（开场两小节铺垫，炫技段第一帧砸下去）。
用法：python3 studio/src/episodes/fx01/prep.py <接好的原片 all.mp4> <识别结果 all.json>
产出：studio/public/fx01/person.mp4（1920×1080，30 帧，无声）、voice.wav、music.wav；studio/src/episodes/fx01/timing.json、shots.json。
之后跑：python3 scripts/hud_track.py studio/public/fx01/person.mp4 --ep fx01 --size 1920x1080（认手 + 抠人）。
取舍：「越来越多人做出了好的作品」那半句没说完，不用；「开源给到大家了」后面直接接「也希望大家…」。"""
import json, os, subprocess, sys
import numpy as np, soundfile as sf
src, asr = sys.argv[1], sys.argv[2]; HERE = os.path.dirname(os.path.abspath(__file__)); R = os.path.abspath(os.path.join(HERE, "..", "..", "..", "..")); pub = os.path.join(R, "studio", "public", "fx01"); os.makedirs(pub, exist_ok=True)
sys.path.insert(0, os.path.join(R, "scripts")); import hud_music
# 说话：("talk", 段名, 起, 止, [字幕])；炫技：("show", 特效名, 起, 拍数（半拍为单位）)
PLAN = [
 ("talk", "开场", 8.45, 12.30, ["今天啊我们来炫个技", "这条视频是我的AI一键剪辑生成的"]),
 ("show", "blade", 15.95, 3),      # 剑指：指尖光刃
 ("show", "laser", 17.00, 4),      # 指向：激光
 ("show", "arc", 18.05, 4),        # 双手剑指：两指间闪电
 ("show", "charge", 25.55, 7),     # 指尖聚能，甩出去拖尾
 ("show", "beam", 28.80, 4),       # 双手指枪：等离子束
 ("show", "awaken", 29.95, 14),    # 太阳穴蓄力 → 举手释放
 ("show", "sweep", 36.90, 4),      # 横扫：霓虹拖尾
 ("show", "burst", 39.45, 3),      # 举过头顶：爆炸冲击波
 ("show", "shield", 40.15, 5),     # 掌心推向镜头：六边形护盾
 ("show", "flick", 42.50, 4),      # 上挑：火花
 ("talk", "说明", 48.40, 56.85, ["现在", "像这样的动效过去要", "一个月薪几万块钱的剪辑师", "才能做得出来", "现在用我的这套工作流", "你也可以一键生成"]),
 ("talk", "开源", 69.80, 71.98, ["而且不止这些", "我已经把我的核心工作流"]),
 ("talk", "开源", 73.20, 74.25, ["开源给到大家了"]),
 ("talk", "结尾", 79.80, 89.70, ["也希望大家拿到我的工作流之后", "做出好的作品可以回来跟我分享", "如果你也想要这套工作流", "可以加我的粉丝群", "或者在评论区打工作流", "我是宁少", "陪伴AI时代的超级个体"]),
]
toks = [dict(t=x["t"].strip(), s=x["s"]) for x in json.load(open(asr, encoding="utf-8"))["tokens"] if x["t"].strip()]
SR = 48000; FR = 30
raw = os.path.join(pub, "_raw.wav"); subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-i", src, "-vn", "-ac", "2", "-ar", str(SR), raw], check=True)
A, _ = sf.read(raw); mono = A.mean(1); H = SR // 50
db = np.array([20 * np.log10(np.sqrt((mono[i:i + H] ** 2).mean()) + 1e-9) for i in range(0, len(mono) - H, H)]); dbt = np.arange(len(db)) * H / SR
snap = lambda x: round(x * FR) / FR
cjk = lambda c: "一" <= c <= "鿿"

def tighten(a, b):
    m = (dbt >= a) & (dbt < b); seg, ts = db[m], dbt[m]; thr = max(np.percentile(seg, 10) + 10, np.percentile(seg, 60) - 17); loud = seg >= thr
    on = np.where(loud)[0]; s0 = max(a, ts[on[0]] - 0.05); s1 = min(b, ts[on[-1]] + 0.14)
    keep = []; cur = s0; i = on[0]
    while i <= on[-1]:
        if not loud[i]:
            j = i
            while j <= on[-1] and not loud[j]: j += 1
            g0, g1 = ts[i], ts[min(j, len(ts) - 1)]; gap = g1 - g0
            if gap >= 0.1: leave = 0.15 if gap >= 0.3 else 0.06; keep.append((cur, g0 + leave / 2)); cur = g1 - leave / 2
            i = j
        else: i += 1
    keep.append((cur, s1)); return [(snap(x), snap(y)) for x, y in keep if snap(y) > snap(x)]

# 配乐速度：开场正好两小节
open_len = sum(y - x for x, y in tighten(PLAN[0][2], PLAN[0][3])); beat = open_len / 8; half = beat / 2
pieces = []; lines = []; shots = []; segs = []; micro = []; off = 0.0
for item in PLAN:
    if item[0] == "show":
        _, name, a, n = item; d = snap(n * half) if False else round(n * half * FR) / FR
        pieces.append((snap(a), snap(a) + d, False)); shots.append({"fx": name, "start": round(off, 3), "end": round(off + d, 3), "src": a}); off += d; continue
    _, name, a, b, subs = item; keep = tighten(a, b); start = off; mp = []
    for k, (x, y) in enumerate(keep):
        if k: micro.append(round(off, 3))
        mp.append((x, y, off)); pieces.append((x, y, True)); off += y - x
    def M(tt):
        for x, y, o in mp:
            if tt < y: return o + max(0.0, tt - x)
        return mp[-1][2] + mp[-1][1] - mp[-1][0]
    tk = [x for x in toks if a - 0.02 <= x["s"] <= b]; p = 0
    for li, text in enumerate(subs):
        chars = []; last = None
        for ii, c in enumerate(text):
            hit = None
            for q in range(p, min(len(tk), p + 4)):
                if (cjk(c) and tk[q]["t"] == c) or (not cjk(c) and not cjk(tk[q]["t"][0])): hit = q; break
            if hit is not None: last = M(tk[hit]["s"]); p = hit + 1
            elif cjk(c) and p < len(tk): last = M(tk[p]["s"]); p += 1
            chars.append({"c": c, "i": ii, "t": round(last if last is not None else start, 3)})
        lines.append({"n": len(lines) + 1, "segname": name, "text": text, "start": round(start, 3) if li == 0 else chars[0]["t"], "chars": chars})
    segs.append({"name": name, "start": round(start, 3), "end": round(off, 3)})
total = off
for k, l in enumerate(lines):
    nxt = lines[k + 1]["start"] if k + 1 < len(lines) and lines[k + 1]["segname"] == l["segname"] else next((s["end"] for s in segs if s["name"] == l["segname"] and s["start"] <= l["start"] < s["end"]), l["start"] + 1)
    l["end"] = round(max(l["start"] + 0.3, nxt - 0.03), 3); l["chars"][0]["t"] = l["start"]
names = []; [names.append(s["name"]) for s in segs if s["name"] not in names]
segments = [{"id": i + 1, "name": nm, "start": min(s["start"] for s in segs if s["name"] == nm), "end": max(s["end"] for s in segs if s["name"] == nm), "lines": [l["n"] for l in lines if l["segname"] == nm]} for i, nm in enumerate(names)]
ids = {s["name"]: s["id"] for s in segments}
for l in lines: l["seg"] = ids[l.pop("segname")]
# 声音：说话的片段拼起来，炫技段放静音
F = int(0.006 * SR); out = []
for x, y, talk in pieces:
    n = int(round(y * SR)) - int(round(x * SR))
    if not talk: out.append(np.zeros((n, 2))); continue
    c = A[int(round(x * SR)):int(round(x * SR)) + n].copy(); r = np.linspace(0, 1, min(F, len(c) // 2))[:, None]; c[:len(r)] *= r; c[len(c) - len(r):] *= r[::-1]; out.append(c)
vraw = os.path.join(pub, "_voice.wav"); sf.write(vraw, np.concatenate(out), SR)
subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-i", vraw, "-af", "highpass=f=70,afftdn=nr=10:nf=-45,loudnorm=I=-15:TP=-1.5:LRA=9", "-ar", str(SR), "-ac", "2", os.path.join(pub, "voice.wav")], check=True)
sel = "+".join(f"between(n,{int(round(x * FR))},{int(round(y * FR)) - 1})" for x, y, _ in pieces)
subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-i", src, "-an", "-vf", f"fps={FR},select='{sel}',setpts=N/{FR}/TB", "-r", str(FR), "-c:v", "libx264", "-crf", "15", "-g", "15", "-pix_fmt", "yuv420p", os.path.join(pub, "person.mp4")], check=True)
for f_ in (raw, vraw): os.remove(f_)
# 配乐：开场两小节铺垫，炫技段第一帧砸下去；每个炫技镜头一个音效；说话时压低，结尾推上来
TAIL = 2.6; drop = shots[0]["start"]; SFX = {"blade": "shimmer", "laser": "zap", "arc": "zap", "charge": "rise", "beam": "zap", "awaken": "rise", "sweep": "whoosh", "burst": "boom", "shield": "glass", "flick": "pop"}
sl = [(s["start"], SFX[s["fx"]]) for s in shots] + [(s["start"] + 2.3, "boom") for s in shots if s["fx"] == "awaken"]
st, _, bpm = hud_music.make(drop, total + TAIL, sl, seed=7, key=38, bars=2)
t = np.arange(len(st)) / hud_music.SR; g = np.full(len(t), 0.12); g[t < drop] = 0.2; g[(t >= drop) & (t < shots[-1]["end"])] = 1.0; g[t >= total - 0.1] = 0.6
k = int(0.12 * hud_music.SR); g = np.convolve(g, np.ones(k) / k, "same"); sf.write(os.path.join(pub, "music.wav"), st * g[:, None], hud_music.SR, subtype="PCM_16")
json.dump({"fps": FR, "total": round(total, 3), "segments": segments, "lines": lines}, open(os.path.join(HERE, "timing.json"), "w", encoding="utf-8"), ensure_ascii=False)
json.dump({"bpm": round(bpm, 3), "beat": round(beat, 4), "drop": round(drop, 3), "tail": TAIL, "shots": shots, "micro": micro}, open(os.path.join(HERE, "shots.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(f"全长 {total:.2f} 秒（加结尾 {TAIL} 秒）；配乐 {bpm:.1f} 拍/分，第 {drop:.2f} 秒砸下去；炫技段 {shots[0]['start']:.2f}–{shots[-1]['end']:.2f}")
for s in shots: print(f"  {s['fx']:<7} {s['start']:6.2f}–{s['end']:6.2f}  （原片 {s['src']}）")
for l in lines: print(f"  {l['n']:>2} {l['start']:6.2f}–{l['end']:6.2f}  {l['text']}")
