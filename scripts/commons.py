#!/usr/bin/env python3
"""维基共享资源素材工具：搜索并下载带明确授权的真实照片/视频，自动登记来源。
  搜索：scripts/commons.py search "Jensen Huang" [--video] [--limit 12]
  下载：scripts/commons.py get "File:xxx.jpg" --out <目录> [--width 2400] [--name 别名]
下载时把作者、许可、原始页面追加到 <目录>/sources.json；没有许可信息的文件拒绝下载。"""
import argparse, json, os, re, sys, urllib.parse, urllib.request
API = "https://commons.wikimedia.org/w/api.php"
UA = {"User-Agent": "video-studio-asset-tool/0.1 (automated; licensed media lookup)"}
def api(**p):
    p.update(format="json", formatversion="2")
    return json.loads(fetch(API + "?" + urllib.parse.urlencode(p)))
def fetch(url, tries=7):
    """站点对共享出口限流很严：429 时按 Retry-After（没有就递增）等待重试。"""
    import time, urllib.error
    for k in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=180) as r: return r.read()
        except urllib.error.HTTPError as e:
            if e.code != 429 or k == tries - 1: sys.exit(f"请求失败：HTTP {e.code}")
            time.sleep(min(900, int(e.headers.get("Retry-After") or 0) + 5 or 10 * (k + 1)))   # 按站点给的等待时间等，不提前重试
        except urllib.error.URLError as e:
            if k == tries - 1: sys.exit(f"请求失败：{e.reason}")
            time.sleep(5)
def info(titles, width=None):
    p = dict(action="query", titles="|".join(titles), prop="imageinfo", iiprop="url|size|mime|extmetadata")
    out = []
    for pg in api(**p)["query"]["pages"]:
        ii = (pg.get("imageinfo") or [None])[0]
        if not ii: continue
        m = ii.get("extmetadata", {}); g = lambda k: re.sub(r"<[^>]+>", "", m.get(k, {}).get("value", "")).strip()
        out.append(dict(title=pg["title"], url=ii["url"], thumb=ii.get("thumburl"), w=ii["width"], h=ii["height"], mime=ii["mime"],
                        dur=ii.get("duration"), license=g("LicenseShortName"), author=g("Artist")[:120], date=g("DateTimeOriginal")[:40],
                        desc=g("ImageDescription")[:160], page=ii["descriptionurl"]))
    return out
def main():
    ap = argparse.ArgumentParser(); sub = ap.add_subparsers(dest="cmd", required=True)
    s = sub.add_parser("search"); s.add_argument("q"); s.add_argument("--video", action="store_true"); s.add_argument("--limit", type=int, default=12)
    g = sub.add_parser("get"); g.add_argument("title"); g.add_argument("--out", required=True); g.add_argument("--width", type=int, default=2400); g.add_argument("--name")
    a = ap.parse_args()
    if a.cmd == "search":
        q = a.q + (" filetype:video" if a.video else " filetype:bitmap")
        hits = [h["title"] for h in api(action="query", list="search", srsearch=q, srnamespace="6", srlimit=str(a.limit))["query"]["search"]]
        for i in info(hits) if hits else []:
            print(f"{i['title']}\n   {i['w']}x{i['h']} {i['mime']} {('%.0fs ' % i['dur']) if i['dur'] else ''}| {i['license'] or '无许可信息'} | {i['author']} | {i['date']}\n   {i['desc']}")
    else:
        i = info([a.title], a.width)[0]
        if not i["license"]: sys.exit("没有许可信息，不下载")
        if i["mime"].startswith("video") or i["mime"] == "application/ogg":   # 视频取不超过 1080p 的最大转码版本，避免下 4K 原片
            d = api(action="query", titles=a.title, prop="videoinfo", viprop="derivatives")["query"]["pages"][0]["videoinfo"][0]["derivatives"]
            d = [x for x in d if x.get("height") and x["height"] <= 1080 and "webm" in x["src"]]
            url = max(d, key=lambda x: x["height"])["src"] if d else i["url"]
            if url.startswith("//"): url = "https:" + url
        else: url = i["url"]      # 取原图，本地再缩；缩略图域名常被网络策略拦
        ext = os.path.splitext(urllib.parse.urlparse(url).path)[1].lower(); os.makedirs(a.out, exist_ok=True)
        fn = (a.name or re.sub(r"[^A-Za-z0-9]+", "-", a.title[5:].rsplit(".", 1)[0]).strip("-").lower()[:40]) + ext
        data = fetch(url); open(os.path.join(a.out, fn), "wb").write(data)
        sp = os.path.join(a.out, "sources.json"); src = json.load(open(sp)) if os.path.exists(sp) else []
        src = [x for x in src if x["file"] != fn] + [dict(file=fn, title=i["title"], author=i["author"], license=i["license"], date=i["date"], page=i["page"])]
        json.dump(src, open(sp, "w"), ensure_ascii=False, indent=1); print(fn, i["license"], i["author"])
if __name__ == "__main__": main()
