#!/usr/bin/env python3
"""把「网格取景框口播风」（对标直男财经）打成一个能单独用的包：只带这种风格要的脚本、画面引擎、两款字体、三首配乐和说明。
用法：python3 scripts/zhinan_pack.py [--out dist/网格取景框口播风-工作流.zip]
对方解压后让 AI 助手读 AGENTS.md，把原片丢给它就行。"""
import argparse, json, os, zipfile
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); K = os.path.join(R, "kits", "zhinan"); TOP = "zhinan-kit/"
ap = argparse.ArgumentParser(); ap.add_argument("--out", default=os.path.join(R, "dist", "网格取景框口播风-工作流.zip")); a = ap.parse_args()
SCRIPTS = ["zhinan.py", "matte.py", "match.py", "footage.py", "tikhub.py", "commons.py", "redtop.py", "asr.py", "align.py", "retakes.py", "roughcut.py", "grade.py", "polish.py", "soundlib.py", "qc.py", "publish_kit.py"]
FILES = {f"scripts/{s}": f"scripts/{s}" for s in SCRIPTS}
FILES.update({"scripts/doctor.py": "kits/zhinan/doctor.py", "AGENTS.md": "kits/zhinan/AGENTS.md", "CLAUDE.md": "kits/zhinan/CLAUDE.md", "先读我.md": "kits/zhinan/先读我.md", "requirements.txt": "kits/zhinan/requirements.txt",
              ".claude/skills/zhinan-talk/SKILL.md": ".claude/skills/zhinan-talk/SKILL.md", ".claude/skills/footage-guide/SKILL.md": ".claude/skills/footage-guide/SKILL.md",
              "docs/对标拆解-直男财经.md": "docs/对标拆解-直男财经.md", "docs/匹配规则.md": "docs/匹配规则.md", "docs/素材规则.md": "docs/素材规则.md", "styles/skeletons.json": "styles/skeletons.json",
              "studio/package.json": "studio/package.json", "studio/package-lock.json": "studio/package-lock.json", "studio/tsconfig.json": "studio/tsconfig.json",
              "studio/src/index.tsx": "kits/zhinan/index.tsx", "studio/src/kit/zhinan.tsx": "studio/src/kit/zhinan.tsx", "studio/src/kit/coverkit.tsx": "studio/src/kit/coverkit.tsx",
              "studio/public/fonts/SourceHanSerifSC-Heavy.otf": "studio/public/fonts/SourceHanSerifSC-Heavy.otf", "studio/public/fonts/AlimamaShuHeiTi-Bold.ttf": "studio/public/fonts/AlimamaShuHeiTi-Bold.ttf", "studio/public/fonts/MiSans-Heavy.otf": "studio/public/fonts/MiSans-Heavy.otf"})
for f in sorted(os.listdir(os.path.join(R, "docs", "reference", "zhinan"))): FILES["docs/reference/zhinan/" + f] = "docs/reference/zhinan/" + f
lib = json.load(open(os.path.join(R, "music", "library.json"), encoding="utf8")); keep = [t for t in lib["tracks"] if t.get("credit") is None and t["mood"] in ("drive", "light", "calm") and os.path.exists(os.path.join(R, "music", t["file"]))]
seen, tracks = set(), []
for t in sorted(keep, key=lambda t: ("drive", "light", "calm").index(t["mood"])):
    if t["mood"] not in seen: seen.add(t["mood"]); tracks.append(t); FILES["music/" + t["file"]] = "music/" + t["file"]
miss = [v for v in FILES.values() if not os.path.exists(os.path.join(R, v))]
if miss: raise SystemExit("缺文件：" + "，".join(miss))
os.makedirs(os.path.dirname(os.path.abspath(a.out)), exist_ok=True)
with zipfile.ZipFile(a.out, "w", zipfile.ZIP_DEFLATED) as z:
    for dst, src in sorted(FILES.items()): z.write(os.path.join(R, src), TOP + dst)
    z.writestr(TOP + "music/library.json", json.dumps({"moods": lib.get("moods"), "tracks": tracks}, ensure_ascii=False, indent=1))
    z.writestr(TOP + ".gitignore", "node_modules/\nstudio/public/rt*/\nstudio/public/depth-demo/\nstudio/public/pub-*/\nepisodes/\nbrands/_zhinan/\n__pycache__/\n")
print(f"{len(FILES) + 2} 个文件 → {a.out}（{os.path.getsize(a.out) / 1e6:.1f} MB）；配乐 {len(tracks)} 首：" + "、".join(t["title"] for t in tracks))
