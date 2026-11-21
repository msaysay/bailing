#!/usr/bin/env python3
"""按官网的分法把整套工作流打成一个个下载包，并写出官网要用的下载清单。
用法：python3 scripts/release.py
产出：
  dist/release/free/        免费开源的四个包（同时拷一份到 site/downloads/，官网的下载按钮指向这里）
  dist/release/community/   社群里发的七个包（不放到官网上）
  dist/release/下载对照表.md  官网上每个按钮对应哪个文件、里面有什么、放在哪
  site/downloads.js         官网读的清单（包名、说明、文件名、大小）
分法改这里的 PKGS。每个包里都有一份「说明-先读我.md」，写着它对应官网哪个按钮。"""
import os, shutil, subprocess, sys, json, zipfile
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); PY = sys.executable; OUT = os.path.join(R, "dist", "release"); SITE_DL = os.path.join(R, "site", "downloads")
for d in (os.path.join(OUT, "free"), os.path.join(OUT, "community"), SITE_DL): shutil.rmtree(d, ignore_errors=True); os.makedirs(d)
def run(*cmd): subprocess.run([PY, *cmd], cwd=R, check=True, capture_output=True)
def walk(src, skip=("__pycache__", "node_modules", "_tmp")):
    for base, dirs, names in os.walk(os.path.join(R, src)):
        dirs[:] = [d for d in dirs if d not in skip]
        for n in names: yield os.path.relpath(os.path.join(base, n), R).replace(os.sep, "/")
def make(path, top, items, texts):
    """items：仓库里的文件或目录（原路径放进包里）；texts：{包内路径: 文字}。"""
    n = 0; seen = set()
    with zipfile.ZipFile(path, "w", zipfile.ZIP_DEFLATED) as z:
        for it in items:
            full = os.path.join(R, it)
            for f in (walk(it) if os.path.isdir(full) else [it] if os.path.exists(full) else []):
                if f not in seen and f not in texts: seen.add(f); z.write(os.path.join(R, f), top + f); n += 1
        for k, v in texts.items(): z.writestr(top + k, v); n += 1
    return n
def note(zip_path, top, text):
    with zipfile.ZipFile(zip_path, "a", zipfile.ZIP_DEFLATED) as z: z.writestr(top + "说明-先读我.md", text)
STUDIO_BASE = ["studio/package.json", "studio/package-lock.json", "studio/tsconfig.json", "studio/public/fonts/MiSans-License.txt", "studio/src/kit/kit.tsx", "studio/src/kit/clock.ts", "studio/src/kit/motion.ts", "studio/src/kit/chrome.tsx", "studio/src/kit/footage.tsx", "studio/src/kit/fontpack.json"]
SOUND = ["scripts/polish.py", "scripts/soundlib.py", "scripts/grade.py", "scripts/retakes.py", "scripts/fonts.py", "scripts/fontlib.py", "fonts/library.json", "fonts/字体包样张.jpg", "requirements.txt"]
GALLERY_INDEX = """import React from 'react';
import { Composition, registerRoot } from 'remotion';
import { Gallery, GFPS } from './gallery';
import { CATALOG, SLOT } from './gallery/all';
// 组件演示片：每个组件 5 秒。渲染：npx remotion render src/index.tsx GALLERY out/gallery.mp4
registerRoot(() => <Composition id="GALLERY" component={Gallery} width={1920} height={1080} fps={GFPS} durationInFrames={CATALOG.length * SLOT * GFPS} />);
"""
def head(button, tier, body): return f"# {button}\n\n- 对应官网按钮：**{button}**\n- 档位：{tier}\n\n{body}\n"
def catalog_md(files):
    """从官网的组件数据里取出这几个文件的组件，排成一张目录表。"""
    raw = open(os.path.join(R, "site", "data.js"), encoding="utf-8").read(); comps = json.loads(raw[raw.index("{"):raw.rindex("}") + 1])["components"]
    rows = [c for c in comps if c["file"].split("/")[-1].replace(".tsx", "") in files]
    out = [f"# 基础组件目录（{len(rows)} 个）", "", "| 编号 | 名称 | 导出名 | 文件 | 什么时候用 | 别用在 | 参数 |", "|---|---|---|---|---|---|---|"]
    return "\n".join(out + [f"| {c['id']} | {c['name']} | `{c['export']}` | {c['file']} | {c['use']} | {c['avoid']} | {c['props']} |" for c in rows]) + "\n"
