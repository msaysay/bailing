#!/usr/bin/env bash
# 把 01_输入素材/commons 里的原始素材转成工程用的规格，放进 remotion/public/footage：
# 图片缩到 2560 宽；视频按 clips 表截取、缩到 1920 宽、去声音、转 H.264。在 03_制作过程 目录下运行。
set -euo pipefail
SRC="../01_输入素材/commons"; DST="remotion/public/footage"; mkdir -p "$DST"
for f in "$SRC"/*.jpg; do [ -e "$f" ] || continue
  ffmpeg -v error -y -i "$f" -vf "scale='min(2560,iw)':-2" -q:v 3 "$DST/$(basename "$f")"; done
# 视频：文件名 起点秒 时长秒
while read -r name ss dur; do [ -e "$SRC/$name.webm" ] || continue
  ffmpeg -v error -y -ss "$ss" -t "$dur" -i "$SRC/$name.webm" -an -vf "scale=1920:-2,fps=30" -c:v libx264 -crf 20 -pix_fmt yuv420p "$DST/$name.mp4"
done <<'CLIPS'
v-huang 0 20
v-chip 0 20
v-server 0 20
CLIPS
ls -la "$DST"
