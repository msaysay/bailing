#!/usr/bin/env bash
# 拉取工作流用到的字体到 cutflow/fonts/（字体文件不进仓库）。
# 四款均为官方声明可免费商用的字体；交付客户前请再核对一次各自的授权页。
set -euo pipefail
cd "$(dirname "$0")/../fonts"
dl(){ [ -s "$1" ] || curl -fsSL --retry 3 -o "$1" "$2"; echo "ok  $1"; }
dl YouSheBiaoTiHei.ttf      "https://cdn.jsdelivr.net/npm/@fontpkg/you-she-biao-ti-hei@1.0.0/%E4%BC%98%E8%AE%BE%E6%A0%87%E9%A2%98%E9%BB%91.ttf"
dl ZCOOLQingKeHuangYou.ttf  "https://raw.githubusercontent.com/google/fonts/main/ofl/zcoolqingkehuangyou/ZCOOLQingKeHuangYou-Regular.ttf"
dl AlimamaShuHeiTi-Bold.ttf "https://cdn.jsdelivr.net/npm/@fontpkg/alimama-shu-hei-ti@1.0.5/AlimamaShuHeiTi-Bold.ttf"
dl MaShanZheng.ttf          "https://raw.githubusercontent.com/google/fonts/main/ofl/mashanzheng/MaShanZheng-Regular.ttf"
