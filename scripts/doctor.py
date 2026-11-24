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
YUNET_URL = "https://media.githubusercontent.com/media/opencv/opencv_zoo/main/models/face_detection_yunet/face_detection_yunet_2023mar.onnx"   # github.com/…/raw/ 那个地址会跳转，有的网络下 403
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
def fix_misans():
    sys.path.insert(0, os.path.join(R, "scripts")); import fontlib
    return not fontlib.install(["misans-regular", "misans-semibold", "misans-heavy"], quiet=True)
def fix_talkfont():
    sys.path.insert(0, os.path.join(R, "scripts")); import fontlib
    return not fontlib.install(fontlib.pack_fonts(fontlib.active()["xiaolin"]), quiet=True)
def talkfont_ok():
    try:
        sys.path.insert(0, os.path.join(R, "scripts")); import fontlib
        return all(fontlib.installed(i) for i in fontlib.pack_fonts(fontlib.active()["xiaolin"]))
    except Exception: return False
def fix_sys(tool):
    """用这台电脑的包管理器装 ffmpeg / Node.js。装不上就返回 False，由助手照「怎么办」里的命令接着装（不要让用户去装）。"""
    import platform
    pk = {"ffmpeg": {"brew": "ffmpeg", "winget": "Gyan.FFmpeg", "apt": ["ffmpeg"], "dnf": ["ffmpeg"]}, "node": {"brew": "node@22", "winget": "OpenJS.NodeJS.LTS", "apt": ["nodejs", "npm"], "dnf": ["nodejs"]}}[tool]
    run = lambda c: subprocess.run(c).returncode == 0; sudo = [] if (hasattr(os, "geteuid") and os.geteuid() == 0) else ["sudo", "-n"]; sysn = platform.system()
    if sysn == "Darwin" and shutil.which("brew"): ok = run(["brew", "install", pk["brew"]]) and (tool != "node" or run(["brew", "link", "--overwrite", "--force", pk["brew"]]))
    elif sysn == "Windows" and shutil.which("winget"): ok = run(["winget", "install", "-e", "--id", pk["winget"], "--accept-source-agreements", "--accept-package-agreements", "--silent"])
    elif shutil.which("apt-get"): ok = run([*sudo, "apt-get", "update", "-qq"]) and run([*sudo, "apt-get", "install", "-y", "-qq", *pk["apt"]])
    elif shutil.which("dnf"): ok = run([*sudo, "dnf", "install", "-y", *pk["dnf"]])
    else: ok = False
    if not ok: return False
    if tool == "ffmpeg": return bool(shutil.which("ffmpeg")) or sysn == "Windows"       # Windows 装完要开一个新终端才认得到
    v = (ver(["node", "-v"]) or "v0").lstrip("v").split(".")[0]; return (v.isdigit() and int(v) >= 22) or sysn == "Windows"
