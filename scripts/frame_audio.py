#!/usr/bin/env python3
"""相框口播线的声音：人声降噪和修音，自动配乐，混成一条成片用的音轨。
用法：python3 scripts/frame_audio.py <期目录> [--denoise auto|off|light|strong] [--music auto|off|<音乐文件>] [--mood warm|bright|calm] [--music-db -27]
读：studio/public/<期短名>/voice.wav（对齐那一步出的，时长和人物视频一致）、meta.json、timing.json
写：studio/public/<期短名>/mix.wav，并把 meta.json 的 voice 指向它（原来的干声记在 voice_dry）
人声：切低频 → 降噪 → 轻压缩 → 去齿音 → 响度归一到 -16 LUFS。时长一帧不变，字幕时间不受影响。
  auto：先在说话的间隙里量底噪，低于 -62 dB 不降噪，-62 到 -48 用 light，更吵用 strong。
配乐：brands/<品牌>/music/ 里有文件就用（多首时按期短名固定选一首，循环或裁到片长）；没有就用代码合成一条（没有版权问题）。
  人声在的时候配乐自动压低，开头 1 秒淡入，结尾 2.5 秒淡出。--music-db 是配乐相对满刻度的响度，默认 -27（人声是 -16）。"""
import sys as _sys
for _s in (_sys.stdout, _sys.stderr): getattr(_s, "reconfigure", lambda **k: None)(encoding="utf-8", errors="replace")   # Windows 终端也能打印中文
import argparse, hashlib, json, os, subprocess, sys, tempfile
import numpy as np, soundfile as sf
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from soundlib import SR, clean_voice, ff, floor_db, lufs, make_bed, mix_music, music_files, normalize, pick_level

ap = argparse.ArgumentParser(); ap.add_argument("ep"); ap.add_argument("--denoise", default="auto"); ap.add_argument("--music", default="auto"); ap.add_argument("--mood", default="warm", choices=["warm", "bright", "calm"])
ap.add_argument("--music-db", type=float, default=-27.0); ap.add_argument("--brand", default=None); a = ap.parse_args()
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); W = os.path.join(a.ep, "03_制作过程"); brand = a.brand or os.path.join(ROOT, "brands", "yuedu")
meta = json.load(open(f"{W}/meta.json", encoding="utf-8")); tm = json.load(open(f"{W}/timing.json", encoding="utf-8"))
pub = os.path.join(ROOT, "studio", "public"); dry_rel = meta.get("voice_dry") or meta["voice"]; dry = os.path.join(pub, dry_rel); out = os.path.join(pub, meta["slug"], "mix.wav")
if not os.path.exists(dry): sys.exit("没有干声：" + dry + "（先做完对齐那一步）")
tmp = tempfile.mkdtemp()

# ---- 量底噪：取字和字之间超过 0.35 秒的间隙 ----
x, sr = sf.read(dry, dtype="float32"); x = x.mean(axis=1) if x.ndim > 1 else x; total = len(x) / sr
ts = sorted(c["t"] for l in tm["lines"] for c in l["chars"])
gaps = [(p + 0.3, q - 0.08) for p, q in zip(ts, ts[1:]) if q - p > 0.8]
nf = floor_db(x, sr, gaps); level = pick_level(a.denoise, nf)

# ---- 人声处理（所有滤镜都不改时长，做法在 soundlib.py）----
voice = os.path.join(tmp, "voice.wav"); y = clean_voice(dry, voice, level, nf, total)
nf2 = floor_db(y, SR, gaps)

# ---- 配乐 ----
src = None; label = "不加配乐"; pre = os.path.join(tmp, "premix.wav")
if a.music != "off":
    if a.music != "auto":
        if not os.path.exists(a.music): sys.exit("找不到音乐文件：" + a.music)
        src = a.music; label = "指定的 " + os.path.basename(src)
    else:
        files = music_files(os.path.join(brand, "music"))
        if files: src = files[int(hashlib.md5(meta["slug"].encode()).hexdigest(), 16) % len(files)]; label = "品牌音乐库的 " + os.path.basename(src)
        else:      # 品牌音乐库是空的：用默认配乐库里不用署名的合成曲（要用需署名的曲子，用 --music 指定文件）
            from soundlib import pick_music
            src, _ = pick_music(a.mood, int(hashlib.md5(meta["slug"].encode()).hexdigest(), 16), no_credit=True)
            if src: label = "默认配乐库的 " + os.path.basename(src)
    bed = os.path.join(tmp, "bed.wav"); make_bed(bed, total, src, a.mood, int(hashlib.md5(meta["slug"].encode()).hexdigest(), 16) % 2 ** 31)
    if not src: label = f"代码合成的配乐（{a.mood}）"
    mix_music(voice, bed, pre, total, a.music_db)
else: ff("-i", voice, "-ac", "2", "-ar", str(SR), pre)
normalize(pre, out)      # 整体拉回 -16 LUFS（只调音量，不改时长）

meta["voice_dry"] = dry_rel; meta["voice"] = f"{meta['slug']}/mix.wav"; meta["audio"] = {"denoise": level, "noise_floor_before": round(nf, 1), "noise_floor_after": round(nf2, 1), "music": label, "music_db": a.music_db if a.music != "off" else None}
json.dump(meta, open(f"{W}/meta.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
od = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", out], capture_output=True, text=True).stdout)
print(f"底噪 {nf:.0f} dB → 降噪档位 {level} → 处理后 {nf2:.0f} dB")
print(f"配乐：{label}；混音后整体响度 {lufs(out):.1f} LUFS，时长 {od:.2f} 秒（人声 {total:.2f} 秒）")
if abs(od - total) > 0.05: sys.exit("混音后时长变了，音画会错位，不能用")
print(f"→ {out}；meta.json 的 voice 已指向它。重新跑 frame_plan.py 后渲染。")
