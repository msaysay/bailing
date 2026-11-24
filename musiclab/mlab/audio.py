"""听：解码、响度、人声活动检测、整首曲子的结构分析。只依赖 ffmpeg、numpy、librosa。"""
import re, subprocess
import numpy as np

SR = 22050


def _run(cmd, **k):
    return subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, **k)


def decode(path, sr=SR, ch=1, start=None, dur=None, af=None):
    cmd = ["ffmpeg", "-nostdin", "-v", "error"]
    if start:
        cmd += ["-ss", f"{start:.3f}"]
    if dur:
        cmd += ["-t", f"{dur:.3f}"]
    cmd += ["-i", path, "-vn", "-ac", str(ch), "-ar", str(sr)]
    if af:
        cmd += ["-af", af]
    x = np.frombuffer(_run(cmd + ["-f", "f32le", "-"]).stdout, np.float32)
    return x.copy() if ch == 1 else x[: len(x) // ch * ch].reshape(-1, ch).copy()


def duration(path):
    r = _run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path])
    return float(r.stdout.decode().strip() or 0)


def lufs(path):
    """整体响度（EBU R128）。量不出来时返回 None。"""
    r = _run(["ffmpeg", "-nostdin", "-i", path, "-vn", "-af", "ebur128", "-f", "null", "-"])
    m = re.findall(r"I:\s+(-?\d+(?:\.\d+)?) LUFS", r.stderr.decode(errors="replace"))
    v = float(m[-1]) if m else None
    return v if v is not None and v > -69 else None


def speech_mask(x, sr=SR, hop_s=0.02):
    """人在说话的时间段。看 300–3400Hz 的能量，背景里已经有音乐时也能大致分出来。
    返回 (逐帧布尔数组, 帧长秒)。"""
    import librosa
    hop = int(sr * hop_s)
    S = np.abs(librosa.stft(x, n_fft=1024, hop_length=hop)) ** 2
    f = librosa.fft_frequencies(sr=sr, n_fft=1024)
    e = 10 * np.log10(S[(f > 300) & (f < 3400)].sum(0) + 1e-9)
    lo, hi = np.percentile(e, [8, 95])
    m = e > lo + max(8.0, 0.4 * (hi - lo))
    hang = int(0.25 / hop_s)                       # 字和字之间的小空隙算说话
    idx = np.where(m)[0]
    for a, b in zip(idx[:-1], idx[1:]):
        if 1 < b - a <= hang:
            m[a:b] = True
    out = m.copy()                                  # 去掉短于 0.12 秒的孤立响声
    edges = np.flatnonzero(np.diff(np.r_[0, m.astype(int), 0]))
    for a, b in zip(edges[::2], edges[1::2]):
        if (b - a) * hop_s < 0.12:
            out[a:b] = False
    return out, hop_s


def runs(mask, hop_s, value=True, min_s=0.0):
    """布尔数组里连续为 value 的时间段 [(起, 止)]。"""
    m = (mask == value).astype(int)
    edges = np.flatnonzero(np.diff(np.r_[0, m, 0]))
    return [(round(a * hop_s, 2), round(b * hop_s, 2)) for a, b in zip(edges[::2], edges[1::2]) if (b - a) * hop_s >= min_s]


_MAJ = np.array([6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88])
_MIN = np.array([6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17])
_NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]


