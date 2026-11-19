#!/usr/bin/env python3
"""Second camera sync: offset such that camB_time = main_time + offset.

    python3 sync_offset.py raw/main.mp4 raw/camB.mp4   ->  prints offset (seconds)

Uses audio cross-correlation over the first 5 minutes; both files need scratch audio.
"""
import subprocess, sys
import numpy as np
def env(p):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-t", "300", "-i", p, "-vn", "-ac", "1", "-ar", "8000", "-f", "s16le", "-"],
                         stdout=subprocess.PIPE, check=True).stdout
    a = np.abs(np.frombuffer(raw, dtype=np.int16).astype(np.float32))
    a = a[: len(a) // 80 * 80].reshape(-1, 80).mean(1)        # 100 Hz envelope
    return (a - a.mean()) / (a.std() + 1e-9)
a, b = env(sys.argv[1]), env(sys.argv[2])
n = 1 << int(np.ceil(np.log2(len(a) + len(b))))
c = np.fft.irfft(np.fft.rfft(b, n) * np.conj(np.fft.rfft(a, n)), n)
k = int(np.argmax(c)); k = k - n if k > n // 2 else k
print("offset %.2f   (confidence %.1f)" % (k / 100.0, c.max() / (np.abs(c).mean() + 1e-9)))
