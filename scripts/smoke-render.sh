#!/usr/bin/env bash
# 渲染冒烟测试：示例页面 → 截图 + 关注区域坐标 → FredTalk 的 NewsFocus 组件 → 7 秒 1080p60 成片。
# 验证四件事：依赖能装、无头浏览器能跑、截图坐标能喂进组件、能出 mp4。
# 用法：scripts/smoke-render.sh [输出目录]   需要 node、ffmpeg、playwright；CHROME_PATH 可指定 chrome-headless-shell。
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="${1:-$ROOT/vendor/_cache/smoke}"
SRC="$ROOT/vendor/_cache/fredtalk-components/components/projects/interaction-components-20261007/interaction-components"
[ -d "$SRC" ] || "$ROOT/scripts/fetch-fredtalk-components.sh" interaction-components-20261007
rm -rf "$OUT" && mkdir -p "$OUT" && cp -r "$SRC/." "$OUT/" && mkdir -p "$OUT/public"
cd "$OUT" && npm install --no-audit --no-fund >/dev/null
node "$ROOT/scripts/smoke/capture-roi.cjs" "$ROOT/scripts/smoke/page.html" "$OUT/public/news.png" "$OUT/roi.json"
node -e '
const fs=require("fs"),r=JSON.parse(fs.readFileSync("roi.json")),g=r.regions[0];
const line=`const sample:NewsFocusProps={src:"news.png",sourceWidth:${r.sourceWidth},sourceHeight:${r.sourceHeight},regions:[${JSON.stringify(g)}],zoom:2.05,color:"#FFE949"};`;
const f="src/index.tsx";fs.writeFileSync(f,fs.readFileSync(f,"utf8").replace(/const sample:NewsFocusProps=.*?;\n/,line+"\n"));'
: "${CHROME_PATH:=$(ls /opt/pw-browsers/chromium_headless_shell-*/chrome-headless-shell-linux64/chrome-headless-shell 2>/dev/null | head -1)}"
export CHROME_PATH
node render.cjs render Yellow-Camera-First
ffprobe -v error -show_entries format=duration:stream=width,height,r_frame_rate -of compact outputs/Yellow-Camera-First.mp4
echo "成片：$OUT/outputs/Yellow-Camera-First.mp4"
