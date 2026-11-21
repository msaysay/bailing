#!/usr/bin/env python3
"""把整套内容创作工作流打成一个压缩包：全部技能、脚本、版式引擎、组件库、字体库目录、文档和样例。
用法：python3 scripts/pack_all.py [--out dist/video-studio-all.zip] [--with-vendor]
包里是仓库里登记过的所有文件（和还没提交的新文件），不含：视频、字体文件、模型、node_modules、钥匙.txt，
以及 vendor/（第三方参考代码，约 58 MB，做片子用不到；要带上加 --with-vendor）。
对方解压后让助手先读 CLAUDE.md 或 AGENTS.md，说「我想做一条视频」就行。"""
import argparse, os, subprocess, zipfile
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ap = argparse.ArgumentParser(); ap.add_argument("--out", default=os.path.join(R, "dist", "video-studio-all.zip")); ap.add_argument("--with-vendor", action="store_true"); a = ap.parse_args()
ls = subprocess.run(["git", "-c", "core.quotepath=off", "ls-files", "-z", "--cached", "--others", "--exclude-standard"], cwd=R, capture_output=True).stdout.decode("utf-8").split("\0")
files = [f for f in ls if f and os.path.isfile(os.path.join(R, f)) and (a.with_vendor or not f.startswith("vendor/")) and not f.startswith(("dist/", "site/downloads/"))]
os.makedirs(os.path.dirname(os.path.abspath(a.out)), exist_ok=True); top = "video-studio/"; by = {}
with zipfile.ZipFile(a.out, "w", zipfile.ZIP_DEFLATED) as z:
    for f in sorted(files): z.write(os.path.join(R, f), top + f); k = f.split("/")[0]; by[k] = by.get(k, 0) + 1
print(f"{len(files)} 个文件 → {a.out}（{os.path.getsize(a.out) / 1e6:.1f} MB）")
print("  " + "，".join(f"{k} {v}" for k, v in sorted(by.items(), key=lambda x: -x[1])[:12]))
