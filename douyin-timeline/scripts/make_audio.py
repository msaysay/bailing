"""纯 numpy 合成配乐 + 卡点音效 → public/audio.wav
90 BPM；节拍表与 src/data.ts 完全一致（片头 4 拍 / 前 5 节点各 6 拍 / 其余 8 拍 / 2011 后插 4 拍 / 末节点 16 拍）"""
import numpy as np, wave, os

SR = 48000
BPM = 90
B = 60 / BPM
rng = np.random.default_rng(7)

# ── 节拍表 ──
NODE_BEATS = [6] * 5 + [8] * 12 + [16]
HAS_J = [True] * 15 + [False] * 3
starts = []
b = 4
for i, nb in enumerate(NODE_BEATS):
    starts.append(b)
    b += nb
    if i == 14:
        b += 4
TOTAL_BEATS = b                      # 150
INTER = starts[14] + 8               # 谢幕段起点
DROP = starts[5] + 4                 # “我”登场
GROOVE0 = starts[6]
END = TOTAL_BEATS
N = int((TOTAL_BEATS * B + 3.0) * SR)

dry = np.zeros((N, 2))   # 鼓、贝斯、音效
wet = np.zeros((N, 2))   # 进混响的乐器

def put(buf, t, sig, gain=1.0, pan=0.0):
    i = int(t * SR)
    if i >= N or i < 0: return
    sig = sig[: N - i]
    l = gain * np.cos((pan + 1) * np.pi / 4); r = gain * np.sin((pan + 1) * np.pi / 4)
    buf[i:i + len(sig), 0] += sig * l * 1.414
    buf[i:i + len(sig), 1] += sig * r * 1.414

def tt(d): return np.arange(int(d * SR)) / SR
def env_ad(d, a=0.005, k=5.0):
    t = tt(d); return np.minimum(t / a, 1) * np.exp(-t * k) * np.minimum((d - t) / 0.02, 1).clip(0, 1)
def hz(n): return 440 * 2 ** ((n - 69) / 12)

def lp(x, fc):  # 一阶低通
    a = np.exp(-2 * np.pi * fc / SR); y = np.empty_like(x); z = 0.0
    from itertools import accumulate
    # 向量化近似：用 FFT 做
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    return np.fft.irfft(X / np.sqrt(1 + (f / fc) ** 4), len(x))
def hp(x, fc):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    return np.fft.irfft(X * (f / fc) ** 2 / np.sqrt(1 + (f / fc) ** 4), len(x))

# ── 乐器 ──
def ep(n, d, vel=1.0):           # 电钢琴（FM）
    f = hz(n); t = tt(d)
    mod = np.sin(2 * np.pi * f * 1.0 * t) * (1.6 * vel * np.exp(-t * 6) + 0.25)
    bell = np.sin(2 * np.pi * f * 14 * t) * np.exp(-t * 28) * 0.12
    s = np.sin(2 * np.pi * f * t + mod) + bell
    s *= 1 + 0.06 * np.sin(2 * np.pi * 4.5 * t)
    return s * env_ad(d, 0.004, 2.4) * vel
def pluck(n, d, vel=1.0):        # 高音铃
    f = hz(n); t = tt(d)
    s = np.sin(2 * np.pi * f * t + 0.8 * np.sin(2 * np.pi * f * 3 * t) * np.exp(-t * 9))
    return s * env_ad(d, 0.003, 5.5) * vel
def pad(notes, d):
    t = tt(d); s = np.zeros_like(t)
    for n in notes:
        for det in (-0.07, 0.0, 0.08):
            f = hz(n + det); ph = rng.uniform(0, 6.28)
            s += np.sin(2 * np.pi * f * t + ph) + 0.25 * np.sin(4 * np.pi * f * t + ph)
    a = np.minimum(t / 0.7, 1) * np.minimum((d - t) / 0.9, 1).clip(0, 1)
    return s * a / (3 * len(notes))
def bass(n, d, vel=1.0):
    f = hz(n); t = tt(d)
    s = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(4 * np.pi * f * t) * np.exp(-t * 5)
    return np.tanh(s * 1.4) * np.minimum(t / 0.008, 1) * np.exp(-t * 1.6) * np.minimum((d - t) / 0.03, 1).clip(0, 1) * vel
def kick(vel=1.0, deep=False):
    t = tt(0.42 if deep else 0.3)
    f = 46 + 110 * np.exp(-t * 26)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * (7 if deep else 11))
    s += hp(rng.normal(0, 1, len(t)), 2500) * np.exp(-t * 180) * 0.25
    return np.tanh(s * 1.8) * vel
