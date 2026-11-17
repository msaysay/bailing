#!/usr/bin/env bash
# 出片：bash scripts/render.sh [V01 V02 ...]（不写就全部）。成片在 out/，封面在 out/covers/。
set -euo pipefail
cd "$(dirname "$0")/.."
BROWSER=${BROWSER:-/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell}
node scripts/export.ts
python3 scripts/fonts.py
IDS=("$@"); [ ${#IDS[@]} -eq 0 ] && IDS=($(node -e "import('./src/episodes/all.ts').then(m=>console.log(m.EPISODES.map(e=>e.id).join(' ')))" 2>/dev/null))
mkdir -p out/covers
for id in "${IDS[@]}"; do
  python3 scripts/bgm.py "$id"
  title=$(node -e "import('./src/episodes/all.ts').then(m=>console.log(m.EPISODES.find(e=>e.id==='$id').title.replace(/ /g,'')))" 2>/dev/null)
  npx remotion render src/index.ts "$id" "out/$id-$title.mp4" --browser-executable="$BROWSER" --codec=h264 --crf=20 --audio-codec=aac --concurrency=${CONC:-3} --log=error
  npx remotion still src/index.ts "$id-COVER" "out/covers/$id-横.jpg" --browser-executable="$BROWSER" --image-format=jpeg --jpeg-quality=92 --log=error
  npx remotion still src/index.ts "$id-COVER-V" "out/covers/$id-竖.jpg" --browser-executable="$BROWSER" --image-format=jpeg --jpeg-quality=92 --log=error
  echo "done $id $title"
done
