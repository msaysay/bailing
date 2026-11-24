#!/usr/bin/env python3
"""骨架：一条片子的审美底子。一条片子只用一个骨架（对标大 V 的整套模板，或不出镜线上我们自己定的那套），
组件和动效是往骨架里填的东西，只从骨架允许的范围里挑。配置在 styles/skeletons.json。

  python3 scripts/skeleton.py list                                   全部骨架
  python3 scripts/skeleton.py pick --type 科技 [--no-face] [--wide]   按「出不出镜、横竖屏、讲什么」推荐一个骨架（固定规则，不随机）
  python3 scripts/skeleton.py show <骨架>                            这个骨架锁死什么、能换什么、能用哪些组件
  python3 scripts/skeleton.py blocks <骨架>                          列出这个骨架能用的组件（编号、名字、什么时候用）
  python3 scripts/skeleton.py rules                                  组合的总规矩和新骨架的入库门槛
  python3 scripts/skeleton.py build                                  生成网页用的 site/atlas-skel.js"""
import argparse, json, os, sys

R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
D = json.load(open(os.path.join(R, "styles", "skeletons.json"), encoding="utf8")); SK = D["skeletons"]


def find(k):
    for s in SK:
        if k in (s["id"], s["name"]): return s
    sys.exit(f"没有这个骨架：{k}。可选：" + "、".join(s["id"] for s in SK))


def pick(typ, face=True, wide=False):
    """先按出不出镜、横竖屏筛；再看内容类型在不在「适合」里，越靠前越合适；都不合适就给这一栏的第一个。"""
    pool = [s for s in SK if s["face"] == face and (not face or (s["orient"] == "横屏") == wide)] or [s for s in SK if s["face"] == face]
    return sorted(pool, key=lambda s: s["fits"].index(typ) if typ in s["fits"] else 99)


CJ = os.path.join(R, "styles", "components.json")   # 组件清单的副本：包里不带官网目录时用它


def comps():
    f = os.path.join(R, "site", "data.js")
    if os.path.exists(f):
        s = open(f, encoding="utf8").read(); return json.loads(s[s.index("{"): s.rindex("}") + 1])["components"]
    return json.load(open(CJ, encoding="utf8"))


def show(s):
    print(f"【{s['name']}】（{s['id']}）{s['ref']}\n  {'出镜' if s['face'] else '不出镜'} · {s['orient']} · 适合：{'、'.join(s['fits'])}\n  长什么样：{s['look']}")
    print("  锁死不换：" + "；".join(s["lock"])); print("  可以换：" + "；".join(s["swap"]))
    print("  能用的组件：" + "、".join(s["blocks"])); print("  不要用：" + "、".join(s["avoid"]))
    print(f"  怎么做：技能 {s['skill']}" + (f"（python3 scripts/talk.py new <期名> --style {s['style']} …）" if s["style"] else ""))


PV = os.path.join(R, "styles", "previews")


def sheet():
    """把每个骨架的样图拼成一张总览，方便在聊天里一次发给用户看。"""
    try: from PIL import Image, ImageDraw, ImageFont
    except ImportError: print("没装 Pillow，跳过总览图（pip install pillow）"); return
    ft = next((f for f in (os.path.join(R, "studio", "public", "fonts", n) for n in ("SourceHanSansSC-Heavy.otf", "MiSans-Heavy.otf")) if os.path.exists(f)), None)
    if not ft: print("没找到中文字体，跳过总览图（先跑 python3 scripts/doctor.py --fix）"); return
    f = lambda z: ImageFont.truetype(ft, z); cw, ch, cols = 440, 330, 4; rows = (len(SK) + cols - 1) // cols
    S = Image.new("RGB", (cols * cw + 20, rows * (ch + 100) + 70), "#0A0A0B"); d = ImageDraw.Draw(S); d.text((20, 16), f"{len(SK)} 个骨架 · 回编号选一个", font=f(28), fill="#F4F2EC")
    for n, k in enumerate(SK):
        x = 20 + (n % cols) * cw; y = 66 + (n // cols) * (ch + 100); S.paste("#15161a", (x, y, x + cw - 20, y + ch)); pf = os.path.join(PV, k["id"] + ".jpg")
        if os.path.exists(pf): im = Image.open(pf).convert("RGB"); im.thumbnail((cw - 20, ch)); S.paste(im, (x + (cw - 20 - im.width) // 2, y + (ch - im.height) // 2))
        d.text((x, y + ch + 8), f"{n + 1}  {k['name']}", font=f(26), fill="#D6FF3D"); d.text((x, y + ch + 46), ("出镜" if k["face"] else "不出镜") + " · " + k["orient"] + " · " + k["ref"][:16], font=f(18), fill="#9a9a9a")
    o = os.path.join(PV, "总览.jpg"); S.save(o, quality=88); print(o)


def form():
    """开工单：一页点完所有问题（带每个骨架的样图），复制一段话发给 AI。"""
    t = open(os.path.join(R, "styles", "开工单-模板.html"), encoding="utf8").read().replace("/*SKEL*/[]", json.dumps(SK, ensure_ascii=False))
    o = os.path.join(R, "开工单.html"); open(o, "w", encoding="utf8").write(t); print(o)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter); sub = ap.add_subparsers(dest="cmd", required=True)
    sub.add_parser("list"); sub.add_parser("rules"); sub.add_parser("build")
    p = sub.add_parser("pick"); p.add_argument("--type", required=True); p.add_argument("--no-face", action="store_true"); p.add_argument("--wide", action="store_true")
    p = sub.add_parser("show"); p.add_argument("id")
    p = sub.add_parser("blocks"); p.add_argument("id")
    a = ap.parse_args()
    if a.cmd == "list":
        for s in SK: print(f"  {s['id']:<10} {s['name']}　{'出镜' if s['face'] else '不出镜'} · {s['orient']}　{s['ref']}　适合：{'、'.join(s['fits'])}")
    elif a.cmd == "rules":
        print("组合的总规矩："); [print(f"  {i + 1}. {x}") for i, x in enumerate(D["总规矩"])]
        print("新骨架的入库门槛（三条都满足才进自动流程）："); [print(f"  {i + 1}. {x}") for i, x in enumerate(D["入库门槛"])]
    elif a.cmd == "pick":
        r = pick(a.type, not a.no_face, a.wide); hit = a.type in r[0]["fits"]
        print("推荐：" if hit else f"没有专门给「{a.type}」的骨架，按最稳的给："); show(r[0])
        if len(r) > 1: print("\n备选：" + "；".join(f"{s['name']}（{s['id']}）" for s in r[1:3]))
    elif a.cmd == "show": show(find(a.id))
    elif a.cmd == "blocks":
        s = find(a.id); ok = set(s["blocks"])
        for c in comps():
            if c["group"] in ok: print(f"  {c['id']:<5}{c['name']}　[{c['group']}]　{c['use']}")
    elif a.cmd == "build":
        json.dump([{k: c[k] for k in ("id", "name", "export", "file", "group", "use", "avoid", "props")} for c in comps()], open(CJ, "w", encoding="utf8"), ensure_ascii=False, indent=0); print(CJ)
        sheet(); form()
        if not os.path.isdir(os.path.join(R, "site")): return
        o = os.path.join(R, "site", "atlas-skel.js"); open(o, "w", encoding="utf8").write("window.ATLAS_SKEL = " + json.dumps({"rules": D["总规矩"], "gate": D["入库门槛"], "skeletons": SK}, ensure_ascii=False) + ";\n"); print(o)


if __name__ == "__main__":
    main()
