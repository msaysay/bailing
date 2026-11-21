"""声音处理的共用函数：量底噪、人声降噪修音、合成配乐、人声和配乐混音。
scripts/frame_audio.py（相框口播线）和 scripts/polish.py（所有风格通用）都用这里的同一套做法，改参数只改这一处。
所有处理都不改时长，字幕时间不受影响。"""
import os, re, subprocess
import numpy as np

SR = 48000
MUSIC_EXT = (".mp3", ".wav", ".m4a", ".flac", ".aac", ".ogg")

def ff(*args): subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", *args], check=True)

def lufs(path):
    r = subprocess.run(["ffmpeg", "-nostdin", "-hide_banner", "-i", path, "-af", "ebur128", "-f", "null", "-"], capture_output=True, text=True).stderr
    m = re.findall(r"I:\s+(-?[\d.]+) LUFS", r); return float(m[-1]) if m else float("nan")

def duration(path):
    return float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path], capture_output=True, text=True).stdout or 0)

def floor_db(sig, rate, gaps=()):
    """底噪：把全片切成 50 毫秒一格，取最安静的 8% 的平均；gaps 给了停顿的起止秒时，再和停顿里量到的比，取小的那个。"""
    w = int(rate * 0.05); fr = sig[: len(sig) // w * w].reshape(-1, w); r = np.sort(np.sqrt((fr ** 2).mean(axis=1))); r = r[r > 1e-6]
    q = float(r[: max(1, len(r) // 12)].mean()) if len(r) else 1e-7
    seg = [sig[int(s * rate):int(e * rate)] for s, e in gaps if e - s > 0.1]
    if seg: q = min(q, float(np.sqrt(np.mean(np.concatenate(seg) ** 2))))
    return 20 * np.log10(max(1e-7, q))

def pick_level(level, nf):
    """auto 时按底噪选档：低于 -62 dB 不降噪，-62 到 -48 用 light，更吵用 strong。"""
    if level != "auto": return level
    return "off" if nf < -62 else "light" if nf < -48 else "strong"

def voice_chain(level, nf):
    """人声滤镜串：切低频 → 降噪 → 轻压缩 → 去齿音 → 响度归一到 -16 LUFS。
    实测：afftdn 的 nf 设成量到的底噪加 4 dB、不开自动跟踪时最有效（-45 dB 的白噪声，light 压到 -55，strong 压到 -65 以下，人声电平不变）。"""
    chain = ["highpass=f=75"]
    if level == "light": chain.append(f"afftdn=nr=10:nf={max(-78, min(-22, nf + 4)):.0f}")
    if level == "strong": chain += [f"afftdn=nr=20:nf={max(-78, min(-22, nf + 4)):.0f}", "agate=threshold=0.008:ratio=1.5:attack=8:release=250"]
    return chain + ["acompressor=threshold=-21dB:ratio=2.6:attack=8:release=120:makeup=2", "deesser=i=0.25", "loudnorm=I=-16:TP=-1.5:LRA=9"]

def clean_voice(src, dst, level, nf, total):
    """src 的人声处理后写成 dst（48k 单声道），补齐或裁到 total 秒。返回处理后的波形。"""
    import soundfile as sf
    ff("-i", src, "-vn", "-af", ",".join(voice_chain(level, nf)), "-ar", str(SR), "-ac", "1", dst)
    y, _ = sf.read(dst, dtype="float32"); n = int(round(total * SR))
    y = y[:n] if len(y) >= n else np.concatenate([y, np.zeros(n - len(y), dtype="float32")]); sf.write(dst, y, SR)
    return y

NOTE = lambda m: 440.0 * 2 ** ((m - 69) / 12)
MOODS = {  # (主音, 和弦进行, 每分钟拍数)：都是大调，暖、不抢话
    "warm": (60, [[0, 4, 7, 14], [-3, 0, 4, 12], [-7, -3, 0, 9], [-5, -1, 2, 11]], 78),      # C: I – vi – IV – V
    "bright": (62, [[0, 4, 7, 12], [-5, -1, 2, 11], [-3, 0, 4, 12], [-7, -3, 0, 9]], 92),     # D: I – V – vi – IV
    "calm": (58, [[0, 4, 7, 11], [-7, -3, 0, 4], [-3, 0, 4, 7], [-5, -1, 2, 9]], 66),         # 降B: Imaj7 – IV – vi – V
}
def synth(total, mood, seed):
    """代码合成一条钢琴加铺底的轻配乐（没有版权问题），返回 48k 立体声波形。"""
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

def music_files(folder):
    import glob
    return sorted(f for f in glob.glob(os.path.join(folder, "*")) if f.lower().endswith(MUSIC_EXT)) if folder and os.path.isdir(folder) else []

def make_bed(dst, total, src=None, mood="warm", seed=0):
    """配乐底：src 给了就循环或裁到片长；没给就用代码合成。"""
    if src: ff("-stream_loop", "-1", "-i", src, "-vn", "-t", f"{total:.3f}", "-ar", str(SR), "-ac", "2", dst)
    else:
        import soundfile as sf
        sf.write(dst, synth(total, mood, seed), SR)

def mix_music(voice, bed, dst, total, music_db=-27.0):
    """人声加配乐：配乐拉到 music_db，人声在的时候自动压低，开头 1 秒淡入，结尾 2.5 秒淡出。voice 可以是单声道或立体声。"""
    gain = music_db - lufs(bed); fo = max(0.0, total - 2.5)
    fc = (f"[1:a]volume={gain:.2f}dB,highpass=f=90,lowpass=f=9000,afade=t=in:d=1.0,afade=t=out:st={fo:.3f}:d=2.5[m];"
          f"[0:a]aformat=channel_layouts=stereo,asplit=2[vs][k];[m][k]sidechaincompress=threshold=0.02:ratio=3:attack=25:release=450[md];"
          f"[vs][md]amix=inputs=2:normalize=0:duration=first,alimiter=limit=0.89:level=0[o]")
    ff("-i", voice, "-i", bed, "-filter_complex", fc, "-map", "[o]", "-ar", str(SR), "-t", f"{total:.3f}", dst)

def normalize(src, dst, target=-16.0):
    """整体拉回 target LUFS（只调音量，不改时长）。"""
    ff("-i", src, "-af", f"volume={target - lufs(src):.2f}dB,alimiter=limit=0.84:level=0", "-ar", str(SR), dst)

LIB = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "music")
MOOD_ALIAS = {"bright": "light"}          # 老的叫法
def pick_music(mood, seed, no_credit=False, root=None):
    """从默认配乐库（music/<情绪>/）里按 seed 固定挑一首。no_credit 只挑代码合成的（不用署名）。
    返回 (文件路径, 署名文字或 None)；库里没有合适的返回 (None, None)。建库：python3 scripts/music_lib.py build"""
    import json
    root = root or LIB; mood = MOOD_ALIAS.get(mood, mood); files = music_files(os.path.join(root, mood))
    credits = {}
    lj = os.path.join(root, "library.json")
    if os.path.exists(lj): credits = {os.path.join(root, t["file"]): t.get("credit") for t in json.load(open(lj, encoding="utf-8")).get("tracks", [])}
    if no_credit: files = [f for f in files if os.path.basename(f).startswith("合成-")]
    if not files: return None, None
    f = files[seed % len(files)]; return f, credits.get(f)
