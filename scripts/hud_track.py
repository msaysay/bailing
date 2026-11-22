#!/usr/bin/env python3
"""手势全息风 · 第一步：把第一人称原片「看懂」。

给一段第一人称（胸前或头戴机位）的原片，产出四样东西，放进 studio/public/<期名>/：
  base.mp4     裁成 1080×1920、30 帧的底片
  hands.webm   只有手和小臂、带透明通道的一层（盖在界面上面，手才像是伸到界面前面）
  track.json   每一帧：镜头相对第 0 帧怎么动了（界面靠它「钉」在桌面上）、两只手的关键点
  moments.jpg  手势时刻表：点、划、捏、张开，各在第几秒（排界面动画时照着它写时间）

用法：
  python3 scripts/hud_track.py 原片.mp4 --ep hud01 [--start 0 --end 12] [--anchor 0.0]

依赖：opencv-python、numpy、mediapipe（第一次会下载 8MB 的手部模型）。
"""
import argparse, json, os, subprocess, sys, urllib.request
import cv2, numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
W, H, FPS = 1080, 1920, 30
MODEL = os.path.expanduser("~/.cache/video-studio/hand_landmarker.task")
MODEL_URL = "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task"
SEG = os.path.expanduser("~/.cache/video-studio/selfie_multiclass.tflite")
SEG_URL = "https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_multiclass_256x256/float32/latest/selfie_multiclass_256x256.tflite"
TIP = {"thumb": 4, "index": 8, "middle": 12, "ring": 16, "pinky": 20}


def ff(*a): subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", *a], check=True)


def landmarker():
    try:
        import mediapipe as mp
        from mediapipe.tasks import python as P
        from mediapipe.tasks.python import vision as V
    except ImportError:
        sys.exit("缺 mediapipe：pip install mediapipe")
    if not os.path.exists(MODEL):
        os.makedirs(os.path.dirname(MODEL), exist_ok=True); print("下载手部模型…"); urllib.request.urlretrieve(MODEL_URL, MODEL)
    opt = V.HandLandmarkerOptions(base_options=P.BaseOptions(model_asset_path=MODEL), num_hands=2, running_mode=V.RunningMode.VIDEO,
                                  min_hand_detection_confidence=0.3, min_hand_presence_confidence=0.3, min_tracking_confidence=0.3)
    return mp, V.HandLandmarker.create_from_options(opt)


def segmenter():
    """人体分割模型（认皮肤和衣服），抠手和小臂用。下不下来就返回 None，退回按肤色抠。"""
    try:
        import mediapipe as mp
        from mediapipe.tasks import python as P
        from mediapipe.tasks.python import vision as V
        if not os.path.exists(SEG): print("下载人体分割模型（16MB）…"); urllib.request.urlretrieve(SEG_URL, SEG)
        return mp, V.ImageSegmenter.create_from_options(V.ImageSegmenterOptions(base_options=P.BaseOptions(model_asset_path=SEG), output_confidence_masks=True))
    except Exception as e:
        print("   分割模型用不了，退回按肤色抠：", e); return None, None


def seg_mask(mp, seg, frame, hands):
    """用分割模型抠：整个人体区域里，只留和手连着的那几块（旁边路过的人不要），再和关键点围出来的手并在一起。"""
    r = seg.segment(mp.Image(image_format=mp.ImageFormat.SRGB, data=np.ascontiguousarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))))
    fg = 1 - np.array(r.confidence_masks[0].numpy_view()).squeeze()
    if fg.shape != (H, W): fg = cv2.resize(fg, (W, H))
    hard = (fg > 0.3).astype(np.uint8); core = np.zeros((H, W), np.uint8)
    for p in hands:
        size = float(np.linalg.norm(p[0] - p[9])) + 1; cv2.fillConvexPoly(core, cv2.convexHull(p[[0, 1, 2, 5, 9, 13, 17]].astype(np.int32)), 255)
        for a, b in [(0, 1), (1, 2), (2, 3), (3, 4), (5, 6), (6, 7), (7, 8), (9, 10), (10, 11), (11, 12), (13, 14), (14, 15), (15, 16), (17, 18), (18, 19), (19, 20)]:
            cv2.line(core, tuple(p[a].astype(int)), tuple(p[b].astype(int)), 255, int(size * 0.3))
    nlab, lab, stats, _ = cv2.connectedComponentsWithStats(hard)
    if hands: keep = np.unique(lab[(cv2.dilate(core, np.ones((41, 41), np.uint8)) > 0) & (lab > 0)])
    else: keep = [i for i in range(1, nlab) if stats[i, cv2.CC_STAT_TOP] + stats[i, cv2.CC_STAT_HEIGHT] >= H - 2 and stats[i, cv2.CC_STAT_AREA] > W * H * 0.004]
    m = (np.isin(lab, keep) * fg * 255).astype(np.uint8) if len(keep) else np.zeros((H, W), np.uint8)
    return np.maximum(m, cv2.GaussianBlur(core, (0, 0), 4))


