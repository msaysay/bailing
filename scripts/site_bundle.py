#!/usr/bin/env python3
"""把官网三页（首页、工作流全景、视觉图鉴）各打成一个能单独打开的 HTML（样式、脚本、图片、小视频都内嵌），方便直接发给别人看；
再把整个 site/ 打成一个压缩包（解压后双击 index.html，或者整个目录放到任何静态托管上）。
用法：python3 scripts/site_bundle.py [--out dist/交付/官网]
单文件版里：三页之间的链接互相指向同目录的另外两个单文件；首页的下载按钮指向的压缩包不在单文件里（整站压缩包里有）。"""
import argparse, base64, json, os, re, zipfile
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); S = os.path.join(R, "site")
ap = argparse.ArgumentParser(); ap.add_argument("--out", default=os.path.join(R, "dist", "交付", "官网")); ap.add_argument("--no-zip", action="store_true"); a = ap.parse_args(); os.makedirs(a.out, exist_ok=True)
MIME = {".mp4": "video/mp4", ".jpg": "image/jpeg", ".png": "image/png", ".webp": "image/webp"}
assets = {}
for d in ("assets/showcase", "vendor/mg-styles-15/clips", "assets/demos", "assets/thumbs", "assets/img", "assets/video"):
    if not os.path.isdir(os.path.join(S, d)): print("缺目录（不进仓库的媒体，要先放回来）：site/" + d); continue
    for f in sorted(os.listdir(os.path.join(S, d))):
        ext = os.path.splitext(f)[1]
        if ext in MIME: assets[f"{d}/{f}"] = f"data:{MIME[ext]};base64," + base64.b64encode(open(os.path.join(S, d, f), "rb").read()).decode()
NAMES = {"index.html": "首页.html", "workflow.html": "工作流全景.html", "atlas.html": "视觉图鉴.html"}
WANT = {"index.html": ("assets/img", "assets/video", "assets/thumbs", "assets/demos"), "workflow.html": ("assets/showcase",), "atlas.html": ("assets/showcase", "vendor/", "assets/demos", "assets/thumbs", "assets/img/tpl5")}
G = "(window.__ASSETS||{})"
for page, name in NAMES.items():
    h = open(os.path.join(S, page), encoding="utf8").read()
    h = re.sub(r'<link rel="stylesheet" href="([^"]+)">', lambda m: "<style>\n" + re.sub(r"@font-face[^}]*}", "", open(os.path.join(S, m.group(1)), encoding="utf8").read()) + "\n</style>", h)
    need = {k: v for k, v in assets.items() if k.startswith(WANT[page])}
    h = h.replace("</head>", "<script>window.__ASSETS = " + json.dumps(need) + ";</script>\n</head>", 1)
    h = re.sub(r'<script src="([^"]+)"></script>', lambda m: "<script>\n" + open(os.path.join(S, m.group(1)), encoding="utf8").read().replace("</script>", "<\\/script>") + "\n</script>", h)
    if page == "index.html":
        # 首页的脚本用模板字符串拼路径（assets/demos/${id}.mp4），改成从内嵌数据里取；写死在页面里的路径直接换成数据
        h = re.sub(r"assets/(thumbs|demos)/\$\{([^}]+)\}\.(jpg|mp4)", lambda m: "${" + G + "['assets/" + m.group(1) + "/'+(" + m.group(2) + ")+'." + m.group(3) + "']}", h)
        head, body = h.split("</head>", 1)
        body = re.sub(r"(?<![\w/.])(assets/(?:img|video)/[\w.-]+\.(?:jpg|png|mp4))", lambda m: need.get(m.group(1), m.group(1)), body); h = head + "</head>" + body
        h = re.sub(r'href="downloads/[^"]*"', 'href="#get"', h)
    for p, n in NAMES.items(): h = re.sub(r'href="' + re.escape(p) + r'(#[^"]*)?"', lambda m: f'href="{n}{m.group(1) or ""}"', h)
    out = os.path.join(a.out, name); open(out, "w", encoding="utf8").write(h); print(f"{out}  {os.path.getsize(out) / 1e6:.1f} MB")
if not a.no_zip:
    z = os.path.join(a.out, "官网-整站.zip")
    with zipfile.ZipFile(z, "w", zipfile.ZIP_DEFLATED) as zf:
        for base, dirs, names in os.walk(S):
            for n in names:
                f = os.path.join(base, n); zf.write(f, "site/" + os.path.relpath(f, S).replace(os.sep, "/"))
    print(f"{z}  {os.path.getsize(z) / 1e6:.1f} MB")
