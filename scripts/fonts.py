#!/usr/bin/env python3
"""共用字体库：五种口播风格都从这里挑字体。字体目录在 fonts/library.json，文件装在 studio/public/fonts/。
  scripts/fonts.py list [--style 风格] [--cat 类别]     看有哪些字体包、哪些字体（✓ 是已经装了的）
  scripts/fonts.py install <字体包|字体编号|all|packs>…  下载安装。all 是全部字体（约 600 MB），packs 是所有字体包用到的
  scripts/fonts.py preview [字体包…] [--style 风格] [--text 一句话] [--out 样张.jpg]
                                                        出字体包样张（不给包名就出这种风格适合的全部），先看图再挑
  scripts/fonts.py preview --fonts [--out 样张.jpg]      出已安装的单个字体的样张
  scripts/fonts.py use <字体包|default> --style <风格|all>
                                                        把字体包套到一种风格上，以后这种风格出片都用它；default 换回原配
  scripts/fonts.py status                               每种风格现在用的是哪个包
风格：xiaolin 财经解读风 · danjie 商业快节奏风 · zhanpeng 知识科普风 · frame 相框老板风 · interview 访谈纪实风 · ziqi 横屏深度解读风
每个字体包四个角色：sub 字幕、title 标题和花字、accent 金句和大字、num 数字。每种风格怎么用它们，list 里会写。
加字体：在 fonts/library.json 的 fonts 里加一项（文件名、下载地址、授权），再在 packs 里搭一个包。
自己买的商业字体：把文件放进 studio/public/fonts/，同样登记一项（urls 留空数组），不会被打包分发。"""
import sys as _sys
for _s in (_sys.stdout, _sys.stderr): getattr(_s, "reconfigure", lambda **k: None)(encoding="utf-8", errors="replace")   # Windows 终端也能打印中文
import argparse, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import fontlib as fl
ap = argparse.ArgumentParser(); sub = ap.add_subparsers(dest="cmd", required=True)
x = sub.add_parser("list"); x.add_argument("--style", choices=fl.STYLES); x.add_argument("--cat")
x = sub.add_parser("install"); x.add_argument("names", nargs="+")
x = sub.add_parser("preview"); x.add_argument("names", nargs="*"); x.add_argument("--style", choices=fl.STYLES); x.add_argument("--text"); x.add_argument("--out"); x.add_argument("--fonts", action="store_true")
x = sub.add_parser("use"); x.add_argument("pack"); x.add_argument("--style", required=True)
sub.add_parser("status"); a = ap.parse_args(); L = fl.lib(); F = L["fonts"]; P = L["packs"]
def have(pack): return all(fl.installed(i) for i in fl.pack_fonts(pack))
if a.cmd == "list":
    act = fl.active()
    if a.style: print(f"{L['styles'][a.style]['name']}（{a.style}）怎么用字体包：{L['styles'][a.style]['roles']}\n")
    print("字体包（✓ 已装齐，● 正在用）：")
    for n, p in P.items():
        if a.style and a.style not in p["fit"]: continue
        using = [s for s in fl.STYLES if act[s] == n]
        print(f" {'✓' if have(n) else ' '}{'●' if using else ' '} {n:18s}{p['name']} —— {p['note']}")
        print(f"      适合：{'、'.join(L['styles'][s]['name'] for s in p['fit'])}　字体：" + "，".join(f"{r} {F[p['roles'][r]]['name']}" for r in fl.ROLES))
    if not a.style:
        print("\n单个字体（✓ 已安装）：")
        for cat in dict.fromkeys(f["cat"] for f in F.values()):
            if a.cat and a.cat != cat: continue
            print(f" 【{cat}】")
            for i, f in F.items():
                if f["cat"] == cat: print(f"  {'✓' if fl.installed(i) else ' '} {i:22s}{f['name']}　{f['mood']}　〔{f['license']}〕")
    print("\n挑字体：scripts/fonts.py preview --style <风格> 出样张；定了之后 scripts/fonts.py use <包> --style <风格>")
elif a.cmd == "install":
    ids = []
    for n in a.names:
        if n == "all": ids += list(F)
        elif n == "packs": ids += [i for p in P for i in fl.pack_fonts(p)]
        elif n in P: ids += fl.pack_fonts(n)
        elif n in F: ids.append(n)
        elif n in fl.STYLES: ids += [i for p, v in P.items() if n in v["fit"] for i in fl.pack_fonts(p)]
        else: sys.exit(f"不认识「{n}」：既不是字体包、字体编号，也不是风格名")
    ids = list(dict.fromkeys(ids)); bad = fl.install(ids)
    print(f"装好 {len(ids) - len(bad)} / {len(ids)} 个字体。" + ("没装上：" + "、".join(F[i]["name"] for i in bad) if bad else ""))
    sys.exit(1 if bad else 0)
elif a.cmd == "preview":
    out = a.out or os.path.join(fl.R, "studio", "out", "字体样张.jpg"); os.makedirs(os.path.dirname(out), exist_ok=True)
    if a.fonts:
        got = fl.font_sheet(list(F), out, *( [a.text] if a.text else [])); print(f"画了 {len(got)} 款已安装的字体 → {out}" if got else "还没有装任何字体：scripts/fonts.py install packs")
    else:
        names = a.names or [n for n, p in P.items() if not a.style or a.style in p["fit"]]
        for n in names: fl.pack(n)
        got = fl.sheet(names, out, a.text, f"{L['styles'][a.style]['name']}可用的字体包" if a.style else None)
        miss = [n for n in names if n not in got]
        print(f"样张 → {out}（{len(got)} 个包）" + (f"；这些包的字体没下到，没画：{'、'.join(miss)}" if miss else ""))
        print("用看图工具看样张，把图发给用户让他挑；定了之后：scripts/fonts.py use <包> --style <风格>")
elif a.cmd == "use":
    for s in (fl.STYLES if a.style == "all" else [a.style]):
        if a.style == "all" and a.pack != "default" and s not in fl.pack(a.pack)["fit"]: print(f"· {L['styles'][s]['name']}：这个包不是为它搭的，跳过（要强行用就单独指定 --style {s}）"); continue
        print("✓ " + fl.apply(s, a.pack))
    print("已经渲染过的片子不会变，重新渲染才生效。")
else:
    for s, n in fl.active().items(): print(f"{L['styles'][s]['name']:8s}（{s}）：{n}　{P[n]['name']}" + ("" if have(n) or s == "zhanpeng" else "　← 字体还没装：scripts/fonts.py install " + n))
