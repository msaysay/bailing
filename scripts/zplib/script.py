"""文案 → 字幕行。最好一行就是一句字幕；超过 13 个字的行按句读和字数自动再拆。"""

import re

MAX_CHARS = 13
SENTENCE_END = "。！？!?…"
CLAUSE_END = "，、；：,;:—"
PUNCT = SENTENCE_END + CLAUSE_END + "“”\"'‘’（）()《》〈〉【】[]「」『』·~～ \t"
NO_BREAK_BEFORE = set("的了着过吗呢吧啊呀嘛们么地得里上下中后时儿子")
_CJK = re.compile(r"[㐀-鿿]")
_ALNUM = re.compile(r"[A-Za-z0-9%.+\-]+")


def strip_punct(text: str) -> str:
    return "".join(ch for ch in text if ch not in PUNCT).strip()


def atoms(text: str) -> list[str]:
    """比对和计时的最小单位：一个汉字，或一串连着的英文数字。"""
    found: list[str] = []
    index = 0
    while index < len(text):
        ch = text[index]
        if _CJK.match(ch):
            found.append(ch)
            index += 1
            continue
        run = _ALNUM.match(text, index)
        if run:
            found.append(run.group(0))
            index = run.end()
            continue
        index += 1
    return found


def _balanced(piece: str) -> list[str]:
    parts = atoms(piece)
    if len(parts) <= MAX_CHARS:
        return [piece]
    count = -(-len(parts) // MAX_CHARS)
    target = len(parts) / count
    out: list[str] = []
    start = 0
    for part_index in range(1, count):
        ideal = round(part_index * target)
        best = ideal
        for delta in (0, 1, -1, 2, -2):
            cut = ideal + delta
            if start + 2 <= cut <= len(parts) - 2 and parts[cut] not in NO_BREAK_BEFORE:
                best = cut
                break
        out.append("".join(parts[start:best]))
        start = best
    out.append("".join(parts[start:]))
    return out


def split_script(text: str) -> list[dict]:
    """返回 [{text, end}]。end 是这一行后面的停顿类型：sentence 句末、clause 逗号、line 换行、wrap 超长硬拆。"""
    units: list[dict] = []
    for raw in text.replace("\r", "").split("\n"):
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        pieces: list[tuple[str, str]] = []
        buffer = ""
        for ch in line:
            if ch in SENTENCE_END or ch in CLAUSE_END or ch == "|":
                if strip_punct(buffer):
                    pieces.append((buffer, "sentence" if ch in SENTENCE_END else "clause"))
                buffer = ""
            else:
                buffer += ch
        if strip_punct(buffer):
            pieces.append((buffer, "line"))
        # 同一行里太短的相邻小句并回去，免得出现两个字的字幕
        merged: list[tuple[str, str]] = []
        for piece, end in pieces:
            clean = strip_punct(piece)
            if merged and merged[-1][1] == "clause" and len(atoms(merged[-1][0])) + len(atoms(clean)) <= 8:
                merged[-1] = (merged[-1][0] + clean, end)
            else:
                merged.append((clean, end))
        for piece, end in merged:
            chunks = _balanced(piece)
            for chunk_index, chunk in enumerate(chunks):
                units.append({"text": chunk, "end": end if chunk_index == len(chunks) - 1 else "wrap"})
    return units


def draft_from_words(words: list[dict]) -> str:
    """没有文案时：识别结果 → 一份可以改的文案草稿，一行一句字幕。words 是 [{word,start,end}]。"""
    lines: list[str] = []
    current = ""
    last_end = None
    for word in words:
        text = word["word"]
        gap = (word["start"] - last_end) if last_end is not None else 0
        if current and (gap > 0.45 or len(atoms(current)) >= MAX_CHARS):
            lines.append(current)
            current = ""
        current += text
        last_end = word["end"]
        if text and text[-1] in SENTENCE_END + CLAUSE_END:
            lines.append(current)
            current = ""
    if current:
        lines.append(current)
    return "\n".join(strip_punct(line) for line in lines if strip_punct(line)) + "\n"
