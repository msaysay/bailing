#!/usr/bin/env python3
"""重建样片（episodes/14_约读书房_样片）的输入素材。人物视频和素材片段不随包分发，要从用户给的参考成片里重新裁出来。
用法：python3 scripts/frame_demo_fixture.py <参考成片.mp4>
这条「原片」是倒推的：把参考成片画面窗里的内容裁出来（去掉相框和字幕带）当口播原片，原成片插了素材的时间段记在 meta.json 的 no_person 里。
所以画面上会残留原成片烧进去的贴纸和推近，声音里也带着原成片的配乐，属于测试素材的局限。正常的口播原片没有这些。"""
import sys as _sys
for _s in (_sys.stdout, _sys.stderr): getattr(_s, "reconfigure", lambda **k: None)(encoding="utf-8", errors="replace")   # Windows 终端也能打印中文
import json, os, shutil, subprocess, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); V = sys.argv[1]; E = os.path.join(ROOT, "episodes", "14_约读书房_样片"); P = os.path.join(ROOT, "studio", "public", "yuedu-demo"); W = os.path.join(E, "03_制作过程")
src = os.path.join(E, "01_输入素材", "客户素材"); os.makedirs(src, exist_ok=True); os.makedirs(os.path.join(P, "clips"), exist_ok=True); raw = os.path.join(E, "01_输入素材", "口播原片.mp4")
ff = lambda *a: subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", *a], check=True)
ff("-i", V, "-vf", "crop=940:705:140:555,scale=1440:1080:flags=lanczos", "-r", "30", "-c:v", "libx264", "-crf", "17", "-preset", "fast", "-c:a", "aac", "-b:a", "192k", raw); shutil.copy(raw, os.path.join(P, "person.mp4"))
SEG = [(11.6, 17.3), (19.97, 25.6), (28.63, 30.6), (50.5, 66.77), (70.03, 73.67), (84.73, 87.07), (100.6, 110.77), (115.17, 118.67), (128.37, 133.47), (146.77, 162.13), (167.73, 172.33), (192.53, 198.37), (200.53, 201.6), (217.0, 220.5), (233.6, 239.63), (250.6, 254.17)]
for i, (s, e) in enumerate(SEG): ff("-ss", str(s), "-i", raw, "-t", f"{e - s:.2f}", "-an", "-c:v", "libx264", "-crf", "17", "-preset", "fast", os.path.join(src, f"b{i + 1:02d}.mp4"))
lib = os.path.join(P, "clips", "library.json"); keep = {x["id"]: x for x in json.load(open(lib, encoding="utf-8"))}
subprocess.run([sys.executable, os.path.join(ROOT, "scripts", "library_index.py"), src, os.path.join(P, "clips"), "--min", "1.2"], check=True, stdout=subprocess.DEVNULL)
for x in json.load(open(lib, encoding="utf-8")):                # 烧了字幕、贴纸的镜头不用
    f = os.path.join(P, "clips", x["id"] + ".mp4")
    if x["id"] not in keep and os.path.exists(f): os.remove(f)
json.dump(list(keep.values()), open(lib, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
ff("-ss", "196", "-i", V, "-vf", "crop=1080:813:0:555", "-frames:v", "1", "-q:v", "2", os.path.join(P, "clips", "backend.jpg"))
subprocess.run([sys.executable, os.path.join(ROOT, "scripts", "align.py"), "--script", f"{W}/script.txt", "--asr", f"{W}/asr.json", "--audio", os.path.join(P, "person.mp4"), "--out-timing", f"{W}/timing.json", "--out-audio", os.path.join(P, "voice.wav"), "--max", "12", "--fps", "30"], check=True, stdout=subprocess.DEVNULL)
m = json.load(open(f"{W}/meta.json", encoding="utf-8")); m["voice"] = "yuedu-demo/voice.wav"; m.pop("voice_dry", None); m.pop("audio", None); json.dump(m, open(f"{W}/meta.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(f"样片素材就绪。出关键帧：python3 scripts/frame_render.py \"{E}\" keys")
