#!/usr/bin/env python3
"""口播粗剪：按语音识别的逐字时间，剪掉口误和过长的停顿，输出剪好的视频和「剪口」时间表。
用法：scripts/roughcut.py <原视频> <asr.json> --out <输出.mp4> --cuts <cuts.json>
        [--drop "7.55-10.48,70.8-71.72"]   要整段删掉的口误（秒，原视频时间；先看 asr.json 里的逐字时间再定）
        [--max-gap 0.7] [--keep-gap 0.35]  两个字之间静音超过 max-gap 就收紧到 keep-gap
        [--vf "delogo=x=30:y=280:w=680:h=90,crop=1080:1620:0:240"]   剪完后统一做的画面处理（去水印、裁切）
输出 cuts.json：{"dur": 剪后总长, "cuts": [剪后时间轴上每个剪口的时刻], "kept": [[原起, 原止], …]}
剪口处人会「跳」一下。成片里在剪口切换版式或景别（推近、拉远）把它盖住，见 kit/talk.tsx。"""
import argparse, json, subprocess
ap = argparse.ArgumentParser(); ap.add_argument("video"); ap.add_argument("asr"); ap.add_argument("--out", required=True); ap.add_argument("--cuts", required=True)
ap.add_argument("--drop", default=""); ap.add_argument("--max-gap", type=float, default=0.7); ap.add_argument("--keep-gap", type=float, default=0.35); ap.add_argument("--vf", default=""); ap.add_argument("--fps", type=int, default=24)
a = ap.parse_args(); d = json.load(open(a.asr)); tk = d["tokens"]; CH = 0.22   # 一个字大约念 0.22 秒
drops = [tuple(float(x) for x in p.split("-")) for p in a.drop.split(",") if p]
tk = [t for t in tk if not any(lo <= t["s"] < hi for lo, hi in drops)]
for i in range(len(tk) - 1):                      # 过长的停顿：字尾留一半，下个字前留一半
    end, nxt = tk[i]["s"] + CH, tk[i + 1]["s"]
    if nxt - end > a.max_gap and not any(lo < nxt and hi > end for lo, hi in drops): drops.append((end + a.keep_gap / 2, nxt - a.keep_gap / 2))
drops.append((min(d["dur"], tk[-1]["s"] + CH + 0.5), d["dur"] + 1)); drops.sort()
kept, cur = [], max(0.0, tk[0]["s"] - 0.25)
for lo, hi in drops:
    if lo > cur + 0.05: kept.append([round(cur, 3), round(lo, 3)])
    cur = max(cur, hi)
fc, n = [], len(kept)
for i, (s, e) in enumerate(kept):
    fc.append(f"[0:v]trim={s}:{e},setpts=PTS-STARTPTS[v{i}];[0:a]atrim={s}:{e},asetpts=PTS-STARTPTS,afade=t=in:d=0.012,afade=t=out:st={e - s - 0.012:.3f}:d=0.012[a{i}]")
fc.append("".join(f"[v{i}][a{i}]" for i in range(n)) + f"concat=n={n}:v=1:a=1[vc][ac];[vc]{a.vf + ',' if a.vf else ''}fps={a.fps}[vo]")
subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-i", a.video, "-filter_complex", ";".join(fc), "-map", "[vo]", "-map", "[ac]", "-c:v", "libx264", "-crf", "16", "-g", "12", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", a.out], check=True)
cuts, t = [], 0.0
for s, e in kept[:-1]: t += e - s; cuts.append(round(t, 3))
json.dump({"dur": round(t + kept[-1][1] - kept[-1][0], 3), "cuts": cuts, "kept": kept}, open(a.cuts, "w"), indent=1)
print(f"保留 {n} 段，剪后 {t + kept[-1][1] - kept[-1][0]:.1f} 秒（原 {d['dur']:.1f} 秒），剪口 {len(cuts)} 个：", cuts)
