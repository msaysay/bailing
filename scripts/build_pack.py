#!/usr/bin/env python3
"""把组件库打成一个可以单独交付的包。
用法：scripts/build_pack.py <演示片 gallery.mp4> <输出目录>
先渲演示片：cd studio && npx remotion render src/index.tsx GALLERY out/gallery.mp4
包里有：
  组件说明.md        每个组件的名称、适用、不适用、参数、所在文件、演示视频
  catalog.json       同样的内容，给程序和 AI 读
  demos/<编号>-<名称>.mp4   每个组件 5 秒的演示
  code/<编号>-<导出名>.tsx  每个组件单独摘出来的代码（阅读用）
  src/               可运行的完整源码：kit、components、gallery
  组件总览.jpg        所有组件的末态拼图
组件目录的事实源是 studio/src/gallery/catalog*.tsx（合并顺序见 all.ts），这里只做解析和打包。"""
import json, os, re, shutil, subprocess, sys
gallery, out = sys.argv[1], sys.argv[2]; root = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); S = os.path.join(root, "studio", "src")
G = os.path.join(S, "gallery")
# 顺序和 gallery/all.ts 一致：先 catalog.tsx，再 catalog-b、-c…… 按文件名排
files = ["catalog.tsx"] + sorted(f for f in os.listdir(G) if re.fullmatch(r"catalog-.+\.tsx", f))
slot = int(re.search(r"export const SLOT = (\d+)", open(os.path.join(G, "catalog.tsx"), encoding="utf-8").read()).group(1))
items = []
for fn in files:
    src = open(os.path.join(G, fn), encoding="utf-8").read()
    fv = re.search(r"const f = '([^']+)'", src); gv = re.search(r"\bg = '([^']+)'", src)   # 分批目录里 file、group 写成了变量 f、g
    for m in re.finditer(r"\{ id: '([^']+)', name: '([^']+)', export: '([^']+)', file: (?:'([^']+)'|f), group: (?:'([^']+)'|g), use: '([^']*)', avoid: '([^']*)', props: '([^']*)', demo:", src):
        it = dict(zip(("id", "name", "export", "file", "group", "use", "avoid", "props"), m.groups()))
        it["file"] = it["file"] or fv.group(1); it["group"] = it["group"] or gv.group(1); it["catalog"] = "gallery/" + fn; items.append(it)
assert len({i["id"] for i in items}) == len(items), "组件编号有重复"
if os.path.exists(out): shutil.rmtree(out)
for d in ("demos", "code", "src"): os.makedirs(os.path.join(out, d))
def block(path, name):
    """从源文件里摘出一个组件：从它上方的注释开始，到下一个顶层注释或 export 之前。"""
    t = open(os.path.join(S, path), encoding="utf-8").read(); m = re.search(r"(/\*\*[^*]*(?:\*(?!/)[^*]*)*\*/\n)?export const %s\b" % re.escape(name), t)
    if not m: return ""
    rest = t[m.end():]; n = re.search(r"\n(?=/\*\*|export (?:const|type|\{)|type \w+ =)", rest)
    return t[m.start(): m.end() + (n.start() if n else len(rest))].rstrip() + "\n"
for i, it in enumerate(items):
    safe = f"{it['id']}-{it['name']}"; it["demo"] = f"demos/{safe}.mp4"; it["code"] = f"code/{it['id']}-{it['export']}.tsx"
    subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-ss", str(i * slot), "-t", str(slot), "-i", gallery, "-c:v", "libx264", "-crf", "20", "-pix_fmt", "yuv420p", "-an", "-movflags", "+faststart", os.path.join(out, it["demo"])], check=True)
    head = f"// {it['id']} {it['name']}（{it['export']}）\n// 适用：{it['use']}\n// 不适用：{it['avoid']}\n// 参数：{it['props']}\n// 完整可运行源码在 src/{it['file']}；这里是单独摘出的这一段，依赖 kit（颜色、Pop、Panel 等）和 clock（prog、mix）。\n\n"
    open(os.path.join(out, it["code"]), "w", encoding="utf-8").write(head + block(it["file"], it["export"]))
