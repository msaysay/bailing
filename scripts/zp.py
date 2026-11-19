#!/usr/bin/env python3
"""张展鹏科普口播线：原片 + 文案 → 成片。风格固定在模板里，每期只变数据（分镜.json），不写场景代码。
  scripts/zp.py setup                                   装字体、下模型、查环境（第一次用先跑）
  scripts/zp.py new   <期名> --video 原片 [--script 文案.txt] [--slug zp01]
                                                        建一期：转写原片；有文案就接着对齐
  scripts/zp.py align <期名> [--script 文案.txt]         文案对到声音上，决定留哪几段（同一句说了几遍留最后一遍）
  scripts/zp.py cut   <期名>                             出剪好的 person.mp4、timing.json、cuts.json，量人脸
  scripts/zp.py board <期名>                             检查 分镜.json，写 素材清单.md，生成渲染数据
  scripts/zp.py stills <期名>                            每个场景、每个花字各出一张关键帧，拼成一张联系表
  scripts/zp.py render <期名> [--preview] [--from 秒 --to 秒]
                                                        渲染成片；--preview 是半尺寸小样
  scripts/zp.py check <期名>                             成片机器自查（黑场、闪帧、响度）
目录：episodes/<期名>/01_输入素材/（原片、素材/）  03_制作过程/（文案、分镜、时间）  out/（成片）
操作说明：.claude/skills/zhanpeng-talk/SKILL.md"""
import argparse, json, os, shutil, subprocess, sys, urllib.request
os.environ.setdefault("OPENCV_LOG_LEVEL", "ERROR")
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); sys.path.insert(0, os.path.join(R, "scripts"))
STUDIO = os.path.join(R, "studio"); FONTS = os.path.join(STUDIO, "public", "fonts"); THEME = os.path.join(STUDIO, "src", "zhanpeng", "theme.json")
W, H, FPS = 1080, 1920, 30
# 宋体做字幕，黑宋做红色钩子，楷体做黄色关键词。都是 OFL，可商用。自己有更像的字体就按同名文件放进 studio/public/fonts/。
FONT_URLS = {
    "zp-song.ttf": ["https://cdn.jsdelivr.net/fontsource/fonts/noto-serif-sc@5.2.8/chinese-simplified-600-normal.ttf"],
    "zp-song-black.ttf": ["https://cdn.jsdelivr.net/fontsource/fonts/noto-serif-sc@5.2.8/chinese-simplified-900-normal.ttf"],
    "zp-kai.ttf": ["https://github.com/lxgw/LxgwWenKai/releases/download/v1.520/LXGWWenKai-Medium.ttf", "https://raw.githubusercontent.com/google/fonts/main/ofl/lxgwwenkaitc/LXGWWenKaiTC-Bold.ttf"],
}
def die(msg): sys.exit("✗ " + msg)
def run(cmd, **kw): return subprocess.run(cmd, check=True, **kw)
def paths(ep):
    E = os.path.join(R, "episodes", ep); work = os.path.join(E, "03_制作过程")
    p = {"E": E, "in": os.path.join(E, "01_输入素材"), "assets": os.path.join(E, "01_输入素材", "素材"), "work": work, "out": os.path.join(E, "out"),
         "state": os.path.join(work, "zp.json"), "script": os.path.join(work, "script.txt"), "asr": os.path.join(work, "asr-原片.json"),
         "timing": os.path.join(work, "timing.json"), "cuts": os.path.join(work, "cuts.json"), "board": os.path.join(work, "分镜.json"),
         "list": os.path.join(work, "素材清单.md"), "props": os.path.join(work, "props.json")}
    return p
def state(p):
    if not os.path.exists(p["state"]): die("没有这一期，先运行 zp.py new。")
    st = json.load(open(p["state"], encoding="utf-8")); st["raw"] = os.path.join(R, st["raw"])   # 存的是相对仓库根的路径，换台机器也能接着做
    if "cut" in st: st["cut"]["person"] = os.path.join(R, st["cut"]["person"])
    return st
def save(p, st):
    out = json.loads(json.dumps(st)); out["raw"] = os.path.relpath(st["raw"], R)
    if "cut" in out: out["cut"]["person"] = os.path.relpath(st["cut"]["person"], R)
    json.dump(out, open(p["state"], "w", encoding="utf-8"), ensure_ascii=False, indent=1)
