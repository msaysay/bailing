#!/usr/bin/env python3
"""A-roll -> transcript with per-character timestamps.

    python3 transcribe.py raw/a.mp4 [raw/b.mp4 ...] -o work/transcript.json [--model medium] [--prompt "专有名词…"]

Put brand / product / place names in --prompt: it sharply reduces homophone errors.
"""
import argparse, json, os, subprocess, sys
import numpy as np

ap = argparse.ArgumentParser()
ap.add_argument("videos", nargs="+")
ap.add_argument("-o", "--out", default="work/transcript.json")
ap.add_argument("--model", default="large-v3-turbo")
ap.add_argument("--prompt", default="")
a = ap.parse_args()

# Asking for a verbatim record makes Whisper keep (some) stutters and fillers instead of silently tidying
# them away, and leaves the rest as un-transcribed gaps that cues_from_script.py can find acoustically.
VERBATIM = "以下是普通话口语的逐字记录，保留口吃、重复和语气词：嗯，呃，我、我们这个，这个这个渠道，就是，就是说。"
from faster_whisper import WhisperModel
m = WhisperModel(a.model, device="cpu", compute_type="int8", cpu_threads=os.cpu_count() or 4)
res = []
for v in a.videos:
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", v, "-vn", "-ac", "1", "-ar", "16000", "-f", "s16le", "-"],
                         stdout=subprocess.PIPE, check=True).stdout
    audio = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768
    segs, _ = m.transcribe(audio, language="zh", word_timestamps=True, vad_filter=True,
                           vad_parameters={"min_silence_duration_ms": 400}, condition_on_previous_text=False,
                           initial_prompt=VERBATIM + a.prompt)
    for s in segs:
        res.append({"src": v, "start": round(s.start, 2), "end": round(s.end, 2), "text": s.text.strip(),
                    "words": [{"s": round(w.start, 2), "e": round(w.end, 2), "w": w.word.strip()} for w in s.words]})
        print("%s %7.2f-%7.2f %s" % (os.path.basename(v), s.start, s.end, s.text.strip()), flush=True)
os.makedirs(os.path.dirname(os.path.abspath(a.out)), exist_ok=True)
json.dump(res, open(a.out, "w", encoding="utf8"), ensure_ascii=False, indent=1)
print("wrote", a.out)
