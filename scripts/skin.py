#!/usr/bin/env python3
"""风格配方引擎的入口：给一条粗剪好的口播，选一种风格（或混搭、或让它自动搭），直接出片。

  python3 scripts/skin.py styles                                  有哪些风格可以用（现成的 + 蒸馏的 + 外来的，共 37 种）
  python3 scripts/skin.py auto --type 财经 [--seed 期名]           不知道选什么：按内容类型给三个方案
  python3 scripts/skin.py render <期名> --style d-meme             用一种风格出片
  python3 scripts/skin.py render <期名> --mix h-split,d-paper,d-ink   混搭：结构,皮肤,点睛
  python3 scripts/skin.py render <期名> --auto 财经                自动搭（取第一个方案；--pick 2 取第二个）
      可加：--hook "短视频剪辑|AI 时代"（开头两行标题）  --hot 词1,词2（说到就强调的词）  --brand ningshao（套个人指纹，默认套；--no-fp 不套）
            --portrait（出竖屏）  --frames 0-150（只渲一段）  --still 2.5（只出一张关键帧）
  数据从哪来：studio/src/episodes/<代号>/timing.json（字幕时间）和 studio/public/<代号>/person.mp4、voice.wav（粗剪后的人物和人声）。
  也可以直接给：--video x.mp4 --voice x.wav --data lines.json（lines.json 里是 {"total":秒,"lines":[{text,start,end}],"cuts":[秒…]}）。

风格参数在 styles/atlas-styles.json；混搭规则和网页图鉴（site/atlas-preview.js）是同一套。"""
import argparse, glob, json, os, subprocess, sys

R = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); STUDIO = os.path.join(R, "studio"); PUB = os.path.join(STUDIO, "public")


def lum(c):
    c = c.strip().lstrip("#")
    if len(c) != 6: return 0.5
    try: n = int(c, 16)
    except ValueError: return 0.5
    return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255


def catalog():
    """全部风格：[{id, name, kind, fits, t, look, how}]。15 种外来风格的名字从 site/atlas-data.js 里取。"""
    st = json.load(open(os.path.join(R, "styles", "atlas-styles.json"), encoding="utf8")); out = []
    for h in st["house"]: out.append({**h, "kind": "house"})
    for d in st["distill"]: out.append({**d, "kind": "distill"})
    names = {}
    f = os.path.join(R, "site", "atlas-data.js")
    if os.path.exists(f):
        for m in json.loads(open(f, encoding="utf8").read().split("=", 1)[1].rstrip(";\n")).get("mg", []): names[m["id"][3:]] = m
    for k, t in st["mg"]["tokens"].items(): m = names.get(k, {}); out.append({"id": "mg-" + k, "name": m.get("name", k), "kind": "mg", "fits": st["mg"]["fits"].get(k, []), "t": t, "look": m.get("look", "")})
    return out


def find(cat, q):
    hit = [s for s in cat if q == s["id"]] or [s for s in cat if q.lower() in (s["id"] + s["name"]).lower()]
    if not hit: sys.exit(f"没有「{q}」这种风格。python3 scripts/skin.py styles 看有哪些")
    return hit[0]


def mix(A, B=None, C=None, fp=None):
    """结构（版式、动效、字幕样式）取 A；皮肤（配色、纹理、字体、圆角）取 B；点睛（强调色、强调形状、描边）取 C。和 site/atlas-preview.js 的 mix 一致。"""
    B = B or A; X = C or B
    T = {"layout": A["layout"], "motion": A["motion"], "cap": A["cap"], "bg": B["bg"], "panel": B["panel"], "fg": B["fg"], "tex": B["tex"], "font": B["font"], "radius": B["radius"], "hot": X["hot"], "hot2": X["hot2"], "shape": (C or A)["shape"], "stroke": X["stroke"]}
    if fp:
        T["hot"] = fp.get("主色") or T["hot"]
        if lum(T["bg"]) < 0.35 and fp.get("底色"): T["bg"] = fp["底色"]
    if abs(lum(T["bg"]) - lum(T["fg"])) < 0.45: T["fg"] = "#FFFFFF" if lum(T["bg"]) < 0.5 else "#141414"
    if abs(lum(T["bg"]) - lum(T["hot"])) < 0.18: T["hot"] = "#FFD84A" if lum(T["bg"]) < 0.5 else "#C1272D"
    if T["cap"] == "plain" and T["layout"] == "full" and T["tex"] == "none": T["cap"] = "stroke"
    return T


