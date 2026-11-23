#!/usr/bin/env python3
"""收尾的「发布包」：成片做完后，一次出齐三版封面（每版两个尺寸）+ 标题、简介、话题、署名和提醒。哪条线做的片子都用它。

  python3 scripts/publish_kit.py init <期名>                 生成 episodes/<期名>/发布.json 的空白模板（AI 来填）
  python3 scripts/publish_kit.py build <期名> [--video 成片.mp4] [--at 12.5] [--wide] [--brand ningshao]
      按 发布.json 出封面和文案，放在 episodes/<期名>/out/发布包/：
        封面-A大字压底 / B满图描边 / C色块分屏 × 抖音 1080×1440、视频号 1080×1260（加 --wide 再出横版 1920×1080）
        封面总览.jpg（六张拼一起，发给用户挑）、发布文案.md
      主图：默认从成片里自动挑一帧（脸最大最清楚的）；--at 指定第几秒；也可以在 发布.json 的 cover.img 里给一张图。

发布.json 怎么填（AI 填，填完给用户看）：
  cover.tag    时效标签，4 到 6 个字（「复职当天」「实测 7 天」），没有就留空
  cover.l1/l2  封面标题两行，合起来不超过 10 个字；疑问句或反差句；不照抄视频标题
  cover.chips  最多三个数字小卡 [["+33%","开盘涨幅"]]，只用核对过有出处的数字
  titles       三个标题备选，风格拉开：一个疑问、一个反差、一个直给
  desc         一段简介，讲清这期说了什么，结尾可以带一句互动（不诱导点赞）
  topics       5 个以内的话题词，不带 #
  credit       要写进简介的署名（配乐、素材），没有就空
  warn         要提醒用户的事（哪些画面没授权、哪些说法没查到出处）"""
import argparse, glob, json, os, subprocess, sys

R = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); STUDIO = os.path.join(R, "studio"); PUB = os.path.join(STUDIO, "public")
SIZES = {"抖音-1080x1440": (1080, 1440), "视频号-1080x1260": (1080, 1260)}; LAYOUTS = {"A": "A大字压底", "B": "B满图描边", "C": "C色块分屏"}
TEMPLATE = {"cover": {"tag": "", "l1": "", "l2": "", "chips": [], "img": ""}, "titles": ["", "", ""], "desc": "", "topics": [], "credit": [], "warn": []}


def browser():
    for pat in ("/opt/pw-browsers/chromium-*/chrome-linux*/chrome", os.path.expanduser("~/.cache/ms-playwright/chromium-*/chrome-linux*/chrome")):
        g = sorted(glob.glob(pat))
        if g: return ["--browser-executable", g[-1]]
    return []


