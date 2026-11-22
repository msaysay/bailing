#!/usr/bin/env python3
"""手势全息风 · 总入口。第一人称拍一段「对着空气点点划划」的原片，出一条悬浮界面 + 卡点快切的成片。

  python3 scripts/hud.py new   <期名> --video 原片.mp4 [--start 0 --end 12]   认手、算镜头、抠手、列出手势时刻，并生成 plan.json 的初稿
  python3 scripts/hud.py demo  <期名>                                         没有原片也能先看界面动画（用替身背景）
  python3 scripts/hud.py music <期名>                                         按 plan.json 合成配乐（速度自动对齐转场）
  python3 scripts/hud.py sheet <期名>                                         出关键帧联系表（先看这个，再渲整条）
  python3 scripts/hud.py render <期名>                                        出成片 episodes/<期名>/out/<期名>.mp4
  python3 scripts/hud.py check <期名>                                         查 plan.json：时刻有没有超出、素材在不在、拍子对不对

plan.json 在 episodes/<期名>/plan.json，是这一期唯一要改的文件。写法见 docs/手势全息风-做法.md。
"""
import argparse, glob, json, os, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STUDIO = os.path.join(ROOT, "studio"); PUB = os.path.join(STUDIO, "public")


def plan_path(ep): return os.path.join(ROOT, "episodes", ep, "plan.json")
def load(ep):
    p = plan_path(ep)
    if not os.path.exists(p): sys.exit(f"没有 {p}，先 hud.py new 或 hud.py demo")
    return json.load(open(p, encoding="utf8"))


def save(ep, plan):
    os.makedirs(os.path.dirname(plan_path(ep)), exist_ok=True); json.dump(plan, open(plan_path(ep), "w", encoding="utf8"), ensure_ascii=False, indent=1)


def browser():
    for pat in ("/opt/pw-browsers/chromium-*/chrome-linux*/chrome", os.path.expanduser("~/.cache/ms-playwright/chromium-*/chrome-linux*/chrome")):
        g = sorted(glob.glob(pat))
        if g: return ["--browser-executable", g[-1]]
    return []


def bars_of(E): return max(4, int(round(E / 2.0)))
def bpm_of(E): return bars_of(E) * 240 / E


def total_of(plan):
    beat = 60 / bpm_of(plan["hudEnd"]); return round(plan["hudEnd"] + sum(c["beats"] for c in plan["cuts"]) * beat + (2.5 if plan.get("end") else 0), 3)


def starter(ep, hud_end, moments, footage=True):
    """plan.json 初稿：一套完整的界面流程，时刻按手势时刻表大致摆好；没有原片就按固定节奏摆。"""
    E = hud_end; k = E / 11.8

    def near(t, kinds=None):                      # 找离 t 最近的手势时刻，没有就用 t
        c = [m for m in moments if (not kinds or m["type"][0] in kinds) and abs(m["t"] - t) < 0.8]
        return min(c, key=lambda m: abs(m["t"] - t))["t"] if c else round(t, 2)
    t_av, t_pn, t_rb, t_pk, t_ck, t_dl = near(0.3 * k), near(1.2 * k, "张划"), near(2.4 * k, "划"), near(5.6 * k, "点捏"), 6.3 * k, near(8.2 * k, "点捏")
    return {
        "说明": "时刻单位是秒；x、y 是 1080×1920 画面里的位置（anchor 是 world 的按原片第 0 帧看到的位置写）。改完跑 hud.py check。",
        "dir": ep, "footage": footage, "hudEnd": round(E, 2), "bpm": round(bpm_of(E), 2), "accent": "#FFC83D", "cool": "#3DD6FF", "brand": "",
        "items": [
            {"type": "avatar", "at": t_av, "out": round(t_pn, 2), "anchor": "world", "x": 540, "y": 560, "name": "我"},
            {"type": "panel", "at": t_pn, "out": round(E - 0.25, 2), "anchor": "world", "x": 540, "y": 520, "from": [540, 1250], "title": "你的名字", "sub": "AI WORKFLOW", "slogan": "ONE TAKE · ONE CLICK · ONE FILM",
             "tiles": [{"k": "风格", "v": "6"}, {"k": "组件", "v": "298"}, {"k": "字体", "v": "59"}, {"k": "今日", "v": "GO", "hot": True}]},
            {"type": "ribbon", "at": t_rb, "out": round(t_pk - 0.2, 2), "anchor": "screen", "y": 860, "label": "选 一 种 风 格", "items": ["财经解读", "商业快节奏", "知识科普", "相框老板", "访谈纪实", "深度解读"], "pick": 0, "pickAt": round(t_pk - 0.5, 2)},
            {"type": "pick", "at": t_pk, "out": round(t_dl, 2), "anchor": "world", "x": 560, "y": 1180, "label": "财经解读风"},
            {"type": "checks", "at": round(t_ck, 2), "out": round(E - 0.25, 2), "anchor": "world", "x": 90, "y": 1050, "items": [{"t": round(t_ck + 0.3, 2), "text": "去口吃"}, {"t": round(t_ck + 0.8, 2), "text": "降噪"}, {"t": round(t_ck + 1.3, 2), "text": "配乐"}]},
            {"type": "holo", "at": t_dl, "out": round(E, 2), "anchor": "world", "x": 600, "y": 1420, "t0": round(t_dl + 0.5, 2), "t1": round(E - 0.5, 2), "src": ""},
            {"type": "dial", "at": round(t_dl + 0.3, 2), "out": round(E - 0.1, 2), "anchor": "world", "x": 860, "y": 1330, "r": 130, "t0": round(t_dl + 0.5, 2), "t1": round(E - 0.5, 2), "label": "剪辑中", "done": "成片"},
        ],
        "cuts": [{"src": "", "from": 0, "beats": 4, "fx": "punch", "label": ""}, {"src": "", "from": 0, "beats": 4, "fx": "rgb"}, {"src": "", "from": 0, "beats": 2, "fx": "whip"}, {"src": "", "from": 0, "beats": 2, "fx": "iris"}, {"src": "", "from": 0, "beats": 4, "fx": "punch"}, {"src": "", "from": 0, "beats": 8, "fx": "flash"}],
        "end": {"title": "一句收尾的话", "sub": ""},
    }


