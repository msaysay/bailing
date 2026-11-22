#!/usr/bin/env python3
"""《短视频剪辑正式进入 AI 时代》横屏深度解读风版（子祺式）的粗剪。七段原片是一条连续录的口播，先接成一条再取留下的那一遍。
用法：python3 studio/src/episodes/wide02/prep.py <接好的原片 all.mp4> <它的识别结果 all.json>
产出：studio/public/wide02/person.mp4（1920×1080，30 帧，无声）、voice.wav（人声）；
      studio/src/episodes/wide02/timing.json（kit/clock 用的格式）、cuts.json（段间剪口和收气口的位置）。
取舍：「为什么开源呢」录了三遍没说完，整句不用；「过去…很贵的剪辑师」留后录的那版；
「普通人用 WorkBuddy、Codex」用前一遍（后一遍中间一个词听不准），接后一遍的「都可以像我这样一键生成」。"""
import json, os, subprocess, sys
import numpy as np, soundfile as sf
src, asr = sys.argv[1], sys.argv[2]; HERE = os.path.dirname(os.path.abspath(__file__)); R = os.path.abspath(os.path.join(HERE, "..", "..", "..", "..")); pub = os.path.join(R, "studio", "public", "wide02"); os.makedirs(pub, exist_ok=True)
# (章, 起, 止, [字幕行])；字幕一行不超过 16 个字，不带标点
CUTS = [
 ("前言", 2.55, 5.42, ["我宣布", "短视频剪辑正式进入AI时代"]),
 ("前言", 6.15, 9.52, ["你现在看到的这条视频", "就是我用AI一键剪辑生成的"]),
 ("前言", 20.95, 25.08, ["你看到最后", "点赞评论加关注", "我会把这套工作流开源给大家"]),
 ("千万大V 联手打磨", 47.97, 52.62, ["这套工作流是我和千万级粉丝大V", "蛋解创业一起打磨出来的", "一套内容工作流"]),
 ("不靠剪映 一句成片", 57.05, 66.75, ["所以有人问我说", "你这套东西几个月之后", "剪映不就做出来了吗", "我想说的是", "AI时代为什么我们还需要一个剪映呢", "如果说我们可以让AI", "一句话帮我们剪辑出来"]),
 ("不靠剪映 一句成片", 109.28, 114.50, ["过去像这样这样这样的特效", "需要专业的剪辑师才能做出来", "而且它的月薪还很贵"]),
 ("不靠剪映 一句成片", 124.36, 126.72, ["但是现在普通人", "用WorkBuddy Codex"]),
 ("不靠剪映 一句成片", 130.98, 133.45, ["都可以像我这样一键生成"]),
 ("动嘴就改 自动加效", 77.40, 81.25, ["你只需要跟AI说一句", "这儿帮我调一下", "那帮我加一下"]),
 ("动嘴就改 自动加效", 84.48, 87.50, ["而且我的工作流", "还可以判断在什么时候给你加动效"]),
 ("蒸馏博主 持续进化", 143.24, 147.55, ["我的这套工作流里边的剪辑能力", "其实是蒸馏了很多头部的博主", "他们的风格"]),
 ("蒸馏博主 持续进化", 160.40, 162.30, ["而且我还在不断的迭代和更新"]),
 ("结语", 168.64, 174.80, ["如果你也想要这套工作流", "可以加我的粉丝群", "或者在评论区打工作流", "我是宁少", "陪伴AI时代的超级个体"]),
]
toks = [dict(t=x["t"].strip(), s=x["s"]) for x in json.load(open(asr, encoding="utf-8"))["tokens"] if x["t"].strip()]
SR = 48000; FR = 30
raw = os.path.join(pub, "_raw.wav"); subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-i", src, "-vn", "-ac", "2", "-ar", str(SR), raw], check=True)
A, _ = sf.read(raw); mono = A.mean(1); H = SR // 50
db = np.array([20 * np.log10(np.sqrt((mono[i:i + H] ** 2).mean()) + 1e-9) for i in range(0, len(mono) - H, H)]); dbt = np.arange(len(db)) * H / SR
snap = lambda x: round(x * FR) / FR
cjk = lambda c: "一" <= c <= "鿿"
pieces = []; lines = []; seg_cuts = []; micro = []; off = 0.0; chapters = []
for ci, (chap, a, b, subs) in enumerate(CUTS):
    m = (dbt >= a) & (dbt < b); seg, ts = db[m], dbt[m]; thr = max(np.percentile(seg, 10) + 10, np.percentile(seg, 60) - 17); loud = seg >= thr
    on = np.where(loud)[0]; s0 = max(a, ts[on[0]] - 0.05); s1 = min(b, ts[on[-1]] + 0.02 + 0.12)
    keep = []; cur = s0; i = on[0]; gaps = []
    while i <= on[-1]:
        if not loud[i]:
            j = i
            while j <= on[-1] and not loud[j]: j += 1
            g0, g1 = ts[i], ts[min(j, len(ts) - 1)]; gap = g1 - g0
            if gap >= 0.1:
                leave = 0.15 if gap >= 0.3 else 0.06; keep.append((cur, g0 + leave / 2)); gaps.append(gap - leave); cur = g1 - leave / 2
            i = j
        else: i += 1
    keep.append((cur, s1)); keep = [(snap(x), snap(y)) for x, y in keep if snap(y) > snap(x)]
    start = off; mp = []
    for k, (x, y) in enumerate(keep):
        if k and gaps[k - 1] >= 0.15: micro.append(round(off, 3))
        mp.append((x, y, off)); pieces.append((x, y)); off += y - x
    def M(tt):
        for x, y, o in mp:
            if tt < y: return o + max(0.0, tt - x)
        return mp[-1][2] + mp[-1][1] - mp[-1][0]
    tk = [x for x in toks if a - 0.02 <= x["s"] <= b]; p = 0
    for li, text in enumerate(subs):
        chars = []; last = None
        for ii, c in enumerate(text):
            hit = None
            if cjk(c):
                for q in range(p, min(len(tk), p + 4)):
                    if tk[q]["t"] == c: hit = q; break
            elif c in "AaIi" or c.isascii():
                for q in range(p, min(len(tk), p + 3)):
                    if not cjk(tk[q]["t"][0]): hit = q; break
            if hit is not None: last = M(tk[hit]["s"]); p = hit + 1
            elif cjk(c) and p < len(tk): last = M(tk[p]["s"]); p += 1          # 识别错字（「淡你」→「蛋解」）按顺序顶上
            chars.append({"c": c, "i": ii, "t": round(last if last is not None else start, 3)})
        lines.append({"n": len(lines) + 1, "chap": chap, "text": text, "start": chars[0]["t"] if li else round(start, 3), "chars": chars})
    if start: seg_cuts.append(round(start, 3))
    if not chapters or chapters[-1]["name"] != chap: chapters.append({"name": chap, "start": round(start, 3)})
    print(f"  {chap} {a:.1f}–{b:.1f}: {b - a:.2f} → {off - start:.2f} 秒，收了 {len(keep) - 1} 个气口")
