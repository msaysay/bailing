"""人脸位置（YuNet，和 scripts/faces.py 同一个模型）与带虚线描边的人物抠像（MediaPipe，可选）。"""
import os, shutil, subprocess, urllib.request
import numpy as np

CACHE = os.path.expanduser("~/.cache/video-studio")
YUNET = os.path.join(CACHE, "yunet.onnx")
YUNET_URL = "https://media.githubusercontent.com/media/opencv/opencv_zoo/main/models/face_detection_yunet/face_detection_yunet_2023mar.onnx"
MATTE = os.path.join(CACHE, "selfie_multiclass_256x256.tflite")
MATTE_URL = "https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_multiclass_256x256/float32/latest/selfie_multiclass_256x256.tflite"
DEFAULT_FACE = {"x": 0.37, "y": 0.17, "w": 0.26, "h": 0.15, "detected": False}


def fetch(path, url):
    if os.path.exists(path) and os.path.getsize(path) > 50_000: return path
    os.makedirs(os.path.dirname(path), exist_ok=True)
    urllib.request.urlretrieve(url, path)
    if os.path.getsize(path) < 50_000: os.remove(path); raise RuntimeError("模型没下全：" + url)
    return path


def face_box(video, samples=24):
    """全片主要人脸的中位位置，归一化到 0–1：{x, y, w, h}（x、y 是左上角）。检测不到就给一个常见位置并标 detected=False。"""
    import cv2
    try: fetch(YUNET, YUNET_URL)
    except Exception: return dict(DEFAULT_FACE)
    cap = cv2.VideoCapture(video); n = int(cap.get(cv2.CAP_PROP_FRAME_COUNT)); boxes = []; det = None
    for k in range(samples):
        cap.set(cv2.CAP_PROP_POS_FRAMES, int((k + 0.5) / samples * n)); ok, fr = cap.read()
        if not ok: continue
        H, W = fr.shape[:2]
        if det is None: det = cv2.FaceDetectorYN.create(YUNET, "", (W, H), 0.7, 0.3, 50)
        _, fs = det.detect(fr)
        if fs is None: continue
        x, y, w, h = [float(v) for v in max(fs, key=lambda f: f[2] * f[3])[:4]]
        if h >= H * 0.05: boxes.append((x / W, y / H, w / W, h / H))
    cap.release()
    if len(boxes) < max(2, samples // 6): return dict(DEFAULT_FACE)
    m = np.median(np.array(boxes), axis=0)
    return {"x": round(float(m[0]), 4), "y": round(float(m[1]), 4), "w": round(float(m[2]), 4), "h": round(float(m[3]), 4), "detected": True, "hits": len(boxes)}


def face_track(video, rate=10):
    """逐帧人脸轨迹，给头像追着头走用。每秒 rate 个采样：{fps, cx, cy, w}，都归一化到 0–1。
    漏检的帧按前后插值；中心做 0.2 秒的平滑（去掉检测抖动，但跟得上人的晃动），脸宽做 1 秒以上的平滑（免得头像忽大忽小）。
    检测率太低（不到三成）返回 None，模板退回全片中位位置。"""
    import cv2
    try: fetch(YUNET, YUNET_URL)
    except Exception: return None
    cap = cv2.VideoCapture(video); fps = cap.get(cv2.CAP_PROP_FPS) or 30; step = max(1, int(round(fps / rate))); det = None; rows = []; k = 0; prev = None
    while True:
        ok = cap.grab()
        if not ok: break
        if k % step == 0:
            ok, fr = cap.retrieve()
            if not ok: break
            H, W = fr.shape[:2]; sw = 540; sh = int(H * sw / W); small = cv2.resize(fr, (sw, sh))
            if det is None: det = cv2.FaceDetectorYN.create(YUNET, "", (sw, sh), 0.6, 0.3, 50)
            _, fs = det.detect(small); row = None
            if fs is not None:
                cands = [(float(f[0] + f[2] / 2) / sw, float(f[1] + f[3] / 2) / sh, float(f[2]) / sw) for f in fs if f[3] >= sh * 0.04]
                if cands:   # 画面里有别人时，跟住上一帧那张脸；第一帧取最大的
                    row = max(cands, key=lambda c: c[2]) if prev is None else min(cands, key=lambda c: (c[0] - prev[0]) ** 2 + (c[1] - prev[1]) ** 2)
                    prev = row
            rows.append(row)
        k += 1
    cap.release()
    n = len(rows); hit = [i for i, r in enumerate(rows) if r]
    if n < 2 or len(hit) < n * 0.3: return None
    out = {}
    for j, key in enumerate(("cx", "cy", "w")):
        v = np.interp(np.arange(n), hit, [rows[i][j] for i in hit]); sigma = rate * 0.2 if key != "w" else rate * 1.2
        r = int(sigma * 3) + 1; kern = np.exp(-0.5 * (np.arange(-r, r + 1) / sigma) ** 2); kern /= kern.sum()
        out[key] = [round(float(x), 4) for x in np.convolve(np.pad(v, r, mode="edge"), kern, "valid")]
    return {"fps": fps / step, "hit": round(len(hit) / n, 2), **out}


def person_cutout(video, start, end, dest, fps=30):
    """[start, end] 这一段的人物抠像：带透明通道的 WebM，人物外面一圈白色虚线。给「论文卡」版式用。"""
    import cv2, mediapipe as mp
    from mediapipe.tasks.python import BaseOptions, vision
    seg = vision.ImageSegmenter.create_from_options(vision.ImageSegmenterOptions(base_options=BaseOptions(model_asset_path=fetch(MATTE, MATTE_URL)), output_confidence_masks=True))
    work = dest + ".frames"; shutil.rmtree(work, ignore_errors=True); os.makedirs(work)
    subprocess.run(["ffmpeg", "-nostdin", "-y", "-v", "error", "-ss", f"{start:.3f}", "-t", f"{end - start:.3f}", "-i", video, "-vf", f"fps={fps}", work + "/in_%04d.png"], check=True)
    smooth = None; prev = None
    for idx, name in enumerate(sorted(os.listdir(work))):
        fr = cv2.imread(os.path.join(work, name)); H, W = fr.shape[:2]
        res = seg.segment(mp.Image(image_format=mp.ImageFormat.SRGB, data=cv2.cvtColor(fr, cv2.COLOR_BGR2RGB)))
        mask = cv2.resize(1.0 - np.asarray(res.confidence_masks[0].numpy_view()), (W, H), interpolation=cv2.INTER_LINEAR)
        smooth = mask if smooth is None else 0.55 * mask + 0.45 * smooth
        alpha = np.clip((cv2.GaussianBlur(smooth, (0, 0), 2.2) - 0.42) / 0.2, 0, 1)
        rgba = np.dstack([fr, (alpha * 255).astype(np.uint8)])
        # 虚线：把人形往外扩一圈取轮廓，前后帧各取一半，线不会抖
        grown = cv2.dilate((smooth > 0.5).astype(np.uint8), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (71, 71)))
        grown = (cv2.GaussianBlur(grown.astype(np.float32), (0, 0), 14) > 0.5).astype(np.uint8)
        cs, _ = cv2.findContours(grown, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
        if cs:
            pts = _resample(max(cs, key=cv2.contourArea)[:, 0, :].astype(np.float32), 260)
            if prev is not None:
                pts = np.roll(pts, -int(np.argmin(np.linalg.norm(pts - prev[0], axis=1))), axis=0); pts = 0.5 * pts + 0.5 * prev
            prev = pts; layer = np.zeros((H, W), np.uint8); th = max(5, W // 150)
            for s in range(0, len(pts), 9):
                d = pts[s:s + 6]
                if len(d) >= 2 and float(d[:, 1].min()) < H - th * 2: cv2.polylines(layer, [np.round(d).astype(np.int32)], False, 255, th, cv2.LINE_AA)
            cover = layer[:, :, None].astype(np.float32) / 255 * (1 - alpha[:, :, None])
            rgba[:, :, :3] = (rgba[:, :, :3] * (1 - cover) + 255 * cover).astype(np.uint8)
            rgba[:, :, 3] = np.maximum(rgba[:, :, 3], (cover[:, :, 0] * 255).astype(np.uint8))
        cv2.imwrite(os.path.join(work, f"out_{idx:04d}.png"), rgba); os.remove(os.path.join(work, name))
    seg.close()
    r = subprocess.run(["ffmpeg", "-nostdin", "-y", "-v", "error", "-framerate", str(fps), "-i", work + "/out_%04d.png", "-c:v", "libvpx-vp9", "-pix_fmt", "yuva420p", "-b:v", "0", "-crf", "24", "-row-mt", "1", "-cpu-used", "4", "-auto-alt-ref", "0", "-an", dest], capture_output=True, text=True)
    shutil.rmtree(work, ignore_errors=True)
    if r.returncode != 0: raise RuntimeError("抠像编码失败：" + r.stderr[-300:])
    return dest


def _resample(c, count):
    closed = np.vstack([c, c[:1]]); along = np.concatenate([[0], np.cumsum(np.linalg.norm(np.diff(closed, axis=0), axis=1))])
    tg = np.linspace(0, along[-1], count, endpoint=False)
    pts = np.stack([np.interp(tg, along, closed[:, 0]), np.interp(tg, along, closed[:, 1])], axis=1)
    k = np.ones(7) / 7; pad = np.vstack([pts[-3:], pts, pts[:3]])
    return np.stack([np.convolve(pad[:, 0], k, "valid"), np.convolve(pad[:, 1], k, "valid")], axis=1).astype(np.float32)
