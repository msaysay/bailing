"""Build the ASS overlay (subtitles, keyword emphasis, titles, person card, slogan).

Every text is drawn twice: a blurred black copy offset to the lower-right
(the 剪映 shadow: 83% / blur 6% / distance 5 / -45deg) and a crisp white copy.
No outline anywhere -- that is a hard rule of the SOP.
"""
import os, re
from common import STYLE as ST, SIZES, FONTS, W, H, FPS, timeline


def _ts(frame):
    cs = round(frame * 100 / FPS)
    return "%d:%02d:%02d.%02d" % (cs // 360000, cs // 6000 % 60, cs // 100 % 60, cs % 100)


def title_font():
    for f in sorted(os.listdir(FONTS)) if os.path.isdir(FONTS) else []:
        if f.lower().startswith("title."):
            try:
                from PIL import ImageFont
                return ImageFont.truetype(os.path.join(FONTS, f), 20).getname()[0]
            except Exception:
                pass
    return ST["title_font"]


def mark_keywords(text, kws, base, big):
    """Return ASS text with keywords enlarged; baseline is shared automatically."""
    if not kws:
        return text
    pat = "|".join(re.escape(k) for k in sorted(kws, key=len, reverse=True) if k)
    out, pos = "", 0
    for m in re.finditer(pat, text):
        out += text[pos:m.start()] + "{\\fs%d}%s{\\fs%d}" % (big, m.group(0), base)
        pos = m.end()
    return out + text[pos:]


class Ass:
    def __init__(self):
        self.ev = []

    def add(self, f0, f1, style, text, x, y, an=2, fade=0, layer=1):
        if f1 <= f0:
            return
        fad = "\\fad(%d,%d)" % (fade, fade) if fade else ""
        sh = "{\\an%d\\pos(%d,%d)\\blur%d\\1c&H000000&\\1a&H%02X&%s}" % (
            an, x + ST["shadow_dx"], y + ST["shadow_dy"], ST["shadow_blur"], ST["shadow_alpha"], fad)
        fg = "{\\an%d\\pos(%d,%d)%s}" % (an, x, y, fad)
        for lay, pre in ((layer, sh), (layer + 1, fg)):
            self.ev.append("Dialogue: %d,%s,%s,%s,,0,0,0,,%s%s" % (lay, _ts(f0), _ts(f1), style, pre, text))

    def box(self, f0, f1, x, y, w, h, colour="A0E9FF", fade=0):
        """Filled rectangle (the pale-yellow bar of the person card). colour is BGR hex."""
        fad = "\\fad(%d,%d)" % (fade, fade) if fade else ""
        self.ev.append("Dialogue: 1,%s,%s,Sub,,0,0,0,,{\\an7\\pos(%d,%d)\\1c&H%s&\\p1%s}m 0 0 l %d 0 %d %d 0 %d{\\p0}"
                       % (_ts(f0), _ts(f1), x, y, colour, fad, w, w, h, h))

    def dump(self):
        tf = title_font()
        head = """[Script Info]
ScriptType: v4.00+
PlayResX: %d
PlayResY: %d
WrapStyle: 2
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Sub,%s,%d,&H00FFFFFF,&H00FFFFFF,&H00000000,&H00000000,-1,0,0,0,100,100,0,0,1,0,0,2,0,0,0,1
Style: Title,%s,%d,&H00FFFFFF,&H00FFFFFF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,0,0,1,0,0,0,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
""" % (W, H, ST["sub_font"], ST["sub_fs"], tf, SIZES["l"])
        return head + "\n".join(self.ev) + "\n"


def auto_size(lines):
    """Reference film: 4 chars -> 290, 6 chars -> 210, stacked lines -> 140."""
    n = max(len(l["text"]) for l in lines)
    if len(lines) == 1:
        return max(SIZES["s"], min(SIZES["xl"], int(1270 / max(n, 1))))
    return SIZES["s"]


def build(plan):
    cf, body, endf = timeline(plan)
    a = Ass()
    cues = plan["cues"]

    # ---- titles (小标题). May replace the subtitle of the cues they cover. ----
    hidden = set()
    for t in plan.get("titles", []):
        c0, c1 = t["cues"]
        f0, f1 = cf[c0][0], cf[c1][1] + round(float(t.get("hold", 0)) * FPS)
        f1 = min(f1, body)
        if t.get("replace_sub", t.get("pos", "lower") == "lower"):
            hidden.update(range(c0, c1 + 1))
        lines = t["lines"]
        base = auto_size(lines)
        pos = t.get("pos", "lower")
        if pos == "vertical":           # 竖排, beside the speaker
            x = int(t.get("x", 120)); y = int(t.get("y", 420))
            fs = SIZES.get(t.get("size"), 120)
            txt = "\\N".join(lines[0]["text"])
            a.add(f0, f1, "Title", "{\\fs%d}%s" % (fs, txt), x, y, an=7, fade=ST["title_fade"])
            continue
        x = int(t.get("x", ST["title_x"] if pos == "lower" else 110))
        ly = ST["title_lower_y"]
        y = int(t.get("y", ly.get(len(lines), ly[3]) if pos == "lower" else ST["title_top_y"]))
        prev = None
        for ln in lines:
            fs = SIZES.get(ln.get("size"), base) if not isinstance(ln.get("size"), int) else ln["size"]
            if prev is not None:
                y += fs                          # line pitch = size of the line being added
            prev = fs
            lf0 = cf[ln["at_cue"]][0] if "at_cue" in ln else f0
            a.add(max(lf0, f0), f1, "Title", "{\\fs%d}%s" % (fs, ln["text"]),
                  x + int(ln.get("indent", 0)), y, an=1, fade=ST["title_fade"])

    # ---- regular subtitles: one cue = one line, hard cut, no animation ----
    for i, c in enumerate(cues):
        if i in hidden or c.get("sub") is False or not c.get("text"):
            continue
        txt = mark_keywords(c["text"], c.get("kw"), ST["sub_fs"], ST["kw_fs"])
        a.add(cf[i][0], cf[i][1], "Sub", txt, W // 2, ST["sub_y"], an=2)

    # ---- person card (人物介绍): right side, name 19 / intro 10 at 61%, fade ----
    p = plan.get("person")
    if p:
        f0 = cf[p["cue"]][0]
        f1 = min(body, f0 + round(float(p.get("dur", 4)) * FPS))
        x, y = int(p.get("x", 985)), int(p.get("y", 1130))
        a.add(f0, f1, "Sub", "{\\b0\\fs58}%s" % p["name"], x, y, an=3, fade=300)
        yy = y
        for ln in str(p["intro"]).split("\n"):
            yy += 44
            a.add(f0, f1, "Sub", "{\\b0\\fs31}%s" % ln, x, yy, an=3, fade=300)
        a.box(f0, f1, x + 14, y - 58, 9, yy - y + 62, fade=300)

    # ---- ending slogan (片尾): 天图通逊 / 为客户竭尽全力 ----
    e = plan.get("ending")
    if e and e.get("slogan", True):
        s1, s2, s3 = (plan.get("brand", {}).get("slogan") or ["天图通逊", "为客户", "竭尽全力"])
        f0, f1 = body + round(0.4 * FPS), body + endf
        b1, b2, b3 = ST["end_fs"]
        x = int(e.get("x", ST["end_x"]))
        dy = int(e.get("y", ST["end_y1"])) - ST["end_y1"]
        a.add(f0, f1, "Title", "{\\fs%d}%s" % (b1, s1), x, ST["end_y1"] + dy, an=1, fade=400)
        a.add(f0, f1, "Title", "{\\fs%d}%s{\\fs%d}%s" % (b2, s2, b3, s3), x, ST["end_y2"] + dy, an=1, fade=400)
    return a.dump()