def snare(vel=1.0):
    t = tt(0.24)
    n = hp(rng.normal(0, 1, len(t)), 1400) * np.exp(-t * 22)
    tone = np.sin(2 * np.pi * (185 + 60 * np.exp(-t * 40)) * t) * np.exp(-t * 28)
    return (n * 0.55 + tone * 0.6) * vel
def clap(vel=1.0):
    t = tt(0.22); n = lp(hp(rng.normal(0, 1, len(t)), 900), 5500)
    e = sum(np.exp(-np.maximum(t - o, 0) * 60) * (t >= o) for o in (0, 0.011, 0.023)) / 2
    return n * e * vel
def hat(vel=1.0, open_=False):
    t = tt(0.22 if open_ else 0.06)
    return hp(rng.normal(0, 1, len(t)), 7500) * np.exp(-t * (16 if open_ else 75)) * vel
def tick(pitch=2200, vel=1.0):
    t = tt(0.035)
    return (np.sin(2 * np.pi * pitch * t) + 0.4 * hp(rng.normal(0, 1, len(t)), 4000)) * np.exp(-t * 170) * vel
def whoosh(d, vel=1.0, up=True):
    t = tt(d); n = rng.normal(0, 1, len(t))
    X = np.fft.rfft(n); f = np.fft.rfftfreq(len(n), 1 / SR)
    out = np.zeros_like(t)
    # 扫频带通：分段合成
    seg = 12; L = len(t) // seg
    for k in range(seg):
        c = 500 * (9 ** ((k if up else seg - 1 - k) / seg))
        band = np.fft.irfft(X * np.exp(-((np.log(f + 1) - np.log(c)) ** 2) / 0.18), len(n))
        w = np.zeros_like(t); a0 = max(0, k * L - L // 2); a1 = min(len(t), (k + 1) * L + L // 2)
        w[a0:a1] = np.hanning(a1 - a0)
        out += band * w
    e = (t / d) ** 2.2 * np.minimum((d - t) / 0.03, 1).clip(0, 1)
    return out / (np.abs(out).max() + 1e-9) * e * vel
def impact(vel=1.0):
    t = tt(0.9)
    s = np.sin(2 * np.pi * np.cumsum(38 + 70 * np.exp(-t * 14)) / SR) * np.exp(-t * 4.5)
    s += lp(rng.normal(0, 1, len(t)), 900) * np.exp(-t * 14) * 0.5
    return np.tanh(s * 2) * vel
def pop(f0=520, f1=880, vel=1.0):
    t = tt(0.09); f = f0 + (f1 - f0) * (t / 0.09)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 38) * np.minimum(t / 0.003, 1) * vel
def stamp(vel=1.0):
    t = tt(0.3)
    th = np.sin(2 * np.pi * np.cumsum(70 + 120 * np.exp(-t * 40)) / SR) * np.exp(-t * 16)
    s = np.zeros(len(t)); s += th
    return np.tanh(s * 1.6) * vel

# ── 和声 ──
# 每个和弦: (贝斯音, 电钢琴音组, 旋律可用音)
CH = {
    'Am': (45, [57, 60, 64, 67, 71], [76, 79, 81, 84]),
    'F':  (41, [57, 60, 64, 65, 69], [77, 81, 84, 76]),
    'G':  (43, [59, 62, 64, 67, 71], [79, 83, 74, 76]),
    'Em': (40, [59, 62, 64, 67, 71], [76, 79, 83, 74]),
    'C':  (48, [55, 60, 64, 67, 71, 74], [79, 84, 76, 83]),
    'E':  (40, [56, 59, 62, 64, 69], [76, 80, 83]),
}
def chord_hit(t, name, d, vel=0.5, strum=0.012):
    for k, n in enumerate(CH[name][1]):
        put(wet, t + k * strum, ep(n, d, vel), 0.2, pan=(k - 2) * 0.22)

def T(beat): return beat * B

# ── 片头 0–4 拍 ──
put(dry, 0, impact(1.0), 0.9)
put(wet, 0, pad([45, 52, 57, 64], 4 * B + 1.2), 0.5)
put(dry, 24 / 30, stamp(1.0), 0.9); put(dry, 24 / 30, impact(0.8), 0.6)
put(wet, 24 / 30, pluck(88, 0.6, 1), 0.2); put(wet, 24 / 30, pluck(93, 0.6, 1), 0.14)
put(dry, T(3) , whoosh(B, 0.9), 0.32)

