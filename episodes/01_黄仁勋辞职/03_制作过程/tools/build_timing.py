#!/usr/bin/env python3
"""asr.json（逐字起点）+ lines.json（字幕行与其对应的识别原文）→ 剪掉重说、去片头静音、提响度，
输出 remotion/public/voice.wav 与 remotion/src/timing.json（全片唯一时间源）。
用法：python3 tools/build_timing.py <原始录音>   （在 03_制作过程 目录下运行）"""
import json, subprocess, sys
src = sys.argv[1]
asr = json.load(open("asr.json")); lines = json.load(open("lines.json"))
toks = [(t["t"].strip().lower(), t["s"]) for t in asr["tokens"] if t["t"].strip()]
flat = "".join(t for t, _ in toks); idx = []          # flat 字符 → token 序号
for i, (t, _) in enumerate(toks): idx += [i] * len(t)
pos = 0; LEAD = 0.40
for ln in lines:
    a = ln["asr"].replace(" ", "").lower(); p = flat.find(a, pos)
    if p < 0: sys.exit(f"对不上识别原文：{ln['asr']}")
    if p != pos: sys.exit(f"有识别文字没被任何一行覆盖：{flat[pos:p]}")
    ln["i0"], ln["i1"] = idx[p], idx[p + len(a) - 1]; pos = p + len(a)
if pos != len(flat): sys.exit(f"结尾有未覆盖文字：{flat[pos:]}")
onset = [s for _, s in toks]; dur = asr["dur"]
# 保留区间：片头静音与标了 cut 的行剪掉；剪口放在字起点前 60ms
keep, cur = [], max(0.0, onset[0] - LEAD)
for k, ln in enumerate(lines):
    if ln.get("cut"):
        a = onset[ln["i0"]] - 0.06; b = onset[lines[k + 1]["i0"]] - 0.06
        keep.append((cur, a)); cur = b
keep.append((cur, min(dur, onset[-1] + 1.2)))
def remap(t):
    off = 0.0
    for a, b in keep:
        if t < a: return off
        if t <= b: return off + (t - a)
        off += b - a
    return off
total = sum(b - a for a, b in keep)
out, vis = [], [l for l in lines if not l.get("cut")]
for k, ln in enumerate(vis):
    start = remap(onset[ln["i0"]]); last = remap(onset[ln["i1"]])
    nxt = remap(onset[vis[k + 1]["i0"]]) if k + 1 < len(vis) else total
    chars = [{"c": toks[i][0], "t": round(remap(onset[i]), 3)} for i in range(ln["i0"], ln["i1"] + 1)]
    out.append({"n": k + 1, "seg": ln["seg"], "text": ln["text"], "asr": ln["asr"],
                "start": round(start, 3), "end": round(min(nxt, last + 0.55), 3), "chars": chars})
segs = {}
for l in out: segs.setdefault(l["seg"], []).append(l)
seglist = []
for s in sorted(segs):
    seglist.append({"id": s, "start": segs[s][0]["start"], "lines": [l["n"] for l in segs[s]]})
for a, b in zip(seglist, seglist[1:]):          # 段界放在后一段首字前 0.25s
    a["end"] = round(b["start"] - 0.25, 3); b["start"] = a["end"]
seglist[0]["start"] = 0.0; seglist[-1]["end"] = round(total, 3)
json.dump({"fps": 30, "total": round(total, 3), "segments": seglist, "lines": out},
          open("remotion/src/timing.json", "w"), ensure_ascii=False, indent=1)
parts = "".join(f"[0:a]atrim={a:.3f}:{b:.3f},asetpts=PTS-STARTPTS,afade=t=in:d=0.02,afade=t=out:st={b-a-0.02:.3f}:d=0.02[p{i}];" for i, (a, b) in enumerate(keep))
graph = parts + "".join(f"[p{i}]" for i in range(len(keep))) + f"concat=n={len(keep)}:v=0:a=1,pan=mono|c0=0.5*c0+0.5*c1,loudnorm=I=-16:TP=-1.5:LRA=9[o]"
subprocess.run(["ffmpeg", "-v", "fatal", "-y", "-err_detect", "ignore_err", "-i", src, "-filter_complex", graph, "-map", "[o]", "-ar", "48000", "remotion/public/voice.wav"], check=True)
print(f"保留区间 {[(round(a,2),round(b,2)) for a,b in keep]} 总长 {total:.2f}s，{len(out)} 行字幕，{len(seglist)} 段")
for s in seglist: print(s["id"], s["start"], s["end"])
