#!/usr/bin/env python3
"""音乐工具：曲库 + 分析 + 匹配 + 试听。和剪辑流程分开，单独测。

  python3 musiclab/ml.py sync                       登记 incompetech 整个目录（约 1400 首，只登记文字，不下载）
  python3 musiclab/ml.py add 曲子.mp3 --license own   加自己的曲子（买的、自己做的、AI 生成的），可加 --credit "署名文字" --feel Bright,Calming
  python3 musiclab/ml.py warm [--type talk] [-n 12]  预先把每类视频排前面的曲子下载并听一遍
  python3 musiclab/ml.py list [--analyzed]           看库里有什么
  python3 musiclab/ml.py types                       每类视频的配乐规矩
  python3 musiclab/ml.py brief 视频.mp4 --type talk [--timing timing.json] -o 输出目录     出配乐需求单初稿
  python3 musiclab/ml.py match 输出目录/brief.json [-n 3] [--pool 10] [--no-credit] [--track 曲目id]   选曲、对齐、合成、出试听页
  python3 musiclab/ml.py rate 输出目录 2 good|bad [--note 原因]     听完打分，下次选曲会参考

内容类型：talk 口播 / vlog 生活vlog / teach 老师分享 / finance 新闻财经 / knowledge 知识类"""
import argparse, json, os, sys, time
for _s in (sys.stdout, sys.stderr):
    getattr(_s, "reconfigure", lambda **k: None)(encoding="utf-8", errors="replace")
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from mlab import library, match
from mlab.library import RULES

