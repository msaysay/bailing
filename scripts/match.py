#!/usr/bin/env python3
"""匹配表：读一条口播的字幕，逐句给出「这句话配什么画面、找什么素材、配乐和音效怎么走」的初稿。
规则是写死的（不调大模型、不联网），依据是几位对标博主的拆解（docs/匹配规则.md）。出来的是初稿：AI 要通读一遍，改掉不合适的，再去排版式。

  python3 scripts/match.py <期名或字幕文件> [--skeleton xiaolin] [--depth] [--out 目录]
      输入：期名（读 episodes/<期名>/03_制作过程/asr.json 和 script.txt）、asr.json（带字的时间）、或一个纯文本字幕稿（没有时间，按语速估）
      --skeleton  只推荐这个骨架允许用的组件（不写就不筛）
      --depth     人像抠得出来时加上（先跑 scripts/matte.py）：允许推荐「字在人后面」这一类效果
      输出：匹配表.md（给人看）和 匹配表.json（给程序读）
  python3 scripts/match.py rules        打印规则表"""
import argparse, json, os, re, sys

R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NUM = r"[0-9０-９零一二两三四五六七八九十百千万亿点.]+"
UNIT = r"(?:亿|万|千|百|块|元|美元|美金|人民币|倍|%|％|个点|个百分点|成|吨|公里|米|人|家|个|台|辆|套|天|年|个月|小时|分钟|秒|岁|次|单|笔|股|平|度)"
# 线索：按顺序试，一句话可以中多条；排在前面的优先决定画面
CUES = [
 ("引用", r"(?:说过|表示|宣布|回应|透露|坦言|直言|称|原话|采访里|发文|发帖)|[“「].{4,}[”」]", "谁说了什么"),
 ("对比", r"(?:相比|对比|而不是|不是.{1,12}而是|反而|却只有|远超|超过了|不如|差了|是.{1,8}的" + NUM + r"倍|一边.{1,14}一边|vs|VS|PK|以前.{1,16}现在|过去.{1,16}如今)", "两样东西放一起比"),
 ("涨跌", r"(?:涨|跌|暴涨|暴跌|腰斩|翻倍|翻了|增长|下滑|缩水|蒸发|新高|新低|飙升|跳水|回落|下降|上升)", "一个数怎么变"),
 ("占比", NUM + r"(?:%|％|成|个点|个百分点)|百分之" + NUM + r"|(?:占比|占了|占到|份额|其中|分别是|比例)", "一个整体怎么分"),
 ("排名", r"(?:第一名|排名|榜首|前三|前五|前十|销冠|冠军|全球第[一二三四五]|国内第[一二三四五]|TOP|top)", "谁排第几"),
 ("数字", r"(?:[0-9０-９]+[0-9０-９.点]*|[零一二两三四五六七八九十点]*[百千万亿]+[零一二两三四五六七八九十百千万亿]*)" + UNIT + "?|[一二两三四五六七八九十]{2,}" + UNIT, "一个要让人记住的数"),
 ("时间", r"(?:[12][0-9]{3}年|[0-9一二三四五六七八九十]+月[0-9一二三四五六七八九十]*[日号]?|去年|前年|今年|明年|上个月|上周|昨天|[0-9一二三四五六七八九十两]+年前|年代|当年|后来|直到|那一年)", "什么时候的事"),
 ("列举", r"(?:第[一二三四五]|首先|其次|再次|最后一[点个]|一是|二是|三是|[两三四五六][个点种类件大份条项招步样]|一[份个种类]是?.{0,14}另一[份个种类]|^另一[份个种类]|^一[份个]是|分别)", "一二三"),
 ("流程", r"(?:先.{1,14}再|然后|接着|下一步|第一步|步骤|流程|环节|链条|上游|下游|从.{1,10}到.{1,10}再到)", "一步步怎么走"),
 ("因果", r"(?:因为|所以|导致|于是|结果就是|原因是|背后是|靠的是|本质上?是|说白了|归根结底|换句话说|也就是说|意味着)", "为什么"),
 ("设问", r"(?:为什么|凭什么|怎么回事|到底|难道|吗[？?]?$|呢[？?]?$|[？?])", "抛一个问题"),
 ("转折", r"(?:^但是?|^然而|^可是|^不过|^其实|^没想到|^结果|^问题是|^偏偏|^直到|可问题|万万没想到|谁知道|反转)", "话锋一转"),
 ("定义", r"(?:所谓|什么是|叫做|指的是|简单说|简单来说|通俗讲|你可以理解成|相当于|就好比|打个比方)", "解释一个词"),
 ("结论", r"(?:^所以|^总之|^记住|^一句话|总结一下|最后我想说|归根到底|这就是|真正的)", "收一句"),
 ("地点", r"(?:美国|日本|韩国|欧洲|德国|法国|英国|俄罗斯|印度|越南|东南亚|中东|非洲|北京|上海|深圳|广州|杭州|成都|重庆|香港|台湾|新疆|内蒙古|广西|云南|硅谷|华尔街)", "在哪儿"),
 ("人物", r"(?:马斯克|黄仁勋|特朗普|拜登|巴菲特|雷军|马云|马化腾|任正非|张一鸣|王健林|贾跃亭|董明珠|哈维|库克|奥特曼|扎克伯格|贝索斯|比尔盖茨|李嘉诚|曹德旺|俞敏洪|罗永浩)", "讲到一个人"),
 ("公司", r"(?:公司|集团|品牌|苹果|华为|小米|特斯拉|英伟达|腾讯|阿里|字节|比亚迪|茅台|OpenAI|谷歌|微软|亚马逊)", "讲到一家公司"),
]
# 线索 → 画面。each：做法、优先级里的组件组（配合骨架白名单筛）、点名的组件、素材搜什么档、音效
PIC = {
 "引用": dict(way="引语卡或截图：原话上屏，写清是谁、哪天说的", groups=["内容与引用", "口播叠加"], names=["引语卡", "引用卡", "被打断的气泡"], footage="当事人说这句话的原视频或发帖截图（第 4 档：官方账号、新闻机构）", sfx="tick", depth=None),
 "对比": dict(way="两样东西左右摆开，数字大的那边亮", groups=["对比", "数据图表", "数字"], names=["左右对比", "两柱对比", "双条对比", "前后哑铃图", "天平", "比分牌"], footage="两边各一张图（产品图、门店图），没有就只用组件", sfx="whoosh", depth=None),
 "占比": dict(way="一个整体切开：环形、构成条、格子", groups=["数字", "数据图表"], names=["环形占比", "构成条", "格子占比", "构成树图", "总数拆分"], footage="不用找素材，用组件画", sfx="tick", depth="BehindNumber"),
 "涨跌": dict(way="走势线或前后两个数；跌用红，涨按骨架强调色", groups=["数据图表", "市场", "数字"], names=["折线图", "走势图面板", "跌幅尺", "斜率图", "冲破图表"], footage="行情截图要标来源和日期；没有真实序列就只放前后两个数", sfx="whoosh", depth="BehindTrend"),
 "排名": dict(way="排行榜，讲到的那一行高亮", groups=["数据图表", "组织与人"], names=["排名赛跑", "排名格", "表格高亮", "横向条形"], footage="榜单原图截图（标来源），或用组件重画", sfx="tick", depth=None),
 "数字": dict(way="这句话里最重的那个数放大：胸口大数或身后大数字，其余的数不上屏", groups=["数字", "口播叠加"], names=["胸口大数", "大数字", "滚轮数字", "统计卡"], footage="不用找素材", sfx="thud", depth="BehindNumber"),
 "时间": dict(way="年份牌或时间线；连着讲几个年份就用一条线串起来", groups=["时间", "关系与流程"], names=["年份拨盘", "里程碑线", "翻牌年份", "竖向时间线", "日历翻页"], footage="那一年的旧照片、旧新闻画面（第 3、4 档）", sfx="tick", depth="BehindWord"),
 "列举": dict(way="清单一条条出，讲到哪条亮哪条；全片的主面板优先用这个", groups=["口播叠加", "文字与强调", "对比"], names=["步骤清单", "编号要点", "清单", "选项气泡"], footage="不用找素材", sfx="tick", depth="SideTags"),
 "流程": dict(way="几个节点连成一条线，讲到哪步亮到哪步", groups=["关系与流程", "流程与政策"], names=["步骤流", "层级链路", "因果链", "资金流向", "流向图", "光束连线"], footage="每个环节一张现场图（工厂、仓库、门店），没有就只用组件", sfx="whoosh", depth=None),
 "因果": dict(way="人全屏，胸口一行关键词；连着三句都是讲理就切一次景别", groups=["口播叠加", "文字与强调"], names=["关键词光球", "虚字", "荧光笔", "因果链"], footage="不用找素材，这是讲道理的地方，画面要静", sfx=None, depth="BehindWord"),
 "设问": dict(way="问题本身变大字，停半秒再往下讲", groups=["文字与强调", "口播叠加"], names=["提问卡", "选择题", "砸字"], footage="不用找素材", sfx="thud", depth="SymbolBurst"),
 "转折": dict(way="切景别（推近）或换版式；配乐在这里断一下或换一段", groups=["口播叠加"], names=["划掉改写", "句子自改", "误区翻面"], footage="不用找素材", sfx="whoosh", depth="BgSwap"),
 "定义": dict(way="词条卡：这个词 + 一句大白话解释", groups=["文字与强调", "内容与引用"], names=["词条卡", "公式", "胶囊放大"], footage="能拍到实物的给一张实物图", sfx="tick", depth="BehindWord"),
 "结论": dict(way="全片最重的一句：人全屏推近，背景压暗，字最大；配乐压低", groups=["内容与引用", "文字与强调"], names=["强调字幕", "砸字", "盖章"], footage="不用找素材", sfx="thud", depth="Spot"),
 "地点": dict(way="地图上点出来，或者给一张当地的画面", groups=["视频与图片", "关系与流程"], names=["缓推图片", "路线图", "视频卡"], footage="当地实拍、航拍（第 3 档素材库优先；新闻画面第 4 档）", sfx="whoosh", depth=None),
 "人物": dict(way="第一次提到这个人：给照片加名牌；之后再提不用重复", groups=["组织与人", "视频与图片"], names=["名牌", "定格标注", "照片堆", "像素块显影"], footage="本人公开场合的照片或视频（第 4 档：官方账号、发布会、新闻机构）", sfx="whoosh", depth="Halo"),
 "公司": dict(way="第一次提到：给标志或产品画面；连着讲几家就排成一排", groups=["视频与图片", "组织与人"], names=["视频卡", "多格拼贴", "图片墙"], footage="官网、发布会、门店画面（第 4 档）；标志用官方的，不要自己画", sfx=None, depth="PopCards"),
}
ORDER = [c[0] for c in CUES]
# 配乐情绪：看这一段里哪类线索多
MOOD = [("drive", {"数字", "涨跌", "排名", "占比", "对比"}, "有推进感"), ("calm", {"因果", "定义", "时间"}, "安静沉着"), ("warm", {"结论", "引用", "人物"}, "温暖"), ("light", {"列举", "流程", "公司", "地点"}, "轻快明亮")]
TENSE = r"(?:危机|崩盘|暴雷|破产|裁员|亏损|腰斩|诈骗|被查|跑路|惨|血亏|失业|负债|烂尾|制裁|封杀)"


