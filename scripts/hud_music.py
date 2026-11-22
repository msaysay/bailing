#!/usr/bin/env python3
"""手势全息风 · 配乐：现场合成一条「先铺垫、再蓄力、然后砸下去」的电子曲，音效按界面动作的时刻打进去。

全部是程序合成的（鼓、808 低音、牛铃旋律、铺底、上升音、撞击、界面音效），没有采样别人的曲子，不用署名。
速度自动按「砸」的那一刻算：全息段正好是 4 小节，转场落在第 5 小节第一拍，卡点段每一刀都踩在拍子上。

用法：
  python3 scripts/hud_music.py --drop 11.8 --total 20 -o studio/public/hud01/music.wav [--sfx 0.2:pop,1.0:whoosh,5.6:confirm] [--seed 3] [--key 43]
也可以直接读 plan.json：  python3 scripts/hud_music.py --plan episodes/hud01/plan.json
"""
import argparse, json, os
import numpy as np, soundfile as sf

SR = 48000
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SFX_OF = {"avatar": "pop", "panel": "whoosh", "ribbon": "shimmer", "pick": "confirm", "checks": "pop", "dial": "rise", "holo": "glass", "tag": "pop"}


def env(n, a=0.002, d=0.2): t = np.arange(n) / SR; return np.minimum(1, t / a) * np.exp(-t / d)
def noise(n, rng): return rng.standard_normal(n)
def hz(m): return 440 * 2 ** ((m - 69) / 12)


def band(x, lo, hi):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR); g = 1 / (1 + (lo / np.maximum(f, 1)) ** 6) / (1 + (f / hi) ** 6); return np.fft.irfft(X * g, len(x))


def sweep(n, f0, f1, k=30): t = np.arange(n) / SR; f = f1 + (f0 - f1) * np.exp(-t * k); return np.sin(2 * np.pi * np.cumsum(f) / SR)
def kick(rng): n = int(0.5 * SR); return np.tanh(sweep(n, 170, 44, 28) * env(n, 0.001, 0.19) * 2.6) * 0.95 + band(noise(n, rng), 2000, 9000) * env(n, 0.0005, 0.006) * 0.3
def hat(rng, d=0.03): n = int(0.25 * SR); return band(noise(n, rng), 7000, 16000) * env(n, 0.0005, d) * 0.5
def clap(rng): n = int(0.35 * SR); x = band(noise(n, rng), 900, 6000); e = sum(np.roll(env(n, 0.0005, 0.012), int(k * 0.011 * SR)) for k in range(3)) + env(n, 0.001, 0.11); return np.tanh(x * e * 0.9)
def bass(m, dur): n = int(dur * SR); t = np.arange(n) / SR; f = hz(m); x = np.sin(2 * np.pi * (f * t + 0.8 * np.exp(-t * 18))) + 0.25 * np.sin(4 * np.pi * f * t); return np.tanh(x * 2.2) * np.minimum(1, t / 0.004) * np.exp(-t / (dur * 0.7)) * 0.8


def bell(m, d=0.16):
    n = int(0.45 * SR); t = np.arange(n) / SR; f = hz(m); x = np.sign(np.sin(2 * np.pi * f * t)) + np.sign(np.sin(2 * np.pi * f * 1.48 * t)); return band(x, f * 0.9, f * 5) * env(n, 0.001, d) * 0.28


def pad(ms, dur, rng):
    n = int(dur * SR); t = np.arange(n) / SR; x = np.zeros(n)
    for m in ms:
        for det in (-0.07, 0, 0.07): f = hz(m + det); x += 2 * ((f * t + rng.random()) % 1) - 1
    return band(x, 80, 900) / (len(ms) * 3) * np.minimum(1, t / 0.6) * np.minimum(1, (dur - t) / 0.4)