def best_frame(video, out, at=None, crop_subs=False):
    """从成片里挑一帧当封面主图：脸大、清楚、不在开头结尾。返回脸在图里的位置（比例）。"""
    import cv2
    cap = cv2.VideoCapture(video); n = int(cap.get(cv2.CAP_PROP_FRAME_COUNT)); fps = cap.get(cv2.CAP_PROP_FPS) or 30; det = None; best = None
    idx = [int(at * fps)] if at is not None else [int(n * (0.06 + 0.88 * i / 39)) for i in range(40)]
    for i in idx:
        cap.set(cv2.CAP_PROP_POS_FRAMES, i); ok, im = cap.read()
        if not ok: continue
        if crop_subs: im = im[: int(im.shape[0] * 0.8)]                  # 成片底下是字幕区，裁掉
        h, w = im.shape[:2]; score = cv2.Laplacian(cv2.cvtColor(im, cv2.COLOR_BGR2GRAY), cv2.CV_64F).var() ** 0.5; face = None
        try:
            det = det or cv2.FaceDetectorYN.create(os.path.expanduser("~/.cache/video-studio/yunet.onnx"), "", (w, h), .7, .3, 50); fs = det.detect(im)[1]
            if fs is not None: b = max(fs, key=lambda x: x[2]); face = [float((b[0] + b[2] / 2) / w), float((b[1] + b[3] / 2) / h)]; score *= 1 + 6 * b[2] / w
        except Exception: pass
        if best is None or score > best[0]: best = (score, im, face)
    if best is None: sys.exit("成片里取不到画面：" + video)
    cv2.imwrite(out, best[1], [cv2.IMWRITE_JPEG_QUALITY, 93]); return best[2]


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter); sub = ap.add_subparsers(dest="cmd", required=True)
    p = sub.add_parser("init"); p.add_argument("ep")
    p = sub.add_parser("build"); p.add_argument("ep"); p.add_argument("--video"); p.add_argument("--at", type=float); p.add_argument("--wide", action="store_true"); p.add_argument("--clean", action="store_true", help="--video 给的是没有字幕的干净画面，不用裁"); p.add_argument("--brand", default="ningshao")
    a = ap.parse_args(); ed = os.path.join(R, "episodes", a.ep); pj = os.path.join(ed, "发布.json")
    if a.cmd == "init":
        os.makedirs(ed, exist_ok=True)
        if os.path.exists(pj): sys.exit("已经有了：" + pj)
        json.dump(TEMPLATE, open(pj, "w", encoding="utf8"), ensure_ascii=False, indent=1); print("模板：", pj, "\n填法见 python3 scripts/publish_kit.py -h；填完跑 build"); return
    if not os.path.exists(pj): sys.exit(f"还没有 {pj}。先 python3 scripts/publish_kit.py init {a.ep}，把封面两行字、三个标题、简介、话题填进去")
    d = json.load(open(pj, encoding="utf8")); c = d["cover"]; bad = []
    if not c.get("l1") or not c.get("l2"): bad.append("cover.l1 / l2 还空着")
    if len(c.get("l1", "") + c.get("l2", "")) > 12: bad.append(f"封面标题 {len(c['l1'] + c['l2'])} 个字，太长（两行合起来不超过 10 个字）")
    if len([t for t in d.get("titles", []) if t]) < 3: bad.append("titles 要三个")
    if not d.get("desc"): bad.append("desc 还空着")
    if not d.get("topics"): bad.append("topics 还空着")
    if bad: sys.exit("发布.json 要改：\n  - " + "\n  - ".join(bad))
    out = os.path.join(ed, "out", "发布包"); os.makedirs(out, exist_ok=True); slug = "pub-" + "".join(ch if ch.isascii() and ch.isalnum() else "_" for ch in a.ep); os.makedirs(os.path.join(PUB, slug), exist_ok=True); img = os.path.join(PUB, slug, "cover.jpg"); face = None
    if c.get("img"): subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-i", c["img"], img], check=True)
    else:
        # 主图优先用干净的原片（粗剪后的人物视频，没有字幕和包装）；没有才用成片，并裁掉底下的字幕区
        sl = json.load(open(os.path.join(ed, "进度.json"), encoding="utf8"))["slug"] if os.path.exists(os.path.join(ed, "进度.json")) else a.ep
        clean = next((f for f in (os.path.join(PUB, sl, "person.mp4"), os.path.join(PUB, sl, "main.mp4"), os.path.join(PUB, sl, "base.mp4")) if os.path.exists(f)), None)
        video = a.video or clean or next(iter(sorted(glob.glob(os.path.join(ed, "out", "*.mp4")) + glob.glob(os.path.join(ed, "04_成片", "*.mp4")), key=os.path.getmtime, reverse=True)), None)
        if not video: sys.exit("没找到能取图的视频。用 --video 指给我，或在 发布.json 的 cover.img 里给一张图")
        face = best_frame(video, img, a.at, crop_subs=(video != clean and not a.clean)); print("封面主图取自：", video, "" if video == clean or a.clean else "（成片，已裁掉字幕区；有干净的原片更好，用 --video 指给我并加 --clean）")
    fp = {}
    f = os.path.join(R, "brands", a.brand, "fingerprint.json")
    if os.path.exists(f): fp = json.load(open(f, encoding="utf8"))
    col = fp.get("colors", {}); sizes = dict(SIZES); made = []
    if a.wide: sizes["横版-1920x1080"] = (1920, 1080)
    for lk, lname in LAYOUTS.items():
        for sname, (w, h) in sizes.items():
            props = {"img": f"{slug}/cover.jpg", "layout": lk, "w": w, "h": h, "tag": c.get("tag", ""), "l1": c["l1"], "l2": c["l2"], "chips": c.get("chips", []), "brand": fp.get("name", ""), "bg": col.get("底色", "#0A0A0B"), "hot": col.get("主色", "#D6FF3D"), "fg": col.get("辅色", "#F4F2EC"),
                     "faceX": face[0] if face else 0.5, "faceY": face[1] if face else 0.3}
            pf = os.path.join(PUB, slug, "props.json"); json.dump(props, open(pf, "w", encoding="utf8"), ensure_ascii=False); o = os.path.join(out, f"封面-{lname}-{sname}.png")
            subprocess.run(["npx", "remotion", "still", "src/index.tsx", "COVERKIT", o, "--props", pf, "--log", "error", *browser()], cwd=STUDIO, check=True); made.append(o)
    first = [m for m in made if "抖音" in m] + [m for m in made if "视频号" in m]
    subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", *sum((["-i", m] for m in first), []), "-filter_complex", "".join(f"[{i}]scale=-2:{480 if i < 3 else 420},pad=iw:480:0:0:black[v{i}];" for i in range(len(first))) + "".join(f"[v{i}]" for i in range(len(first))) + f"hstack={len(first)}", os.path.join(out, "封面总览.jpg")], check=True)
    md = [f"# {a.ep} · 发布包", "", "## 封面", "三种排法，每种两个尺寸，都在这个文件夹里。先看「封面总览.jpg」挑一版。", "", "## 标题（三选一）"] + [f"{i + 1}. {t}" for i, t in enumerate(d["titles"])] + ["", "## 简介", d["desc"], "", "## 话题", " ".join("#" + t.lstrip("#") for t in d["topics"])]
    if d.get("credit"): md += ["", "## 署名（写进简介）"] + ["- " + x for x in d["credit"]]
    if d.get("warn"): md += ["", "## 发布前请看"] + ["- " + x for x in d["warn"]]
    open(os.path.join(out, "发布文案.md"), "w", encoding="utf8").write("\n".join(md) + "\n")
    print(f"发布包：{out}\n  封面 {len(made)} 张 + 封面总览.jpg + 发布文案.md")


if __name__ == "__main__":
    main()