def pub(st, *more): return os.path.join(STUDIO, "public", st["slug"], *more)

def cmd_setup(a):
    ok = True
    for tool in ("ffmpeg", "ffprobe", "node", "npx"):
        if not shutil.which(tool): print(f"✗ 没有 {tool}"); ok = False
    for mod, pipname in (("sherpa_onnx", "sherpa-onnx"), ("soundfile", "soundfile"), ("numpy", "numpy"), ("cv2", "opencv-python-headless"), ("pypinyin", "pypinyin"), ("PIL", "pillow")):
        try: __import__(mod)
        except ImportError: print(f"✗ 缺 Python 包：pip install {pipname}"); ok = False
    try: __import__("mediapipe")
    except ImportError: print("· 没装 mediapipe：「论文卡」版式会退成不抠像的版本。要抠像：pip install mediapipe")
    sv = os.path.expanduser("~/.cache/video-studio/sherpa-onnx-sense-voice-zh-en-ja-ko-yue-int8-2024-07-17/model.int8.onnx")
    if not os.path.exists(sv): print("✗ 缺识别模型，下载地址见 scripts/asr.py 开头，解压到 ~/.cache/video-studio/"); ok = False
    from zplib import vision
    try: vision.fetch(vision.YUNET, vision.YUNET_URL); print("✓ 人脸模型")
    except Exception as e: print("✗ 人脸模型下载失败：", e); ok = False
    os.makedirs(FONTS, exist_ok=True)
    for name, urls in FONT_URLS.items():
        dest = os.path.join(FONTS, name)
        if not (os.path.exists(dest) and os.path.getsize(dest) > 100_000):
            for u in urls:
                try:
                    req = urllib.request.Request(u, headers={"User-Agent": "video-studio"})
                    with urllib.request.urlopen(req, timeout=300) as r, open(dest, "wb") as f: shutil.copyfileobj(r, f)
                    if os.path.getsize(dest) > 100_000: break
                except Exception: pass
        good = os.path.exists(dest) and os.path.getsize(dest) > 100_000
        print(("✓ " if good else "✗ 字体没下到：") + name); ok = ok and good
    if not os.path.isdir(os.path.join(STUDIO, "node_modules", "remotion")): print("✗ 还没装渲染依赖：cd studio && npm install"); ok = False
    print("环境就绪。" if ok else "上面打 ✗ 的补齐后再跑一次 setup。"); sys.exit(0 if ok else 1)

def cmd_new(a):
    p = paths(a.ep)
    if os.path.exists(p["state"]): die("这一期已经建过。换文案用 align；换原片请换一个期名。")
    if not os.path.isfile(a.video): die("找不到原片：" + a.video)
    for d in ("in", "assets", "work", "out"): os.makedirs(p[d], exist_ok=True)
    raw = os.path.join(p["in"], "口播原片" + os.path.splitext(a.video)[1].lower())
    if os.path.abspath(a.video) != os.path.abspath(raw): shutil.copyfile(a.video, raw)
    slug = a.slug or "zp" + "".join(c for c in a.ep if c.isascii() and c.isalnum()).lower()[:12]
    if slug == "zp": die("期名里没有英文或数字，请用 --slug 给一个代号，比如 --slug zp01")
    info = json.loads(run(["ffprobe", "-v", "error", "-show_entries", "format=duration:stream=codec_type,width,height", "-of", "json", raw], capture_output=True, text=True).stdout)
    if not {"video", "audio"} <= {s.get("codec_type") for s in info["streams"]}: die("原片需要同时有画面和声音。")
    print("转写中（本机识别，不上传）…")
    run([sys.executable, os.path.join(R, "scripts", "asr.py"), raw, p["asr"]], capture_output=True)
    asr = json.load(open(p["asr"]))
    save(p, {"slug": slug, "raw": raw, "dur": round(float(info["format"]["duration"]), 2)})
    from zplib.script import draft_from_words
    words = [{"word": t["t"], "start": t["s"], "end": t["s"] + 0.2} for t in asr["tokens"]]
    draft = os.path.join(p["work"], "script.draft.txt"); open(draft, "w", encoding="utf-8").write(draft_from_words(words))
    print(f"原片 {asr['dur']:.1f} 秒，识别出 {len(asr['tokens'])} 个字。识别稿在 {draft}")
    if a.script: a.script_path = a.script; cmd_align(a)
    else: print("没给文案：把 script.draft.txt 改成定稿（删掉不要的句子、改错字、一行一句字幕），存成 script.txt，再运行 align。")

