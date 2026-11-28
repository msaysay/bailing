import cv2, json, sys, math, subprocess, numpy as np
from PIL import Image, ImageDraw, ImageFont

S = sys.argv[1]
MODE = sys.argv[2] if len(sys.argv) > 2 else 'full'
W, H = 1920, 1080
CUTS = [0, 150, 330, 480, 660, 817]
GOLD = np.array([70, 185, 255], np.float32)
HOT = np.array([190, 235, 255], np.float32)
CYAN = np.array([255, 215, 110], np.float32)
MONO = '/usr/share/fonts/truetype/jetbrains-mono/JetBrainsMono-Bold.ttf'
CJK = '/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc'
rng = np.random.default_rng(7)

# ---------------------------------------------------------------- tracks
raw = json.load(open(S + '/track.json'))
NF = len(raw)


def clip_of(f):
    for i in range(5):
        if CUTS[i] <= f < CUTS[i + 1]:
            return i
    return 4


def dist(a, b):
    return math.hypot(a[0] - b[0], a[1] - b[1])


def build(sel):
    T = np.full((NF, 21, 2), np.nan, np.float32)
    for f in range(NF):
        best = None
        for h in raw[f]:
            p = h['pts']
            s = dist(p[0], p[9])
            if s < 150 or not sel(f, p, s):
                continue
            if best is None or s > best[0]:
                best = (s, p)
        if best:
            T[f] = np.array(best[1], np.float32)[:, :2]
    # interpolate short gaps inside a clip
    for c in range(5):
        a, b = CUTS[c], CUTS[c + 1]
        idx = [f for f in range(a, b) if not np.isnan(T[f, 0, 0])]
        for i in range(len(idx) - 1):
            f0, f1 = idx[i], idx[i + 1]
            if 1 < f1 - f0 <= 18:
                for f in range(f0 + 1, f1):
                    t = (f - f0) / (f1 - f0)
                    T[f] = T[f0] * (1 - t) + T[f1] * t
        # smooth
        seg = T[a:b].copy()
        out = seg.copy()
        k = [1, 2, 3, 2, 1]
        for f in range(len(seg)):
            acc = 0
            wsum = 0
            for j, wgt in zip(range(-2, 3), k):
                g = f + j
                if 0 <= g < len(seg) and not np.isnan(seg[g, 0, 0]):
                    acc = acc + seg[g] * wgt
                    wsum += wgt
            if wsum and not np.isnan(seg[f, 0, 0]):
                out[f] = acc / wsum
        T[a:b] = out
    return T


def sel_main(f, p, s):
    c = clip_of(f)
    if c == 0:
        return f >= 124
    if c == 4:
        return p[0][0] > 1200
    if 620 <= f <= 653:
        return p[8][0] > 1300
    return True


def sel_left5(f, p, s):
    return clip_of(f) == 4 and p[0][0] < 700


TM = build(sel_main)
TL = build(sel_left5)


def pt(T, f, k):
    if f < 0 or f >= NF or np.isnan(T[f, k, 0]):
        return None
    return T[f, k].copy()


def tip(f): return pt(TM, f, 8)


def pinch(f):
    a, b = pt(TM, f, 4), pt(TM, f, 8)
    return None if a is None else (a + b) / 2


def palm(T, f):
    a, b = pt(T, f, 0), pt(T, f, 9)
    return None if a is None else (a + b) / 2


def nearest(fn, f, span=20):
    for d in range(span + 1):
        for g in (f - d, f + d):
            if clip_of(max(0, min(NF - 1, g))) == clip_of(f):
                v = fn(g)
                if v is not None:
                    return v
    return None


# ---------------------------------------------------------------- helpers
def clamp(x, a=0.0, b=1.0): return max(a, min(b, x))
def ease(t): t = clamp(t); return t * t * (3 - 2 * t)
def eout(t): t = clamp(t); return 1 - (1 - t) ** 3


def eback(t):
    t = clamp(t)
    c1 = 1.70158
    return 1 + (c1 + 1) * (t - 1) ** 3 + c1 * (t - 1) ** 2


def col(c, a=1.0):
    v = np.clip(c * a, 0, 255)
    return (float(v[0]), float(v[1]), float(v[2]))


_tc = {}


def text_mask(s, size, font):
    key = (s, size, font)
    if key not in _tc:
        fnt = ImageFont.truetype(font, size)
        l, t, r, b = fnt.getbbox(s)
        im = Image.new('L', (r - l + 4, b - t + 4), 0)
        ImageDraw.Draw(im).text((2 - l, 2 - t), s, 255, font=fnt)
        _tc[key] = np.asarray(im, np.float32) / 255
    return _tc[key]


def text(img, s, x, y, size, c, a=1.0, font=MONO, anchor='l', add=False):
    m = text_mask(s, size, font) * a
    h, w = m.shape
    if anchor == 'c':
        x -= w // 2
    elif anchor == 'r':
        x -= w
    x, y = int(x), int(y)
    x0, y0, x1, y1 = max(x, 0), max(y, 0), min(x + w, img.shape[1]), min(y + h, img.shape[0])
    if x1 <= x0 or y1 <= y0:
        return
    mm = m[y0 - y:y1 - y, x0 - x:x1 - x, None]
    roi = img[y0:y1, x0:x1].astype(np.float32)
    if add:
        roi = np.maximum(roi, np.asarray(c, np.float32) * mm)
    else:
        roi = roi * (1 - mm) + np.asarray(c, np.float32) * mm
    img[y0:y1, x0:x1] = np.clip(roi, 0, 255).astype(np.uint8)