def read_frames(path):
    cap = cv2.VideoCapture(path)
    while True:
        ok, f = cap.read()
        if not ok: break
        yield f
    cap.release()


def detect_hands(base):
    """每帧两只手的 21 个点（1080×1920 坐标）。按画面左右分成 L / R 两条轨，短暂丢失的帧用前后插值补上。"""
    mp, det = landmarker(); raw = []
    for i, f in enumerate(read_frames(base)):
        r = det.detect_for_video(mp.Image(image_format=mp.ImageFormat.SRGB, data=cv2.cvtColor(f, cv2.COLOR_BGR2RGB)), int(i * 1000 / FPS))
        raw.append([np.array([[p.x * W, p.y * H] for p in h], np.float32) for h in r.hand_landmarks])
    n = len(raw); tracks = {"L": [None] * n, "R": [None] * n}; last = {"L": None, "R": None}
    for i, hs in enumerate(raw):
        hs = sorted(hs, key=lambda h: h[0][0])
        if len(hs) == 2: tracks["L"][i], tracks["R"][i] = hs
        elif len(hs) == 1:
            c = hs[0][0]; dl = np.linalg.norm(c - last["L"]) if last["L"] is not None else None; dr = np.linalg.norm(c - last["R"]) if last["R"] is not None else None
            side = ("L" if dl <= dr else "R") if dl is not None and dr is not None else ("L" if c[0] < W / 2 else "R")
            tracks[side][i] = hs[0]
        for s in "LR":
            if tracks[s][i] is not None: last[s] = tracks[s][i][0]
    for s in "LR":                                     # 补 8 帧以内的缺口
        tr = tracks[s]; i = 0
        while i < n:
            if tr[i] is None:
                j = i
                while j < n and tr[j] is None: j += 1
                if 0 < i and j < n and j - i <= 8:
                    for k in range(i, j): a = (k - i + 1) / (j - i + 1); tr[k] = tr[i - 1] * (1 - a) + tr[j] * a
                i = j
            else: i += 1
    return tracks


def hand_mask(frame, pts):
    """手 + 小臂的遮罩。手用关键点围出来；小臂没有关键点，就从手上取肤色，沿着手腕往后的方向找同色的一条。"""
    m = np.zeros((H, W), np.uint8)
    hull = cv2.convexHull(pts.astype(np.int32)); size = float(np.linalg.norm(pts[0] - pts[9])) + 1
    cv2.fillConvexPoly(m, hull, 255)
    for a, b in [(0, 1), (1, 2), (2, 3), (3, 4), (5, 6), (6, 7), (7, 8), (9, 10), (10, 11), (11, 12), (13, 14), (14, 15), (15, 16), (17, 18), (18, 19), (19, 20)]:
        cv2.line(m, tuple(pts[a].astype(int)), tuple(pts[b].astype(int)), 255, int(size * 0.34))
    palm = np.zeros((H, W), np.uint8); cv2.fillConvexPoly(palm, cv2.convexHull(pts[[0, 1, 5, 9, 13, 17]].astype(np.int32)), 255)
    ycc = cv2.cvtColor(frame, cv2.COLOR_BGR2YCrCb).astype(np.float32); s = ycc[palm > 0][:, 1:]
    if len(s) > 30:
        mu = s.mean(0); cov = np.cov(s.T) + np.eye(2) * 6; inv = np.linalg.inv(cov)
        d = ycc[:, :, 1:] - mu; maha = np.einsum("hwi,ij,hwj->hw", d, inv, d)
        skin = ((maha < 5.5) & (ycc[:, :, 0] > 40)).astype(np.uint8) * 255
        back = pts[0] - pts[9]; back = back / (np.linalg.norm(back) + 1e-6)          # 手腕往小臂的方向
        cor = np.zeros((H, W), np.uint8); p0 = pts[0] - back * size * 0.2; p1 = pts[0] + back * size * 9
        cv2.line(cor, tuple(p0.astype(int)), tuple(p1.astype(int)), 255, int(size * 1.45))
        arm = cv2.bitwise_and(skin, cor); arm = cv2.morphologyEx(arm, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9))); arm = cv2.morphologyEx(arm, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (17, 17)))
        nlab, lab = cv2.connectedComponents(arm); keep = np.unique(lab[(cv2.dilate(m, np.ones((31, 31), np.uint8)) > 0) & (lab > 0)])
        if len(keep): m = cv2.bitwise_or(m, np.isin(lab, keep).astype(np.uint8) * 255)
        m = cv2.bitwise_or(m, cv2.bitwise_and(skin, cv2.dilate(m, np.ones((15, 15), np.uint8))))   # 边缘按肤色再贴一圈
    return cv2.medianBlur(m, 15)


