#!/usr/bin/env python3
"""Find B-roll on Douyin through TikHub and download candidates.

    python3 tikhub_broll.py "集装箱码头 航拍" [-n 4] [-o broll] [--max-dur 90] [--pages 1]

Auth: in a Claude cloud session api.tikhub.io is authenticated by the proxy, nothing to set.
Elsewhere export TIKHUB_API_KEY. Every request is billed -- search with intent, not in bulk.

Writes  <out>/<slug>_<n>.mp4, a contact sheet next to each clip and appends to <out>/manifest.json
(keyword, aweme_id, author, share_url, desc, w, h, duration). The manifest is the licence trail:
these clips belong to their creators. Tell the user which ones were used so they can clear rights
or replace them with their own footage before publishing.
"""
import argparse, json, os, re, subprocess, sys, urllib.request

API = "https://api.tikhub.io/api/v1/douyin/search/fetch_video_search_v2"
ap = argparse.ArgumentParser()
ap.add_argument("keyword")
ap.add_argument("-n", type=int, default=4, help="clips to download")
ap.add_argument("-o", "--out", default="broll")
ap.add_argument("--max-dur", type=float, default=90, help="skip videos longer than this (s)")
ap.add_argument("--min-short-side", type=int, default=720)
ap.add_argument("--pages", type=int, default=1)
ap.add_argument("--list", action="store_true", help="list results, download nothing")
a = ap.parse_args()


def post(body):
    req = urllib.request.Request(API, data=json.dumps(body).encode(), method="POST",
                                 headers={"Content-Type": "application/json", "User-Agent": "broll-finder/1.0",
                                          "Authorization": "Bearer " + os.environ.get("TIKHUB_API_KEY", "proxy-injected")})
    with urllib.request.urlopen(req, timeout=90) as r:
        return json.load(r)


def find(o, acc):
    if isinstance(o, dict):
        if "aweme_id" in o and isinstance(o.get("video"), dict):
            acc.append(o)
            return
        for v in o.values():
            find(v, acc)
    elif isinstance(o, list):
        for v in o:
            find(v, acc)


def first(o, key):
    if isinstance(o, dict):
        if key in o and o[key] not in (None, ""):
            return o[key]
        for v in o.values():
            r = first(v, key)
            if r not in (None, ""):
                return r
    elif isinstance(o, list):
        for v in o:
            r = first(v, key)
            if r not in (None, ""):
                return r
    return None


items, cursor, sid, bt = [], 0, "", ""
for _ in range(a.pages):
    d = post({"keyword": a.keyword, "cursor": cursor, "sort_type": "0", "publish_time": "0",
              "filter_duration": "0-1" if a.max_dur <= 60 else "0", "content_type": "1", "search_id": sid, "backtrace": bt})
    if d.get("code") != 200:
        sys.exit("TikHub error: %s" % str(d)[:300])
    find(d, items)
    cursor, sid, bt = first(d, "cursor") or 0, first(d, "search_id") or "", first(d, "backtrace") or ""

os.makedirs(a.out, exist_ok=True)
mpath = os.path.join(a.out, "manifest.json")
man = json.load(open(mpath, encoding="utf8")) if os.path.exists(mpath) else []
have = {m["aweme_id"] for m in man}
slug = re.sub(r"[^\w\u4e00-\u9fff]+", "_", a.keyword).strip("_")[:24]
done = 0
for it in items:
    v = it["video"]
    dur = (v.get("duration") or 0) / 1000
    w, h = v.get("width") or 0, v.get("height") or 0
    ok = 2 <= dur <= a.max_dur and min(w, h) >= a.min_short_side and it["aweme_id"] not in have
    print("%s %-19s %4.0fs %4dx%-4d %s" % ("+" if ok else "-", it["aweme_id"], dur, w, h, (it.get("desc") or "")[:36].replace("\n", " ")))
    if not ok or a.list or done >= a.n:
        continue
    # best h264 rendition up to 1080 on the short side
    gears = [g for g in (v.get("bit_rate") or []) if not g.get("is_h265") and not g.get("is_bytevc1")]
    gears.sort(key=lambda g: (min(min(g["play_addr"].get("width", 0), g["play_addr"].get("height", 0)), 1080), g.get("bit_rate", 0)), reverse=True)
    urls = (gears[0]["play_addr"]["url_list"] if gears else []) + (v.get("play_addr_h264") or v.get("play_addr") or {}).get("url_list", [])
    dst = os.path.join(a.out, "%s_%d.mp4" % (slug, len(man) + 1))
    for u in urls:
        r = subprocess.run(["curl", "-sSL", "-m", "180", "-A", "Mozilla/5.0", "-o", dst, "-w", "%{http_code}", u],
                           stdout=subprocess.PIPE)
        if r.stdout.decode().strip() == "200" and os.path.getsize(dst) > 50000:
            break
    else:
        print("   download failed (CDN host may be blocked by the network policy: *.douyinvod.com, *.zjcdn.com)")
        continue
    man.append({"file": os.path.basename(dst), "keyword": a.keyword, "aweme_id": it["aweme_id"],
                "author": (it.get("author") or {}).get("nickname"), "desc": (it.get("desc") or "")[:120],
                "share_url": "https://www.douyin.com/video/" + it["aweme_id"], "width": w, "height": h, "duration": dur,
                "licence": "third-party, not cleared"})
    have.add(it["aweme_id"])
    done += 1
    subprocess.run([sys.executable, os.path.join(os.path.dirname(os.path.abspath(__file__)), "sheet.py"), dst,
                    "--fps", str(max(0.25, min(1, 24 / max(dur, 1))))])
    json.dump(man, open(mpath, "w", encoding="utf8"), ensure_ascii=False, indent=1)
print("downloaded %d -> %s" % (done, a.out))
