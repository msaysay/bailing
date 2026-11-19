#!/usr/bin/env python3
"""自动调光：原片光不好（偏暗、偏色）时，算出一串 ffmpeg 滤镜，接在 roughcut.py 的 --vf 最前面。不直接改视频。
用法：scripts/grade.py <口播原片> <调光.json> [--beauty 0~1] [--strength 0~1] [--preview 调光对比.jpg]
      最后一行打印滤镜串；--preview 出一张左原片右调后的对比图，先看图再用。
怎么调的：先找人脸，以脸部亮度为准（目标 0.58，量自蛋解创业三条成片的口播镜头），不按全画面平均，暗调布景不会被硬拉亮；
      白平衡拿画面里最亮一档的中性高光估色偏，只修八成；再叠轻 S 曲线、饱和加 8%、轻锐化。
      --beauty 是保边磨皮（双边滤波），不瘦脸、不改五官；0.3 左右就够，默认不开。
救不了的：混合色温、严重过曝、要分区域补光压光的。对比图看着不对就别用，请用户在外面调好再给。
依赖：numpy；找人脸要 opencv-python-headless（4.10 及以下，带 CascadeClassifier）。"""
import argparse, json, subprocess, sys, math
import numpy as np

TARGET_FACE = 0.58   # 脸部亮度中位数目标（0..1，gamma 空间），量自对标成片口播镜头
TARGET_P99, TARGET_P1 = 0.88, 0.03

def probe(src):
    j = json.loads(subprocess.check_output(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries",
        "stream=width,height:stream_side_data=rotation:format=duration", "-of", "json", src]))
    st = j["streams"][0]; w, h = st["width"], st["height"]
    rot = abs(int(st.get("side_data_list", [{}])[0].get("rotation", 0))) if st.get("side_data_list") else 0
    if rot in (90, 270): w, h = h, w
    return w, h, float(j["format"]["duration"])

