#!/usr/bin/env python3
"""相框口播线：检查剪辑决定表 → 关键帧联系表 → 整片渲染 → 自查 → 封面。Windows、macOS、Linux 都能跑。
用法：python3 scripts/frame_render.py <期目录> [keys|full|all|cover] [--at 秒]
  keys   只出关键帧联系表（每段画面、每个贴纸出现后不久各一张）。先看图，再决定要不要整片渲染
  full   整片渲染加自查
  all    keys 然后 full（默认）
  cover  出封面（1080×1440）；--at 是人物视频里的秒数，挑一帧眼睛睁开、嘴没张大的
产物在 <期目录>/04_成片/：关键帧.jpg、成片.mp4、qc/、封面.png"""
import sys as _sys
for _s in (_sys.stdout, _sys.stderr): getattr(_s, "reconfigure", lambda **k: None)(encoding="utf-8", errors="replace")   # Windows 终端也能打印中文
import argparse, glob, json, os, shutil, subprocess, sys
ap = argparse.ArgumentParser(); ap.add_argument("ep"); ap.add_argument("mode", nargs="?", default="all", choices=["keys", "full", "all", "cover"]); ap.add_argument("--at", type=float, default=1.0); a = ap.parse_args()
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); EP = os.path.abspath(a.ep); W = os.path.join(EP, "03_制作过程"); OUT = os.path.join(EP, "04_成片"); ST = os.path.join(ROOT, "studio"); os.makedirs(OUT, exist_ok=True)
def run(cmd, **k):
    r = subprocess.run(cmd, **k)
    if r.returncode: sys.exit(r.returncode)
env = dict(os.environ)
if not env.get("CHROME_PATH"):                       # 云端容器里用预装的浏览器；别处让 Remotion 自己下载
    c = sorted(glob.glob("/opt/pw-browsers/chromium_headless_shell-*/chrome-headless-shell-linux64/chrome-headless-shell"))
    if c: env["CHROME_PATH"] = c[0]
if not os.path.exists(os.path.join(ST, "node_modules")) or not os.path.exists(os.path.join(ST, "public", "fonts", "SmileySans-Oblique.otf")):
    sys.exit("环境没装好，先运行：python3 scripts/frame_setup.py")
os.makedirs(os.path.join(ST, "public", "yuedu"), exist_ok=True)
for f in ("plate.png", "logo.png"): shutil.copy(os.path.join(ROOT, "brands", "yuedu", f), os.path.join(ST, "public", "yuedu", f))
run([sys.executable, os.path.join(ROOT, "scripts", "frame_plan.py"), EP])
props = os.path.join(W, "props.json"); p = json.load(open(props, encoding="utf-8")); node = shutil.which("node"); npx = shutil.which("npx")
if a.mode == "cover":
    p["coverAt"] = a.at; cp = os.path.join(W, "cover-props.json"); json.dump(p, open(cp, "w", encoding="utf-8"), ensure_ascii=False)
    run([node, os.path.join(ST, "tools", "yuedu_stills.cjs"), "YueduCover", os.path.join(OUT, "封面.png"), cp, "0", "1", "1"], cwd=ST, env=env); sys.exit(0)
if a.mode in ("keys", "all"):
    B = p["base"]; fr = set()
    for i, b in enumerate(B):
        e = B[i + 1]["t"] if i + 1 < len(B) else p["total"]; fr.add(int((b["t"] + min(3.0, 0.8 * (e - b["t"]))) * p["fps"]))
    for o in p["overlays"]: fr.add(int((o["t"] + 1.0) * p["fps"]))
    run([node, os.path.join(ST, "tools", "yuedu_stills.cjs"), "YueduFrame", os.path.join(OUT, "关键帧.jpg"), props, ",".join(map(str, sorted(fr))), "6"], cwd=ST, env=env)
if a.mode in ("full", "all"):
    cmd = [npx, "remotion", "render", "src/yuedu/index.tsx", "YueduFrame", os.path.join(OUT, "成片.mp4"), "--props=" + props, "--crf=19", "--log=error"]
    if env.get("CHROME_PATH"): cmd.append("--browser-executable=" + env["CHROME_PATH"])
    run(cmd, cwd=ST, env=env)
    subprocess.run([sys.executable, os.path.join(ROOT, "scripts", "qc.py"), os.path.join(OUT, "成片.mp4")])
    run([sys.executable, os.path.join(ROOT, "scripts", "frame_check.py"), os.path.join(OUT, "成片.mp4"), props])
