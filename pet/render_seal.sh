#!/usr/bin/env bash
# 渲染海豹的全部形态：每个 48 帧（2 秒）循环，透明底 PNG 序列，放进 studio/public/pet/<形态>/。
# 用法：bash pet/render_seal.sh [分辨率] [采样数]
set -euo pipefail
R=${1:-320}; N=${2:-16}; O=studio/public/pet; B=pet/assets/QuietCompanions.blend
run(){ blender -b $B -P pet/seal.py -- --stage $1 --branch $2 --expr $3 --crack $4 --out $O/$5/ --res $R --samples $N --frames 48 2>&1 | grep -E "Traceback|Error" || true; echo "done $5"; }
run 0 none calm 0.15 egg1; run 0 none calm 0.5 egg2; run 0 none calm 0.85 egg3
run 1 none calm 0 hatch; run 2 none calm 0 young; run 2 none happy 0 young-happy; run 2 none shock 0 young-shock
for b in tech gold flame star; do run 3 $b calm 0 adult-$b; done
echo ALLDONE
