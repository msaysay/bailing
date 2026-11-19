#!/usr/bin/env python3
"""对齐算法的自测：不需要视频和模型。用法：python3 scripts/zplib/selftest.py"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from zplib.align import plan
from zplib.script import split_script

def speak(text, t=0.0, step=0.2):
    """把一段话变成识别结果的样子；「/」表示停顿 1 秒。"""
    toks = []
    for ch in text:
        if ch == "/": t += 1.0; continue
        toks.append({"t": ch, "s": round(t, 2)}); t += step
    return {"dur": t + 0.5, "tokens": toks}

SCRIPT = "为什么一群女生在一起\n生理期会传染\n如果假设是在原始的部落\n这个可能更容易理解\n"
units = split_script(SCRIPT)
kept_text = lambda asr, res: "".join(t["t"] for t in asr["tokens"] if any(s - 0.01 <= t["s"] < e for s, e in res["kept"]))

# 1 一条到底：不剪
a = speak("为什么一群女生在一起生理期会传染如果假设是在原始的部落这个可能更容易理解"); r = plan(a, units)
assert len(r["kept"]) == 1 and not r["dropped"] and len(r["units"]) == 4, r

# 2 整句重说：留最后一遍，拼接点在句子边界
a = speak("为什么一群女生在一起生理期会传染/如果假设是在原始的/如果假设是在原始的部落这个可能更容易理解"); r = plan(a, units)
assert kept_text(a, r) == "为什么一群女生在一起生理期会传染如果假设是在原始的部落这个可能更容易理解", kept_text(a, r)
assert r["dropped"][0]["text"] == "如果假设是在原始的", r["dropped"]

# 3 从中间一句起整段重来：前面留第一遍，后面留第二遍
a = speak("为什么一群女生在一起生理期会传染如果假设是在原始的部落这个可能/生理期会传染如果假设是在原始的部落这个可能更容易理解"); r = plan(a, units)
assert kept_text(a, r) == "为什么一群女生在一起生理期会传染如果假设是在原始的部落这个可能更容易理解", kept_text(a, r)
assert len(r["kept"]) == 2, r["kept"]

# 4 同音错字照样对上；语气词和题外话剪掉
a = speak("为什么一群女生在一起呃呃生理期会传然如果假设是在原始的部落对吧我想想这个可能更容易理解"); r = plan(a, units)
assert all(u["match"] >= 0.8 for u in r["units"]), [u["match"] for u in r["units"]]
assert "对吧我想想" in "".join(d["text"] for d in r["dropped"]), r["dropped"]

# 5 文案里有、原片里没说的句子：报出来，不硬凑
r = plan(speak("为什么一群女生在一起生理期会传染"), units)
assert len(r["units"]) == 2 and len(r["problems"]) == 2, r["problems"]

# 6 长停顿收紧
a = speak("为什么一群女生在一起//生理期会传染"); r = plan(a, units[:2])
assert r["dur"] < a["dur"] - 1.2 and len(r["cuts"]) == 1, r
print("对齐自测 6 项全部通过")