for k, l in enumerate(lines):
    nxt = lines[k + 1]["start"] if k + 1 < len(lines) else off; l["end"] = round(max(l["start"] + 0.3, nxt - 0.03), 3); l["chars"][0]["t"] = l["start"]
segments = [{"id": i + 1, "name": c["name"], "start": c["start"], "end": (chapters[i + 1]["start"] if i + 1 < len(chapters) else round(off, 3)), "lines": [l["n"] for l in lines if l["chap"] == c["name"]]} for i, c in enumerate(chapters)]
ids = {s_["name"]: s_["id"] for s_ in segments}
for l in lines: l["seg"] = ids[l.pop("chap")]
F = int(0.006 * SR); out = []
for x, y in pieces:
    c = A[int(round(x * SR)):int(round(y * SR))].copy(); r = np.linspace(0, 1, min(F, len(c) // 2))[:, None]; c[:len(r)] *= r; c[len(c) - len(r):] *= r[::-1]; out.append(c)
vraw = os.path.join(pub, "_voice.wav"); sf.write(vraw, np.concatenate(out), SR)
subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-i", vraw, "-af", "highpass=f=70,afftdn=nr=10:nf=-45,loudnorm=I=-15:TP=-1.5:LRA=9", "-ar", str(SR), "-ac", "2", os.path.join(pub, "voice.wav")], check=True)
sel = "+".join(f"between(n,{int(round(x * FR))},{int(round(y * FR)) - 1})" for x, y in pieces)
subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-i", src, "-an", "-vf", f"fps={FR},select='{sel}',setpts=N/{FR}/TB", "-r", str(FR), "-c:v", "libx264", "-crf", "16", "-g", "15", "-pix_fmt", "yuv420p", os.path.join(pub, "person.mp4")], check=True)
for f_ in (raw, vraw): os.remove(f_)
json.dump({"fps": FR, "total": round(off, 3), "segments": segments, "lines": lines}, open(os.path.join(HERE, "timing.json"), "w", encoding="utf-8"), ensure_ascii=False)
json.dump({"segments": seg_cuts, "micro": micro}, open(os.path.join(HERE, "cuts.json"), "w"), ensure_ascii=False)
print(f"正文 {off:.2f} 秒，{len(lines)} 行字幕，{len(seg_cuts)} 个段间剪口，{len(micro)} 个收气口")
for l in lines: print(f"  {l['n']:>2} {l['start']:6.2f}–{l['end']:6.2f}  {l['text']}")
