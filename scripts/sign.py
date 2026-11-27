#!/usr/bin/env python3
"""署名三件套：角标（底部小牌子，像「小 Lin 说」）、个人介绍（上方：称呼 + 一行身份）、简介（底部一两行，只在结尾出）。
内容用户来填，存在 brands/<品牌>/fingerprint.json 的 sign 里；什么时候出现按 docs/署名规则.md，由 studio/src/kit/sign.tsx 自动排。

  python3 scripts/sign.py show [--brand ningshao]                              现在填的是什么、还缺什么
  python3 scripts/sign.py set --badge 宁少说 --name 宁少 --title "一行身份" --bio "一两行简介" [--brand ningshao]
  python3 scripts/sign.py plan --total 60 [--full 0-8,14-30] [--hook 3]         这条片子里三样东西各在第几秒出现
  python3 scripts/sign.py demo --video <studio/public 下的视频> [--wide] [--total 20]   出三张图给用户看：个人介绍、角标、结尾简介

字数：角标 2 到 6 个字；称呼 2 到 6 个字；身份一行不超过 14 个字；简介最多两行、每行不超过 18 个字。"""
import argparse, glob, json, os, subprocess, sys

R = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); STUDIO = os.path.join(R, "studio"); LIM = {"badge": 6, "name": 6, "title": 14}
ASK = {"badge": "角标（视频底部的小牌子，像「小 Lin 说」，2 到 6 个字）", "name": "称呼（上方个人介绍的第一行，2 到 6 个字）", "title": "身份（称呼下面那一行，不超过 14 个字，例如「十年财经记者」）", "bio": "简介（结尾才出，一两行，说清你是谁、讲什么）"}


def fp(brand): return os.path.join(R, "brands", brand, "fingerprint.json")


def load(brand):
    f = fp(brand); return json.load(open(f, encoding="utf8")) if os.path.exists(f) else {"name": "", "colors": {}}


def check(s):
    bad = [f"{ASK[k].split('（')[0]}太长（{len(s[k])} 个字，最多 {n}）" for k, n in LIM.items() if len(s.get(k, "")) > n]
    lines = s.get("bio", "").split("\n")
    if len(lines) > 2 or any(len(x) > 18 for x in lines): bad.append("简介最多两行、每行不超过 18 个字")
    return bad


def plan(total, full, hook):
    """和 studio/src/kit/sign.tsx 里的 signPlan 是同一套算法。"""
    F = full or [[0, total]]; bio_len = min(5, max(3, total * 0.08)); bio_at = max(0, total - bio_len); intro = None
    for a, b in F:
        s = max(a, hook, 1.5)
        if b - s >= 4 and s + 4 <= bio_at: intro = s + 0.3; break
    if intro is None and total > hook + 4 + bio_len: intro = hook
    return {"个人介绍": [round(intro, 1), round(intro + 4, 1)] if intro is not None else None, "角标": [[round(max(a, hook), 1), round(min(b, total), 1)] for a, b in F if min(b, total) - max(a, hook) > 0.6], "简介": [round(bio_at, 1), round(total, 1)]}


def browser():
    g = sorted(glob.glob("/opt/pw-browsers/chromium-*/chrome-linux*/chrome")); return ["--browser-executable", g[-1]] if g else []


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter); sub = ap.add_subparsers(dest="cmd", required=True)
    p = sub.add_parser("show"); p.add_argument("--brand", default="ningshao")
    p = sub.add_parser("set"); p.add_argument("--brand", default="ningshao"); [p.add_argument("--" + k) for k in ASK]
    p = sub.add_parser("plan"); p.add_argument("--total", type=float, required=True); p.add_argument("--full", default=""); p.add_argument("--hook", type=float, default=2.5)
    p = sub.add_parser("demo"); p.add_argument("--brand", default="ningshao"); p.add_argument("--video", required=True); p.add_argument("--wide", action="store_true"); p.add_argument("--total", type=float, default=20)
    a = ap.parse_args()
    if a.cmd == "plan":
        full = [[float(x) for x in seg.split("-")] for seg in a.full.split(",") if seg]; r = plan(a.total, full, a.hook)
        print(f"个人介绍：{r['个人介绍'][0]} 到 {r['个人介绍'][1]} 秒（只出这一次）" if r["个人介绍"] else "个人介绍：片子太短，不出"); print("角标：人全屏的这几段在 → " + "，".join(f"{x}–{y}" for x, y in r["角标"])); print(f"简介：{r['简介'][0]} 秒到结尾"); return
    d = load(a.brand); s = d.get("sign", {})
    if a.cmd == "set":
        for k in ASK:
            if getattr(a, k) is not None: s[k] = getattr(a, k).replace("\\n", "\n").strip()
        bad = check(s)
        if bad: sys.exit("要改：\n  - " + "\n  - ".join(bad))
        d["sign"] = s; d["name"] = d.get("name") or s.get("badge") or s.get("name") or ""; os.makedirs(os.path.dirname(fp(a.brand)), exist_ok=True); json.dump(d, open(fp(a.brand), "w", encoding="utf8"), ensure_ascii=False, indent=1); print("已存：", fp(a.brand))
    if a.cmd in ("show", "set"):
        for k, q in ASK.items(): print(("✓ " if s.get(k) else "✗ ") + q.split("（")[0] + "：" + (s.get(k, "").replace("\n", " / ") or "还没填 → 问用户：" + q))
        return
    if not s.get("name") and not s.get("badge"): sys.exit("署名还没填。先 python3 scripts/sign.py set …")
    w, h = (1920, 1080) if a.wide else (1080, 1920); r = plan(a.total, [], 2.5); out = os.path.join(R, "brands", a.brand, "署名预览"); os.makedirs(out, exist_ok=True)
    props = {"video": a.video, "w": w, "h": h, "total": a.total, "sign": s, "hot": d.get("colors", {}).get("主色", "#FFD84A")}; pf = os.path.join(out, "props.json"); json.dump(props, open(pf, "w", encoding="utf8"), ensure_ascii=False); shots = []
    for name, t in (("1-个人介绍", r["个人介绍"][0] + 1.5), ("2-角标", r["个人介绍"][1] + 2), ("3-结尾简介", a.total - 0.6)):
        o = os.path.join(out, name + ".jpg"); subprocess.run(["npx", "remotion", "still", "src/index.tsx", "SIGN-DEMO", o, "--props", pf, "--frame", str(int(t * 30)), "--log", "error", *browser()], cwd=STUDIO, check=True); shots.append(o)
    sheet = os.path.join(out, "署名预览.jpg"); subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", *sum((["-i", x] for x in shots), []), "-filter_complex", "".join(f"[{i}]scale=-2:640[v{i}];" for i in range(3)) + "[v0][v1][v2]hstack=3", sheet], check=True)
    print("署名预览（左：个人介绍；中：只有角标；右：结尾简介）：", sheet)


if __name__ == "__main__":
    main()
