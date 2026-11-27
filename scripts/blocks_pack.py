#!/usr/bin/env python3
"""按积木清单（packs/blocks.json）把整套工作流拆成三类包：底层包、组件包、风格包（每种风格一个，带它自己的字体），外加几个可选扩展。
用法：python3 scripts/blocks_pack.py [--out dist/积木]
所有包解压到同一个 video-studio 文件夹里合并。想改拆法：改 packs/blocks.json 再跑一遍。每个包里的 packs/清单/<包名>.txt 列着它带了哪些文件。"""
import argparse, json, os, sys, zipfile
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); TOP = "video-studio/"
ap = argparse.ArgumentParser(); ap.add_argument("--out", default=os.path.join(R, "dist", "积木")); a = ap.parse_args()
B = json.load(open(os.path.join(R, "packs", "blocks.json"), encoding="utf8")); sys.path.insert(0, os.path.join(R, "scripts")); import fontlib as fl
L = fl.lib(); FD = "studio/public/fonts/"; os.makedirs(os.path.join(a.out, "3-风格包"), exist_ok=True)
SKIP = ("__pycache__", "node_modules", "_tmp", ".DS_Store")
def expand(items):
    out = {}
    for it in items:
        full = os.path.join(R, it)
        if os.path.isdir(full):
            for base, dirs, names in os.walk(full):
                dirs[:] = [d for d in dirs if d not in SKIP]
                for n in names:
                    if n not in SKIP and not n.endswith(".pyc"): f = os.path.join(base, n); out[os.path.relpath(f, R).replace(os.sep, "/")] = f
        elif os.path.exists(full): out[it] = full
        else: print("  （清单里有、仓库里没有，跳过）", it)
    return out
def style_fonts(st):
    ids = set(L["packs"][L["styles"][st["fonts"]]["default"]]["roles"].values()) if st.get("fonts") else set(); fs = [L["fonts"][i]["file"] for i in ids] + st.get("font_files", [])
    return {FD + f: os.path.join(R, FD + f) for f in fs if os.path.exists(os.path.join(R, FD + f))}
def write(path, files, texts, pack_id, title):
    listing = f"# {title}\n# 这个包带的文件（相对 video-studio 文件夹）。卸掉这个包 = 删掉这些文件。\n" + "\n".join(sorted(list(files) + list(texts))) + "\n"
    with zipfile.ZipFile(path, "w", zipfile.ZIP_DEFLATED) as z:
        for dst, src in sorted(files.items()): z.write(src, TOP + dst)
        for dst, t in texts.items(): z.writestr(TOP + dst, t)
        z.writestr(TOP + f"packs/清单/{pack_id}.txt", listing)
    return len(files) + len(texts) + 1, os.path.getsize(path) / 1e6
rd = lambda f: open(os.path.join(R, f), encoding="utf8").read()
rows = []; used_fonts = {FD + f for f in os.listdir(os.path.join(R, FD)) if f.startswith("MiSans")}
# —— 1 底层包 ——
base = B["base"]; files = expand([x for g in base["groups"].values() for x in g]); lib = json.load(open(os.path.join(R, "music", "library.json"), encoding="utf8"))
free = [t for t in lib["tracks"] if t.get("credit") is None and os.path.exists(os.path.join(R, "music", t["file"]))]; paid = [t for t in lib["tracks"] if t.get("credit") is not None and os.path.exists(os.path.join(R, "music", t["file"]))]
for t in free: files["music/" + t["file"]] = os.path.join(R, "music", t["file"])
texts = {"music/library.json": json.dumps({"moods": lib.get("moods"), "tracks": free}, ensure_ascii=False, indent=1), "studio/src/index.tsx": rd("kits/base/index.tsx"),
         "studio/src/episodes/_registry.tsx": "// 自动生成：scripts/episode.py new 会往这里加一行。不要手改。\nimport React from 'react';\nimport { Composition } from 'remotion';\nexport const Registered: React.FC = () => (\n  <>\n  </>\n);\n",
         "AGENTS.md": rd("kits/base/AGENTS.md"), "CLAUDE.md": rd("kits/base/AGENTS.md"), "先读我.md": rd("kits/base/先读我.md"), "packs/blocks.json": rd("packs/blocks.json"),
         ".gitignore": "node_modules/\n__pycache__/\n钥匙.txt\nfonts/active.json\nstudio/out/\nstudio/public/ep*/\nstudio/public/rt*/\nstudio/public/pub-*/\nepisodes/*/01_输入素材/\nepisodes/*/03_制作过程/_tmp/\nepisodes/*/out/\n"}
