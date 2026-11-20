"""共用字体库的函数：读 fonts/library.json、下载安装、把一个字体包套到某种风格上。命令行入口是 scripts/fonts.py。
字体文件统一装在 studio/public/fonts/。五种口播风格各有自己的渲染引擎，套字体包就是改各引擎读的那一个小文件：
  xiaolin   studio/src/kit/fontpack.json
  zhanpeng  studio/src/zhanpeng/theme.json 的 fontPack
  frame     studio/src/yuedu/fonts.json
  danjie    cutflow/src/stage/fonts.css（字体文件另拷一份到 cutflow/fonts/）
  interview .claude/skills/tiantu-interview-cut/assets/fonts/ 里的 sub.* 和 title.*
  ziqi      studio/src/kit/widefont.json"""
import glob, json, os, shutil, urllib.request
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LIB = os.path.join(R, "fonts", "library.json"); DIR = os.path.join(R, "studio", "public", "fonts"); ACTIVE = os.path.join(R, "fonts", "active.json")
STYLES = ("xiaolin", "danjie", "zhanpeng", "frame", "interview", "ziqi")
ROLES = ("sub", "title", "accent", "num")
_lib = None
def lib():
    global _lib
    if _lib is None: _lib = json.load(open(LIB, encoding="utf-8"))
    return _lib
def path(font_id): return os.path.join(DIR, lib()["fonts"][font_id]["file"])
def ok_file(p): return os.path.exists(p) and os.path.getsize(p) > 20_000
def installed(font_id): return ok_file(path(font_id))
def by_file(name):
    """按文件名找字体编号（没有返回 None）。"""
    return next((k for k, f in lib()["fonts"].items() if f["file"] == name), None)
def install(ids, quiet=False):
    """下载这些字体。返回没装上的编号。已有的不重下。"""
    os.makedirs(DIR, exist_ok=True); bad = []
    for i in ids:
        f = lib()["fonts"][i]; dest = path(i)
        if ok_file(dest): continue
        if not quiet: print(f"下载 {f['name']}（{f['license']}）…", flush=True)
        for u in f["urls"]:
            try:
                tmp = dest + ".part"; req = urllib.request.Request(u, headers={"User-Agent": "video-studio"})
                with urllib.request.urlopen(req, timeout=600) as r, open(tmp, "wb") as fh: shutil.copyfileobj(r, fh)
                if ok_file(tmp): os.replace(tmp, dest); break
                os.remove(tmp)
            except Exception as e:
                if not quiet: print("  这个地址没下到：", str(e)[:80])
        if not ok_file(dest):
            bad.append(i)
            if not quiet: print(f"  ✗ 没装上。手动办法：从 {f['from']} 下载「{f['name']}」，改名为 {f['file']} 放进 studio/public/fonts/")
    return bad
def pack(name):
    p = lib()["packs"].get(name)
    if not p: raise SystemExit(f"没有字体包「{name}」。可选：{'、'.join(lib()['packs'])}")
    return p
def pack_fonts(name): return sorted(set(pack(name)["roles"].values()))
def role_file(name, role): return lib()["fonts"][pack(name)["roles"][role]]["file"]
def family(file):
    """字体文件里登记的字体族名（访谈风的字幕引擎按名字找字体）。直接读 name 表里的 Unicode 名字，优先英文名；
    不用 PIL 的 getname，是因为有些中文字体的名字它读出来是一串问号。"""
    import struct
    b = open(os.path.join(DIR, file), "rb").read(); n = struct.unpack(">H", b[4:6])[0]; best = None
    for i in range(n):
        tag, _, off, _ = struct.unpack(">4sIII", b[12 + 16 * i:28 + 16 * i])
        if tag != b"name": continue
        cnt, so = struct.unpack(">HH", b[off + 2:off + 6])
        for k in range(cnt):
            pid, eid, lid, nid, ln, o = struct.unpack(">6H", b[off + 6 + 12 * k:off + 18 + 12 * k])
            if nid != 1 or pid != 3: continue
            s = b[off + so + o:off + so + o + ln].decode("utf-16-be", "ignore")
            if lid == 0x409: return s
            best = best or s
    if best: return best
    from PIL import ImageFont
    return ImageFont.truetype(os.path.join(DIR, file), 20).getname()[0]
def active():
    a = json.load(open(ACTIVE, encoding="utf-8")) if os.path.exists(ACTIVE) else {}
    return {s: a.get(s, lib()["styles"][s]["default"]) for s in STYLES}