def auto(cat, typ, seed=""):
    """按内容类型给三个方案：结构从现成能出片的风格里挑，皮肤从蒸馏和外来风格里挑。seed 相同结果相同。"""
    s = 0
    for ch in (seed or typ): s = (s * 31 + ord(ch)) % 9973

    def rnd():
        nonlocal s; s = (s * 9301 + 49297) % 233280; return s / 233280
    rank = lambda arr: [x for x, _ in sorted(((x, (2 if typ in x.get("fits", []) else 0) + rnd()) for x in arr), key=lambda p: -p[1])]
    As = rank([x for x in cat if x["kind"] == "house"]); Bs = rank([x for x in cat if x["kind"] != "house"]); out = []
    for i in range(3):
        A, B, C = As[i % len(As)], Bs[i], (Bs[-1 - i] if i == 2 else None)
        out.append({"A": A, "B": B, "C": C, "why": f"结构用「{A['name']}」（现成能出片）；皮肤用「{B['name']}」" + (f"；点睛用「{C['name']}」的强调色" if C else "")})
    return out


def browser():
    for pat in ("/opt/pw-browsers/chromium-*/chrome-linux*/chrome", os.path.expanduser("~/.cache/ms-playwright/chromium-*/chrome-linux*/chrome")):
        g = sorted(glob.glob(pat))
        if g: return ["--browser-executable", g[-1]]
    return []


