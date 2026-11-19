#!/usr/bin/env python3
"""把「财经解读风（小 Lin 式）」口播线打成一个可以单独交给别的 AI 助手用的压缩包（不含视频、字体、模型、node_modules）。
用法：python3 scripts/talk_pack.py [--out dist/xiaolin-talk-kit.zip] [--reference 目录]
  --reference  对标片的联系表、并排对比图所在的目录（来自别人的成片，不进仓库），给了就放进包里的 reference/，助手开工前先看。
包里有：技能 xiaolin-talk、对标拆解、粗剪和声音脚本、版式引擎和组件库、演示工程 talk02、共用字体库目录。
对方解压后让助手先读 AGENTS.md。"""
import argparse, os, zipfile
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ap = argparse.ArgumentParser(); ap.add_argument("--out", default=os.path.join(R, "dist", "xiaolin-talk-kit.zip")); ap.add_argument("--reference"); a = ap.parse_args()
files = {}
def tree(src, dst=None, skip=()):
    for base, dirs, names in os.walk(os.path.join(R, src)):
        dirs[:] = [d for d in dirs if d not in ("__pycache__", "node_modules")]
        for n in names:
            full = os.path.join(base, n); rel = os.path.join(dst or src, os.path.relpath(full, os.path.join(R, src))).replace(os.sep, "/")
            if not any(n.endswith(x) for x in skip): files[rel] = full
def one(*paths):
    for f in paths: files[f] = os.path.join(R, f)
tree(".claude/skills/xiaolin-talk"); tree("studio/src/kit"); tree("studio/src/components"); tree("studio/src/episodes/talk02"); tree("studio/templates"); tree("studio/public/sfx")
one(*[f"scripts/{s}.py" for s in ("doctor", "episode", "talk_prep", "asr", "align", "roughcut", "retakes", "grade", "polish", "soundlib", "fonts", "fontlib", "qc", "talk_check", "faces", "facecheck", "tikhub", "talk_pack")])
one("docs/对标拆解-小Lin口播.md", "docs/aesthetic-rules.md", "fonts/library.json", "fonts/字体包样张.jpg", "requirements.txt", "studio/package.json", "studio/package-lock.json", "studio/tsconfig.json", "studio/public/fonts/MiSans-License.txt")
for f in sorted(os.listdir(os.path.join(R, "docs", "steps"))):
    if f.startswith("talk-"): one("docs/steps/" + f)
