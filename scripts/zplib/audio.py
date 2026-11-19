"""用声音能量找一段话真正出声和收声的位置。识别结果只有每个字的起点，句尾的拖音要靠这个保住。"""
import subprocess
import numpy as np

SR = 16000; HOP = 160   # 10 毫秒一格


def envelope(path):
    raw = subprocess.run(["ffmpeg", "-nostdin", "-v", "fatal", "-i", path, "-vn", "-ac", "1", "-ar", str(SR), "-f", "s16le", "-"], capture_output=True, check=True).stdout
    a = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768
    n = len(a) // HOP
    rms = np.sqrt((a[: n * HOP].reshape(n, HOP) ** 2).mean(axis=1) + 1e-10)
    db = 20 * np.log10(rms)
    floor = float(np.percentile(db, 10)); peak = float(np.percentile(db, 95))
    return db, max(floor + 9, peak - 32)


def make_edges(path):
    db, th = envelope(path)
    n = len(db)

    def edges(s, e, lo, hi):
        """s、e 是首字起点和末字估计终点；往外找到连续 60 毫秒安静的地方。结果不越过 lo、hi。"""
        i = min(n - 1, max(0, int(s * 100)))
        j = i
        while j > max(0, int(lo * 100)) and i - j < 30 and not (db[max(0, j - 6):j] < th).all(): j -= 1
        k = min(n - 1, int(e * 100)); stop = min(n - 1, int(hi * 100), k + 60)
        while k < stop and not (db[k:k + 6] < th).all(): k += 1
        return max(lo, j / 100 - 0.03), min(hi, k / 100 + 0.05)

    return edges
