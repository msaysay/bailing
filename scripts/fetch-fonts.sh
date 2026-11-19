#!/usr/bin/env bash
# 下载相框口播线用到的字体到 studio/public/fonts/（字体文件大，不进 git）。
# 思源宋体（标题、署名，OFL）、得意黑（字幕、贴纸，OFL）、MiSans（卡片正文，小米免费商用许可）。
set -euo pipefail
D="$(cd "$(dirname "$0")/.." && pwd)/studio/public/fonts"; T="$(mktemp -d)"; mkdir -p "$D"
need(){ for f in "$@"; do [ -f "$D/$f" ] || return 0; done; return 1; }
if need SourceHanSerifSC-Bold.otf SourceHanSerifSC-Heavy.otf SourceHanSerifSC-Medium.otf; then
  curl -fsSL -o "$T/serif.zip" https://github.com/adobe-fonts/source-han-serif/releases/download/2.003R/09_SourceHanSerifSC.zip
  unzip -qjo "$T/serif.zip" 'OTF/SimplifiedChinese/SourceHanSerifSC-Bold.otf' 'OTF/SimplifiedChinese/SourceHanSerifSC-Heavy.otf' 'OTF/SimplifiedChinese/SourceHanSerifSC-Medium.otf' -d "$D"
fi
if need SmileySans-Oblique.otf; then
  curl -fsSL -o "$T/smiley.zip" https://github.com/atelier-anchor/smiley-sans/releases/download/v2.0.1/smiley-sans-v2.0.1.zip
  unzip -qjo "$T/smiley.zip" SmileySans-Oblique.otf -d "$D"
fi
if need MiSans-Regular.otf MiSans-Semibold.otf MiSans-Heavy.otf; then
  curl -fsSL -o "$T/misans.zip" https://hyperos.mi.com/font-download/MiSans.zip
  unzip -qjo "$T/misans.zip" 'MiSans/otf/MiSans-Regular.otf' 'MiSans/otf/MiSans-Semibold.otf' 'MiSans/otf/MiSans-Heavy.otf' -d "$D"
fi
rm -rf "$T"; ls -1 "$D"