def camera_track(base, tracks, anchor_i):
    """镜头相对锚帧的运动：每帧一个相似变换 [a, b, tx, ty]，把锚帧里的点映射到这一帧。
    逐帧用光流累加；只要这一帧还能直接和锚帧对上（特征点够多），就拉回到直接对出来的结果，免得越走越偏。"""
    sc = 0.5; orb = cv2.ORB_create(1500); bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)
    frames = [cv2.cvtColor(cv2.resize(f, None, fx=sc, fy=sc), cv2.COLOR_BGR2GRAY) for f in read_frames(base)]; n = len(frames)

    def nohand(i):
        m = np.full(frames[i].shape, 255, np.uint8)
        for s in "LR":
            p = tracks[s][i]
            if p is not None:
                c = p.mean(0) * sc; r = float(np.linalg.norm(p[0] - p[9])) * sc * 2.6; cv2.circle(m, tuple(c.astype(int)), int(r), 0, -1)
        if H > W: m[int(m.shape[0] * 0.8):] = 0        # 竖屏画面最底下是腿和小臂，不拿来算
        return m

    def step(a, b, mask):
        p = cv2.goodFeaturesToTrack(a, 400, 0.01, 8, mask=mask)
        if p is None or len(p) < 12: return None
        q, st, _ = cv2.calcOpticalFlowPyrLK(a, b, p, None, winSize=(31, 31), maxLevel=4); ok = st.ravel() == 1
        if ok.sum() < 12: return None
        M, _ = cv2.estimateAffinePartial2D(p[ok], q[ok], method=cv2.RANSAC, ransacReprojThreshold=3)
        return M

    def to3(M): return np.vstack([M, [0, 0, 1]])
    ka, da = orb.detectAndCompute(frames[anchor_i], nohand(anchor_i))

    def direct(i):
        kb, db = orb.detectAndCompute(frames[i], nohand(i))
        if da is None or db is None or len(kb) < 30: return None
        ms = bf.match(da, db)
        if len(ms) < 30: return None
        M, inl = cv2.estimateAffinePartial2D(np.float32([ka[m.queryIdx].pt for m in ms]), np.float32([kb[m.trainIdx].pt for m in ms]), method=cv2.RANSAC, ransacReprojThreshold=4)
        if M is None or inl.sum() < 28: return None
        s = float(np.hypot(M[0, 0], M[1, 0]))
        return to3(M) if 0.4 < s < 2.5 else None

    out = [None] * n; out[anchor_i] = np.eye(3); locked = 0
    for rng in (range(anchor_i + 1, n), range(anchor_i - 1, -1, -1)):
        cur = np.eye(3)
        for i in rng:
            prev = i - 1 if rng.step == 1 else i + 1
            M = step(frames[prev], frames[i], nohand(prev)); cur = (to3(M) if M is not None else np.eye(3)) @ cur
            D = direct(i)
            if D is not None: cur = 0.5 * cur + 0.5 * D; locked += 1      # 能直接对上锚帧：往它那边拉一半，既不漂也不跳
            out[i] = cur.copy()
    cam = []
    for M in out: cam.append([round(float(M[0, 0]), 5), round(float(M[1, 0]), 5), round(float(M[0, 2] / sc), 2), round(float(M[1, 2] / sc), 2)])
    return cam, locked / max(1, n - 1)


