#!/usr/bin/env python3
"""找素材的总入口：先用没风险的，再用要确认的；下回来的东西先查水印和台标，再裁成这条片子要的尺寸，并记下来源。
规则和每一档的说明：docs/素材规则.md。操作说明：.claude/skills/footage-guide/SKILL.md。

  python3 scripts/footage.py guide                      TikHub 是什么、怎么接、收不收费、和剪辑流程什么关系；现在接没接
  python3 scripts/footage.py ladder                     素材来源五档，从没风险到要用户点头
  python3 scripts/footage.py find "关键词" [--en "english words"] [--level 3] [--video] [--n 8]
        按档位从低到高找。--level 是最高找到第几档：默认 3（只找明确授权的）；4 加上新闻机构和官方账号；5 加上抖音。4、5 档要先问过用户。
  python3 scripts/footage.py get <档位> <编号或链接> --out <目录> --name <别名>      把 find 列出来的某一条下回来
  python3 scripts/footage.py check <视频或图片> [--sheet 检查图.jpg]
        查三样：平台水印（角上跳来跳去的标）、台标和角标（一直在角上不动的）、烧进画面的字幕。给出避开它们之后还能用的范围。
  python3 scripts/footage.py fit <文件> --slot <槽位> --out <输出文件> [--ss 起点秒 --t 时长秒] [--level 档位 --who 谁的 --page 页面链接 --license 许可]
        按检查结果裁掉水印台标，裁成这种风格放素材的那个框的比例，去掉声音，登记到同目录的 sources.json。
        槽位：xiaolin-band 财经解读风的素材带 · ziqi-window 横屏深度解读风的素材窗 · news-full 横屏解读片铺满 · frame-window 相框老板风的画面窗 · tall-full 竖屏铺满（访谈纪实风）· redtop-phone 红顶风的手机壳（截图用，不裁）· 宽x高
  python3 scripts/footage.py ledger <素材目录>           列出这条片子用了哪些素材、各是第几档、哪些要在画面上标来源、交片时要告诉用户什么

钥匙：TikHub 的放在文件夹最外层「钥匙.txt」；Pexels 的（免费申请）放在「钥匙-pexels.txt」。都不要发在聊天里。"""
import sys as _sys
for _s in (_sys.stdout, _sys.stderr): getattr(_s, "reconfigure", lambda **k: None)(encoding="utf-8", errors="replace")
import argparse, json, os, re, subprocess, sys, urllib.parse, urllib.request

R = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); PY = sys.executable; SC = os.path.join(R, "scripts")
LEVELS = {
 1: ("自己的", "你自己拍的、自己电脑和手机上的截图和录屏", "没有风险", "直接用"),
 2: ("自己做的", "用组件画出来的图表、流程、文字卡，不用任何外部画面", "没有风险", "直接用"),
 3: ("明确授权的", "维基共享资源（要署名）、Pexels（免费可商用，不用署名）", "风险很低", "按许可用；要署名的在画面上或简介里署名"),
 4: ("新闻机构和官方账号的原片", "CNBC、路透、公司官方号发在 X 上的视频。没有平台水印，但有台标；没有取得授权", "有风险", "只截几秒当引用，裁掉台标，画面上标来源；要用户点头"),
 5: ("平台上别人的作品", "抖音上别人发的视频。取的是没有平台水印的原画，但画面里常有作者自己的字幕、贴纸、角标；没有取得授权", "风险最高", "别处都找不到才用；每条都要用户点头；有作者字幕和贴纸的不用"),
}
SLOTS = {"xiaolin-band": (1080, 842), "ziqi-window": (1204, 910), "news-full": (1920, 1080), "frame-window": (1440, 1080), "tall-full": (1080, 1920), "redtop-phone": None, "zhinan-window": (912, 514)}


def key(name):
    env = {"钥匙.txt": "TIKHUB_TOKEN", "钥匙-pexels.txt": "PEXELS_API_KEY"}[name]
    if os.environ.get(env): return os.environ[env]
    f = os.path.join(R, name)
    if os.path.exists(f):
        k = open(f, encoding="utf8").read().strip().splitlines()
        if k and k[0].strip(): return k[0].strip()
    return ""


