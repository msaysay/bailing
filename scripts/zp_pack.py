#!/usr/bin/env python3
"""把张展鹏口播线打成一个可以独立运行的包（不带生产线的其他期数和组件库），交给别的 AI 或别的机器用。
用法：scripts/zp_pack.py [--out dist/zhanpeng-talk-kit.zip] [--reference <对标片图片目录>]
包里有：操作说明、scripts/zp.py 和它依赖的脚本、只含 ZP 模板的 Remotion 工程、音效、字体（已下载的话）。
对标片的图片涉及出镜人肖像，不进仓库；要带上就用 --reference 指一个本地目录。"""
import argparse, os, shutil, sys, zipfile
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ap = argparse.ArgumentParser(); ap.add_argument("--out", default=os.path.join(R, "dist", "zhanpeng-talk-kit.zip")); ap.add_argument("--reference"); a = ap.parse_args()
INDEX = """// 独立包的入口：只注册张展鹏口播模板。每期的数据由 scripts/zp.py 用 --props 传进来。
import React from 'react';
import { Composition, registerRoot } from 'remotion';
import { ZP, ZP_FPS, ZP_H, ZP_W, zpDefault } from './zhanpeng';
registerRoot(() => (
  <Composition id="ZP" component={ZP} width={ZP_W} height={ZP_H} fps={ZP_FPS} durationInFrames={90} defaultProps={zpDefault} calculateMetadata={({ props }) => ({ durationInFrames: Math.max(1, Math.round(props.durationInFrames)) })} />
));
"""
README = """# 张展鹏科普口播 · 自动剪辑包

原片 + 文案 → 1080×1920 成片。给 AI 助手（Claude Code、Codex、Cursor 等能跑命令、读文件、看图的）用。
把整个文件夹交给它，让它先读 `AGENTS.md`。人只需要在三个节点确认：剪掉了哪些话、分镜和素材、成片。

需要：Python 3.10+、Node.js 20+、ffmpeg。第一次运行 `python3 scripts/zp.py setup`。
字体：寒蝉正楷、霞鹜文楷、思源宋体、马善政（均为 SIL OFL 1.1，可商用），`python3 scripts/zp.py fonts --preview` 出样张挑。渲染用 Remotion：个人和三人以下团队免费，更大的公司需要它的公司许可。
"""
files = {"AGENTS.md": os.path.join(R, "AGENTS.zp.md"), "requirements.txt": os.path.join(R, "requirements.txt")}
def tree(src, dst, skip=()):
    for base, dirs, names in os.walk(os.path.join(R, src)):
        dirs[:] = [d for d in dirs if d not in ("__pycache__", "node_modules")]
        for n in names:
            full = os.path.join(base, n); rel = os.path.join(dst, os.path.relpath(full, os.path.join(R, src)))
            if not any(n.endswith(x) for x in skip): files[rel] = full
tree(".claude/skills/zhanpeng-talk", ".claude/skills/zhanpeng-talk"); tree("scripts/zplib", "scripts/zplib"); tree("studio/src/zhanpeng", "studio/src/zhanpeng"); tree("studio/public/sfx", "studio/public/sfx")
for f in ("scripts/zp.py", "scripts/asr.py", "scripts/qc.py", "studio/package.json", "studio/package-lock.json", "studio/tsconfig.json"): files[f] = os.path.join(R, f)
import json
lib = json.load(open(os.path.join(R, "studio/src/zhanpeng/fonts.json"), encoding="utf-8"))
fonts = [f for f in lib["files"] if os.path.exists(os.path.join(R, "studio/public/fonts", f))]   # 都是 OFL 字体，可以随包分发；自备的商业字体不带
for f in fonts: files["studio/public/fonts/" + f] = os.path.join(R, "studio/public/fonts", f)
print(f"· 带上了 {len(fonts)}/{len(lib['files'])} 个字体文件（先跑 zp.py fonts --install all 可以带全）；没带的对方用到时会自己下。")
if a.reference:
    for n in sorted(os.listdir(a.reference)):
        if n.lower().endswith((".jpg", ".png", ".md")): files["reference/" + n] = os.path.join(a.reference, n)
else: print("· 没带对标片图片（--reference）。对方没看过对标片时效果会差一截。")
os.makedirs(os.path.dirname(a.out), exist_ok=True); top = "zhanpeng-talk-kit/"
with zipfile.ZipFile(a.out, "w", zipfile.ZIP_DEFLATED) as z:
    for rel, full in sorted(files.items()): z.write(full, top + rel)
    z.writestr(top + "studio/src/index.tsx", INDEX); z.writestr(top + "README.md", README); z.writestr(top + "CLAUDE.md", "先读 AGENTS.md。\n")
    z.writestr(top + ".gitignore", "node_modules/\n__pycache__/\nepisodes/*/01_输入素材/\nepisodes/*/out/\nstudio/public/*/person.mp4\nstudio/public/*/assets/\nstudio/public/*/cutout-*.webm\n")
print(f"✓ {a.out}（{len(files) + 4} 个文件，{os.path.getsize(a.out) / 1e6:.1f} MB）")