for d in ("kit", "components", "gallery"): shutil.copytree(os.path.join(S, d), os.path.join(out, "src", d))
json.dump({"slotSeconds": slot, "count": len(items), "items": items}, open(os.path.join(out, "catalog.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
cols = 9; rows = -(-len(items) // cols)
subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-i", gallery, "-vf", f"select='not(mod(n-{int(slot*30*0.88)}\\,{slot*30}))',scale=480:-1,tile={cols}x{rows}:padding=4", "-frames:v", "1", "-vsync", "0", os.path.join(out, "组件总览.jpg")], check=True)
md = ["# 组件库说明", "", f"共 {len(items)} 个组件，按用途分 {len(set(i['group'] for i in items))} 组。每个组件有 5 秒演示（`demos/`）、单独摘出的代码（`code/`）和可运行的完整源码（`src/`）。", "",
      "## 怎么用", "",
      "1. 把 `src/kit` 和 `src/components` 放进一个 Remotion 工程的 `src/` 下（需要 remotion 4、react 19）。",
      "2. 所有组件的时间参数都是**秒**（`at`、`cutAt`、`dur` 等），由当前帧决定画面，不用真实时钟和随机数。",
      "3. 颜色、字体、间距都来自 `kit/kit.tsx` 里的 `C` 和 `FONT`，换风格只改那里。",
      "4. 强调字幕 `KineticLine` 从时钟里按「段名 + 词」取时间，需要放在 `ClockCtx.Provider` 里；其余组件直接传 `at`。",
      "5. 演示片的写法见 `src/gallery/catalog*.tsx`，每个组件的 `demo` 就是一段最小用法；演示里的公司名、数字、评论都是示例，不是事实。",
      "6. 网页、录屏、视频、图片类组件要传素材路径（相对 `public/`）；演示用的示例素材在 `public/gallery/`，生成办法见 `tools/demo/`。",
      "7. 口播叠加类组件的演示用了代码画的占位人像，实际使用时把 `speaker` / `children` 换成真人视频。", "",
      "## 选组件的顺序", "",
      "先问这句口播的「对象和变化」是什么，再到下面按「适用」找；看「不适用」排除。画面上只放口播里没有的信息；组件不要压住实拍里的人脸。", ""]
for g in dict.fromkeys(i["group"] for i in items):
    md += [f"## {g}", "", "| 编号 | 名称 | 适用 | 不适用 | 参数 | 代码 | 演示 |", "|---|---|---|---|---|---|---|"]
    md += [f"| {i['id']} | **{i['name']}**<br>`{i['export']}` | {i['use']} | {i['avoid']} | {i['props']} | `src/{i['file']}` | `{i['demo']}` |" for i in items if i["group"] == g] + [""]
md += ["## 基础件（不单独演示）", "", "| 名称 | 作用 |", "|---|---|",
       "| `Pop` | 到点淡入上移，可设到点淡出 |", "| `Scene` | 一段画面，只在时间段内渲染，首尾交叉淡化 |", "| `Stage` | 带安全边距的画布（下方留给字幕） |",
       "| `Panel` / `Chip` | 半透明面板、标签 |", "| `Src` / `Note` | 数据来源标签、脚注 |", "| `Footage` | 实拍层：镜头按口播切换、压暗、做旧、按人脸位置挪画面 |",
       "| `Chrome` | 常驻层：章节条、AI 标注、字幕（支持让位和关键词变色） |", "| `Finish` | 细颗粒质感和底部进度线 |", ""]
open(os.path.join(out, "组件说明.md"), "w", encoding="utf-8").write("\n".join(md))
print(f"{len(items)} 个组件 → {out}")
