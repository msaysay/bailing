#!/usr/bin/env python3
"""口播剪辑的统一入口：选风格、选可选功能、建一期、打印这一期该怎么做。六种风格和可选功能登记在 styles/talk-styles.json。
  scripts/talk.py styles                       六种风格各是什么样、适合谁、要用户给什么（拿去让用户选）
  scripts/talk.py options [--style 风格]        可选功能清单；给了风格就写明这种风格里每一项怎么开
  scripts/talk.py new <期名> --style 风格 [--video 原片] [--script 文案.txt] [--opts 逗号隔开的可选功能] [--font 字体包] [--slug 英文代号]
                                               建一期（episodes/<期名>/进度.json），原片放到这种风格要的位置，然后打印做法
  scripts/talk.py set <期名> [--opts …] [--font 字体包]
                                               中途改可选功能或字体包
  scripts/talk.py recipe [<期名>]               这一期按顺序该跑哪些命令（已经把选的功能配进去了）。不给期名就看最近一期
风格：xiaolin 财经解读风 · danjie 商业快节奏风 · zhanpeng 知识科普风 · frame 相框老板风 · interview 访谈纪实风 · ziqi 横屏深度解读风
可选功能：retake 去重录 · stutter 去口吃和语气词 · pause 收紧停顿 · denoise 降噪 · grade 调光 · beauty 轻磨皮 · music 配乐 · sfx 音效 · cover 封面
  --opts 不写就用默认的（retake,stutter,pause,cover）；写 --opts all 全开；前面加减号是关掉，比如 --opts denoise,music,-cover
进度照旧用 scripts/episode.py status / done 记。"""
import sys as _sys
for _s in (_sys.stdout, _sys.stderr): getattr(_s, "reconfigure", lambda **k: None)(encoding="utf-8", errors="replace")   # Windows 终端也能打印中文
import argparse, json, os, re, shutil, subprocess, sys, time
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); E = os.path.join(R, "episodes"); PY = sys.executable
REG = json.load(open(os.path.join(R, "styles", "talk-styles.json"), encoding="utf-8")); S = REG["styles"]; O = REG["options"]
SKILL = {"xiaolin": "xiaolin-talk", "danjie": "danjie-cut", "zhanpeng": "zhanpeng-talk", "frame": "frame-talk", "interview": "tiantu-interview-cut", "ziqi": "ziqi-wide"}
def ppath(ep): return os.path.join(E, ep, "进度.json")
def load(ep):
    if not os.path.exists(ppath(ep)): sys.exit(f"没有这一期：{ep}（先 talk.py new）")
    return json.load(open(ppath(ep), encoding="utf-8"))
