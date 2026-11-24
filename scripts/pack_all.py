#!/usr/bin/env python3
"""把整套内容创作工作流打成一个压缩包：全部技能、脚本、版式引擎、组件库、字体库目录、文档和样例。
用法：python3 scripts/pack_all.py [--out dist/video-studio-all.zip] [--with-vendor] [--fonts none|default|all] [--no-site] [--fonts-only-rest 字体扩展包.zip]
  --fonts  把已经装好的字体文件也带上（studio/public/fonts/）：default 是六种风格原配用到的那些（解压就能出片，不用再下载），all 是字体库全部 59 款。
           没装的先跑 python3 scripts/fonts.py install all。
  --no-site  不带官网目录（自己用工作流时用不到）。
  --fonts-only-rest  另外打一个只装「default 以外的字体」的扩展包，解压到同一个目录就补齐全部字体。
配乐库 music/ 里现有的曲子都会带上（包括不进仓库的那些下载曲）。
包里是仓库里登记过的所有文件（和还没提交的新文件），不含：视频、字体文件、模型、node_modules、钥匙.txt，
以及 vendor/（第三方参考代码，约 58 MB，做片子用不到；要带上加 --with-vendor）。
对方解压后让助手先读 CLAUDE.md 或 AGENTS.md，说「我想做一条视频」就行。"""
import argparse, os, subprocess, zipfile
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ap = argparse.ArgumentParser(); ap.add_argument("--out", default=os.path.join(R, "dist", "video-studio-all.zip")); ap.add_argument("--with-vendor", action="store_true"); ap.add_argument("--fonts", default="none", choices=["none", "default", "all"]); ap.add_argument("--no-site", action="store_true"); ap.add_argument("--fonts-only-rest"); a = ap.parse_args()
ls = subprocess.run(["git", "-c", "core.quotepath=off", "ls-files", "-z", "--cached", "--others", "--exclude-standard"], cwd=R, capture_output=True).stdout.decode("utf-8").split("\0")
files = [f for f in ls if f and os.path.isfile(os.path.join(R, f)) and (a.with_vendor or not f.startswith("vendor/")) and not f.startswith(("dist/", "site/downloads/"))]
if a.no_site: files = [f for f in files if not f.startswith("site/")]
files = sorted(set(files) | {os.path.relpath(os.path.join(b, n), R).replace(os.sep, "/") for b, _, ns in os.walk(os.path.join(R, "music")) for n in ns if n.endswith((".mp3", ".json", ".txt"))})
import json, sys
sys.path.insert(0, os.path.join(R, "scripts")); import fontlib as fl
L = fl.lib(); FD = "studio/public/fonts/"
dflt = {f for s in L["styles"].values() for f in L["packs"][s["default"]]["roles"].values()} | {"misans-regular", "misans-semibold", "misans-heavy", "source-serif-medium", "source-serif-bold", "source-serif-heavy", "smiley", "harmony-bold", "siyuan-song-light", "siyuan-hei-heavy", "ddin-bold", "zcool-huangyou", "youshe-hei", "mashan", "shuhei", "chill-kai", "wenkai", "wenkai-bold", "siyuan-song-semibold", "siyuan-song-black", "pangmen-biaoti"}
have = lambda ids: [FD + L["fonts"][i]["file"] for i in ids if fl.installed(i)]
if a.fonts != "none": files = sorted(set(files) | set(have(dflt if a.fonts == "default" else L["fonts"])))
os.makedirs(os.path.dirname(os.path.abspath(a.out)), exist_ok=True); top = "video-studio/"; by = {}
README = """# AI 剪辑工作流 · 先读我（给人看的）

这是一个交给 AI 助手的文件夹，不是点开就用的软件。

## 怎么用

1. 解压。电脑上要有 Python 3.10 以上、Node.js 18 以上、ffmpeg。没有也行，让 AI 帮你装。
2. 用能读文件、能跑命令的 AI 助手打开这个 `video-studio` 文件夹：Claude Code、Codex、Cursor、Trae、Windsurf 都可以。
3. 对它说这一句：

   > 读 AGENTS.md，我想做一条视频。

   它会先查环境，然后一次问你一个选择题（出不出镜、发在哪、讲什么……），你回数字就行。
4. 做完它会一起交：成片、三版封面、三个标题、简介、话题。

## 想一步到位

> 读 AGENTS.md，把这条口播剪成成片。不用问我，一路做到底，最后告诉我剪掉了什么、哪些要我看一眼。

## 找网上的画面

要用新闻画面、案例画面时，它会提醒你接 TikHub（tikhub.io，按次计费）。把那串 Token 存进这个文件夹最外层的「钥匙.txt」，不要发在聊天里。不接也行，自己给视频链接或文件。

## 字体

这个包带了每个骨架原配的字体，解压就能出片。想换别的字体，把「字体扩展包」解压到同一个位置（合并 `video-studio` 文件夹）。

## 文件夹里有什么

- `AGENTS.md` / `CLAUDE.md`：写给 AI 看的总说明（内容一样）
- `.claude/skills/`：每一步的详细做法（这个文件夹名字以点开头，有的系统默认隐藏）
- `scripts/`：工具　`studio/`：出画面的工程　`styles/`：骨架和组合规矩　`fonts/` `music/`：字体目录和配乐库
- `docs/`：流程说明和对标拆解
"""
if a.fonts_only_rest:
    rest = have([i for i in L["fonts"] if i not in dflt])
    with zipfile.ZipFile(a.fonts_only_rest, "w", zipfile.ZIP_DEFLATED) as z:
        for f in rest: z.write(os.path.join(R, f), top + f)
        z.writestr(top + "字体扩展包-说明.md", f"# 字体扩展包\n\n这里是字体库里除默认字体以外的 {len(rest)} 款。解压到和完整工作流同一个位置（合并 video-studio 文件夹），字体就齐了，之后换字体包不用再联网下载。\n看有哪些字体包：`python3 scripts/fonts.py list`；出样张：`python3 scripts/fonts.py preview`。\n")
    print(f"字体扩展包：{len(rest)} 款 → {a.fonts_only_rest}（{os.path.getsize(a.fonts_only_rest) / 1e6:.1f} MB）")
with zipfile.ZipFile(a.out, "w", zipfile.ZIP_DEFLATED) as z:
    for f in sorted(files): z.write(os.path.join(R, f), top + f); k = f.split("/")[0]; by[k] = by.get(k, 0) + 1
    z.writestr(top + "先读我.md", README)
print(f"{len(files)} 个文件 → {a.out}（{os.path.getsize(a.out) / 1e6:.1f} MB）")
print("  " + "，".join(f"{k} {v}" for k, v in sorted(by.items(), key=lambda x: -x[1])[:12]))
