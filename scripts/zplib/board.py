"""分镜表（分镜.json）→ 模板要的数据（props）。

分镜表里不写秒数：每一项用「第几行字幕」或「字幕里的某个词」定位，时间从 timing.json 取。
这里做三件事：把定位换成时间、给没写的项补默认值、查出写错的地方并一次报全。
"""
import os

SCENE_TYPES = ("illustration", "broll", "paper", "card")
OVERLAY_TYPES = ("hook", "question", "float", "scatter", "flow", "label", "bullets", "bigword", "ask", "alert")
MOTIONS = ("zoom-in", "zoom-out", "pan-up", "pan-down", "pan-left", "pan-right", "still")
HIDES = {"hook", "question", "float", "scatter", "flow", "label", "bullets", "bigword", "ask"}   # 这些花字出现时，对应的底部字幕不再显示
LINGERS = {"hook", "label", "scatter"}                                                          # 这些出现时，上一行字幕留在原位变暗
IMAGE = (".png", ".jpg", ".jpeg", ".webp"); VIDEO = (".mp4", ".mov", ".webm", ".m4v")
ZOOMS = [1.0, 1.13, 1.05, 1.18]


class Resolver:
    def __init__(self, timing):
        self.lines = timing["lines"]; self.total = timing["total"]; self.errors = []

    def show_end(self, n):
        l = self.lines[n - 1]; nxt = self.lines[n]["start"] if n < len(self.lines) else self.total
        return nxt if nxt - l["end"] < 0.5 else l["end"] + 0.25

    def find(self, ref, where, after=0.0):
        """返回 (行号, 词在行内的位置或 None, 词)。ref：行号、"12"、"12:词"、或直接写一个词。"""
        if isinstance(ref, bool) or ref is None: self.errors.append(f"{where}：缺少定位"); return None
        if isinstance(ref, (int, float)) or (isinstance(ref, str) and ref.strip().lstrip("L").isdigit()):
            n = int(str(ref).strip().lstrip("L"))
            if not 1 <= n <= len(self.lines): self.errors.append(f"{where}：没有第 {n} 行（全片 {len(self.lines)} 行）"); return None
            return n, None, ""
        ref = str(ref).strip()
        head, _, word = ref.partition(":")
        if word and head.lstrip("L").isdigit():
            n = int(head.lstrip("L"))
            if not 1 <= n <= len(self.lines): self.errors.append(f"{where}：没有第 {n} 行"); return None
            p = self.lines[n - 1]["text"].find(word)
            if p < 0: self.errors.append(f"{where}：第 {n} 行「{self.lines[n - 1]['text']}」里没有「{word}」"); return None
            return n, p, word
        found = [l for l in self.lines if ref in l["text"]]
        if not found: self.errors.append(f"{where}：字幕里找不到「{ref}」"); return None
        later = [l for l in found if l["start"] >= after - 0.01]
        if len(found) > 1 and not after: self.errors.append(f"{where}：「{ref}」在第 {'、'.join(str(l['n']) for l in found)} 行都有，请写成「行号:词」")
        l = (later or found)[0]
        return l["n"], l["text"].find(ref), ref

    def char_time(self, n, pos):
        l = self.lines[n - 1]
        for c in l["chars"]:
            if c["i"] >= pos: return c["t"]
        return self.show_end(n)

    def start(self, ref, where, after=0.0):
        f = self.find(ref, where, after)
        if not f: return None
        n, p, _ = f
        return self.lines[n - 1]["start"] if p is None else self.char_time(n, p)

    def stop(self, ref, where, after=0.0):
        f = self.find(ref, where, after)
        if not f: return None
        n, p, w = f
        if p is None or p + len(w) >= len(self.lines[n - 1]["text"]): return self.show_end(n)
        return self.char_time(n, p + len(w))

    def span(self, item, where):
        s = self.start(item.get("from"), where + " 的 from")
        e = self.stop(item.get("to", item.get("from")), where + " 的 to", after=s or 0.0)
        if s is not None and e is not None and e <= s + 0.05: self.errors.append(f"{where}：结束不晚于开始（from={item.get('from')} to={item.get('to')}）"); return None
        return (s, e) if s is not None and e is not None else None

    def lines_in(self, s, e):
        return [l for l in self.lines if l["start"] >= s - 0.03 and l["start"] < e - 0.03]

    def word_time(self, word, s, e, fallback):
        """word 在 [s, e) 这几行字幕里被念到的时刻；找不到就用 fallback。"""
        for l in self.lines_in(s, e):
            p = l["text"].find(word)
            if p >= 0: return self.char_time(l["n"], p)
        return fallback


def kind_of(name):
    ext = os.path.splitext(name)[1].lower()
    return "image" if ext in IMAGE else "video" if ext in VIDEO else None