def _write(p, obj): open(p, "w", encoding="utf-8").write(json.dumps(obj, ensure_ascii=False, indent=1) + "\n")

def zp_pack(name):
    """共用字体包 → 知识科普风的三个角色 {sub, strong, big}，每个带描边补粗量。"""
    F = lib()["fonts"]; r = pack(name)["roles"]; s, t, b = F[r["sub"]], F[r["title"]], F[r["accent"]]
    return {"sub": {"file": s["file"], "stroke": s["stroke"]}, "strong": {"file": t["file"], "stroke": round(t["stroke"] * 1.6, 4)}, "big": {"file": b["file"], "stroke": round(b["stroke"] * 1.45, 4)}}

def apply(style, name):
    """把字体包套到一种风格上。先装字体，装不上就不动。返回一句说明。"""
    if style not in STYLES: raise SystemExit(f"没有风格「{style}」。可选：{'、'.join(STYLES)}")
    default = lib()["styles"][style]["default"]; name = default if name == "default" else name; p = pack(name); is_default = name == default
    if style == "zhanpeng" and is_default: bad = []          # 知识科普风的原配字体由 zp.py setup 自己装
    else: bad = install(pack_fonts(name))
    if bad: raise SystemExit("字体没装全，没有切换：" + "、".join(lib()["fonts"][i]["name"] for i in bad))
    f = lambda role: role_file(name, role)
    if style == "xiaolin":
        _write(os.path.join(R, "studio", "src", "kit", "fontpack.json"), {"pack": name, "sub": None if name == "xiaolin-default" else f("sub"), "title": None if name == "xiaolin-default" else f("title")})   # xiaolin-default 是纯 MiSans，不用另外加载
    elif style == "ziqi":
        _write(os.path.join(R, "studio", "src", "kit", "widefont.json"), {"pack": name, "sub": f("sub"), "title": f("title"), "num": f("num")})
    elif style == "zhanpeng":
        tp = os.path.join(R, "studio", "src", "zhanpeng", "theme.json"); th = json.load(open(tp, encoding="utf-8")); th["fontPack"] = "chill" if is_default else name; _write(tp, th)
    elif style == "frame":
        _write(os.path.join(R, "studio", "src", "yuedu", "fonts.json"), {"pack": name, "serif": None if is_default else f("title"), "slant": None if is_default else f("sub")})
    elif style == "danjie":
        cf = os.path.join(R, "cutflow", "fonts"); os.makedirs(cf, exist_ok=True)
        if is_default: m = {"SubTalk": "ZCOOLQingKeHuangYou.ttf", "SubCard": "YouSheBiaoTiHei.ttf", "Num": "AlimamaShuHeiTi-Bold.ttf", "Brush": "MaShanZheng.ttf"}   # cutflow 自己的 setup.js 下的那四个文件名
        else:
            m = {"SubTalk": f("sub"), "SubCard": f("title"), "Num": f("num"), "Brush": f("accent")}
            for x in set(m.values()):
                if not ok_file(os.path.join(cf, x)): shutil.copy2(os.path.join(DIR, x), os.path.join(cf, x))
        css = f"/* 字体包：{name}（{p['name']}）。由 scripts/fonts.py use 生成，不要手改；换回原配：scripts/fonts.py use default --style danjie */\n"
        css += "".join(f'@font-face {{ font-family: "{k}"; src: url("../../fonts/{v}"); }}\n' for k, v in m.items())
        open(os.path.join(R, "cutflow", "src", "stage", "fonts.css"), "w", encoding="utf-8").write(css)
    elif style == "interview":
        tf = os.path.join(R, ".claude", "skills", "tiantu-interview-cut", "assets", "fonts"); os.makedirs(tf, exist_ok=True)
        for old in glob.glob(os.path.join(tf, "sub.*")) + glob.glob(os.path.join(tf, "title.*")):
            if not old.endswith(".pack") and os.path.exists(old + ".pack"): os.remove(old); os.remove(old + ".pack")   # 只清字体包放进来的，用户自己放的（比如瑞意宋）不动
        if not is_default:
            for role, stem in (("sub", "sub"), ("title", "title")):
                if [x for x in glob.glob(os.path.join(tf, stem + ".*")) if not x.endswith(".pack")]: raise SystemExit(f"{tf} 里已经有用户自己放的 {stem}.* 字体（比如瑞意宋），先挪走再换字体包")
                src = os.path.join(DIR, f(role)); dst = os.path.join(tf, stem + os.path.splitext(src)[1]); shutil.copy2(src, dst); open(dst + ".pack", "w", encoding="utf-8").write(family(f(role)))   # 旁边这个小文件记着字体族名，ass.py 读它
    a = json.load(open(ACTIVE, encoding="utf-8")) if os.path.exists(ACTIVE) else {}
    a[style] = name; _write(ACTIVE, a)
    return f"{lib()['styles'][style]['name']} 现在用字体包「{name}」（{p['name']}）。{lib()['styles'][style]['roles']}。"