def load(src):
    """→ [(字, 开始秒)]，总长，有没有真实时间"""
    ep = os.path.join(R, "episodes", src)
    if os.path.isdir(ep):
        for n in ("03_制作过程/asr.json", "asr.json"):
            f = os.path.join(ep, n)
            if os.path.exists(f): src = f; break
        else: sys.exit("这一期还没有转写结果（先跑粗剪那一步）：" + ep)
    if src.endswith(".json"):
        d = json.load(open(src, encoding="utf8")); tk = d.get("tokens") or [{"t": w.get("t") or w.get("w"), "s": w.get("s")} for w in d.get("words", [])]
        return [(x["t"], float(x["s"])) for x in tk if x.get("t")], float(d.get("dur") or tk[-1]["s"] + 0.3), True
    txt = "".join(l for l in open(src, encoding="utf8").read().splitlines(True) if not l.startswith("#")); out = []; t = 0.0
    for ch in txt:
        if ch in "\r": continue
        if ch in "\n，,、；;": t += 0.18; out.append(("，", t)); continue
        if ch in "。！？!?…": t += 0.38; out.append(("。" if ch not in "？?" else "？", t)); continue
        if ch.strip(): out.append((ch, t)); t += 60 / 290        # 没有时间：按每分钟 290 字估
    return out, t, False


