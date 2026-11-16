#!/usr/bin/env bash
# 渲染宠物的全部形态：每个形态一段 48 帧（2 秒）的循环动画，透明底 PNG 序列，放进 studio/public/pet/<形态>/。
# 用法：bash pet/render_all.sh [分辨率] [采样数]      4 核 CPU 上大约 30 分钟
set -euo pipefail
R=${1:-384}; N=${2:-20}; O=studio/public/pet
run(){ blender -b -P pet/build_pet.py -- --stage $1 --branch $2 --crack $3 --out $O/$4/ --res $R --samples $N --frames 48 2>&1 | grep -E "Traceback|Error" || true; echo "done $4"; }
run 0 none 0.15 egg1; run 0 none 0.5 egg2; run 0 none 0.85 egg3
run 1 none 0 hatch; run 2 none 0 young
for b in tech gold flame star; do run 3 $b 0 adult-$b; done
