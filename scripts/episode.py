#!/usr/bin/env python3
"""每一期的进度表：建目录、记到哪一步了、告诉人下一步该给什么。人不用记流程，助手每做完一步更新这里。
用法：
  scripts/episode.py new <期名> --line news|talk|pet     建一期：目录骨架 + 进度表 episodes/<期名>/进度.json
  scripts/episode.py status [<期名>]                     看这一期（不给就看最近一期）到哪了、下一步是什么
  scripts/episode.py done <期名> <步骤号> [--note 说明]   这一步完成
  scripts/episode.py list                                所有期和进度
每条线的步骤、每步要人提供什么、对应哪个技能，都在下面的 LINES 里，改流程只改这里。"""
import argparse, json, os, sys, time
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); E = os.path.join(R, "episodes")
# 每步：编号、名字、对应技能、要人给什么（空 = 助手自己做）、人要不要确认
LINES = {
 "news": [("1", "定稿", "video-01-script", "一个想法：讲什么事、给谁看、大概几分钟", "稿子"), ("2", "核对事实", "video-02-factcheck", "", "有出入的地方"),
          ("3", "配音对齐", "video-03-audio", "一条录音（自己念或 AI 配音都行）", ""), ("4", "找画面", "video-04-footage", "", "素材能不能用"),
          ("5", "定画面方案", "video-05-storyboard", "", "整体方向"), ("6", "先做一段", "video-06-build", "", "第一段小样"),
          ("7", "出片自查", "video-07-qc", "", "成片"), ("8", "封面发布", "video-08-cover", "", "发不发")],
 "talk": [("1", "定稿与拍摄", "talk-01-shoot", "一个想法；或者一条已经拍好的竖屏口播视频", "稿子"), ("2", "核对事实", "video-02-factcheck", "", "有出入的地方"),
          ("3", "粗剪对齐", "talk-02-roughcut", "（拍好的口播视频，第 1 步已经给了就不用再给）", "剪掉了哪几句"), ("4", "找证据画面", "video-04-footage", "", "素材能不能用"),
          ("5", "排版式", "talk-03-layout", "", "版式表"), ("6", "出片自查", "talk-04-build", "", "成片"), ("7", "封面发布", "video-08-cover", "", "发不发")],
 "pet":  [("1", "本期数据", "pet-01-growth", "上期视频的点赞、评论、转发、收藏、新关注数（后台截图也行）", ""), ("2", "读评论判路线", "pet-01-growth", "上期的评论（后台导出，或给链接让助手拉）", "AI 的判断和证据"),
          ("3", "本期宠物镜头", "pet-02-shots", "", "宠物在片中出现的位置和动作"), ("4", "叠进成片", "pet-02-shots", "这一期的成片工程（新闻线或口播线做好的）", "成片")],
}
def path(ep): return os.path.join(E, ep, "进度.json")
def load(ep):
    if not os.path.exists(path(ep)): sys.exit(f"没有这一期：{ep}（先 new）")
    return json.load(open(path(ep), encoding="utf-8"))
def latest():
    eps = [d for d in os.listdir(E) if os.path.exists(path(d))] if os.path.isdir(E) else []
    return max(eps, key=lambda d: os.path.getmtime(path(d))) if eps else None
def show(st):
    print(f"【{st['name']}】{ {'news': '事为主（横屏新闻解读）', 'talk': '人为主（竖屏口播）', 'pet': '频道宠物'}[st['line']]}")
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
    base = os.path.join(E, a.name)
    if os.path.exists(path(a.name)): sys.exit("这一期已经有了：" + a.name)
    for sd in ("01_输入素材", "03_制作过程"): os.makedirs(os.path.join(base, sd), exist_ok=True)
    st = {"name": a.name, "line": a.line, "created": time.strftime("%Y-%m-%d %H:%M"), "steps": [{"no": no, "name": nm, "skill": sk, "ask": ask, "confirm": cf, "done": False} for no, nm, sk, ask, cf in LINES[a.line]]}
    json.dump(st, open(path(a.name), "w", encoding="utf-8"), ensure_ascii=False, indent=1); print("已建好：episodes/" + a.name); show(st)
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
