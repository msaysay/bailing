#!/usr/bin/env python3
"""相框口播线的声音：人声降噪和修音，自动配乐，混成一条成片用的音轨。
用法：python3 scripts/frame_audio.py <期目录> [--denoise auto|off|light|strong] [--music auto|off|<音乐文件>] [--mood warm|bright|calm] [--music-db -27]
读：studio/public/<期短名>/voice.wav（对齐那一步出的，时长和人物视频一致）、meta.json、timing.json
写：studio/public/<期短名>/mix.wav，并把 meta.json 的 voice 指向它（原来的干声记在 voice_dry）
人声：切低频 → 降噪 → 轻压缩 → 去齿音 → 响度归一到 -16 LUFS。时长一帧不变，字幕时间不受影响。
  auto：先在说话的间隙里量底噪，低于 -62 dB 不降噪，-62 到 -48 用 light，更吵用 strong。
配乐：brands/<品牌>/music/ 里有文件就用（多首时按期短名固定选一首，循环或裁到片长）；没有就用代码合成一条（没有版权问题）。
  人声在的时候配乐自动压低，开头 1 秒淡入，结尾 2.5 秒淡出。--music-db 是配乐相对满刻度的响度，默认 -27（人声是 -16）。"""
import sys as _sys
for _s in (_sys.stdout, _sys.stderr): getattr(_s, "reconfigure", lambda **k: None)(encoding="utf-8", errors="replace")   # Windows 终端也能打印中文
import argparse, glob, hashlib, json, os, re, subprocess, sys, tempfile
import numpy as np, soundfile as sf

ap = argparse.ArgumentParser(); ap.add_argument("ep"); ap.add_argument("--denoise", default="auto"); ap.add_argument("--music", default="auto"); ap.add_argument("--mood", default="warm", choices=["warm", "bright", "calm"])
ap.add_argument("--music-db", type=float, default=-27.0); ap.add_argument("--brand", default=None); a = ap.parse_args()
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); W = os.path.join(a.ep, "03_制作过程"); brand = a.brand or os.path.join(ROOT, "brands", "yuedu")
meta = json.load(open(f"{W}/meta.json", encoding="utf-8")); tm = json.load(open(f"{W}/timing.json", encoding="utf-8"))
pub = os.path.join(ROOT, "studio", "public"); dry_rel = meta.get("voice_dry") or meta["voice"]; dry = os.path.join(pub, dry_rel); out = os.path.join(pub, meta["slug"], "mix.wav")
if not os.path.exists(dry): sys.exit("没有干声：" + dry + "（先做完对齐那一步）")
tmp = tempfile.mkdtemp(); SR = 48000
def ff(*args): subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", *args], check=True)
def lufs(path):
    r = subprocess.run(["ffmpeg", "-nostdin", "-hide_banner", "-i", path, "-af", "ebur128", "-f", "null", "-"], capture_output=True, text=True).stderr
    m = re.findall(r"I:\s+(-?[\d.]+) LUFS", r); return float(m[-1]) if m else float("nan")

