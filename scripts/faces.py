#!/usr/bin/env python3
"""给镜头片段做人脸检测，输出每个片段里主要人脸的位置（归一化到 0–1）。
用法：scripts/faces.py <片段目录> [--out faces.json] [--samples 8]
每个片段均匀取若干帧，用 YuNet 人脸检测模型找脸（模型放在 ~/.cache/video-studio/yunet.onnx，
来自 opencv_zoo 的 face_detection_yunet_2023mar.onnx），只保留够大的脸（高度 ≥ 画面 12%），
把各帧里最大那张脸的框取并集。结果给实拍层用来挪画面，也给 facecheck.py 做自查。
检测不到脸的片段不出现在结果里。检测器会漏检侧脸和暗脸，重要镜头要人眼复核。"""
import argparse, glob, json, os, subprocess, sys
import cv2, numpy as np
ap = argparse.ArgumentParser(); ap.add_argument("dir"); ap.add_argument("--out"); ap.add_argument("--samples", type=int, default=8); a = ap.parse_args()
MODEL = os.path.expanduser("~/.cache/video-studio/yunet.onnx")
if not os.path.exists(MODEL): sys.exit("缺少人脸检测模型：" + MODEL)
res = {}
for f in sorted(glob.glob(os.path.join(a.dir, "*.mp4"))):
    cap = cv2.VideoCapture(f); n = int(cap.get(cv2.CAP_PROP_FRAME_COUNT)); boxes = []
    for k in range(a.samples):
        cap.set(cv2.CAP_PROP_POS_FRAMES, int((k + 0.5) / a.samples * n)); ok, fr = cap.read()
        if not ok: continue
        H, W = fr.shape[:2]; det = cv2.FaceDetectorYN.create(MODEL, "", (W, H), 0.75, 0.3, 50); _, faces = det.detect(fr)
        found = [tuple(float(v) for v in f[:4]) for f in (faces if faces is not None else []) if f[3] >= H * 0.12]
        if found:
            x, y, w, h = max(found, key=lambda b: b[2] * b[3]); boxes.append((x / W, y / H, (x + w) / W, (y + h) / H))
    cap.release()
    if len(boxes) >= max(2, a.samples // 4):                        # 至少四分之一的帧里有脸才算
        b = np.array(boxes); res[os.path.basename(f)] = {"box": [round(float(b[:, 0].min()), 3), round(float(b[:, 1].min()), 3), round(float(b[:, 2].max()), 3), round(float(b[:, 3].max()), 3)], "hits": len(boxes), "samples": a.samples}
out = a.out or os.path.join(a.dir, "faces.json"); json.dump(res, open(out, "w"), ensure_ascii=False, indent=1)
for k, v in res.items(): print(f"{k:<18} 脸框 {v['box']}  命中 {v['hits']}/{v['samples']}")
print(f"{len(res)} 个片段有人脸 → {out}")