def cmd_new(a):
    args = [sys.executable, os.path.join(ROOT, "scripts", "hud_track.py"), a.video, "--ep", a.ep, "--start", str(a.start)] + (["--end", str(a.end)] if a.end else [])
    subprocess.run(args, check=True); tr = json.load(open(os.path.join(PUB, a.ep, "track.json")))
    if os.path.exists(plan_path(a.ep)) and not a.force: print(f"plan.json 已经有了，没动它（要重来加 --force）"); return
    plan = starter(a.ep, tr["frames"] / tr["fps"], tr["moments"]); plan["total"] = total_of(plan); save(a.ep, plan)
    print(f"\nplan.json 初稿：{plan_path(a.ep)}\n下一步：看 studio/public/{a.ep}/moments.jpg，把界面件的时刻和位置对到手上；cuts 里填素材；然后 hud.py music → sheet → render")


def cmd_demo(a):
    if os.path.exists(plan_path(a.ep)) and not a.force: sys.exit("plan.json 已经有了（要重来加 --force）")
    os.makedirs(os.path.join(PUB, a.ep), exist_ok=True); plan = starter(a.ep, a.len, [], footage=False); plan["cuts"] = []; plan["end"] = {"title": "界面动画样片", "sub": "换上你拍的原片，手会挡在界面前面"}; plan["total"] = total_of(plan); save(a.ep, plan)
    print(f"替身背景的样片 plan：{plan_path(a.ep)}\n下一步：hud.py music {a.ep} && hud.py render {a.ep}")


def check(ep, plan):
    bad = []; E = plan["hudEnd"]
    for i, it in enumerate(plan["items"]):
        if it["at"] >= E: bad.append(f"items[{i}] {it['type']}：出现时刻 {it['at']} 在全息段结束（{E}）之后")
        if it.get("out", 1e9) <= it["at"]: bad.append(f"items[{i}] {it['type']}：消失比出现还早")
        for k in ("img", "src"):
            if it.get(k) and not os.path.exists(os.path.join(PUB, it[k])): bad.append(f"items[{i}] {it['type']}：找不到 studio/public/{it[k]}")
        if it["type"] == "holo" and not it.get("src"): bad.append(f"items[{i}] holo：src 还空着（全息屏里放哪条片子）")
    for i, c in enumerate(plan["cuts"]):
        if not c.get("src"): bad.append(f"cuts[{i}]：src 还空着")
        elif not os.path.exists(os.path.join(PUB, c["src"])): bad.append(f"cuts[{i}]：找不到 studio/public/{c['src']}")
    if plan.get("footage", True):
        for f in ("base.mp4", "track.json"):
            if not os.path.exists(os.path.join(PUB, plan["dir"], f)): bad.append(f"缺 studio/public/{plan['dir']}/{f}（先跑 hud.py new）")
    if abs(plan["bpm"] - bpm_of(E)) > 0.5: bad.append(f"bpm 应该是 {bpm_of(E):.2f}（全息段整数个小节正好到转场），现在是 {plan['bpm']}")
    return bad


def cmd_check(a):
    plan = load(a.ep); bad = check(a.ep, plan)
    for b in bad: print("✗", b)
    print("全部通过" if not bad else f"\n{len(bad)} 处要改"); sys.exit(1 if bad else 0)