def tikhub_ok():
    """接没接上：有钥匙就算接了；没有钥匙就真去问一下（有的环境由网络代理带钥匙）。"""
    if key("钥匙.txt"): return True
    try:
        req = urllib.request.Request("https://api.tikhub.io/api/v1/douyin/search/fetch_video_search_v2", json.dumps({"keyword": "天气", "cursor": 0, "sort_type": "0", "publish_time": "0", "filter_duration": "0", "content_type": "1", "search_id": "", "backtrace": ""}).encode(), {"Content-Type": "application/json", "User-Agent": "video-studio/0.1"})
        with urllib.request.urlopen(req, timeout=20) as r: return r.status == 200
    except Exception: return False


def cmd_guide(a):
    ok = tikhub_ok()
    print(f"""TikHub 现在：{'已经接上了' if ok else '还没接'}。

【它是什么】一个第三方的数据服务（tikhub.io），能按关键词搜公开视频、取到没有平台水印的播放地址。
【和我们什么关系】没有关系。它不是这套剪辑工作流的一部分，也不是我们的服务；我们只是在「找素材」这一步可以调用它。
【收费】它是收费的：先充值，按调用次数扣，一条片子找素材大概几毛到几块钱。钱是付给 TikHub 的，和这套工作流、和帮你剪片的 AI 都没关系；价格以它官网为准。
【不接行不行】行。不接照样能剪片：用你自己的素材、用组件画、用明确授权的免费素材库；想用哪条网上的视频，把链接或文件直接发来也行。
【它在流程的哪一步】只在「备素材」这一步用，而且排在后面：先用你自己的、再用自己做的、再用明确授权的，这三档都不够，才用它去搜新闻机构和官方账号的原片（第 4 档），最后才是抖音（第 5 档）。
【怎么接】（把下面这段原样发给用户）
  1. 打开 tikhub.io 注册，充一点钱。
  2. 在后台找到 API Token 那串字符，复制。
  3. 在这个文件夹最外层新建一个文本文件，起名「钥匙.txt」，把那串字符贴进去保存。
  不要把那串字符发在聊天里。好了回我「接好了」。
【接上之后】python3 scripts/footage.py find "关键词" --level 4（先问过用户再用 4、5 档）
【它搜来的东西】都是平台上的公开内容，没有取得授权。能不能用进成片、发不发，由用户自己定；你要做的是如实告诉他每条素材是哪来的。""")


def cmd_ladder(a):
    print("找素材按这个顺序，前面够用就不往后找：\n")
    for n, (name, what, risk, how) in LEVELS.items(): print(f"第 {n} 档 · {name}（{risk}）\n   是什么：{what}\n   怎么用：{how}\n")
    print("第 1、2 档不用搜。第 3 档：python3 scripts/footage.py find \"关键词\"。第 4、5 档要先接 TikHub（python3 scripts/footage.py guide）并且问过用户。")
    print("注意：在抖音 App 里点「保存」存下来的视频带跳动的平台水印，不要用；让用户发链接，或走第 5 档取没有平台水印的原画。无论哪来的，用之前都跑一遍 check。")


def pexels(q, video, n):
    k = key("钥匙-pexels.txt")
    if not k: return None
    url = ("https://api.pexels.com/videos/search" if video else "https://api.pexels.com/v1/search") + "?" + urllib.parse.urlencode({"query": q, "per_page": n})
    with urllib.request.urlopen(urllib.request.Request(url, headers={"Authorization": k, "User-Agent": "video-studio/0.1"}), timeout=60) as r: d = json.load(r)
    out = []
    for x in d.get("videos" if video else "photos", []):
        if video: f = max(x.get("video_files", []), key=lambda v: (v.get("width") or 0) <= 1920 and (v.get("width") or 0)); out.append({"id": x["id"], "w": f.get("width"), "h": f.get("height"), "dur": x.get("duration"), "who": (x.get("user") or {}).get("name"), "page": x.get("url"), "file": f.get("link")})
        else: out.append({"id": x["id"], "w": x.get("width"), "h": x.get("height"), "who": x.get("photographer"), "page": x.get("url"), "file": (x.get("src") or {}).get("large2x")})
    return out


