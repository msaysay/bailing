#!/usr/bin/env python3
"""口播转写（逐字时间戳）。输出 transcript.json: {duration, words:[{w,s,e}]}。
默认本地 faster-whisper；正式生产建议 large-v3 或换带字级时间戳的云端 ASR（保持同一输出格式即可）。
用法: python3 py/transcribe.py raw.mp4 work/transcript.json [--model small] [--terms terms.json]
"""
import argparse, json, subprocess, sys

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("src"); ap.add_argument("out")
    ap.add_argument("--model", default="small")
    ap.add_argument("--terms", help="专名表 JSON: {hotwords:[...], corrections:{听错:正字}}")
    a = ap.parse_args()
    from faster_whisper import WhisperModel
    terms = json.load(open(a.terms, encoding="utf-8")) if a.terms else {}
    import numpy as np   # 直接让 ffmpeg 解成 16k 单声道 PCM，不依赖 PyAV 版本
    pcm = subprocess.check_output(["ffmpeg", "-v", "error", "-i", a.src, "-vn", "-ac", "1", "-ar", "16000", "-f", "s16le", "-"])
    wav = np.frombuffer(pcm, np.int16).astype(np.float32) / 32768.0
    dur = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", a.src]))
    model = WhisperModel(a.model, device="cpu", compute_type="int8")
    prompt = "以下是普通话的口播，简体中文。" + "、".join(terms.get("hotwords", []))
    segs, _ = model.transcribe(wav, language="zh", word_timestamps=True, vad_filter=True, beam_size=5,
                               initial_prompt=prompt, condition_on_previous_text=False)
    words = []
    for sg in segs:
        for w in sg.words or []:
            t = w.word.strip()
            if t: words.append({"w": t, "s": round(w.start, 3), "e": round(w.end, 3)})
    json.dump({"source": a.src, "duration": dur, "words": words}, open(a.out, "w", encoding="utf-8"), ensure_ascii=False, indent=0)
    print(f"转写完成: {len(words)} 词 / {dur:.1f}s -> {a.out}", file=sys.stderr)

if __name__ == "__main__":
    main()
