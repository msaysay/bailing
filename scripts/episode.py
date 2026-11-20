#!/usr/bin/env python3
"""每一期的进度表：建目录、记到哪一步了、告诉人下一步该给什么。人不用记流程，助手每做完一步更新这里。
用法：
  scripts/episode.py new <期名> --line news|talk|wide|pet     建一期：目录骨架 + 进度表 episodes/<期名>/进度.json
  scripts/episode.py status [<期名>]                     看这一期（不给就看最近一期）到哪了、下一步是什么
  scripts/episode.py done <期名> <步骤号> [--note 说明]   这一步完成
  scripts/episode.py list                                所有期和进度
每条线的步骤、每步要人提供什么、对应哪个技能，都在下面的 LINES 里，改流程只改这里。"""
import argparse, json, os, sys, time
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); E = os.path.join(R, "episodes")
# 每步：编号、名字、对应技能、要人给什么（空 = 助手自己做）、人要确认什么（空 = 不用停）
LINES = {
 "news": [("1", "稿子", "make-news", "讲什么、给谁看、大概多长", "稿子，和查到的跟传闻不一样的地方"),
          ("2", "声音", "make-news", "一条录音；或者说「用 AI 配音」", ""),
          ("3", "画面素材", "make-news", "（可选）你想用的视频链接或文件", ""),
          ("4", "做片", "make-news", "", "前 20 秒小样，然后是成片"),
          ("5", "封面发布", "make-news", "", "封面和标题")],
 "talk": [("1", "收原片或写稿", "xiaolin-talk", "一条拍好的竖屏口播视频；还没拍就说讲什么", "稿子（已经拍好就跳过）"),
          ("2", "粗剪", "xiaolin-talk", "", "剪掉了哪几句"),
          ("3", "版式表", "xiaolin-talk", "", "版式表和素材清单"),
          ("4", "备素材", "xiaolin-talk", "（可选）你想用的画面、截图", ""),
          ("5", "搭画面出片", "xiaolin-talk", "", "关键帧，然后是成片"),
          ("6", "封面", "xiaolin-talk", "", "封面和标题")],
 "wide": [("1", "收原片或写稿", "ziqi-wide", "一条拍好的横屏口播视频；还没拍就说讲什么", "稿子和章节（已经拍好就只确认章节）"),
          ("2", "粗剪", "ziqi-wide", "", "剪掉了哪几句"),
          ("3", "章节和版式表", "ziqi-wide", "", "章节名、版式表和素材清单"),
          ("4", "备素材", "ziqi-wide", "（可选）你想用的画面、截图、数据", ""),
          ("5", "搭画面出片", "ziqi-wide", "", "第一章小样，然后是成片"),
          ("6", "封面", "ziqi-wide", "", "封面和标题")],
 "pet":  [("1", "成长结算", "pet", "上期的点赞、评论、转发、收藏、新关注，和上期评论", "涨了多少、AI 的判断和证据"),
          ("2", "叠进成片", "pet", "这一期做好的片子", "宠物出场、升级、片尾三处关键帧")],
}
def path(ep): return os.path.join(E, ep, "进度.json")
def load(ep):
    if not os.path.exists(path(ep)): sys.exit(f"没有这一期：{ep}（先 new）")
    return json.load(open(path(ep), encoding="utf-8"))
def latest():
    eps = [d for d in os.listdir(E) if os.path.exists(path(d))] if os.path.isdir(E) else []
    return max(eps, key=lambda d: os.path.getmtime(path(d))) if eps else None
def show(st):
    print(f"【{st['name']}】{ {'news': '事为主（横屏新闻解读）', 'talk': '人为主（竖屏口播）', 'wide': '人为主（横屏深度解读）', 'pet': '频道宠物'}[st['line']]}")
    if st.get("style"): print(f"风格：{st['style']}；可选功能：{'、'.join(st.get('options', [])) or '无'}" + (f"；字体包：{st['font']}" if st.get("font") else "") + f"（做法：python3 scripts/talk.py recipe {st['name']}）")
    nxt = None
    for s in st["steps"]:
        mark = "✓" if s["done"] else ("→" if nxt is None else " ")
        if not s["done"] and nxt is None: nxt = s
        print(f" {mark} {s['no']}. {s['name']}" + (f"  —— {s['note']}" if s.get("note") else ""))
    if nxt:
        print(f"\n下一步：{nxt['no']}. {nxt['name']}（技能 {nxt['skill']}）")
        print("需要你给：" + (nxt["ask"] or "不用，助手自己做"))
        if nxt["confirm"]: print("做完后要你确认：" + nxt["confirm"])
    else: print("\n这一期全部完成。")
    return nxt