# ---- 量底噪：取字和字之间超过 0.35 秒的间隙 ----
x, sr = sf.read(dry, dtype="float32"); x = x.mean(axis=1) if x.ndim > 1 else x; total = len(x) / sr
ts = sorted(c["t"] for l in tm["lines"] for c in l["chars"])
gaps = [(p + 0.3, q - 0.08) for p, q in zip(ts, ts[1:]) if q - p > 0.8]
def floor_db(sig, rate):
    """底噪：把全片切成 50 毫秒一格，取最安静的 8% 的平均；有明显停顿时再和停顿里量到的比，取小的那个。"""
    w = int(rate * 0.05); fr = sig[: len(sig) // w * w].reshape(-1, w); r = np.sort(np.sqrt((fr ** 2).mean(axis=1))); r = r[r > 1e-6]
    q = float(r[: max(1, len(r) // 12)].mean()) if len(r) else 1e-7
    seg = [sig[int(s * rate):int(e * rate)] for s, e in gaps if e - s > 0.1]
    if seg: q = min(q, float(np.sqrt(np.mean(np.concatenate(seg) ** 2))))
    return 20 * np.log10(max(1e-7, q))
nf = floor_db(x, sr); level = a.denoise
if level == "auto": level = "off" if nf < -62 else "light" if nf < -48 else "strong"

# ---- 人声处理（所有滤镜都不改时长）----
chain = ["highpass=f=75"]
# 实测：afftdn 的 nf 设成量到的底噪加 4 dB、不开自动跟踪时最有效（-45 dB 的白噪声，light 压到 -55，strong 压到 -65 以下，人声电平不变）
if level == "light": chain.append(f"afftdn=nr=10:nf={max(-78, min(-22, nf + 4)):.0f}")
if level == "strong": chain += [f"afftdn=nr=20:nf={max(-78, min(-22, nf + 4)):.0f}", "agate=threshold=0.008:ratio=1.5:attack=8:release=250"]
chain += ["acompressor=threshold=-21dB:ratio=2.6:attack=8:release=120:makeup=2", "deesser=i=0.25", "loudnorm=I=-16:TP=-1.5:LRA=9"]
voice = os.path.join(tmp, "voice.wav"); ff("-i", dry, "-af", ",".join(chain), "-ar", str(SR), "-ac", "1", voice)
y, _ = sf.read(voice, dtype="float32"); n = int(round(total * SR))
y = y[:n] if len(y) >= n else np.concatenate([y, np.zeros(n - len(y), dtype="float32")]); sf.write(voice, y, SR)
nf2 = floor_db(y, SR)

# ---- 配乐 ----
NOTE = lambda m: 440.0 * 2 ** ((m - 69) / 12)
MOODS = {  # (主音, 和弦进行, 每分钟拍数)：都是大调，暖、不抢话
    "warm": (60, [[0, 4, 7, 14], [-3, 0, 4, 12], [-7, -3, 0, 9], [-5, -1, 2, 11]], 78),      # C: I – vi – IV – V
    "bright": (62, [[0, 4, 7, 12], [-5, -1, 2, 11], [-3, 0, 4, 12], [-7, -3, 0, 9]], 92),     # D: I – V – vi – IV
    "calm": (58, [[0, 4, 7, 11], [-7, -3, 0, 4], [-3, 0, 4, 7], [-5, -1, 2, 9]], 66),         # 降B: Imaj7 – IV – vi – V
}
def synth(total, mood, seed):
    rng = np.random.default_rng(seed); root, prog, bpm = MOODS[mood]; beat = 60 / bpm; N = int((total + 1) * SR); L = np.zeros(N); R = np.zeros(N); bar = beat * 4
    def key(f, dur, vel):                               # 钢琴感的音：谐波随时间衰减，高次谐波衰减更快
        m = int(dur * SR); t = np.arange(m) / SR; o = np.zeros(m)
        for k, h in enumerate((1, .5, .28, .14, .07, .03), 1): o += h * np.sin(2 * np.pi * f * k * (1 + 0.0004 * k * k) * t) * np.exp(-t * (1.6 + 0.9 * k))
        return vel * o * np.minimum(1, t / 0.006)
    def put(sig, at, pan):
        s = max(0, int(at * SR))
        if s >= N: return
        e = min(N, s + len(sig)); L[s:e] += sig[: e - s] * (1 - pan); R[s:e] += sig[: e - s] * pan
    nb = int(np.ceil(total / bar)) + 1
    for b in range(nb):
        ch = prog[b % len(prog)]; t0 = b * bar; sect = (b // 8) % 3                     # 每 8 小节换一种织体，免得听腻
        m = int((bar + 1.5) * SR); t = np.arange(m) / SR; env = np.minimum(1, t / 1.2) * np.minimum(1, (bar + 1.5 - t) / 1.2); pad = np.zeros(m)
        for j, iv in enumerate(ch[:3]): pad += np.sin(2 * np.pi * NOTE(root + iv) * t + j) * (1 + 0.1 * np.sin(2 * np.pi * 0.2 * t + j))
        put(0.028 * env * pad, max(0, t0 - 0.6), 0.5)
        put(key(NOTE(root + ch[0] - 12), bar * 0.95, 0.20), t0, 0.5)                       # 低音
        if sect != 2: put(key(NOTE(root + ch[0] - 12 + 7), beat * 1.8, 0.09), t0 + beat * 2, 0.5)
        pat = ([0, 1, 2, 1, 3, 2, 1, 2] if sect == 0 else [0, 2, 1, 3, 2, 3, 1, 2] if sect == 1 else [0, None, 2, None, 3, None, 2, 1])
        for k, p in enumerate(pat):
            if p is None or rng.random() < 0.08: continue
            iv = ch[p % len(ch)] + (12 if (k == 7 and b % 2) else 0)
            put(key(NOTE(root + iv), beat * 2.2, 0.11 * (1.15 if k % 4 == 0 else 0.8 + 0.2 * rng.random())), t0 + k * beat / 2 + rng.normal(0, 0.004), 0.5 + 0.22 * np.sin(k * 0.9 + b))
        if b % 4 == 3 and sect != 2: put(key(NOTE(root + ch[3] + 12), beat * 3, 0.07), t0 + beat * 3, 0.62)   # 句尾点一个高音
    ir = rng.normal(0, 1, int(1.4 * SR)) * np.exp(-np.arange(int(1.4 * SR)) / (0.32 * SR)); ir /= np.abs(ir).sum() / 6      # 一点房间混响
    from numpy.fft import irfft, rfft
    def rev(s): m = len(s) + len(ir) - 1; k = 1 << (m - 1).bit_length(); return irfft(rfft(s, k) * rfft(ir, k), k)[: len(s)]
    L = L + 0.22 * rev(L); R = R + 0.22 * rev(R); st = np.stack([L, R], axis=1)[: int(total * SR)]
    return (st / max(1e-6, np.abs(st).max()) * 0.7).astype("float32")

src = None; label = "不加配乐"
if a.music != "off":
    if a.music != "auto":
        if not os.path.exists(a.music): sys.exit("找不到音乐文件：" + a.music)
        src = a.music; label = "指定的 " + os.path.basename(src)
    else:
        files = sorted(f for f in glob.glob(os.path.join(brand, "music", "*")) if f.lower().endswith((".mp3", ".wav", ".m4a", ".flac", ".aac", ".ogg")))
        if files: src = files[int(hashlib.md5(meta["slug"].encode()).hexdigest(), 16) % len(files)]; label = "品牌音乐库的 " + os.path.basename(src)
    bed = os.path.join(tmp, "bed.wav")
    if src: ff("-stream_loop", "-1", "-i", src, "-t", f"{total:.3f}", "-ar", str(SR), "-ac", "2", bed)
    else: sf.write(bed, synth(total, a.mood, int(hashlib.md5(meta["slug"].encode()).hexdigest(), 16) % 2 ** 31), SR); label = f"代码合成的配乐（{a.mood}）"
    gain = a.music_db - lufs(bed); fo = max(0.0, total - 2.5)
    fc = (f"[1:a]volume={gain:.2f}dB,highpass=f=90,lowpass=f=9000,afade=t=in:d=1.0,afade=t=out:st={fo:.3f}:d=2.5[m];"
          f"[0:a]asplit=2[v][k];[m][k]sidechaincompress=threshold=0.02:ratio=3:attack=25:release=450[md];"
          f"[v]pan=stereo|c0=c0|c1=c0[vs];[vs][md]amix=inputs=2:normalize=0:duration=first,alimiter=limit=0.89:level=0[o]")
    pre = os.path.join(tmp, "premix.wav"); ff("-i", voice, "-i", bed, "-filter_complex", fc, "-map", "[o]", "-ar", str(SR), "-t", f"{total:.3f}", pre)
else: pre = os.path.join(tmp, "premix.wav"); ff("-i", voice, "-ac", "2", "-ar", str(SR), pre)
ff("-i", pre, "-af", f"volume={-16.0 - lufs(pre):.2f}dB,alimiter=limit=0.84:level=0", "-ar", str(SR), out)      # 整体拉回 -16 LUFS（只调音量，不改时长）

meta["voice_dry"] = dry_rel; meta["voice"] = f"{meta['slug']}/mix.wav"; meta["audio"] = {"denoise": level, "noise_floor_before": round(nf, 1), "noise_floor_after": round(nf2, 1), "music": label, "music_db": a.music_db if a.music != "off" else None}
json.dump(meta, open(f"{W}/meta.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
od = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", out], capture_output=True, text=True).stdout)
print(f"底噪 {nf:.0f} dB → 降噪档位 {level} → 处理后 {nf2:.0f} dB")
print(f"配乐：{label}；混音后整体响度 {lufs(out):.1f} LUFS，时长 {od:.2f} 秒（人声 {total:.2f} 秒）")
if abs(od - total) > 0.05: sys.exit("混音后时长变了，音画会错位，不能用")
print(f"→ {out}；meta.json 的 voice 已指向它。重新跑 frame_plan.py 后渲染。")