PKGS = []   # (档位, 编号, 官网按钮名, 文件名, 一句话说明, 包里有什么)
def add(tier, code, name, file, desc, inside): PKGS.append({"tier": tier, "code": code, "name": name, "file": file, "desc": desc, "inside": inside, "path": os.path.join(OUT, "free" if tier == "free" else "community", file)})

# ———— 免费 ————
add("free", "F1", "财经解读风 · 口播工作流", "F1-财经解读风-口播工作流.zip", "竖屏口播，对标小 Lin。从粗剪到成片整条流程，带降噪、调光、配乐、字体和 56 个基础组件。", "技能 xiaolin-talk；粗剪、声音、自查脚本；版式引擎 talk2；演示工程；56 个基础组件；字体库目录；对标参考图")
run("scripts/talk_pack.py", "--out", PKGS[-1]["path"]); note(PKGS[-1]["path"], "xiaolin-talk-kit/", head("下载「财经解读风 · 口播工作流」", "免费开源", "解压后让 AI 助手先读 `AGENTS.md`。想要另外四种风格、全部 298 个组件和不出镜的生产线，见官网的社群入口。"))
add("free", "F2", "横屏深度解读风 · 长视频工作流", "F2-横屏深度解读风-长视频工作流.zip", "横屏 3:2 长视频，对标子祺见微。章节导航、素材窗、数据面板、金色标题卡，同样带全部通用功能。", "技能 ziqi-wide；粗剪、声音、自查脚本；版式引擎 wide；演示工程；56 个基础组件；字体库目录；对标参考图")
run("scripts/wide_pack.py", "--out", PKGS[-1]["path"]); note(PKGS[-1]["path"], "ziqi-wide-kit/", head("下载「横屏深度解读风 · 长视频工作流」", "免费开源", "解压后让 AI 助手先读 `AGENTS.md`。"))
add("free", "F3", "基础组件库 · 56 个", "F3-基础组件库-56个.zip", "图表、文字强调、关系流程、图片视频四组动效组件的源码，可以单独拿去用在自己的 Remotion 工程里。", "studio/src/components 里的 charts、type、flow、media 四个文件；kit 底层；四组的组件目录（名称、适用、不适用、参数）")
make(PKGS[-1]["path"], "components-free/", STUDIO_BASE + [f"studio/src/components/{f}.tsx" for f in ("charts", "type", "flow", "media")],
     {"组件目录.md": catalog_md(("charts", "type", "flow", "media")), "说明-先读我.md": head("下载「基础组件库 · 56 个」", "免费开源", "四组组件：图片视频 10 个、数据图表 15 个、文字强调 16 个、关系流程 15 个。\n\n- 源码在 `studio/src/components/`，每个组件上面有一行说明。\n- 每个组件什么时候用、别用在哪、有哪些参数，写在 `组件目录.md` 里。\n- 用法：`cd studio && npm install`，在自己的合成里 `import { 组件名 } from './components/charts'`。时间用秒传进去。\n- 全部 298 个组件（网页、录屏、口播叠加、特效、广播风、系列叙事等）和可渲染的演示片在社群包 C6 里。")})
add("free", "F4", "头部博主拆解文档", "F4-头部博主拆解文档.zip", "小 Lin、子祺见微等对标片的逐帧拆解：版式占比、切换节奏、字幕位置、稿子结构，以及六种风格共用的标准流程。", "docs 下的四篇对标拆解、口播剪辑标准流程、对标参考联系表")
make(PKGS[-1]["path"], "teardown/", ["docs/对标拆解-小Lin口播.md", "docs/对标拆解-子祺见微.md", "docs/对标拆解-AfterJensen.md", "docs/对标拆解-AI员工上岗.md", "docs/口播剪辑-标准流程.md", "docs/reference"], {"说明-先读我.md": head("下载「头部博主拆解文档」", "免费开源", "Markdown 文档，任何编辑器都能看。`docs/reference/` 里是对标片每两秒一格的联系表，只作学习参考。")})