TYPES = list(RULES["types"])


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)
    sub.add_parser("sync")
    p = sub.add_parser("add"); p.add_argument("files", nargs="+"); p.add_argument("--license", default="own"); p.add_argument("--credit"); p.add_argument("--feel", default="")
    p.add_argument("--source", default="local"); p.add_argument("--non-commercial", action="store_true"); p.add_argument("--link", action="store_true", help="不复制文件，只记路径")
    p = sub.add_parser("warm"); p.add_argument("--type", choices=TYPES); p.add_argument("-n", type=int, default=12)
    p = sub.add_parser("list"); p.add_argument("--analyzed", action="store_true")
    sub.add_parser("types")
    p = sub.add_parser("brief"); p.add_argument("src"); p.add_argument("--type", required=True, choices=TYPES); p.add_argument("--timing"); p.add_argument("-o", "--out", required=True)
    p = sub.add_parser("match"); p.add_argument("brief"); p.add_argument("-n", type=int, default=3); p.add_argument("--pool", type=int, default=10)
    p.add_argument("--no-credit", action="store_true"); p.add_argument("--track"); p.add_argument("-o", "--out")
    p = sub.add_parser("rate"); p.add_argument("dir"); p.add_argument("rank", type=int); p.add_argument("verdict", choices=["good", "bad"]); p.add_argument("--note", default="")
    p = sub.add_parser("ref"); p.add_argument("action", choices=["add", "profile", "check"]); p.add_argument("target", nargs="?"); p.add_argument("--type", choices=TYPES); p.add_argument("-n", type=int, default=3); p.add_argument("--like", help="ref check 时对照某一位博主，而不是整个方向")
    a = ap.parse_args()
    cat = library.load()

    if a.cmd == "sync":
        new, total = library.sync_incompetech(cat); library.save(cat)
        print(f"incompetech 目录 {total} 首，新登记 {new} 首。库里共 {len(cat['tracks'])} 首。")
    elif a.cmd == "add":
        for f in a.files:
            tid = library.add_local(cat, f, license_id=a.license, credit=a.credit, commercial=not a.non_commercial,
                                    feel=[x.strip() for x in a.feel.split(",") if x.strip()], source=a.source, copy=not a.link)
            t = cat["tracks"][tid]; an = t["analysis"]
            print(f"已加入 {tid}：{an['bpm']:.0f} 拍/分，{an['mode']}，{len(an['sections'])} 段，情绪 {t['dims']}" if an else f"{tid} 用不了：{t.get('unusable')}")
            library.save(cat)
    elif a.cmd == "warm":
        for vt in ([a.type] if a.type else TYPES):
            prof = RULES["types"][vt]
            fake = {"type": vt, "duration": 60, "voice": "x", "segments": []}
            ids = match.prefilter(cat, fake, prof, pool=a.n)
            print(f"{prof['name']}：{len(ids)} 首")
            for tid in ids:
                if cat["tracks"][tid].get("analysis"):
                    continue
                t0 = time.time()
                try:
                    library.ensure_analysis(cat, tid); library.save(cat)
                    print(f"  听完 {cat['tracks'][tid]['title']}（{time.time() - t0:.0f} 秒）")
                except Exception as e:
                    print(f"  取不到 {tid}：{e}")
    elif a.cmd == "list":
        rows = [(tid, t) for tid, t in cat["tracks"].items() if t.get("analysis") or not a.analyzed]
        for tid, t in rows:
            an = t.get("analysis") or {}
            dims = " ".join(f"{RULES['dims'][k]}{v}" for k, v in sorted((t.get("dims") or {}).items(), key=lambda kv: -kv[1])[:4])
            print(f"{tid:44s} {(t.get('bpm_tag') or an.get('bpm') or 0):5.0f}拍 {'已听' if an else '未听'} {'要署名' if t['license'].get('attribution') else '免署名'}  {dims}")
        print(f"共 {len(rows)} 首，其中听过的 {sum(1 for _, t in rows if t.get('analysis'))} 首。")
    elif a.cmd == "types":
        for k, p in RULES["types"].items():
            print(f"\n{k}　{p['name']}　速度 {p['bpm'][0]}–{p['bpm'][1]}，说话时比人声低 {-p['bed_db']}，没人说话时低 {-p['open_db']}")
            print("  想要：" + "、".join(RULES["dims"][d] for d in p["want"]) + "　不要：" + "、".join(RULES["dims"][d] for d in p["avoid"]))
            for nline in p["nodes"]:
                print("  · " + nline)
    elif a.cmd == "brief":
        from mlab import brief
        out, b = brief.draft(a.src, a.type, a.out, a.timing)
        print(f"需求单初稿：{out}\n{b['duration']:.0f} 秒，{len(b['segments'])} 段，说话占 {b['speech_ratio']:.0%}，{len(b['pauses'])} 处长停顿。")
        print("下一步：按内容改 want/avoid、每段 energy，补上 moments（高点、转折、重点句），然后跑 match。")
    elif a.cmd == "match":
        from mlab import render
        b = json.load(open(a.brief, encoding="utf-8"))
        out = a.out or os.path.dirname(os.path.abspath(a.brief))
        os.makedirs(out, exist_ok=True)
        if not cat["tracks"]:
            sys.exit("曲库是空的，先跑：python3 musiclab/ml.py sync")
        print("选曲中（没听过的曲子要先下载再听，每首十几秒）…")
        cands, prof = match.run(cat, b, a.n, a.pool, a.no_credit, a.track)
        if not cands:
            sys.exit("没有合适的曲子。放宽条件或往库里加曲子。")
        res = []
        for i, c in enumerate(cands, 1):
            plan, mk = render.render(cat, b, c, prof, out, f"方案{i}")
            res.append((plan, mk, c))
            print(f"方案{i}　{plan['title']}　总分 {plan['score']:.2f}　从 {plan['offset']:.1f} 秒起　结尾：{plan['ending']['type']}　对上 {len(plan['hits'])} 个节点")
        page = render.audition(b, prof, res, out, cat)
        json.dump({"brief": os.path.abspath(a.brief), "type": b["type"], "ranked": [p["track"] for p, _, _ in res]}, open(os.path.join(out, "match.json"), "w"), ensure_ascii=False)
        print(f"试听页：{page}")
    elif a.cmd == "ref":
        from mlab import reference as R
        LABEL = {"music_coverage": "配乐覆盖全片的比例", "under_speech_db": "说话时配乐比人声低（分贝）", "open_db": "没人说话时比人声低", "gap_lift_db": "停顿处抬起多少", "hook_db": "开头 3 秒比正文响",
                 "music_in_s": "配乐第几秒进", "music_ends_before_end_s": "配乐比片尾早停几秒", "level_sd_db": "配乐音量起伏", "breaks_per_min": "每分钟留白次数", "bpm": "速度（量不准，仅参考）",
                 "onset_rate": "每秒音头数（忙不忙）", "punch": "鼓点占比", "speech_band": "人声频段占比"}
        if a.action == "add":                      # ref add 博主名 --type finance -n 3
            if not a.target or not a.type:
                sys.exit("用法：ml.py ref add 博主名 --type 内容类型 [-n 3]")
            print(f"抓 {a.target} 点赞最高的 {a.n} 条，每条拆分加测量约等于片长…")
            print(f"量完 {R.run_creator(a.type, a.target, a.n)} 条。汇总：python3 musiclab/ml.py ref profile")
        elif a.action == "profile":
            for t, p in R.build_profiles().items():
                print(f"\n{t[1:] if t[0] == '@' else RULES['types'][t]['name']}　{p['videos']} 条，其中 {p['with_music']} 条有配乐　博主：{'、'.join(p['creators'])}　收尾：{p.get('ending')}")
                for k, m in p["metrics"].items():
                    print(f"  {LABEL.get(k, k):26s} 中位 {m['median']:>7}　中间一半 {m['p25']} ~ {m['p75']}")
        elif a.action == "check":                  # ref check 输出目录：我们的方案对照大 V
            b = json.load(open(os.path.join(a.target, "brief.json"), encoding="utf-8"))
            prof = R._load(R.PROFILES, {}).get("@" + a.like if a.like else b["type"])
            if not prof or not b.get("voice"):
                sys.exit("这个类型还没有参考画像，或这条片子没有人声。")
            for f in sorted(x for x in os.listdir(a.target) if x.endswith("_bed.wav")):
                rate, rows = R.compare(R.measure(b["voice"], os.path.join(a.target, f)), prof)
                print(f"\n{f[:-8]}　和大 V 做法一致的项：{rate:.0%}")
                for r in rows:
                    print(f"  {'合' if r['ok'] else '偏'}  {LABEL.get(r['metric'], r['metric']):26s} 我们 {r['ours']:>7}　大 V {r['ref_range'][0]} ~ {r['ref_range'][1]}")
    elif a.cmd == "rate":
        m = json.load(open(os.path.join(a.dir, "match.json")))
        tid = m["ranked"][a.rank - 1]
        with open(match.FEEDBACK, "a", encoding="utf-8") as fh:
            fh.write(json.dumps({"track": tid, "type": m["type"], "verdict": a.verdict, "note": a.note, "at": time.strftime("%Y-%m-%d")}, ensure_ascii=False) + "\n")
        if a.verdict == "good":
            use = json.load(open(match.USAGE)) if os.path.exists(match.USAGE) else {}
            use[tid] = use.get(tid, 0) + 1
            json.dump(use, open(match.USAGE, "w"), ensure_ascii=False)
        print(f"记下了：{cat['tracks'][tid]['title']} 配{RULES['types'][m['type']]['name']} → {a.verdict}")


if __name__ == "__main__":
    main()
