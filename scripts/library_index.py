#!/usr/bin/env python3
"""素材入库：把一个目录里的原始素材（视频、图片）拆成镜头，转成成片用的规格，生成素材目录和联系表。
用法：scripts/library_index.py <原始素材目录> <输出目录，如 studio/public/<期>/clips> [--min 1.5] [--scene 0.25]
  视频：按画面突变拆镜头，短于 --min 秒的丢掉；每个镜头存成 <原文件名>-<序号>.mp4（长边不超过 1440，去掉声音）。
  图片：原样复制（jpg/png）。
输出：
  <输出目录>/library.json   每条素材一项：id、src（相对 studio/public）、kind、dur、w、h、fit（cover 横版 / pad 竖版或截图）、faces（有没有人脸）、desc（空着）
  <输出目录>/联系表.jpg      每条素材一格，左上角写着 id
下一步由助手看联系表，把每条的 desc 填上（一句话：地点、谁、在干什么、有没有文字），排版式时按 desc 找画面。
已经在 library.json 里的 id 不会被覆盖（desc 和 used 保留）。"""
import argparse, glob, json, os, shutil, subprocess, sys
import cv2
ap = argparse.ArgumentParser(); ap.add_argument("src"); ap.add_argument("out"); ap.add_argument("--min", type=float, default=1.5); ap.add_argument("--scene", type=float, default=0.25); a = ap.parse_args()
os.makedirs(a.out, exist_ok=True); pub = os.path.abspath(a.out).split("/studio/public/")[-1]
lib_path = os.path.join(a.out, "library.json"); lib = {x["id"]: x for x in (json.load(open(lib_path, encoding="utf-8")) if os.path.exists(lib_path) else [])}
model = os.path.expanduser("~/.cache/video-studio/yunet.onnx")
def has_face(im):
    if not os.path.exists(model): return None
    h, w = im.shape[:2]; _, fs = cv2.FaceDetectorYN.create(model, "", (w, h), 0.75, 0.3, 50).detect(im)
    return bool(fs is not None and any(f[3] >= h * 0.1 for f in fs))
def probe(f):
    r = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height:format=duration", "-of", "json", f], capture_output=True, text=True); j = json.loads(r.stdout)
    return j["streams"][0]["width"], j["streams"][0]["height"], float(j["format"].get("duration", 0))
def add(id_, src, kind, dur, w, h, thumb):
    old = lib.get(id_, {}); im = cv2.imread(thumb)
    lib[id_] = {"id": id_, "src": f"{pub}/{src}", "kind": kind, "dur": round(dur, 2), "w": w, "h": h, "fit": "cover" if w / h >= 1.2 else "pad", "faces": has_face(im), "desc": old.get("desc", ""), "used": old.get("used", [])}
tmp = os.path.join(a.out, ".thumbs"); os.makedirs(tmp, exist_ok=True)
for f in sorted(glob.glob(os.path.join(a.src, "*"))):
    base, ext = os.path.splitext(os.path.basename(f)); ext = ext.lower()
    if ext in (".jpg", ".jpeg", ".png"):
        shutil.copy(f, os.path.join(a.out, base + ext)); im = cv2.imread(f); h, w = im.shape[:2]
        t = os.path.join(tmp, base + ".jpg"); cv2.imwrite(t, im); add(base, base + ext, "image", 0, w, h, t); continue
    if ext not in (".mp4", ".mov", ".m4v", ".mkv", ".webm"): continue
    w, h, dur = probe(f)
    r = subprocess.run(["ffmpeg", "-nostdin", "-i", f, "-vf", f"scale=360:-1,select='gt(scene,{a.scene})',showinfo", "-an", "-f", "null", "-"], capture_output=True, text=True)
    cuts = [0.0] + [float(x.split("pts_time:")[1].split()[0]) for x in r.stderr.splitlines() if "pts_time:" in x] + [dur]
    n = 0
    for s, e in zip(cuts, cuts[1:]):
        if e - s < a.min: continue
        n += 1; id_ = f"{base}-{n:02d}"; o = os.path.join(a.out, id_ + ".mp4")
        subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-ss", f"{s + 0.04:.3f}", "-i", f, "-t", f"{e - s - 0.1:.3f}", "-an", "-vf", "scale='min(1440,iw)':-2", "-r", "30", "-c:v", "libx264", "-crf", "18", "-preset", "fast", "-pix_fmt", "yuv420p", o], check=True)
        t = os.path.join(tmp, id_ + ".jpg"); subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-ss", f"{(e - s) / 2:.2f}", "-i", o, "-frames:v", "1", t], check=True)
        w2, h2, d2 = probe(o); add(id_, id_ + ".mp4", "video", d2, w2, h2, t)
items = sorted(lib.values(), key=lambda x: x["id"])
json.dump(items, open(lib_path, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
cells = []
for x in items:
    t = os.path.join(tmp, x["id"] + ".jpg")
    if not os.path.exists(t): continue
    im = cv2.imread(t); h, w = im.shape[:2]; s = min(320 / w, 240 / h); im = cv2.resize(im, (int(w * s), int(h * s)))
    c = cv2.copyMakeBorder(im, 0, 240 - im.shape[0], 0, 320 - im.shape[1], cv2.BORDER_CONSTANT, value=(30, 30, 30))
    cv2.rectangle(c, (0, 0), (320, 26), (0, 0, 0), -1); cv2.putText(c, f"{x['id']}  {x['dur']}s", (6, 19), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1, cv2.LINE_AA); cells.append(c)
if cells:
    import numpy as np
    cols = 5; rows = [np.hstack(cells[i:i + cols] + [np.zeros_like(cells[0])] * (cols - len(cells[i:i + cols]))) for i in range(0, len(cells), cols)]
    cv2.imwrite(os.path.join(a.out, "联系表.jpg"), np.vstack(rows))
shutil.rmtree(tmp); print(f"{len(items)} 条素材 → {lib_path}；看 {a.out}/联系表.jpg 后把 desc 填上")