def find_moments(tracks, n):
    """手势时刻：点（食指快速伸出后停住）、划（手腕横向快速移动）、捏（拇指食指并拢）、张开（两手快速分开）。"""
    out = []

    def speed(x):
        v = np.zeros(len(x))
        for i in range(1, len(x)):
            if x[i] is not None and x[i - 1] is not None: v[i] = np.linalg.norm(x[i] - x[i - 1]) * FPS / H
        return np.convolve(v, np.ones(3) / 3, "same")
    for s in "LR":
        tr = tracks[s]; tip = [p[8] if p is not None else None for p in tr]; wr = [p[0] if p is not None else None for p in tr]; v = speed(tip); pinched = False; last_tap = -99; last_sw = -99
        for i in range(3, n - 1):
            if tr[i] is None: continue
            size = float(np.linalg.norm(tr[i][0] - tr[i][9])) + 1
            if v[i] < 0.35 and v[i - 3:i].max() > 1.1 and i - last_tap > 8:
                out.append({"t": round(i / FPS, 2), "type": "点", "hand": s, "x": int(tip[i][0]), "y": int(tip[i][1])}); last_tap = i
            if wr[i] is not None and wr[i - 2] is not None:
                dx = (wr[i][0] - wr[i - 2][0]) * FPS / 2 / W
                if abs(dx) > 1.6 and i - last_sw > 10: out.append({"t": round(i / FPS, 2), "type": "划" + ("→" if dx > 0 else "←"), "hand": s, "x": int(wr[i][0]), "y": int(wr[i][1])}); last_sw = i
            pd = float(np.linalg.norm(tr[i][4] - tr[i][8])) / size
            if pd < 0.22 and not pinched: out.append({"t": round(i / FPS, 2), "type": "捏", "hand": s, "x": int(tr[i][8][0]), "y": int(tr[i][8][1])}); pinched = True
            if pd > 0.45: pinched = False
    last = -99
    for i in range(4, n):
        a, b, a0, b0 = tracks["L"][i], tracks["R"][i], tracks["L"][i - 4], tracks["R"][i - 4]
        if a is None or b is None or a0 is None or b0 is None: continue
        d = (np.linalg.norm(a[0] - b[0]) - np.linalg.norm(a0[0] - b0[0])) * FPS / 4 / W
        if d > 1.3 and i - last > 12: c = (a[0] + b[0]) / 2; out.append({"t": round(i / FPS, 2), "type": "张开", "hand": "LR", "x": int(c[0]), "y": int(c[1])}); last = i
    return sorted(out, key=lambda m: m["t"])


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("video"); ap.add_argument("--ep", required=True); ap.add_argument("--start", type=float, default=0); ap.add_argument("--end", type=float)
    ap.add_argument("--anchor", type=float, default=0.0, help="锚帧在第几秒（界面钉在这一帧看到的位置上），默认开头")
    ap.add_argument("--size", default="auto", help="auto（按原片横竖）/ 1080x1920 / 1920x1080")
    ap.add_argument("--matte", default="seg", choices=["seg", "skin"], help="抠手的办法：seg 用人体分割模型（默认，准）；skin 按肤色（不用下模型，桌面和肤色接近时会带碎块）")
    ap.add_argument("--no-hands-layer", action="store_true", help="不出手的那一层（手不会挡住界面）")
    a = ap.parse_args(); global W, H
    if a.size == "auto":
        pr = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height:stream_side_data=rotation", "-of", "json", a.video], capture_output=True, text=True); st = json.loads(pr.stdout)["streams"][0]
        rot = abs(int(next((d.get("rotation", 0) for d in st.get("side_data_list", []) if "rotation" in d), 0))); vw, vh = (st["height"], st["width"]) if rot in (90, 270) else (st["width"], st["height"])
        W, H = (1920, 1080) if vw > vh else (1080, 1920)
    else: W, H = map(int, a.size.lower().split("x"))
    out = os.path.join(ROOT, "studio", "public", a.ep); os.makedirs(out, exist_ok=True); base = os.path.join(out, "base.mp4")
    cut = ["-ss", str(a.start)] + (["-to", str(a.end)] if a.end else [])
    ff(*cut, "-i", a.video, "-vf", f"scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},fps={FPS}", "-c:v", "libx264", "-crf", "16", "-pix_fmt", "yuv420p", "-g", "15", "-c:a", "aac", "-b:a", "192k", base)
    print("① 认手…"); tracks = detect_hands(base); n = len(tracks["L"]); seen = sum(1 for i in range(n) if tracks["L"][i] is not None or tracks["R"][i] is not None)
    print(f"   {n} 帧，其中 {seen} 帧看得到手")
    print("② 算镜头运动…"); ai = min(n - 1, int(a.anchor * FPS)); cam, locked = camera_track(base, tracks, ai)
    print(f"   {locked:.0%} 的帧能直接对上锚帧（越高，界面钉得越稳）")
    moments = find_moments(tracks, n)
    if not a.no_hands_layer:
        print("③ 抠手…"); hw, hh = (W * 2 // 3) // 2 * 2, (H * 2 // 3) // 2 * 2
        p = subprocess.Popen(["ffmpeg", "-nostdin", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "bgra", "-s", f"{hw}x{hh}", "-r", str(FPS), "-i", "-", "-c:v", "libvpx-vp9", "-pix_fmt", "yuva420p", "-b:v", "0", "-crf", "24", "-row-mt", "1", "-cpu-used", "4", "-auto-alt-ref", "0", os.path.join(out, "hands.webm")], stdin=subprocess.PIPE)
        mp_, seg = segmenter() if a.matte == "seg" else (None, None); prev = None
        for i, f in enumerate(read_frames(base)):
            hs = [tracks[s][i] for s in "LR" if tracks[s][i] is not None]
            if seg is not None: m = seg_mask(mp_, seg, f, hs)
            else:
                m = np.zeros((H, W), np.uint8)
                for p_ in hs: m = cv2.bitwise_or(m, hand_mask(f, p_))
            m = cv2.GaussianBlur(cv2.erode(m, np.ones((3, 3), np.uint8)), (0, 0), 2.5)
            if prev is not None: m = np.maximum(m, (prev * 0.35).astype(np.uint8))      # 前一帧留一点，边缘不闪
            prev = m
            p.stdin.write(cv2.resize(np.dstack([f, m]), (hw, hh), interpolation=cv2.INTER_AREA).tobytes())
        p.stdin.close(); p.wait()

    def key(p):
        if p is None: return None
        size = float(np.linalg.norm(p[0] - p[9]))
        return {"wrist": [int(p[0][0]), int(p[0][1])], "palm": [int(p[[0, 5, 17]].mean(0)[0]), int(p[[0, 5, 17]].mean(0)[1])], "size": int(size), **{k: [int(p[v][0]), int(p[v][1])] for k, v in TIP.items()}}
    track = {"fps": FPS, "w": W, "h": H, "frames": n, "anchor": ai, "locked": round(locked, 3), "cam": cam, "hands": {s: [key(p) for p in tracks[s]] for s in "LR"}, "moments": moments,
             "has_hands_layer": not a.no_hands_layer}
    json.dump(track, open(os.path.join(out, "track.json"), "w"), ensure_ascii=False, separators=(",", ":"))
    # 手势时刻表：每个时刻一格，标上类型和秒数
    tiles = []; fr = list(read_frames(base))
    for m in moments[:40]:
        f = fr[min(n - 1, int(m["t"] * FPS))].copy(); cv2.circle(f, (m["x"], m["y"]), 46, (60, 255, 214), 8)
        f = cv2.resize(f, (270, 480) if H > W else (480, 270)); cv2.rectangle(f, (0, 0), (f.shape[1], 44), (0, 0, 0), -1)
        cv2.putText(f, f'{m["t"]:.2f}s {m["hand"]} {"tap swipe pinch open".split()[["点", "划", "捏", "张"].index(m["type"][0])]}{m["type"][1:].replace("→", ">").replace("←", "<")}', (6, 31), cv2.FONT_HERSHEY_SIMPLEX, 0.72, (60, 255, 214), 2); tiles.append(f)
    if tiles:
        cols = 8 if H > W else 5
        while len(tiles) % cols: tiles.append(np.zeros_like(tiles[0]))
        cv2.imwrite(os.path.join(out, "moments.jpg"), np.vstack([np.hstack(tiles[i:i + cols]) for i in range(0, len(tiles), cols)]))
    print(f"好了：{out}\n   手势时刻 {len(moments)} 个，看 moments.jpg；下一步照着它写这一期的 plan.json")
    for m in moments: print(f'   {m["t"]:>6.2f}s  {m["hand"]:<2} {m["type"]}  ({m["x"]},{m["y"]})')


if __name__ == "__main__":
    main()
