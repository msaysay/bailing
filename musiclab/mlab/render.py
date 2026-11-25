"""把方案做成能听的东西：配乐轨 bed.wav（已对齐、已调好音量，可直接交给剪辑流程）、
混好的成品（有画面就出 mp4），以及一页并排试听的 audition.html。"""
import html, json, os, subprocess
import numpy as np
import soundfile as sf
from . import audio, library

SR = 44100
XF = 0.06


def _ff(*a):
    subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", *a], check=True)


def bed(track, arr, gain_db, ref_lufs, T, speech):
    """按方案把曲子拼出来并套上音量曲线。返回立体声数组。"""
    path = library.path_of(track)
    af = "highpass=f=50" + (",equalizer=f=2200:t=q:w=1.0:g=-3" if speech else "")   # 给人声的清晰度频段让一点
    n = int(T * SR)
    out = np.zeros((n, 2), np.float32)
    xf = int(XF * SR)
    for k, (v0, v1, s0) in enumerate(arr["pieces"]):
        pre = XF if k else 0.0
        x = audio.decode(path, SR, 2, start=max(0, s0 - pre), dur=(v1 - v0) + pre + XF, af=af)
        i = int(v0 * SR) - (xf if k else 0)
        if k:
            x[:xf] *= np.linspace(0, 1, xf, dtype=np.float32)[:, None]
        if k < len(arr["pieces"]) - 1:
            m = int((v1 - v0 + pre) * SR)
            x = x[: m + xf]
            if len(x) > m:
                x[m:] *= np.linspace(1, 0, len(x) - m, dtype=np.float32)[:, None]
        i0 = max(0, i); x = x[i0 - i:]
        e = min(n, i0 + len(x))
        out[i0:e] += x[: e - i0]
    g = np.interp(np.arange(n) / SR, np.arange(len(gain_db)) / 100.0, gain_db)
    lin = 10 ** ((ref_lufs + g - (track["analysis"]["lufs"] or -16.0)) / 20)
    return out * lin[:, None].astype(np.float32)


