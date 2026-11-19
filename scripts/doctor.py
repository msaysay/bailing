#!/usr/bin/env python3
"""环境自检：把做视频要的东西逐项查一遍，缺什么、怎么补，一行说清。
用法：scripts/doctor.py [--line news|talk|pet] [--fix] [--json]
  --line  只查这条线要的东西（news 事为主 · talk 口播 · pet 宠物），不给就全查
  --fix   能自动补的直接补：pip 包、npm 依赖、两个模型（需要能联网）
  --json  机器读的结果，给入口技能用
不需要人记命令：入口技能 video-start 会先跑这个，再把缺的东西一项项带用户补齐。"""
import argparse, importlib.util, json, os, shutil, subprocess, sys, tarfile, urllib.request
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); CACHE = os.path.expanduser("~/.cache/video-studio")
ASR = "sherpa-onnx-sense-voice-zh-en-ja-ko-yue-int8-2024-07-17"
ASR_URL = f"https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models/{ASR}.tar.bz2"
YUNET_URL = "https://github.com/opencv/opencv_zoo/raw/main/models/face_detection_yunet/face_detection_yunet_2023mar.onnx"
ap = argparse.ArgumentParser(); ap.add_argument("--line", choices=["news", "talk", "pet"]); ap.add_argument("--fix", action="store_true"); ap.add_argument("--json", action="store_true"); a = ap.parse_args()
def ver(cmd):
    try: return subprocess.run(cmd, capture_output=True, text=True, timeout=30).stdout.strip().splitlines()[0]
    except Exception: return ""
def has_mod(m): return importlib.util.find_spec(m) is not None
def fix_pip(pkgs): return subprocess.run([sys.executable, "-m", "pip", "install", "-q", *pkgs]).returncode == 0
def fix_npm(): return subprocess.run(["npm", "install", "--no-audit", "--no-fund"], cwd=os.path.join(R, "studio")).returncode == 0
def fix_asr():
    os.makedirs(CACHE, exist_ok=True); t = os.path.join(CACHE, "asr.tar.bz2"); urllib.request.urlretrieve(ASR_URL, t)
    with tarfile.open(t) as z: z.extractall(CACHE, filter="data")
    os.remove(t); return os.path.exists(os.path.join(CACHE, ASR, "model.int8.onnx"))
def fix_tts():
    d = os.path.join(CACHE, "tts"); os.makedirs(d, exist_ok=True); t = os.path.join(d, "k.tar.bz2")
    urllib.request.urlretrieve("https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/kokoro-multi-lang-v1_1.tar.bz2", t)
    with tarfile.open(t) as z: z.extractall(d, filter="data")
    os.remove(t); return True
def fix_yunet(): os.makedirs(CACHE, exist_ok=True); urllib.request.urlretrieve(YUNET_URL, os.path.join(CACHE, "yunet.onnx")); return True
fonts = os.path.join(R, "studio", "public", "fonts"); need_fonts = ["MiSans-Regular.otf", "MiSans-Semibold.otf", "MiSans-Heavy.otf"]
blend = os.path.join(R, "pet", "assets", "QuietCompanions.blend")
# 每项：名字、属于哪几条线、是否通过、缺了怎么办、能否自动补
C = [
 ("Node.js 22 以上", "news talk pet", (ver(["node", "-v"]) or "v0").lstrip("v").split(".")[0].isdigit() and int((ver(["node", "-v"]) or "v0").lstrip("v").split(".")[0]) >= 22, "去 nodejs.org 装 22 版（LTS）", None),
 ("ffmpeg", "news talk pet", bool(shutil.which("ffmpeg")), "Mac：brew install ffmpeg；Windows：winget install ffmpeg；Linux：apt install ffmpeg", None),
 ("Python 3.10 以上", "news talk pet", sys.version_info >= (3, 10), "去 python.org 装 3.10 以上", None),
 ("工程依赖（studio/node_modules）", "news talk pet", os.path.isdir(os.path.join(R, "studio", "node_modules", "remotion")), "cd studio && npm install", fix_npm),
 ("Python 包：语音识别", "news talk", has_mod("sherpa_onnx") and has_mod("soundfile") and has_mod("numpy"), "pip install sherpa-onnx soundfile numpy", lambda: fix_pip(["sherpa-onnx", "soundfile", "numpy"])),
 ("Python 包：人脸检测", "news talk", has_mod("cv2"), "pip install opencv-python-headless", lambda: fix_pip(["opencv-python-headless"])),
 ("Python 包：视频下载 yt-dlp", "news", has_mod("yt_dlp") or bool(shutil.which("yt-dlp")), "pip install yt-dlp", lambda: fix_pip(["yt-dlp"])),
 ("语音识别模型（约 230MB）", "news talk", os.path.exists(os.path.join(CACHE, ASR, "model.int8.onnx")), f"下载 {ASR_URL} 解压到 {CACHE}", fix_asr),
 ("AI 配音模型（约 350MB，没有录音时用）", "news talk", os.path.exists(os.path.join(CACHE, "tts", "kokoro-multi-lang-v1_1", "model.onnx")), "下载 https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/kokoro-multi-lang-v1_1.tar.bz2 解压到 ~/.cache/video-studio/tts/", lambda: fix_tts()),
 ("人脸检测模型", "news talk", os.path.exists(os.path.join(CACHE, "yunet.onnx")), f"下载 {YUNET_URL} 存为 {CACHE}/yunet.onnx", fix_yunet),
 ("MiSans 字体（三个字重）", "news talk pet", all(os.path.exists(os.path.join(fonts, f)) for f in need_fonts), "去小米官网 hyperos.mi.com/font 免费下载 MiSans，把 Regular、Semibold、Heavy 三个 otf 放进 studio/public/fonts/", None),
 ("TikHub 钥匙（自动找新闻画面用，可选）", "news", bool(os.environ.get("TIKHUB_TOKEN")) or os.path.exists(os.path.join(R, "钥匙.txt")), "去 tikhub.io 注册、充一点钱，在后台拿到 API Token；在这个文件夹最外层新建一个「钥匙.txt」，把那串字符贴进去保存。没有也能做，你自己把视频链接发给助手就行", None),
 ("Blender 4.2 以上（宠物用）", "pet", bool(shutil.which("blender")), "去 blender.org 装 4.2 LTS，确保命令行能运行 blender", None),
 ("海豹底模", "pet", os.path.exists(blend), "把 QuietCompanions.blend 放到 pet/assets/", None),
]
rows = []
for name, lines, ok, how, fixer in C:
    if a.line and a.line not in lines.split(): continue
    if not ok and a.fix and fixer:
        try: ok = bool(fixer())
        except Exception as e: how = f"自动补失败（{str(e)[:60]}）。手动：{how}"
    rows.append({"item": name, "ok": bool(ok), "how": "" if ok else how, "auto": bool(fixer), "optional": name.startswith("TikHub")})
if a.json: print(json.dumps(rows, ensure_ascii=False, indent=1)); sys.exit(0)
for r in rows: print(("✓ " if r["ok"] else ("· " if r["optional"] else "✗ ")) + r["item"] + ("" if r["ok"] else "  →  " + r["how"] + ("（加 --fix 可自动补）" if r["auto"] and not a.fix else "")))
bad = [r for r in rows if not r["ok"] and not r["optional"]]
print("\n全部就绪。" if not bad else f"\n还差 {len(bad)} 项。")
sys.exit(1 if bad else 0)