def riser(dur, rng):
    n = int(dur * SR); t = np.arange(n) / SR; p = t / dur; x = noise(n, rng); X = np.zeros(n); B = 2048
    for i in range(0, n - B, B // 2): c = 300 * (40 ** p[i]); X[i:i + B] += band(x[i:i + B] * np.hanning(B), c * 0.7, c * 1.5)
    return (X * 0.5 + np.sin(2 * np.pi * np.cumsum(180 * 4 ** p) / SR) * 0.18) * p ** 2


def impact(rng): n = int(2.2 * SR); return np.tanh(sweep(n, 120, 32, 6) * env(n, 0.002, 0.7) * 3) * 0.9 + band(noise(n, rng), 300, 12000) * env(n, 0.002, 0.5) * 0.45


def sfx(kind, rng):
    if kind == "pop": n = int(0.2 * SR); return sweep(n, 500, 1500, -18)[::-1] * env(n, 0.002, 0.05) * 0.5 + sweep(n, 2400, 2400) * env(n, 0.001, 0.03) * 0.2
    if kind == "whoosh": n = int(0.55 * SR); t = np.arange(n) / n; return band(noise(n, rng), 400, 5000) * np.sin(np.pi * t) ** 2 * 0.55
    if kind == "confirm": n = int(0.5 * SR); a = np.sin(2 * np.pi * 880 * np.arange(n) / SR) * env(n, 0.002, 0.09); b = np.sin(2 * np.pi * 1318 * np.arange(n) / SR) * env(n, 0.002, 0.16); return (a + np.roll(b, int(0.09 * SR)) * (np.arange(n) > 0.09 * SR)) * 0.4
    if kind == "shimmer": n = int(1.2 * SR); t = np.arange(n) / SR; return sum(np.sin(2 * np.pi * f * t + i) for i, f in enumerate((2093, 2637, 3136, 3951))) * np.sin(np.pi * t / 1.2) ** 2 * 0.07 + band(noise(n, rng), 5000, 14000) * np.sin(np.pi * t / 1.2) ** 2 * 0.12
    if kind == "glass": n = int(0.9 * SR); t = np.arange(n) / SR; return sum(np.sin(2 * np.pi * f * t) * np.exp(-t / (0.25 - i * 0.03)) for i, f in enumerate((1568, 2349, 3520, 4699))) * 0.1
    if kind == "rise": n = int(1.0 * SR); t = np.arange(n) / SR; return np.sin(2 * np.pi * np.cumsum(300 + 900 * t ** 2) / SR) * (t / 1.0) * 0.22
    return np.zeros(1)


def make(drop, total, sfx_list, seed=3, key=43, level=1.0):
    """key 是根音的 MIDI 号（默认 G2）。返回 (立体声, 每拍的时刻, 速度)。"""
    rng = np.random.default_rng(seed); beat = drop / 16; bpm = 60 / beat; n = int((total + 1.5) * SR); L = np.zeros(n); Rr = np.zeros(n)

    def put(x, t, g=1.0, pan=0.0):
        i = int(t * SR)
        if i >= n or i < 0: return
        x = x[: n - i] * g; L[i:i + len(x)] += x * (1 - max(0, pan)); Rr[i:i + len(x)] += x * (1 + min(0, pan))
    scale = [0, 3, 5, 7, 10, 12]; prog = [0, 0, -4, -2]                          # 小调：i  i  VI  VII
    put(impact(rng), 0, 0.4)
    for b in range(4): put(pad([key + 12 + prog[b], key + 19 + prog[b], key + 24 + prog[b]], beat * 4 + 0.3, rng), b * 4 * beat, (0.22, 0.3, 0.38, 0.3)[b])
    s16 = beat / 4
    for b in range(4):                                                              # 全息段：一小节比一小节满
        t0 = b * 4 * beat
        for k in range(16):
            if b >= 1 and k % 2 == 0: put(hat(rng, 0.02), t0 + k * s16, 0.12 + 0.08 * b, 0.3 if k % 4 else -0.3)
            if b >= 2 and k % 4 == 2: put(hat(rng, 0.08), t0 + k * s16, 0.3)
        if b >= 1:
            for k in (0, 6, 10): put(bass(key + prog[b], beat * 1.2), t0 + k * s16, 0.16 + 0.12 * b)
            put(kick(rng), t0, 0.2 + 0.12 * b); put(kick(rng), t0 + 10 * s16, 0.15 + 0.1 * b)
        if b >= 2: put(clap(rng), t0 + 8 * s16, 0.4)
        if b == 0:
            for k in (0, 4, 8, 12): put(sfx("pop", rng), t0 + k * s16, 0.12)
        if b == 3:                                                                  # 蓄力：军鼓越打越密 + 上升音
            for j, k in enumerate([0, 4, 8, 10, 12, 13, 14, 15, 15.5]): put(clap(rng), t0 + k * s16, 0.25 + 0.05 * j)
            put(riser(beat * 4, rng), t0, 0.9)
    mel = [0, 3, 0, 5, 3, 0, 4, 2, 0, 3, 0, 5, 4, 3, 2, 0]                         # 牛铃旋律走音阶的第几个音
    nb = int(np.ceil((total - drop) / (4 * beat))) + 1
    put(impact(rng), drop, 1.0)
    for b in range(nb):                                                             # 卡点段：全开
        t0 = drop + b * 4 * beat; root = key + prog[b % 4]
        for k in range(16):
            put(hat(rng, 0.018 if k % 2 else 0.03), t0 + k * s16, 0.42 if k % 2 == 0 else 0.26, 0.35 if k % 2 else -0.35)
            if k in (0, 3, 6, 10, 11): put(kick(rng), t0 + k * s16, 1.0)
            if k in (0, 3, 6, 10): put(bass(root, beat * 0.9), t0 + k * s16, 0.95)
            if k in (4, 12): put(clap(rng), t0 + k * s16, 0.75)
            if k == 14: put(hat(rng, 0.14), t0 + k * s16, 0.4)
            put(bell(root + 36 + scale[mel[(k + b * 5) % 16]]), t0 + k * s16, 0.9 if k % 4 == 0 else 0.6, (rng.random() - 0.5) * 0.5)
    for t, kind in sfx_list: put(sfx(kind, rng), t, 0.9, (rng.random() - 0.5) * 0.6)
    st = np.stack([L, Rr], 1)[: int(total * SR)]
    side = np.ones(len(st)); i0 = int(drop * SR)                                    # 卡点段：底鼓一响，其它声部让一下（抽吸感）
    for b in range(nb * 16):
        if b % 16 in (0, 3, 6, 10, 11):
            i = i0 + int(b * s16 * SR); m = min(len(st) - i, int(0.22 * SR))
            if m > 0: side[i:i + m] = np.minimum(side[i:i + m], 0.72 + 0.28 * np.linspace(0, 1, m))
    st *= side[:, None]
    fade = int(0.6 * SR); st[-fade:] *= np.linspace(1, 0, fade)[:, None]
    st = np.tanh(st * 0.95 * level) * 0.89
    return st, [round(i * beat, 4) for i in range(int(total / beat) + 1)], bpm


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--plan"); ap.add_argument("--drop", type=float); ap.add_argument("--total", type=float); ap.add_argument("-o", "--out")
    ap.add_argument("--sfx", default=""); ap.add_argument("--seed", type=int, default=3); ap.add_argument("--key", type=int, default=43)
    a = ap.parse_args(); sl = [(float(x.split(":")[0]), x.split(":")[1]) for x in a.sfx.split(",") if ":" in x]
    if a.plan:
        p = json.load(open(a.plan)); a.drop = p["hudEnd"]; beat = a.drop / 16; a.total = a.total or a.drop + sum(c["beats"] for c in p["cuts"]) * beat + (2.5 if p.get("end") else 0)
        a.out = a.out or os.path.join(ROOT, "studio", "public", p["dir"], "music.wav")
        for it in p["items"]:
            if it.get("sfx") != "none": sl.append((it["at"], it.get("sfx") or SFX_OF.get(it["type"], "pop")))
            for r in it.get("items", []) if it["type"] == "checks" else []: sl.append((r["t"], "confirm"))
            if it.get("pickAt"): sl.append((it["pickAt"], "confirm"))
    st, beats, bpm = make(a.drop, a.total, sl, a.seed, a.key); os.makedirs(os.path.dirname(os.path.abspath(a.out)), exist_ok=True); sf.write(a.out, st, SR, subtype="PCM_16")
    print(f"配乐：{a.out}\n  速度 {bpm:.1f} 拍/分，全长 {a.total:.1f} 秒，第 {a.drop:.2f} 秒砸下去，打了 {len(sl)} 个界面音效")


if __name__ == "__main__":
    main()