# ———— 社群 ————
add("paid", "C0", "全量包", "C0-全量包-六种风格加两条生产线.zip", "整套工作流：六种风格、口播和纯内容生产两条线、298 个组件、全部脚本和文档。拿这一个就够。", "仓库里除第三方参考代码以外的全部")
run("scripts/pack_all.py", "--out", PKGS[-1]["path"]); note(PKGS[-1]["path"], "video-studio/", head("社群：全量包", "社群", "解压后让 AI 助手先读 `CLAUDE.md`（或 `AGENTS.md`），说「我想做一条视频」。下面 C1 到 C6 是从这个包里拆出来的单包，拿了全量包就不用再拿。"))
add("paid", "C1", "知识科普风", "C1-知识科普风.zip", "对标张展鹏。一套楷体，插画加跟着头走的头像、论文卡、黑底金句。", "技能 zhanpeng-talk；zp.py 和 zplib；模板 studio/src/zhanpeng；样例")
run("scripts/zp_pack.py", "--out", PKGS[-1]["path"]); note(PKGS[-1]["path"], "zhanpeng-talk-kit/", head("社群：知识科普风", "社群", "解压后让 AI 助手先读 `AGENTS.md`。"))
add("paid", "C2", "相框老板风", "C2-相框老板风.zip", "企业老板、创始人口播。固定品牌相框，十三种生成卡片，自带口误检测、降噪、配乐、封面。", "技能 frame-talk；frame_*.py；模板 studio/src/yuedu；品牌包样例；样片工程")
run("scripts/frame_pack.py", PKGS[-1]["path"]); note(PKGS[-1]["path"], "yuedu-video-kit/", head("社群：相框老板风", "社群", "解压后让 AI 助手先读 `AGENTS.md`。包里的品牌包 `brands/yuedu/` 是样例，换成自己公司的做法见 `.claude/skills/frame-talk/SKILL.md`。"))
add("paid", "C3", "商业快节奏风", "C3-商业快节奏风.zip", "对标蛋解创业。藏青底，金色重点词、清单、章节角标、数据面板，HTML 动效合成。", "cutflow 整个目录；技能 danjie-cut；长期规则；通用的降噪调光配乐和字体脚本")
make(PKGS[-1]["path"], "danjie-cut-kit/", ["cutflow", ".claude/skills/danjie-cut", "brands/danjie"] + SOUND, {"说明-先读我.md": head("社群：商业快节奏风", "社群", "解压后让 AI 助手先读 `cutflow/SKILL.md`。项目目录放在哪都行，命令在 `cutflow/` 下运行。")})
add("paid", "C4", "访谈纪实风", "C4-访谈纪实风.zip", "访谈、人物采访。口播和满屏空镜交替，自带声学去口吃、降噪、配乐匹配和一键换配乐。", "技能 tiantu-interview-cut（说明、规范、全部脚本）；通用的调光和字体脚本")
make(PKGS[-1]["path"], "interview-cut-kit/", [".claude/skills/tiantu-interview-cut"] + SOUND, {"说明-先读我.md": head("社群：访谈纪实风", "社群", "解压后让 AI 助手先读 `.claude/skills/tiantu-interview-cut/SKILL.md`。标志放 `assets/brand/logo.png`，片尾标语写在 plan.json 的 `brand.slogan` 里。")})
add("paid", "C5", "纯内容生产线（不出镜）", "C5-纯内容生产线-不出镜.zip", "给一个题目，出一条横屏解读片：写稿核对事实、配音、找画面、用组件做动效、封面。含频道宠物。", "技能 video-start、make-news、pet；配音、对齐、找素材、自查脚本；全部 298 个组件和演示；分步说明")
NEWS = [".claude/skills/video-start", ".claude/skills/make-news", ".claude/skills/pet", "docs/流程总览.md", "docs/aesthetic-rules.md", "docs/宠物成长规则.md", "docs/新手使用说明.html", "pet", "studio/src/kit", "studio/src/components", "studio/src/gallery", "studio/public/gallery", "studio/public/sfx", "studio/templates/news.tsx", "studio/tools", "fonts/library.json", "requirements.txt"] + STUDIO_BASE[:4] + [f"docs/steps/{f}" for f in sorted(os.listdir(os.path.join(R, "docs", "steps"))) if f.startswith(("video-", "pet-"))] + [f"scripts/{f}.py" for f in ("doctor", "episode", "voice", "tts", "asr", "align", "tikhub", "qc", "faces", "facecheck", "seg_render", "commons", "pet", "build_pack", "fonts", "fontlib", "polish", "soundlib", "grade")]
NEWS_INDEX = GALLERY_INDEX.replace("import { Gallery, GFPS } from './gallery';", "import { Gallery, GFPS } from './gallery';\nimport { Registered } from './episodes/_registry';").replace("registerRoot(() => <Composition", "// 每期一个 Composition，scripts/episode.py new 会自动登记到 episodes/_registry.tsx。\nregisterRoot(() => <><Registered /><Composition").replace("durationInFrames={CATALOG.length * SLOT * GFPS} />);", "durationInFrames={CATALOG.length * SLOT * GFPS} /></>);")
REG = "// 自动生成：scripts/episode.py new 会往这里加一行。不要手改。\nimport React from 'react';\nimport { Composition } from 'remotion';\nexport const Registered: React.FC = () => (\n  <>\n  </>\n);\n"
make(PKGS[-1]["path"], "news-line-kit/", NEWS, {"studio/src/index.tsx": NEWS_INDEX, "studio/src/episodes/_registry.tsx": REG, "CLAUDE.md": open(os.path.join(R, "CLAUDE.md"), encoding="utf-8").read(), "AGENTS.md": open(os.path.join(R, "AGENTS.md"), encoding="utf-8").read(),
     "说明-先读我.md": head("社群：纯内容生产线（不出镜）", "社群", "解压后让 AI 助手先读 `CLAUDE.md`，说「我想做一条不出镜的视频，讲……」。它会用技能 `video-start` 和 `make-news` 带你走五步：稿子、声音、素材、做片、封面。\n\n这个包只有不出镜这条线。口播剪辑在免费包 F1、F2 和社群包 C1 到 C4 里；全都要就拿 C0。")})
