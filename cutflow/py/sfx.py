#!/usr/bin/env python3
"""音效轨：按 timeline 里的事件程序合成（不用任何音效素材，没有版权问题），输出 48k 立体声 wav。
事件 → 声音：换版式=轻“唰”；关键词/红字标注=短“嗒”+低频；清单每条=轻“滴”；章节=“唰”+“叮”；数据面板=上扬音；结尾金句=重“砰”。
用法: python3 py/sfx.py timeline.json out.wav [总音量倍数]"""
import json, sys, wave
import numpy as np
SR = 48000
tl = json.load(open(sys.argv[1], encoding="utf-8")); out = sys.argv[2]; gain = float(sys.argv[3]) if len(sys.argv) > 3 else 1.0
N = int((tl["meta"]["duration"] + 1) * SR); buf = np.zeros(N, np.float32); rng = np.random.default_rng(7)
tt = lambda d: np.arange(int(d * SR)) / SR
def bandnoise(d, f0, f1):            # 扫频带通噪声：频域里挪中心频率，够用且不依赖 scipy
    n = int(d * SR); x = rng.standard_normal(n).astype(np.float32); seg = 1024; y = np.zeros(n, np.float32); win = np.hanning(seg)
    for i in range(0, n - seg, seg // 2):
        fc = f0 + (f1 - f0) * i / n; X = np.fft.rfft(x[i:i + seg] * win); fr = np.fft.rfftfreq(seg, 1 / SR)
        X *= np.exp(-((fr - fc) / (fc * .45)) ** 2); y[i:i + seg] += np.fft.irfft(X).astype(np.float32)
    return y / (np.abs(y).max() + 1e-6)
def whoosh(d=.32): t = tt(d); return bandnoise(d, 500, 4200) * np.sin(np.pi * t / d) ** 2 * .16
def tick(): t = tt(.07); return np.sin(2 * np.pi * 1900 * t) * np.exp(-t * 70) * .10
def pop():  t = tt(.16); return (np.sin(2 * np.pi * (140 + 260 * np.exp(-t * 40)) * t) * np.exp(-t * 26) * .30 + bandnoise(.16, 3000, 1500) * np.exp(-t * 60) * .08)
def ding(): t = tt(.5);  return (np.sin(2 * np.pi * 1320 * t) + .5 * np.sin(2 * np.pi * 2640 * t)) * np.exp(-t * 9) * .07
def rise(): t = tt(.7);  return np.sin(2 * np.pi * (300 * t + 500 * t * t)) * np.sin(np.pi * t / .7) ** 2 * .06
def boom(): t = tt(.9);  return np.sin(2 * np.pi * (48 + 60 * np.exp(-t * 18)) * t) * np.exp(-t * 5) * .5 + bandnoise(.9, 2500, 300) * np.exp(-t * 9) * .18
def put(at, s):
    i = int(max(0, at) * SR); s = s[:max(0, N - i)]; buf[i:i + len(s)] += s.astype(np.float32)
sc = tl["scenes"]
for i, s in enumerate(sc[1:], 1):
    if s["layout"] != sc[i - 1]["layout"]: put(s["start"] - .08, whoosh())
    if s["layout"] == "data": put(s["start"] + .25, rise())
for o in tl.get("overlays", []):
    k = o["type"]
    if k in ("keyword", "label"): put(o["start"], pop())
    elif k == "list": [put(it["at"], tick()) for it in o["items"]]
    elif k == "chapter": put(o["start"], whoosh(.4)); put(o["start"] + .2, ding())
    elif k == "image": put(o["start"], whoosh(.26))
    elif k == "punch": put(o["start"], boom())
buf = np.clip(buf * gain, -1, 1); pcm = (buf * 32767).astype(np.int16); st = np.stack([pcm, pcm], 1)
w = wave.open(out, "wb"); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(st.tobytes()); w.close()