files = {k: v for k, v in files.items() if os.path.exists(v)}
INDEX = """import React from 'react';
import { Composition, registerRoot } from 'remotion';
import { Registered } from './episodes/_registry';
import { TALK02, talk2Clock } from './episodes/talk02';
// 每期一个 Composition，scripts/episode.py new 会自动登记到 episodes/_registry.tsx。TALK02 是版式演示。
registerRoot(() => (
  <>
    <Registered />
    <Composition id="TALK02" component={TALK02} width={1080} height={1920} fps={talk2Clock.fps} durationInFrames={Math.ceil(talk2Clock.total * talk2Clock.fps)} />
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

这是一套把竖屏口播原片剪成「财经解读风」成片的工具（对标小 Lin 的竖屏口播）：人全屏和「素材带 + 右上小圆头像」来回切，胸口压卡片，进度牌贯穿全片。

**用户发来口播原片、说「帮我剪」「按小 Lin 那样做」，或者还没拍想先写稿时，读 `.claude/skills/xiaolin-talk/SKILL.md` 照做。**

- 第一次用先跑：`python3 scripts/doctor.py --line talk --fix`（装 Python 包、渲染依赖、识别模型、人脸模型、字体；需要先自己装好 Python 3.10+、Node.js 22+、ffmpeg）
- 对标片拆解和所有数值的出处：`docs/对标拆解-小Lin口播.md`
- 有 `reference/` 目录的话，开工前用看图工具把里面的联系表看一遍，心里有那条片子的样子再排版式
- 每一期的进度：`python3 scripts/episode.py status`

和用户说话用大白话，一次只要一样东西，每次停下来都告诉用户下一步要他给什么。
人只确认四次：稿子（没拍时）、剪掉了什么、版式表和素材、成片。
"""
README = """# 财经解读风 · 口播成片工具包

给一条竖屏口播原片，出一条 1080×1920 的成片，节奏和版式对标小 Lin 的竖屏口播。
由 AI 助手（Claude Code、Codex、Cursor 等能读文件、跑命令的助手）照着技能一步步做。

## 怎么用

1. 装好 Python 3.10+、Node.js 22+、ffmpeg。
2. 把这个文件夹交给 AI 助手，对它说（原片路径换成你的）：

   > 读 AGENTS.md，然后把 `D:\\video\\口播原片.mp4` 剪成财经解读风的竖屏成片。

   还没拍：说「读 AGENTS.md，我想做一条讲某某的口播，先帮我写稿」。
3. 它先装环境（第一次约下载 600 MB），然后依次找你确认：剪掉了哪几句 → 版式表和素材 → 成片。

## 你能选的

| 想要什么 | 告诉助手 |
|---|---|
| 环境吵、光线暗 | 「加降噪」「调一下光」「轻微磨皮」 |
| 配乐 | 给它曲子，或说「合成一条配乐」 |
| 换字体 | 「出字体样张我挑」（样张见 `fonts/字体包样张.jpg`，默认是最接近对标片的庞门正道标题体） |
| 频道名角标 | 告诉它频道名 |

## 目录

```
AGENTS.md / CLAUDE.md      给 AI 助手的入口说明
.claude/skills/xiaolin-talk/   操作说明（六步）
docs/                      对标拆解、制作规则、第一版的分步细节
scripts/                   环境自检、粗剪、重录检测、降噪调光配乐、版式自查、字体
studio/                    Remotion 工程：版式引擎 src/kit/talk2.tsx、组件库 src/components、演示 src/episodes/talk02
fonts/                     字体库目录和样张（字体文件用到时自动下载）
reference/                 对标片的联系表（如果带了）
```

## 已知的限制

- 助手听不到声音、看不到动态：嘴型、剪口顺不顺、降噪后人声闷不闷、配乐响不响，需要你看一遍成片。
- 对标片里的插画、三维卡片是每期单做的美术，这里给的是位置和通用样子。
- 字幕字体是最接近的开源字体，不是同一款。字体都是可免费商用的，商用发布前请到出处核对一次授权。
- 搜来的素材版权不归你，助手会列出来请你确认；别人的画面成片里会标来源。
- 渲染用 Remotion：个人和三人以下团队免费，更大的团队商用需要买授权。
- Windows 上请把这个文件夹放在不含中文和空格的路径下。
"""
os.makedirs(os.path.dirname(os.path.abspath(a.out)), exist_ok=True); top = "xiaolin-talk-kit/"; n = 0
with zipfile.ZipFile(a.out, "w", zipfile.ZIP_DEFLATED) as z:
    for dst, src in sorted(files.items()): z.write(src, top + dst); n += 1
    for name, text in (("studio/src/index.tsx", INDEX), ("studio/src/episodes/_registry.tsx", REGISTRY), ("AGENTS.md", AGENTS), ("CLAUDE.md", AGENTS), ("README.md", README),
                       (".gitignore", "node_modules/\n__pycache__/\n钥匙.txt\nfonts/active.json\nstudio/out/\nstudio/public/fonts/*.otf\nstudio/public/fonts/*.ttf\nstudio/public/*/person.mp4\nstudio/public/*/voice.wav\nstudio/public/*/footage/\nepisodes/*/01_输入素材/\n")):
        z.writestr(top + name, text); n += 1
    if a.reference and os.path.isdir(a.reference):
        for f in sorted(os.listdir(a.reference)):
            if f.lower().endswith((".jpg", ".png", ".md")): z.write(os.path.join(a.reference, f), top + "reference/" + f); n += 1
print(f"{n} 个文件 → {a.out}（{os.path.getsize(a.out) / 1e6:.1f} MB）")