def cmd_find(a):
    q = a.q; en = a.en or q; cache = {"q": q, "pexels": []}
    print(f"找「{q}」，最高到第 {a.level} 档。\n")
    print("第 1 档 · 自己的：先问用户手里有没有（照片、截图、录屏、以前拍的）。\n第 2 档 · 自己做的：这句话能不能用图表、流程、文字卡画出来？能就不用找画面。\n")
    if a.level >= 3:
        print("第 3 档 · 明确授权的")
        r = subprocess.run([PY, os.path.join(SC, "commons.py"), "search", en, "--limit", str(a.n)] + (["--video"] if a.video else []), capture_output=True, text=True) if os.path.exists(os.path.join(SC, "commons.py")) else None
        print("  维基共享资源（要署名）：\n" + ("\n".join("    " + l for l in (r.stdout.strip() or r.stderr.strip()[-200:] or "没找到").splitlines()[: a.n + 2]) if r else "    没有 commons.py"))
        print("    下载：python3 scripts/commons.py get \"File:名字\" --out <目录>")
        try: px = pexels(en, a.video, a.n)
        except Exception as e: px = []; print("  Pexels 没搜成：" + str(e)[:80])
        if px is None: print("  Pexels（免费可商用，不用署名）：还没放钥匙。它的钥匙是免费的：去 pexels.com/api 申请，存进文件夹最外层的「钥匙-pexels.txt」。")
        else:
            cache["pexels"] = px; print("  Pexels（免费可商用，不用署名）：" + ("" if px else "没找到"))
            for x in px: print(f"    {x['id']}  {x['w']}×{x['h']}" + (f"  {x['dur']} 秒" if x.get("dur") else "") + f"  作者 {x['who']}  {x['page']}")
            if px: print("    下载：python3 scripts/footage.py get 3 <编号> --out <目录> --name <别名>")
        print()
    if a.level >= 4:
        if not tikhub_ok(): print("第 4、5 档要先接 TikHub：python3 scripts/footage.py guide\n")
        else:
            print("第 4 档 · 新闻机构和官方账号的原片（没有授权：只截几秒、裁台标、标来源；要用户点头）")
            r = subprocess.run([PY, os.path.join(SC, "tikhub.py"), "xsearch", en] + (["--landscape"] if a.landscape else []), capture_output=True, text=True); print("\n".join("    " + l for l in (r.stdout.strip() or "没搜到：" + r.stderr.strip()[-160:]).splitlines()[: a.n + 2]))
            print("    下载：python3 scripts/tikhub.py xget <推文编号> --out <目录> --name <别名>\n")
            if a.level >= 5:
                print("第 5 档 · 抖音上别人的作品（风险最高：每条都要用户点头；有作者字幕和贴纸的不用）")
                r = subprocess.run([PY, os.path.join(SC, "tikhub.py"), "search", q], capture_output=True, text=True); print("\n".join("    " + l for l in (r.stdout.strip() or "没搜到：" + r.stderr.strip()[-160:]).splitlines()[: a.n + 2]))
                print("    下载：python3 scripts/tikhub.py get <作品编号> --out <目录> --name <别名>\n")
    json.dump(cache, open(os.path.expanduser("~/.cache/footage-find.json"), "w", encoding="utf8"), ensure_ascii=False)
    print("下回来的每一条，用之前都要：python3 scripts/footage.py check <文件>，再 fit 到这条片子的素材框里。")


def register(out_dir, fn, level, who, page, lic):
    sj = os.path.join(out_dir, "sources.json"); L = json.load(open(sj, encoding="utf8")) if os.path.exists(sj) else []
    L = [x for x in L if x.get("file") != fn]; L.append({"file": fn, "level": level, "kind": LEVELS[level][0], "author": who or "", "page": page or "", "license": lic or {1: "自己的", 2: "自己做的", 3: "见来源页面的许可", 4: "平台公开内容，未取得授权", 5: "平台公开内容，未取得授权"}[level]})
    json.dump(L, open(sj, "w", encoding="utf8"), ensure_ascii=False, indent=1)


