#!/usr/bin/env python3
"""通用的三个可选处理：人声降噪、自动调光、配乐。哪种风格都能用，对一条视频文件做，不改时长。
用法：scripts/polish.py <视频> [-o 输出.mp4 | --inplace] [--denoise auto|light|strong] [--grade] [--beauty 0~1] [--strength 0~1]
                              [--music auto|<音乐文件>] [--mood light|calm|drive|warm] [--no-credit] [--music-dir 目录] [--music-db -27] [--preview 对比图.jpg]
  --denoise  人声降噪加修音（切低频 → 降噪 → 轻压缩 → 去齿音 → -16 LUFS）。auto 按底噪自动选档，够安静就只修音不降噪。
  --grade    自动调光：以脸部亮度为准提亮、修色偏，叠一层轻影调。--beauty 0.3 是轻磨皮（不瘦脸）。--preview 出左原片右调后的对比图，先看图。
  --music    配乐：给文件就用它；auto 时从默认配乐库 music/<情绪>/ 里固定挑一首（同一条片子重跑不会换歌）。
             --mood 选情绪：light 轻快明亮 / calm 安静舒缓 / drive 有推进感 / warm 温暖。库里一部分曲子是 CC BY 4.0，可商用但发布时要署名，
             用到时会打印署名文字；--no-credit 只用代码合成的那几首，不用署名。--music-dir 换成自己的目录。库是空的就现场合成一条。
             人说话时配乐自动压低，开头淡入，结尾淡出。看库里有什么：python3 scripts/music_lib.py list
  --inplace  处理完替换原文件，原文件留一份 <名字>.orig<扩展名>。不给 -o 也不给 --inplace 时写到 <名字>.polish.mp4。
用在哪一步：
  降噪、调光 → 用在「剪好的人物视频」上（排版渲染之前）。成片里已经混了音效和配乐，再降噪会把它们弄坏。
  配乐       → 用在「成片」上（渲染之后），这样换配乐不用重渲画面。
三样都不选时什么也不做。做法和相框口播线的 frame_audio.py 是同一套（scripts/soundlib.py）；调光的算法在 scripts/grade.py。"""
import sys as _sys
for _s in (_sys.stdout, _sys.stderr): getattr(_s, "reconfigure", lambda **k: None)(encoding="utf-8", errors="replace")   # Windows 终端也能打印中文
import argparse, hashlib, json, os, shutil, subprocess, sys, tempfile
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
ap = argparse.ArgumentParser(); ap.add_argument("video"); ap.add_argument("-o", "--out"); ap.add_argument("--inplace", action="store_true")
ap.add_argument("--denoise", default="off", choices=["off", "auto", "light", "strong"])
ap.add_argument("--grade", action="store_true"); ap.add_argument("--beauty", type=float, default=0.0); ap.add_argument("--strength", type=float, default=1.0); ap.add_argument("--preview")
ap.add_argument("--music", default="off"); ap.add_argument("--music-dir"); ap.add_argument("--mood", default="light", choices=["light", "calm", "drive", "warm", "bright"]); ap.add_argument("--no-credit", action="store_true"); ap.add_argument("--music-db", type=float, default=-27.0)
ap.add_argument("--crf", type=int, default=16); a = ap.parse_args()
if not os.path.exists(a.video): sys.exit("找不到视频：" + a.video)
grade = a.grade or a.beauty > 0
if a.denoise == "off" and not grade and a.music == "off": print("没有选任何处理（--denoise / --grade / --music），什么也没做。"); sys.exit(0)
base, ext = os.path.splitext(a.video); out = a.out or base + ".polish.mp4"; tmp = tempfile.mkdtemp(); report = {}
has_audio = bool(subprocess.run(["ffprobe", "-v", "error", "-select_streams", "a", "-show_entries", "stream=index", "-of", "csv=p=0", a.video], capture_output=True, text=True).stdout.strip())
has_video = bool(subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v", "-show_entries", "stream=index", "-of", "csv=p=0", a.video], capture_output=True, text=True).stdout.strip())

# ---- 调光：只算滤镜串，下面和声音一起一次写出 ----
vf = ""
if grade:
    if not has_video: sys.exit("这个文件没有画面，不能调光")
    gj = os.path.join(tmp, "grade.json"); cmd = [sys.executable, os.path.join(HERE, "grade.py"), a.video, gj, "--beauty", str(a.beauty), "--strength", str(a.strength)]
    if a.preview: cmd += ["--preview", a.preview]
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0: sys.exit("调光没算出来：" + r.stderr[-400:])
    vf = r.stdout.strip().splitlines()[-1]; g = json.load(open(gj, encoding="utf-8")); report["调光"] = g["note"] + ("" if g.get("face") else "（没找到人脸，按全画面算的）")
    if a.preview: report["调光对比图"] = a.preview

# ---- 声音 ----
audio = None
if a.denoise != "off" or a.music != "off":
    if not has_audio: sys.exit("这个文件没有声音，不能降噪或配乐")
    import soundfile as sf
    from soundlib import SR, clean_voice, duration, ff, floor_db, lufs, make_bed, mix_music, music_files, normalize, pick_level
    total = duration(a.video); dry = os.path.join(tmp, "dry.wav"); ff("-i", a.video, "-vn", "-ar", str(SR), "-ac", "2", dry); cur = dry
    if a.denoise != "off":
        x, sr = sf.read(dry, dtype="float32"); x = x.mean(axis=1) if x.ndim > 1 else x; nf = floor_db(x, sr); level = pick_level(a.denoise, nf)
        cur = os.path.join(tmp, "voice.wav"); y = clean_voice(dry, cur, level, nf, len(x) / sr)
        report["降噪"] = f"底噪 {nf:.0f} dB → 档位 {level} → 处理后 {floor_db(y, SR):.0f} dB"
    if a.music != "off":
        seed = int(hashlib.md5(os.path.basename(base).encode()).hexdigest(), 16); src = None
        if a.music != "auto":
            if not os.path.exists(a.music): sys.exit("找不到音乐文件：" + a.music)
            src = a.music; label = "指定的 " + os.path.basename(src)
        else:
            from soundlib import pick_music
            files = music_files(a.music_dir) if a.music_dir else []
            if files: src = files[seed % len(files)]; label = "你的音乐目录里的 " + os.path.basename(src)
            else:
                src, credit = pick_music(a.mood, seed, a.no_credit)
                if src: label = "配乐库的 " + os.path.relpath(src, os.path.dirname(HERE)); report["署名"] = ("发布时把这一行放进简介或片尾：" + credit) if credit else "这首是代码合成的，不用署名"
                else: label = f"现场合成的配乐（{a.mood}）。配乐库是空的，建库：python3 scripts/music_lib.py build"
        bed = os.path.join(tmp, "bed.wav"); make_bed(bed, total, src, {"light": "bright", "drive": "bright"}.get(a.mood, a.mood), seed % 2 ** 31)
        mixed = os.path.join(tmp, "mix.wav"); mix_music(cur, bed, mixed, total, a.music_db); cur = mixed; report["配乐"] = f"{label}，{a.music_db:.0f} dB"
    audio = os.path.join(tmp, "final.wav"); normalize(cur, audio); report["响度"] = f"{lufs(audio):.1f} LUFS"

# ---- 一次写出：画面不调光就原样复制，不重新压 ----
cmd = ["ffmpeg", "-nostdin", "-v", "error", "-y", "-i", a.video] + (["-i", audio] if audio else [])
if not has_video: cmd += ["-map", "1:a"]
else:
    cmd += ["-map", "0:v:0"] + (["-map", "1:a:0"] if audio else (["-map", "0:a?"]))
    cmd += (["-vf", vf, "-c:v", "libx264", "-crf", str(a.crf), "-preset", "medium", "-pix_fmt", "yuv420p"] if vf else ["-c:v", "copy"])
if has_video: cmd += (["-c:a", "aac", "-b:a", "192k", "-ar", "48000"] if audio else ["-c:a", "copy"]) + ["-movflags", "+faststart"]
if not has_video and not out.lower().endswith((".wav", ".mp3", ".m4a")): out = base + ".polish.wav"
tmp_out = os.path.join(tmp, "out" + os.path.splitext(out)[1]); subprocess.run(cmd + [tmp_out], check=True)
d0 = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", a.video], capture_output=True, text=True).stdout or 0)
d1 = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", tmp_out], capture_output=True, text=True).stdout or 0)
if abs(d0 - d1) > 0.08: sys.exit(f"处理后时长变了（{d0:.2f} → {d1:.2f} 秒），音画会错位，没有写出")
if a.inplace:
    keep = base + ".orig" + ext
    if not os.path.exists(keep): shutil.copy2(a.video, keep)      # 第一次处理前的原件只留一份，重复处理都从它来的话请自己用它
    shutil.move(tmp_out, a.video); out = a.video; report["原文件备份"] = keep
else: os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True); shutil.move(tmp_out, out)
shutil.rmtree(tmp, ignore_errors=True)
for k, v in report.items(): print(f"{k}：{v}")
print(f"→ {out}（{d1:.2f} 秒，和原来一样长）")
print("机器听不出来的：降噪后人声有没有发闷或带水声、配乐会不会太响。请人听一遍。")
