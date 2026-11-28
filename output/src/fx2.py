import sys
S = sys.argv[1]
exec(open(S + '/code/fx.py').read().split("\ncap = cv2.VideoCapture")[0], globals())
CY = np.array([255, 225, 150], np.float32)
PULSES[:] = [135, 233, 430, 462, 600, 765]
TILES = [  # name, home, sprite size, yaw
    ('A', (1432, 350), (240, 160), 0), ('B', (1432, 548), (240, 160), 0), ('C', (1432, 742), (240, 150), 0),
    ('R', (1762, 235), (300, 200), -1), ('R2', (1762, 505), (300, 240), -1),
    ('L1', (240, 235), (300, 200), 1), ('L2', (245, 500), (320, 215), 1)]
HOME = {n: np.array(p, np.float32) for n, p, _, _ in TILES}
T0 = {n: 96 + 3 * i for i, (n, _, _, _) in enumerate(TILES)}
TAPS = {'A': [171], 'B': [612, 624, 636, 648], 'C': [183, 216, 256, 660], 'R': [233, 275], 'R2': [], 'L1': [326], 'L2': [540]}
RIPPLES[:] = [(135, 779, 266, 1.4), (183, 1368, 745, 0.8), (233, 760, 150, 1.2), (336, 740, 822, 0.8), (430, 1150, 300, 1.8),
              (462, 977, 435, 1.2), (600, 1110, 70, 1.5), (612, 1432, 548, .8), (624, 1432, 548, .8), (636, 1432, 548, .8),
              (648, 1432, 548, .8), (660, 1319, 890, 1.0), (716, 867, 60, 1.6), (765, 1040, 520, 2.6)]
LOG = [(100, 'AIR-OS BOOT'), (135, 'DISPLAY-01 LINKED'), (171, 'CAST -> MEDIA'), (183, 'LIBRARY.SCAN 6 VOL'), (233, 'VOL.01 -> DISPLAY'),
       (275, 'VOL.02 -> CORE'), (326, 'AUDIO -> WAVE'), (336, 'DOCK.02 OPEN'), (398, 'PALM MENU'), (430, 'SWIPE: NEXT PAGE'),
       (462, 'DOCK.01 LAUNCH'), (525, 'ZOOM x2.2'), (540, 'CINEMA DOCKED'), (556, 'LUMEN SET'), (600, 'PULSE SENT'),
       (612, 'BREATH MODE ON'), (704, 'IMMERSIVE VIEW'), (750, 'HOLO CORE'), (765, 'SHUTDOWN')]
PH = np.array([1040, 900], np.float32)
ORIG = {}
CHIP = dict(zip([t[0] for t in TILES], ['M', 'B', 'L', 'K', '>', 'W', 'C']))
DOCK_X, DOCK_Y = [640, 740, 840, 940, 1040], 822
DOCK_ON = {1: 336, 0: 462}


def tips(f):
    return [p for p in (tip(f), pt(TL, f, 8)) if p is not None]


def flash_of(name, f):
    v = 0
    for t in TAPS[name]:
        if 0 <= f - t < 12:
            v = max(v, 1 - (f - t) / 12)
    return v


def base(w, h, title, tid):
    img, al = panel_base(w, h, title, accent=False)
    text(img, tid, w - 18, 15, 13, (60, 190, 255), anchor='r')
    for x in range(0, w, 24):
        cv2.line(img, (x, 38), (x, h), (44, 38, 34), 1)
    cv2.line(img, (14, 37), (w - 14, 37), (110, 110, 110), 1)
    return img, al


