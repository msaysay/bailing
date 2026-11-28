import sys
S = sys.argv[1]
exec(open(S + '/code/fx2.py').read().split("\nOUT = S")[0], globals())
render2 = None
NEON = np.array([50, 70, 255], np.float32)
LOG.extend([(236, 'SEARCH: YI HU YI XI'), (340, 'CHAT THREAD OPEN')])
LOG.sort()


# ---------- component: glass card sprite with one line of text
def card(w, h, s, sub=None, accent=(60, 190, 255), font=CJK, light=False):
    img = np.zeros((h, w, 3), np.uint8)
    img[:] = (236, 236, 240) if light else (34, 28, 24)
    m = rrect_mask(w, h, min(18, h // 2 - 1))
    al = m.astype(np.float32) / 255 * (0.92 if light else 0.78)
    cv2.rectangle(img, (0, 0), (6, h), accent, -1)
    fg = (30, 30, 30) if light else (245, 245, 245)
    text(img, s, 22, (h - 24) // 2 - (9 if sub else 0), 22, fg, font=font)
    if sub:
        text(img, sub, 22, h // 2 + 6, 13, (120, 120, 120) if light else (160, 160, 160), font=font)
    return img, al


# ---------- component: notification stack rising from the phone
NOTES = [('已连接 DISPLAY-01', 'AIR-OS · 现在'), ('手势追踪已就绪', 'HAND TRACK · 2 HANDS'), ('7 个组件待投射', 'TAP TO PROJECT')]


def notifications(frame, blur, G, f):
    for i, (s, sub) in enumerate(NOTES):
        t0 = 44 + i * 11
        if f < t0 or f > 104:
            continue
        k = eback((f - t0) / 8) * (1 - ease((f - 94 - i * 2) / 7))
        if k < 0.05:
            continue
        img, al = card(330, 62, s, sub)
        pos = PH + np.array([0, -255 - i * 72 - 60 * ease((f - 94) / 8)], np.float32)
        comp_sprite(frame, blur, G, img, al, pos, k, alpha=min(1, k))


# ---------- component: search bar with typing + result cards
def search(frame, blur, G, f):
    if not 236 <= f <= 306:
        return
    a = eout((f - 236) / 6) * (1 - ease((f - 298) / 8))
    q = '一呼一吸 出处'
    n = min(len(q), (f - 240) // 3)
    img, al = card(470, 52, q[:max(n, 0)] + ('|' if (f // 5) % 2 else ''), light=True, accent=(255, 120, 60))
    cv2.circle(img, (438, 24), 9, (90, 90, 90), 2, cv2.LINE_AA); cv2.line(img, (445, 31), (452, 38), (90, 90, 90), 2, cv2.LINE_AA)
    comp_sprite(frame, blur, G, img, al, (845, 556), 1.0, alpha=a)
    for i, (s, sub) in enumerate((('庄子 · 刻意', '吹呴呼吸，吐故纳新'), ('西方哲学史 VOL.01', 'LIBRARY · 命中 3 处'), ('BREATH 组件', '点击启动呼吸引导'))):
        t0 = 262 + i * 5
        if f >= t0:
            k = eout((f - t0) / 7)
            img, al = card(470, 58, s, sub)
            comp_sprite(frame, blur, G, img, al, (845 + 60 * (1 - k), 618 + i * 62), 1.0, alpha=a * k)


# ---------- component: chat bubbles
CHAT = [(342, 0, '今天读到哪了？'), (353, 1, '第三卷，西方哲学史'), (364, 0, '记得深呼吸'), (375, 1, '一呼一吸，收到')]


def bubbles(frame, blur, G, f):
    if not 342 <= f <= 404:
        return
    a = 1 - ease((f - 396) / 8)
    for i, (t0, side, s) in enumerate(CHAT):
        if f < t0:
            continue
        w = 60 + 24 * len(s)
        img, al = card(w, 50, s, light=not side, accent=(120, 220, 120) if side else (236, 236, 240))
        if side:
            img[:] = (90, 200, 120); text(img, s, 22, 13, 22, (20, 40, 20), font=CJK)
        x = 640 + w / 2 if not side else 1070 - w / 2
        comp_sprite(frame, blur, G, img, al, (x, 575 + i * 62), eback((f - t0) / 7), alpha=a)


# ---------- component: neon glow calligraphy text
def neon_text(G, f, s='一呼一吸', x=468, y0=150, size=104, f0=612, f1=668):
    if not f0 <= f <= f1 + 8:
        return
    br = 0.72 + 0.28 * math.sin((f - f0) / 25 * 2 * math.pi)
    a = br * (1 - ease((f - f1) / 8))
    r = np.random.default_rng(f)
    for i, ch in enumerate(s):
        on = f - f0 - i * 4
        if on < 0:
            continue
        k = a * (r.choice([0.25, 1.0]) if on < 7 else 1.0)   # ignition flicker
        y = y0 + i * (size + 22)
        text(G, ch, x, y, size, col(NEON, k), font=CJK, anchor='c', add=True)
        text(G, ch, x, y + 3, size - 6, col(np.array([170, 190, 255], np.float32), k * .8), font=CJK, anchor='c', add=True)
    line(G, (x - 70, y0 - 16), (x - 70, y0 + 4 * (size + 22)), col(NEON, a * .6), 2)


# ---------- component: camera viewfinder overlay
def viewfinder(G, f):
    a = 0.6 * eout(f / 8) * (1 - ease((f - 800) / 12))
    c = col(np.array([235, 235, 235], np.float32), a)
    brackets(G, 34, 34, W - 34, H - 34, c, 46, 2)
    if (f // 12) % 2 == 0:
        circle(G, (64, 76), 7, col(np.array([50, 50, 255], np.float32), a * 1.4), -1)
    text(G, 'REC', 82, 64, 20, c, add=True)
    text(G, '00:00:%02d:%02d' % (f // 25, f % 25), W - 62, 64, 20, c, anchor='r', add=True)
    text(G, 'AIR-OS POV  25FPS  ISO400', 62, H - 84, 15, c, add=True)
    cv2.rectangle(G, (W - 122, H - 86), (W - 66, H - 64), c, 2)
    cv2.rectangle(G, (W - 118, H - 82), (W - 84, H - 68), c, -1)
    line(G, (W / 2 - 14, H / 2), (W / 2 + 14, H / 2), c, 1); line(G, (W / 2, H / 2 - 14), (W / 2, H / 2 + 14), c, 1)


# ---------- look: selective colour (world is B&W until the OS boots, colour spreads from the phone)
def color_wave(frame, orig, G, f):
    if f >= 132:
        return
    r = ease((f - 96) / 34) * 2300
    yy, xx = np.mgrid[0:H:4, 0:W:4].astype(np.float32)
    d = np.hypot(xx - PH[0], yy - PH[1])
    sat = np.clip((r - d) / 140, 0, 1)
    sat = cv2.resize(sat, (W, H), interpolation=cv2.INTER_LINEAR)[..., None]
    keep = (np.abs(frame.astype(np.int16) - orig).max(2, keepdims=True) > 6).astype(np.float32)   # keyed phone UI stays coloured
    sat = np.maximum(sat, keep)
    fr = frame.astype(np.float32)
    g = fr @ np.array([0.114, 0.587, 0.299], np.float32)
    g = np.clip((g - 128) * 1.12 + 122, 0, 255)[..., None]
    frame[:] = np.clip(g * (1 - sat) + fr * sat, 0, 255).astype(np.uint8)
    if 96 <= f < 130 and r > 10:
        circle(G, PH, r, col(GOLD, 0.9 * (1 - (f - 96) / 34)), 4)


# ---------- look: phone screen light spilling onto the scene
def screen_light(out, f):
    a = ease((f - 26) / 12) * (1 - ease((f - 108) / 10))
    if a <= 0.01 or not 18 <= f <= 126:
        return out
    yy, xx = np.mgrid[0:H:8, 0:W:8].astype(np.float32)
    d2 = (xx - PH[0]) ** 2 + (yy - PH[1] + 80) ** 2
    m = np.exp(-d2 / (2 * 430.0 ** 2)) * (0.20 + 0.04 * math.sin(f * 0.5)) * a
    m = cv2.resize(m, (W, H), interpolation=cv2.INTER_LINEAR)[..., None]
    return np.clip(out.astype(np.float32) + m * np.array([70, 170, 255], np.float32), 0, 255).astype(np.uint8)


# ---------- look: mosaic transition on a region
def pixelate(img, rect, k):
    if k < 3:
        return
    x0, y0, x1, y1 = rect
    roi = img[y0:y1, x0:x1]
    s = cv2.resize(roi, (max(1, (x1 - x0) // k), max(1, (y1 - y0) // k)), interpolation=cv2.INTER_AREA)
    img[y0:y1, x0:x1] = cv2.resize(s, (x1 - x0, y1 - y0), interpolation=cv2.INTER_NEAREST)


# ---------- look: RGB-split glitch
def glitch(out, f, k):
    if k <= 0.02:
        return out
    r = np.random.default_rng(f * 13 + 1)
    sh = int(13 * k)
    o = out.copy()
    o[:, :, 2] = np.roll(out[:, :, 2], sh, 1)
    o[:, :, 0] = np.roll(out[:, :, 0], -sh, 1)
    for _ in range(int(4 * k) + 1):
        y = int(r.integers(0, H - 60)); h = int(r.integers(8, 70))
        o[y:y + h] = np.roll(o[y:y + h], int(r.integers(-50, 50) * k), 1)
    return o


def render(frame, f):
    orig = frame.astype(np.int16)
    G = np.zeros((H, W, 3), np.uint8)
    small = cv2.resize(frame, (W // 8, H // 8), interpolation=cv2.INTER_AREA)
    blur = cv2.resize(cv2.GaussianBlur(small, (0, 0), 3), (W, H), interpolation=cv2.INTER_LINEAR).astype(np.float32) * 0.8
    phone(frame, G, f)
    color_wave(frame, orig, G, f)
    if 428 <= f <= 444:
        pixelate(frame, FILM, int(4 + 44 * math.sin(math.pi * (f - 428) / 16)))
    notifications(frame, blur, G, f)
    draw_tiles(frame, blur, G, f)
    dock(frame, G, f)
    search(frame, blur, G, f)
    bubbles(frame, blur, G, f)
    bigscreen(frame, blur, G, f)
    zoom_holo(frame, blur, G, f)
    carry(frame, blur, G, f)
    monitor_hud(G, f)
    books_hud(G, f)
    slider(G, f)
    for (f0, x, y, k) in RIPPLES:
        ripple(G, f, f0, x, y, k)
        if f == f0:
            emit(x, y, 24 * k, 11 * k, life=16)
    palm_fx(G, f)
    orbs(G, f)
    caliper(G, f)
    neon_text(G, f)
    finale(G, f)
    trail(G, f)
    hand_hud(G, f)
    viewfinder(G, f)
    step_parts(G)
    g = G.astype(np.float32) / 255
    s4 = cv2.resize(g, (W // 4, H // 4), interpolation=cv2.INTER_AREA)
    bl = cv2.GaussianBlur(s4, (0, 0), 3) * 1.0 + cv2.GaussianBlur(s4, (0, 0), 12) * 1.0
    g = np.clip(g + cv2.resize(bl, (W, H), interpolation=cv2.INTER_LINEAR), 0, 1)
    out = 1 - (1 - frame.astype(np.float32) / 255) * (1 - g)
    fl = 0
    for (f0, k) in ((430, 0.4), (765, 0.7), (135, 0.2), (600, 0.2)):
        if 0 <= f - f0 < 6:
            fl = max(fl, k * (1 - (f - f0) / 6) ** 2)
    if fl:
        out = 1 - (1 - out) * (1 - fl * np.array([0.75, 0.9, 1.0], np.float32))
    out = (np.clip(out, 0, 1) * 255).astype(np.uint8)
    out = screen_light(out, f)
    gk = 0
    for c in CUTS[1:5]:
        gk = max(gk, 0.9 - abs(f - c + 0.5) / 2.5)
    for f0 in (430, 765):
        if 0 <= f - f0 < 5:
            gk = max(gk, 0.6 * (1 - (f - f0) / 5))
    out = glitch(out, f, gk)
    for f0, amp in ((430, 12), (765, 20)):
        d = f - f0
        if 0 <= d < 8:
            dx, dy = rng.normal(0, amp * (1 - d / 8), 2)
            out = cv2.warpAffine(out, np.float32([[1.03, 0, dx - W * 0.015], [0, 1.03, dy - H * 0.015]]), (W, H), borderMode=cv2.BORDER_REFLECT)
    return out


OUT = S + '/fx3_video.mp4'
cap = cv2.VideoCapture(S + '/src/all1080.mp4')
if MODE == 'full':
    ff = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-s', '%dx%d' % (W, H), '-r', '25', '-i', '-',
                           '-c:v', 'libx264', '-crf', '15', '-preset', 'medium', '-pix_fmt', 'yuv420p', OUT], stdin=subprocess.PIPE)
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
