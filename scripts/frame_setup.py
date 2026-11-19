#!/usr/bin/env python3
"""相框口播线的环境准备：检查工具、装依赖、下载识别模型、人脸模型和字体。重复运行是安全的，已有的不会重下。
用法：python3 scripts/frame_setup.py [--check]      --check 只检查不安装
需要先自己装好：Python 3.10+、Node.js 20+、ffmpeg（要在 PATH 里，ffprobe 同理）。
下载量约 500 MB（识别模型 160 MB、思源宋体 140 MB、MiSans 230 MB、得意黑 6 MB），装完占约 600 MB。"""
import sys as _sys
for _s in (_sys.stdout, _sys.stderr): getattr(_s, "reconfigure", lambda **k: None)(encoding="utf-8", errors="replace")   # Windows 终端也能打印中文
import importlib, os, shutil, subprocess, sys, tarfile, urllib.request, zipfile
CHECK = "--check" in sys.argv; ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); ST = os.path.join(ROOT, "studio")
CACHE = os.path.expanduser("~/.cache/video-studio"); FONTS = os.path.join(ST, "public", "fonts"); os.makedirs(CACHE, exist_ok=True); os.makedirs(FONTS, exist_ok=True)
ok = True
def say(good, msg):
    global ok; ok = ok and good; print(("  有  " if good else "  缺  ") + msg)
def get(urls, dst):
    for u in urls:
        try:
            print("  下载 " + u); req = urllib.request.Request(u, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=600) as r, open(dst + ".part", "wb") as f: shutil.copyfileobj(r, f)
            os.replace(dst + ".part", dst); return True
        except Exception as e: print("    失败：" + str(e)[:120])
    return False

print("一、工具")
for t, why in (("ffmpeg", "剪辑、音频、抽帧"), ("ffprobe", "读视频信息"), ("node", "渲染"), ("npx", "渲染")): say(bool(shutil.which(t)), f"{t}（{why}）")
if sys.version_info < (3, 10): say(False, "Python 3.10 以上")
if not ok: sys.exit("先把上面缺的工具装好（ffmpeg：macOS 用 brew install ffmpeg，Windows 用 winget install Gyan.FFmpeg，Linux 用 apt install ffmpeg；Node.js：nodejs.org）")

print("二、Python 依赖")
PK = {"sherpa_onnx": "sherpa-onnx", "soundfile": "soundfile", "numpy": "numpy", "cv2": "opencv-python-headless"}
miss = [pip for mod, pip in PK.items() if importlib.util.find_spec(mod) is None]
if miss and not CHECK: subprocess.run([sys.executable, "-m", "pip", "install", "-q", *miss]); importlib.invalidate_caches(); miss = [pip for mod, pip in PK.items() if importlib.util.find_spec(mod) is None]
say(not miss, "sherpa-onnx、soundfile、numpy、opencv" + ("（缺：" + "、".join(miss) + "；手动执行 pip install " + " ".join(miss) + "）" if miss else ""))

print("三、渲染依赖（studio/node_modules）")
if not os.path.exists(os.path.join(ST, "node_modules", "remotion")) and not CHECK: subprocess.run([shutil.which("npm"), "install", "--no-audit", "--no-fund"], cwd=ST)
say(os.path.exists(os.path.join(ST, "node_modules", "remotion")), "remotion")

print("四、模型（~/.cache/video-studio/）")
SV = "sherpa-onnx-sense-voice-zh-en-ja-ko-yue-int8-2024-07-17"
if not os.path.exists(os.path.join(CACHE, SV, "model.int8.onnx")) and not CHECK:
    t = os.path.join(CACHE, "sv.tar.bz2")
    if get([f"https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models/{SV}.tar.bz2"], t):
        try: tarfile.open(t).extractall(CACHE)
        except Exception: pass
        os.remove(t)
say(os.path.exists(os.path.join(CACHE, SV, "model.int8.onnx")), "语音识别模型 SenseVoice")
if not os.path.exists(os.path.join(CACHE, "yunet.onnx")) and not CHECK:
    get(["https://media.githubusercontent.com/media/opencv/opencv_zoo/main/models/face_detection_yunet/face_detection_yunet_2023mar.onnx", "https://github.com/opencv/opencv_zoo/raw/main/models/face_detection_yunet/face_detection_yunet_2023mar.onnx"], os.path.join(CACHE, "yunet.onnx"))
say(os.path.exists(os.path.join(CACHE, "yunet.onnx")) and os.path.getsize(os.path.join(CACHE, "yunet.onnx")) > 100000, "人脸检测模型 YuNet")

print("五、字体（studio/public/fonts/）")
def font_zip(names, urls, member):
    if all(os.path.exists(os.path.join(FONTS, n)) for n in names) or CHECK: return
    z = os.path.join(CACHE, "font.zip")
    if not get(urls, z): return
    with zipfile.ZipFile(z) as f:
        for n in names:
            src = member(n)
            if src in f.namelist(): open(os.path.join(FONTS, n), "wb").write(f.read(src))
    os.remove(z)
S = ["SourceHanSerifSC-Medium.otf", "SourceHanSerifSC-Bold.otf", "SourceHanSerifSC-Heavy.otf"]; M = ["MiSans-Regular.otf", "MiSans-Semibold.otf", "MiSans-Heavy.otf"]
font_zip(S, ["https://github.com/adobe-fonts/source-han-serif/releases/download/2.003R/09_SourceHanSerifSC.zip"], lambda n: "OTF/SimplifiedChinese/" + n)
font_zip(["SmileySans-Oblique.otf"], ["https://github.com/atelier-anchor/smiley-sans/releases/download/v2.0.1/smiley-sans-v2.0.1.zip"], lambda n: n)
font_zip(M, ["https://hyperos.mi.com/font-download/MiSans.zip"], lambda n: "MiSans/otf/" + n)
say(all(os.path.exists(os.path.join(FONTS, n)) for n in S), "思源宋体（标题、署名，必需）")
say(os.path.exists(os.path.join(FONTS, "SmileySans-Oblique.otf")), "得意黑（字幕、贴纸，必需）")
if not all(os.path.exists(os.path.join(FONTS, n)) for n in M): print("  提醒  MiSans 没下到：卡片正文会退回系统黑体，不影响出片")

os.makedirs(os.path.join(ST, "public", "yuedu"), exist_ok=True)
for f in ("plate.png", "logo.png"): shutil.copy(os.path.join(ROOT, "brands", "yuedu", f), os.path.join(ST, "public", "yuedu", f))
print("\n" + ("环境就绪。验证：python3 scripts/frame_render.py --help；出一张卡片总览：cd studio && node tools/yuedu_stills.cjs YueduCards cards.jpg - 135,285,435,585 2" if ok else "还有缺的，见上面标「缺」的行。下载失败多半是网络：可以手动下载后放到对应目录（地址在本脚本里）。"))
sys.exit(0 if ok else 1)