def prep(ep):
    plan = load(ep); plan["bpm"] = round(bpm_of(plan["hudEnd"]), 3); plan["total"] = total_of(plan)
    plan["items"] = [it for it in plan["items"] if not (it["type"] == "holo" and it.get("src") == "" and plan.get("footage") is False and False)]
    tj = os.path.join(PUB, plan["dir"], "track.json")
    if plan.get("footage", True) and os.path.exists(tj) and "w" not in plan: t_ = json.load(open(tj)); plan["w"], plan["h"] = t_["w"], t_["h"]
    m = os.path.join(PUB, plan["dir"], "music.wav")
    if os.path.exists(m): plan["music"] = plan["dir"] + "/music.wav"
    props = os.path.join(PUB, plan["dir"], "props.json"); json.dump({k: v for k, v in plan.items() if k != "说明"}, open(props, "w", encoding="utf8"), ensure_ascii=False)
    return plan, props


def cmd_music(a):
    plan, _ = prep(a.ep); tmp = os.path.join(PUB, plan["dir"], "plan.tmp.json"); json.dump(plan, open(tmp, "w", encoding="utf8"), ensure_ascii=False)
    subprocess.run([sys.executable, os.path.join(ROOT, "scripts", "hud_music.py"), "--plan", tmp, "--total", str(plan["total"]), "--seed", str(a.seed), "--key", str(a.key)], check=True); os.remove(tmp)


def cmd_sheet(a):
    plan, props = prep(a.ep); out = os.path.join(ROOT, "episodes", a.ep, "out", "sheet"); os.makedirs(out, exist_ok=True); n = a.n; fps = 30
    ts = [plan["total"] * (i + 0.5) / n for i in range(n)]
    for i, t in enumerate(ts):
        subprocess.run(["npx", "remotion", "still", "src/index.tsx", "HUD", os.path.join(out, f"{i:02d}.jpg"), "--frame", str(int(t * fps)), "--props", props, "--scale", "0.25" if plan.get("h", 1920) > plan.get("w", 1080) else "0.2", "--jpeg-quality", "80", "--log", "error", *browser()], cwd=STUDIO, check=True)
    cols = 8 if plan.get("h", 1920) > plan.get("w", 1080) else 5; rows = (n + cols - 1) // cols; sheet = os.path.join(ROOT, "episodes", a.ep, "out", "关键帧.jpg")
    subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-framerate", "1", "-i", os.path.join(out, "%02d.jpg"), "-vf", f"tile={cols}x{rows}", "-frames:v", "1", sheet], check=True)
    print("关键帧：", sheet, "\n各格的时刻（秒）：", " ".join(f"{t:.1f}" for t in ts))


def cmd_render(a):
    plan, props = prep(a.ep); bad = check(a.ep, plan)
    if bad and not a.force:
        for b in bad: print("✗", b)
        sys.exit("先把上面的改掉（或者加 --force 硬渲）")
    out = os.path.join(ROOT, "episodes", a.ep, "out", f"{a.ep}.mp4"); os.makedirs(os.path.dirname(out), exist_ok=True)
    subprocess.run(["npx", "remotion", "render", "src/index.tsx", "HUD", out, "--props", props, "--crf", "17", "--concurrency", str(max(1, min(a.jobs, os.cpu_count() or 1))), "--log", "error", *browser()], cwd=STUDIO, check=True)
    print("成片：", out)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter); sub = ap.add_subparsers(dest="cmd", required=True)
    p = sub.add_parser("new"); p.add_argument("ep"); p.add_argument("--video", required=True); p.add_argument("--start", type=float, default=0); p.add_argument("--end", type=float); p.add_argument("--force", action="store_true"); p.set_defaults(fn=cmd_new)
    p = sub.add_parser("demo"); p.add_argument("ep"); p.add_argument("--len", type=float, default=11.8); p.add_argument("--force", action="store_true"); p.set_defaults(fn=cmd_demo)
    p = sub.add_parser("music"); p.add_argument("ep"); p.add_argument("--seed", type=int, default=3); p.add_argument("--key", type=int, default=38); p.set_defaults(fn=cmd_music)
    p = sub.add_parser("sheet"); p.add_argument("ep"); p.add_argument("-n", type=int, default=24); p.set_defaults(fn=cmd_sheet)
    p = sub.add_parser("render"); p.add_argument("ep"); p.add_argument("--jobs", type=int, default=4); p.add_argument("--force", action="store_true"); p.set_defaults(fn=cmd_render)
    p = sub.add_parser("check"); p.add_argument("ep"); p.set_defaults(fn=cmd_check)
    a = ap.parse_args(); a.fn(a)


if __name__ == "__main__":
    main()
