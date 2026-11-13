#!/usr/bin/env bash
# 把 01_输入素材 里的原片按镜头表截成工程用的片段，放进 remotion/public/footage。
# 每行：输出名 源文件 起点秒 时长秒 放慢倍率 裁切(宽比:高比:左比:上比)
# 裁切用来去掉原片底部的字幕和台标；放慢让短镜头撑满所需时长。在 03_制作过程 目录下运行。
set -euo pipefail
SRC="../01_输入素材/douyin"; DST="remotion/public/footage"; rm -rf "$DST"; mkdir -p "$DST"
I=huang-cctv-interview; CI="0.66:0.66:0.17:0.02"   # 原片右下有栏目台标、底部有字幕、左上有台标，只取中上部
while read -r out src ss dur rate crop; do
  IFS=: read -r cw ch cx cy <<<"$crop"
  ffmpeg -nostdin -v error -y -ss "$ss" -t "$dur" -i "$SRC/$src.mp4" -an \
    -vf "crop=iw*$cw:ih*$ch:iw*$cx:ih*$cy,scale=1920:1080:flags=lanczos,setpts=PTS/$rate,fps=30" \
    -c:v libx264 -crf 20 -pix_fmt yuv420p "$DST/$out.mp4"
done <<CLIPS
closeup   $I 1010  7   1.0  $CI
logos     $I 505   3.6 0.43 $CI
dark      $I 515.2 3.4 0.64 $CI
press     $I 509.8 5.3 0.55 $CI
walk      $I 735   9   1.0  $CI
campus    valley-aerial 278.6 5.4 0.6 0.84:0.84:0.14:0.0
stage     $I 1618  5   0.55 $CI
keynote   $I 2074.2 3.7 0.52 $CI
wide      $I 1291  10  1.0  $CI
factory   $I 1060  6   0.70 $CI
closeup2  $I 1568  10  1.0  $CI
podium    $I 1     12  1.0  $CI
server    $I 1202  6   0.90 $CI
machine   $I 875   5   0.49 $CI
CLIPS
for f in "$DST"/*.mp4; do printf "%s %s\n" "$(basename "$f")" "$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$f")"; done
