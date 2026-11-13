#!/usr/bin/env python3
"""分段渲染：整片按 timing.json 的段切成小块各自渲染并缓存，改哪段只重渲哪段，再无损拼接。
用法（在 studio 目录下）：
  python3 ../scripts/seg_render.py <合成名> --timing src/episodes/<期>/timing.json --out out/<成片>.mp4            # 缺哪块渲哪块
  python3 ../scripts/seg_render.py <合成名> --timing … --out … --only 9,13         # 只重渲第 9、13 段（段号见 timing.json）
  python3 ../scripts/seg_render.py <合成名> --timing … --out … --only 市场,业绩     # 也可以写段名
  python3 ../scripts/seg_render.py <合成名> --timing … --out … --audio             # 声音改了（配音、音乐、音效）时重渲音轨
每块是纯画面，音轨整条单独渲一次；画面由帧号唯一决定，所以分开渲和整片渲逐帧一致，段间的淡入淡出不受影响。
一段 10 秒左右的块约 1 分钟渲完，比整片重渲省九成以上。无显示器的机器设置环境变量 CHROME_PATH。"""
import argparse, json, os, subprocess, sys
ap = argparse.ArgumentParser(); ap.add_argument("comp"); ap.add_argument("--timing", required=True); ap.add_argument("--out", required=True)
ap.add_argument("--only", default=""); ap.add_argument("--audio", action="store_true"); ap.add_argument("--concurrency", default="4"); a = ap.parse_args()
tm = json.load(open(a.timing)); fps = tm["fps"]; total = -(-int(tm["total"] * fps * 1000) // 1000); total = int(-(-tm["total"] * fps // 1))
cache = os.path.join("out", "chunks", a.comp); os.makedirs(cache, exist_ok=True)
segs = tm["segments"]; rng = []
for i, s in enumerate(segs):
    f0 = 0 if i == 0 else round(s["start"] * fps); f1 = (total if i == len(segs) - 1 else round(segs[i + 1]["start"] * fps)) - 1
    rng.append((s["id"], s["name"], f0, f1))
only = {x.strip() for x in a.only.split(",") if x.strip()}
br = ["--browser-executable=" + os.environ["CHROME_PATH"]] if os.environ.get("CHROME_PATH") else []
base = ["npx", "remotion", "render", "src/index.tsx", a.comp, "--log=error", "--concurrency=" + a.concurrency] + br
done = []
for sid, name, f0, f1 in rng:
    p = os.path.join(cache, f"{sid:02d}.mp4")
    if os.path.exists(p) and str(sid) not in only and name not in only: continue
    print(f"渲染第 {sid} 段「{name}」 帧 {f0}–{f1}（{(f1 - f0 + 1) / fps:.1f} 秒）", flush=True)
    subprocess.run(base + [p + ".tmp.mp4", f"--frames={f0}-{f1}", "--muted", "--crf=18"], check=True); os.replace(p + ".tmp.mp4", p); done.append(sid)
wav = os.path.join(cache, "audio.wav")
if a.audio or not os.path.exists(wav):
    print("渲染音轨", flush=True); subprocess.run(base + [wav, "--codec=wav"], check=True)
lst = os.path.join(cache, "list.txt"); open(lst, "w").write("".join(f"file '{sid:02d}.mp4'\n" for sid, *_ in rng))
subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", lst, "-i", wav, "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", a.out], check=True)
n = int(subprocess.run(["ffprobe", "-v", "error", "-count_packets", "-select_streams", "v:0", "-show_entries", "stream=nb_read_packets", "-of", "csv=p=0", a.out], capture_output=True, text=True).stdout.strip().split(",")[0])
print(f"重渲 {len(done)} 段{done}，成片 {a.out}，共 {n} 帧（应为 {total}）" + ("" if n == total else "  ← 帧数不对，检查分段"))
sys.exit(0 if n == total else 1)