a = argparse.ArgumentParser(); sub = a.add_subparsers(dest="cmd", required=True)
n = sub.add_parser("new"); n.add_argument("name"); n.add_argument("--line", required=True, choices=list(LINES))
s = sub.add_parser("status"); s.add_argument("name", nargs="?")
d = sub.add_parser("done"); d.add_argument("name"); d.add_argument("step"); d.add_argument("--note", default="")
sub.add_parser("list"); a = a.parse_args()
if a.cmd == "new":
    import re, shutil
    base = os.path.join(E, a.name)
    if os.path.exists(path(a.name)): sys.exit("这一期已经有了：" + a.name)
    for sd in ("01_输入素材", "03_制作过程"): os.makedirs(os.path.join(base, sd), exist_ok=True)
    m = re.match(r"(\d+)", a.name); slug = "ep" + (m.group(1).zfill(2) if m else time.strftime("%m%d%H%M"))
    st = {"name": a.name, "line": a.line, "slug": slug, "created": time.strftime("%Y-%m-%d %H:%M"), "steps": [{"no": no, "name": nm, "skill": sk, "ask": ask, "confirm": cf, "done": False} for no, nm, sk, ask, cf in LINES[a.line]]}
    if a.line in ("news", "talk", "wide"):   # 代码骨架 + 注册合成，助手直接往里加画面
        S = os.path.join(R, "studio"); code = os.path.join(S, "src", "episodes", slug); os.makedirs(code, exist_ok=True); os.makedirs(os.path.join(S, "public", slug), exist_ok=True)
        tpl = open(os.path.join(S, "templates", a.line + ".tsx"), encoding="utf-8").read().replace("__SLUG__", slug).replace("__SHOW__", "").replace("__TITLE__", a.name.split("_", 1)[-1])
        if not os.path.exists(os.path.join(code, "index.tsx")): open(os.path.join(code, "index.tsx"), "w", encoding="utf-8").write(tpl)
        if not os.path.exists(os.path.join(code, "timing.json")): json.dump({"fps": 30, "total": 10, "segments": [{"id": 1, "name": "开场", "start": 0, "end": 10, "lines": []}], "lines": []}, open(os.path.join(code, "timing.json"), "w"), ensure_ascii=False)
        reg = os.path.join(S, "src", "episodes", "_registry.tsx"); r = open(reg, encoding="utf-8").read(); V = slug.upper()
        if f"'./{slug}'" not in r:
            w, h = {"news": (1920, 1080), "talk": (1080, 1920), "wide": (1920, 1280)}[a.line]
            r = r.replace("import { Composition } from 'remotion';", f"import {{ Composition }} from 'remotion';\nimport {{ Episode as {V}, clock as {V}_C }} from './{slug}';")
            r = r.replace("  <>\n", f"  <>\n    <Composition id=\"{slug}\" component={{{V}}} width={{{w}}} height={{{h}}} fps={{{V}_C.fps}} durationInFrames={{Math.max(1, Math.ceil({V}_C.total * {V}_C.fps))}} />\n", 1)
            open(reg, "w", encoding="utf-8").write(r)
    json.dump(st, open(path(a.name), "w", encoding="utf-8"), ensure_ascii=False, indent=1); print(f"已建好：episodes/{a.name}（代号 {slug}）"); show(st)
elif a.cmd == "status":
    nm = a.name or latest()
    if not nm: sys.exit("还没有任何一期。")
    show(load(nm))
elif a.cmd == "done":
    st = load(a.name); hit = [x for x in st["steps"] if x["no"] == a.step]
    if not hit: sys.exit("没有这一步：" + a.step)
    hit[0]["done"] = True; hit[0]["note"] = a.note; hit[0]["at"] = time.strftime("%Y-%m-%d %H:%M")
    json.dump(st, open(path(a.name), "w", encoding="utf-8"), ensure_ascii=False, indent=1); show(st)
else:
    for nm in sorted(d for d in os.listdir(E) if os.path.exists(path(d))):
        st = load(nm); done = sum(x["done"] for x in st["steps"]); print(f"{nm}  {st['line']}  {done}/{len(st['steps'])}")
