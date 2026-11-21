#!/usr/bin/env python3
"""把「横屏深度解读风（子祺见微式）」这条线打成一个可以单独交给别的 AI 助手用的压缩包（不含视频、字体、模型、node_modules）。
用法：python3 scripts/talk_pack.py [--out dist/ziqi-wide-kit.zip] [--reference 目录]
  --reference  对标片的联系表、并排对比图所在的目录，放进包里的 reference/，助手开工前先看。默认 docs/reference/ 下对应的目录。
  --components free（默认，56 个基础组件）或 all（全部 298 个，社群版）。
包里有：技能 ziqi-wide、对标拆解、粗剪和声音脚本、横屏版式引擎和组件库、演示工程 wide01、共用字体库目录。
对方解压后让助手先读 AGENTS.md。"""
import argparse, os, zipfile
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ap = argparse.ArgumentParser(); ap.add_argument("--out", default=os.path.join(R, "dist", "ziqi-wide-kit.zip")); ap.add_argument("--reference", default=os.path.join(R, "docs", "reference", "ziqi")); ap.add_argument("--components", default="free", choices=["free", "all"]); a = ap.parse_args()
files = {}
def tree(src, dst=None, skip=()):
    for base, dirs, names in os.walk(os.path.join(R, src)):
        dirs[:] = [d for d in dirs if d not in ("__pycache__", "node_modules")]
        for n in names:
            full = os.path.join(base, n); rel = os.path.join(dst or src, os.path.relpath(full, os.path.join(R, src))).replace(os.sep, "/")
            if not any(n.endswith(x) for x in skip): files[rel] = full
def one(*paths):
    for f in paths: files[f] = os.path.join(R, f)
