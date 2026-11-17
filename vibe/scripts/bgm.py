"""原创配乐：每期按时间轴合成一条纯器乐（氛围铺底 + 拨弦琶音 + 轻拍），
在每个换场点加一声轻响，在强调字幕处加一记低频。全部由代码生成，没有版权问题。
用法：python3 scripts/bgm.py [V02 ...]   （先跑 node scripts/export.ts）"""
import json, sys, subprocess, os
import numpy as np

SR = 44100
TL = json.load(open('build/timeline.json'))
NOTE = lambda m: 440.0 * 2 ** ((m - 69) / 12)

# (主音 MIDI, 和弦进行[每个和弦的音程组], BPM)
MOODS = [
    (57, [[0, 3, 7, 10], [-4, 0, 3, 7], [-9, -5, -2, 2], [-2, 2, 5, 9]], 76),   # A 小调 i-VI-III-VII
    (50, [[0, 3, 7, 14], [-4, 0, 3, 10], [3, 7, 10, 14], [-2, 2, 5, 12]], 74),  # D 小调
    (52, [[0, 3, 7, 10], [-4, 0, 3, 7], [3, 7, 10, 14], [-2, 2, 5, 9]], 78),    # E 小调
    (53, [[0, 4, 7, 11], [-1, 2, 7, 11], [-3, 0, 5, 9], [-5, -1, 2, 7]], 72),   # F 大七 下行
    (48, [[0, 3, 7, 10], [-4, 0, 3, 7], [3, 7, 10, 14], [-2, 2, 5, 9]], 76),    # C 小调
]

def tone(f, n, harm=(1, .35, .12), detune=0.0):
    t = np.arange(n) / SR
    out = np.zeros(n)
    for k, h in enumerate(harm, 1):
        out += h * np.sin(2 * np.pi * f * k * (1 + detune) * t + k)
    return out