def build(board, timing, face, cuts, assets_dir, theme):
    """返回 (props 的内容部分, 素材清单, 错误, 提醒)。素材缺了不算错误，渲染时用占位图顶上。"""
    R = Resolver(timing); warns = []; scenes = []; overlays = []; wanted = []
    have = {f: f for f in os.listdir(assets_dir)} if os.path.isdir(assets_dir) else {}
    stems = {os.path.splitext(f)[0]: f for f in have}
    for si, sc in enumerate(board.get("scenes", [])):
        where = f"scenes[{si}]"; ty = sc.get("type")
        if ty not in SCENE_TYPES: R.errors.append(f"{where}：type 只能是 {' / '.join(SCENE_TYPES)}"); continue
        sp = R.span(sc, where)
        if not sp: continue
        s, e = sp; shots = []
        raw = sc.get("shots") or ([{"asset": sc["asset"], "prompt": sc.get("prompt", ""), "motion": sc.get("motion")}] if sc.get("asset") else [])
        if ty != "card" and not raw: R.errors.append(f"{where}：{ty} 需要 asset 或 shots")
        if ty == "card" and not sc.get("text"): sc["text"] = "".join(l["text"] for l in R.lines_in(s, e))
        starts = []
        for k, sh in enumerate(raw):
            t = R.start(sh["from"], f"{where}.shots[{k}] 的 from", after=s) if sh.get("from") is not None else s + (e - s) * k / len(raw)
            starts.append(s if k == 0 or t is None else min(max(t, s), e - 0.2))
        for k, sh in enumerate(raw):
            name = sh.get("asset") or f"{sc.get('id', 's%d' % (si + 1))}-{k + 1}.png"
            real = have.get(name) or stems.get(os.path.splitext(name)[0])
            kind = kind_of(real or name)
            if kind is None: R.errors.append(f"{where}.shots[{k}]：素材「{name}」不是图片或视频"); continue
            motion = sh.get("motion") or ("still" if kind == "video" or ty == "paper" else MOTIONS[(si + k) % 2])
            if motion not in MOTIONS: R.errors.append(f"{where}.shots[{k}]：motion 只能是 {' / '.join(MOTIONS)}"); continue
            end = starts[k + 1] if k + 1 < len(raw) else e
            shots.append({"file": real or name, "kind": kind, "start": round(starts[k], 3), "end": round(end, 3), "motion": motion, "marks": sh.get("marks") or [], "missing": real is None})
            said = "".join(l["text"] for l in R.lines_in(starts[k], end))[:40]
            wanted.append({"file": name, "found": real, "kind": kind, "scene": ty, "seconds": round(end - starts[k], 1), "said": said, "prompt": sh.get("prompt") or sc.get("prompt") or ""})
        first_story = ty == "illustration" and not any(x["type"] == "illustration" for x in scenes)   # 墨迹转场全片只用一次，留给第一个故事场景
        scenes.append({
            "id": sc.get("id") or f"s{si + 1}", "type": ty, "start": round(s, 3), "end": round(e, 3), "hold": 0,
            "transition": sc.get("transition") or ("ink" if first_story and sc.get("frame", "card") == "card" else "fade" if ty == "illustration" else "cut"),
            "out": sc.get("out") or ("blur" if ty == "illustration" else "cut"),
            "frame": sc.get("frame") or ("full" if ty == "paper" else "card"),
            "pip": sc.get("pip") or ("left" if ty == "illustration" else "none"),
            "shots": shots, "text": sc.get("text"), "personFile": None, "frameColor": sc.get("frameColor"),
        })
    scenes.sort(key=lambda x: x["start"])
    for a, b in zip(scenes, scenes[1:]):
        if b["start"] < a["end"] - 0.05: R.errors.append(f"两个场景重叠：{a['id']}（到 {a['end']}s）和 {b['id']}（从 {b['start']}s）")
        elif b["start"] - a["end"] < 0.08 and a["type"] != "card": a["hold"] = 0.9; a["out"] = "cut"; a["end"] = b["start"]
    hidden, dim = set(), {}
    for sc in scenes:
        if sc["type"] == "card": hidden.update(l["n"] for l in R.lines_in(sc["start"], sc["end"]))
    for oi, ov in enumerate(board.get("overlays", [])):
        where = f"overlays[{oi}]"; ty = ov.get("type")
        if ty not in OVERLAY_TYPES: R.errors.append(f"{where}：type 只能是 {' / '.join(OVERLAY_TYPES)}"); continue
        sp = R.span(ov, where)
        if not sp: continue
        s, e = sp; inside = R.lines_in(s, e); o = {"type": ty, "start": round(s, 3), "end": round(e, 3)}
        if ty in ("scatter", "flow", "bullets"):
            words = ov.get("items") or []
            if not words: R.errors.append(f"{where}：{ty} 需要 items（词的列表）"); continue
            o["items"] = [{"text": w, "at": round(R.word_time(w, s, e, s + (e - s) * 0.8 * k / len(words)), 3)} for k, w in enumerate(words)]
        else:
            o["text"] = ov.get("text") or "".join(l["text"] for l in inside)
            if not o["text"]: R.errors.append(f"{where}：缺 text"); continue
        if ty == "bigword" and ov.get("sub"):
            o["sub"] = ov["sub"]; o["items"] = [{"text": ov["sub"], "at": round(R.word_time(ov["sub"], s, e, s + 0.5), 3)}]
        if ov.get("side"): o["side"] = ov["side"]
        overlays.append(o)
        if ov.get("captions", "hide" if ty in HIDES else "keep") == "hide":
            hidden.update(l["n"] for l in inside)
            first = inside[0]["n"] if inside else None
            if first and first > 1 and ov.get("linger", ty in LINGERS) and (first - 1) not in hidden: dim[first - 1] = (s, e)
    captions = []
    for l in R.lines:
        if l["n"] in hidden: continue
        c = {"id": str(l["n"]), "text": l["text"], "start": l["start"], "end": round(R.show_end(l["n"]), 3)}
        if l["n"] in dim: c["dimFrom"], c["end"] = round(dim[l["n"]][0], 3), round(dim[l["n"]][1], 3)
        captions.append(c)
    # 景别：只硬切。剪口必须换；钩子推近；场景结束回来换一次；其余每隔两秒左右在行首换。
    cam = [{"start": 0.0, "zoom": 1.0, "ease": False}]
    if board.get("camera", "auto") == "auto":
        forced = {round(c, 2) for c in cuts} | {round(sc["end"], 2) for sc in scenes}
        hooks = [o["start"] for o in overlays if o["type"] == "hook"]
        level = 0
        for l in R.lines[1:]:
            t = l["start"]; cut_here = any(abs(t - c) < 0.12 for c in forced); hook = any(abs(t - h) < 0.05 for h in hooks)
            covered = any(sc["start"] - 0.05 <= t < sc["end"] - 0.05 and sc["type"] != "card" for sc in scenes)
            if covered and not cut_here: continue
            if hook: cam.append({"start": t, "zoom": 1.18, "ease": False}); level = 3; continue
            if cut_here or t - cam[-1]["start"] >= 2.2:
                level = (level + 1) % 3 if level != 3 else 0
                cam.append({"start": t, "zoom": ZOOMS[level], "ease": False})
        for c in cuts:
            if not any(abs(c - k["start"]) < 0.13 for k in cam) and not any(sc["start"] <= c < sc["end"] and sc["type"] != "card" for sc in scenes):
                warns.append(f"剪口 {c}s 落在一行字幕中间且人在全屏，会看到人跳一下。")
    elif isinstance(board.get("camera"), list):
        for k, c in enumerate(board["camera"]):
            t = R.start(c.get("from"), f"camera[{k}]")
            if t is not None: cam.append({"start": t, "zoom": float(c.get("zoom", 1)), "ease": bool(c.get("ease", False))})
        cam.sort(key=lambda c: c["start"])
    covered = sum(sc["end"] - sc["start"] for sc in scenes if sc["type"] in ("illustration", "broll") and sc["pip"] == "none")
    if covered / max(1, R.total) > 0.25: warns.append(f"人完全不在画面里的时间占 {covered / R.total:.0%}，对标片约 10%。给插画场景留头像（pip）。")
    longest = max([sc["end"] - sc["start"] for sc in scenes if sc["type"] == "illustration"] + [0])
    if longest > 12: warns.append(f"有一个插画场景长 {longest:.0f} 秒；对标片最长约 9 秒，且每 2–3 秒换一张图。")
    for sc in scenes:
        if sc["type"] == "illustration":
            for sh in sc["shots"]:
                if sh["end"] - sh["start"] > 4.5: warns.append(f"{sc['id']} 里「{sh['file']}」一张图停了 {sh['end'] - sh['start']:.1f} 秒，超过 4 秒会显得静。再配一张或换成视频。")
    # 音效：很轻，只垫在转场和花字落下的那一下。分镜表里写 "sfx": false 可以整片关掉。
    sfx = []
    if board.get("sfx", True):
        for sc in scenes:
            if sc["type"] == "card": sfx.append({"at": sc["start"], "file": "thud.wav", "volume": 0.3})
            elif sc["transition"] != "cut": sfx.append({"at": max(0, sc["start"] - 0.05), "file": "whoosh.wav", "volume": 0.3})
            if sc["out"] == "blur": sfx.append({"at": max(0, sc["end"] - 0.08), "file": "whoosh.wav", "volume": 0.2})
        for o in overlays:
            if o["type"] in ("hook", "bigword"): sfx.append({"at": o["start"], "file": "thud.wav", "volume": 0.4})
            elif o["type"] in ("label", "question"): sfx.append({"at": o["start"], "file": "whoosh.wav", "volume": 0.16})
            elif o["type"] in ("scatter", "bullets", "flow"): sfx += [{"at": it["at"], "file": "tick.wav", "volume": 0.45} for it in o["items"]]
            elif o["type"] in ("float", "ask"): sfx.append({"at": o["start"], "file": "tick.wav", "volume": 0.45})
        sfx.sort(key=lambda x: x["at"])
    props = {"sfx": sfx, "captions": captions, "camera": cam, "scenes": scenes, "overlays": overlays, "face": {k: face[k] for k in "xywh"}, "theme": theme, "title": board.get("title", "")}
    return props, wanted, R.errors, warns