add("paid", "C6", "完整组件库 · 298 个", "C6-完整组件库-298个.zip", "全部 298 个动效组件的源码和组件目录，带可以直接渲染的演示片工程。", "studio/src/components 全部；kit；gallery（组件目录和演示）；演示素材")
make(PKGS[-1]["path"], "components-all/", STUDIO_BASE + ["studio/src/kit", "studio/src/components", "studio/src/gallery", "studio/public/gallery", "studio/public/sfx", "scripts/build_pack.py"], {"studio/src/index.tsx": GALLERY_INDEX,
     "说明-先读我.md": head("社群：完整组件库 · 298 个", "社群", "- 源码：`studio/src/components/`；组件目录（名称、适用、不适用、参数）：`studio/src/gallery/catalog*.tsx`。\n- 看全部演示：`cd studio && npm install && npx remotion render src/index.tsx GALLERY out/gallery.mp4`（约 25 分钟的演示片，每个组件 5 秒）。\n- 字体：MiSans 三个字重放进 `studio/public/fonts/`（小米官网免费下载）。")})

# ———— 清单 ————
def size(p): return f"{os.path.getsize(p) / 1e6:.1f} MB"
for p in PKGS:
    p["size"] = size(p["path"])
    if p["tier"] == "free": shutil.copy2(p["path"], os.path.join(SITE_DL, p["file"]))
