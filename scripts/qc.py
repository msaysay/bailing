#!/usr/bin/env python3
"""出片前自查：黑场、闪帧、亮度突变、画面停滞、响度，并输出每秒一张的联系表。
用法：scripts/qc.py <成片.mp4> [--out <目录>] [--stall 6.0] [--ignore-bottom 0.2]
画面停滞的判断会忽略底部一条（默认 20%），否则字幕换行会掩盖上方画面没动。"""
import argparse, json, os, re, subprocess, sys
import numpy as np
ap = argparse.ArgumentParser(); ap.add_argument("video"); ap.add_argument("--out"); ap.add_argument("--stall", type=float, default=6.0); ap.add_argument("--ignore-bottom", type=float, default=0.2)
a = ap.parse_args(); out = a.out or os.path.join(os.path.dirname(a.video), "qc"); os.makedirs(out, exist_ok=True)
def run(cmd): return subprocess.run(cmd, capture_output=True, text=True)
pr = json.loads(run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=r_frame_rate,nb_frames:format=duration", "-of", "json", a.video]).stdout)
num, den = pr["streams"][0]["r_frame_rate"].split("/"); fps = int(num) / int(den); dur = float(pr["format"]["duration"])
W, H = 160, 90
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", a.video, "-vf", f"scale={W}:{H},format=gray", "-f", "rawvideo", "-"], capture_output=True).stdout
fr = np.frombuffer(raw, np.uint8).reshape(-1, H, W).astype(np.int16); n = len(fr)
top = fr[:, : int(H * (1 - a.ignore_bottom))]
mean = fr.reshape(n, -1).mean(1)
d_all = np.abs(np.diff(fr, axis=0)).reshape(n - 1, -1).mean(1)            # 相邻帧整体差
chg = (np.abs(np.diff(top, axis=0)) > 12).reshape(n - 1, -1).mean(1)      # 上方画面变化的像素占比
res = {}
blk = mean < 6; runs = []; i = 0
while i < n:
    if blk[i]:
        j = i
        while j < n and blk[j]: j += 1
        if (j - i) / fps >= 0.2: runs.append([round(i / fps, 2), round(j / fps, 2)])
        i = j
    else: i += 1
res["黑场"] = runs
# 闪帧：某帧与前后都差很大，但前后两帧彼此接近
flash = [round((i + 1) / fps, 2) for i in range(n - 2) if d_all[i] > 18 and d_all[i + 1] > 18 and np.abs(fr[i] - fr[i + 2]).mean() < 5]
res["闪帧"] = flash
res["亮度突变"] = [round((i + 1) / fps, 2) for i in np.where(np.abs(np.diff(mean)) > 25)[0]]
# 画面停滞：隔半秒比较一次（逐帧比会漏掉交叉淡化、慢速移动这类渐变），上方画面连续 stall 秒都几乎没变才算
h = max(1, int(round(fps / 2))); chg2 = (np.abs(top[h:] - top[:-h]) > 12).reshape(n - h, -1).mean(1)
moving = np.concatenate([chg2 > 0.01, np.zeros(h - 1, bool)]) if h > 1 else chg2 > 0.01; stalls = []; i = 0
while i < n - 1:
    if not moving[i]:
        j = i
        while j < n - 1 and not moving[j]: j += 1
        if (j - i) / fps > a.stall: stalls.append([round(i / fps, 2), round(j / fps, 2)])
        i = j
    else: i += 1
res["画面停滞"] = stalls
ln = run(["ffmpeg", "-hide_banner", "-i", a.video, "-af", "loudnorm=print_format=json", "-f", "null", "-"]).stderr
m = re.search(r"\{[^{}]*input_i[^{}]*\}", ln, re.S); L = json.loads(m.group(0)) if m else {}
res["响度LUFS"] = float(L.get("input_i", "nan")); res["峰值dBTP"] = float(L.get("input_tp", "nan"))
# 画面最长两次明显变化之间的间隔（按 4–6 秒一变的规则参考）
big = np.where(chg > 0.02)[0]; gaps = np.diff(np.concatenate([[0], big, [n - 1]])) / fps
res["最长无明显变化秒"] = round(float(gaps.max()), 2)
cols = 10; rows = int(np.ceil(dur / cols))
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", a.video, "-vf", f"fps=1,scale=384:-1,drawtext=text='%{{pts\\:hms}}':x=6:y=6:fontsize=18:fontcolor=white:box=1:boxcolor=black@0.6,tile={cols}x{rows}:padding=3", "-frames:v", "1", os.path.join(out, "sheet-1fps.jpg")])
ok = not res["黑场"] and not res["闪帧"] and not res["亮度突变"] and not res["画面停滞"] and -18 <= res["响度LUFS"] <= -14 and res["峰值dBTP"] <= -1
res["机器检查"] = "通过" if ok else "未通过"
json.dump(res, open(os.path.join(out, "qc.json"), "w"), ensure_ascii=False, indent=1)
for k, v in res.items(): print(f"{k}: {v}")
print("联系表：", os.path.join(out, "sheet-1fps.jpg"))
sys.exit(0 if ok else 1)
