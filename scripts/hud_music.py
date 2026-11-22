#!/usr/bin/env python3
"""手势全息风 · 配乐：现场合成一条「先铺垫、再蓄力、然后砸下去」的电子曲，音效按界面动作的时刻打进去。

全部是程序合成的（鼓、低音、拨弦、铺底、上升音、撞击、界面音效），没有采样别人的曲子，不用署名。
速度自动按「砸」的那一刻算（120 拍/分上下）：全息段正好是整数个小节，转场落在下一小节第一拍，卡点段每一刀都踩在拍子上。
曲风：小调、四拍底鼓、反拍滚动低音、拨弦琶音——结构是先铺垫、分三档加满、蓄力、砸下去、全开。

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


def pluck(m, d=0.18):
    n = int(0.6 * SR); t = np.arange(n) / SR; f = hz(m); x = 2 * ((f * t) % 1) - 1 + 2 * ((f * 1.007 * t) % 1) - 1
    return band(x, f * 0.8, f * 6) * env(n, 0.002, d) * 0.22


def bars_of(drop): return max(4, int(round(drop / 2.0)))                  # 全息段几小节：让速度落在 120 拍/分上下


def make(drop, total, sfx_list, seed=3, key=38, level=1.0):
    """key 是根音的 MIDI 号（默认 D2，小调）。全息段 N 小节分四档，一档比一档满，最后一档蓄力；转场落在下一小节第一拍。
    返回 (立体声, 每拍的时刻, 速度)。"""
    rng = np.random.default_rng(seed); N = bars_of(drop); bar = drop / N; beat = bar / 4; s16 = beat / 4; bpm = 60 / beat; n = int((total + 1.5) * SR); L = np.zeros(n); Rr = np.zeros(n)

    def put(x, t, g=1.0, pan=0.0):
        i = int(t * SR)
        if i >= n or i < 0 or g <= 0: return
        x = x[: n - i] * g; L[i:i + len(x)] += x * (1 - max(0, pan)); Rr[i:i + len(x)] += x * (1 + min(0, pan))
    scale = [0, 2, 3, 5, 7, 8, 10, 12]; prog = [0, 0, -4, -2]                    # 小调：i  i  VI  VII，两小节换一次
    arp = [0, 4, 7, 4, 2, 4, 7, 6, 0, 4, 7, 4, 5, 4, 2, 4]                       # 拨弦走音阶的第几个音
    put(impact(rng), 0, 0.4)
    for b in range(N):                                                              # 全息段
        t0 = b * bar; q = min(3, int(b * 4 / N)); root = key + prog[(b // 2) % 4]; last = b == N - 1
        if b % 2 == 0: put(pad([root + 12, root + 19, root + 24], bar * 2 + 0.3, rng), t0, (0.22, 0.28, 0.34, 0.3)[q])
        for k in range(16):
            t = t0 + k * s16
            if q == 0 and k in (0, 6, 12): put(pluck(root + 24 + scale[arp[k]]), t, 0.5, 0.3)
            if q >= 1 and not last:
                if k % 4 == 0: put(kick(rng), t, 0.22 + 0.16 * q)
                if k % 4 == 2: put(bass(root - 12, beat * 0.45), t, 0.12 + 0.14 * q); put(hat(rng, 0.05), t, 0.12 + 0.07 * q)
                if k % 2 == 0: put(pluck(root + 24 + scale[arp[k]]), t, 0.3 + 0.12 * q, (rng.random() - 0.5) * 0.6)
            if q >= 2 and not last:
                if k in (4, 12): put(clap(rng), t, 0.3 + 0.1 * q)
                if k % 2 == 1: put(hat(rng, 0.015), t, 0.14, 0.3 if k % 4 == 1 else -0.3); put(bass(root - 12, beat * 0.2), t, 0.1 * q)
        if last:                                                                    # 蓄力：底鼓撤掉，军鼓越打越密 + 上升音
            for j, k in enumerate([0, 4, 8, 10, 12, 13, 14, 14.5, 15, 15.5]): put(clap(rng), t0 + k * s16, 0.22 + 0.05 * j)
            put(riser(bar, rng), t0, 1.0)
    nb = int(np.ceil((total - drop) / bar)) + 1; put(impact(rng), drop, 1.0)
    for b in range(nb):                                                             # 卡点段：四拍底鼓 + 反拍滚动低音，全开
        t0 = drop + b * bar; root = key + prog[(b // 2) % 4]
        for k in range(16):
            t = t0 + k * s16
            if k % 4 == 0: put(kick(rng), t, 1.0)
            else: put(bass(root - 12, beat * (0.42 if k % 4 == 2 else 0.2)), t, 0.95 if k % 4 == 2 else 0.6)
            if k % 4 == 2: put(hat(rng, 0.09), t, 0.5)
            put(hat(rng, 0.015), t, 0.24, 0.35 if k % 2 else -0.35)
            if k in (4, 12): put(clap(rng), t, 0.8)
            put(pluck(root + 24 + scale[arp[(k + b * 3) % 16]], 0.12), t, 0.8 if k % 2 == 0 else 0.5, (rng.random() - 0.5) * 0.7)
            if k in (0, 3, 6, 10): put(bell(root + 36 + scale[arp[(k * 5 + b) % 16] % 5], 0.1), t, 0.5)
        if b % 4 == 3: put(riser(bar * 0.5, rng), t0 + bar * 0.5, 0.35)
    for t, kind in sfx_list: put(sfx(kind, rng), t, 0.9, (rng.random() - 0.5) * 0.6)
    st = np.stack([L, Rr], 1)[: int(total * SR)]
    side = np.ones(len(st)); i0 = int(drop * SR)                                    # 底鼓一响，其它声部让一下（抽吸感）
    for b in range(nb * 4):
        i = i0 + int(b * beat * SR); m = min(len(st) - i, int(0.2 * SR))
        if m > 0: side[i:i + m] = np.minimum(side[i:i + m], 0.7 + 0.3 * np.linspace(0, 1, m))
    st *= side[:, None]
    fade = int(0.6 * SR); st[-fade:] *= np.linspace(1, 0, fade)[:, None]
    st = np.tanh(st * 0.95 * level) * 0.89
    return st, [round(i * beat, 4) for i in range(int(total / beat) + 1)], bpm


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--plan"); ap.add_argument("--drop", type=float); ap.add_argument("--total", type=float); ap.add_argument("-o", "--out")
    ap.add_argument("--sfx", default=""); ap.add_argument("--seed", type=int, default=3); ap.add_argument("--key", type=int, default=38)
    a = ap.parse_args(); sl = [(float(x.split(":")[0]), x.split(":")[1]) for x in a.sfx.split(",") if ":" in x]
    if a.plan:
        p = json.load(open(a.plan)); a.drop = p["hudEnd"]; beat = a.drop / bars_of(a.drop) / 4; a.total = a.total or a.drop + sum(c["beats"] for c in p["cuts"]) * beat + (2.5 if p.get("end") else 0)
        a.out = a.out or os.path.join(ROOT, "studio", "public", p["dir"], "music.wav")
        for it in p["items"]:
            if it.get("sfx") != "none": sl.append((it["at"], it.get("sfx") or SFX_OF.get(it["type"], "pop")))
            for r in it.get("items", []) if it["type"] == "checks" else []: sl.append((r["t"], "confirm"))
            if it.get("pickAt"): sl.append((it["pickAt"], "confirm"))
    st, beats, bpm = make(a.drop, a.total, sl, a.seed, a.key); os.makedirs(os.path.dirname(os.path.abspath(a.out)), exist_ok=True); sf.write(a.out, st, SR, subtype="PCM_16")
    print(f"配乐：{a.out}\n  速度 {bpm:.1f} 拍/分，全长 {a.total:.1f} 秒，第 {a.drop:.2f} 秒砸下去，打了 {len(sl)} 个界面音效")


if __name__ == "__main__":
    main()
