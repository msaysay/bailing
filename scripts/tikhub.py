#!/usr/bin/env python3
"""通过 TikHub 搜索并下载抖音视频素材，登记来源。
  搜索：scripts/tikhub.py search "黄仁勋 演讲" [--sort 1] [--days 0] [--dur 0] [--landscape] [--pages 2]
        sort：0 综合 1 最多点赞 2 最新；days：0 不限 1 一天 7 一周 180 半年；dur：0 / 0-1 / 1-5 / 5-10000
  下载：scripts/tikhub.py get <作品ID> --out <目录> --name <别名>
搜索结果缓存在 ~/.cache/tikhub-search.json，下载时从缓存取播放地址（地址几小时内有效）。
API Token 由云端环境的网络代理注入；本地运行时设置环境变量 TIKHUB_TOKEN。
登记到 <目录>/sources.json 的许可一栏写「平台公开内容，未取得授权」——能不能用进成片由人判断。"""
import argparse, json, os, sys, urllib.request
API = "https://api.tikhub.io/api/v1/douyin/search/fetch_video_search_v2"
CACHE = os.path.expanduser("~/.cache/tikhub-search.json")
def post(body):
    h = {"Content-Type": "application/json", "User-Agent": "video-studio/0.1"}   # 默认的 Python 标识会被接口网关拒绝
    if os.environ.get("TIKHUB_TOKEN"): h["Authorization"] = "Bearer " + os.environ["TIKHUB_TOKEN"]
    with urllib.request.urlopen(urllib.request.Request(API, json.dumps(body).encode(), h), timeout=120) as r: return json.load(r)
def main():
    ap = argparse.ArgumentParser(); sub = ap.add_subparsers(dest="cmd", required=True)
    s = sub.add_parser("search"); s.add_argument("q"); s.add_argument("--sort", default="0"); s.add_argument("--days", default="0"); s.add_argument("--dur", default="0")
    s.add_argument("--landscape", action="store_true"); s.add_argument("--pages", type=int, default=1)
    g = sub.add_parser("get"); g.add_argument("id"); g.add_argument("--out", required=True); g.add_argument("--name", required=True)
    a = ap.parse_args(); os.makedirs(os.path.dirname(CACHE), exist_ok=True)
    cache = json.load(open(CACHE)) if os.path.exists(CACHE) else {}
    if a.cmd == "search":
        cur, sid, bt = 0, "", ""
        for _ in range(a.pages):
            d = post(dict(keyword=a.q, cursor=cur, sort_type=a.sort, publish_time=a.days, filter_duration=a.dur, content_type="1", search_id=sid, backtrace=bt))["data"]
            for it in d.get("business_data") or []:
                w = (it.get("data") or {}).get("aweme_info")
                if not w: continue
                v = w.get("video", {}); W, H = v.get("width") or 0, v.get("height") or 0
                if a.landscape and W <= H: continue
                rec = dict(id=w["aweme_id"], author=w.get("author", {}).get("nickname", ""), dur=round((v.get("duration") or 0) / 1000), w=W, h=H,
                           digg=w.get("statistics", {}).get("digg_count", 0), desc=(w.get("desc") or "").replace("\n", " ")[:120],
                           time=w.get("create_time"), urls=(v.get("play_addr") or {}).get("url_list") or [])
                cache[rec["id"]] = rec
                print(f"{rec['id']} | {rec['digg']:>7} 赞 | {rec['dur']:>4}s | {W}x{H} | {rec['author']} | {rec['desc'][:60]}")
            cfg = d.get("business_config") or {}; cur = cfg.get("next_page", {}).get("cursor", cur + 10); sid = cfg.get("next_page", {}).get("search_id", sid); bt = cfg.get("next_page", {}).get("search_request_id", bt)
            if not cfg.get("has_more", 1): break
        json.dump(cache, open(CACHE, "w"), ensure_ascii=False)
    else:
        rec = cache.get(a.id) or sys.exit("缓存里没有这个作品，先 search")
        os.makedirs(a.out, exist_ok=True); fn = a.name + ".mp4"; data = None
        for u in rec["urls"]:
            try:
                with urllib.request.urlopen(urllib.request.Request(u, headers={"User-Agent": "Mozilla/5.0"}), timeout=300) as r: data = r.read()
                if len(data) > 50_000: break
            except Exception as e: print("  换下一个地址：", str(e)[:60])
        if not data or len(data) < 50_000: sys.exit("下载失败")
        open(os.path.join(a.out, fn), "wb").write(data)
        sp = os.path.join(a.out, "sources.json"); src = json.load(open(sp)) if os.path.exists(sp) else []
        src = [x for x in src if x["file"] != fn] + [dict(file=fn, title=rec["desc"], author="抖音 @" + rec["author"], license="平台公开内容，未取得授权", date=str(rec["time"]), page=f"https://www.douyin.com/video/{rec['id']}")]
        json.dump(src, open(sp, "w"), ensure_ascii=False, indent=1); print(fn, f"{len(data)/1e6:.1f}MB", rec["author"])
if __name__ == "__main__": main()
