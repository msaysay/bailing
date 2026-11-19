#!/usr/bin/env python3
"""语音识别，输出逐字时间。本机 CPU 运行，不上传录音。
用法：scripts/asr.py <录音文件> <输出 asr.json>
依赖：pip install sherpa-onnx soundfile numpy；ffmpeg。
模型：SenseVoice（sherpa-onnx-sense-voice-zh-en-ja-ko-yue-int8-2024-07-17），解压到 ~/.cache/video-studio/ 下。
下载：https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models/sherpa-onnx-sense-voice-zh-en-ja-ko-yue-int8-2024-07-17.tar.bz2
输出：{"dur": 秒, "tokens": [{"t": 字, "s": 起点秒}]}，供 scripts/align.py 使用。
识别结果只用来取时间，字幕文字以逐字稿为准。"""
import json, os, subprocess, sys, tempfile
import numpy as np, sherpa_onnx, soundfile as sf
src, out = sys.argv[1], sys.argv[2]
d = os.path.expanduser("~/.cache/video-studio/sherpa-onnx-sense-voice-zh-en-ja-ko-yue-int8-2024-07-17")
if not os.path.exists(d + "/model.int8.onnx"): sys.exit("缺少识别模型，下载地址见本脚本开头：" + d)
wav = tempfile.mktemp(suffix=".wav")
subprocess.run(["ffmpeg", "-nostdin", "-v", "fatal", "-y", "-err_detect", "ignore_err", "-i", src, "-ac", "1", "-ar", "16000", wav])
r = sherpa_onnx.OfflineRecognizer.from_sense_voice(model=d + "/model.int8.onnx", tokens=d + "/tokens.txt", num_threads=4, language="zh", use_itn=False)
a, sr = sf.read(wav, dtype="float32"); toks, i, CH = [], 0, 25 * sr
while i < len(a):                                     # 约 25 秒一段，在段尾最安静处切，避免切在字中间
    j = min(len(a), i + CH)
    if j < len(a):
        w = a[j - 5 * sr:j]; e = np.convolve(np.abs(w), np.ones(sr // 5) / (sr // 5), "same"); j = j - 5 * sr + int(e.argmin())
    s = r.create_stream(); s.accept_waveform(sr, a[i:j]); r.decode_stream(s)
    for t, ts in zip(s.result.tokens, s.result.timestamps): toks.append({"t": t, "s": round(i / sr + ts, 3)})
    i = j
json.dump({"dur": len(a) / sr, "tokens": toks}, open(out, "w"), ensure_ascii=False)
print("".join(x["t"] for x in toks)); os.remove(wav)