def sentences(tk, dur, timed):
    """按停顿和标点切句。带时间的转写没有标点：停顿 ≥0.42 秒算一句，≥0.22 秒且够长也切。"""
    S = []; cur = []; P = "，。？"
    for i, (c, s) in enumerate(tk):
        nxt = tk[i + 1][1] if i + 1 < len(tk) else dur
        if c in P:
            if cur and (c != "，" or len(cur) >= 14): S.append((cur, c == "？")); cur = []
            continue
        cur.append((c, s)); gap = nxt - s
        if timed and (gap >= 0.42 or (gap >= 0.24 and len(cur) >= 12) or len(cur) >= 26): S.append((cur, False)); cur = []
    if cur: S.append((cur, False))
    out = []
    for k, (cs, q) in enumerate(S):
        a = cs[0][1]; b = S[k + 1][0][0][1] if k + 1 < len(S) else dur; text = "".join(c for c, _ in cs) + ("？" if q else "")
        out.append({"i": k + 1, "a": round(a, 2), "b": round(b, 2), "text": text, "gap": round(b - cs[-1][1], 2)})
    return out


def blocks(skel):
    if not skel: return None, []
    d = json.load(open(os.path.join(R, "styles", "skeletons.json"), encoding="utf8")); s = next((x for x in d["skeletons"] if x["id"] == skel), None)
    if not s: sys.exit("没有这个骨架：" + skel)
    own = [re.sub(r"\s+[A-Za-z0-9]+$", "", o) for o in (s.get("own") or []) if "plan.json" not in o]; return set(s["blocks"]), own


