#!/usr/bin/env python3
"""频道宠物的成长引擎。规则见 docs/宠物成长规则.md，参数在 pet/config.json。
用法：
  scripts/pet.py add <期号> --likes 1200 --comments 86 --shares 40 --saves 150 --follows 60 [--feeds 12] [--judge pet/episodes/<期号>.json]
      记一期的互动数据。--judge 是助手读完评论后写的路线判断（格式见下），没有就只加经验。
  scripts/pet.py status                     打印当前等级、阶段、各路线分
  scripts/pet.py export <期号> <输出.json>   导出这一期给视频用的数据（上期结束时的状态、这期涨了多少、有没有升级或进化）
路线判断文件（助手读完评论写）：
  {"ai": {"tech": 31, "gold": 12, "flame": 8, "star": 20}, "votes": {"tech": 5, "star": 9},
   "evidence": {"tech": ["评论原文…"], "star": ["…"]}, "note": "这期大家在聊……"}
状态保存在 pet/state.json，每期一条历史，可以回放。"""
import argparse, json, math, os, sys
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); CFG = json.load(open(os.path.join(R, "pet", "config.json"), encoding="utf-8")); SP = os.path.join(R, "pet", "state.json")
def need(n): return CFG["level_base"] * (n + 1) ** CFG["level_power"]   # 从 Lv n 升到 n+1 要的经验
def level_of(xp):
    n = 0
    while xp >= need(n): xp -= need(n); n += 1
    return n, xp, need(n)
def stage_of(lv): return [s for s in CFG["stages"] if lv >= s["from"]][-1]
def load(): return json.load(open(SP, encoding="utf-8")) if os.path.exists(SP) else {"xp": 0, "routes": {k: 0 for k in CFG["routes"]}, "route": None, "history": []}
def save(st): json.dump(st, open(SP, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
def route_points(j):
    ai, votes = j.get("ai", {}), j.get("votes", {}); a, v = sum(ai.values()) or 0, sum(votes.values()) or 0
    cap = CFG["vote_cap"] * (a / (1 - CFG["vote_cap"])) if a else 0; k = min(1, cap / v) if v else 0   # 投票最多占 30%
    return {r: round(ai.get(r, 0) + votes.get(r, 0) * k, 2) for r in CFG["routes"]}
def pick_route(routes):
    vals = sorted(routes.values()); hi, lo = vals[-1], vals[0]
    if hi > 0 and (hi - lo) / hi < CFG["hidden_route_gap"]: return "hidden"
    return max(routes, key=routes.get)
def add(a):
    st = load(); w = CFG["weights"]; gain = {k: getattr(a, k) * w[k] for k in w}; xp = sum(gain.values())
    lv0 = level_of(st["xp"])[0]; st["xp"] += xp; lv1 = level_of(st["xp"])[0]
    rp = route_points(json.load(open(a.judge, encoding="utf-8"))) if a.judge else {r: 0 for r in CFG["routes"]}
    if st["route"] is None:
        for r in rp: st["routes"][r] = round(st["routes"][r] + rp[r], 2)
    evolved = None
    if st["route"] is None and lv1 >= 20 > lv0: st["route"] = evolved = pick_route(st["routes"])
    st["history"] = [h for h in st["history"] if h["ep"] != a.ep] + [{"ep": a.ep, "xp_gain": xp, "detail": gain, "route_gain": rp, "lv_before": lv0, "lv_after": lv1, "evolved": evolved}]
    save(st); print(f"{a.ep}：+{xp} 经验，Lv {lv0} → {lv1}（{stage_of(lv1)['name']}）" + (f"，进化为「{CFG['routes'].get(evolved, '隐藏路线')}」" if evolved else ""))
def status(_):
    st = load(); lv, cur, nx = level_of(st["xp"]); print(f"总经验 {st['xp']}，Lv {lv}（{stage_of(lv)['name']}），本级 {cur:.0f}/{nx:.0f}")
    print("路线分：", "，".join(f"{CFG['routes'][k]} {v}" for k, v in st["routes"].items()), "；已定路线：", st["route"])
def export(a):
    st = load(); h = next((x for x in st["history"] if x["ep"] == a.ep), None)
    if not h: sys.exit("这一期还没记数据")
    idx = st["history"].index(h); xp_before = sum(x["xp_gain"] for x in st["history"][:idx]); xp_after = xp_before + h["xp_gain"]
    routes = {r: round(sum(x["route_gain"][r] for x in st["history"][:idx + 1]), 2) for r in CFG["routes"]}
    def snap(xp): lv, cur, nx = level_of(xp); s = stage_of(lv); return {"xp": xp, "level": lv, "cur": round(cur), "next": round(nx), "stage": s["id"], "stageName": s["name"]}
    out = {"ep": a.ep, "before": snap(xp_before), "after": snap(xp_after), "gain": h["xp_gain"], "detail": h["detail"], "routes": routes, "routeNames": CFG["routes"], "route": st["route"] if h["lv_after"] >= 20 else None, "evolved": h["evolved"]}
    os.makedirs(os.path.dirname(os.path.abspath(a.out)), exist_ok=True); json.dump(out, open(a.out, "w", encoding="utf-8"), ensure_ascii=False, indent=1); print("写入", a.out)
ap = argparse.ArgumentParser(); sub = ap.add_subparsers(dest="cmd", required=True)
x = sub.add_parser("add"); x.add_argument("ep")
for k in ("likes", "comments", "shares", "saves", "follows", "feeds"): x.add_argument("--" + k, type=int, default=0)
x.add_argument("--judge"); sub.add_parser("status"); e = sub.add_parser("export"); e.add_argument("ep"); e.add_argument("out")
a = ap.parse_args(); {"add": add, "status": status, "export": export}[a.cmd](a)
