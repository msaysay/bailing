#!/usr/bin/env python3
"""把组件演示片切成官网用的小片段和缩略图。
先渲演示片：cd studio && npx remotion render src/index.tsx GALLERY out/gallery-s.mp4 --scale=0.5 --crf=23
用法：python3 site/tools/build_media.py <演示片> [起始序号]     输出到 site/assets/demos、site/assets/thumbs
只补新组件时：用 --frames=<起始序号×150>-<末帧> 只渲新增那一段，再把起始序号传进来（演示片从那个组件开始）。
每个组件 5 秒，顺序和 site/data.js 里的一致。"""
import json, os, re, subprocess, sys
from concurrent.futures import ThreadPoolExecutor
root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))); src = sys.argv[1]; SLOT = 5; START = int(sys.argv[2]) if len(sys.argv) > 2 else 0
comps = json.loads(re.sub(r"^window\.SITE_DATA = |;\s*$", "", open(os.path.join(root, "site/data.js"), encoding="utf-8").read()))["components"]
D, T = os.path.join(root, "site/assets/demos"), os.path.join(root, "site/assets/thumbs"); os.makedirs(D, exist_ok=True); os.makedirs(T, exist_ok=True)
def one(c):
    t = (c["i"] - START) * SLOT
    subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-ss", str(t), "-t", str(SLOT), "-i", src, "-an", "-vf", "scale=640:360", "-c:v", "libx264", "-crf", "29", "-preset", "slow", "-pix_fmt", "yuv420p", "-movflags", "+faststart", f"{D}/{c['id']}.mp4"], check=True)
    subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-ss", str(t + 3.9), "-i", src, "-frames:v", "1", "-vf", "scale=640:360", "-q:v", "5", f"{T}/{c['id']}.jpg"], check=True)
with ThreadPoolExecutor(4) as ex: comps = [c for c in comps if c["i"] >= START]; list(ex.map(one, comps))
size = sum(os.path.getsize(os.path.join(p, f)) for p in (D, T) for f in os.listdir(p)); print(len(comps), "个组件，合计", round(size / 1e6, 1), "MB")
