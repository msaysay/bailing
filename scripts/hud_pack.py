#!/usr/bin/env python3
"""把「手势全息风」这条线打成一个可以单独交给别的 AI 助手用的压缩包（不含视频、字体、模型、node_modules）。
用法：python3 scripts/hud_pack.py [--out dist/hud-pov-kit.zip]
对方解压后让助手先读 AGENTS.md。"""
import argparse, os, zipfile
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ap = argparse.ArgumentParser(); ap.add_argument("--out", default=os.path.join(R, "dist", "hud-pov-kit.zip")); a = ap.parse_args()
files = {}
for f in ("scripts/hud.py", "scripts/hud_track.py", "scripts/hud_music.py", "scripts/hud_pack.py", "scripts/fonts.py", "scripts/fontlib.py", "fonts/library.json", ".claude/skills/hud-pov/SKILL.md", "docs/对标拆解-手势全息片.md",
          "studio/src/kit/hud.tsx", "studio/package.json", "studio/package-lock.json", "studio/tsconfig.json", "episodes/hud-demo/plan.json", "episodes/hud02/plan.json"):
    if os.path.exists(os.path.join(R, f)): files[f] = os.path.join(R, f)
INDEX = """import React from 'react';
import { Composition, registerRoot } from 'remotion';
import { HudFilm, HUD_FPS, HUD_H, HUD_W, hudDefault } from './kit/hud';
// 手势全息风：一个合成做所有期，scripts/hud.py render 用 --props 传每期的 plan。
registerRoot(() => (
  <Composition id="HUD" component={HudFilm} width={HUD_W} height={HUD_H} fps={HUD_FPS} durationInFrames={90} defaultProps={hudDefault} calculateMetadata={({ props }) => ({ durationInFrames: Math.max(1, Math.round(props.total * HUD_FPS)), width: props.w ?? HUD_W, height: props.h ?? HUD_H })} />
));
"""
AGENTS = """# 给 AI 助手的说明

这是一套做「手势全息风」短片的工具：用户第一人称（胸前或头戴机位）拍一段对着空气点、划、捏的原片，出一条成片（竖着拍出竖屏，横着拍出横屏）——悬浮玻璃界面钉在桌面上跟着镜头走，手挡在界面前面，最后一「砸」转进跟着音乐拍子硬切的卡点段。配乐和音效是程序现场合成的。

**用户说想做这种片子、或者发来第一人称原片时，读 `.claude/skills/hud-pov/SKILL.md` 照做。还没拍的，先把里面的「怎么拍」和分镜讲给他。**

- 第一次用（需要先装好 Python 3.10+、Node.js 22+、ffmpeg）：
  `pip install -r requirements.txt`，`cd studio && npm install`，`python3 scripts/fonts.py install xiaolin-default`
- 没有原片也能先看效果：`python3 scripts/hud.py demo hud-try --force && python3 scripts/hud.py music hud-try && python3 scripts/hud.py render hud-try --force`
- 一条做好的例子（横屏，原片和素材不在包里，只看写法）：`episodes/hud02/plan.json`
- 结构是怎么来的：`docs/对标拆解-手势全息片.md`

和用户说话用大白话，一次只要一样东西，每次停下来都告诉用户下一步要他给什么。
人确认三次：拍之前的分镜、关键帧、成片。
"""
REQ = "numpy\nsoundfile\nopencv-python\nmediapipe\n"
os.makedirs(os.path.dirname(a.out), exist_ok=True)
with zipfile.ZipFile(a.out, "w", zipfile.ZIP_DEFLATED) as z:
    for rel, full in sorted(files.items()): z.write(full, "hud-pov-kit/" + rel)
    z.writestr("hud-pov-kit/studio/src/index.tsx", INDEX); z.writestr("hud-pov-kit/AGENTS.md", AGENTS); z.writestr("hud-pov-kit/CLAUDE.md", AGENTS); z.writestr("hud-pov-kit/requirements.txt", REQ)
print(f"{a.out}  {os.path.getsize(a.out) / 1024:.0f} KB，{len(files) + 4} 个文件")
