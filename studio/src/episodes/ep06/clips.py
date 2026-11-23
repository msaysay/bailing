#!/usr/bin/env python3
"""把下载的新闻画面切成这一期要用的镜头（1920×1080、30 帧、无声），新闻台的台标和滚动条裁掉，只留画面主体。
用法：python3 studio/src/episodes/ep06/clips.py   素材在 episodes/06_黄仁勋回归/01_输入素材/footage/，产出 studio/public/ep06/clips/。"""
import os, subprocess
R = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "..")); SRC = os.path.join(R, "episodes", "06_黄仁勋回归", "01_输入素材", "footage"); OUT = os.path.join(R, "studio", "public", "ep06", "clips"); os.makedirs(OUT, exist_ok=True)
# (名字, 源文件, 起, 长, 裁剪 [x, y, w, h]（占画面的比例）或 None, 竖屏保留原样)
CLIPS = [
 ("stage1", "jensen_codesign", 0.0, 8.0, None, False),
 ("stage2", "jensen_codesign", 14.5, 8.5, None, False),
 ("keynote", "jensen_eu", 89.0, 6.0, None, False),
 ("keynote2", "jensen_eu", 99.0, 5.5, None, False),
 ("blackwell", "reuters", 15.2, 4.0, None, False),
 ("mics", "reuters", 0.0, 3.8, [0.15, 0.0, 0.6, 0.6], False),
 ("bbg_huang", "bbg_gov", 126.0, 5.5, [0.29, 0.06, 0.68, 0.68], False),
 ("bbg_stage", "bbg_gov", 130.0, 2.5, [0.29, 0.06, 0.68, 0.68], False),
 ("ticker", "bbg_gov", 225.0, 6.0, [0.0, 0.0, 0.84, 0.84], False),
 ("seat", "bbg_surge", 13.5, 8.0, [0.29, 0.06, 0.68, 0.68], False),
 ("post", "bbg_gov", 141.0, 12.0, [0.24, 0.14, 0.655, 0.655], False),
 ("shake", "abc", 75.0, 3.6, [0.42, 0.06, 0.56, 0.56], False),
 ("together", "abc", 79.2, 6.0, [0.42, 0.06, 0.56, 0.56], False),
 ("trump_cnbc", "trump_cnbc", 2.0, 10.0, None, False),
 ("revenue", "bofa", 13.0, 14.0, [0.41, 0.04, 0.56, 0.56], False),
 ("witt", "witt", 14.0, 8.0, None, False),
 ("musk", "musk", 0.0, 10.0, None, True),
 ("trump2", "trump_second", 0.0, 12.0, None, True),
]
for name, src, a, d, crop, vert in CLIPS:
    vf = "fps=30"
    if crop: x, y, w, h = crop; vf += f",crop=iw*{w}:iw*{w}*9/16:iw*{x}:ih*{y},scale=1920:1080:flags=lanczos"
    elif not vert: vf += ",scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080"
    subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-ss", str(a), "-t", str(d), "-i", os.path.join(SRC, src + ".mp4"), "-an", "-vf", vf, "-c:v", "libx264", "-crf", "17", "-pix_fmt", "yuv420p", os.path.join(OUT, name + ".mp4")], check=True)
    print(name)
