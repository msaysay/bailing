#!/usr/bin/env bash
# 取 FredTalk 公开仓库的组件源码快照（约 570MB，不进本仓库）到 vendor/_cache/fredtalk-components。
# 用法：scripts/fetch-fredtalk-components.sh [components/projects 下的子目录名 ...]
#   不带参数取全部；带参数只取指定工程，例如 interaction-components-20261007
set -euo pipefail
COMMIT=eec77dcfa99318f565c391bf557f5d43042ec061
DEST="$(cd "$(dirname "$0")/.." && pwd)/vendor/_cache/fredtalk-components"
if [ ! -d "$DEST/.git" ]; then
  git clone --filter=blob:none --no-checkout https://github.com/njrhts2kvv-star/FredTalk "$DEST"
fi
cd "$DEST"
git sparse-checkout init --cone
if [ "$#" -eq 0 ]; then
  git sparse-checkout set components
else
  git sparse-checkout set "${@/#/components/projects/}"
fi
git fetch --depth 1 origin "$COMMIT"
git checkout --detach "$COMMIT"
echo "已取到 $DEST （commit $COMMIT）"
