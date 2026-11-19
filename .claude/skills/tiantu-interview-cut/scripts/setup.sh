#!/usr/bin/env bash
# One-time setup: python deps + fonts. Safe to re-run.
set -e
HERE="$(cd "$(dirname "$0")/.." && pwd)"
F="$HERE/assets/fonts"; mkdir -p "$F"
command -v ffmpeg >/dev/null || { echo "ffmpeg is required (with libass)"; exit 1; }
ffmpeg -hide_banner -filters 2>/dev/null | grep -q " ass " || { echo "ffmpeg lacks the ass filter (libass)"; exit 1; }
python3 -c "import faster_whisper, cv2, numpy, PIL, pypinyin" 2>/dev/null || pip install -q faster-whisper opencv-python-headless numpy pillow pypinyin
ffmpeg -hide_banner -filters 2>/dev/null | grep -q " arnndn " || echo "!! ffmpeg lacks arnndn - denoise falls back to afftdn"
# 降噪: RNNoise 语音模型 (speech / recording noise)
R="$HERE/assets/rnnoise"; mkdir -p "$R"
[ -f "$R/sh.rnnn" ] || curl -fsSL -o "$R/sh.rnnn" \
  https://raw.githubusercontent.com/GregorR/rnnoise-models/master/somnolent-hogwash-2018-09-01/sh.rnnn \
  || echo "!! could not fetch the RNNoise model - denoise falls back to afftdn"
# 常规字幕/关键词: 鸿蒙体粗 HarmonyOS Sans SC Bold (free to use, Huawei)
if [ ! -f "$F/HarmonyOS_Sans_SC_Bold.ttf" ]; then
  T="$(mktemp -d)"; (cd "$T" && npm pack @fontpkg/harmony-os-sans-sc --silent >/dev/null && tar xzf *.tgz \
    && cp package/HarmonyOS_Sans_SC_Bold.ttf "$F/") || echo "!! could not fetch HarmonyOS Sans SC Bold - put HarmonyOS_Sans_SC_Bold.ttf in $F"
  rm -rf "$T"
fi
# 小标题: 剪映「瑞意宋」不可再分发。若用户提供字体文件，存为 assets/fonts/title.ttf|otf 即自动启用；
# 否则用最接近的开源细宋 Noto Serif SC Light（思源宋体）。
if ! ls "$F"/title.* >/dev/null 2>&1 && [ ! -f "$F/NotoSerifSC-Light.otf" ]; then
  curl -fsSL -o "$F/NotoSerifSC-Light.otf" \
    https://raw.githubusercontent.com/notofonts/noto-cjk/main/Serif/SubsetOTF/SC/NotoSerifSC-Light.otf \
    || echo "!! could not fetch Noto Serif SC Light - put it (or 瑞意宋 as title.ttf) in $F"
fi
[ -f "$HERE/assets/brand/logo.png" ] || echo "!! assets/brand/logo.png missing - ask the user for the brand logo (transparent PNG)"
ls -1 "$F"; echo "setup done"
