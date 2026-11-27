#!/usr/bin/env python3
"""把「小 Lin 风格口播工作流」打成一个能单独用的包：只做财经解读风这一种，带齐去重录去口吃、降噪调光、配乐、找素材（TikHub）、署名、发布包（三版封面加文案）。
用法：python3 scripts/xiaolin_pack.py [--out dist/小Lin风格口播-工作流.zip]
包里带字体（MiSans 三个字重、庞门正道标题体）和八首不用署名的配乐，解压就能出片。横屏竖屏原片都能用，程序自己适配，成片是竖屏。
对方解压后让 AI 助手读 AGENTS.md。"""
import argparse, json, os, zipfile
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); K = os.path.join(R, "kits", "xiaolin"); TOP = "xiaolin-kit/"
ap = argparse.ArgumentParser(); ap.add_argument("--out", default=os.path.join(R, "dist", "小Lin风格口播-工作流.zip")); a = ap.parse_args()
files, texts = {}, {}
def tree(src, dst=None, only=None, skip=()):
    for base, dirs, names in os.walk(os.path.join(R, src)):
        dirs[:] = [d for d in dirs if d not in ("__pycache__", "node_modules", "_tmp")]
        for n in names:
            if n in skip or (only and not n.endswith(only)): continue
            full = os.path.join(base, n); files[os.path.join(dst or src, os.path.relpath(full, os.path.join(R, src))).replace(os.sep, "/")] = full
def one(*paths):
    for f in paths: files[f] = os.path.join(R, f)
tree(".claude/skills/xiaolin-talk"); tree("studio/src/kit", skip=("hud.tsx", "holo.tsx", "fx.tsx", "skin.tsx", "wide.tsx", "widefont.json", "redtop.tsx")); tree("studio/src/components"); tree("studio/src/episodes/talk02"); tree("studio/public/sfx"); tree("docs/reference/xiaolin", "reference")
one("studio/templates/talk.tsx", "studio/package.json", "studio/package-lock.json", "studio/tsconfig.json", "requirements.txt", "fonts/library.json", "fonts/字体包样张.jpg", "styles/components.json", "music/CREDITS.txt",
    "docs/对标拆解-小Lin口播.md", "docs/对标拆解-小Lin口播-第三批.md", "docs/署名规则.md", "docs/aesthetic-rules.md", "docs/口播剪辑-标准流程.md")
one(*[f"scripts/{s}.py" for s in ("doctor", "episode", "talk_prep", "asr", "align", "roughcut", "retakes", "grade", "polish", "soundlib", "fonts", "fontlib", "qc", "talk_check", "faces", "facecheck", "tikhub", "publish_kit", "sign", "skeleton")])
one(*[f"studio/public/fonts/{f}" for f in ("MiSans-Regular.otf", "MiSans-Semibold.otf", "MiSans-Heavy.otf", "MiSans-License.txt", "PangMenZhengDaoBiaoTi.ttf")])
for f in sorted(os.listdir(os.path.join(R, "docs", "steps"))):
    if f.startswith("talk-"): one("docs/steps/" + f)
for f in ("AGENTS.md", "先读我.md", "开工单.html"): files[f] = os.path.join(K, f)
files["CLAUDE.md"] = os.path.join(K, "AGENTS.md")
lib = json.load(open(os.path.join(R, "music", "library.json"), encoding="utf8")); tracks = [t for t in lib["tracks"] if t.get("credit") is None and os.path.exists(os.path.join(R, "music", t["file"]))]
for t in tracks: one("music/" + t["file"])
texts["music/library.json"] = json.dumps({"moods": lib.get("moods"), "tracks": tracks}, ensure_ascii=False, indent=1)
sk = json.load(open(os.path.join(R, "styles", "skeletons.json"), encoding="utf8")); sk["skeletons"] = [x for x in sk["skeletons"] if x["id"] == "xiaolin"]; sk["skeletons"][0]["style"] = ""; texts["styles/skeletons.json"] = json.dumps(sk, ensure_ascii=False, indent=1)
def rd(f): return open(os.path.join(R, f), encoding="utf8").read()
# 这个包里没有 make-talk，最后一步由 xiaolin-talk 负责；署名和封面的默认品牌叫 me（用户自己的）
texts["scripts/episode.py"] = rd("scripts/episode.py").replace('"make-talk", "", "三版封面', '"xiaolin-talk", "", "三版封面'); files.pop("scripts/episode.py")
for s in ("scripts/sign.py", "scripts/publish_kit.py"): texts[s] = rd(s).replace('default="ningshao"', 'default="me"').replace("--brand ningshao", "--brand me").replace('"#F2E26B" if not fp else "#D6FF3D"', '"#F2E26B"'); files.pop(s)     # 封面强调色默认用小 Lin 骨架的金色
texts["studio/src/index.tsx"] = """import React from 'react';
import { Composition, Still, registerRoot } from 'remotion';
import { Registered } from './episodes/_registry';
import { TALK02, talk2Clock } from './episodes/talk02';
import { Talk3Demo, TALK3_DEMO_SEC } from './kit/talk3';
import { SignDemo, signDemoDefault } from './kit/sign';
import { CoverKit, coverDefault } from './kit/coverkit';
// 每期一个 Composition，scripts/episode.py new 会自动登记到 episodes/_registry.tsx。
// TALK02 是版式演示（包里没带它的原片，只用来照抄写法）；TALK3-DEMO 是专属组件演示（能直接渲）；SIGN-DEMO、COVERKIT 由脚本调用。
registerRoot(() => (
  <>
    <Registered />
    <Composition id="TALK02" component={TALK02} width={1080} height={1920} fps={talk2Clock.fps} durationInFrames={Math.ceil(talk2Clock.total * talk2Clock.fps)} />
    <Composition id="TALK3-DEMO" component={Talk3Demo} width={1080} height={1920} fps={30} durationInFrames={TALK3_DEMO_SEC * 30} defaultProps={{}} />
    <Composition id="SIGN-DEMO" component={SignDemo} width={1080} height={1920} fps={30} durationInFrames={900} defaultProps={signDemoDefault} calculateMetadata={({ props }) => ({ width: props.w, height: props.h, durationInFrames: Math.round(props.total * 30) })} />
    <Still id="COVERKIT" component={CoverKit} width={1080} height={1440} defaultProps={coverDefault} calculateMetadata={({ props }) => ({ width: props.w, height: props.h })} />
  </>
));
"""
texts["studio/src/episodes/_registry.tsx"] = "// 自动生成：scripts/episode.py new 会往这里加一行。不要手改。\nimport React from 'react';\nimport { Composition } from 'remotion';\nexport const Registered: React.FC = () => (\n  <>\n  </>\n);\n"
texts[".gitignore"] = "node_modules/\n__pycache__/\n钥匙.txt\nfonts/active.json\nstudio/out/\nstudio/public/ep*/\nstudio/public/pub-*/\nepisodes/\nbrands/\n"
miss = [v for v in files.values() if not os.path.exists(v)]
if miss: raise SystemExit("缺文件：" + "，".join(miss))
os.makedirs(os.path.dirname(os.path.abspath(a.out)), exist_ok=True)
with zipfile.ZipFile(a.out, "w", zipfile.ZIP_DEFLATED) as z:
    for dst, src in sorted(files.items()): z.write(src, TOP + dst)
    for dst, t in texts.items(): z.writestr(TOP + dst, t)
print(f"{len(files) + len(texts)} 个文件 → {a.out}（{os.path.getsize(a.out) / 1e6:.1f} MB）；配乐 {len(tracks)} 首，字体 4 款")