def save(ep, st): json.dump(st, open(ppath(ep), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
def latest():
    eps = [d for d in os.listdir(E) if os.path.exists(ppath(d)) and json.load(open(ppath(d), encoding="utf-8")).get("style")] if os.path.isdir(E) else []
    return max(eps, key=lambda d: os.path.getmtime(ppath(d))) if eps else None
def parse_opts(text, style, base=None):
    on = set(base if base is not None else [k for k, v in O.items() if v["default"] and k != "font"])
    for x in [t.strip() for t in (text or "").split(",") if t.strip()]:
        if x == "all": on |= {k for k in O if k != "font"}; continue
        off = x.startswith("-"); k = x.lstrip("-+")
        if k not in O or k == "font": sys.exit(f"没有可选功能「{k}」。可选：{'、'.join(k for k in O if k != 'font')}")
        (on.discard if off else on.add)(k)
    none = [k for k in on if S[style]["options"][k] is None]
    for k in none: print(f"· {S[style]['name']}没有「{O[k]['name']}」这一项，已忽略。")
    return [k for k in O if k in on and k not in none]

def cmd_styles(a):
    print("口播剪辑有六种风格（五种竖屏，一种横屏长视频）。把下面的讲给用户听（不用念编号），让他挑一种；拿不准就按「适合谁」替他选一个再问他行不行。\n")
    for k, v in S.items():
        print(f"【{v['name']}】（{k}）{v['ref']}")
        print(f"  适合谁：{v['who']}\n  长什么样：{v['look']}\n  要你给：{v['give']}\n  品牌件：{v['brand']}\n")
    print("定了风格再问可选功能：scripts/talk.py options --style <风格>")
def cmd_options(a):
    if not a.style:
        print("可选功能（★ 是默认就开的）：")
        for k, v in O.items(): print(f" {'★' if v['default'] else ' '} {k:8s}{v['name']} —— {v['what']}")
        print("\n每种风格支持哪些（✓ 自带或能开，— 没有）：\n" + " " * 14 + "".join(f"{O[k]['name'][:5]:　<6s}" for k in O))
        for s, v in S.items(): print(f" {v['name']:　<7s}" + "".join(f"{'✓' if v['options'][k] else '—':　<6s}" for k in O))
        return
    v = S[a.style]; print(f"{v['name']}的可选功能（★ 默认开）。问用户时只问他关心的：声音吵不吵、光线好不好、要不要配乐、字体换不换。\n")
    for k, o in O.items():
        how = v["options"][k]; print(f" {'★' if o['default'] else ' '} {k:8s}{o['name']}：{o['what']}\n            " + ("这种风格没有" if how is None else "怎么开：" + how))
def cmd_new(a):
    if a.style not in S: sys.exit(f"没有风格「{a.style}」。可选：{'、'.join(S)}")
    if os.path.exists(ppath(a.name)): sys.exit("这一期已经有了：" + a.name)
    if a.video and not os.path.isfile(a.video): sys.exit("找不到原片：" + a.video)
    opts = parse_opts(a.opts, a.style); v = S[a.style]; base = os.path.join(E, a.name); m = re.match(r"(\d+)", a.name)
    slug = a.slug or {"xiaolin": "ep", "danjie": "dj", "zhanpeng": "zp", "frame": "fr", "interview": "iv", "ziqi": "ep"}[a.style] + (m.group(1).zfill(2) if m else time.strftime("%m%d%H%M"))
    ext = os.path.splitext(a.video)[1].lower() if a.video else ".mp4"; note = []
    if a.style in ("xiaolin", "ziqi"):      # 这两种每期一份画面代码：episode.py 建目录、代码骨架并注册合成（ziqi 是横屏 1920×1280）
        r = subprocess.run([PY, os.path.join(R, "scripts", "episode.py"), "new", a.name, "--line", "wide" if a.style == "ziqi" else "talk"], capture_output=True, text=True)
        if r.returncode != 0: sys.exit(r.stdout + r.stderr)
        st = load(a.name); slug = st["slug"]
        if a.video: shutil.copyfile(a.video, os.path.join(base, "01_输入素材", "口播原片.mp4") if ext == ".mp4" else os.path.join(base, "01_输入素材", "口播原片" + ext)); note.append("原片已放到 01_输入素材/" + ("" if ext == ".mp4" else f"（是 {ext}，请先转成 口播原片.mp4）"))
        if a.script: os.makedirs(os.path.join(base, "03_制作过程"), exist_ok=True); shutil.copyfile(a.script, os.path.join(base, "03_制作过程", "script.txt"))
    else:
        st = {"name": a.name, "line": "talk", "slug": slug, "created": time.strftime("%Y-%m-%d %H:%M"),
              "steps": [{"no": no, "name": nm, "skill": SKILL[a.style], "ask": ask, "confirm": cf, "done": False} for no, nm, ask, cf in v["steps"]]}
        os.makedirs(base, exist_ok=True)
        if a.style == "danjie":
            d = os.path.join(base, "cut", "raw"); os.makedirs(d, exist_ok=True); st["workdir"] = os.path.relpath(os.path.join(base, "cut"), R)
            if a.video: shutil.copyfile(a.video, os.path.join(d, "host" + ext)); note.append("原片已放到 cut/raw/host" + ext)
            if a.script: shutil.copyfile(a.script, os.path.join(base, "cut", "文案参考.txt"))
        elif a.style == "interview":
            for x in ("raw", "broll", "bgm", "work", "out"): os.makedirs(os.path.join(base, "proj", x), exist_ok=True)
            st["workdir"] = os.path.relpath(os.path.join(base, "proj"), R)
            if a.video: shutil.copyfile(a.video, os.path.join(base, "proj", "raw", "a" + ext)); note.append("原片已放到 proj/raw/a" + ext)
        elif a.style == "frame":
            os.makedirs(os.path.join(base, "01_输入素材"), exist_ok=True)
            if a.video: shutil.copyfile(a.video, os.path.join(base, "01_输入素材", "口播原片" + ext)); note.append("原片已放到 01_输入素材/")
        elif a.style == "zhanpeng":
            os.makedirs(os.path.join(base, "01_输入素材"), exist_ok=True)
            if a.video: st["pending_video"] = os.path.abspath(a.video)      # zp.py new 自己会拷原片、转写，recipe 里第一条命令就是它
            if a.script: st["pending_script"] = os.path.abspath(a.script)
    st["style"] = a.style; st["options"] = opts
    if a.font: st["font"] = a.font
    save(a.name, st); print(f"已建好：episodes/{a.name}（{v['name']}，代号 {slug}）" + ("；" + "；".join(note) if note else ""))
    recipe(a.name, st)
def cmd_set(a):
    st = load(a.name)
    if not st.get("style"): sys.exit("这一期不是用 talk.py 建的口播，没有风格可改。")
    if a.opts: st["options"] = parse_opts(a.opts, st["style"], st.get("options", []))
    if a.font: st["font"] = a.font
    save(a.name, st); recipe(a.name, st)

def recipe(ep, st):
    style = st["style"]; v = S[style]; on = set(st.get("options", [])); slug = st["slug"]; ed = f"episodes/{ep}"; q = lambda p: f'"{p}"'
    has = lambda k: k in on
    print(f"\n━━ {ep} · {v['name']}（{v['ref']}）━━")
    print("开着的可选功能：" + ("、".join(O[k]["name"] for k in O if k in on) or "无") + (f"；字体包：{st['font']}" if st.get("font") else ""))
    print(f"操作说明：技能 {SKILL[style]}（先读它，下面只是把选好的功能配进命令里）。剪辑决定写在：{v['table']}\n")
    L = []; add = L.append
    if st.get("font"): add(("换字体包", f"python3 scripts/fonts.py use {st['font']} --style {style}"))
    pol = lambda target, extra="": "python3 scripts/polish.py " + target + " --inplace" + (" --denoise auto" if has("denoise") else "") + (" --grade" if has("grade") else "") + (" --beauty 0.3" if has("beauty") else "") + extra
    if style == "xiaolin":
        add(("环境", "python3 scripts/doctor.py --line talk --fix"))
        add(("转写，找口误和重录", f"python3 scripts/talk_prep.py {q(ep)} transcribe"))
        flags = (" --auto-drop" if has("retake") or has("stutter") else "") + (" --grade" if has("grade") else "") + (" --beauty 0.3" if has("beauty") else "") + (" --denoise auto" if has("denoise") else "")
        add(("粗剪、对齐（--drop 里补上你通读后找到的口误）", f"python3 scripts/talk_prep.py {q(ep)} cut --drop \"…\" --vf \"…\"{flags}"))
        add(("版式表（逐句定版式，给用户确认）和备素材", f"写 {ed}/03_制作过程/版式表.md；素材放 studio/public/{slug}/footage/"))
        add(("搭画面（照抄 talk02）", f"在 studio/src/episodes/{slug}/index.tsx 里搭；关键帧：cd studio && npx remotion still src/index.tsx {slug} out/{slug}-k.png --frame=<帧>"))
        add(("渲染和自查", f"cd studio && npx remotion render src/index.tsx {slug} out/{slug}.mp4；python3 scripts/qc.py …；python3 scripts/talk_check.py …"))
        if has("music"): add(("配乐（成片上做，不用重渲）", f"python3 scripts/polish.py studio/out/{slug}.mp4 --music auto --mood warm -o studio/out/{slug}-配乐.mp4"))
    elif style == "ziqi":
        add(("环境", "python3 scripts/doctor.py --line talk --fix；python3 scripts/fonts.py install ziqi-default"))
        add(("转写，找口误和重录（横屏原片会打印 FACE 和 --vf）", f"python3 scripts/talk_prep.py {q(ep)} transcribe"))
        flags = (" --auto-drop" if has("retake") or has("stutter") else "") + (" --grade" if has("grade") else "") + (" --beauty 0.3" if has("beauty") else "") + (" --denoise auto" if has("denoise") else "")
        add(("粗剪、对齐", f"python3 scripts/talk_prep.py {q(ep)} cut --drop \"…\" --vf \"scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080\"{flags}"))
        add(("章节和版式表（给用户确认）、备素材", f"写 {ed}/03_制作过程/版式表.md；素材放 studio/public/{slug}/footage/"))
        add(("搭画面（照抄 wide01），先出第一章小样", f"在 studio/src/episodes/{slug}/index.tsx 里搭；cd studio && npx remotion still src/index.tsx {slug} out/{slug}-k.png --frame=<帧>"))
        add(("分章渲染、自查", f"cd studio && npx remotion render src/index.tsx {slug} out/{slug}.mp4；python3 scripts/qc.py studio/out/{slug}.mp4；python3 scripts/wide_check.py studio/out/{slug}.mp4"))
        if has("music"): add(("配乐（成片上做）", f"python3 scripts/polish.py studio/out/{slug}.mp4 --music auto --mood calm -o studio/out/{slug}-配乐.mp4"))
    elif style == "zhanpeng":
        add(("环境", "python3 scripts/zp.py setup"))
        vid = st.get("pending_video") or "<原片路径>"; sc = f" --script {q(st['pending_script'])}" if st.get("pending_script") else ""
        add(("建期、转写" + ("、对齐" if sc else ""), f"python3 scripts/zp.py new {q(ep)} --video {q(vid)}{sc} --slug {slug}"))
        add(("文案对到声音上（重录留最后一遍，文案里没有的话剪掉）", f"python3 scripts/zp.py align {q(ep)}"))
        add(("粗剪", f"python3 scripts/zp.py cut {q(ep)}"))
        if has("denoise") or has("grade") or has("beauty"): add(("降噪 / 调光（对剪好的人物视频做，不改时长）", pol(f"studio/public/{slug}/person.mp4", f" --preview {q(ed + '/out/调光对比.jpg')}" if has("grade") or has("beauty") else "")))
        add(("排分镜并检查" + ("" if has("sfx") else "（分镜.json 里写 \"sfx\": false 关音效）"), f"写 {ed}/03_制作过程/分镜.json → python3 scripts/zp.py board {q(ep)}"))
        add(("关键帧 → 小样 → 成片 → 自查", f"python3 scripts/zp.py stills {q(ep)}；zp.py render {q(ep)} --preview；zp.py render {q(ep)}；zp.py check {q(ep)}"))
        if has("music"): add(("配乐（用户给了曲子就写进分镜.json 的 music；没有就合成一条）", f"python3 scripts/polish.py {q(ed + '/out/成片.mp4')} --music auto --mood bright -o {q(ed + '/out/成片-配乐.mp4')}"))
    elif style == "frame":
        add(("环境（第一次约下 500 MB）", "python3 scripts/frame_setup.py"))
        add(("转写、口误建议、量人脸", f"python3 scripts/frame_ingest.py {q(ed + '/01_输入素材/口播原片.mp4')} {q(ed)} --slug {slug}"))
        if has("grade") or has("beauty"): add(("调光（先看对比图；把打印的滤镜串放到下一步 --vf 的最前面）", f"python3 scripts/grade.py {q(ed + '/01_输入素材/口播原片.mp4')} {q(ed + '/03_制作过程/调光.json')}" + (" --beauty 0.3" if has("beauty") else "") + f" --preview {q(ed + '/03_制作过程/调光对比.jpg')}"))
        add(("粗剪、对齐（--drop 和 --vf 用 frame_ingest 打印的；" + ("口误建议里「确定」的都剪" if has("retake") or has("stutter") else "不剪口误就不给 --drop") + "）", "见 .claude/skills/frame-talk/steps/frame-01-cut.md 第 3、4 节的两条命令"))
        add(("声音", f"python3 scripts/frame_audio.py {q(ed)} --denoise {'auto' if has('denoise') else 'off'} --music {'auto' if has('music') else 'off'}"))
        add(("标题和剪辑决定表", f"写 {ed}/03_制作过程/edl.json → python3 scripts/frame_plan.py {q(ed)}"))
        add(("关键帧 → 成片 → 自查", f"python3 scripts/frame_render.py {q(ed)} keys；python3 scripts/frame_render.py {q(ed)} full"))
        if has("cover"): add(("封面", f"python3 scripts/frame_render.py {q(ed)} cover --at <秒>"))
    elif style == "danjie":
        w = st.get("workdir", ed + "/cut")
        add(("环境（每台机器一次）", "cd cutflow && npm install && npx playwright install chromium && pip install -r requirements.txt && node scripts/setup.js"))
        add(("粗剪（重录检测、去停顿、调光、裁切）", f"cd cutflow && node src/prep.js {q('../' + w)}" + (" --beauty 0.3" if has("beauty") else "") + ("" if has("grade") or has("beauty") else " --no-grade")))
        if has("denoise"): add(("降噪（对粗剪好的人物视频做；做完再跑下一步，字幕时间不受影响）", f"python3 scripts/polish.py {q(w + '/work/host.mp4')} --inplace --denoise auto"))
        add(("字幕", f"写 {w}/subs.txt → cd cutflow && node src/resub.js {q('../' + w)}"))
        add(("排片（" + ("音效默认开" if has("sfx") else "timeline.json 的 audio.sfx 写 false") + ("；配乐写进 audio.bgm" if has("music") else "") + "）", f"改 {w}/timeline.json；边排边看：cd cutflow && node src/render.js {q('../' + w)} --preview --still 12.5"))
        add(("预览、自查、出片", f"cd cutflow && node src/render.js {q('../' + w)} --preview && node src/check.js {q('../' + w)}；没问题去掉 --preview 出成片"))
        if has("music"): add(("没有可商用的曲子时合成一条配乐", f"python3 scripts/polish.py {q(w + '/out/final.mp4')} --music auto --mood bright -o {q(w + '/out/final-配乐.mp4')}"))
    elif style == "interview":
        w = st.get("workdir", ed + "/proj"); K = ".claude/skills/tiantu-interview-cut"
        add(("环境", f"bash {K}/scripts/setup.sh"))
        if has("grade") or has("beauty"): add(("调光（先看对比图；之后都用调好的这条当原片）", pol(q(w + "/raw/a.mp4"), f" --preview {q(w + '/work/调光对比.jpg')}").replace(" --denoise auto", "")))
        add(("看原片、量人脸", f"python3 {K}/scripts/sheet.py {q(w + '/raw/a.mp4')} --fps 0.2；python3 {K}/scripts/probe_aroll.py {q(w + '/raw/a.mp4')}"))
        add(("转写", f"cd {q(w)} && python3 {R}/{K}/scripts/transcribe.py raw/a.mp4 -o work/transcript.json --prompt \"专名…\""))
        add(("纸面剪辑 → 自动剪口吃、重说、停顿并复听", f"draft_script.py → 改 work/script.txt → cues_from_script.py（verify 干净才往下）"))
        add(("备空镜" + ("、配乐" if has("music") else ""), "tikhub_broll.py / still_to_clip.py" + ("；bgm_match.py -o bgm --mood light -n 3" if has("music") else "")))
        add(("写分镜 plan.json（" + ("降噪默认 auto" if has("denoise") else "\"audio\": {\"denoise\": \"off\"}") + ("" if has("music") else "；不写 bgm") + "）", "qc.py plan.json → render.py plan.json -o out/final.mp4 → qc.py plan.json out/final.mp4"))
        if has("music"): add(("出配乐备选", "swap_bgm.py plan.json out/final.mp4 --all bgm/candidates.json；swap_bgm.py … --none"))
    for i, (what, cmd) in enumerate(L, 1): print(f"{i:2d}. {what}\n      {cmd}")
    nxt = next((s for s in st["steps"] if not s["done"]), None)
    print("\n" + (f"现在在第 {nxt['no']} 步「{nxt['name']}」。" + ("需要用户给：" + nxt["ask"] + "。" if nxt["ask"] else "") + ("做完要用户确认：" + nxt["confirm"] + "。" if nxt["confirm"] else "") if nxt else "这一期全部完成。"))
    print(f"每确认一步：python3 scripts/episode.py done {q(ep)} <步骤号> --note \"做了什么\"")

ap = argparse.ArgumentParser(); sub = ap.add_subparsers(dest="cmd", required=True)
sub.add_parser("styles"); x = sub.add_parser("options"); x.add_argument("--style", choices=list(S))
x = sub.add_parser("new"); x.add_argument("name"); x.add_argument("--style", required=True); x.add_argument("--video"); x.add_argument("--script"); x.add_argument("--opts"); x.add_argument("--font"); x.add_argument("--slug")
x = sub.add_parser("set"); x.add_argument("name"); x.add_argument("--opts"); x.add_argument("--font")
x = sub.add_parser("recipe"); x.add_argument("name", nargs="?"); a = ap.parse_args()
if a.cmd == "styles": cmd_styles(a)
elif a.cmd == "options": cmd_options(a)
elif a.cmd == "new": cmd_new(a)
elif a.cmd == "set": cmd_set(a)
else:
    nm = a.name or latest()
    if not nm: sys.exit("还没有用 talk.py 建过口播。")
    st = load(nm)
    if not st.get("style"): sys.exit("这一期没有登记风格（老版本建的口播按财经解读风做，见技能 make-talk）。")
    recipe(nm, st)
