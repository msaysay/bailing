"""把定稿文案对到识别出的逐字时间上，决定原片里留哪几段。

规矩和生产线一致：模型不写时间码，时间只来自识别结果；字幕文字以文案为准。
比 scripts/roughcut.py 多做一件事：同一句说了几遍时自动留最后一遍，拼接点落在句子边界上，
不用人去读逐字时间找口误。
"""
from .script import atoms

FILLERS = set("呃嗯啊额哦唉诶欸")
# 整数分值，等价的路径才会严格打平
MATCH, MISMATCH, SKIP_SCRIPT, SKIP_ASR, RUN_BONUS = 200, -100, -200, -5, 40
BREAK_INSIDE, BREAK_SOFT = -150, -20
DIGITS = dict(zip("0123456789", ["ling", "yi", "er", "san", "si", "wu", "liu", "qi", "ba", "jiu"]))
CH = 0.22   # 一个字大约念 0.22 秒，和 roughcut.py 取同一个数

try:
    from pypinyin import lazy_pinyin
except ImportError:
    lazy_pinyin = None


def sound(atom):
    """宽松的读音键：同音字、平翘舌、前后鼻音、n/l 都算对上。没装 pypinyin 就按字面比。"""
    if atom in DIGITS: return DIGITS[atom]
    if len(atom) == 1 and "\u3400" <= atom <= "\u9fff" and lazy_pinyin:
        k = lazy_pinyin(atom)[0]
        if k[:2] in ("zh", "ch", "sh"): k = k[0] + k[2:]
        if k.endswith("ng"): k = k[:-1]
        if k.startswith("l"): k = "n" + k[1:]
        return k
    return atom.lower()


def asr_tokens(asr):
    """scripts/asr.py 的输出 → 逐字（英文数字按整词）带起止时间。"""
    raw = [(t["t"].strip(), t["s"]) for t in asr["tokens"] if t["t"].strip()]
    out = []
    for i, (text, s) in enumerate(raw):
        nxt = raw[i + 1][1] if i + 1 < len(raw) else s + CH
        parts = atoms(text)
        if not parts: continue
        e = min(nxt, s + max(CH, 0.12 * len(parts))) if nxt > s else s + CH
        step = (e - s) / len(parts)
        for k, p in enumerate(parts):
            out.append({"atom": p, "key": sound(p), "start": s + step * k, "end": s + step * (k + 1)})
    return out


def align(asr_keys, script_keys, breaks=None):
    """文案里每个字对上识别结果里的第几个字（对不上是 None）。

    把两边都倒过来做两状态比对（连着对上 / 正在跳过）。连续对上有加分，所以一句话整句取自同一遍，
    不会东拼西凑；打平时优先跳过识别结果，倒过来看就是「留录音里最后说的那一遍」。
    breaks[k] 是「在文案第 k 个字前面丢掉一段录音」的代价：句首 0，字幕行首 BREAK_SOFT，行内 BREAK_INSIDE，
    所以两遍之间的拼接点落在句子边界。
    """
    a = asr_keys[::-1]
    s = script_keys[::-1]
    n, m = len(a), len(s)
    low = -10**9
    cost = (breaks or [0] * (m + 1))[::-1]
    prev_run = [low] * (m + 1)
    prev_gap = [j * SKIP_SCRIPT for j in range(m + 1)]
    run_from = [bytearray(m + 1) for _ in range(n + 1)]   # 低位：从哪个状态来；+2：这一格是真对上了
    gap_from = [bytearray(m + 1) for _ in range(n + 1)]   # 0/1：跳过一个识别字；2/3：跳过一个文案字
    for j in range(1, m + 1):
        gap_from[0][j] = 3
    for i in range(1, n + 1):
        cur_run = [low] * (m + 1)
        cur_gap = [0] * (m + 1)
        cur_gap[0] = prev_gap[0] + SKIP_ASR
        gap_from[i][0] = 1
        ai = a[i - 1]
        run_row, gap_row = run_from[i], gap_from[i]
        for j in range(1, m + 1):
            same = ai == s[j - 1]
            sub = MATCH if same else MISMATCH
            from_run = prev_run[j - 1] + sub + (RUN_BONUS if same else 0)
            from_gap = prev_gap[j - 1] + sub
            if from_gap >= from_run:
                cur_run[j] = from_gap
                run_row[j] = 1 + (2 if same else 0)
            else:
                cur_run[j] = from_run
                run_row[j] = 2 if same else 0
            best, code = prev_gap[j] + SKIP_ASR, 1
            value = prev_run[j] + SKIP_ASR + cost[j]
            if value > best:
                best, code = value, 0
            value = cur_gap[j - 1] + SKIP_SCRIPT
            if value > best:
                best, code = value, 3
            value = cur_run[j - 1] + SKIP_SCRIPT
            if value > best:
                best, code = value, 2
            cur_gap[j] = best
            gap_row[j] = code
        prev_run, prev_gap = cur_run, cur_gap
    matched = [None] * m
    i, j = n, m
    state = 1 if prev_gap[m] >= prev_run[m] else 0
    while i > 0 or j > 0:
        if state == 0:
            code = run_from[i][j]
            if code & 2:
                matched[m - j] = n - i
            state = code & 1
            i -= 1
            j -= 1
        else:
            code = gap_from[i][j]
            state = code & 1
            if code < 2:
                i -= 1
            else:
                j -= 1
    return matched


