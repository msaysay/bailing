#!/usr/bin/env python3
"""环境自检（红顶双标题口播风）。用法：python3 scripts/doctor.py [--fix]
--fix 会自己装：Python 包、工程依赖、语音识别模型、人脸检测模型；缺 ffmpeg / Node.js 时用这台电脑的包管理器装。
装不上的项会打印给助手照做的命令。助手来装，不要让用户装。"""
import argparse, importlib.util, os, platform, shutil, subprocess, sys, tarfile, urllib.request
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); CACHE = os.path.expanduser("~/.cache/video-studio")
ASR = "sherpa-onnx-sense-voice-zh-en-ja-ko-yue-int8-2024-07-17"; ASR_URL = f"https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models/{ASR}.tar.bz2"
YUNET_URL = "https://media.githubusercontent.com/media/opencv/opencv_zoo/main/models/face_detection_yunet/face_detection_yunet_2023mar.onnx"
a = argparse.ArgumentParser(); a.add_argument("--fix", action="store_true"); a = a.parse_args()
def ver(cmd):
    try: return subprocess.run(cmd, capture_output=True, text=True, timeout=30, shell=(os.name == "nt")).stdout.strip().splitlines()[0]
    except Exception: return ""
def mod(m): return importlib.util.find_spec(m) is not None
def pip(*p): return subprocess.run([sys.executable, "-m", "pip", "install", "-q", *p]).returncode == 0
def node_ok(): v = (ver(["node", "-v"]) or "v0").lstrip("v").split(".")[0]; return v.isdigit() and int(v) >= 20
def fix_sys(tool):
    pk = {"ffmpeg": ("ffmpeg", "Gyan.FFmpeg", ["ffmpeg"]), "node": ("node@22", "OpenJS.NodeJS.LTS", ["nodejs", "npm"])}[tool]; run = lambda c: subprocess.run(c).returncode == 0; sudo = [] if (hasattr(os, "geteuid") and os.geteuid() == 0) else ["sudo", "-n"]; s = platform.system()
    if s == "Darwin" and shutil.which("brew"): return run(["brew", "install", pk[0]]) and (tool != "node" or run(["brew", "link", "--overwrite", "--force", pk[0]]))
    if s == "Windows" and shutil.which("winget"): return run(["winget", "install", "-e", "--id", pk[1], "--accept-source-agreements", "--accept-package-agreements", "--silent"])
    if shutil.which("apt-get"): return run([*sudo, "apt-get", "update", "-qq"]) and run([*sudo, "apt-get", "install", "-y", "-qq", *pk[2]])
    return False
def fix_asr():
    os.makedirs(CACHE, exist_ok=True); t = os.path.join(CACHE, "asr.tar.bz2"); urllib.request.urlretrieve(ASR_URL, t)
    with tarfile.open(t) as z: z.extractall(CACHE, filter="data")
    os.remove(t); return True
def fix_yunet(): os.makedirs(CACHE, exist_ok=True); urllib.request.urlretrieve(YUNET_URL, os.path.join(CACHE, "yunet.onnx")); return True
C = [
 ("Python 3.10 以上", lambda: sys.version_info >= (3, 10), "Mac：brew install python@3.12；Windows：winget install -e --id Python.Python.3.12；装完用新的 python3 再跑", None),
 ("ffmpeg", lambda: bool(shutil.which("ffmpeg")), "Mac：brew install ffmpeg；Windows：winget install -e --id Gyan.FFmpeg（装完开一个新终端）；Linux：sudo apt-get install -y ffmpeg", lambda: fix_sys("ffmpeg")),
 ("Node.js 20 以上", node_ok, "Mac：brew install node@22；Windows：winget install -e --id OpenJS.NodeJS.LTS（装完开一个新终端）；Linux 或没有 brew：用 nvm 装 22", lambda: fix_sys("node")),
 ("Python 包", lambda: all(mod(m) for m in ("sherpa_onnx", "soundfile", "numpy", "cv2", "PIL")), "pip install -r requirements.txt", lambda: pip("-r", os.path.join(R, "requirements.txt"))),
 ("工程依赖（studio/node_modules）", lambda: os.path.isdir(os.path.join(R, "studio", "node_modules", "remotion")), "cd studio && npm install", lambda: subprocess.run("npm install --no-audit --no-fund", cwd=os.path.join(R, "studio"), shell=True).returncode == 0),
 ("语音识别模型（约 230MB）", lambda: os.path.exists(os.path.join(CACHE, ASR, "model.int8.onnx")), f"下载 {ASR_URL} 解压到 {CACHE}", fix_asr),
 ("人脸检测模型", lambda: os.path.exists(os.path.join(CACHE, "yunet.onnx")), f"下载 {YUNET_URL} 存为 {CACHE}/yunet.onnx", fix_yunet),
 ("字体（阿里巴巴普惠体特粗）", lambda: os.path.exists(os.path.join(R, "studio", "public", "fonts", "AlibabaPuHuiTi-3-105-Heavy.ttf")), "包里应该自带；没有就重新解压", None),
]
bad = 0
for name, ok, how, fixer in C:
    good = ok()
    if not good and a.fix and fixer:
        try: fixer(); good = ok()
        except Exception as e: how = f"自动装失败（{str(e)[:60]}）。{how}"
    print(("✓ " if good else "✗ ") + name + ("" if good else "  →  助手来装：" + how)); bad += not good
print("\n全部就绪。" if not bad else f"\n还差 {bad} 项。" + ("助手照上面的命令接着装，装完再跑一遍；不要把命令丢给用户。" if a.fix else "先跑 python3 scripts/doctor.py --fix"))
sys.exit(1 if bad else 0)