def render(cat, brief, cand, prof, out_dir, name):
    from .match import envelope
    T = brief["duration"]
    track = cat["tracks"][cand["track"]] if "track" in cand else None
    mask = hop = None
    voice = None
    if brief.get("voice"):
        voice = audio.decode(brief["voice"], SR, 2)
        mask, hop = audio.speech_mask(audio.decode(brief["voice"]))
        ref = audio.lufs(brief["voice"]) or -16.0
    else:
        ref = -16.0
    if cand.get("cues"):
        return render_cues(cat, brief, cand, prof, out_dir, name, voice, mask, hop, ref)
    g, events = envelope(brief, prof, cand["arrangement"], mask, hop or 0.02)
    b = bed(track, cand["arrangement"], g, ref, T, bool(voice is not None))
    n = len(b)
    mix = b.copy()
    if voice is not None:
        m = min(n, len(voice)); mix[:m] += voice[:m]
    peak = float(np.abs(mix).max())
    if peak > 0.97:
        mix = np.tanh(mix / peak * 1.5) / np.tanh(1.5) * 0.97
    bed_wav = os.path.join(out_dir, f"{name}_bed.wav"); mix_wav = os.path.join(out_dir, f"{name}_mix.wav")
    sf.write(bed_wav, b, SR); sf.write(mix_wav, mix, SR)
    if brief.get("video"):
        final = os.path.join(out_dir, f"{name}.mp4")
        _ff("-i", brief["video"], "-i", mix_wav, "-map", "0:v:0", "-map", "1:a:0", "-c:v", "copy", "-c:a", "aac", "-b:a", "160k", "-shortest", final)
    else:
        final = os.path.join(out_dir, f"{name}.mp3")
        _ff("-i", mix_wav, "-b:a", "160k", final)
    os.remove(mix_wav)
    a = track["analysis"]
    arr = cand["arrangement"]
    beat_v = sorted(round(v0 + d - s0, 2) for v0, v1, s0 in arr["pieces"] for d in a["downbeats"] if s0 <= d < s0 + (v1 - v0))
    plan = {"track": cand["track"], "title": track["title"], "license": track["license"], "score": cand["score"], "parts": cand["parts"],
            "bpm": track.get("bpm_tag") or a["bpm"], "ref_voice_lufs": ref, "track_lufs": a["lufs"],
            "offset": arr["offset"], "pieces": arr["pieces"], "ending": arr["ending"], "hits": arr["hits"], "events": events,
            "downbeats_in_video": beat_v, "gain_db_10hz": [round(float(x), 1) for x in g[::10]],
            "files": {"bed": os.path.basename(bed_wav), "final": os.path.basename(final)}}
    json.dump(plan, open(os.path.join(out_dir, f"{name}_plan.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    return plan, (mask, hop)


def _finish(brief, b, voice, out_dir, name):
    mix = b.copy()
    if voice is not None:
        m = min(len(b), len(voice)); mix[:m] += voice[:m]
    peak = float(np.abs(mix).max())
    if peak > 0.97:
        mix = np.tanh(mix / peak * 1.5) / np.tanh(1.5) * 0.97
    bed_wav = os.path.join(out_dir, f"{name}_bed.wav"); mix_wav = os.path.join(out_dir, f"{name}_mix.wav")
    sf.write(bed_wav, b, SR); sf.write(mix_wav, mix, SR)
    if brief.get("video"):
        final = os.path.join(out_dir, f"{name}.mp4")
        _ff("-i", brief["video"], "-i", mix_wav, "-map", "0:v:0", "-map", "1:a:0", "-c:v", "copy", "-c:a", "aac", "-b:a", "160k", "-shortest", final)
    else:
        final = os.path.join(out_dir, f"{name}.mp3")
        _ff("-i", mix_wav, "-b:a", "160k", final)
    os.remove(mix_wav)
    return bed_wav, final


def render_cues(cat, brief, cand, prof, out_dir, name, voice, mask, hop, ref):
    """分段配乐：每段一首曲子，各自套上同一条随人声起伏的音量曲线，再各自开窗（进、出、留白）。"""
    from .match import envelope
    T = brief["duration"]
    cfg = prof["cues"]
    g, events = envelope(brief, prof, {"offset": 1.0, "ending": {"type": "none"}}, mask, hop or 0.02)
    t = np.arange(len(g)) / 100.0
    b = np.zeros((int(T * SR), 2), np.float32)
    total = np.full(len(g), -90.0)
    cues = []
    for k, c in enumerate(cand["cues"]):
        tr = cat["tracks"][c["track"]]
        last = k == len(cand["cues"]) - 1
        fo = prof.get("ending_fade", 2.0) if last else cfg["fade_out"]
        win = np.clip((t - c["v0"]) / 0.25, 0, 1) * np.clip((c["v1"] - t) / fo, 0, 1)
        seg_e = np.mean([x.get("energy", 0.5) for x in brief["segments"] if x["start"] < c["v1"] and x["end"] > c["v0"]] or [0.5])
        gk = g + 20 * np.log10(np.maximum(win, 1e-5)) + (seg_e - 0.5) * (prof.get("cue_level_span_db", 4) - 4)   # 各段音量拉开一点：她各段之间差得不小
        b += bed(tr, {"pieces": [[c["v0"], c["v1"], c["s0"]]]}, gk, ref, T, voice is not None)
        total = np.maximum(total, gk)
        cues.append({"from": c["v0"], "to": c["v1"], "segment": c["name"], "track": c["track"], "title": tr["title"], "track_from": c["s0"],
                     "bpm": tr.get("bpm_tag") or tr["analysis"]["bpm"], "feel": tr.get("feel"), "score": c["score"], "parts": c["parts"], "license": tr["license"]})
        events.append({"t": c["v0"], "to": c["v1"], "do": f"第 {k + 1} 段：{tr['title']}"})
    bed_wav, final = _finish(brief, b, voice, out_dir, name)
    credits = sorted({c["license"]["credit"] for c in cues if c["license"].get("credit")})
    plan = {"style": prof.get("style_name"), "score": cand["score"], "cues": cues, "credits": credits, "ref_voice_lufs": ref,
            "events": sorted(events, key=lambda e: e["t"]), "gain_db_10hz": [round(float(x), 1) for x in total[::10]],
            "pieces": [[c["from"], c["to"], c["track_from"]] for c in cues], "hits": [], "files": {"bed": os.path.basename(bed_wav), "final": os.path.basename(final)}}
    json.dump(plan, open(os.path.join(out_dir, f"{name}_plan.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    return plan, (mask, hop)


def _svg(brief, plan, mask, hop, music_energy):
    T, Wd, H = brief["duration"], 1000, 150
    x = lambda t: t / T * Wd
    p = [f'<svg viewBox="0 0 {Wd} {H}" preserveAspectRatio="none" class="tl">']
    for s in brief["segments"]:                                      # 第一行：视频分段，颜色深浅 = 想要的能量
        p.append(f'<rect x="{x(s["start"]):.1f}" y="2" width="{x(s["end"]-s["start"])-1:.1f}" height="16" fill="var(--seg)" opacity="{0.25+0.75*s.get("energy",.5):.2f}"><title>{html.escape(s.get("name") or s["role"])} 能量{s.get("energy")}</title></rect>')
    if mask is not None:                                             # 第二行：谁在说话
        for a, b in audio.runs(mask, hop, True, 0.1):
            p.append(f'<rect x="{x(a):.1f}" y="24" width="{max(.5,x(b-a)):.1f}" height="10" fill="var(--voice)"/>')
    g = np.array(plan["gain_db_10hz"]); lo, hi = -34, max(-4, float(g.max()))   # 第三行：配乐实际音量
    pts = " ".join(f"{x(i/10):.1f},{138-np.clip((v-lo)/(hi-lo),0,1)*92:.1f}" for i, v in enumerate(g))
    p.append(f'<polygon points="0,138 {pts} {Wd},138" fill="var(--music)" opacity=".35"/><polyline points="{pts}" fill="none" stroke="var(--music)" stroke-width="1.5" vector-effect="non-scaling-stroke"/>')
    me = " ".join(f"{x(i+.5):.1f},{138-v*92:.1f}" for i, v in enumerate(music_energy))
    p.append(f'<polyline points="{me}" fill="none" stroke="var(--ink2)" stroke-dasharray="3 3" stroke-width="1" vector-effect="non-scaling-stroke"/>')
    for v0, v1, s0 in plan["pieces"][1:]:
        p.append(f'<line x1="{x(v0):.1f}" x2="{x(v0):.1f}" y1="40" y2="140" stroke="var(--ink2)" stroke-width="1" vector-effect="non-scaling-stroke"/>')
    for h in plan["hits"]:
        p.append(f'<line x1="{x(h["music_boundary"]):.1f}" x2="{x(h["music_boundary"]):.1f}" y1="20" y2="140" stroke="var(--hit)" stroke-width="2" vector-effect="non-scaling-stroke"><title>音乐段落交界对上了 {h["kind"]}</title></line>')
    for m in brief.get("moments", []):
        p.append(f'<path d="M{x(m["t"]):.1f},0 l5,-0 l-5,9 l-5,-9z" transform="translate(0,140)" fill="var(--hit)"><title>{m["kind"]} {html.escape(m.get("note",""))}</title></path>')
    return "".join(p) + "</svg>"


def audition(brief, prof, results, out_dir, cat):
    kinds = {"climax": "高点", "turn": "转折", "chapter": "换章节", "segment": "换段"}
    cards = []
    for i, (plan, (mask, hop), cand) in enumerate(results, 1):
        if plan.get("cues"):
            f = plan["files"]["final"]
            media = f'<video controls preload="metadata" src="{f}"></video>' if f.endswith(".mp4") else f'<audio controls src="{f}"></audio>'
            rows = "".join(f'<tr><td>{c["from"]:.0f}–{c["to"]:.0f} 秒</td><td>{html.escape(c["segment"] or "")}</td><td><b>{html.escape(c["title"])}</b></td><td>{c["bpm"]:.0f} 拍</td><td>{"、".join(c.get("feel") or [])}</td><td>{c["score"]:.2f}</td></tr>' for c in plan["cues"])
            cr = "".join(f"<p class='credit'>署名：{html.escape(x)}</p>" for x in plan["credits"])
            cards.append(f'''<section><h2>方案 {i}　分段配乐（{html.escape(plan.get("style") or "")}式）</h2><p class="meta">{len(plan["cues"])} 段、{len(plan["cues"])} 首不同的曲子，段落之间留白</p>
<div class="row">{media}<div class="side"><table class="cues"><tr><th>时间</th><th>段落</th><th>曲子</th><th>速度</th><th>标签</th><th>分</th></tr>{rows}</table></div></div>
{_svg(brief, plan, mask, hop, [])}
<p class="legend"><i style="background:var(--seg)"></i>视频分段<i style="background:var(--voice)"></i>有人说话<i style="background:var(--music)"></i>配乐实际音量（竖线是换曲处）</p>{cr}</section>''')
            continue
        t = cat["tracks"][plan["track"]]
        f = plan["files"]["final"]
        media = f'<video controls preload="metadata" src="{f}"></video>' if f.endswith(".mp4") else f'<audio controls src="{f}"></audio>'
        pr = plan["parts"]
        hit = "、".join(f'{h["t"]:.0f}秒{kinds.get(h["kind"], h["kind"])}' for h in plan["hits"]) or "没有对上的节点"
        end = {"natural": "曲子自然结束", "button": "接上曲子自己的结尾", "fade": "淡出"}[plan["ending"]["type"]]
        ev = "".join(f'<li>{e["t"]:.1f} 秒　{e["do"]}</li>' for e in plan["events"] if e["do"] != "停顿处抬起")
        lic = "要署名" if t["license"].get("attribution") else "不用署名"
        cards.append(f'''<section><h2>方案 {i}　{html.escape(t["title"])}</h2>
<p class="meta">{plan["bpm"]:.0f} 拍/分 · {"、".join(t.get("feel") or []) or "无人工标签"} · {"、".join((t.get("instruments") or [])[:4])} · {lic}</p>
<div class="row">{media}<div class="side">
<table><tr><th>总分</th><td><b>{plan["score"]:.2f}</b></td></tr><tr><th>情绪贴合</th><td>{pr["mood"]:.2f}</td></tr><tr><th>速度</th><td>{pr["bpm"]:.2f}</td></tr><tr><th>不抢人声</th><td>{pr["speech"]:.2f}</td></tr><tr><th>结构对齐</th><td>{pr["struct"]:.2f}</td></tr></table>
<p>从曲子第 {plan["offset"]:.1f} 秒开始放；{end}。<br>对上的节点：{hit}。</p><ul>{ev}</ul></div></div>
{_svg(brief, plan, mask, hop, cand["arrangement"]["music_energy"])}
<p class="legend"><i style="background:var(--seg)"></i>视频分段（越深越想要能量）<i style="background:var(--voice)"></i>有人说话<i style="background:var(--music)"></i>配乐实际音量<i class="dash"></i>曲子本身的能量<i style="background:var(--hit)"></i>对上的节点</p>
{f'<p class="credit">署名：{html.escape(t["license"]["credit"])}</p>' if t["license"].get("credit") else ""}</section>''')
    nodes = "".join(f"<li>{html.escape(x)}</li>" for x in prof["nodes"])
    page = f'''<!doctype html><html lang="zh"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>配乐试听</title>
<style>:root{{--bg:#f6f5f1;--card:#fff;--ink:#1c1b19;--ink2:#77736a;--seg:#3b6ea5;--voice:#c98a2b;--music:#2f8f6b;--hit:#c0392b;--line:#e3e0d8}}
@media(prefers-color-scheme:dark){{:root{{--bg:#161614;--card:#201f1d;--ink:#eceae4;--ink2:#9c978c;--seg:#6c9bd1;--voice:#e0a94e;--music:#58b892;--hit:#e8695b;--line:#33312d}}}}
body{{margin:0;background:var(--bg);color:var(--ink);font:15px/1.6 system-ui,"PingFang SC","Microsoft YaHei",sans-serif}}main{{max-width:1040px;margin:auto;padding:24px 16px 60px}}
h1{{font-size:22px;margin:0 0 4px}}h2{{font-size:17px;margin:0}}section{{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:16px;margin:16px 0}}
.meta,.legend,.credit{{color:var(--ink2);font-size:13px;margin:2px 0 10px}}.row{{display:flex;gap:16px;flex-wrap:wrap}}video{{max-height:420px;max-width:100%;border-radius:6px;background:#000}}audio{{width:100%}}
.side{{flex:1;min-width:240px}}table{{border-collapse:collapse}}th{{text-align:left;font-weight:400;color:var(--ink2);padding:1px 14px 1px 0}}ul{{margin:6px 0;padding-left:18px;font-size:13px}}
.tl{{width:100%;height:150px;margin-top:12px;border-top:1px solid var(--line)}}.legend i{{display:inline-block;width:14px;height:8px;margin:0 5px 0 14px;border-radius:2px}}.legend i:first-child{{margin-left:0}}.cues td,.cues th{{padding:2px 12px 2px 0;font-size:13px}}.legend .dash{{border-top:1px dashed var(--ink2);height:0;vertical-align:middle}}</style>
<main><h1>配乐试听　{html.escape(brief["type_name"])} · {brief["duration"]:.0f} 秒</h1>
<p class="meta">想要：{"、".join(library.RULES["dims"][k] for k in prof["want"])}　不要：{"、".join(library.RULES["dims"][k] for k in prof["avoid"])}　速度 {prof["bpm"][0]}–{prof["bpm"][1]} 拍/分</p>
<section><h2>这类视频的配乐规矩</h2><ul>{nodes}</ul></section>{"".join(cards)}</main></html>'''
    out = os.path.join(out_dir, "audition.html")
    open(out, "w", encoding="utf-8").write(page)
    return out
