#!/usr/bin/env python3
"""把官网的「工作流全景」和「视觉图鉴」各打成一个能单独打开的 HTML（样式、脚本、小视频都内嵌），方便直接发给别人看。
用法：python3 scripts/site_bundle.py [--out dist/交付/图鉴]
页面之间的链接在单文件版里改成指向同目录的另一个单文件；指向首页的链接去掉。"""
import argparse, base64, json, os, re
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); S = os.path.join(R, "site")
ap = argparse.ArgumentParser(); ap.add_argument("--out", default=os.path.join(R, "dist", "交付", "图鉴")); a = ap.parse_args(); os.makedirs(a.out, exist_ok=True)
MIME = {".mp4": "video/mp4", ".jpg": "image/jpeg", ".png": "image/png", ".webp": "image/webp"}
assets = {}
for d in ("assets/showcase", "vendor/mg-styles-15/clips", "assets/demos", "assets/thumbs"):
    for f in sorted(os.listdir(os.path.join(S, d))):
        ext = os.path.splitext(f)[1]
        if ext in MIME: assets[f"{d}/{f}"] = f"data:{MIME[ext]};base64," + base64.b64encode(open(os.path.join(S, d, f), "rb").read()).decode()
assets["assets/img/tpl5.jpg"] = "data:image/jpeg;base64," + base64.b64encode(open(os.path.join(S, "assets/img/tpl5.jpg"), "rb").read()).decode()
NAMES = {"workflow.html": "工作流全景.html", "atlas.html": "视觉图鉴.html"}
for page, name in NAMES.items():
    h = open(os.path.join(S, page), encoding="utf8").read()
    h = re.sub(r'<link rel="stylesheet" href="([^"]+)">', lambda m: "<style>\n" + re.sub(r"@font-face[^}]*}", "", open(os.path.join(S, m.group(1)), encoding="utf8").read()) + "\n</style>", h)
    need = {k: v for k, v in assets.items() if page == "atlas.html" or k.startswith("assets/showcase")}
    h = h.replace("</head>", "<script>window.__ASSETS = " + json.dumps(need) + ";</script>\n</head>", 1)
    h = re.sub(r'<script src="([^"]+)"></script>', lambda m: "<script>\n" + open(os.path.join(S, m.group(1)), encoding="utf8").read().replace("</script>", "<\\/script>") + "\n</script>", h)
    for p, n in NAMES.items(): h = h.replace(f'href="{p}"', f'href="{n}"')
    h = re.sub(r'<a (class="[^"]*" )?href="index\.html[^"]*"[^>]*>.*?</a>', "", h)                  # 单文件版没有首页
    out = os.path.join(a.out, name); open(out, "w", encoding="utf8").write(h); print(f"{out}  {os.path.getsize(out) / 1e6:.1f} MB")
