#!/usr/bin/env bash
# 重建样片（episodes/14_约读书房_样片）的输入素材。人物视频和素材片段不进 git，要从用户给的参考成片里重新裁出来。
# 用法：scripts/frame_demo_fixture.sh <参考成片.mp4>
# 这条「原片」是倒推的：把参考成片画面窗里的内容裁出来（去掉相框和字幕带）当口播原片，
# 原成片插了素材的时间段记在 meta.json 的 no_person 里。所以画面上会残留原成片烧进去的贴纸和推近，属于测试素材的局限。
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"; V="$1"; E="$ROOT/episodes/14_约读书房_样片"; P="$ROOT/studio/public/yuedu-demo"
mkdir -p "$E/01_输入素材/客户素材" "$P/clips"
ffmpeg -nostdin -v error -y -i "$V" -vf "crop=940:705:140:555,scale=1440:1080:flags=lanczos" -r 30 -c:v libx264 -crf 17 -preset fast -c:a aac -b:a 192k "$E/01_输入素材/口播原片.mp4"
cp "$E/01_输入素材/口播原片.mp4" "$P/person.mp4"
i=0
for seg in "11.6 17.3" "19.97 25.6" "28.63 30.6" "50.5 66.77" "70.03 73.67" "84.73 87.07" "100.6 110.77" "115.17 118.67" "128.37 133.47" "146.77 162.13" "167.73 172.33" "192.53 198.37" "200.53 201.6" "217.0 220.5" "233.6 239.63" "250.6 254.17"; do
  set -- $seg; i=$((i + 1)); d=$(python3 -c "print($2-$1)")
  ffmpeg -nostdin -v error -y -ss "$1" -i "$E/01_输入素材/口播原片.mp4" -t "$d" -an -c:v libx264 -crf 17 -preset fast "$E/01_输入素材/客户素材/$(printf 'b%02d' $i).mp4"
done
cp "$P/clips/library.json" /tmp/yuedu-demo-library.json                      # 保留已填好的 desc
python3 "$ROOT/scripts/library_index.py" "$E/01_输入素材/客户素材" "$P/clips" --min 1.2 >/dev/null
python3 - "$P/clips" <<'PY'
import json, os, sys
d = sys.argv[1]; keep = {x["id"]: x for x in json.load(open("/tmp/yuedu-demo-library.json", encoding="utf-8"))}; now = json.load(open(d + "/library.json", encoding="utf-8"))
for x in now:
    if x["id"] not in keep and os.path.exists(os.path.join(d, x["id"] + ".mp4")): os.remove(os.path.join(d, x["id"] + ".mp4"))   # 烧了字幕、贴纸的镜头不用
json.dump(list(keep.values()), open(d + "/library.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
PY
W="$E/03_制作过程"
python3 "$ROOT/scripts/align.py" --script "$W/script.txt" --asr "$W/asr.json" --audio "$P/person.mp4" --out-timing "$W/timing.json" --out-audio "$P/voice.wav" --max 12 --fps 30 | head -1
echo "样片素材就绪。出关键帧：scripts/frame_render.sh \"$E\" keys"