def P(p): return (int(round(p[0] * 8)), int(round(p[1] * 8)))


def line(G, a, b, c, th=2):
    cv2.line(G, P(a), P(b), c, max(1, int(th)), cv2.LINE_AA, 3)


def circle(G, c0, r, c, th=2):
    if r > 0.5:
        cv2.circle(G, P(c0), int(r * 8), c, int(th), cv2.LINE_AA, 3)


def arc(G, c0, r, a0, a1, c, th=2):
    cv2.ellipse(G, P(c0), (int(r * 8), int(r * 8)), 0, a0, a1, c, int(th), cv2.LINE_AA, 3)


def poly(G, pts, c, th=2, closed=False):
    cv2.polylines(G, [np.round(np.array(pts) * 8).astype(np.int32)], closed, c, int(th), cv2.LINE_AA, 3)


def brackets(G, x0, y0, x1, y1, c, L=28, th=3):
    for (x, y, dx, dy) in ((x0, y0, 1, 1), (x1, y0, -1, 1), (x0, y1, 1, -1), (x1, y1, -1, -1)):
        line(G, (x, y), (x + dx * L, y), c, th)
        line(G, (x, y), (x, y + dy * L), c, th)


# ---------------------------------------------------------------- particles
parts = []


def emit(x, y, n, speed, life=18, c=GOLD, grav=0.25, size=2.2, spread=6):
    for _ in range(int(n)):
        a = rng.uniform(0, 2 * math.pi)
        s = rng.uniform(0.2, 1) * speed
        parts.append([x + rng.normal(0, spread), y + rng.normal(0, spread), math.cos(a) * s, math.sin(a) * s,
                      0, life * rng.uniform(0.6, 1.3), size * rng.uniform(0.5, 1.4), c, grav])


def step_parts(G):
    keep = []
    for p in parts:
        p[0] += p[2]; p[1] += p[3]; p[2] *= 0.94; p[3] = p[3] * 0.94 + p[8]; p[4] += 1
        if p[4] < p[5]:
            a = 1 - p[4] / p[5]
            line(G, (p[0], p[1]), (p[0] - p[2] * 1.5, p[1] - p[3] * 1.5), col(p[7], a), max(1, p[6] * a + 0.6))
            keep.append(p)
    parts[:] = keep


# ---------------------------------------------------------------- scene constants
MQ = [(585, 0), (1150, 0), (1172, 902), (532, 906)]   # monitor quad
FILM = (585, 226, 1150, 520)
FC = np.array([867.0, 372.0])
BOOKS = (1228, 792, 1688, 1036)
ART = (1218, 208, 1536, 796)
SLOT = {'R1': (1735, 185), 'R2': (1740, 455), 'L1': (235, 235), 'L2': (245, 520)}
PULSES = [135, 233, 430, 462, 600, 765]
RIPPLES = [(121, 1010, 880, 1.0), (135, 779, 266, 1.4), (183, 1374, 814, 1.0), (233, 760, 150, 1.2),
           (336, 772, 867, 1.0), (430, 1150, 300, 2.0), (462, 977, 435, 1.2), (600, 1110, 70, 1.5),
           (612, 1375, 500, 1.2), (624, 1375, 500, 1.2), (636, 1375, 500, 1.2), (648, 1375, 500, 1.2),
           (660, 1319, 890, 1.0), (716, 867, 60, 1.6), (765, 1040, 520, 2.6)]
END = 762


def pulse(f):
    v = 0
    for p in PULSES:
        if 0 <= f - p < 14:
            v = max(v, 1 - (f - p) / 14)
    return v


def ripple(G, f, f0, x, y, k):
    d = f - f0
    if not 0 <= d < 20:
        return
    a = (1 - d / 20) ** 1.5
    for i, off in enumerate((0, 5)):
        if d - off >= 0:
            circle(G, (x, y), (14 + (d - off) * 15) * k, col(GOLD if i else HOT, a), 4 - i * 2 + 1)
    for j in range(8):
        an = j * math.pi / 4 + f0
        r0, r1 = (30 + d * 17) * k, (44 + d * 21) * k
        line(G, (x + math.cos(an) * r0, y + math.sin(an) * r0), (x + math.cos(an) * r1, y + math.sin(an) * r1), col(GOLD, a), 2)


