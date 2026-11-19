#!/usr/bin/env bash
# 按镜头表把原片截成工程用的片段。用法：tools/prep_footage.sh <镜头表.txt> <原片目录> <输出目录>
# 镜头表每行：输出名 源文件名 起点秒 时长秒 放慢倍率 裁切(宽比:高比:左比:上比)；# 开头为注释。
# 第四个参数可选：只处理名字里含这个词的镜头（改一个镜头时用，不必全部重切）。
set -euo pipefail
LIST="$1"; SRC="$2"; DST="$3"; ONLY="${4:-}"; mkdir -p "$DST"
grep -v '^\s*#' "$LIST" | grep -v '^\s*$' | while read -r out src ss dur rate crop; do
  if [ -n "$ONLY" ] && [[ "$out" != *"$ONLY"* ]]; then continue; fi
  IFS=: read -r cw ch cx cy <<<"$crop"
  ffmpeg -nostdin -v error -y -ss "$ss" -t "$dur" -i "$SRC/$src.mp4" -an \
    -vf "crop=iw*$cw:ih*$ch:iw*$cx:ih*$cy,scale=1920:1080:flags=lanczos,setpts=PTS/$rate,fps=30" \
    -c:v libx264 -crf 20 -pix_fmt yuv420p "$DST/$out.mp4"
  printf "%s %.1fs\n" "$out" "$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$DST/$out.mp4")"
done