def sheet(names, out, text=None, title=None):
    """字体包样张：每包一行，四个角色各写一句。返回画进去的包。"""
    from PIL import Image, ImageDraw, ImageFont
    names = [n for n in names if not install(pack_fonts(n), quiet=True)]
    if not names: return []
    lab_file = os.path.join(DIR, "MiSans-Regular.otf")
    if not ok_file(lab_file): install(["misans-regular"], quiet=True)
    lab = (lambda s: ImageFont.truetype(lab_file, s)) if ok_file(lab_file) else (lambda s: ImageFont.load_default())
    Wd, row = 1800, 250; img = Image.new("RGB", (Wd, 90 + row * len(names)), (22, 24, 30)); d = ImageDraw.Draw(img)
    d.text((40, 26), title or "字体包样张（左：字幕　中：标题和花字　右：金句大字 + 数字）", font=lab(34), fill=(235, 232, 222))
    F = lib()["fonts"]
    for k, n in enumerate(names):
        p = pack(n); y = 90 + k * row; r = p["roles"]
        def ft(role, size, txt="", maxw=0):               # 太宽的字体自动缩小，免得压到旁边一栏
            f = ImageFont.truetype(path(r[role]), size)
            while maxw and size > 20 and d.textlength(txt, font=f) > maxw: size -= 4; f = ImageFont.truetype(path(r[role]), size)
            return f
        d.rectangle([0, y, Wd, y + row - 6], fill=(34, 37, 46) if k % 2 == 0 else (28, 31, 39))
        d.text((40, y + 14), f"{n}　{p['name']}", font=lab(28), fill=(255, 216, 74))
        d.text((40, y + 54), p["note"], font=lab(21), fill=(150, 156, 170))
        d.text((40, y + 86), "　".join(f"{role}：{F[r[role]]['name']}" for role in ROLES), font=lab(19), fill=(110, 116, 130))
        sub = text or "这笔钱到底该不该花"
        d.text((40, y + 132), sub, font=ft("sub", 62, sub, 640), fill=(255, 255, 255), stroke_width=4, stroke_fill=(10, 13, 24))
        d.text((720, y + 120), "三个关键数字", font=ft("title", 82, "三个关键数字", 490), fill=(255, 216, 74), stroke_width=4, stroke_fill=(10, 13, 24))
        d.text((1250, y + 108), "长期主义", font=ft("accent", 98, "长期主义", 520), fill=(255, 255, 255))
        d.text((1640, y + 24), "37.5%", font=ft("num", 54), fill=(255, 93, 93))
    os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True); img.save(out, quality=90); return names

def font_sheet(ids, out, text="做内容要有长期主义 2026 ABC"):
    """单个字体的样张：每个字体一行。"""
    from PIL import Image, ImageDraw, ImageFont
    ids = [i for i in ids if installed(i)]
    if not ids: return []
    lab_file = os.path.join(DIR, "MiSans-Regular.otf"); lab = (lambda s: ImageFont.truetype(lab_file, s)) if ok_file(lab_file) else (lambda s: ImageFont.load_default())
    cols = 2; rows = -(-len(ids) // cols); cw, rh = 1100, 120; img = Image.new("RGB", (cw * cols, 70 + rh * rows), (22, 24, 30)); d = ImageDraw.Draw(img)
    d.text((30, 18), f"字体库已安装的 {len(ids)} 款字体", font=lab(30), fill=(235, 232, 222)); F = lib()["fonts"]
    for k, i in enumerate(ids):
        x = (k // rows) * cw; y = 70 + (k % rows) * rh
        d.text((x + 30, y + 6), f"{i}　{F[i]['name']}　[{F[i]['cat']}] {F[i]['mood']}", font=lab(19), fill=(140, 146, 160))
        try: d.text((x + 30, y + 36), text, font=ImageFont.truetype(path(i), 60), fill=(255, 255, 255))
        except Exception as e: d.text((x + 30, y + 44), "（这个字体画不出来：" + str(e)[:30] + "）", font=lab(24), fill=(255, 93, 93))
    img.save(out, quality=90); return ids