def cmd_align(a):
    p = paths(a.ep); st = state(p); src = getattr(a, "script_path", None) or a.script or p["script"]
    if not os.path.isfile(src): die("找不到文案：" + src)
    if os.path.abspath(src) != os.path.abspath(p["script"]): shutil.copyfile(src, p["script"])
    from zplib.script import split_script
    from zplib.align import plan
    from zplib.audio import make_edges
    units = split_script(open(p["script"], encoding="utf-8").read())
    if not units: die("文案是空的。")
    res = plan(json.load(open(p["asr"])), units, edges=make_edges(st["raw"]), fps=FPS)
    if not res["units"]: die(res["problems"][0])
    st["plan"] = res; st.pop("cut", None); save(p, st)
    print(f"原片 {st['dur']} 秒 → 剪后 {res['dur']} 秒，{len(res['units'])} 行字幕，剪口 {len(res['cuts'])} 个。")
    print("行号  起点    字幕")
    for n, u in enumerate(res["units"], 1): print(f"{n:>3}  {u['start']:>6.2f}  {u['text']}" + ("" if u["match"] >= 0.85 else f"   ← 只对上 {int(u['match'] * 100)}%，请听一下"))
    if res["dropped"]:
        print("\n剪掉的话（原片时间）：")
        for d in res["dropped"]: print(f"  {d['start']:>7.2f}–{d['end']:<7.2f} {d['text']}")
    for x in res["problems"]: print("⚠ " + x)
    if len(res["cuts"]) > res["dur"] / 10: print("⚠ 剪口超过每 10 秒一个，这条原片口误偏多，成片会显得碎。")
    print("\n把上面「剪掉的话」和有 ← 的行报给出镜人确认，再运行 cut。")