def monitor_hud(G, f):
    if f < 135 or f > END + 8:
        return
    a = (0.45 + 0.55 * pulse(f)) * (1 - ease((f - END) / 8))
    per = MQ + [MQ[0]]
    prog = ease((f - 135) / 22)
    # traced border
    seg = [dist(per[i], per[i + 1]) for i in range(4)]
    tot = sum(seg) * prog
    for i in range(4):
        if tot <= 0:
            break
        t = min(1, tot / seg[i])
        a0, a1 = np.array(per[i], np.float32), np.array(per[i + 1], np.float32)
        line(G, a0, a0 + (a1 - a0) * t, col(GOLD, a), 3)
        if t < 1:
            circle(G, a0 + (a1 - a0) * t, 6, col(HOT), -1)
        tot -= seg[i]
    if prog >= 1:
        x0, y0, x1, y1 = FILM
        brackets(G, x0 - 10, y0 - 10, x1 + 10, y1 + 10, col(HOT, a), 34, 3)
        text(G, 'DISPLAY-01', x0 - 6, y0 - 44, 20, col(GOLD, a), add=True)
        if (f // 12) % 2:
            circle(G, (x0 + 150, y0 - 32), 5, col(np.array([60, 60, 255], np.float32), a), -1)
        text(G, 'LIVE', x0 + 164, y0 - 44, 20, col(HOT, a), add=True)
        text(G, 'F%04d' % f, x1 + 6, y1 + 18, 16, col(GOLD, a * 0.8), anchor='r', add=True)
    # scan sweep
    for p in PULSES:
        d = f - p
        if 0 <= d < 22 and prog > 0.2:
            t = d / 22
            y = 906 * t
            xl = 585 + (532 - 585) * t
            xr = 1150 + (1172 - 1150) * t
            line(G, (xl, y), (xr, y), col(HOT, 0.8 * (1 - t)), 3)


def books_hud(G, f):
    if f < 183 or f > END + 6:
        return
    a = (0.35 + 0.65 * (1 - ease((f - 183) / 30))) * (1 - ease((f - END) / 6))
    if 255 <= f < 272 or 655 <= f < 668:
        a = max(a, 0.9)
    x0, y0, x1, y1 = BOOKS
    t = eout((f - 183) / 10)
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    brackets(G, cx - (cx - x0) * t, cy - (cy - y0) * t, cx + (x1 - cx) * t, cy + (y1 - cy) * t, col(GOLD, a), 26, 3)
    if f > 190:
        text(G, 'LIBRARY // 6 VOL', x0, y1 + 10, 18, col(GOLD, a), add=True)
        for i in range(6):
            yy = y0 + 22 + i * 40
            if (f - 190) > i * 3:
                line(G, (x1 + 12, yy), (x1 + 40, yy), col(HOT if (f // 6) % 6 == i else GOLD, a), 3)


def art_hud(G, f):
    if f < 608 or f > END + 6:
        return
    a = (0.4 + 0.6 * (1 - ease((f - 608) / 50))) * (1 - ease((f - END) / 6))
    x0, y0, x1, y1 = ART
    t = eout((f - 608) / 10)
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    brackets(G, cx - (cx - x0) * t, cy - (cy - y0) * t, cx + (x1 - cx) * t, cy + (y1 - cy) * t, col(GOLD, a), 34, 3)
    br = 0.5 + 0.5 * math.sin((f - 608) / 25 * 2 * math.pi)
    text(G, '一呼一吸', cx, y0 - 62, 36, col(HOT, a), font=CJK, anchor='c', add=True)
    text(G, 'INHALE' if br > 0.5 else 'EXHALE', cx, y1 + 14, 20, col(GOLD, a), anchor='c', add=True)
    circle(G, (cx, 500), 60 + 50 * br, col(GOLD, a * 0.6), 2)
    circle(G, (cx, 500), 30 + 30 * br, col(HOT, a * 0.5), 2)


# ---------------------------------------------------------------- trail
def trail(G, f):
    if f > END + 3:
        return
    c = clip_of(f)
    for T, hue in ((TM, GOLD), (TL, GOLD)):
        pts = []
        for g in range(f, max(CUTS[c], f - 13) - 1, -1):
            p = pt(T, g, 8)
            if p is None:
                break
            pts.append(p)
        if len(pts) < 3:
            continue
        pts = np.array(pts, np.float32)
        # densify
        d = [pts[0]]
        for i in range(len(pts) - 1):
            for t in (0.5, 1.0):
                d.append(pts[i] * (1 - t) + pts[i + 1] * t)
        d = np.array(d)
        n = len(d)
        speed = dist(pts[0], pts[1])
        boost = clamp(speed / 45, 0.25, 1.0)
        if 404 <= f <= 432:
            boost = 1.6
        for strand, (amp, ph, wd) in enumerate(((0, 0, 1.0), (16, 0.0, 0.5), (16, math.pi, 0.5))):
            prev = None
            for i in range(n):
                t = i / (n - 1)
                tan = d[min(i + 1, n - 1)] - d[max(i - 1, 0)]
                nn = np.array([-tan[1], tan[0]]) / (np.linalg.norm(tan) + 1e-3)
                q = d[i] + nn * amp * boost * math.sin(i * 0.9 + f * 0.6 + ph) * math.sin(math.pi * min(1, t * 1.3))
                if prev is not None:
                    a = (1 - t) ** 1.4 * boost
                    line(G, prev, q, col(hue, a), max(1, 15 * wd * (1 - t) * boost))
                    if strand == 0:
                        line(G, prev, q, col(HOT, a), max(1, 5 * (1 - t) * boost))
                prev = q
        circle(G, pts[0], 7 + 5 * boost, col(HOT, 0.9), -1)
        circle(G, pts[0], 20 + 6 * math.sin(f * 0.7), col(GOLD, 0.7), 2)
        if speed > 14:
            emit(pts[0][0], pts[0][1], min(8, speed / 9), 4 + speed / 12, life=16)


# ---------------------------------------------------------------- panels
def rrect_mask(w, h, r):
    m = np.zeros((h, w), np.uint8)
    cv2.rectangle(m, (r, 0), (w - r, h), 255, -1)
    cv2.rectangle(m, (0, r), (w, h - r), 255, -1)
    for c in ((r, r), (w - r, r), (r, h - r), (w - r, h - r)):
        cv2.circle(m, c, r, 255, -1, cv2.LINE_AA)
    return m


def panel_base(w, h, title, accent=True):
    img = np.zeros((h, w, 3), np.uint8)
    img[:] = (30, 24, 20)
    grad = np.linspace(1.5, 0.7, h, dtype=np.float32)[:, None, None]
    img = np.clip(img * grad, 0, 255).astype(np.uint8)
    al = (rrect_mask(w, h, 22).astype(np.float32) / 255) * 0.62
    edge = np.zeros((h, w), np.uint8)
    cv2.rectangle(edge, (0, 0), (w, h), 0, -1)
    m = rrect_mask(w, h, 22)
    inner = cv2.erode(m, np.ones((5, 5), np.uint8))
    rim = (m - inner).astype(np.float32) / 255
    img = np.clip(img + rim[..., None] * np.array([200, 215, 230], np.float32), 0, 255).astype(np.uint8)
    al = np.maximum(al, rim * 0.95)
    text(img, title, 20, 14, 17, (235, 235, 235))
    if accent:
        cv2.rectangle(img, (w - 54, 14), (w - 20, 30), (60, 190, 255), -1)
    return img, al


def boost_alpha(al, x0, y0, x1, y1, v=0.95):
    al[y0:y1, x0:x1] = np.maximum(al[y0:y1, x0:x1], v)


def panel_film(frame, f, title='NOW PLAYING', w=380, h=250):
    img, al = panel_base(w, h, title)
    x0, y0, x1, y1 = FILM
    crop = cv2.resize(frame[y0:y1, x0 + 8:x1 - 8], (w - 28, h - 80), interpolation=cv2.INTER_AREA)
    crop = np.clip(crop.astype(np.float32) * 1.25 + 8, 0, 255).astype(np.uint8)
    img[44:44 + h - 80, 14:w - 14] = crop
    boost_alpha(al, 14, 44, w - 14, 44 + h - 80, 0.92)
    yb = h - 22
    cv2.line(img, (20, yb), (w - 20, yb), (120, 120, 120), 3, cv2.LINE_AA)
    t = (f % 200) / 200
    cv2.line(img, (20, yb), (int(20 + (w - 40) * t), yb), (60, 190, 255), 3, cv2.LINE_AA)
    cv2.circle(img, (int(20 + (w - 40) * t), yb), 6, (255, 255, 255), -1, cv2.LINE_AA)
    return img, al


def panel_gauge(frame, f, w=340, h=220):
    img, al = panel_base(w, h, 'KNOWLEDGE CORE')
    v = 0.62 + 0.25 * math.sin(f * 0.05)
    c = (95, 128)
    cv2.circle(img, c, 58, (90, 90, 90), 9, cv2.LINE_AA)
    cv2.ellipse(img, c, (58, 58), -90, 0, 360 * v, (60, 190, 255), 9, cv2.LINE_AA)
    text(img, '%d%%' % (v * 100), c[0], c[1] - 14, 26, (255, 255, 255), anchor='c')
    for i in range(7):
        bh = int(18 + 60 * abs(math.sin(f * 0.11 + i * 1.3)))
        cv2.rectangle(img, (180 + i * 20, 178 - bh), (192 + i * 20, 178), (60, 190, 255) if i % 3 == 0 else (225, 225, 225), -1)
    text(img, 'SYNC 6/6 VOL', 180, 60, 15, (200, 200, 200))
    text(img, 'INDEX OK', 180, 190, 14, (150, 150, 150))
    return img, al


def panel_wave(frame, f, w=340, h=220):
    img, al = panel_base(w, h, 'BREATH MONITOR')
    text(img, '14:38', 20, 48, 54, (255, 255, 255))
    text(img, 'SAT', 232, 58, 22, (60, 190, 255))
    pts = []
    for x in range(20, w - 20, 4):
        y = 170 + 26 * math.sin(x * 0.045 + f * 0.25) * math.sin(x * 0.011 + f * 0.04)
        pts.append((x, int(y)))
    cv2.polylines(img, [np.array(pts, np.int32)], False, (60, 190, 255), 3, cv2.LINE_AA)
    return img, al


KIND = {'film': panel_film, 'gauge': panel_gauge, 'wave': panel_wave,
        'cinema': lambda fr, f: panel_film(fr, f, 'CINEMA MODE', 400, 262)}
# kind, spawn, follow_end, source fn, slot, yaw
PANELS = [
    dict(kind='film', spawn=153, rel=171, src=tip, slot='R1', yaw=-1),
    dict(kind='gauge', spawn=264, rel=272, src=tip, slot='R2', yaw=-1),
    dict(kind='wave', spawn=311, rel=323, src=tip, slot='L1', yaw=1),
    dict(kind='cinema', spawn=531, rel=531, src=lambda f: FC, slot='L2', yaw=1),
]


def comp_sprite(frame, blur, G, img, al, c, sx, sy=None, yaw=0, alpha=1.0, frost=True):
    sy = sy or sx
    h, w = al.shape
    hw, hh = w / 2 * sx, h / 2 * sy
    k = 0.86
    if yaw > 0:
        q = [(-hw, -hh), (hw * .95, -hh * k), (hw * .95, hh * k), (-hw, hh)]
    elif yaw < 0:
        q = [(-hw * .95, -hh * k), (hw, -hh), (hw, hh), (-hw * .95, hh * k)]
    else:
        q = [(-hw, -hh), (hw, -hh), (hw, hh), (-hw, hh)]
    q = np.array(q, np.float32) + np.array(c, np.float32)
    x0, y0 = np.floor(q.min(0)).astype(int)
    x1, y1 = np.ceil(q.max(0)).astype(int)
    X0, Y0, X1, Y1 = max(x0, 0), max(y0, 0), min(x1, W), min(y1, H)
    if X1 - X0 < 4 or Y1 - Y0 < 4:
        return
    M = cv2.getPerspectiveTransform(np.array([(0, 0), (w, 0), (w, h), (0, h)], np.float32), q - np.array([X0, Y0], np.float32))
    wi = cv2.warpPerspective(img, M, (X1 - X0, Y1 - Y0), flags=cv2.INTER_LINEAR)
    wa = cv2.warpPerspective(al, M, (X1 - X0, Y1 - Y0), flags=cv2.INTER_LINEAR)[..., None] * alpha
    roi = frame[Y0:Y1, X0:X1].astype(np.float32)
    if frost:
        fm = np.minimum(wa * 3, 1)
        roi = roi * (1 - fm) + blur[Y0:Y1, X0:X1] * fm
    roi = roi * (1 - wa) + wi.astype(np.float32) * wa
    frame[Y0:Y1, X0:X1] = np.clip(roi, 0, 255).astype(np.uint8)
    poly(G, q, col(GOLD, 0.35 * alpha), 2, True)


def panels(frame, blur, G, f):
    for p in PANELS:
        if f < p['spawn'] or f > END + 10:
            continue
        img, al = KIND[p['kind']](frame, f)
        slot = np.array(SLOT[p['slot']], np.float32)
        rel = p['rel']
        if f <= rel:
            s = nearest(p['src'], f)
            pos = (s if s is not None else slot) + np.array([0, -95], np.float32)
            sc = 0.62 * eback((f - p['spawn'] + 1) / 7)
            yaw = 0
        else:
            s = nearest(p['src'], rel)
            a0 = (s if s is not None else slot) + np.array([0, -95], np.float32)
            t = eout((f - rel) / 16)
            pos = a0 * (1 - t) + slot * t
            pos[1] += 6 * math.sin(f * 0.07 + slot[0])
            sc = 0.62 + (0.92 - 0.62) * eback((f - rel) / 14)
            yaw = p['yaw'] if t > 0.4 else 0
        sc *= 1 + 0.05 * pulse(f)
        if f >= END:
            sc *= 1 - ease((f - END) / 8)
        if sc > 0.05:
            comp_sprite(frame, blur, G, img, al, pos, sc, yaw=yaw)
            if f <= rel:
                s2 = nearest(p['src'], f)
                if s2 is not None:
                    line(G, s2, pos + np.array([0, al.shape[0] / 2 * sc]), col(GOLD, 0.8), 2)
            if f == rel + 15:
                emit(slot[0], slot[1], 26, 9, life=16)


# ---------------------------------------------------------------- orbs (pinch carry)
ORBS = [(216, 233), (256, 264), (441, 462)]


def orbs(G, f):
    for a, b in ORBS:
        if a <= f <= b:
            p = nearest(pinch, f)
            if p is None:
                continue
            r = 16 * eback((f - a + 1) / 6) + 3 * math.sin(f * 0.9)
            circle(G, p, r, col(HOT), -1)
            circle(G, p, r + 12, col(GOLD, 0.8), 3)
            arc(G, p, r + 24, f * 23, f * 23 + 200, col(GOLD, 0.8), 3)
            arc(G, p, r + 34, -f * 17, -f * 17 + 120, col(CYAN, 0.6), 2)
            emit(p[0], p[1], 2, 3, life=14, grav=-0.15)
        if f == b:
            p = nearest(pinch, f)
            if p is not None:
                emit(p[0], p[1], 50, 15, life=20)


# ---------------------------------------------------------------- palm magic circle
def magic(G, c, r, f, a=1.0):
    circle(G, c, r, col(GOLD, a), 3)
    circle(G, c, r * 0.82, col(GOLD, a * 0.7), 2)
    circle(G, c, r * 0.3, col(HOT, a), 2)
    for k, (n, rot, rr) in enumerate(((3, f * 0.09, 0.82), (3, -f * 0.09 + math.pi, 0.82), (4, f * 0.05, 0.55))):
        pts = [(c[0] + math.cos(rot + i * 2 * math.pi / n) * r * rr, c[1] + math.sin(rot + i * 2 * math.pi / n) * r * rr) for i in range(n)]
        poly(G, pts, col(GOLD if k < 2 else HOT, a * 0.8), 2, True)
    for i in range(24):
        an = i * math.pi / 12 - f * 0.04
        r0 = r * (1.04 if i % 2 else 1.0)
        r1 = r * (1.1 if i % 2 else 1.16)
        line(G, (c[0] + math.cos(an) * r0, c[1] + math.sin(an) * r0), (c[0] + math.cos(an) * r1, c[1] + math.sin(an) * r1), col(GOLD, a), 2)
    arc(G, c, r * 1.26, f * 9, f * 9 + 110, col(HOT, a), 3)
    arc(G, c, r * 1.26, f * 9 + 180, f * 9 + 290, col(HOT, a), 3)


def palm_fx(G, f):
    if 388 <= f <= 407:
        c = nearest(lambda g: palm(TM, g), f, 12)
        if c is None:
            c = np.array([150, 600], np.float32)
        t = (f - 388) / 16
        a = eout(t * 2) * (1 - ease((f - 403) / 4))
        magic(G, c, 150 * eback(t * 1.6), f, a)
        circle(G, c, 10 + 26 * ease(t), col(HOT, a), -1)
        an = rng.uniform(0, 6.28)
        for _ in range(3):
            an = rng.uniform(0, 6.28)
            parts.append([c[0] + math.cos(an) * 190, c[1] + math.sin(an) * 190, -math.cos(an) * 11, -math.sin(an) * 11, 0, 13, 2.5, GOLD, 0])


# ---------------------------------------------------------------- slider / caliper / zoom
def slider(G, f):
    if not 538 <= f <= 562:
        return
    p = nearest(pinch, min(f, 556))
    if p is None:
        return
    a = eout((f - 538) / 4) * (1 - ease((f - 556) / 6))
    x = 1300
    y0, y1 = 420, 800
    line(G, (x, y0), (x, y1), col(GOLD, a * 0.6), 3)
    for i in range(11):
        yy = y0 + (y1 - y0) * i / 10
        line(G, (x - (14 if i % 5 == 0 else 7), yy), (x, yy), col(GOLD, a * 0.8), 2)
    ky = clamp(p[1], y0, y1)
    v = int((y1 - ky) / (y1 - y0) * 100)
    line(G, (x, ky), (x, y1), col(HOT, a), 6)
    circle(G, (x, ky), 12, col(HOT, a), -1)
    circle(G, (x, ky), 22, col(GOLD, a), 3)
    line(G, p, (x - 26, ky), col(GOLD, a * 0.6), 2)
    text(G, 'LUMEN %02d%%' % v, x + 36, ky - 16, 28, col(HOT, a), add=True)


def caliper(G, f):
    if not 559 <= f <= 597:
        return
    a4, a8 = pt(TM, f, 4), pt(TM, f, 8)
    if a4 is None:
        return
    a = eout((f - 559) / 5) * (1 - ease((f - 594) / 3))
    line(G, a4, a8, col(HOT, a), 3)
    for q in (a4, a8):
        circle(G, q, 9, col(HOT, a), -1)
        circle(G, q, 18, col(GOLD, a), 2)
    m = (a4 + a8) / 2
    d = dist(a4, a8)
    arc(G, m, d / 2 + 16, f * 6, f * 6 + 130, col(GOLD, a), 3)
    arc(G, m, d / 2 + 16, f * 6 + 180, f * 6 + 310, col(GOLD, a), 3)
    text(G, 'SPAN %05.1f' % (d / 9.7), m[0] + d / 2 + 34, m[1] - 14, 24, col(HOT, a), add=True)
    text(G, 'CHARGING' + '.' * ((f // 5) % 4), m[0] + d / 2 + 34, m[1] + 18, 16, col(GOLD, a), add=True)


def zoom_holo(frame, blur, G, f):
    if not 512 <= f < 531:
        return
    img, al = panel_film(frame, f, 'CINEMA MODE', 400, 262)
    t = ease((f - 512) / 11)
    sc = 1.45 + 0.75 * t
    comp_sprite(frame, blur, G, img, al, FC + np.array([0, -10 * t]), sc, alpha=0.35 + 0.5 * t)
    x0, y0, x1, y1 = FILM
    e = 60 * t
    brackets(G, x0 - 20 - e * 2, y0 - 20 - e, x1 + 20 + e * 2, y1 + 20 + e, col(HOT, 0.9), 40, 3)


# ---------------------------------------------------------------- two-hand finale
def right_x(f):
    p = nearest(lambda g: pt(TM, g, 0), f, 20)
    return None if p is None else p


def bigscreen(frame, blur, G, f):
    if not 668 <= f <= 717:
        return
    img, al = panel_film(frame, f, 'IMMERSIVE // FULL VIEW', 400, 262)
    if f <= 704:
        p = right_x(f)
        xr = p[0] if p is not None else 1700
        target = clamp((abs(xr - 40 - FC[0])) / 200, 1.4, 4.1)
        t = eout((f - 668) / 26)
        sc = 1.4 + (min(target, 4.1) - 1.4) * t
        sc = max(sc, 1.4 + 2.4 * ease((f - 672) / 26))
        c = FC + np.array([40 * t, 60 * t])
        comp_sprite(frame, blur, G, img, al, c, sc, alpha=0.9)
        hw = 200 * sc
        for sgn in (-1, 1):
            x = c[0] + sgn * hw
            line(G, (x, c[1] - 131 * sc), (x, c[1] + 131 * sc), col(HOT, 0.9), 4)
            if f % 2 == 0:
                emit(x, c[1] + rng.uniform(-120, 120) * sc, 2, 5, life=12, grav=0)
    else:
        t = ease((f - 704) / 12)
        sc = 3.8 * (1 - t) + 0.15
        c = np.array([907 - 40 * t, 432 - 480 * t], np.float32)
        comp_sprite(frame, blur, G, img, al, c, sc, sy=sc * (1 - 0.7 * t), alpha=0.9 * (1 - t * 0.6))
        if f == 716:
            emit(867, 40, 90, 22, life=24)


def lightning(G, a, b, f, amp=38, a_=1.0):
    r = np.random.default_rng(f * 31 + 5)
    d = b - a
    nn = np.array([-d[1], d[0]]) / (np.linalg.norm(d) + 1e-3)
    for s in range(3):
        pts = []
        for i in range(17):
            t = i / 16
            off = r.normal(0, amp) * math.sin(math.pi * t) * (1 if s == 0 else 1.6)
            pts.append(a + d * t + nn * off)
        poly(G, pts, col(HOT if s == 0 else GOLD, a_ * (1 if s == 0 else 0.6)), 4 if s == 0 else 2)


def sphere(G, c, R, f, a=1.0):
    ry = f * 0.09
    tilt = 0.45

    def proj(x, y, z):
        x, z = x * math.cos(ry) + z * math.sin(ry), -x * math.sin(ry) + z * math.cos(ry)
        y, z = y * math.cos(tilt) - z * math.sin(tilt), y * math.sin(tilt) + z * math.cos(tilt)
        return (c[0] + x * R, c[1] + y * R), z
    for lat in np.linspace(-1.2, 1.2, 7):
        pts = [proj(math.cos(lat) * math.cos(t), math.sin(lat), math.cos(lat) * math.sin(t)) for t in np.linspace(0, 2 * math.pi, 37)]
        for i in range(36):
            z = (pts[i][1] + pts[i + 1][1]) / 2
            line(G, pts[i][0], pts[i + 1][0], col(GOLD, a * (0.3 + 0.7 * (z + 1) / 2)), 2)
    for lon in np.linspace(0, math.pi, 9)[:-1]:
        pts = [proj(math.cos(t) * math.cos(lon), math.sin(t), math.cos(t) * math.sin(lon)) for t in np.linspace(0, 2 * math.pi, 37)]
        for i in range(36):
            z = (pts[i][1] + pts[i + 1][1]) / 2
            line(G, pts[i][0], pts[i + 1][0], col(HOT, a * (0.25 + 0.75 * (z + 1) / 2)), 2)
    cv2.ellipse(G, P(c), (int(R * 1.5 * 8), int(R * 0.42 * 8)), -14, f * 11, f * 11 + 250, col(HOT, a), 3, cv2.LINE_AA, 3)
    cv2.ellipse(G, P(c), (int(R * 1.8 * 8), int(R * 0.5 * 8)), 10, -f * 8, -f * 8 + 200, col(GOLD, a * 0.8), 2, cv2.LINE_AA, 3)


def finale(G, f):
    a, b = nearest(lambda g: pt(TL, g, 8), f, 6), nearest(lambda g: pt(TM, g, 8), f, 6)
    if 729 <= f <= 749 and a is not None and b is not None:
        k = eout((f - 729) / 4) * (1 - ease((f - 745) / 4))
        lightning(G, a, b, f, 40, k)
        for q in (a, b):
            circle(G, q, 14, col(HOT, k), -1)
    if 746 <= f <= 766:
        pa, pb = nearest(lambda g: palm(TL, g), f, 10), nearest(lambda g: palm(TM, g), f, 10)
        if pa is None or pb is None:
            pa, pb = np.array([450, 900], np.float32), np.array([1600, 930], np.float32)
        t = (f - 746) / 16
        c = (pa + pb) / 2 + np.array([0, -150 - 240 * eout(t)], np.float32)
        R = 190 * eback(t * 1.3)
        if f >= 763:
            R *= 1 + (f - 762) * 0.5
        k = 1 - ease((f - 763) / 3)
        sphere(G, c, R, f, k)
        if f < 763:
            for q in (pa, pb):
                line(G, q, c, col(GOLD, 0.35), 2)
                magic(G, q, 70, f, 0.6)
            text(G, '一呼一吸', c[0], c[1] + R + 60, 44, col(HOT, eout(t * 2)), font=CJK, anchor='c', add=True)
        if f == 765:
            emit(c[0], c[1], 320, 42, life=30, grav=0.1, size=3)
            emit(c[0], c[1], 120, 20, life=40, c=HOT, grav=0.05, size=2)


# ---------------------------------------------------------------- phone
def phone(frame, G, f):
    if not 18 <= f <= 126:
        return
    hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
    m = cv2.inRange(hsv, (33, 55, 28), (70, 255, 255))
    m[:520] = 0
    m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8))
    cs, _ = cv2.findContours(m, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not cs:
        return
    cmax = max(cs, key=cv2.contourArea)
    if cv2.contourArea(cmax) < 6000:
        return
    hull = np.zeros_like(m)
    cv2.drawContours(hull, [cv2.convexHull(cmax)], -1, 255, -1)
    x, y, w, h = cv2.boundingRect(cmax)
    hfull = max(h, int(w * 2.05))
    # content sprite
    cw, ch = 300, 620
    sp = np.zeros((ch, cw, 3), np.uint8)
    sp[:] = (26, 14, 8)
    gy = np.linspace(0, 1, ch, dtype=np.float32)[:, None, None]
    sp = np.clip(sp + gy * np.array([30, 16, 6], np.float32), 0, 255).astype(np.uint8)
    c = (150, 215)
    prog = clamp((f - 30) / 85)
    for i, (r, sp_, span) in enumerate(((120, 5, 250), (98, -8, 140), (76, 11, 300))):
        cv2.ellipse(sp, c, (r, r), 0, f * sp_, f * sp_ + span, (60, 190, 255) if i != 1 else (220, 235, 255), 5 - i, cv2.LINE_AA)
    cv2.ellipse(sp, c, (138, 138), -90, 0, 360 * prog, (150, 225, 255), 6, cv2.LINE_AA)
    text(sp, 'SYNC %02d%%' % (prog * 99), 150, 372, 30, (255, 255, 255), anchor='c')
    text(sp, 'LINKING DISPLAY', 150, 420, 20, (60, 190, 255), anchor='c')
    cv2.rectangle(sp, (36, 456), (264, 464), (70, 60, 50), -1)
    cv2.rectangle(sp, (36, 456), (36 + int(228 * prog), 464), (60, 190, 255), -1)
    sy_ = int((f * 14) % ch)
    cv2.line(sp, (0, sy_), (cw, sy_), (120, 200, 255), 2)
    for i in range(0, ch, 6):
        sp[i] = (sp[i] * 0.82).astype(np.uint8)
    spr = cv2.resize(sp, (w, hfull), interpolation=cv2.INTER_AREA)
    y1 = min(H, y + hfull)
    x1 = min(W, x + w)
    al = (cv2.GaussianBlur(cv2.bitwise_and(m, hull), (0, 0), 1.5).astype(np.float32) / 255)[y:y1, x:x1, None]
    # keep some of the original luminance as screen reflection
    roi = frame[y:y1, x:x1].astype(np.float32)
    lum = roi.mean(2, keepdims=True) / 255
    new = spr[:y1 - y, :x1 - x].astype(np.float32) * (0.75 + 0.6 * lum)
    frame[y:y1, x:x1] = np.clip(roi * (1 - al) + new * al, 0, 255).astype(np.uint8)
    k = 0.55 + 0.25 * math.sin(f * 0.4)
    cv2.drawContours(G, [cv2.convexHull(cmax)], -1, col(GOLD, k), 5, cv2.LINE_AA)
    if f % 2 == 0:
        parts.append([x + rng.uniform(0, w), y + rng.uniform(0, 40), rng.normal(0, .6), -rng.uniform(3, 8), 0, 22, 2.2, GOLD, -0.05])
    if f in (70, 78, 86):
        emit(x + w / 2, y + 60, 16, 8, life=14)


# ---------------------------------------------------------------- frame
def render(frame, f):
    G = np.zeros((H, W, 3), np.uint8)
    small = cv2.resize(frame, (W // 8, H // 8), interpolation=cv2.INTER_AREA)
    blur = cv2.resize(cv2.GaussianBlur(small, (0, 0), 3), (W, H), interpolation=cv2.INTER_LINEAR).astype(np.float32) * 0.8
    phone(frame, G, f)
    bigscreen(frame, blur, G, f)
    zoom_holo(frame, blur, G, f)
    panels(frame, blur, G, f)
    monitor_hud(G, f)
    books_hud(G, f)
    art_hud(G, f)
    for (f0, x, y, k) in RIPPLES:
        ripple(G, f, f0, x, y, k)
        if f == f0:
            emit(x, y, 30 * k, 12 * k, life=18)
    palm_fx(G, f)
    orbs(G, f)
    slider(G, f)
    caliper(G, f)
    finale(G, f)
    trail(G, f)
    step_parts(G)
    # bloom + screen blend
    g = G.astype(np.float32) / 255
    s4 = cv2.resize(g, (W // 4, H // 4), interpolation=cv2.INTER_AREA)
    bl = cv2.GaussianBlur(s4, (0, 0), 3) * 1.1 + cv2.GaussianBlur(s4, (0, 0), 12) * 1.2
    g = np.clip(g + cv2.resize(bl, (W, H), interpolation=cv2.INTER_LINEAR), 0, 1)
    base = frame.astype(np.float32) / 255
    fl = 0
    for (f0, k) in ((430, 0.5), (765, 0.7), (135, 0.25), (600, 0.25)):
        if 0 <= f - f0 < 6:
            fl = max(fl, k * (1 - (f - f0) / 6) ** 2)
    out = 1 - (1 - base) * (1 - g)
    if fl:
        out = 1 - (1 - out) * (1 - fl * np.array([0.75, 0.9, 1.0], np.float32))
    out = (np.clip(out, 0, 1) * 255).astype(np.uint8)
    for f0, amp in ((430, 14), (765, 22)):
        d = f - f0
        if 0 <= d < 8:
            dx, dy = rng.normal(0, amp * (1 - d / 8), 2)
            M = np.float32([[1.03, 0, dx - W * 0.015], [0, 1.03, dy - H * 0.015]])
            out = cv2.warpAffine(out, M, (W, H), borderMode=cv2.BORDER_REFLECT)
    return out


cap = cv2.VideoCapture(S + '/src/all1080.mp4')
if MODE == 'full':
    ff = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-s', '%dx%d' % (W, H), '-r', '25', '-i', '-',
                           '-c:v', 'libx264', '-crf', '15', '-preset', 'medium', '-pix_fmt', 'yuv420p', S + '/fx_video.mp4'], stdin=subprocess.PIPE)
    want = None
else:
    want = set(int(x) for x in MODE.split(','))
f = 0
while True:
    ok, fr = cap.read()
    if not ok:
        break
    out = render(fr, f)
    if want is None:
        ff.stdin.write(out.tobytes())
    elif f in want:
        cv2.imwrite(S + '/sheets/o%04d.jpg' % f, cv2.resize(out, (960, 540)), [1, 85])
    f += 1
    if want is not None and f > max(want):
        break
if want is None:
    ff.stdin.close(); ff.wait()
print('done', f)