for s in ("scripts/sign.py", "scripts/publish_kit.py"): texts[s] = rd(s).replace('default="ningshao"', 'default="me"').replace("--brand ningshao", "--brand me"); files.pop(s)      # 署名和封面的默认品牌叫 me（用户自己的）
n, mb = write(os.path.join(a.out, base["file"]), files, texts, "底层包", base["name"]); rows.append((base["file"], base["name"], "必装", base["intro"], n, mb))
# —— 2 组件包 ——
c = B["components"]; n, mb = write(os.path.join(a.out, c["file"]), expand(c["files"]), {}, "组件包", c["name"]); rows.append((c["file"], c["name"], "不出镜解读片必装，其余按需", c["intro"], n, mb))
# —— 3 风格包 ——
for st in B["styles"]:
    files = expand(st["files"]); ff = style_fonts(st); files.update(ff); used_fonts |= set(ff); fn = f"3-风格包/风格-{st['name']}.zip"; need = "、".join({"base": "底层包", "components": "组件包"}[x] for x in st["needs"])
    n, mb = write(os.path.join(a.out, fn), files, {}, "风格-" + st["id"], st["name"]); rows.append((fn, st["name"], "要先装：" + need, f"带字体 {len(ff)} 款" if ff else "不带字体（用底层的 MiSans）", n, mb))
# —— 4 可选扩展 ——
for ex in B["extras"]:
    if ex["id"] == "fonts-all": files = {FD + L["fonts"][i]["file"]: os.path.join(R, FD + L["fonts"][i]["file"]) for i in L["fonts"] if fl.installed(i) and FD + L["fonts"][i]["file"] not in used_fonts}; texts = {}
    elif ex["id"] == "music-all": files = {"music/" + t["file"]: os.path.join(R, "music", t["file"]) for t in paid}; texts = {"music/library.json": json.dumps(lib, ensure_ascii=False, indent=1)}
    else: files = expand(ex["files"]); texts = {}
    n, mb = write(os.path.join(a.out, ex["file"]), files, texts, ex["id"], ex["name"]); rows.append((ex["file"], ex["name"], "可选", ex["intro"], n, mb))
md = ["# 积木拼装说明", "", "整套工作流拆成三类包，外加几个可选扩展。**所有包解压到同一个地方，合并成一个 `video-studio` 文件夹**（同名文件覆盖）。", "",
      "| 文件 | 是什么 | 要不要装 | 说明 | 文件数 | 大小 |", "|---|---|---|---|---|---|"] + [f"| {f} | {nm} | {need} | {intro} | {n} | {mb:.1f} MB |" for f, nm, need, intro, n, mb in rows]
md += ["", "## 怎么拼", "", "1. 先解压「1-底层包」，得到 `video-studio` 文件夹。", "2. 想做哪种风格，就把那个风格包解压到同一个位置合并进去。可以装一种，也可以装好几种。", "3. 做不出镜的解读片：再合并「2-组件包」。口播风格要用图表、流程这类组件时也合并它。",
       "4. 用 AI 助手打开 `video-studio`，说「读 AGENTS.md，我想做一条视频」。它会先装环境，并按现在装了哪些风格刷新开工单。", "", "装了哪些风格是自动识别的：风格包解压进去就出现，删掉就消失，不用改任何配置。",
       "", "## 例子", "", "- 只给一群人用小 Lin 风格：底层包 + 风格-财经解读风 （想用全部图表组件再加组件包）。", "- 只做不出镜的新闻解读：底层包 + 组件包 + 风格-横屏新闻解读。", "- 全都要：全部解压合并。",
       "", "## 以后怎么改", "", "- **拆法写在 `packs/blocks.json`**（底层包里也带了一份）：每个包带哪些文件一目了然。改这个文件，再跑 `python3 scripts/blocks_pack.py`，包就按新拆法重打。", "- 每个包里有一份 `packs/清单/<包名>.txt`，列着它带的全部文件。卸掉一个包就是删掉清单里的文件。",
       "- **加一种新风格**要准备这几样，然后在 `blocks.json` 的 styles 里加一段：", "  1. 操作说明 `.claude/skills/<风格>/SKILL.md`", "  2. 画面引擎或模板（`studio/src/kit/<风格>.tsx` 或 `studio/templates/<风格>.tsx`），有自己合成的再加一个 `studio/src/packs/<风格>.tsx` 登记",
       "  3. 拆解文档和对标联系表（`docs/对标拆解-*.md`、`docs/reference/<风格>/`）", "  4. 一张样图 `styles/previews/<风格>.jpg`，并在 `styles/skeletons.json` 里登记这个风格锁死什么、能换什么", "  5. 它要的字体（`fonts` 写字体库里的风格名，或 `font_files` 直接列文件）",
       "- 底层包里的分组（入口和引导、粗剪、声音和画面修整、找素材、署名和发布包、字体工具、工程底座）只是给人看的归类，打出来还是一个包。", "",
       "## 不在包里的", "", "- 语音识别模型、人脸检测模型：第一次装环境时自动下载（约 250MB）。", "- 官网和视觉图鉴网页：是给人看的展示页，不属于工作流。", "- 手势全息风、风格皮肤引擎：试验功能，没有打包。", "- 原片、成片、你自己的品牌素材。", ""]
open(os.path.join(a.out, "0-拼装说明.md"), "w", encoding="utf8").write("\n".join(md))
for f, nm, need, intro, n, mb in rows: print(f"{mb:7.1f} MB  {n:4d} 个文件  {f}")
print("说明：", os.path.join(a.out, "0-拼装说明.md"))