js = {t: [{k: p[k] for k in ("code", "name", "desc", "file", "size")} for p in PKGS if p["tier"] == t] for t in ("free", "paid")}
open(os.path.join(R, "site", "downloads.js"), "w", encoding="utf-8").write("// 由 scripts/release.py 生成，不要手改。\nwindow.SITE_DL = " + json.dumps(js, ensure_ascii=False, indent=1) + ";\n")
md = ["# 下载对照表", "", "官网上每个按钮对应哪个文件。由 `scripts/release.py` 生成，改分法改那个脚本里的 PKGS 再重跑。", "",
      "## 免费开源（官网「免费下载」区，按钮直接下载）", "", "文件放在 `site/downloads/`，和官网一起上线。同样的文件在 `dist/release/free/` 里也有一份。", "",
      "| 编号 | 官网按钮 | 文件 | 大小 | 包里有什么 |", "|---|---|---|---|---|"]
md += [f"| {p['code']} | {p['name']} | `site/downloads/{p['file']}` | {p['size']} | {p['inside']} |" for p in PKGS if p["tier"] == "free"]
md += ["", "## 社群（官网「社群里拿」区，按钮跳到社群入口，不提供下载）", "", "文件在 `dist/release/community/`，**不要放到官网上**，在社群里发。", "",
       "| 编号 | 官网卡片 | 文件 | 大小 | 包里有什么 |", "|---|---|---|---|---|"]
md += [f"| {p['code']} | {p['name']} | `dist/release/community/{p['file']}` | {p['size']} | {p['inside']} |" for p in PKGS if p["tier"] == "paid"]
md += ["", "## 每个流程步骤对应的技能和档位", "", "官网「两条生产线」那一块显示的就是这张表（数据在 `site/app.js` 的 PIPES 里）。", "",
       "| 流程 | 技能或脚本 | 档位 | 在哪个包里 |", "|---|---|---|---|",
       "| 口播 · 财经解读风 | xiaolin-talk | 免费 | F1 |", "| 口播 · 横屏深度解读风 | ziqi-wide | 免费 | F2 |",
       "| 口播 · 粗剪、去重录口吃 | talk_prep、retakes | 免费 | F1、F2 |", "| 口播 · 降噪、调光、配乐 | polish、grade | 免费 | F1、F2 |",
       "| 口播 · 字体 | fonts（59 款、23 套） | 免费 | F1、F2 |", "| 口播 · 自查 | qc、talk_check、wide_check | 免费 | F1、F2 |",
       "| 口播 · 六种风格总入口 | make-talk | 社群 | C0 |", "| 口播 · 知识科普风 | zhanpeng-talk | 社群 | C1、C0 |", "| 口播 · 相框老板风 | frame-talk | 社群 | C2、C0 |",
       "| 口播 · 商业快节奏风 | danjie-cut | 社群 | C3、C0 |", "| 口播 · 访谈纪实风 | tiantu-interview-cut | 社群 | C4、C0 |",
       "| 纯内容生产 · 入口 | video-start | 社群 | C5、C0 |", "| 纯内容生产 · 稿子、声音、素材、做片、封面 | make-news、voice、tts、tikhub | 社群 | C5、C0 |",
       "| 纯内容生产 · 频道宠物 | pet | 社群 | C5、C0 |", "| 组件 · 基础 56 个 | charts、type、flow、media | 免费 | F1、F2、F3 |", "| 组件 · 全部 298 个 | 全部组件文件 | 社群 | C6、C5、C0 |",
       "", "## 上线前要你确认的", "",
       "1. `site/config.js` 里填社群入口（二维码图片或文字）和品牌名。",
       "2. 社群包 C2、C4 里带着给客户做时用的品牌件（约读书房的底图和标志；访谈纪实风的片尾默认标语），发之前确认客户同意，或者换成通用的。",
       "3. 免费包 F1、F2、F4 里的 `reference/` 是对标博主成片的截图，你已确认可以放。",
       "4. 官网首屏的片子和「三种剪法」里有蛋解创业的画面，上线前和他确认一下。"]
open(os.path.join(OUT, "下载对照表.md"), "w", encoding="utf-8").write("\n".join(md) + "\n")
for p in PKGS: print(f"{p['code']}  {p['size']:>9}  {p['file']}")
print("对照表 → dist/release/下载对照表.md；官网清单 → site/downloads.js；免费包已拷到 site/downloads/")
