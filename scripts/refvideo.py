#!/usr/bin/env python3
"""把对标博主的公开视频下成高清版，只用来拆版式和组件（画面和声音不进成片）。
  python3 scripts/refvideo.py get <作品编号> [<作品编号> …] --out vendor/_cache/ref/小Lin说
  python3 scripts/refvideo.py list 小Lin说 [-n 20]          看清单（docs/reference/对标视频清单-*.json）
走 TikHub（每条计一次费；钥匙.txt 或环境变量 TIKHUB_TOKEN，云端由代理带）。播放地址几小时过期，所以每次现取，挑分辨率最高的一档。
下回来的文件放在 vendor/_cache/ 下，不进仓库、不进包。"""
import argparse, glob, json, os, subprocess, sys, time, urllib.request

R = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); ONE = "https://api.tikhub.io/api/v1/douyin/app/v3/fetch_one_video?aweme_id="


def headers():
    h = {"User-Agent": "video-studio"}; t = os.environ.get("TIKHUB_TOKEN"); k = os.path.join(R, "钥匙.txt")
    if not t and os.path.exists(k): t = open(k, encoding="utf8").read().strip()
    if t: h["Authorization"] = "Bearer " + t
    return h


def get(aid, out):
    dst = os.path.join(out, aid + ".mp4")
    if os.path.exists(dst) and os.path.getsize(dst) > 500000: print("已有", aid); return dst
    d = None
    for k in range(4):                                   # 这个接口偶尔回 400，等一下再试
        try: d = json.load(urllib.request.urlopen(urllib.request.Request(ONE + aid, headers=headers()), timeout=120)); break
        except Exception as e: err = e; time.sleep(3 + 4 * k)
    if d is None: print("取不到信息", aid, str(err)[:60]); return None
    a = (d.get("data") or {}).get("aweme_detail") or d.get("data") or {}; v = a.get("video") or {}
    tiers = sorted(v.get("bit_rate") or [], key=lambda b: (-(b.get("play_addr") or {}).get("height", 0) * (b.get("play_addr") or {}).get("width", 0), -b.get("bit_rate", 0)))
    cands = [(b.get("play_addr") or {}) for b in tiers] + [v.get("play_addr") or {}]
    for pa in cands:
        for u in pa.get("url_list") or []:
            try:
                with urllib.request.urlopen(urllib.request.Request(u, headers={"User-Agent": "Mozilla/5.0", "Referer": "https://www.douyin.com/"}), timeout=600) as r, open(dst, "wb") as fh:
                    while True:
                        b = r.read(1 << 20)
                        if not b: break
                        fh.write(b)
                if os.path.getsize(dst) > 500000:
                    if "unknown" in subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=codec_name", "-of", "csv=p=0", dst], capture_output=True, text=True).stdout: break    # 这一档是本机解不了的编码（比如 bvc2），换下一档
                    wh = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v", "-show_entries", "stream=width,height:format=duration", "-of", "csv=p=0", dst], capture_output=True, text=True).stdout.split()
                    json.dump({"id": aid, "desc": a.get("desc", ""), "likes": (a.get("statistics") or {}).get("digg_count"), "page": "https://www.douyin.com/video/" + aid}, open(os.path.join(out, aid + ".json"), "w", encoding="utf8"), ensure_ascii=False)
                    print(f"下好 {aid}  {' '.join(wh)}  {os.path.getsize(dst) / 1e6:.0f}MB  {a.get('desc', '')[:24]}"); return dst
            except Exception as e: err = e
    print("没下到", aid); return None


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter); sub = ap.add_subparsers(dest="cmd", required=True)
    p = sub.add_parser("get"); p.add_argument("ids", nargs="+"); p.add_argument("--out", required=True)
    p = sub.add_parser("list"); p.add_argument("creator"); p.add_argument("-n", type=int, default=20)
    a = ap.parse_args()
    if a.cmd == "list":
        for f in glob.glob(os.path.join(R, "docs", "reference", "对标视频清单-*.json")):
            for x in json.load(open(f, encoding="utf8"))["creators"].get(a.creator, [])[: a.n]: print(f"{x['id']}  {x['seconds']:>5}秒  赞 {x['likes']:>8}  {x['desc'][:40]}")
        return
    os.makedirs(a.out, exist_ok=True)
    for i in a.ids: get(i, a.out)


if __name__ == "__main__":
    main()
