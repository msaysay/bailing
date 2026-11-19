#!/usr/bin/env bash
# 一次出多张静帧并拼成联系表（比逐张 remotion still 快：只打包一次）。
# 用法：tools/yuedu_stills.sh <合成名> <输出.jpg> <props.json 或 -> <帧号,帧号,…> [每行几张=4]
set -euo pipefail
cd "$(dirname "$0")/.."; COMP="$1"; OUT="$2"; PROPS="$3"; FRAMES="$4"; COLS="${5:-4}"
: "${CHROME_PATH:=$(ls /opt/pw-browsers/chromium_headless_shell-*/chrome-headless-shell-linux64/chrome-headless-shell 2>/dev/null | head -1)}"
T="$(mktemp -d)"
node - "$COMP" "$T" "$PROPS" "$FRAMES" "${CHROME_PATH:-}" <<'JS'
const [comp, dir, props, frames, chrome] = process.argv.slice(2);
const path = require('path'), fs = require('fs');
(async () => {
  const { bundle } = require('@remotion/bundler'), { selectComposition, renderStill, openBrowser } = require('@remotion/renderer');
  const serveUrl = await bundle({ entryPoint: path.resolve('src/yuedu/index.tsx'), publicDir: path.resolve('public') });
  const inputProps = props === '-' ? {} : JSON.parse(fs.readFileSync(props, 'utf8'));
  const browser = await openBrowser('chrome', chrome ? { browserExecutable: chrome } : {});
  const composition = await selectComposition({ serveUrl, id: comp, inputProps, puppeteerInstance: browser });
  let i = 0;
  for (const f of frames.split(',')) await renderStill({ composition, serveUrl, inputProps, frame: Math.min(+f, composition.durationInFrames - 1), output: path.join(dir, String(i++).padStart(3, '0') + '.jpg'), imageFormat: 'jpeg', jpegQuality: 90, puppeteerInstance: browser });
  await browser.close({ silent: true });
})().catch((e) => { console.error(e.message || e); process.exit(1); });
JS
N=$(ls "$T"/*.jpg | wc -l); ROWS=$(( (N + COLS - 1) / COLS ))
ffmpeg -v error -y -pattern_type glob -i "$T/*.jpg" -vf "scale=iw/2:-1,tile=${COLS}x${ROWS}:padding=6:color=white" -frames:v 1 -q:v 3 "$OUT"
rm -rf "$T"; echo "$OUT（$N 张）"
