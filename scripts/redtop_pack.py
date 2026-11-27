#!/usr/bin/env python3
"""把「红顶双标题口播风」打成一个能单独用的包：只带这种风格要的脚本、画面引擎、一款字体、三首配乐和说明。
用法：python3 scripts/redtop_pack.py [--out dist/红顶双标题口播风-工作流.zip]
对方解压后让 AI 助手读 AGENTS.md，把原片丢给它就行。"""
import argparse, json, os, zipfile
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); K = os.path.join(R, "kits", "redtop"); TOP = "redtop-kit/"
ap = argparse.ArgumentParser(); ap.add_argument("--out", default=os.path.join(R, "dist", "红顶双标题口播风-工作流.zip")); a = ap.parse_args()
SCRIPTS = ["redtop.py", "asr.py", "align.py", "retakes.py", "roughcut.py", "grade.py", "polish.py", "soundlib.py", "qc.py", "publish_kit.py"]
FILES = {f"scripts/{s}": f"scripts/{s}" for s in SCRIPTS}
FILES.update({"scripts/doctor.py": "kits/redtop/doctor.py", "AGENTS.md": "kits/redtop/AGENTS.md", "CLAUDE.md": "kits/redtop/CLAUDE.md", "先读我.md": "kits/redtop/先读我.md", "requirements.txt": "kits/redtop/requirements.txt",
              ".claude/skills/redtop-talk/SKILL.md": ".claude/skills/redtop-talk/SKILL.md", "docs/对标拆解-红顶双标题口播.md": "docs/对标拆解-红顶双标题口播.md",
              "studio/package.json": "studio/package.json", "studio/package-lock.json": "studio/package-lock.json", "studio/tsconfig.json": "studio/tsconfig.json",
              "studio/src/index.tsx": "kits/redtop/index.tsx", "studio/src/kit/redtop.tsx": "studio/src/kit/redtop.tsx", "studio/src/kit/coverkit.tsx": "studio/src/kit/coverkit.tsx",
              "studio/public/fonts/AlibabaPuHuiTi-3-105-Heavy.ttf": "studio/public/fonts/AlibabaPuHuiTi-3-105-Heavy.ttf"})
for f in sorted(os.listdir(os.path.join(R, "docs", "reference", "redtop"))): FILES["docs/reference/redtop/" + f] = "docs/reference/redtop/" + f
lib = json.load(open(os.path.join(R, "music", "library.json"), encoding="utf8")); keep = [t for t in lib["tracks"] if t.get("credit") is None and t["mood"] in ("light", "warm", "calm") and os.path.exists(os.path.join(R, "music", t["file"]))]
seen, tracks = set(), []
for t in sorted(keep, key=lambda t: ("light", "warm", "calm").index(t["mood"])):
    if t["mood"] not in seen: seen.add(t["mood"]); tracks.append(t); FILES["music/" + t["file"]] = "music/" + t["file"]
miss = [v for v in FILES.values() if not os.path.exists(os.path.join(R, v))]
if miss: raise SystemExit("缺文件：" + "，".join(miss))
os.makedirs(os.path.dirname(os.path.abspath(a.out)), exist_ok=True)
with zipfile.ZipFile(a.out, "w", zipfile.ZIP_DEFLATED) as z:
    for dst, src in sorted(FILES.items()): z.write(os.path.join(R, src), TOP + dst)
    z.writestr(TOP + "music/library.json", json.dumps({"moods": lib.get("moods"), "tracks": tracks}, ensure_ascii=False, indent=1))
    z.writestr(TOP + ".gitignore", "node_modules/\nstudio/public/rt*/\nstudio/public/pub-*/\nepisodes/\nbrands/_redtop/\n__pycache__/\n")
print(f"{len(FILES) + 2} 个文件 → {a.out}（{os.path.getsize(a.out) / 1e6:.1f} MB）；配乐 {len(tracks)} 首：" + "、".join(t["title"] for t in tracks))