def cmd_cut(a):
    p = paths(a.ep); st = state(p)
    if "plan" not in st: die("先运行 align。")
    from zplib import vision
    kept = st["plan"]["kept"]; raw = st["raw"]
    # 原片不是 9:16 时，裁切窗口横向对准人脸
    f0 = vision.face_box(raw, samples=12); cx = f0["x"] + f0["w"] / 2 if f0.get("detected") else 0.5
    keep = "+".join(f"gte(t,{s - 0.002:.4f})*lt(t,{e - 0.002:.4f})" for s, e in kept)
    vf = f"[0:v]fps={FPS},select='{keep}',setpts=N/({FPS}*TB),scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H}:(iw-{W})*{min(1, max(0, (cx - 0.5) * 2 + 0.5)):.3f}:(ih-{H})/2,setsar=1[v]"
    af = f"[0:a]aresample=48000,aselect='{keep}',asetpts=N/SR/TB,loudnorm=I=-16:TP=-1.5:LRA=9,aresample=48000[a]"
    dest = pub(st, "person.mp4"); os.makedirs(os.path.dirname(dest), exist_ok=True)
    print("粗剪中…")
    r = subprocess.run(["ffmpeg", "-nostdin", "-y", "-v", "error", "-i", raw, "-filter_complex", vf + ";" + af, "-map", "[v]", "-map", "[a]", "-c:v", "libx264", "-preset", "veryfast", "-crf", "16", "-g", "15", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", dest], capture_output=True, text=True)
    if r.returncode != 0: die("粗剪失败：" + r.stderr[-600:])
    dur = float(run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", dest], capture_output=True, text=True).stdout)
    if abs(dur - st["plan"]["dur"]) > 0.15: print(f"⚠ 剪后时长 {dur:.2f}s 和预计 {st['plan']['dur']}s 差得多，字幕可能错位。")
    lines = []
    for n, u in enumerate(st["plan"]["units"], 1):
        chars, pos = [], 0
        for c in u["chars"]:
            i = u["text"].find(c["c"], pos); i = pos if i < 0 else i; chars.append({"c": c["c"], "i": i, "t": c["t"]}); pos = i + len(c["c"])
        lines.append({"n": n, "seg": 1, "text": u["text"], "start": u["start"], "end": round(u["stop"] + 0.05, 3), "chars": chars})
    timing = {"fps": FPS, "total": round(dur, 3), "segments": [{"id": 1, "name": "全片", "start": 0.0, "end": round(dur, 3), "lines": [l["n"] for l in lines]}], "lines": lines}
    json.dump(timing, open(p["timing"], "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    json.dump({"dur": round(dur, 3), "cuts": st["plan"]["cuts"], "kept": kept}, open(p["cuts"], "w"), indent=1)
    face = vision.face_box(dest); st["face"] = face; st["cut"] = {"person": dest, "dur": round(dur, 3)}; save(p, st)
    if not os.path.exists(p["board"]):
        json.dump({"title": "", "music": None, "camera": "auto", "scenes": [], "overlays": []}, open(p["board"], "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"✓ {dest}（{dur:.1f} 秒，剪口 {len(st['plan']['cuts'])} 个）\n✓ {p['timing']}\n✓ {p['cuts']}")
    if face.get("detected"):
        print(f"人脸：中心 ({face['x'] + face['w'] / 2:.2f}, {face['y'] + face['h'] / 2:.2f})，脸宽占画面 {face['w']:.0%}")
        if not 0.16 <= face["w"] <= 0.32: print("⚠ 对标片脸宽约占画面 22%。差得多时头像和花字的位置会不如对标片舒服，告诉出镜人下次机位远近。")
    else: print("⚠ 没测到人脸，头像位置按常见机位估的，出关键帧时留意。")
    print("下一步：写 分镜.json（规则见 skill 的 references/），再运行 board。")

def placeholder(dest, title, note):
    """缺素材时的占位图：小样照常能出，位置上写着这里要什么画面。"""
    from PIL import Image, ImageDraw, ImageFont
    im = Image.new("RGB", (W, H), (58, 44, 34)); d = ImageDraw.Draw(im)
    for y in range(0, H, 6): d.line([(0, y), (W, y)], fill=(58 + y * 30 // H, 44 + y * 22 // H, 34 + y * 14 // H), width=6)
    fp = os.path.join(FONTS, "zp-song.ttf")
    big = ImageFont.truetype(fp, 64) if os.path.exists(fp) else ImageFont.load_default(); small = ImageFont.truetype(fp, 40) if os.path.exists(fp) else big
    d.text((W / 2, 760), "素材占位", font=big, fill=(240, 220, 180), anchor="mm"); d.text((W / 2, 850), title, font=small, fill=(240, 220, 180), anchor="mm")
    y = 960
    for k in range(0, min(len(note), 110), 22): d.text((W / 2, y), note[k:k + 22], font=small, fill=(210, 195, 165), anchor="mm"); y += 58
    im.save(dest)

def cmd_board(a, quiet=False):
    p = paths(a.ep); st = state(p)
    if "cut" not in st: die("先运行 cut。")
    if not os.path.exists(p["board"]): die("还没有分镜表：" + p["board"])
    try: board = json.load(open(p["board"], encoding="utf-8"))
    except json.JSONDecodeError as e: die(f"分镜.json 不是合法的 JSON：第 {e.lineno} 行 {e.msg}")
    from zplib.board import build
    timing = json.load(open(p["timing"], encoding="utf-8")); theme = json.load(open(THEME, encoding="utf-8"))
    props, wanted, errors, warns = build(board, timing, st["face"], json.load(open(p["cuts"]))["cuts"], p["assets"], theme)
    if errors:
        print("分镜表有错，改完再来：")
        for e in errors: print("  ✗ " + e)
        sys.exit(1)
    adir = pub(st, "assets"); shutil.rmtree(adir, ignore_errors=True); os.makedirs(adir)
    missing = 0
    for sc in props["scenes"]:
        for sh in sc["shots"]:
            w = next(x for x in wanted if x["file"] == sh["file"] or x["found"] == sh["file"])
            if sh.pop("missing"):
                missing += 1; name = os.path.splitext(sh["file"])[0] + ".placeholder.png"; placeholder(os.path.join(adir, name), sh["file"], w["prompt"] or w["said"]); sh["file"], sh["kind"] = name, "image"
                if sh["motion"] == "still" and sc["type"] != "paper": sh["motion"] = "zoom-in"
            else:
                shutil.copyfile(os.path.join(p["assets"], sh["file"]), os.path.join(adir, sh["file"]))
                if sh["kind"] == "video": sh["duration"] = float(run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", os.path.join(adir, sh["file"])], capture_output=True, text=True).stdout)
            sh["file"] = f"{st['slug']}/assets/{sh['file']}"
    music = None
    if board.get("music"):
        m = os.path.join(p["assets"], board["music"])
        if os.path.isfile(m): shutil.copyfile(m, os.path.join(adir, board["music"])); music = f"{st['slug']}/assets/{board['music']}"
        else: warns.append(f"配乐「{board['music']}」不在素材目录里，这次不加配乐。")
    props.update({"fps": FPS, "width": W, "height": H, "durationInFrames": int(round(timing["total"] * FPS)), "videoFile": f"{st['slug']}/person.mp4", "musicFile": music, "musicVolume": float(board.get("musicVolume", 0.07))})
    json.dump(props, open(p["props"], "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    rows = ["# 素材清单", "", f"把文件放进 `{os.path.relpath(p['assets'], R)}/`，文件名照第一列（扩展名可以不同，图片或视频都行）。竖屏 9:16，1080×1920 以上。", "",
            "| 文件名 | 状态 | 用途 | 时长 | 这时在说 | 画面要求 / 提示词 |", "|---|---|---|---|---|---|"]
    use = {"illustration": "插画", "broll": "实拍空镜", "paper": "文献/截图", "card": ""}
    for w in wanted: rows.append(f"| {w['file']} | {'✓ 已有' if w['found'] else '✗ 缺'} | {use[w['scene']]} | {w['seconds']}s | {w['said']} | {w['prompt']} |")
    open(p["list"], "w", encoding="utf-8").write("\n".join(rows) + "\n")
    st["board"] = {"missing": missing, "scenes": len(props["scenes"]), "overlays": len(props["overlays"])}; save(p, st)
    if not quiet:
        print(f"✓ 分镜表通过：{len(props['scenes'])} 个场景，{len(props['overlays'])} 处花字，{len(props['captions'])} 行字幕，景别切换 {len(props['camera']) - 1} 次。")
        print(f"素材 {len(wanted)} 个，缺 {missing} 个 → {p['list']}" + ("（缺的先用占位图出小样）" if missing else ""))
        for x in warns: print("⚠ " + x)
    return props

def cutouts(p, st, props):
    """论文卡场景需要人物抠像。装了 mediapipe 才做；没装就退成不抠像。"""
    changed = False
    for sc in props["scenes"]:
        if sc["type"] != "paper": continue
        name = f"cutout-{sc['id']}-{int(sc['start'] * 100)}-{int(sc['end'] * 100)}.webm"; dest = pub(st, name)
        if not os.path.exists(dest):
            try:
                from zplib import vision
                print(f"抠像 {sc['id']}（{sc['end'] - sc['start']:.1f} 秒）…"); vision.person_cutout(st["cut"]["person"], sc["start"], sc["end"] + 0.1, dest, FPS)
            except Exception as e: print(f"⚠ {sc['id']} 没能抠像（{e}），这一段不做虚线人像。"); continue
        sc["personFile"] = f"{st['slug']}/{name}"; changed = True
    if changed: json.dump(props, open(p["props"], "w", encoding="utf-8"), ensure_ascii=False, indent=1)

def remotion(args):
    extra = ["--browser-executable=" + os.environ["ZP_BROWSER"]] if os.environ.get("ZP_BROWSER") else []
    r = subprocess.run(["npx", "--no-install", "remotion"] + args + extra + ["--log=error"], cwd=STUDIO, capture_output=True, text=True)
    if r.returncode != 0: die("渲染失败：\n" + (r.stderr or r.stdout)[-1500:] + "\n没有显示器的 Linux 上要设环境变量 ZP_BROWSER 指向 chrome-headless-shell。")

def cmd_stills(a):
    p = paths(a.ep); st = state(p); props = cmd_board(a, quiet=True); cutouts(p, st, props)
    marks = [(0.6, "开场")]
    for sc in props["scenes"]:
        marks.append((sc["start"] + 0.35, sc["id"] + " 转场")); marks.append((sc["start"] + min(1.6, (sc["end"] - sc["start"]) * 0.6), sc["id"]))
        for sh in sc["shots"][1:]: marks.append((sh["start"] + 0.8, sc["id"] + " 换图"))
    for o in props["overlays"]: marks.append((min(o["end"] - 0.1, o["start"] + max(0.7, (o["end"] - o["start"]) * 0.75)), o["type"]))
    marks = sorted(set((round(t, 2), n) for t, n in marks if 0 <= t < props["durationInFrames"] / FPS))
    d = os.path.join(p["out"], "关键帧"); shutil.rmtree(d, ignore_errors=True); os.makedirs(d)
    for k, (t, name) in enumerate(marks):
        remotion(["still", "src/index.tsx", "ZP", os.path.join(d, f"{k + 1:02d}_{t:06.2f}s_{name}.png"), f"--props={p['props']}", f"--frame={int(t * FPS)}", "--scale=0.4"])
        print(f"  {k + 1:02d}/{len(marks)}  {t:6.2f}s  {name}")
    files = sorted(os.listdir(d)); sheets = []
    for i in range(0, len(files), 12):
        chunk = files[i:i + 12]; ins = []
        for f in chunk: ins += ["-i", os.path.join(d, f)]
        cols = min(6, len(chunk)); sheet = os.path.join(p["out"], f"关键帧联系表-{i // 12 + 1}.jpg")
        run(["ffmpeg", "-nostdin", "-y", "-v", "error"] + ins + ["-filter_complex", "".join(f"[{k}:v]" for k in range(len(chunk))) + f"concat=n={len(chunk)}:v=1,tile={cols}x{-(-len(chunk) // cols)}:padding=6", "-frames:v", "1", "-q:v", "3", sheet]); sheets.append(sheet)
    print("✓ 关键帧：" + d + "\n✓ 联系表：" + "、".join(sheets) + "\n逐张看：头像有没有挡住插画主体、花字有没有压脸或出框、字幕和花字有没有打架。")

def cmd_render(a):
    p = paths(a.ep); st = state(p); props = cmd_board(a, quiet=True); cutouts(p, st, props)
    out = os.path.join(p["out"], "小样.mp4" if a.preview else "成片.mp4"); args = ["render", "src/index.tsx", "ZP", out, f"--props={p['props']}", "--crf=" + ("26" if a.preview else "18")]
    if a.preview: args.append("--scale=0.5")
    if a.frm is not None or a.to is not None:
        lo = int((a.frm or 0) * FPS); hi = min(props["durationInFrames"] - 1, int((a.to if a.to is not None else props["durationInFrames"] / FPS) * FPS)); args.append(f"--frames={lo}-{hi}")
        out = out.replace(".mp4", f"-{a.frm or 0:g}-{a.to or 0:g}.mp4"); args[3] = out
    print(f"渲染中（{props['durationInFrames'] / FPS:.0f} 秒的片子，4 核机器约需 {props['durationInFrames'] / FPS / 8:.0f}–{props['durationInFrames'] / FPS / 4:.0f} 分钟）…"); remotion(args)
    st["render"] = {"out": out, "missing": st["board"]["missing"]}; save(p, st); print("✓ " + out)
    if st["board"]["missing"]: print(f"⚠ 还有 {st['board']['missing']} 个素材是占位图，这一版只能当小样看。")

def cmd_check(a):
    p = paths(a.ep); out = os.path.join(p["out"], "成片.mp4")
    if not os.path.exists(out): die("还没有成片。")
    sys.exit(subprocess.run([sys.executable, os.path.join(R, "scripts", "qc.py"), out]).returncode)

ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter); sub = ap.add_subparsers(dest="cmd", required=True)
sub.add_parser("setup")
x = sub.add_parser("new"); x.add_argument("ep"); x.add_argument("--video", required=True); x.add_argument("--script"); x.add_argument("--slug")
x = sub.add_parser("align"); x.add_argument("ep"); x.add_argument("--script")
for name in ("cut", "board", "stills", "check"): sub.add_parser(name).add_argument("ep")
x = sub.add_parser("render"); x.add_argument("ep"); x.add_argument("--preview", action="store_true"); x.add_argument("--from", dest="frm", type=float); x.add_argument("--to", type=float)
a = ap.parse_args(); globals()["cmd_" + a.cmd](a)