def synth(eid, info):
    rng = np.random.default_rng(abs(hash(eid)) % 2**32)
    total = info['total'] + 0.5
    N = int(total * SR)
    root, prog, bpm = MOODS[info['mood'] % len(MOODS)]
    beat = 60 / bpm
    L = np.zeros(N); R = np.zeros(N)
    t = np.arange(N) / SR

    # 铺底：每个和弦两小节，交叉淡变
    chord_len = beat * 8
    n_ch = int(np.ceil(total / chord_len)) + 1
    for i in range(n_ch):
        st = i * chord_len - 0.6
        s0 = max(0, int(st * SR)); s1 = min(N, int((st + chord_len + 1.2) * SR))
        if s1 <= s0: continue
        n = s1 - s0
        env = np.minimum(1, np.minimum(np.arange(n) / (0.9 * SR), (n - np.arange(n)) / (0.9 * SR)))
        ch = prog[i % len(prog)]
        for j, iv in enumerate(ch):
            f = NOTE(root + iv)
            lfo = 1 + 0.15 * np.sin(2 * np.pi * (0.13 + 0.05 * j) * t[s0:s1] + j)
            v = 0.055 * env * lfo
            L[s0:s1] += v * tone(f, n, (1, .25, .06), -0.0015)
            R[s0:s1] += v * tone(f, n, (1, .25, .06), +0.0015)
        # 低音
        fb = NOTE(root + ch[0] - 12)
        L[s0:s1] += 0.07 * env * tone(fb, n, (1, .2)); R[s0:s1] += 0.07 * env * tone(fb, n, (1, .2))

    # 拨弦琶音：八分音符，开头 4 拍之后进来，结尾前收
    step = beat / 2
    pat = [0, 2, 1, 3, 2, 1, 3, 2]
    k = 0; tt = beat * 4
    while tt < total - 3:
        ch = prog[int(tt // chord_len) % len(prog)]
        iv = ch[pat[k % 8] % len(ch)] + 12 + (12 if k % 16 in (7, 15) else 0)
        if rng.random() > 0.12:
            n = int(1.4 * SR); s0 = int(tt * SR); s1 = min(N, s0 + n); n = s1 - s0
            env = np.exp(-np.arange(n) / (0.32 * SR)) * np.minimum(1, np.arange(n) / 80)
            v = 0.06 * (0.6 + 0.4 * rng.random()) * env * tone(NOTE(root + iv), n, (1, .45, .15, .05))
            pan = 0.5 + 0.25 * np.sin(k * 0.7)
            L[s0:s1] += v * (1 - pan) * 1.4; R[s0:s1] += v * pan * 1.4
        tt += step; k += 1

    # 轻拍：每拍一下柔和低频，反拍一点点沙沙声（从第 8 拍进入）
    tt = beat * 8
    while tt < total - 4:
        s0 = int(tt * SR); n = min(N - s0, int(0.35 * SR))
        a = np.arange(n) / SR
        kick = 0.11 * np.sin(2 * np.pi * (48 + 60 * np.exp(-a * 30)) * a) * np.exp(-a * 9)
        L[s0:s0 + n] += kick; R[s0:s0 + n] += kick
        h0 = int((tt + beat / 2) * SR); hn = min(N - h0, int(0.08 * SR))
        if hn > 0:
            nz = np.diff(rng.standard_normal(hn + 1)) * np.exp(-np.arange(hn) / (0.015 * SR)) * 0.012
            L[h0:h0 + hn] += nz; R[h0:h0 + hn] += nz * 0.8
        tt += beat

    # 换场：一声风声 + 一下清亮的点
    for sc in info['scenes'][1:]:
        s0 = int(max(0, sc - 0.35) * SR); n = min(N - s0, int(0.9 * SR))
        a = np.arange(n) / SR
        sw = np.convolve(rng.standard_normal(n), np.ones(40) / 40, 'same') * np.sin(np.pi * np.clip(a / 0.55, 0, 1)) ** 2 * 0.05
        L[s0:s0 + n] += sw; R[s0:s0 + n] += sw[::-1] if False else sw * 0.9
        p0 = int(sc * SR); pn = min(N - p0, int(1.2 * SR)); pa = np.arange(pn) / SR
        ping = 0.035 * np.exp(-pa * 4) * (np.sin(2 * np.pi * 1760 * pa) + 0.4 * np.sin(2 * np.pi * 2637 * pa))
        L[p0:p0 + pn] += ping; R[p0:p0 + pn] += ping
    # 强调字幕：一记低沉的“咚”
    for st, en, big in info['beats']:
        if not big: continue
        s0 = int(st * SR); n = min(N - s0, int(2.0 * SR)); a = np.arange(n) / SR
        boom = 0.16 * np.sin(2 * np.pi * 52 * a) * np.exp(-a * 2.2) * np.minimum(1, a / 0.02)
        L[s0:s0 + n] += boom; R[s0:s0 + n] += boom

    # 混响：指数衰减噪声做冲激响应
    ir_n = int(2.2 * SR)
    for ch_i, X in enumerate((L, R)):
        ir = np.random.default_rng(7 + ch_i).standard_normal(ir_n) * np.exp(-np.arange(ir_n) / (0.45 * SR))
        ir = np.convolve(ir, np.ones(12) / 12, 'same'); ir /= np.abs(ir).sum() / 6
        m = 1 << int(np.ceil(np.log2(N + ir_n)))
        wet = np.fft.irfft(np.fft.rfft(X, m) * np.fft.rfft(ir, m), m)[:N]
        X[:] = X * 0.75 + wet * 0.35
    fade = np.minimum(1, np.minimum(t / 1.5, np.maximum(0, (total - t) / 2.5)))
    st = np.stack([L * fade, R * fade], 1)
    st /= max(1e-9, np.abs(st).max()) / 0.8
    raw = f'build/{eid}.raw.wav'
    import wave
    with wave.open(raw, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((st * 32767).astype('<i2').tobytes())
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', raw, '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11', '-ar', str(SR), f'public/audio/{eid}.wav'], check=True)
    os.remove(raw)
    print(eid, f'{total:.1f}s', MOODS[info["mood"] % len(MOODS)][2], 'bpm')

ids = sys.argv[1:] or list(TL)
for eid in ids: synth(eid, TL[eid])
