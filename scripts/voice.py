#!/usr/bin/env python3
"""一步做完「声音」：（可选）AI 配音 → 语音识别 → 和稿子对齐 → 字幕时间表 timing.json 和处理好的 voice.wav。
用法：scripts/voice.py <期名> --audio <录音文件>        用自己的录音
      scripts/voice.py <期名> --tts [--voice 65]        没有录音，用 AI 配音
读 episodes/<期名>/03_制作过程/script.txt；输出到 studio/src/episodes/<代号>/timing.json 和 studio/public/<代号>/voice.wav（代号见进度表）。
横屏字幕一行最多 20 字，竖屏 14 字（按这一期是哪条线自动选）。"""
import argparse, json, os, subprocess, sys
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ap = argparse.ArgumentParser(); ap.add_argument("ep"); g = ap.add_mutually_exclusive_group(required=True); g.add_argument("--audio"); g.add_argument("--tts", action="store_true")
ap.add_argument("--voice", type=int, default=65); ap.add_argument("--fps", type=int, default=30); a = ap.parse_args()
E_ = os.path.join(R, "episodes", a.ep); st = json.load(open(os.path.join(E_, "进度.json"), encoding="utf-8")); slug = st["slug"]
work = os.path.join(E_, "03_制作过程"); script = os.path.join(work, "script.txt")
if not os.path.exists(script): sys.exit("还没有稿子：" + script)
src = os.path.join(E_, "01_输入素材", "AI配音.wav") if a.tts else a.audio
run = lambda *c: subprocess.run([sys.executable, *c], check=True)
if a.tts: run(os.path.join(R, "scripts", "tts.py"), script, src, "--voice", str(a.voice))
run(os.path.join(R, "scripts", "asr.py"), src, os.path.join(work, "asr.json"))
run(os.path.join(R, "scripts", "align.py"), "--script", script, "--asr", os.path.join(work, "asr.json"), "--audio", src,
    "--out-timing", os.path.join(R, "studio", "src", "episodes", slug, "timing.json"), "--out-audio", os.path.join(R, "studio", "public", slug, "voice.wav"),
    "--max", "14" if st["line"] == "talk" else "20", "--fps", str(a.fps))
st["voice"] = "AI 配音（Kokoro，声音 %d）" % a.voice if a.tts else "录音"; json.dump(st, open(os.path.join(E_, "进度.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("好了：字幕时间表和配音都已就位。")