def cmd_get(a):
    if a.level != 3: sys.exit("第 4 档用 scripts/tikhub.py xget，第 5 档用 scripts/tikhub.py get，任意链接用 scripts/tikhub.py url；维基共享资源用 scripts/commons.py get。这里只下 Pexels。")
    c = json.load(open(os.path.expanduser("~/.cache/footage-find.json"), encoding="utf8")) if os.path.exists(os.path.expanduser("~/.cache/footage-find.json")) else {}
    x = next((p for p in c.get("pexels", []) if str(p["id"]) == str(a.id)), None)
    if not x: sys.exit("先 find，再用它列出来的编号。")
    os.makedirs(a.out, exist_ok=True); ext = ".mp4" if x.get("dur") else ".jpg"; fn = (a.name or f"pexels-{x['id']}") + ext; dst = os.path.join(a.out, fn)
    with urllib.request.urlopen(urllib.request.Request(x["file"], headers={"User-Agent": "video-studio/0.1"}), timeout=300) as r, open(dst, "wb") as f: f.write(r.read())
    register(a.out, fn, 3, x["who"], x["page"], "Pexels 许可：免费可商用，不用署名"); print("下好：", dst)


def frames_of(path, n=28):
    import cv2
    if re.search(r"\.(png|jpe?g|webp)$", path, re.I): im = cv2.imread(path); return [im] if im is not None else []
    cap = cv2.VideoCapture(path); N = int(cap.get(cv2.CAP_PROP_FRAME_COUNT)); out = []
    for i in range(n):
        cap.set(cv2.CAP_PROP_POS_FRAMES, int(N * (0.04 + 0.92 * i / max(1, n - 1)))); ok, im = cap.read()
        if ok: out.append(im)
    return out


def analyse(path):
    """返回 (宽, 高, 发现的东西列表, 建议留下的范围 [x0, y0, x1, y1])。
    做法：抽二十几帧，逐像素看「边缘在多少帧里都在同一个位置」。画面内容会变，叠上去的标不会变；跳来跳去的平台水印是一部分帧里在同一个位置。只看四条边附近，中间不管。"""
    import cv2, numpy as np
    F = frames_of(path);
    if not F: sys.exit("读不出画面：" + path)
    h, w = F[0].shape[:2]; s = 480 / max(w, h); sw, sh = int(w * s), int(h * s); found = []
    if len(F) < 6: return w, h, [{"what": "只有一张图，查不了叠加的标，请用看图工具自己看一眼四个角", "box": None}], [0, 0, w, h]
    G = [cv2.cvtColor(cv2.resize(f, (sw, sh)), cv2.COLOR_BGR2GRAY) for f in F]; E = np.stack([cv2.Canny(g, 60, 160) > 0 for g in G]).astype(np.float32)
    E = np.stack([cv2.dilate(e, np.ones((2, 2), np.uint8)) for e in E]); stay = E.mean(0)                         # 每个像素有边缘的帧占比
    diff = np.mean([np.abs(G[i].astype(np.float32) - G[i - 1]).mean() for i in range(1, len(G))]); moving = diff > 6    # 画面本身在不在变（固定机位的访谈几乎不变，查不准）
    border = np.zeros((sh, sw), bool); bx, by = int(sw * 0.3), int(sh * 0.2); border[:by] = True; border[-by:] = True; border[:, :bx] = True; border[:, -bx:] = True
    def boxes(mask, kind, min_area=40):
        m = cv2.morphologyEx((mask & border).astype(np.uint8), cv2.MORPH_CLOSE, np.ones((9, 17), np.uint8)); n, lab, st, _ = cv2.connectedComponentsWithStats(m)
        for i in range(1, n):
            x, y, bw, bh, ar = st[i]
            if ar < min_area or bw < 10 or bh < 5 or bh > sh * 0.3: continue
            found.append({"what": kind, "box": [int(x / s), int(y / s), int((x + bw) / s), int((y + bh) / s)]})
    if moving:
        boxes(stay > 0.85, "一直在同一个位置不动的标（台标、角标、账号水印）")
        mid = (stay > 0.22) & (stay <= 0.85); corner = np.zeros((sh, sw), bool); cx, cy = int(sw * 0.42), int(sh * 0.14); corner[:cy, :cx] = True; corner[-cy:, -cx:] = True
        boxes(mid & corner, "有时出现在角上的东西（可能是平台的跳动水印，也可能只是画面里的字，看图确认）", 70)
    # 烧进去的字幕：下半部分某一条横带里，大多数帧都有密集的小边缘，而且内容每帧不一样
    band = E[:, int(sh * 0.55): int(sh * 0.97), int(sw * 0.12): int(sw * 0.88)]; rows = band.mean(2); dense = (rows > 0.16).mean(0); ys = np.where(dense > 0.5)[0]
    if moving and len(ys) >= 4 and stay[int(sh * 0.55) + ys.min(): int(sh * 0.55) + ys.max() + 1, int(sw * 0.2): int(sw * 0.8)].mean() < 0.6:
        y0 = int(sh * 0.55) + ys.min(); y1 = int(sh * 0.55) + ys.max() + 1; found.append({"what": "烧在画面里的字幕", "box": [0, int(max(0, y0 - 6) / s), w, int(min(sh, y1 + 6) / s)]})
    if not moving: found.append({"what": "画面几乎不动（固定机位），机器分不清哪些是叠上去的标，请用看图工具自己看四个角", "box": None})
    # 建议留下的范围：把有问题的框所在的那条边切掉（哪条边近切哪条）
    x0, y0, x1, y1 = 0, 0, w, h
    for f in found:
        if not f["box"]: continue
        a0, b0, a1, b1 = f["box"]; cuts = {"top": b1, "bottom": h - b0, "left": a1, "right": w - a0}; side = min(cuts, key=lambda k: cuts[k] / (h if k in ("top", "bottom") else w))
        if side == "top": y0 = max(y0, b1 + 6)
        elif side == "bottom": y1 = min(y1, b0 - 6)
        elif side == "left": x0 = max(x0, a1 + 6)
        else: x1 = min(x1, a0 - 6)
    return w, h, found, [x0, y0, x1, y1]