tree(".claude/skills/ziqi-wide"); tree("studio/src/kit"); tree("studio/src/episodes/wide01"); tree("studio/templates"); tree("studio/public/sfx")
one(*[f"scripts/{s}.py" for s in ("doctor", "episode", "talk_prep", "asr", "align", "roughcut", "retakes", "grade", "polish", "soundlib", "fonts", "fontlib", "qc", "wide_check", "faces", "facecheck", "tikhub", "wide_pack")])
one("docs/对标拆解-子祺见微.md", "docs/aesthetic-rules.md", "fonts/library.json", "fonts/字体包样张.jpg", "requirements.txt", "studio/package.json", "studio/package-lock.json", "studio/tsconfig.json", "studio/public/fonts/MiSans-License.txt")
# 组件库：免费包带 56 个基础组件（图表、文字、流程、图片视频四组）；--components all 带全部 298 个（社群版）
if a.components == "all": tree("studio/src/components")
else: one(*[f"studio/src/components/{f}.tsx" for f in ("charts", "type", "flow", "media")])
files = {k: v for k, v in files.items() if os.path.exists(v)}
INDEX = """import React from 'react';
import { Composition, registerRoot } from 'remotion';
import { Registered } from './episodes/_registry';
import { WIDE01, wide1Clock } from './episodes/wide01';
// 每期一个 Composition，scripts/episode.py new 会自动登记到 episodes/_registry.tsx。WIDE01 是版式演示。
registerRoot(() => (
  <>
    <Registered />
    <Composition id="WIDE01" component={WIDE01} width={1920} height={1280} fps={wide1Clock.fps} durationInFrames={Math.ceil(wide1Clock.total * wide1Clock.fps)} />
  </>
));
"""
REGISTRY = """// 自动生成：scripts/episode.py new 会往这里加一行。不要手改。
import React from 'react';
import { Composition } from 'remotion';
export const Registered: React.FC = () => (
  <>
  </>
);
"""
AGENTS = """# 给 AI 助手的说明

这是一套把横屏口播原片剪成「横屏深度解读风」长视频的工具（对标子祺见微的大国博弈、财经深度解读）：3:2 横屏，顶上章节导航条，主持人全景、右侧素材窗、主持人名片、圆头像和满屏素材来回切，金色大字标题卡、数据面板。

**用户发来横屏口播原片、说「帮我剪」「做成深度解读那种长视频」，或者还没拍想先写稿时，读 `.claude/skills/ziqi-wide/SKILL.md` 照做。**

- 第一次用先跑：`python3 scripts/doctor.py --line talk --fix`，再跑 `python3 scripts/fonts.py install ziqi-default`（需要先自己装好 Python 3.10+、Node.js 22+、ffmpeg）
- 对标片拆解和所有数值的出处：`docs/对标拆解-子祺见微.md`
- 有 `reference/` 目录的话，开工前用看图工具把里面的联系表看一遍
- 每一期的进度：`python3 scripts/episode.py status`

和用户说话用大白话，一次只要一样东西，每次停下来都告诉用户下一步要他给什么。
人确认五次：稿子和章节、剪掉了什么、版式表和素材、第一章小样、成片。这种片子素材量大，先做第一章给用户看，定了再做后面的。
"""
README = """# 横屏深度解读风 · 长视频成片工具包

给一条横屏口播原片，出一条 1920×1280（3:2）的分章长视频，版式和节奏对标子祺见微的深度解读。
由 AI 助手（Claude Code、Codex、Cursor 等能读文件、跑命令的助手）照着技能一步步做。

## 怎么用

1. 装好 Python 3.10+、Node.js 22+、ffmpeg。
2. 把这个文件夹交给 AI 助手，对它说（原片路径换成你的）：

   > 读 AGENTS.md，然后把 `D:\\video\\横屏口播.mp4` 剪成横屏深度解读风的成片。

   还没拍：说「读 AGENTS.md，我想做一条讲某某的十分钟长视频，先帮我写稿」。
3. 它先装环境（第一次约下载 600 MB），然后依次找你确认：章节 → 剪掉了哪几句 → 版式表和素材 → 第一章小样 → 成片。

## 先知道这几件事

- **素材量大**：两秒左右一个画面，十分钟的片子要两三百个画面。航拍、工厂、港口、城市这类空镜要你提供或授权助手去找。
- **拍的时候人站在画面左边三分之一**，右边留空，后面要开素材窗。
- 整片渲染要几十分钟，所以助手会先做第一章给你看。

## 你能选的

| 想要什么 | 告诉助手 |
|---|---|
| 环境吵、光线暗 | 「加降噪」「调一下光」 |
| 配乐 | 给它曲子，或说「合成一条配乐」 |
| 换字体 | 「出字体样张我挑」（样张见 `fonts/字体包样张.jpg`） |
| 频道名、主持人名片 | 告诉它频道名、名字、一行身份 |

## 目录

```
AGENTS.md / CLAUDE.md      给 AI 助手的入口说明
.claude/skills/ziqi-wide/  操作说明（六步）
docs/                      对标拆解、制作规则
scripts/                   环境自检、粗剪、重录检测、降噪调光配乐、版式自查、字体
studio/                    Remotion 工程：版式引擎 src/kit/wide.tsx、基础组件 src/components（免费版 56 个，全部 298 个在社群）、演示 src/episodes/wide01
fonts/                     字体库目录和样张（字体文件用到时自动下载）
reference/                 对标片的联系表（如果带了）
```

## 已知的限制

- 助手听不到声音、看不到动态：嘴型、剪口顺不顺、降噪后人声闷不闷、配乐响不响，需要你看一遍成片。
- 对标片里的玫瑰画框、卡通小人是单做的美术，这里给的是通用的画框和面板。
- 字幕字体是最接近的开源字体，不是同一款。字体都是可免费商用的，商用发布前请到出处核对一次授权。
- 搜来的素材版权不归你，助手会列出来请你确认；数据面板上的数要有出处。
- 渲染用 Remotion：个人和三人以下团队免费，更大的团队商用需要买授权。
- Windows 上请把这个文件夹放在不含中文和空格的路径下。
"""
os.makedirs(os.path.dirname(os.path.abspath(a.out)), exist_ok=True); top = "ziqi-wide-kit/"; n = 0
with zipfile.ZipFile(a.out, "w", zipfile.ZIP_DEFLATED) as z:
    for dst, src in sorted(files.items()): z.write(src, top + dst); n += 1
    for name, text in (("studio/src/index.tsx", INDEX), ("studio/src/episodes/_registry.tsx", REGISTRY), ("AGENTS.md", AGENTS), ("CLAUDE.md", AGENTS), ("README.md", README),
                       (".gitignore", "node_modules/\n__pycache__/\n钥匙.txt\nfonts/active.json\nstudio/out/\nstudio/public/fonts/*.otf\nstudio/public/fonts/*.ttf\nstudio/public/*/person.mp4\nstudio/public/*/voice.wav\nstudio/public/*/footage/\nepisodes/*/01_输入素材/\n")):
        z.writestr(top + name, text); n += 1
    if a.reference and os.path.isdir(a.reference):
        for f in sorted(os.listdir(a.reference)):
            if f.lower().endswith((".jpg", ".png", ".md")): z.write(os.path.join(a.reference, f), top + "reference/" + f); n += 1
print(f"{n} 个文件 → {a.out}（{os.path.getsize(a.out) / 1e6:.1f} MB）")