def cmd_render(a):
    cat = catalog(); fp = None
    if not a.no_fp:
        f = os.path.join(R, "brands", a.brand, "fingerprint.json")
        if os.path.exists(f): fp = json.load(open(f, encoding="utf8"))
    if a.mix: parts = [find(cat, x) for x in a.mix.split(",")][:3]; why = "混搭：" + " + ".join(p["name"] for p in parts)
    elif a.auto: o = auto(cat, a.auto, a.ep)[a.pick - 1]; parts = [o["A"], o["B"]] + ([o["C"]] if o["C"] else []); why = "自动搭：" + o["why"]
    else: parts = [find(cat, a.style or "h-split")]; why = "风格：" + parts[0]["name"]
    T = mix(parts[0]["t"], parts[1]["t"] if len(parts) > 1 else None, parts[2]["t"] if len(parts) > 2 else None, (fp or {}).get("colors") if len(parts) > 1 or a.fp_single else None)
    slug = a.ep
    pj = os.path.join(R, "episodes", a.ep, "进度.json")
    if os.path.exists(pj): slug = json.load(open(pj, encoding="utf8"))["slug"]
    if a.data: d = json.load(open(a.data, encoding="utf8")); video, voice = a.video, a.voice
    else:
        tj = os.path.join(STUDIO, "src", "episodes", slug, "timing.json")
        if not os.path.exists(tj): sys.exit(f"没找到 {tj}：这一期还没粗剪（先走口播流程到「粗剪」那一步），或者用 --video --voice --data 直接给")
        d = json.load(open(tj, encoding="utf8")); video, voice = f"{slug}/person.mp4", f"{slug}/voice.wav"
        cj = os.path.join(STUDIO, "src", "episodes", slug, "cuts.json")
        if os.path.exists(cj) and "cuts" not in d: c = json.load(open(cj)); d["cuts"] = sorted((c.get("segments", []) if isinstance(c, dict) else c) + (c.get("micro", []) if isinstance(c, dict) else []))
    vp = os.path.join(PUB, video)
    if not os.path.exists(vp): sys.exit("没找到人物视频：" + vp)
    pr = json.loads(subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "json", vp], capture_output=True, text=True).stdout)["streams"][0]
    face = d.get("face")
    if not face:                                                      # 取中间一帧测脸
        try:
            import cv2
            cap = cv2.VideoCapture(vp); cap.set(cv2.CAP_PROP_POS_FRAMES, int(cap.get(cv2.CAP_PROP_FRAME_COUNT) / 2)); ok, im = cap.read()
            det = cv2.FaceDetectorYN.create(os.path.expanduser("~/.cache/video-studio/yunet.onnx"), "", (im.shape[1], im.shape[0]), .6, .3, 50); fs = det.detect(im)[1]
            if fs is not None: b = max(fs, key=lambda x: x[2]); face = [float(b[0] + b[2] / 2), float(b[1] + b[3] / 2), float(b[2])]
        except Exception as e: print("  测脸没成功，按画面中间放：", str(e)[:80])
    lines = [{"text": l["text"], "start": l["start"], "end": l["end"]} for l in d["lines"]]
    hook = a.hook.split("|") if a.hook else [lines[0]["text"][:8], lines[1]["text"][:8] if len(lines) > 1 else ""]
    w, h = (1080, 1920) if a.portrait else (1920, 1080)
    props = {"video": video, "voice": voice if voice and os.path.exists(os.path.join(PUB, voice)) else None, "w": w, "h": h, "total": d["total"], "lines": lines, "cuts": d.get("cuts", []), "face": face, "srcW": pr["width"], "srcH": pr["height"], "t": T,
             "hook": hook, "hot": [x for x in a.hot.split(",") if x], "name": (fp or {}).get("name", "").split(" ")[0] if fp else None, "slogan": (fp or {}).get("slogan"), "brand": (fp or {}).get("name"), "styleName": parts[0]["name"] if len(parts) == 1 else None}
    outdir = os.path.join(R, "episodes", a.ep, "out"); os.makedirs(outdir, exist_ok=True); tag = a.tag or "-".join(p["id"] for p in parts)
    pf = os.path.join(outdir, f"skin-{tag}.json"); json.dump(props, open(pf, "w", encoding="utf8"), ensure_ascii=False)
    json.dump({"说明": why, "parts": [p["id"] for p in parts], "t": T}, open(os.path.join(outdir, f"风格方案-{tag}.json"), "w", encoding="utf8"), ensure_ascii=False, indent=1)
    print(why); print("参数：", json.dumps(T, ensure_ascii=False))
    if a.still is not None:
        out = os.path.join(outdir, f"{a.ep}-{tag}-{a.still:g}s.jpg")
        subprocess.run(["npx", "remotion", "still", "src/index.tsx", "SKIN", out, "--frame", str(int(a.still * 30)), "--props", pf, "--scale", "0.5", "--log", "error", *browser()], cwd=STUDIO, check=True)
    else:
        out = os.path.join(outdir, f"{a.ep}-{tag}.mp4")
        subprocess.run(["npx", "remotion", "render", "src/index.tsx", "SKIN", out, "--props", pf, "--crf", "18", "--concurrency", str(min(4, os.cpu_count() or 1)), "--log", "error", *(["--frames", a.frames] if a.frames else []), *browser()], cwd=STUDIO, check=True)
    print("出好了：", out)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter); sub = ap.add_subparsers(dest="cmd", required=True)
    sub.add_parser("styles"); p = sub.add_parser("auto"); p.add_argument("--type", required=True); p.add_argument("--seed", default="")
    p = sub.add_parser("render"); p.add_argument("ep"); p.add_argument("--style"); p.add_argument("--mix"); p.add_argument("--auto"); p.add_argument("--pick", type=int, default=1)
    p.add_argument("--hook", default=""); p.add_argument("--hot", default=""); p.add_argument("--brand", default="ningshao"); p.add_argument("--no-fp", action="store_true"); p.add_argument("--fp-single", action="store_true", help="只用一种风格时也套指纹的主色")
    p.add_argument("--portrait", action="store_true"); p.add_argument("--frames"); p.add_argument("--still", type=float); p.add_argument("--tag"); p.add_argument("--video"); p.add_argument("--voice"); p.add_argument("--data")
    a = ap.parse_args(); cat = catalog()
    if a.cmd == "styles":
        for k, title in (("house", "工作流里现成的"), ("distill", "蒸馏的大 V 风格"), ("mg", "动态设计风格")):
            print(f"\n【{title}】")
            for s in cat:
                if s["kind"] == k: print(f'  {s["id"]:<20} {s["name"]}　适合：{"、".join(s.get("fits", []))}')
    elif a.cmd == "auto":
        for i, o in enumerate(auto(cat, a.type, a.seed)): ids = ",".join(x["id"] for x in (o["A"], o["B"], o["C"]) if x); print(f'方案 {i + 1}：{o["why"]}\n   出片：python3 scripts/skin.py render <期名> --mix {ids}')
    else: cmd_render(a)


if __name__ == "__main__":
    main()