def cmd_check(a):
    import cv2
    w, h, found, keep = analyse(a.file); kw, kh = keep[2] - keep[0], keep[3] - keep[1]; left = kw * kh / (w * h)
    print(f"{os.path.basename(a.file)}　{w}×{h}")
    if not found: print("没发现水印、台标和烧进去的字幕。")
    for f in found: print("发现：" + f["what"] + (f"　位置 {f['box']}" if f["box"] else ""))
    if any(f["box"] for f in found):
        print(f"避开它们之后能用的范围：{kw}×{kh}（左上角 {keep[0]},{keep[1]}），是原画面的 {left:.0%}。" + ("" if left >= 0.55 else "剩得太少了，建议换一条素材。"))
    sheet = a.sheet or os.path.splitext(a.file)[0] + "-检查.jpg"; F = frames_of(a.file, 6); tiles = []
    for im in F[:6]:
        for f in found:
            if f["box"]: cv2.rectangle(im, tuple(f["box"][:2]), tuple(f["box"][2:]), (0, 0, 255), max(2, w // 300))
        cv2.rectangle(im, (keep[0], keep[1]), (keep[2], keep[3]), (0, 220, 0), max(2, w // 300)); tiles.append(cv2.resize(im, (int(w * 360 / h), 360)))
    if tiles: cv2.imwrite(sheet, cv2.hconcat(tiles)); print(f"检查图（红框是发现的东西，绿框是建议留下的范围）：{sheet}\n机器会漏、也会多报：用看图工具看这张图，再决定用不用、怎么裁。画面里有别人的脸、别人的字幕、别的账号名，机器不一定查得出来。")
    json.dump({"w": w, "h": h, "found": found, "keep": keep}, open(os.path.splitext(a.file)[0] + "-检查.json", "w", encoding="utf8"), ensure_ascii=False)


def cmd_fit(a):
    if a.slot == "redtop-phone":
        os.makedirs(os.path.dirname(os.path.abspath(a.out)), exist_ok=True); subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-i", a.file, a.out], check=True); register(os.path.dirname(os.path.abspath(a.out)), os.path.basename(a.out), a.level, a.who, a.page, a.license); print("截图不裁，原样放进手机壳：", a.out); return
    m = re.match(r"(\d+)x(\d+)$", a.slot); W, H = (int(m.group(1)), int(m.group(2))) if m else SLOTS.get(a.slot) or sys.exit("没有这个槽位：" + a.slot + "。可选：" + "、".join(SLOTS) + "，或者直接写 宽x高")
    w, h, found, keep = analyse(a.file); kw, kh = keep[2] - keep[0], keep[3] - keep[1]; ar = W / H
    if kw / kh > ar: cw, ch = int(kh * ar) // 2 * 2, kh // 2 * 2
    else: cw, ch = kw // 2 * 2, int(kw / ar) // 2 * 2
    cx = keep[0] + (kw - cw) // 2; cy = keep[1] + (kh - ch) // 2; used = cw * ch / (w * h)
    if used < 0.3: print(f"提醒：裁完只剩原画面的 {used:.0%}，会很糊。这条素材的比例和 {a.slot} 差太多，或者水印占得太多，建议换一条。")
    os.makedirs(os.path.dirname(os.path.abspath(a.out)), exist_ok=True); still = re.search(r"\.(png|jpe?g|webp)$", a.file, re.I)
    cmd = ["ffmpeg", "-nostdin", "-v", "error", "-y"] + (["-ss", str(a.ss)] if a.ss and not still else []) + ["-i", a.file] + (["-t", str(a.t)] if a.t and not still else [])
    cmd += ["-vf", f"crop={cw}:{ch}:{cx}:{cy},scale={W}:{H}:flags=lanczos"] + ([] if still else ["-an", "-r", "30", "-c:v", "libx264", "-crf", "19", "-pix_fmt", "yuv420p"]) + [a.out]
    subprocess.run(cmd, check=True); register(os.path.dirname(os.path.abspath(a.out)), os.path.basename(a.out), a.level, a.who, a.page, a.license)
    print(f"{a.out}　{W}×{H}（用了原画面的 {used:.0%}" + ("，避开了 " + "、".join(sorted({f['what'][:8] for f in found if f['box']})) if any(f["box"] for f in found) else "") + "）。声音已去掉。")
    if a.level >= 4: print("这条是第 " + str(a.level) + " 档：画面上要标来源（「画面：谁 · 日期」），只用几秒，并且在交片时告诉用户。")


def cmd_ledger(a):
    sj = os.path.join(a.dir, "sources.json")
    if not os.path.exists(sj): sys.exit("这个目录里没有 sources.json（还没有登记过素材）。")
    L = json.load(open(sj, encoding="utf8")); risky = [x for x in L if x.get("level", 5) >= 4]; credit = [x for x in L if x.get("level") == 3 and "不用署名" not in x.get("license", "")]
    print(f"一共 {len(L)} 条素材：")
    for x in sorted(L, key=lambda x: x.get("level", 5)): print(f"  第 {x.get('level', '?')} 档 {x.get('kind', '')}　{x['file']}　{x.get('author', '')}　{x.get('license', '')}　{x.get('page', '')}")
    print("\n交片时要告诉用户：")
    if not risky and not credit: print("  这条片子的素材都是自己的、自己做的，或者免费可商用不用署名的，没有要提醒的。")
    if credit: print("  下面这些要署名（写在画面上或简介里）：" + "；".join(f"{x['file']}（{x.get('author', '')}，{x.get('license', '')}）" for x in credit))
    if risky: print(f"  有 {len(risky)} 条画面是平台上的公开内容，没有取得授权：" + "、".join(x["file"] for x in risky) + "。画面上已经标了来源；能不能发、要不要换掉，由你决定。")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter); sub = ap.add_subparsers(dest="cmd", required=True); sub.add_parser("guide"); sub.add_parser("ladder")
    p = sub.add_parser("find"); p.add_argument("q"); p.add_argument("--en"); p.add_argument("--level", type=int, default=3, choices=[3, 4, 5]); p.add_argument("--video", action="store_true"); p.add_argument("--landscape", action="store_true"); p.add_argument("--n", type=int, default=8)
    p = sub.add_parser("get"); p.add_argument("level", type=int); p.add_argument("id"); p.add_argument("--out", required=True); p.add_argument("--name")
    p = sub.add_parser("check"); p.add_argument("file"); p.add_argument("--sheet")
    p = sub.add_parser("fit"); p.add_argument("file"); p.add_argument("--slot", required=True); p.add_argument("--out", required=True); p.add_argument("--ss", type=float); p.add_argument("--t", type=float); p.add_argument("--level", type=int, default=1, choices=[1, 2, 3, 4, 5]); p.add_argument("--who"); p.add_argument("--page"); p.add_argument("--license")
    p = sub.add_parser("ledger"); p.add_argument("dir")
    a = ap.parse_args(); globals()["cmd_" + a.cmd](a)


if __name__ == "__main__":
    main()