def comp_index():
    f = os.path.join(R, "styles", "components.json"); return json.load(open(f, encoding="utf8")) if os.path.exists(f) else []


def suggest(cue, ok, own, comps, last):
    """骨架专属的优先，其次是组件库里这个骨架允许的组；避开上一句刚用过的。"""
    p = PIC[cue]; c = [n for n in p["names"] if n in own]
    for n in p["names"]:
        hit = next((x for x in comps if x["name"] == n and (ok is None or x["group"] in ok)), None)
        if hit and n not in c: c.append(f"{hit['id']} {n}")
    c = [x for x in c if x != last] or c
    return c[:3]


def plan(S, dur, skel, depth):
    ok, own = blocks(skel); comps = comp_index(); last = None; since_pic = 0.0; depth_used = 0; rows = []; seen = set()
    hook_end = next((s["b"] for s in S if s["b"] >= 3.0), S[0]["b"])
    for n, s in enumerate(S):
        hits = [name for name, rx, _ in CUES if re.search(rx, s["text"])]; d = s["b"] - s["a"]; row = dict(s, cues=hits, pic=None, comps=[], footage=None, sfx=None, depth=None, note=[])
        for ent in ("人物", "公司", "地点"):                      # 同一个人、同一家公司、同一个地方只在第一次提到时配画面
            if ent in hits:
                m = re.search(next(rx for nm, rx, _ in CUES if nm == ent), s["text"]).group(0)
                if (ent, m) in seen or (ent == "公司" and m in ("公司", "集团", "品牌")): hits.remove(ent)
                else: seen.add((ent, m))
        row["cues"] = hits; main = next((h for h in ORDER if h in hits), None)
        if s["a"] < hook_end: row["note"].append("开头钩子：人全屏，字最大，先不上配乐")
        # 太碎的句子不单独配画面；连着没画面太久就算线索弱也要动一下
        if main and (d >= 1.2 or main in ("数字", "设问", "结论")) and not (rows and rows[-1]["pic"] and rows[-1]["cues"][:1] == [main] and main in ("因果", "公司", "地点")):
            p = PIC[main]; row["pic"] = p["way"]; row["comps"] = suggest(main, ok, own, comps, last); last = row["comps"][0] if row["comps"] else last; row["footage"] = None if p["footage"].startswith("不用") or (main == "时间" and not re.search(r"[12][0-9]{3}年|年前|年代|当年|那一年", s["text"])) else p["footage"]; row["sfx"] = p["sfx"]
            if depth and p["depth"] and depth_used < max(2, int(dur / 25)) and (not rows or not rows[-1]["depth"]): row["depth"] = p["depth"]; depth_used += 1
            since_pic = 0
        else:
            since_pic += d
            if since_pic >= 8: row["pic"] = "连着 8 秒没动了：切一次景别（推近 1.12 倍）或给一行胸口关键词"; row["note"].append("节奏"); since_pic = 0
        if "转折" in hits: row["note"].append("配乐在这里断半拍或换段")
        if s["gap"] >= 0.9 and s["b"] < dur - 1: row["note"].append(f"句后停了 {s['gap']} 秒：配乐在这里抬一下再压回去")
        rows.append(row)
    return rows, hook_end