def plan(asr, units, edges=None, fps=30, pause_sentence=0.34, pause_clause=0.16, max_inner_gap=0.42):
    """返回 {units, kept, cuts, dur, problems, dropped}。时间都已换到剪后时间轴。

    edges(起点, 终点, 下限, 上限) 用声音能量把一段的头尾修到真正出声和收声的位置；不给就按字的时间加一点余量。
    """
    tokens = asr_tokens(asr)
    st = []
    for ui, u in enumerate(units):
        for a in atoms(u["text"]): st.append({"atom": a, "key": sound(a), "unit": ui})
    breaks = [0] * (len(st) + 1)
    for i in range(1, len(st)):
        l, r = st[i - 1]["unit"], st[i]["unit"]
        if l == r: breaks[i] = BREAK_INSIDE
        elif units[l].get("end") not in ("sentence", "line"): breaks[i] = BREAK_SOFT
    hits = align([t["key"] for t in tokens], [t["key"] for t in st], breaks)
    for t, h in zip(st, hits): t["asr"] = h
    kept = sorted({h for h in hits if h is not None})
    if not kept: return {"units": [], "kept": [], "cuts": [], "dur": 0.0, "dropped": [], "problems": ["文案和原片的声音完全对不上。确认文案是这条视频的。"]}
    # 夹在两个对上的字中间、数量不超过文案缺字数的识别字：是听错的字，留着；纯语气词不留
    keep = set(kept); order = [t["asr"] for t in st]
    for l, r in zip(kept, kept[1:]):
        mid = range(l + 1, r)
        if not mid: continue
        li = max(i for i, h in enumerate(order) if h == l); ri = min(i for i, h in enumerate(order) if h == r)
        if len(mid) <= max(1, ri - li - 1) and not all(tokens[k]["atom"] in FILLERS for k in mid): keep.update(mid)
    kept = sorted(keep)
    runs = [[kept[0]]]
    for l, r in zip(kept, kept[1:]):
        if r != l + 1 or tokens[r]["start"] - tokens[l]["end"] > max_inner_gap: runs.append([r])
        else: runs[-1].append(r)
    unit_of = {}
    for t in st:
        if t["asr"] is not None: unit_of[t["asr"]] = t["unit"]
    last = 0
    for k in kept: last = unit_of.get(k, last); unit_of[k] = last
    spans = []
    for ri, run in enumerate(runs):
        lo = tokens[run[0] - 1]["end"] if run[0] > 0 else 0.0
        hi = tokens[run[-1] + 1]["start"] - 0.02 if run[-1] + 1 < len(tokens) else asr["dur"]
        s, e = tokens[run[0]]["start"], tokens[run[-1]]["end"]
        if edges: s, e = edges(s, e, lo, hi)
        else: s, e = max(lo, s - 0.06), min(hi, e + 0.12)
        if ri == 0: lead = 0.2
        else:
            pu = unit_of[runs[ri - 1][-1]]; same = pu == unit_of[run[0]]
            pause = 0.06 if same else pause_sentence if units[pu].get("end") in ("sentence", "line") else pause_clause
            lead = pause * 0.4; spans[-1][1] = min(spans[-1][1] + pause * 0.6, spans[-1][3])
        spans.append([max(lo, s - lead, 0.0), e, run, hi])
    spans[-1][1] = min(spans[-1][1] + 0.45, max(spans[-1][3], spans[-1][1]))
    # 起止落到帧上：画面和声音在每个剪口丢掉的是同一段
    keptspans = []
    for s, e, run, _ in spans:
        s = int(s * fps) / fps; e = -(-int(round(e * 1000)) * fps // 1000) / fps
        if keptspans and s <= keptspans[-1][1] + 1e-6: keptspans[-1][1] = max(keptspans[-1][1], e)
        else: keptspans.append([round(s, 4), round(e, 4)])

    def rough(t):
        clock = 0.0
        for s, e in keptspans:
            if t <= e: return clock + min(max(t, s), e) - s
            clock += e - s
        return clock

    out, problems = [], []
    for ui, u in enumerate(units):
        mine = [t for t in st if t["unit"] == ui]; hit = [t["asr"] for t in mine if t["asr"] is not None]
        conf = round(len(hit) / max(1, len(mine)), 2)
        if not hit: problems.append(f"「{u['text']}」在原片里没找到，已跳过。"); continue
        s, e = tokens[min(hit)]["start"], tokens[max(hit)]["end"]; chars, lastt = [], s
        for t in mine:
            if t["asr"] is not None: lastt = tokens[t["asr"]]["start"]
            chars.append({"c": t["atom"], "t": round(rough(lastt), 3)})
        if conf < 0.6: problems.append(f"「{u['text']}」只对上 {int(conf * 100)}%，听一下这句是否说完整。")
        out.append({"text": u["text"], "end": u.get("end"), "start": round(rough(s), 3), "stop": round(rough(e), 3), "src": [round(s, 3), round(e, 3)], "chars": chars, "match": conf})
    cuts, clock = [], 0.0
    for s, e in keptspans[:-1]: clock += e - s; cuts.append(round(clock, 3))
    dropped, cur = [], []
    for i in range(len(tokens) + 1):
        if i < len(tokens) and i not in keep: cur.append(i); continue
        if len(cur) >= 2: dropped.append({"start": round(tokens[cur[0]]["start"], 2), "end": round(tokens[cur[-1]]["end"], 2), "text": "".join(tokens[k]["atom"] for k in cur)})
        cur = []
    return {"units": out, "kept": keptspans, "cuts": cuts, "dur": round(sum(e - s for s, e in keptspans), 3), "problems": problems, "dropped": dropped}
