#!/usr/bin/env python3
"""AI 配音（本机离线，不上传文字）：把逐字稿念成一条录音。没有自己录音时用。
用法：scripts/tts.py <script.txt> <输出.wav> [--voice 65] [--speed 1.12]
模型：Kokoro v1.1 中文（Apache-2.0），scripts/doctor.py --fix 会自动下载到 ~/.cache/video-studio/tts/。
声音编号：56 以后是男声，以前是女声。65 是低沉清楚的男声（识别准确率最高），45、52 是女声。
按「## 段名」分段生成，段与段之间留 0.5 秒停顿；成片里要标注「配音为 AI 合成」。"""
import argparse, os, re, sys
import numpy as np, sherpa_onnx, soundfile as sf
ap = argparse.ArgumentParser(); ap.add_argument("script"); ap.add_argument("out"); ap.add_argument("--voice", type=int, default=65); ap.add_argument("--speed", type=float, default=1.12); a = ap.parse_args()
d = os.path.expanduser("~/.cache/video-studio/tts/kokoro-multi-lang-v1_1")
if not os.path.exists(d + "/model.onnx"): sys.exit("缺少配音模型，先运行：python3 scripts/doctor.py --fix")
k = sherpa_onnx.OfflineTtsKokoroModelConfig(model=d + "/model.onnx", voices=d + "/voices.bin", tokens=d + "/tokens.txt", data_dir=d + "/espeak-ng-data", dict_dir=d + "/dict", lexicon=f"{d}/lexicon-us-en.txt,{d}/lexicon-zh.txt")
tts = sherpa_onnx.OfflineTts(sherpa_onnx.OfflineTtsConfig(model=sherpa_onnx.OfflineTtsModelConfig(kokoro=k, num_threads=os.cpu_count() or 4), rule_fsts=f"{d}/date-zh.fst,{d}/phone-zh.fst,{d}/number-zh.fst", max_num_sentences=1))
segs, cur = [], []
for ln in open(a.script, encoding="utf-8"):
    ln = ln.strip()
    if ln.startswith("##"):
        if cur: segs.append("".join(cur)); cur = []
    elif ln and not ln.startswith("#"): cur.append(ln)
if cur: segs.append("".join(cur))
out, sr = [], 24000
for i, s in enumerate(segs):
    g = tts.generate(s, sid=a.voice, speed=a.speed); sr = g.sample_rate; out.append(np.array(g.samples, dtype=np.float32)); out.append(np.zeros(int(sr * .5), dtype=np.float32))
    print(f"段 {i + 1}/{len(segs)}  {len(g.samples) / sr:.1f} 秒")
w = np.concatenate([np.zeros(int(sr * .3), dtype=np.float32)] + out); sf.write(a.out, w, sr); print(f"写入 {a.out}，共 {len(w) / sr:.1f} 秒")