def music(rows, dur, hook_end):
    """按「转折」和长停顿分段；每段看线索定情绪；全片最多 3 段，免得太碎。"""
    cuts = [hook_end] + [r["a"] for r in rows if "转折" in r["cues"] and r["a"] > hook_end + 12]; segs = []; keep = [cuts[0]]
    for c in cuts[1:]:
        if c - keep[-1] >= max(18, dur / 4) and dur - c >= 12: keep.append(c)
    keep = keep[:3] + [dur]
    for a, b in zip(keep, keep[1:]):
        rs = [r for r in rows if a <= r["a"] < b]; cnt = {}
        for r in rs:
            for c in r["cues"]: cnt[c] = cnt.get(c, 0) + 1
        tense = sum(1 for r in rs if re.search(TENSE, r["text"])); best = max(MOOD, key=lambda m: sum(cnt.get(c, 0) for c in m[1]))
        mood, why = (("calm", "这段在讲出事、出问题，用安静沉着的，别用轻快的") if tense >= 2 else (best[0], "这段" + "、".join(sorted(best[1] & set(cnt), key=lambda c: -cnt[c])[:3]) + "多，用" + best[2] + "的") if best[1] & set(cnt) else ("light", "这段没有明显的倾向，用轻快明亮的垫着"))
        segs.append({"a": round(a, 2), "b": round(b, 2), "mood": mood, "why": why})
    duck = [{"a": r["a"], "b": r["b"], "db": -8, "why": "结论句，配乐再压低"} for r in rows if "结论" in r["cues"]][:3]
    return {"enter": round(hook_end, 2), "level_db": -24, "fade_out": 1.5, "segments": segs, "duck": duck, "rules": ["钩子说完再进配乐", "人声下面 -24 dB，听得见但不抢话", "结论句再压 8 dB", "换段的地方对在句子之间的停顿上，不要切在字中间", "结尾最后一个字之后留 1.5 秒收掉"]}


def tracks(mood):
    f = os.path.join(R, "music", "library.json")
    if not os.path.exists(f): return []
    return [t["title"] + ("（要署名）" if t.get("credit") else "") for t in json.load(open(f, encoding="utf8"))["tracks"] if t["mood"] == mood][:3]