def frames(src, n, w, h, dur, vf=""):
    sw = 360; sh = int(round(h * sw / w / 2) * 2)
    out = []
    for i in range(n):
        t = dur * (i + .5) / n
        f = f"scale={sw}:{sh}" + ("," + vf if vf else "")
        raw = subprocess.check_output(["ffmpeg", "-v", "error", "-ss", f"{t:.2f}", "-i", src, "-frames:v", "1", "-vf", f, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"])
        if len(raw) == sw * sh * 3: out.append(np.frombuffer(raw, np.uint8).reshape(sh, sw, 3))
    return out

def find_face(fs):
    try:
        import cv2
    except ImportError:
        return None
    det = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
    boxes = []
    for f in fs:
        g = cv2.cvtColor(f, cv2.COLOR_RGB2GRAY)
        r = det.detectMultiScale(g, 1.1, 5, minSize=(g.shape[1] // 8, g.shape[1] // 8))
        if len(r): boxes.append(max(r, key=lambda b: b[2] * b[3]))
    if not boxes: return None
    x, y, w, h = np.median(np.array(boxes), axis=0)
    H, W = fs[0].shape[:2]
    return {"cx": float((x + w / 2) / W), "cy": float((y + h / 2) / H), "w": float(w / W), "h": float(h / H), "hits": len(boxes)}

def luma(a): return (a[..., 0] * .2126 + a[..., 1] * .7152 + a[..., 2] * .0722) / 255.0

def stats(fs, face):
    Y = np.stack([luma(f.astype(np.float32)) for f in fs])
    s = {"p1": float(np.percentile(Y, 1)), "p50": float(np.percentile(Y, 50)), "p99": float(np.percentile(Y, 99)), "mean": float(Y.mean())}
    H, W = fs[0].shape[:2]
    if face:
        x0, x1 = int((face["cx"] - face["w"] * .3) * W), int((face["cx"] + face["w"] * .3) * W)
        y0, y1 = int((face["cy"] - face["h"] * .25) * H), int((face["cy"] + face["h"] * .3) * H)
        reg = np.stack([f[y0:y1, x0:x1] for f in fs]).astype(np.float32)
        s["face"] = float(np.median(luma(reg)))
        s["face_rgb"] = [float(np.median(reg[..., i])) / 255 for i in range(3)]
    A = np.stack(fs).astype(np.float32) / 255
    # 白平衡参照：画面里最亮的一档像素（白纸/灯箱/白墙高光），剔除过曝；它们本该是中性色
    Yall = luma(A * 255)
    lo_, hi_ = np.percentile(Yall, 92), np.percentile(Yall, 99.7)
    m = (Yall >= lo_) & (Yall <= hi_) & (A.max(-1) < .985)
    s["neutral_rgb"] = [float(A[..., i][m].mean()) for i in range(3)] if m.sum() > 500 else None
    return s

def build(s, strength=1.0, beauty=0.0):
    f = []
    if beauty > 0:
        f.append(f"bilateral=sigmaS={2 + 4 * beauty:.1f}:sigmaR={.03 + .07 * beauty:.3f}")
    # 1) 白平衡（修八成，单通道 -25%/+30% 封顶；偏色小于 2% 不动）
    gains = [1, 1, 1]
    if s.get("neutral_rgb"):
        n = s["neutral_rgb"]; g = sum(n) / 3
        gains = [min(1.30, max(.75, 1 + (g / c - 1) * .8 * strength)) for c in n]
        if max(abs(x - 1) for x in gains) > .02:
            f.append("colorchannelmixer=rr={:.3f}:gg={:.3f}:bb={:.3f}".format(*gains))
    # 2) 黑白场
    lo = max(0.0, (s["p1"] - TARGET_P1) * strength)
    hi = 1.0
    if s["p99"] < TARGET_P99 - .06:          # 只在明显欠曝时拉白场，暗调布景不硬拉
        hi = 1 - (TARGET_P99 - s["p99"]) * strength
        if "face" in s: hi = max(hi, min(1.0, s["face"] / TARGET_FACE))   # 拉白场不能让脸过曝
    hi = max(hi, lo + .5)
    if lo > .01 or hi < .99:
        f.append("colorlevels=rimin={0:.3f}:gimin={0:.3f}:bimin={0:.3f}:rimax={1:.3f}:gimax={1:.3f}:bimax={1:.3f}".format(lo, hi))
    # 3) 以脸为锚的 gamma
    anchor, target = (s["face"], TARGET_FACE) if "face" in s else (s["p50"], .40)
    a = min(.98, max(.02, (anchor - lo) / (hi - lo)))
    gamma = math.log(a) / math.log(target)
    gamma = 1 + (min(1.7, max(.75, gamma)) - 1) * strength
    # 4) 影调：轻 S 曲线 + 微饱和 + 轻锐化
    eq = f"eq=gamma={gamma:.3f}:saturation={1 + .08 * strength:.3f}"
    f.append(eq)
    f.append("curves=all='0/0 0.25/0.235 0.5/0.5 0.75/0.775 1/1'")
    f.append("unsharp=5:5:0.45:5:5:0")
    return ",".join(f), {"wb_gains": gains, "levels": [lo, hi], "gamma": gamma}

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("src"); ap.add_argument("out")
    ap.add_argument("--beauty", type=float, default=0.0)
    ap.add_argument("--strength", type=float, default=1.0)
    ap.add_argument("--preview")
    a = ap.parse_args()
    w, h, dur = probe(a.src)
    fs = frames(a.src, 16, w, h, dur)
    face = find_face(fs)
    s = stats(fs, face)
    vf, params = build(s, a.strength, a.beauty)
    after = stats(frames(a.src, 8, w, h, dur, vf), face)
    res = {"source": a.src, "filter": vf, "face": face, "before": s, "after": after, "params": params,
           "note": "脸部亮度 %.2f → %.2f（目标 %.2f）" % (s.get("face", s["p50"]), after.get("face", after["p50"]), TARGET_FACE)}
    json.dump(res, open(a.out, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    if a.preview:
        t = dur * .4
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{t:.2f}", "-i", a.src, "-frames:v", "1", "-filter_complex",
            f"[0:v]split[a][b];[b]{vf}[c];[a][c]hstack", "-q:v", "2", a.preview], check=True)
    print(res["note"], file=sys.stderr)
    print(vf)

if __name__ == "__main__":
    main()