def analyze(path, max_s=480):
    """把一首曲子听一遍，给出匹配和对齐要用的全部数字。"""
    import librosa
    y = decode(path)[: SR * max_s]
    dur = len(y) / SR
    if dur < 15:
        return None
    hop = 512
    fps = SR / hop
    mag = np.abs(librosa.stft(y, n_fft=2048, hop_length=hop))
    S = mag ** 2
    f = librosa.fft_frequencies(sr=SR, n_fft=2048)
    db = 10 * np.log10(S.mean(0) + 1e-10)
    n = int(dur)
    sec = np.array([db[int(i * fps): int((i + 1) * fps)].mean() for i in range(n)])
    hi = float(np.percentile(sec, 92))
    energy = np.clip((sec - (hi - 18)) / 18, 0, 1)             # 0..1：相对这首歌自己的响段，18 分贝量程
    live = np.where(db > hi - 30)[0]
    t_in, t_out = float(live[0] / fps), float(min(dur, (live[-1] + 1) / fps))
    loud = np.where(db > hi - 12)[0]
    body_in = float(loud[0] / fps)                              # 真正「起来」的地方，跳过慢慢渐入的前奏

    oenv = librosa.onset.onset_strength(S=librosa.power_to_db(librosa.feature.melspectrogram(S=S, sr=SR)), sr=SR, hop_length=hop)
    tempo, bfr = librosa.beat.beat_track(onset_envelope=oenv, sr=SR, hop_length=hop)
    bpm = float(np.atleast_1d(tempo)[0])
    beats = bfr / fps
    low = np.log(S[f < 130].sum(0) + 1e-9)
    lflux = np.maximum(np.diff(low, prepend=low[0]), 0)
    if len(bfr) >= 8:                                           # 重拍：默认四拍子，取低频最重的那一拍
        ph = int(np.argmax([lflux[np.clip(bfr[p::4], 0, len(lflux) - 1)].mean() for p in range(4)]))
        down = beats[ph::4]
    else:
        down = beats

    sections = []
    if len(bfr) >= 16:
        feat = np.vstack([librosa.feature.mfcc(S=librosa.power_to_db(librosa.feature.melspectrogram(S=S, sr=SR)), n_mfcc=13),
                          librosa.feature.chroma_stft(S=S, sr=SR) * 20])
        sync = librosa.util.sync(feat, bfr, aggregate=np.median)
        k = int(np.clip(round(dur / 22), 3, 12))
        k = min(k, sync.shape[1] - 1)
        bidx = librosa.segment.agglomerative(sync, k)
        edges = np.r_[0, bfr][np.clip(bidx, 0, len(bfr))] / fps
        edges = sorted({float(down[np.argmin(np.abs(down - t))]) if len(down) else float(t) for t in edges[1:]})
        edges = [t_in] + [t for t in edges if t_in + 4 < t < t_out - 4] + [t_out]
        for a, b in zip(edges[:-1], edges[1:]):
            e = float(energy[int(a): max(int(a) + 1, int(b))].mean())
            sections.append({"start": round(a, 2), "end": round(b, 2), "energy": round(e, 2)})
        for i, s in enumerate(sections):                        # 段落角色：按能量和前后关系贴标签
            prev = sections[i - 1]["energy"] if i else 0.0
            if i == 0:
                s["role"] = "intro" if s["energy"] < 0.6 else ("high" if s["energy"] >= 0.75 else "mid")
            elif i == len(sections) - 1 and s["energy"] < prev - 0.08:
                s["role"] = "outro"
            elif s["energy"] >= 0.8 and s["energy"] >= prev + 0.08:
                s["role"] = "lift"                              # 比上一段明显抬起来：适合对高潮和转折
            elif s["energy"] >= 0.75:
                s["role"] = "high"
            elif s["energy"] < 0.45:
                s["role"] = "low"
            else:
                s["role"] = "mid"

    body = sec[int(body_in): max(int(body_in) + 2, int(t_out) - 2)]
    part = mag[:, : int(120 * fps)]
    H, P = librosa.decompose.hpss(part)
    chroma = librosa.feature.chroma_stft(S=S, sr=SR).mean(1)
    best = max(((float(np.corrcoef(np.roll(prof, k), chroma)[0, 1]), k, name) for k in range(12) for prof, name in ((_MAJ, "major"), (_MIN, "minor"))))
    tail = db[int(max(0, t_out - 2.5) * fps): int(t_out * fps)]
    return {
        "duration": round(dur, 2), "in": round(t_in, 2), "body_in": round(body_in, 2), "out": round(t_out, 2),
        "lufs": lufs(path), "bpm": round(bpm, 1), "downbeats": [round(float(t), 3) for t in down],
        "beat": round(float(np.median(np.diff(beats))), 4) if len(beats) > 2 else None,
        "energy": [int(round(v * 100)) for v in energy], "sections": sections,
        "steadiness_db": round(float(np.std(body)), 2),                                    # 小 = 电平平稳，适合垫在人声下
        "speech_band": round(float(S[(f > 700) & (f < 3500)].sum() / (S.sum() + 1e-9)), 3),  # 大 = 和人声抢频段
        "punch": round(float((P ** 2).sum() / ((P ** 2).sum() + (H ** 2).sum() + 1e-9)), 3),  # 大 = 鼓点重
        "brightness": round(float((f[:, None] * mag).sum() / (mag.sum() + 1e-9)), 0),     # 频谱重心，赫兹
        "onset_rate": round(float(len(librosa.onset.onset_detect(onset_envelope=oenv, sr=SR, hop_length=hop)) / dur), 2),  # 每秒几个音头，比速度更能说明「忙不忙」
        "key": _NOTES[best[1]], "mode": best[2],
        "end_natural": bool(t_out < max_s - 1 and len(tail) and (tail[: len(tail) // 2].mean() - tail[len(tail) // 2:].mean()) > 3),
    }
