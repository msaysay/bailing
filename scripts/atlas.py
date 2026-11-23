#!/usr/bin/env python3
"""视觉图鉴的命令行版（给没法开浏览器的 AI 助手用）。数据和网页版是同一份（site/atlas-data.js）。
  python3 scripts/atlas.py find 推近            按中文或英文搜专业名词，打印编号、解释和问法
  python3 scripts/atlas.py packs                 名词库有哪几个包
  python3 scripts/atlas.py styles                风格库里的 15 种动态设计风格
  python3 scripts/atlas.py style 拼贴            打印这种风格的特征和完整提示词
  python3 scripts/atlas.py mix 拼贴 HUD [像素] [--brand ningshao] [--use "一条 60 秒横屏口播"]   生成混搭提示词，带上个人指纹
个人指纹在 brands/<品牌>/fingerprint.json。网页版：site/atlas.html。"""
import argparse, json, os, sys
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
D = json.loads(open(os.path.join(R, "site", "atlas-data.js"), encoding="utf8").read().split("=", 1)[1].rstrip(";\n"))
def pick(q):
    m = [s for s in D["mg"] if q.lower() in (s["name"] + s["en"] + s["id"]).lower()]
    if not m: sys.exit(f"风格库里没找到「{q}」。python3 scripts/atlas.py styles 看有哪些")
    return m[0]
ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter); sub = ap.add_subparsers(dest="cmd", required=True)
p = sub.add_parser("find"); p.add_argument("q"); sub.add_parser("packs"); sub.add_parser("styles"); p = sub.add_parser("style"); p.add_argument("q")
p = sub.add_parser("mix"); p.add_argument("names", nargs="+"); p.add_argument("--brand", default="ningshao"); p.add_argument("--use", default="一条 60 秒的横屏口播")
a = ap.parse_args()
if a.cmd == "find":
    hit = [t for t in D["terms"] if a.q.lower() in (t["name"] + t["en"] + t["mean"] + t["cat"]).lower()]
    for t in hit: print(f'#{t["id"]} {t["name"]}（{t["en"]}）· {t["cat"]}\n    {t["mean"]}\n    问法：{t["ask"]}')
    print(f"\n{len(hit)} 个。对 AI 可以直接说「用 motion-prompt 的 #编号」。")
elif a.cmd == "packs":
    for k in D["packs"]: print(f'{k["id"]:<8} {k["title"]}（{k["n"]} 个）')
elif a.cmd == "styles":
    for s in D["mg"]: print(f'{s["name"]}（{s["en"]}）\n    {s["look"]}')
elif a.cmd == "style":
    s = pick(a.q); print(f'{s["name"]}（{s["en"]}）\n{s["intro"]}\n视觉特征：{s["look"]}\n出处：{s["src"]}\n\n—— 提示词 ——\n{s["prompt"]}')
else:
    ss = [pick(n) for n in a.names][:3]; fp = json.load(open(os.path.join(R, "brands", a.brand, "fingerprint.json"), encoding="utf8")); roles = ["版式和节奏", "质感和配色倾向", "点睛的一两个标志性动效"]
    print(f"请把下面 {len(ss)} 种风格混搭成一种属于我自己的新风格，用在：{a.use}。\n")
    for i, s in enumerate(ss): print(f'【{s["name"]}】取它的{roles[i]}\n  特征：{s["look"]}')
    print(f'\n我的个人指纹（任何混搭都必须保留，和上面冲突时以这里为准）：\n- 署名：{fp["name"]}｜{fp["slogan"]}\n- 配色：' + "，".join(f"{k} {v}" for k, v in fp["colors"].items()) + "\n- 字体：" + "，".join(f"{k} {v}" for k, v in fp["fonts"].items()) + f'\n- 动效习惯：{fp["motion"]}\n- 规矩：' + "；".join(fp["rules"]))
    print("\n请先给我 3 个混搭方向，每个方向写清：一句话描述、配色怎么用、三个标志性动效（用专业名词）、不能做的事。我选定后先出 3 张关键帧，再做整条。")
