#!/usr/bin/env python3
"""口播转写（逐字时间戳）。输出 transcript.json: {duration, engine, words:[{w,s,e}]}。
默认用 SenseVoice（sherpa-onnx，本机 CPU，不上传录音）：它照实转写，结巴、重说的字都会留下——重录检测靠这个。
Whisper 会把重复的字“吞掉”（转写很干净，但废话还在声音里），只作备选：--engine whisper。
用法: python3 py/transcribe.py raw.mp4 work/transcript.json [--engine sensevoice|whisper] [--model large-v3-turbo] [--terms terms.json]
SenseVoice 模型约 230MB，首次自动下载到 ~/.cache/video-studio/；下不动就手动下载解压到那里（地址见 MODEL_URLS）。"""
import argparse, json, os, subprocess, sys, tarfile, urllib.request
import numpy as np

NAME = "sherpa-onnx-sense-voice-zh-en-ja-ko-yue-int8-2024-07-17"
MODEL_URLS = ["https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models/" + NAME + ".tar.bz2",
              "https://hf-mirror.com/csukuangfj/sherpa-onnx-sense-voice-zh-en-ja-ko-yue-2024-07-17/resolve/main/"]   # 第二个是逐文件镜像

def pcm16k(src):
    raw = subprocess.check_output(["ffmpeg", "-v", "error", "-i", src, "-vn", "-ac", "1", "-ar", "16000", "-f", "s16le", "-"])
    return np.frombuffer(raw, np.int16).astype(np.float32) / 32768.0

def sense_model():
    d = os.path.join(os.path.expanduser("~/.cache/video-studio"), NAME)
    if os.path.exists(d + "/model.int8.onnx"): return d
    os.makedirs(d, exist_ok=True)
    try:
        print("首次使用，下载识别模型（约 230MB）…", file=sys.stderr)
        tmp = d + ".tar.bz2"; urllib.request.urlretrieve(MODEL_URLS[0], tmp)
        with tarfile.open(tmp) as t: t.extractall(os.path.dirname(d))
        os.remove(tmp)
    except Exception:
        for f in ("model.int8.onnx", "tokens.txt"): urllib.request.urlretrieve(MODEL_URLS[1] + f, d + "/" + f)
    return d

def run_sensevoice(a, sr=16000):
    import sherpa_onnx
    d = sense_model()
    r = sherpa_onnx.OfflineRecognizer.from_sense_voice(model=d + "/model.int8.onnx", tokens=d + "/tokens.txt", num_threads=4, language="zh", use_itn=False)
    toks, i, CH = [], 0, 25 * sr
    while i < len(a):                      # 约 25 秒一段，在段尾最安静处切，避免切在字中间
        j = min(len(a), i + CH)
        if j < len(a):
            w = a[j - 5 * sr:j]; e = np.convolve(np.abs(w), np.ones(sr // 5) / (sr // 5), "same"); j = j - 5 * sr + int(e.argmin())
        s = r.create_stream(); s.accept_waveform(sr, a[i:j]); r.decode_stream(s)
        toks += [(t, i / sr + ts) for t, ts in zip(s.result.tokens, s.result.timestamps)]
        i = j
    words = []
    for k, (t, s) in enumerate(toks):
        nxt = toks[k + 1][1] if k + 1 < len(toks) else s + .3
        t = t.strip()
        if t: words.append({"w": t, "s": round(s, 3), "e": round(min(nxt, s + .28), 3)})   # 只有起点，字长按 ≤0.28 秒估
    return words

def run_whisper(a, model, prompt):
    from faster_whisper import WhisperModel
    m = WhisperModel(model, device="cpu", compute_type="int8")
    segs, _ = m.transcribe(a, language="zh", word_timestamps=True, vad_filter=True, beam_size=5, initial_prompt=prompt, condition_on_previous_text=False)
    return [{"w": w.word.strip(), "s": round(w.start, 3), "e": round(w.end, 3)} for sg in segs for w in (sg.words or []) if w.word.strip()]

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("src"); ap.add_argument("out")
    ap.add_argument("--engine", default="auto", choices=["auto", "sensevoice", "whisper"])
    ap.add_argument("--model", default="large-v3-turbo"); ap.add_argument("--terms")
    a = ap.parse_args()
    terms = json.load(open(a.terms, encoding="utf-8")) if a.terms else {}
    audio = pcm16k(a.src); dur = len(audio) / 16000; eng = a.engine
    if eng in ("auto", "sensevoice"):
        try: words, eng = run_sensevoice(audio), "sensevoice"
        except Exception as e:
            if eng == "sensevoice": raise
            print(f"SenseVoice 不可用（{e}），改用 Whisper——注意它会吞掉重复的字，重录要多靠人工复核", file=sys.stderr); eng = "whisper"
    if eng == "whisper":
        words = run_whisper(audio, a.model, "以下是普通话的口播，简体中文。" + "、".join(terms.get("hotwords", [])))
    json.dump({"source": a.src, "duration": dur, "engine": eng, "words": words}, open(a.out, "w", encoding="utf-8"), ensure_ascii=False, indent=0)
    print(f"转写完成（{eng}）: {len(words)} 字词 / {dur:.1f}s -> {a.out}", file=sys.stderr)

if __name__ == "__main__":
    main()