def tile_sprite(name, f, frame):
    w, h = dict((t[0], t[2]) for t in TILES)[name]
    if name == 'A':
        if f >= 171:
            return panel_film(frame, f, 'MEDIA', w, h)
        img, al = base(w, h, 'MEDIA', 'T-01')
        cv2.polylines(img, [np.array([(105, 70), (105, 126), (150, 98)], np.int32)], True, (150, 150, 150), 2, cv2.LINE_AA)
        text(img, 'NO SOURCE', w // 2, 134, 13, (130, 130, 130), anchor='c')
    elif name == 'B':
        img, al = base(w, h, 'BREATH', 'T-02')
        on = f >= 612
        br = 0.5 + 0.5 * math.sin((f - 612) / 25 * 2 * math.pi) if on else 0
        text(img, '一呼一吸', 78, 62, 26, (255, 255, 255) if on else (150, 150, 150), font=CJK, anchor='c')
        text(img, ('INHALE' if br > .5 else 'EXHALE') if on else 'STANDBY', 78, 112, 14, (60, 190, 255) if on else (120, 120, 120), anchor='c')
        c = (184, 96)
        cv2.circle(img, c, 44, (80, 80, 80), 2, cv2.LINE_AA)
        if on:
            cv2.circle(img, c, int(14 + 28 * br), (60, 190, 255), 3, cv2.LINE_AA)
            cv2.circle(img, c, int(6 + 14 * br), (230, 240, 255), -1, cv2.LINE_AA)
            boost_alpha(al, 140, 50, 230, 142, .85)
    elif name == 'C':
        img, al = base(w, h, 'LIBRARY', 'T-03')
        gone = (f >= 216) + (f >= 256)
        for i in range(6):
            y = 50 + i * 15
            if i < gone:
                cv2.rectangle(img, (18, y), (150, y + 8), (60, 60, 60), 1)
            else:
                hot = f >= 183 and (f // 4) % 6 == i
                cv2.rectangle(img, (18, y), (150 - (i * 17) % 40, y + 8), (60, 190, 255) if hot else (190, 190, 190), -1)
        text(img, '%d' % (6 - gone), 196, 58, 44, (255, 255, 255), anchor='c')
        text(img, 'VOL', 196, 110, 14, (60, 190, 255), anchor='c')
    elif name == 'R':
        img, al = base(w, h, 'KNOWLEDGE CORE', 'S-01')
        v = 0.5 * ease((f - 233) / 20) + 0.5 * ease((f - 275) / 20)
        c = (84, 118)
        cv2.circle(img, c, 52, (90, 90, 90), 8, cv2.LINE_AA)
        if v > 0:
            cv2.ellipse(img, c, (52, 52), -90, 0, 360 * v, (60, 190, 255), 8, cv2.LINE_AA)
        text(img, '%d%%' % (v * 100), c[0], c[1] - 12, 24, (255, 255, 255), anchor='c')
        for i in range(7):
            bh = int((10 + 56 * abs(math.sin(f * 0.11 + i * 1.3))) * (0.15 + 0.85 * v))
            cv2.rectangle(img, (164 + i * 18, 166 - bh), (175 + i * 18, 166), (60, 190, 255) if i % 3 == 0 else (225, 225, 225), -1)
        text(img, 'SYNC %d/2' % ((f >= 233) + (f >= 275)), 164, 56, 14, (200, 200, 200))
    elif name == 'R2':
        img, al = base(w, h, 'SYSTEM LOG', 'S-02')
        ls = [(t, s) for t, s in LOG if t <= f][-8:]
        for i, (t, s) in enumerate(ls):
            new = i == len(ls) - 1
            s = '> ' + s[:max(0, (f - t) * 2)] if new else '> ' + s
            if new and (f // 4) % 2:
                s += '_'
            text(img, s, 16, 48 + i * 22, 14, (130, 215, 255) if new else (170, 170, 170))
    elif name == 'L1':
        img, al = base(w, h, 'WAVE', 'S-03')
        text(img, '14:38', 18, 46, 46, (255, 255, 255))
        text(img, 'SAT', 200, 54, 20, (60, 190, 255))
        amp = 24 * ease((f - 326) / 12)
        pts = [(x, int(150 + amp * math.sin(x * 0.05 + f * 0.25) * math.sin(x * 0.012 + f * 0.04))) for x in range(18, w - 18, 4)]
        cv2.polylines(img, [np.array(pts, np.int32)], False, (60, 190, 255) if amp > 1 else (120, 120, 120), 3, cv2.LINE_AA)
    else:
        if f >= 540:
            return panel_film(frame, f, 'CINEMA', w, h)
        img, al = base(w, h, 'CINEMA', 'S-04')
        cv2.rectangle(img, (40, 62), (w - 40, h - 40), (120, 120, 120), 1)
        text(img, 'STANDBY', w // 2, h // 2 + 2, 16, (130, 130, 130), anchor='c')
    return img, al


def tile_state(name, i, f):
    home = HOME[name]
    t0 = T0[name]
    if f < t0:
        return None
    o = ORIG.get(name, PH)
    t = (f - t0) / 18
    pos = o * (1 - eout(t)) + home * eout(t)
    sc = eback(t) * 0.92
    if f >= END:
        k = ease((f - END - i) / 10)
        pos = home * (1 - k) + np.array([1000, 1010], np.float32) * k
        sc *= 1 - k
    pos = pos + np.array([0, 5 * math.sin(f * 0.06 + i * 1.7)], np.float32)
    return pos, sc


def draw_tiles(frame, blur, G, f):
    tp = tips(f)
    for i, (name, home, (w, h), yaw) in enumerate(TILES):
        st = tile_state(name, i, f)
        if st is None:
            continue
        pos, sc = st
        hov = 0
        for p in tp:
            dx = max(abs(p[0] - home[0]) - w / 2, 0)
            dy = max(abs(p[1] - home[1]) - h / 2, 0)
            hov = max(hov, clamp(1 - math.hypot(dx, dy) / 50))
        fl = flash_of(name, f)
        sc *= 1 + 0.07 * hov + 0.10 * fl + 0.04 * pulse(f)
        sx = sc
        if 428 <= f < 442:
            sx = sc * max(0.06, abs(math.cos(math.pi * clamp((f - 428 - i * .6) / 9))))
        if sc < 0.05:
            continue
        img, al = tile_sprite(name, f, frame)
        if fl:
            img = np.clip(img.astype(np.float32) + fl * 90 * np.array([.5, .8, 1.0], np.float32), 0, 255).astype(np.uint8)
        comp_sprite(frame, blur, G, img, al, pos, sx, sc, yaw=yaw if (f - T0[name]) > 12 else 0, alpha=0.92)
        k = max(hov, fl)
        if k > 0.05 and f < END:
            hw, hh = w / 2 * sc + 12, h / 2 * sc + 12
            brackets(G, pos[0] - hw, pos[1] - hh, pos[0] + hw, pos[1] + hh, col(HOT, k), 24, 3)
            for p in tp:
                if hov > 0.05:
                    line(G, p, pos, col(CY, 0.35 * hov), 1)


def dock(frame, G, f):
    if f < 118 or f > END + 8:
        return
    a = eout((f - 118) / 10) * (1 - ease((f - END) / 8))
    x0, x1 = DOCK_X[0] - 62, DOCK_X[-1] + 62
    ov = frame.copy()
    cv2.rectangle(ov, (x0 + 40, DOCK_Y - 44), (x1 - 40, DOCK_Y + 44), (28, 22, 18), -1)
    cv2.circle(ov, (x0 + 40, DOCK_Y), 44, (28, 22, 18), -1, cv2.LINE_AA)
    cv2.circle(ov, (x1 - 40, DOCK_Y), 44, (28, 22, 18), -1, cv2.LINE_AA)
    cv2.addWeighted(ov, 0.5 * a, frame, 1 - 0.5 * a, 0, frame)
    line(G, (x0 + 40, DOCK_Y - 44), (x1 - 40, DOCK_Y - 44), col(GOLD, a * .5), 2)
    line(G, (x0 + 40, DOCK_Y + 44), (x1 - 40, DOCK_Y + 44), col(GOLD, a * .5), 2)
    tp = tips(f)
    for i, x in enumerate(DOCK_X):
        c = np.array([x, DOCK_Y], np.float32)
        hov = max([clamp(1 - (dist(p, c) - 30) / 60) for p in tp] + [0])
        on = i in DOCK_ON and f >= DOCK_ON[i]
        fl = clamp(1 - (f - DOCK_ON[i]) / 12) if on else 0
        r = 30 * (1 + .15 * hov + .25 * fl)
        cc = col(HOT if (on or hov > .3) else GOLD, a * (0.55 + 0.45 * max(hov, on)))
        circle(G, c, r, cc, 3 if on else 2)
        if on:
            circle(G, (x, DOCK_Y + 40), 3, col(HOT, a), -1)
        if i == 0:
            poly(G, [(x - 8, DOCK_Y - 12), (x - 8, DOCK_Y + 12), (x + 12, DOCK_Y)], cc, 2, True)
        elif i == 1:
            for k in (-9, 0, 9):
                line(G, (x - 12, DOCK_Y + k), (x + 12, DOCK_Y + k), cc, 2)
        elif i == 2:
            circle(G, c, 12, cc, 2); circle(G, c, 3, cc, -1)
        elif i == 3:
            for k, hh in ((-10, 8), (0, 14), (10, 5)):
                line(G, (x + k, DOCK_Y + 12), (x + k, DOCK_Y + 12 - hh * 2), cc, 3)
        else:
            poly(G, [(x - 11, DOCK_Y - 11), (x + 11, DOCK_Y - 11), (x + 11, DOCK_Y + 11), (x - 11, DOCK_Y + 11)], cc, 2, True)


SLX, SLY0, SLY1 = 1215, 430, 800


def slider(G, f):
    if f < 121 or f > END + 8:
        return
    a = eout((f - 121) / 10) * (1 - ease((f - END) / 8))
    v = 0.5
    act = 538 <= f <= 558
    if f >= 540:
        p = nearest(pinch, min(f, 556))
        if p is not None:
            v = (SLY1 - clamp(p[1], SLY0, SLY1)) / (SLY1 - SLY0)
    k = 1.0 if act else 0.45
    ky = SLY1 - v * (SLY1 - SLY0)
    line(G, (SLX, SLY0), (SLX, SLY1), col(GOLD, a * k * .7), 3)
    for i in range(11):
        yy = SLY0 + (SLY1 - SLY0) * i / 10
        line(G, (SLX + 2, yy), (SLX + (14 if i % 5 == 0 else 7), yy), col(GOLD, a * k), 2)
    line(G, (SLX, ky), (SLX, SLY1), col(HOT, a * k), 5)
    circle(G, (SLX, ky), 10, col(HOT, a * k), -1)
    text(G, 'LUM', SLX + 6, SLY0 - 30, 14, col(GOLD, a * k), anchor='c', add=True)
    if act:
        circle(G, (SLX, ky), 22, col(GOLD, a), 3)
        p = nearest(pinch, min(f, 556))
        if p is not None:
            line(G, p, (SLX, ky), col(CY, .5), 1)
        text(G, 'LUMEN %02d%%' % (v * 100), SLX + 34, ky - 16, 26, col(HOT, a), add=True)


# pinch-carried items: start, end, label, destination
ORBS2 = [(216, 233, 'VOL.01', None), (256, 272, 'VOL.02', 'R'), (311, 323, 'AUDIO', 'L1'), (441, 462, 'APP', None)]


def orbs(G, f):
    for a, b, lab, dst in ORBS2:
        src = pinch if lab != 'AUDIO' else tip
        if a <= f <= b:
            p = nearest(src, f)
            if p is None:
                continue
            r = 13 * eback((f - a + 1) / 6)
            poly(G, [(p[0] - r, p[1] - r), (p[0] + r, p[1] - r), (p[0] + r, p[1] + r), (p[0] - r, p[1] + r)], col(HOT), 3, True)
            circle(G, p, 5, col(HOT), -1)
            arc(G, p, r + 20, f * 23, f * 23 + 200, col(GOLD, 0.9), 3)
            arc(G, p, r + 30, -f * 17, -f * 17 + 120, col(CY, 0.7), 2)
            text(G, lab, p[0] + 44, p[1] - 34, 16, col(HOT), add=True)
            line(G, (p[0] + 22, p[1] - 14), (p[0] + 42, p[1] - 24), col(GOLD, .8), 1)
        if b < f <= b + 5:
            p = nearest(src, b)
            if p is None:
                continue
            if dst:
                q = HOME[dst]
                t0, t1 = eout((f - b - 1) / 5), eout((f - b) / 5)
                line(G, p * (1 - t0) + q * t0, p * (1 - t1) + q * t1, col(HOT), 6)
            elif f == b + 1:
                emit(p[0], p[1], 40, 13, life=18)


def carry(frame, blur, G, f):
    # film thumbnail dragged from the monitor into MEDIA tile; cinema hologram docking to L2
    if 153 <= f <= 177:
        img, al = panel_film(frame, f, 'CAST', 240, 160)
        s = nearest(tip, min(f, 171))
        if s is not None:
            pos = s + np.array([0, -70], np.float32)
            sc = 0.7 * eback((f - 152) / 6)
            if f > 171:
                t = eout((f - 171) / 6)
                pos = pos * (1 - t) + HOME['A'] * t
                sc = 0.7 + 0.2 * t
            comp_sprite(frame, blur, G, img, al, pos, sc, alpha=0.9)
            if f <= 171:
                line(G, s, pos + np.array([0, 56 * sc]), col(CY, .7), 1)
    if 531 <= f <= 540:
        img, al = panel_film(frame, f, 'CINEMA', 320, 215)
        t = eout((f - 531) / 9)
        comp_sprite(frame, blur, G, img, al, FC * (1 - t) + HOME['L2'] * t, 2.2 * (1 - t) + 0.92 * t, alpha=0.9)


BONES = [(0, 1), (1, 2), (2, 3), (3, 4), (0, 5), (5, 6), (6, 7), (7, 8), (5, 9), (9, 10), (10, 11), (11, 12), (9, 13), (13, 14), (14, 15),
         (15, 16), (13, 17), (17, 18), (18, 19), (19, 20), (0, 17)]


def gesture1(T, f):
    if pt(T, f, 0) is None:
        return None
    p = T[f]
    s = dist(p[0], p[9]) + 1e-3
    if dist(p[4], p[8]) / s < 0.22:
        return 'PINCH'
    e = [dist(p[a], p[0]) > dist(p[b], p[0]) * 1.1 for a, b in ((8, 6), (12, 10), (16, 14), (20, 18))]
    n = sum(e)
    if n >= 3:
        return 'OPEN PALM'
    if e[0]:
        return 'POINT'
    return 'GRAB' if n == 0 else 'TRACK'


def gesture(T, f):
    c = {}
    for g in range(f - 3, f + 4):
        if 0 <= g < NF and clip_of(g) == clip_of(f):
            v = gesture1(T, g)
            if v:
                c[v] = c.get(v, 0) + 1
    return max(c, key=c.get) if c else None


def hand_hud(G, f):
    if f > END + 2:
        return
    for T, tag in ((TM, 'H1'), (TL, 'H2')):
        if pt(T, f, 0) is None:
            continue
        p = T[f]
        for a, b in BONES:
            line(G, p[a], p[b], col(CY, 0.55), 2)
        for k in range(21):
            circle(G, p[k], 5 if k in (4, 8, 12, 16, 20) else 3, col(HOT if k in (4, 8) else CY, 0.9), -1)
        t = p[8]
        circle(G, t, 22, col(HOT, .9), 2)
        for an in (0, 90, 180, 270):
            ca, sa = math.cos(math.radians(an + f * 3)), math.sin(math.radians(an + f * 3))
            line(G, (t[0] + ca * 28, t[1] + sa * 28), (t[0] + ca * 40, t[1] + sa * 40), col(HOT, .9), 2)
        g = gesture(T, f) or 'TRACK'
        if g == 'PINCH':
            m = (p[4] + p[8]) / 2
            circle(G, m, 30 + 4 * math.sin(f), col(GOLD), 3)
        w = p[0]
        wx, wy = clamp(w[0] - 60, 20, W - 240), clamp(w[1] - 70, 30, H - 40)
        text(G, '%s  %s' % (tag, g), wx, wy, 18, col(HOT, .95), add=True)
        text(G, 'X%04d Y%04d' % (t[0], t[1]), wx, wy + 24, 13, col(CY, .8), add=True)
        line(G, (wx, wy + 44), (wx + 150, wy + 44), col(CY, .6), 1)


def phone(frame, G, f):
    global PH
    if not 18 <= f <= 126:
        return
    hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
    m = cv2.inRange(hsv, (33, 55, 28), (70, 255, 255))
    m[:520] = 0
    m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8))
    cs, _ = cv2.findContours(m, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    cmax = max(cs, key=cv2.contourArea) if cs else None
    found = cmax is not None and cv2.contourArea(cmax) > 6000
    hull = np.zeros((H, W), np.uint8)
    if found:
        hp = cv2.convexHull(cmax)
        cv2.drawContours(hull, [hp], -1, 255, -1)
        x, y, w, h = cv2.boundingRect(cmax)
        if w > 250:
            c = np.array([x + w / 2, y + w * 0.62], np.float32)
            PH = c if f < 30 else PH * 0.6 + c * 0.4
        hfull = max(h, int(w * 2.05))
        cw, ch = 300, 620
        sp = np.zeros((ch, cw, 3), np.uint8)
        sp[:] = (26, 14, 8)
        gy = np.linspace(0, 1, ch, dtype=np.float32)[:, None, None]
        sp = np.clip(sp + gy * np.array([30, 16, 6], np.float32), 0, 255).astype(np.uint8)
        c = (150, 215)
        prog = clamp((f - 30) / 66)
        for i, (r, sp_, span) in enumerate(((120, 5, 250), (98, -8, 140), (76, 11, 300))):
            cv2.ellipse(sp, c, (r, r), 0, f * sp_, f * sp_ + span, (60, 190, 255) if i != 1 else (220, 235, 255), 5 - i, cv2.LINE_AA)
        cv2.ellipse(sp, c, (138, 138), -90, 0, 360 * prog, (150, 225, 255), 6, cv2.LINE_AA)
        text(sp, 'AIR-OS %02d%%' % (prog * 99), 150, 372, 28, (255, 255, 255), anchor='c')
        text(sp, 'PROJECTING UI', 150, 420, 20, (60, 190, 255), anchor='c')
        cv2.rectangle(sp, (36, 456), (264, 464), (70, 60, 50), -1)
        cv2.rectangle(sp, (36, 456), (36 + int(228 * prog), 464), (60, 190, 255), -1)
        sy_ = int((f * 14) % ch)
        cv2.line(sp, (0, sy_), (cw, sy_), (120, 200, 255), 2)
        sp[::6] = (sp[::6] * 0.82).astype(np.uint8)
        spr = cv2.resize(sp, (w, hfull), interpolation=cv2.INTER_AREA)
        y1, x1 = min(H, y + hfull), min(W, x + w)
        al = (cv2.GaussianBlur(cv2.bitwise_and(m, hull), (0, 0), 1.5).astype(np.float32) / 255)[y:y1, x:x1, None]
        roi = frame[y:y1, x:x1].astype(np.float32)
        lum = roi.mean(2, keepdims=True) / 255
        new = spr[:y1 - y, :x1 - x].astype(np.float32) * (0.75 + 0.6 * lum)
        frame[y:y1, x:x1] = np.clip(roi * (1 - al) + new * al, 0, 255).astype(np.uint8)
        cv2.drawContours(G, [hp], -1, col(GOLD, 0.55 + 0.25 * math.sin(f * 0.4)), 4, cv2.LINE_AA)
        if f % 2 == 0:
            parts.append([x + rng.uniform(0, w), y + rng.uniform(0, 40), rng.normal(0, .6), -rng.uniform(3, 8), 0, 22, 2.2, GOLD, -0.05])
    # ---- orbit ring of app chips around the phone
    a = ease((f - 26) / 12) * (1 - ease((f - 112) / 8))
    if a <= 0.01:
        return
    Gb = np.zeros_like(G)
    cx, cy = PH
    rx, ry = 330.0, 112.0
    for k, (mul, th) in enumerate(((1.0, 3), (1.16, 1), (0.84, 1))):
        ax = (int(rx * mul * 8), int(ry * mul * 8))
        cv2.ellipse(G, P((cx, cy)), ax, 0, 0, 180, col(GOLD if k == 0 else CY, a * (1 if k == 0 else .5)), th, cv2.LINE_AA, 3)
        cv2.ellipse(Gb, P((cx, cy)), ax, 0, 180, 360, col(GOLD if k == 0 else CY, a * (.6 if k == 0 else .3)), th, cv2.LINE_AA, 3)
    for j in range(48):
        th = math.radians(j * 7.5 + f * 1.2)
        q0 = (cx + rx * 1.16 * math.cos(th), cy + ry * 1.16 * math.sin(th))
        q1 = (cx + rx * 1.22 * math.cos(th), cy + ry * 1.22 * math.sin(th))
        line(G if math.sin(th) > 0 else Gb, q0, q1, col(GOLD, a * (.8 if j % 4 == 0 else .35)), 2)
    cv2.ellipse(G, P((cx, cy)), (int(rx * 1.3 * 8), int(ry * 1.3 * 8)), 0, f * 5 % 360, f * 5 % 360 + 50, col(HOT, a), 3, cv2.LINE_AA, 3)
    n = len(TILES)
    for i, (name, _, _, _) in enumerate(TILES):
        th = math.radians(i * 360 / n + f * 2.4)
        q = np.array([cx + rx * math.cos(th), cy + ry * math.sin(th)], np.float32)
        if f == T0[name] - 1:
            ORIG[name] = q.copy()
        if f < 32 + i * 4 or f >= T0[name]:
            continue
        dep = math.sin(th)
        s = (30 + 12 * dep) * eback((f - 32 - i * 4) / 7)
        if s < 8:
            continue
        tgt = G if dep > -0.15 else Gb
        k = a * (0.55 + 0.45 * (dep + 1) / 2)
        sel = f in range(70, 76) and i == 0 or f in range(78, 84) and i == 2 or f in range(86, 92) and i == 4
        cc = col(HOT if (dep > 0.5 or sel) else GOLD, k)
        poly(tgt, [(q[0] - s, q[1] - s), (q[0] + s, q[1] - s), (q[0] + s, q[1] + s), (q[0] - s, q[1] + s)], cc, 3, True)
        text(tgt, CHIP[name], q[0], q[1] - s * .55, int(s * 1.0), cc, anchor='c', add=True)
        line(tgt, q + np.array([0, -s]), q + np.array([0, -s - 16]), col(CY, k * .7), 1)
        if dep > 0.6:
            text(G, dict(A='MEDIA', B='BREATH', C='LIBRARY', R='CORE', R2='LOG', L1='WAVE', L2='CINEMA')[name], q[0], q[1] + s + 8, 15, col(HOT, a), anchor='c', add=True)
    Gb[hull > 0] = 0
    np.maximum(G, Gb, out=G)


def books_hud(G, f):
    if f < 183 or f > END + 6:
        return
    a = (0.3 + 0.7 * (1 - ease((f - 183) / 30))) * (1 - ease((f - END) / 6))
    if 210 <= f < 226 or 252 <= f < 268 or 655 <= f < 668:
        a = 0.95
    x0, y0, x1, y1 = BOOKS
    brackets(G, x0, y0, x1, y1, col(GOLD, a), 26, 3)
    line(G, (HOME['C'][0], HOME['C'][1] + 72), (HOME['C'][0], y0 + 30), col(CY, a * .8), 1)
    circle(G, (HOME['C'][0], y0 + 30), 4, col(CY, a), -1)
    for i in range(6):
        yy = y0 + 22 + i * 40
        line(G, (x1 + 12, yy), (x1 + 40, yy), col(HOT if (f // 6) % 6 == i else GOLD, a), 3)


def trail(G, f):  # thinner energy trail, only when the finger moves fast
    if f > END + 3:
        return
    c = clip_of(f)
    for T in (TM, TL):
        pts = []
        for g in range(f, max(CUTS[c], f - 10) - 1, -1):
            p = pt(T, g, 8)
            if p is None:
                break
            pts.append(p)
        if len(pts) < 3:
            continue
        speed = dist(pts[0], pts[1])
        boost = clamp((speed - 12) / 50)
        if 404 <= f <= 432:
            boost = 1.3
        if boost <= 0.02:
            continue
        n = len(pts)
        for i in range(n - 1):
            t = i / (n - 1)
            aa = (1 - t) ** 1.3 * boost
            line(G, pts[i], pts[i + 1], col(GOLD, aa), max(1, 12 * (1 - t) * boost))
            line(G, pts[i], pts[i + 1], col(HOT, aa), max(1, 4 * (1 - t) * boost))
        if speed > 22:
            emit(pts[0][0], pts[0][1], min(5, speed / 14), 4 + speed / 14, life=14)


def render(frame, f):
    G = np.zeros((H, W, 3), np.uint8)
    small = cv2.resize(frame, (W // 8, H // 8), interpolation=cv2.INTER_AREA)
    blur = cv2.resize(cv2.GaussianBlur(small, (0, 0), 3), (W, H), interpolation=cv2.INTER_LINEAR).astype(np.float32) * 0.8
    phone(frame, G, f)
    draw_tiles(frame, blur, G, f)
    dock(frame, G, f)
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
    finale(G, f)
    trail(G, f)
    hand_hud(G, f)
    step_parts(G)
    g = G.astype(np.float32) / 255
    s4 = cv2.resize(g, (W // 4, H // 4), interpolation=cv2.INTER_AREA)
    bl = cv2.GaussianBlur(s4, (0, 0), 3) * 1.0 + cv2.GaussianBlur(s4, (0, 0), 12) * 1.0
    g = np.clip(g + cv2.resize(bl, (W, H), interpolation=cv2.INTER_LINEAR), 0, 1)
    base_ = frame.astype(np.float32) / 255
    fl = 0
    for (f0, k) in ((430, 0.4), (765, 0.7), (135, 0.2), (600, 0.2)):
        if 0 <= f - f0 < 6:
            fl = max(fl, k * (1 - (f - f0) / 6) ** 2)
    out = 1 - (1 - base_) * (1 - g)
    if fl:
        out = 1 - (1 - out) * (1 - fl * np.array([0.75, 0.9, 1.0], np.float32))
    out = (np.clip(out, 0, 1) * 255).astype(np.uint8)
    for f0, amp in ((430, 12), (765, 20)):
        d = f - f0
        if 0 <= d < 8:
            dx, dy = rng.normal(0, amp * (1 - d / 8), 2)
            out = cv2.warpAffine(out, np.float32([[1.03, 0, dx - W * 0.015], [0, 1.03, dy - H * 0.015]]), (W, H), borderMode=cv2.BORDER_REFLECT)
    return out


OUT = S + '/fx2_video.mp4'
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
