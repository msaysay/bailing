#!/usr/bin/env bash
# 只渲演示片里的一段组件并拼成检查图：每个组件取两帧（中段、末段）。
# 用法：tools/gallery_check.sh <起始序号(从0数)> <个数> <输出.jpg>     需要 CHROME_PATH
set -euo pipefail
I="$1"; N="$2"; OUT="$3"; SLOT=150
F0=$((I*SLOT)); F1=$(((I+N)*SLOT-1))
npx remotion render src/index.tsx GALLERY out/_gc.mp4 --frames=$F0-$F1 --muted --log=error --concurrency=4 ${CHROME_PATH:+--browser-executable=$CHROME_PATH} 2>&1 | grep -v webpack | tail -2 || true
ffmpeg -nostdin -v error -y -i out/_gc.mp4 -vf "select='eq(mod(n\,$SLOT)\,68)+eq(mod(n\,$SLOT)\,138)',scale=640:-1,tile=4x$(( (N*2+3)/4 )):padding=3" -frames:v 1 -vsync 0 "$OUT"
