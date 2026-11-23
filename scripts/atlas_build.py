#!/usr/bin/env python3
"""视觉图鉴的数据整理：把两个开源库里要用的部分拷进 site/vendor/，并生成图鉴页读的数据文件 site/atlas-data.js。
  - motion-prompt（MIT，Shohei Ohtaki）：专业名词 + 会动的示例。拷运行时、九个名词包的绘制代码和简体中文说明。
  - mg-styles-15（MIT，Vincentwei1021）：15 种动态设计风格。拷封面、4 秒小样和完整提示词。
用法：python3 scripts/atlas_build.py [--mp <motion-prompt 目录>] [--mg <mg-styles-15 目录>]
两个库都已经拷进仓库（site/vendor/），平时不用再跑；它们更新了、想同步时才跑。许可证原文跟着一起拷。"""
import argparse, json, os, re, shutil, subprocess
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); V = os.path.join(R, "site", "vendor")
ap = argparse.ArgumentParser(); ap.add_argument("--mp", default="/home/user/showheyohtaki/motion-prompt"); ap.add_argument("--mg", default="/home/user/vincentwei1021/mg-styles-15"); a = ap.parse_args()
PACKS = ["motion", "motion2", "camera", "camera2", "photo", "diagram", "ui", "lp", "lp2"]          # artstyle 是给生图用的，要另外加载图片，先不收
terms = []; packs = []
if os.path.isdir(a.mp):
    d = os.path.join(V, "motion-prompt"); os.makedirs(os.path.join(d, "packs"), exist_ok=True)
    shutil.copy(os.path.join(a.mp, "LICENSE"), os.path.join(d, "LICENSE")); shutil.copy(os.path.join(a.mp, "assets", "runtime.js"), os.path.join(d, "runtime.js"))
    for p in PACKS:
        shutil.copy(os.path.join(a.mp, "packs", p, "pack.js"), os.path.join(d, "packs", p + ".js")); m = json.load(open(os.path.join(a.mp, "packs", p, "meta.json"), encoding="utf8"))
        cats = {c["slug"]: c.get("zh-Hans") or c["en"] for c in m["categories"]}; base = len(terms)
        packs.append({"id": p, "title": m["title"].get("zh-Hans") or m["title"]["en"], "n": len(m["elements"])})
        for i, e in enumerate(m["elements"]):
            z = lambda k: (e.get(k) or {}).get("zh-Hans") or (e.get(k) or {}).get("en") or ""
            terms.append({"id": f"{base + i + 1:03d}", "pack": p, "i": i, "name": z("name"), "en": e["name"]["en"], "cat": cats.get(e["category"], ""), "mean": z("meaning"), "ask": z("ask")})
styles = []
if os.path.isdir(a.mg):
    d = os.path.join(V, "mg-styles-15"); os.makedirs(os.path.join(d, "clips"), exist_ok=True); shutil.copy(os.path.join(a.mg, "LICENSE"), os.path.join(d, "LICENSE"))
    for f in sorted(os.listdir(os.path.join(a.mg, "prompts"))):
        if not f.endswith(".md"): continue
        slug = f[:-3]; t = open(os.path.join(a.mg, "prompts", f), encoding="utf8").read()
        title = t.splitlines()[0].lstrip("# ").strip(); k = max(i for i, c in enumerate(title) if "\u4e00" <= c <= "\u9fff" or c in "）」") + 1; zh = title[:k].strip(); en = title[k:].strip(" /")          # 中文名到最后一个汉字为止，后面是英文名
        zh = {"03-isometric": "等轴 2.5D", "22-hud": "赛博朋克 HUD / FUI", "04-3d-render": "3D 渲染系", "10-synthwave": "复古 Synthwave / Y2K", "19-paperclip": "粗描边贴纸人科普"}.get(slug, zh)
        prompt = re.search(r"```text\n(.*?)```", t, re.S).group(1).strip()
        sig = re.search(r"# Signature features[^\n]*\n(.*?)\n# ", prompt + "\n# ", re.S).group(1)
        look = (re.search(r"视觉特征\s*(.*)", sig) or [None, ""])[1].strip(); intro = sig.split("视觉特征")[0].strip().split("。")[0] + "。"
        film = (re.search(r"\*\*原片\*\*：(.*?)·", t) or [None, ""])[1].strip()
        src = os.path.join(a.mg, "videos", slug + ".mp4")
        subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-ss", "2.5", "-t", "4", "-i", src, "-an", "-vf", "scale=400:-2,fps=20", "-c:v", "libx264", "-crf", "30", "-pix_fmt", "yuv420p", "-movflags", "+faststart", os.path.join(d, "clips", slug + ".mp4")], check=True)
        subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-ss", "5", "-i", src, "-frames:v", "1", "-vf", "scale=400:-2", "-q:v", "5", os.path.join(d, "clips", slug + ".jpg")], check=True)
        styles.append({"id": "mg-" + slug, "name": zh, "en": en, "film": film, "intro": intro, "look": look, "clip": f"vendor/mg-styles-15/clips/{slug}.mp4", "poster": f"vendor/mg-styles-15/clips/{slug}.jpg", "prompt": prompt, "src": f"https://github.com/Vincentwei1021/mg-styles-15/blob/main/prompts/{f}"})
out = os.path.join(R, "site", "atlas-data.js")
old = {}
if os.path.exists(out): old = json.loads(open(out, encoding="utf8").read().split("=", 1)[1].rstrip(";\n"))
data = {"terms": terms or old.get("terms", []), "packs": packs or old.get("packs", []), "mg": styles or old.get("mg", [])}
# 风格配方（styles/atlas-styles.json）并进来：给 15 种外来风格补上参数，带上自己的和蒸馏的
ST = json.load(open(os.path.join(R, "styles", "atlas-styles.json"), encoding="utf8"))
for m in data["mg"]: k = m["id"][3:]; m["t"] = ST["mg"]["tokens"].get(k); m["fits"] = ST["mg"]["fits"].get(k, [])
data["house"] = ST["house"]; data["distill"] = ST["distill"]
open(out, "w", encoding="utf8").write("window.ATLAS_DATA = " + json.dumps(data, ensure_ascii=False) + ";\n")
print(f"名词 {len(data['terms'])} 个（{len(data['packs'])} 包），风格 {len(data['house'])} + {len(data['mg'])} + {len(data['distill'])} 种 → {out}")