def write(rows, mus, dur, timed, out, skel, depth):
    os.makedirs(out, exist_ok=True); n = len(rows); pics = [r for r in rows if r["pic"]]; foot = [r for r in rows if r["footage"]]
    json.dump({"dur": round(dur, 2), "timed": timed, "skeleton": skel, "rows": rows, "music": mus}, open(os.path.join(out, "匹配表.json"), "w", encoding="utf8"), ensure_ascii=False, indent=1)
    L = [f"# 匹配表（初稿）", "", f"全片 {dur:.0f} 秒，{n} 句；{len(pics)} 句配了画面，平均每 {dur / max(1, len(pics)):.1f} 秒一次；要找素材的 {len(foot)} 处。" + ("" if timed else "**没有真实时间，秒数是按语速估的。**"), "",
         "这是按固定规则出的初稿。你要做的：通读一遍，删掉牵强的；同一种组件不要连着用；全片挑一块主面板反复回来；素材先用没风险的（技能 footage-guide）。", "",
         "| 时间 | 口播 | 线索 | 画面 | 可用组件 | 找什么素材 | 声音 |", "|---|---|---|---|---|---|---|"]
    for r in rows:
        snd = "、".join(([{"tick": "轻点一声", "thud": "一记重音", "whoosh": "一声划过"}[r["sfx"]]] if r["sfx"] else []) + r["note"])
        L.append(f"| {r['a']:.1f}–{r['b']:.1f} | {r['text']} | {'、'.join(r['cues']) or '—'} | {(r['pic'] or '人全屏') + ('；**人后面：' + r['depth'] + '**' if r['depth'] else '')} | {'；'.join(r['comps']) or '—'} | {r['footage'] or '—'} | {snd or '—'} |")
    L += ["", "## 配乐", "", f"- {mus['enter']:.1f} 秒进（钩子说完之后），人声下面 {mus['level_db']} dB；结尾留 {mus['fade_out']} 秒收掉。"]
    for s in mus["segments"]: L.append(f"- {s['a']:.0f}–{s['b']:.0f} 秒：**{s['mood']}**。{s['why']}。库里可选：{'、'.join(tracks(s['mood'])) or '（没装配乐库）'}")
    for d in mus["duck"]: L.append(f"- {d['a']:.1f}–{d['b']:.1f} 秒再压 {abs(d['db'])} dB：{d['why']}。")
    L += ["", "## 要找的素材（按出现顺序）", ""] + ([f"{k + 1}. {r['a']:.1f} 秒「{r['text'][:18]}」：{r['footage']}" for k, r in enumerate(foot)] or ["没有。这条片子用组件就够了。"])
    open(os.path.join(out, "匹配表.md"), "w", encoding="utf8").write("\n".join(L) + "\n"); print(os.path.join(out, "匹配表.md")); print(L[2])


def main():
    if len(sys.argv) > 1 and sys.argv[1] == "rules":
        for name, _, what in CUES: p = PIC[name]; print(f"【{name}】{what}\n  画面：{p['way']}\n  组件：{'、'.join(p['names'])}\n  素材：{p['footage']}\n  声音：{ {'tick': '轻点一声', 'thud': '一记重音', 'whoosh': '一声划过', None: '不加'}[p['sfx']] }" + (f"\n  人后面：{p['depth']}" if p["depth"] else ""))
        return
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter); ap.add_argument("src"); ap.add_argument("--skeleton"); ap.add_argument("--depth", action="store_true"); ap.add_argument("--out")
    a = ap.parse_args(); tk, dur, timed = load(a.src); S = sentences(tk, dur, timed)
    if not S: sys.exit("没读到字幕")
    rows, hook_end = plan(S, dur, a.skeleton, a.depth); mus = music(rows, dur, hook_end); ep = os.path.join(R, "episodes", a.src)
    write(rows, mus, dur, timed, a.out or (os.path.join(ep, "03_制作过程") if os.path.isdir(ep) else os.path.dirname(os.path.abspath(a.src))), a.skeleton, a.depth)


if __name__ == "__main__":
    main()
