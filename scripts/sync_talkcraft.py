#!/usr/bin/env python3
"""把 vendor/video-talkcraft 的 108 张动效卡接进 studio，能在同一个工程里预览和取用。
用法：scripts/sync_talkcraft.py
做两件事：
  1. 把 vendor/video-talkcraft/template/cards/*.tsx 复制到 studio/src/talkcraft/cards/（文件头加来源和许可说明、关掉类型检查，内容不改）
  2. 生成 studio/src/talkcraft/registry.ts（按分类排好的卡片清单）
来源许可是 PolyForm Noncommercial：个人、教育、研究用途免费，商用要先取得作者授权。这些卡不进我们自己的组件包。"""
import json, os, shutil
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); V = os.path.join(R, "vendor", "video-talkcraft"); D = os.path.join(R, "studio", "src", "talkcraft")
cards = json.load(open(os.path.join(V, "cards-index.json"), encoding="utf-8"))
order = ["字幕花字", "强调标注", "人物互动", "素材呈现", "数据信息图", "运镜", "转场结构"]; cards.sort(key=lambda x: (order.index(x["category"]), x["slug"]))
if os.path.exists(os.path.join(D, "cards")): shutil.rmtree(os.path.join(D, "cards"))
os.makedirs(os.path.join(D, "cards"))
HEAD = "// @ts-nocheck\n// 来源：https://github.com/Vincentwei1021/video-talkcraft（template/cards/%s.tsx），Copyright (c) 2026 Vincent Wei。\n// 许可：PolyForm Noncommercial 1.0.0，仅限非商用；商用须先取得作者授权。全文见 vendor/video-talkcraft/LICENSE。\n// 本文件由 scripts/sync_talkcraft.py 原样复制，不要在这里改；要改就复制到自己的目录再改。\n"
L = ["// 自动生成：scripts/sync_talkcraft.py。来源 vendor/video-talkcraft（PolyForm Noncommercial，仅限非商用）。不要手改。", "import React from 'react';"]
for i, x in enumerate(cards):
    src = open(os.path.join(V, "template", "cards", x["slug"] + ".tsx"), encoding="utf-8").read()
    open(os.path.join(D, "cards", x["slug"] + ".tsx"), "w", encoding="utf-8").write(HEAD % x["slug"] + src)
    L.append(f"import C{i}, {{ meta as M{i} }} from './cards/{x['slug']}';")
L += ["export type TcCard = { slug: string; zh: string; cat: string; Comp: React.FC<any>; meta: { width: number; height: number; fps: number; durationInFrames: number } };", "export const TC_CARDS: TcCard[] = ["]
L += [f"  {{ slug: '{x['slug']}', zh: '{x['zhName']}', cat: '{x['category']}', Comp: C{i} as React.FC<any>, meta: M{i} }}," for i, x in enumerate(cards)] + ["];"]
open(os.path.join(D, "registry.ts"), "w", encoding="utf-8").write("\n".join(L) + "\n"); print(len(cards), "张卡 →", D)
