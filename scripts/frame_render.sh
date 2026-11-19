#!/usr/bin/env bash
# 相框口播线：检查剪辑决定表 → 出关键帧联系表 → 整片渲染 → 自查。
# 用法：scripts/frame_render.sh <期目录> [keys|full|all]     默认 all
#   keys  只出关键帧联系表（每个处理开始后不久各一张），先看图再决定要不要整片渲染
#   full  只整片渲染加自查
# 产物在 <期目录>/04_成片/：关键帧.jpg、成片.mp4、qc 输出。
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"; EP="$(cd "$1" && pwd)"; MODE="${2:-all}"; W="$EP/03_制作过程"; OUT="$EP/04_成片"; mkdir -p "$OUT"
: "${CHROME_PATH:=$(ls /opt/pw-browsers/chromium_headless_shell-*/chrome-headless-shell-linux64/chrome-headless-shell 2>/dev/null | head -1)}"; export CHROME_PATH
[ -f "$ROOT/studio/public/fonts/SmileySans-Oblique.otf" ] || "$ROOT/scripts/fetch-fonts.sh"
mkdir -p "$ROOT/studio/public/yuedu" && cp "$ROOT/brands/yuedu/plate.png" "$ROOT/brands/yuedu/logo.png" "$ROOT/studio/public/yuedu/"
python3 "$ROOT/scripts/frame_plan.py" "$EP"
cd "$ROOT/studio"; [ -d node_modules ] || npm install --no-audit --no-fund >/dev/null
if [ "$MODE" != full ]; then
  FR=$(python3 - "$W/props.json" <<'PY'
import json, sys
p = json.load(open(sys.argv[1], encoding="utf-8")); B = p["base"]; fr = set()
for i, b in enumerate(B):
    e = B[i + 1]["t"] if i + 1 < len(B) else p["total"]; fr.add(int((b["t"] + min(3.0, 0.8 * (e - b["t"]))) * p["fps"]))
for o in p["overlays"]: fr.add(int((o["t"] + 1.0) * p["fps"]))
print(",".join(map(str, sorted(fr))))
PY
)
  tools/yuedu_stills.sh YueduFrame "$OUT/关键帧.jpg" "$W/props.json" "$FR" 6
fi
if [ "$MODE" != keys ]; then
  npx remotion render src/yuedu/index.tsx YueduFrame "$OUT/成片.mp4" --props="$W/props.json" --crf=19 --log=error ${CHROME_PATH:+--browser-executable="$CHROME_PATH"}
  python3 "$ROOT/scripts/qc.py" "$OUT/成片.mp4" || true
  python3 "$ROOT/scripts/frame_check.py" "$OUT/成片.mp4" "$W/props.json"
fi