# ── 前奏（1955–1984）：每节点 6 拍，无鼓，钟表滴答 ──
PRE = ['Am', 'F', 'C', 'G', 'Am']
for i in range(5):
    s = starts[i]; name = PRE[i]
    put(wet, T(s), pad(CH[name][1][:4], 6 * B + 1.0), 0.42)
    chord_hit(T(s), name, 3.5, 0.55, 0.03)
    chord_hit(T(s + 3), name, 2.4, 0.32, 0.03)
    put(dry, T(s), bass(CH[name][0], 3.6, 0.9), 0.36)
    put(dry, T(s), kick(0.7, deep=True), 0.5)
    mel = CH[name][2]
    for k, (bt, idx) in enumerate([(1, 0), (2, 1), (2.5, 2), (4, 1), (5, 3)]):
        put(wet, T(s + bt), pluck(mel[idx % len(mel)], 0.9, 0.8), 0.13, pan=0.3 * (-1) ** k)
    for k in range(6):
        put(dry, T(s + k), tick(2100 if k % 2 == 0 else 1500, 1.0), 0.10, pan=-0.4 if k % 2 == 0 else 0.4)

# ── 1986：前 4 拍蓄势，后 4 拍落下 ──
s = starts[5]
put(wet, T(s), pad(CH['E'][1][:4], 4 * B + 0.3), 0.45)
chord_hit(T(s), 'E', 2.5, 0.5, 0.03)
put(dry, T(s), bass(40, 2.6, 0.9), 0.36); put(dry, T(s), kick(0.7, deep=True), 0.5)
for k in range(16):                       # 军鼓滚奏渐强
    put(dry, T(s + 2 + k * 0.125), snare(0.25 + 0.75 * (k / 15) ** 1.5), 0.26)
for k in range(4): put(dry, T(s + k), tick(2100, 1), 0.10)
put(dry, T(s + 2), whoosh(2 * B, 1.0), 0.42)

# ── 律动段 ──
LOOP = ['F', 'G', 'Em', 'Am']
bars = []   # (起拍, 和弦, 是否有鼓, 强度)
bars.append((DROP, 'Am', True, 1.0))
bt = GROOVE0; k = 0
while bt < INTER:
    bars.append((bt, LOOP[k % 4], True, 1.0)); bt += 4; k += 1
k = 0; bt = starts[15]
while bt < starts[17]:
    bars.append((bt, LOOP[k % 4], True, 1.0)); bt += 4; k += 1
for name in ['F', 'G', 'C']:
    bars.append((bt, name, True, 1.0)); bt += 4
bars.append((bt, 'C', False, 0.0))        # 最后一小节：只留余音

SW = 0.085  # swing（拍）
MOT = [(0, 0), (0.5, 1), (1.5, 2), (2, 1), (2.5, 3), (3.5, 0)]
for bi, (bs, name, drums, inten) in enumerate(bars):
    root, notes, mel = CH[name]
    last = not drums
    put(wet, T(bs), pad(notes[:4], 4 * B + 0.9), 0.30)
    chord_hit(T(bs), name, 4.0 if last else 1.9, 0.6)
    if last:
        put(dry, T(bs), bass(root, 3.5, 1.0), 0.40); put(dry, T(bs), kick(0.9, deep=True), 0.6)
        for q, n in enumerate([72, 76, 79, 83, 86, 91]):
            put(wet, T(bs) + q * 0.11, pluck(n, 1.6, 0.9), 0.12, pan=0.5 * (-1) ** q)
        continue
    chord_hit(T(bs + 1.5), name, 0.5, 0.32)
    chord_hit(T(bs + 2.5), name, 1.2, 0.45)
    put(dry, T(bs), bass(root, 1.3, 1.0), 0.42)
    put(dry, T(bs + 1.5), bass(root, 0.35, 0.7), 0.36)
    put(dry, T(bs + 2.5), bass(root + 12 if bi % 2 else root, 0.6, 0.85), 0.38)
    put(dry, T(bs + 3.5 + SW), bass(root + 7, 0.3, 0.7), 0.34)
    put(dry, T(bs), kick(1.0), 0.62)
    put(dry, T(bs + 2.5), kick(0.85), 0.55)
    if bi % 2: put(dry, T(bs + 3.5 + SW), kick(0.6), 0.45)
    for q in (1, 3):
        put(dry, T(bs + q), snare(0.9), 0.30); put(dry, T(bs + q), clap(0.9), 0.22)
    for q in range(8):
        off = SW if q % 2 else 0
        put(dry, T(bs + q * 0.5 + off), hat(0.9 if q % 2 == 0 else 0.5, open_=(q == 7 and bi % 4 == 3)), 0.085, pan=0.25)
    for (o, idx) in MOT:
        if (bi % 2 == 1 and o == 0.5): continue
        oo = o + (SW if (o % 1) else 0)
        put(wet, T(bs + oo), pluck(mel[idx % len(mel)], 0.7, 0.85), 0.115, pan=0.35 * (-1) ** idx)