NODE_HOW = "助手来装，不要让用户装。Mac：brew install node@22 && brew link --overwrite --force node@22（没有 brew 就用不需要密码的办法：curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash，开一个新终端后 nvm install 22）；Windows：winget install -e --id OpenJS.NodeJS.LTS，装完开一个新终端；Linux：用 nvm 同上。只有系统弹密码框时才请用户输一下"
FF_HOW = "助手来装，不要让用户装。Mac：brew install ffmpeg（没有 brew 先装 brew：/bin/bash -c \"$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\"，这一步会要开机密码，请用户在终端里输一下）；Windows：winget install -e --id Gyan.FFmpeg，装完开一个新终端；Linux：sudo apt-get install -y ffmpeg"
def fix_yunet(): os.makedirs(CACHE, exist_ok=True); urllib.request.urlretrieve(YUNET_URL, os.path.join(CACHE, "yunet.onnx")); return True
fonts = os.path.join(R, "studio", "public", "fonts"); need_fonts = ["MiSans-Regular.otf", "MiSans-Semibold.otf", "MiSans-Heavy.otf"]
blend = os.path.join(R, "pet", "assets", "QuietCompanions.blend")
# 每项：名字、属于哪几条线、是否通过、缺了怎么办、能否自动补
C = [
 ("Node.js 22 以上", "news talk pet", (ver(["node", "-v"]) or "v0").lstrip("v").split(".")[0].isdigit() and int((ver(["node", "-v"]) or "v0").lstrip("v").split(".")[0]) >= 22, NODE_HOW, lambda: fix_sys("node")),
 ("ffmpeg", "news talk pet", bool(shutil.which("ffmpeg")), FF_HOW, lambda: fix_sys("ffmpeg")),
 ("Python 3.10 以上", "news talk pet", sys.version_info >= (3, 10), "助手来装，不要让用户装。Mac：brew install python@3.12；Windows：winget install -e --id Python.Python.3.12；Linux：sudo apt-get install -y python3.12。装完用新的 python3 再跑这个脚本", None),
 ("工程依赖（studio/node_modules）", "news talk pet", os.path.isdir(os.path.join(R, "studio", "node_modules", "remotion")), "cd studio && npm install", fix_npm),
 ("Python 包：语音识别", "news talk", has_mod("sherpa_onnx") and has_mod("soundfile") and has_mod("numpy"), "pip install sherpa-onnx soundfile numpy", lambda: fix_pip(["sherpa-onnx", "soundfile", "numpy"])),
 ("Python 包：人脸检测", "news talk", has_mod("cv2"), "pip install opencv-python-headless", lambda: fix_pip(["opencv-python-headless"])),
 ("Python 包：视频下载 yt-dlp", "news", has_mod("yt_dlp") or bool(shutil.which("yt-dlp")), "pip install yt-dlp", lambda: fix_pip(["yt-dlp"])),
 ("语音识别模型（约 230MB）", "news talk", os.path.exists(os.path.join(CACHE, ASR, "model.int8.onnx")), f"下载 {ASR_URL} 解压到 {CACHE}", fix_asr),
 ("AI 配音模型（约 350MB，没有录音时用）", "news talk", os.path.exists(os.path.join(CACHE, "tts", "kokoro-multi-lang-v1_1", "model.onnx")), "下载 https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/kokoro-multi-lang-v1_1.tar.bz2 解压到 ~/.cache/video-studio/tts/", lambda: fix_tts()),
 ("人脸检测模型", "news talk", os.path.exists(os.path.join(CACHE, "yunet.onnx")), f"下载 {YUNET_URL} 存为 {CACHE}/yunet.onnx", fix_yunet),
 ("MiSans 字体（三个字重）", "news talk pet", all(os.path.exists(os.path.join(fonts, f)) for f in need_fonts), "python3 scripts/fonts.py install xiaolin-default；或去小米官网 hyperos.mi.com/font 免费下载 MiSans，把 Regular、Semibold、Heavy 三个 otf 放进 studio/public/fonts/", fix_misans),
 ("口播字幕字体（当前字体包）", "talk", talkfont_ok(), "python3 scripts/fonts.py install xiaolin-v2", fix_talkfont),
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
    rows.append({"item": name, "ok": bool(ok), "how": "" if ok else how, "auto": bool(fixer), "optional": name.startswith(("TikHub", "Blender", "海豹"))})
if a.json: print(json.dumps(rows, ensure_ascii=False, indent=1)); sys.exit(0)
for r in rows: print(("✓ " if r["ok"] else ("· " if r["optional"] else "✗ ")) + r["item"] + ("" if r["ok"] else "  →  " + r["how"] + ("（加 --fix 可自动补）" if r["auto"] and not a.fix else "")))
bad = [r for r in rows if not r["ok"] and not r["optional"]]
print("\n全部就绪。" if not bad else f"\n还差 {len(bad)} 项。" + ("这几项自动装没装上：助手照上面「→」后面的命令接着装，装完再跑一遍；不要把命令丢给用户。" if a.fix else "助手先跑 python3 scripts/doctor.py --fix 自动装。"))
sys.exit(1 if bad else 0)
