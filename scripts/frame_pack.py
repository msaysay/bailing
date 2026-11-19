#!/usr/bin/env python3
"""把相框口播线打成一个可以单独交给别的 AI 助手用的压缩包（不含视频、字体、模型、node_modules）。
用法：python3 scripts/frame_pack.py [输出.zip，默认 dist/yuedu-video-kit.zip]"""
import glob, os, sys, zipfile
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, "dist", "yuedu-video-kit.zip"); os.makedirs(os.path.dirname(out), exist_ok=True)
TOP = "yuedu-video-kit/"; files = {}
def add(src, dst=None):
    for f in sorted(glob.glob(os.path.join(ROOT, src), recursive=True)):
        if os.path.isfile(f): files[(dst or os.path.relpath(f, ROOT)).replace(os.sep, "/") if dst else os.path.relpath(f, ROOT).replace(os.sep, "/")] = f
add(".claude/skills/frame-talk/kit/README.md", "README.md"); add(".claude/skills/frame-talk/kit/AGENTS.md", "AGENTS.md"); add(".claude/skills/frame-talk/kit/AGENTS.md", "CLAUDE.md")
for s in ("frame_setup", "frame_ingest", "frame_plan", "frame_audio", "soundlib", "frame_render", "frame_check", "frame_demo_fixture", "frame_pack", "library_index", "asr", "align", "roughcut", "qc", "tikhub"): add(f"scripts/{s}.py")
add(".claude/skills/frame-talk/**"); add("brands/yuedu/**"); add("docs/约读书房-口播成片工作流设计.md")
for f in ("package.json", "package-lock.json", "tsconfig.json", "tools/yuedu_stills.cjs"): add("studio/" + f)
add("studio/src/yuedu/**"); add("studio/public/fonts/MiSans-License.txt")
add("studio/public/yuedu-demo/clips/library.json"); add("studio/public/yuedu-demo/clips/backend.jpg"); add("studio/public/yuedu-demo/clips/联系表.jpg")
E = "episodes/14_约读书房_样片/"
for f in ("script.txt", "asr.json", "timing.json", "meta.json", "edl.json", "props.json", "版式表.md", "稿子确认.md", "标题候选.md"): add(E + "03_制作过程/" + f)
add(E + "04_成片/关键帧.jpg")
with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
    for dst, src in sorted(files.items()): z.write(src, TOP + dst)
    z.writestr(TOP + ".gitignore", "node_modules/\nstudio/public/fonts/*.otf\nstudio/public/*/person.mp4\nstudio/public/*/*.wav\nstudio/public/*/clips/*.mp4\nstudio/public/yuedu/\nepisodes/*/01_输入素材/\nepisodes/*/04_成片/*.mp4\nepisodes/*/04_成片/qc/\n")
print(f"{len(files) + 1} 个文件 → {out}（{os.path.getsize(out) / 1e6:.1f} MB）")