# 落下那一拍
put(dry, T(DROP), impact(1.0), 0.8); put(dry, T(DROP), stamp(1.0), 0.6)
for q, n in enumerate([76, 81, 84, 88]): put(wet, T(DROP) + q * 0.05, pluck(n, 1.2, 1), 0.16, pan=0.5 * (-1) ** q)

# ── 谢幕段（4 拍）：鼓全停，只留长音和两声钟 ──
put(wet, T(INTER), pad([40, 52, 59, 64, 67], 4 * B + 0.8), 0.6)
put(dry, T(INTER), bass(40, 2.6, 0.8), 0.34)
put(wet, T(INTER + 0.5), pluck(83, 2.4, 1), 0.2, pan=-0.3)
put(wet, T(INTER + 2), pluck(76, 2.4, 1), 0.2, pan=0.3)
put(dry, T(INTER + 3), whoosh(B, 0.9), 0.3)

# ── 每节点卡点音效 ──
for i, s in enumerate(starts):
    # 年份滚动：棘轮声 + 上扫
    if i > 0 and i != 15:
        put(dry, T(s - 1), whoosh(B, 0.8), 0.20)
    if i > 0:
        for q in range(7):
            put(dry, T(s - 1 + q / 7 * 0.92), tick(1500 + q * 160, 0.9), 0.10, pan=-0.5 + q / 6)
    put(dry, T(s), impact(0.7), 0.42)
    if HAS_J[i]:
        put(dry, T(s + 1), pop(480, 760, 1), 0.2, pan=-0.2)
    mb = 4 if i == 5 else 2
    if i > 5:
        put(dry, T(s + mb), stamp(1.0), 0.5)
        put(dry, T(s + mb), pop(700, 1250, 1), 0.22, pan=0.2)
# 终章点赞
hs = starts[17] + 5
for q, n in enumerate([84, 88, 91, 96]):
    put(wet, T(hs) + q * 0.06, pluck(n, 1.4, 1), 0.2, pan=0.6 * (-1) ** q)
put(dry, T(hs), pop(600, 1500, 1), 0.3)

# ── 混响 ──
irn = int(1.9 * SR); it = np.arange(irn) / SR
ir = rng.normal(0, 1, (irn, 2)) * np.exp(-it * 3.4)[:, None]
ir[: int(0.012 * SR)] = 0
M = 1 << int(np.ceil(np.log2(N + irn)))
rev = np.zeros((N, 2))
for c in range(2):
    y = np.fft.irfft(np.fft.rfft(wet[:, c], M) * np.fft.rfft(ir[:, c], M), M)[:N]
    rev[:, c] = lp(hp(y, 250), 5000)
rev /= np.abs(rev).max() + 1e-9
mix = dry + wet * 1.0 + rev * 0.16 * np.abs(wet).max() * 4

# ── 母带：软限幅 + 归一 ──
mix = hp(mix[:, 0], 28)[:, None] * [1, 0] + hp(mix[:, 1], 28)[:, None] * [0, 1]
mix /= np.percentile(np.abs(mix), 99.9) + 1e-9
mix = np.tanh(mix * 1.15) / np.tanh(1.15)
mix *= 0.89 / np.abs(mix).max()
out = os.path.join(os.path.dirname(__file__), '..', 'public', 'audio.wav')
with wave.open(out, 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((mix * 32767).astype('<i2').tobytes())
# 自检：各节点前后 RMS
def rms(t0, t1): return float(np.sqrt(np.mean(mix[int(t0 * SR):int(t1 * SR)] ** 2)))
print('total beats', TOTAL_BEATS, 'dur', TOTAL_BEATS * B, 'starts', starts, 'inter', INTER, 'drop', DROP)
print('rms/bar:', ' '.join(f'{rms(T(k), T(k + 4)):.2f}' for k in range(0, TOTAL_BEATS, 4)))
