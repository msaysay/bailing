#!/usr/bin/env python3
"""红顶双标题口播风：丢一条竖屏口播原片，出一条成片。
顶上两行常驻大标题、胸口逐行累加的字幕（重点词金色）、全屏 / 推近 / 黑底圆框 / 圆角框 / 手机壳截图硬切、开头竖排名牌、结尾黑底三行字、配乐从开头金句之后进。
拆解和每条规矩的出处：docs/对标拆解-红顶双标题口播.md。操作说明：.claude/skills/redtop-talk/SKILL.md。

  python3 scripts/redtop.py new <期名> --video 原片.mp4
  python3 scripts/redtop.py transcribe <期名>                      转写、找重录口吃、出「字幕稿.txt」给用户校对
  python3 scripts/redtop.py confirm <期名> --titles "行一|行二;行一|行二;行一|行二" [--hooks "金句候选一;金句候选二"] [--name 称呼 --role 身份]
                                                                    出一页「确认单.html」给用户：标题、字幕稿、要剪的地方、金句、个人信息、结尾、配乐，一次确认完
  python3 scripts/redtop.py cut <期名> [--drop "7.5-10.4,…"] [--keep-retakes] [--hook "要提到开头的那句话"] [--denoise] [--grade]
  python3 scripts/redtop.py plan <期名> --title "第一行|第二行" [--name 称呼 --role 身份] [--cta "行一|行二|行三"]
                                   [--hot "重点词,重点词"] [--key "关键句里的几个字,…"] [--insert "截图.png@从这几个字~到这几个字"]…
  python3 scripts/redtop.py music <期名> [--track 曲子.mp3 | --mood light|drive|calm|warm] [--off] [--no-sfx]
  python3 scripts/redtop.py stills <期名>                          出关键帧联系表（先看这个再渲整片）
  python3 scripts/redtop.py render <期名>                          渲整片 + 机器自查
  python3 scripts/redtop.py publish <期名>                         三版封面 + 标题、简介、话题（先 init 填 发布.json，见 publish_kit.py -h）
  python3 scripts/redtop.py status <期名>

plan 生成的 episodes/<期名>/plan.json 可以直接改（重点词、版式、截图上的红框和黄色划线），改完再 stills / render。"""
import sys as _sys
for _s in (_sys.stdout, _sys.stderr): getattr(_s, "reconfigure", lambda **k: None)(encoding="utf-8", errors="replace")
import argparse, glob, json, os, re, shutil, subprocess, sys

R = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); PY = sys.executable; STUDIO = os.path.join(R, "studio"); PUB = os.path.join(STUDIO, "public"); SC = os.path.join(R, "scripts")
PUNC = "，。！？；：、—“”\"'（）()《》…,.!?;: \n\t"; END = "。！？；…!?;"
# 量自对标片的节奏（docs/对标拆解-红顶双标题口播.md）
MASK_EVERY, MASK_MIN, MASK_MAX, ZOOM, SIGN_HOLD, CTA_HOLD = 18.0, 1.5, 5.2, 1.1, 4.0, 2.0
BED_DB, KEY_DUCK_DB, BED_FADE_IN = -24.0, -8.0, 8.0


def run(cmd, **k): return subprocess.run(cmd, check=True, **k)
def ff(*a): run(["ffmpeg", "-nostdin", "-v", "error", "-y", *a])
def strip(s): return "".join(c for c in s if c not in PUNC)
def browser():
    for pat in ("/opt/pw-browsers/chromium-*/chrome-linux*/chrome", os.path.expanduser("~/.cache/ms-playwright/chromium-*/chrome-linux*/chrome")):
        g = sorted(glob.glob(pat))
        if g: return ["--browser-executable", g[-1]]
    return []


class Ep:
    def __init__(s, name):
        s.name = name; s.dir = os.path.join(R, "episodes", name); s.work = os.path.join(s.dir, "03_制作过程"); s.tmp = os.path.join(s.work, "_tmp"); s.out = os.path.join(s.dir, "out"); s.sf = os.path.join(s.dir, "redtop.json")
        s.raw = os.path.join(s.dir, "01_输入素材", "口播原片.mp4"); s.st = json.load(open(s.sf, encoding="utf8")) if os.path.exists(s.sf) else {}
        s.slug = s.st.get("slug", ""); s.pub = os.path.join(PUB, s.slug); s.plan = os.path.join(s.dir, "plan.json")
    def save(s): os.makedirs(s.dir, exist_ok=True); json.dump(s.st, open(s.sf, "w", encoding="utf8"), ensure_ascii=False, indent=1)
    def need(s, *keys):
        if not s.st: sys.exit(f"还没有这一期：{s.name}。先 python3 scripts/redtop.py new {s.name} --video 原片.mp4")
        for k in keys:
            if not s.st.get(k): sys.exit({"transcribed": "先跑 transcribe", "cut": "先跑 cut", "planned": "先跑 plan"}[k])


def probe(f):
    o = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v", "-show_entries", "stream=width,height,r_frame_rate:stream_side_data=rotation:format=duration", "-of", "json", f], capture_output=True, text=True).stdout
    d = json.loads(o); s = d["streams"][0]; w, h = s["width"], s["height"]; rot = abs(int(float((s.get("side_data_list") or [{}])[0].get("rotation", 0) or 0)))
    if rot in (90, 270): w, h = h, w
    a, b = s["r_frame_rate"].split("/"); return w, h, round(int(a) / int(b)), float(d["format"]["duration"])


def faces(video, n=7):
    """人脸在画面里的位置（几帧取中位数）。"""
    import cv2, numpy as np
    cap = cv2.VideoCapture(video); N = int(cap.get(cv2.CAP_PROP_FRAME_COUNT)); out = []; det = None
    for i in range(n):
        cap.set(cv2.CAP_PROP_POS_FRAMES, int(N * (0.1 + 0.8 * i / max(1, n - 1)))); ok, im = cap.read()
        if not ok: continue
        h, w = im.shape[:2]; det = det or cv2.FaceDetectorYN.create(os.path.expanduser("~/.cache/video-studio/yunet.onnx"), "", (w, h), .6, .3, 50); fs = det.detect(im)[1]
        if fs is not None: b = max(fs, key=lambda x: x[2] * x[3]); out.append([b[0] + b[2] / 2, b[1] + b[3] / 2, b[2]])
    if not out: return None
    m = np.median(np.array(out), axis=0); return {"x": int(m[0]), "y": int(m[1]), "w": int(m[2])}


def wav16(src, dst): ff("-i", src, "-vn", "-ac", "1", "-ar", "16000", dst)


def script_from_asr(tk, mx=10):
    """没有稿子时：按停顿把转写切成不超过 mx 个字的短行，停顿长的地方当句号。"""
    gap = [tk[i + 1]["s"] - tk[i]["s"] for i in range(len(tk) - 1)] + [9]
    def split(lo, hi):
        if hi - lo <= mx: return [(lo, hi)]
        k = max(range(lo + 2, hi - 2), key=lambda i: gap[i] - 0.004 * abs(i - (lo + hi) // 2)) + 1
        return split(lo, k) + split(k, hi)
    txt = ""
    for lo, hi in split(0, len(tk)): txt += "".join(x["t"] for x in tk[lo:hi]).strip() + ("。\n" if gap[hi - 1] > 0.5 else "，")
    return latin(txt)


def latin(t):
    """识别出来的英文是一个个小写字母（a i、c e o），合起来并大写。"""
    return re.sub(r"(?<![A-Za-z])((?:[A-Za-z] ){1,6}[A-Za-z])(?![A-Za-z])", lambda m: m.group(1).replace(" ", "").upper(), t).replace(" ", "")


def cmd_new(a):
    e = Ep(a.ep)
    if e.st: sys.exit("已经有这一期了：" + e.dir)
    if not os.path.exists(a.video): sys.exit("找不到原片：" + a.video)
    n = len(glob.glob(os.path.join(R, "episodes", "*", "redtop.json"))) + 1; e.st = {"slug": f"rt{n:02d}", "style": "redtop"}; os.makedirs(os.path.dirname(e.raw), exist_ok=True); os.makedirs(e.work, exist_ok=True); shutil.copy(a.video, e.raw); e.save()
    w, h, fps, dur = probe(e.raw); print(f"已建好：{e.dir}（代号 {e.st['slug']}）。原片 {w}×{h}，{dur:.0f} 秒。")
    if w > h: print("注意：这是横屏原片。这种风格是竖屏的，会以人脸为中心裁成竖屏，画质会降一截；最好让用户重拍竖屏。")
    if min(w, h) < 700: print("注意：原片分辨率偏低，成片会糊。")
    print(f"下一步：python3 scripts/redtop.py transcribe {a.ep}")


def cmd_transcribe(a):
    e = Ep(a.ep); e.need(); os.makedirs(e.tmp, exist_ok=True); asr = os.path.join(e.work, "asr-原片.json")
    has_a = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "a", "-show_entries", "stream=index", "-of", "csv=p=0", e.raw], capture_output=True, text=True).stdout.strip()
    if not has_a: sys.exit("这条视频里没有声音。请换一条带原声的原片。")
    wav16(e.raw, os.path.join(e.tmp, "raw.wav")); run([PY, os.path.join(SC, "asr.py"), os.path.join(e.tmp, "raw.wav"), asr], capture_output=True)
    tk = json.load(open(asr, encoding="utf8"))["tokens"]; r = subprocess.run([PY, os.path.join(SC, "retakes.py"), asr, "--out", os.path.join(e.work, "重录检测.json")], capture_output=True, text=True)
    sp = os.path.join(e.dir, "字幕稿.txt"); rj = json.load(open(os.path.join(e.work, "重录检测.json"), encoding="utf8")) if os.path.exists(os.path.join(e.work, "重录检测.json")) else {}
    dr = [tuple(float(x) for x in p.split("-")) for p in rj.get("drop", "").split(",") if p]; kept = [x for x in tk if not any(lo <= x["s"] < hi for lo, hi in dr)]        # 字幕稿里不放机器确定要删的重录
    tk_all, tk = tk, kept
    if not os.path.exists(sp) or a.force: open(sp, "w", encoding="utf8").write("# 字幕稿（由录音转写）。请校对：人名、品牌名、专业词最容易错。\n# 一行就是画面上的一行字幕，不超过 10 个字；逗号是同一句里换行，句号是这句说完（字幕清空重新累加）。断得不对就挪标点。\n# 不要改意思、不要加没说过的话。改完保存，再跑 cut。\n## 全文\n" + script_from_asr(tk))
    w, h, fps, dur = probe(e.raw); f = faces(e.raw); e.st.update(transcribed=True, raw={"w": w, "h": h, "fps": fps, "dur": round(dur, 1)}); e.save()
    tk = tk_all; print(f"原片 {w}×{h}，{dur:.1f} 秒，{len(tk)} 个字，每秒 {len(tk) / max(1, tk[-1]['s'] - tk[0]['s']):.1f} 个字（对标片是 5.6）。" + (f"人脸宽占画面 {f['w'] / w:.0%}（对标片 26%）。" if f else "没找到人脸，请看一眼原片。"))
    print("\n—— 重录、结巴、语气词（机器找的）——\n" + (r.stdout.strip() or "没有"))
    print(f"\n—— 字幕稿已写到 {sp}（「自动删」的那几处已经去掉了，「待判断」的还在）——\n" + open(sp, encoding="utf8").read().split("## 全文\n", 1)[1])
    print("下一步（先别渲染）：把下面这几样**一次**发给用户确认：\n  1. 两行标题：你出三组备选（第一行白字提问或痛点，不超过 8 个字；第二行金字给反转或答案，不超过 9 个字）\n  2. 字幕稿：把上面的全文发给他，请他指出错字（人名、品牌、术语），并告诉他你打算剪掉哪几句\n  3. 开头金句：从后半段挑一句最有劲的提到最前面（给他两个候选），不要也行\n  4. 个人信息：称呼（2 到 5 个字）和一行身份（不超过 12 个字），开头出 4 秒竖排名牌；不要也行\n  5. 结尾三行字（比如引导关注或课程信息），不要也行\n  6. 要插的手机截图或录屏（讲到哪句时出现）；要不要配乐\n他回了之后：改 字幕稿.txt → python3 scripts/redtop.py cut " + a.ep + " [--drop \"待判断里确定要删的时间段\"] [--hook \"金句\"]")


CONFIRM = r"""<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>确认单</title><style>
:root{--bg:#160a05;--card:#22110a;--line:#4a2a1a;--fg:#fff5e8;--mute:#c9a98f;--gold:#FEBE17}*{box-sizing:border-box;margin:0}body{background:var(--bg);color:var(--fg);font:16px/1.65 "PingFang SC","Microsoft YaHei",sans-serif;padding:0 16px 130px}main{max-width:860px;margin:0 auto}
h1{font-size:30px;font-weight:900;padding:36px 0 6px;text-wrap:balance}h1 em{font-style:normal;color:var(--gold)}p.lead{color:var(--mute);max-width:60ch}section{border-top:1px solid var(--line);margin-top:28px;padding-top:22px}h2{font-size:20px;font-weight:900}h2 i{font-style:normal;color:var(--gold);margin-right:10px}h2 small{font-weight:400;font-size:13.5px;color:var(--mute);margin-left:8px}
.opts{display:flex;flex-direction:column;gap:10px;margin-top:12px}.opts label{display:flex;gap:12px;align-items:center;background:var(--card);border:1px solid var(--line);padding:12px 14px;cursor:pointer}.opts label:has(input:checked){border-color:var(--gold)}.t b{display:block;font-size:19px}.t b+b{color:var(--gold)}
input[type=text],textarea{width:100%;font:inherit;color:var(--fg);background:var(--card);border:1px solid var(--line);padding:10px 12px}textarea{min-height:340px;line-height:1.9}input:focus-visible,textarea:focus-visible,button:focus-visible{outline:2px solid var(--gold);outline-offset:2px}
.g2{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px;margin-top:12px}.g2 span{display:block;font-size:13.5px;color:var(--mute);margin-bottom:4px}.del{color:var(--mute);font-size:14.5px}.del label{display:flex;gap:10px;padding:6px 0}
.bar{position:fixed;left:0;right:0;bottom:0;background:rgba(22,10,5,.97);border-top:1px solid var(--line);padding:12px 16px}.bar div{max-width:860px;margin:0 auto;display:flex;gap:14px;align-items:center}.bar span{flex:1;color:var(--mute);font-size:14px}.bar button{font:inherit;font-weight:900;background:var(--gold);color:#2a1200;border:0;padding:12px 26px;cursor:pointer}
</style></head><body><main><h1>开剪之前，<em>这几样请你定一下</em></h1><p class="lead">都在这一页。改完点底部「复制给 AI」，粘贴回聊天里就行。不确定的可以不动。</p>
<section><h2><i>1</i>两行标题<small>全片一直挂在画面顶上</small></h2><div class="opts" id="titles"></div><div class="g2"><div><span>或者自己写第一行（白字，不超过 8 个字）</span><input type="text" id="t1" maxlength="10"></div><div><span>第二行（金字，不超过 9 个字）</span><input type="text" id="t2" maxlength="11"></div></div></section>
<section><h2><i>2</i>字幕稿<small>请改错字：人名、品牌、专业词。一行就是一行字幕；逗号换行，句号是这句说完</small></h2><textarea id="script" spellcheck="false"></textarea></section>
<section><h2><i>3</i>打算剪掉的地方<small>打勾的会剪掉；不想剪的把勾去掉。字幕稿里已经去掉了打勾的这些</small></h2><div class="del" id="dels"></div></section>
<section><h2><i>4</i>开头金句<small>从后面挑一句最有劲的提到最前面</small></h2><div class="opts" id="hooks"></div></section>
<section><h2><i>5</i>个人信息<small>开头出几秒竖排名牌；留空就不出</small></h2><div class="g2"><div><span>称呼（2 到 5 个字）</span><input type="text" id="name" maxlength="5"></div><div><span>身份（不超过 12 个字）</span><input type="text" id="role" maxlength="12"></div></div></section>
<section><h2><i>6</i>结尾三行字<small>最后 2 秒黑底出现；留空就不出</small></h2><div class="g2"><div><span>第一行</span><input type="text" id="c1" maxlength="14"></div><div><span>第二行</span><input type="text" id="c2" maxlength="14"></div><div><span>第三行</span><input type="text" id="c3" maxlength="14"></div></div></section>
<section><h2><i>7</i>配乐</h2><div class="opts" id="music"></div></section>
</main><div class="bar"><div><span id="hint">改完点右边，粘贴回聊天。</span><button id="copy">复制给 AI</button></div></div><script>
var D=/*DATA*/{};var $=function(s){return document.querySelector(s)};function radio(box,name,items,def){items.forEach(function(it,i){var l=document.createElement('label');l.innerHTML='<input type="radio" name="'+name+'" value="'+i+'"'+(i===def?' checked':'')+'><span class="t">'+it+'</span>';$(box).appendChild(l)})}
radio('#titles','title',D.titles.map(function(t){return '<b>'+t[0]+'</b><b>'+t[1]+'</b>'}).concat(['用我下面自己写的']),0);radio('#hooks','hook',D.hooks.concat(['不要金句，从头开始讲']),0);radio('#music','music',['要配乐（很轻地垫在下面）','不要配乐','我自己给一首曲子'],0);
$('#script').value=D.script;$('#name').value=D.name||'';$('#role').value=D.role||'';D.dels.forEach(function(d,i){var l=document.createElement('label');l.innerHTML='<input type="checkbox"'+(d.sure?' checked':'')+' data-i="'+i+'"><span>'+d.kind+'：删「'+d.text+'」，留后面那遍「'+d.keep+'」</span>';$('#dels').appendChild(l)});if(!D.dels.length)$('#dels').textContent='没有要剪的重录或口吃。';
$('#copy').onclick=function(){var ti=+document.querySelector('input[name=title]:checked').value,t=ti<D.titles.length?D.titles[ti]:[$('#t1').value.trim(),$('#t2').value.trim()],hi=+document.querySelector('input[name=hook]:checked').value,keep=[];document.querySelectorAll('#dels input').forEach(function(c){if(c.checked)keep.push(D.dels[+c.dataset.i].range)});
var c=[$('#c1').value.trim(),$('#c2').value.trim(),$('#c3').value.trim()].filter(Boolean),mu=+document.querySelector('input[name=music]:checked').value;
var out='这是我确认好的，请照它往下做，不用再问：\n\n1. 标题：'+t[0]+' | '+t[1]+'\n2. 开头金句：'+(hi<D.hooks.length?D.hooks[hi]:'不要')+'\n3. 要剪掉的时间段：'+(keep.length?keep.join(','):'都不剪')+'（粗剪时用 --keep-retakes --drop 这一串）'+'\n4. 个人信息：称呼「'+($('#name').value.trim()||'不要')+'」，身份「'+($('#role').value.trim()||'不要')+'」\n5. 结尾三行字：'+(c.length?c.join(' | '):'不要')+'\n6. 配乐：'+['要','不要','我自己给曲子，等我发你'][mu]+'\n7. 字幕稿（我改过的，原样存成 字幕稿.txt）：\n\n'+$('#script').value.trim()+'\n';
function ok(){$('#hint').textContent='已复制。回到聊天窗口粘贴发送。'}if(navigator.clipboard&&window.isSecureContext)navigator.clipboard.writeText(out).then(ok,fb);else fb();function fb(){var a=document.createElement('textarea');a.value=out;document.body.appendChild(a);a.select();try{document.execCommand('copy');ok()}catch(e){$('#hint').textContent='复制不了，请手动全选。'}a.remove()}};
</script></body></html>"""


def cmd_confirm(a):
    """出一页「确认单」：标题三选一、字幕稿可以直接改、要剪的地方能勾选、金句二选一、个人信息、结尾、配乐。用户改完复制回来。"""
    e = Ep(a.ep); e.need("transcribed"); titles = [[y.strip() for y in x.split("|")] for x in a.titles.split(";") if "|" in x]; hooks = [x.strip() for x in a.hooks.split(";") if x.strip()]
    if len(titles) < 2: sys.exit('--titles 至少给两组，写法："第一行|第二行;第一行|第二行;第一行|第二行"')
    rj = os.path.join(e.work, "重录检测.json"); d = json.load(open(rj, encoding="utf8")) if os.path.exists(rj) else {}
    dels = [{"kind": x.get("kind", "重录") + ("" if sure else "（机器拿不准）"), "text": x.get("dropped", "")[:40], "keep": x.get("kept", "")[:20], "range": f"{x['range'][0]:.2f}-{x['range'][1]:.2f}", "sure": sure} for sure, key in ((True, "auto"), (False, "suspect")) for x in d.get(key, [])]
    script = open(os.path.join(e.dir, "字幕稿.txt"), encoding="utf8").read(); body = "\n".join(l for l in script.splitlines() if not l.startswith("#"))
    data = {"titles": titles, "hooks": hooks, "script": body.strip(), "dels": dels, "name": a.name, "role": a.role}
    o = os.path.join(e.dir, "确认单.html"); open(o, "w", encoding="utf8").write(CONFIRM.replace("/*DATA*/{}", json.dumps(data, ensure_ascii=False))); print(f"确认单：{o}\n请用户双击打开，改完点「复制给 AI」贴回来。收到后：把里面的字幕稿原样写进 字幕稿.txt（前面加一行「## 全文」），再跑 cut。")


def align(e, script_text):
    sp = os.path.join(e.tmp, "script-用.txt"); open(sp, "w", encoding="utf8").write(script_text); cutv = os.path.join(e.pub, "person.mp4")
    wav16(cutv, os.path.join(e.tmp, "cut.wav")); run([PY, os.path.join(SC, "asr.py"), os.path.join(e.tmp, "cut.wav"), os.path.join(e.work, "asr.json")], capture_output=True)
    r = subprocess.run([PY, os.path.join(SC, "align.py"), "--script", sp, "--asr", os.path.join(e.work, "asr.json"), "--audio", cutv, "--out-timing", os.path.join(e.work, "timing.json"), "--out-audio", os.path.join(e.pub, "voice.wav"), "--max", "10", "--fps", "30"], capture_output=True, text=True)
    if r.returncode: sys.exit("对齐失败：" + r.stderr[-400:])
    return r.stdout


def read_script(e):
    sp = os.path.join(e.dir, "字幕稿.txt")
    return "\n".join(l for l in open(sp, encoding="utf8").read().splitlines() if not (l.startswith("#") and not l.startswith("##")))


def cmd_cut(a):
    e = Ep(a.ep); e.need("transcribed"); os.makedirs(e.pub, exist_ok=True); w, h = e.st["raw"]["w"], e.st["raw"]["h"]; cutv = os.path.join(e.pub, "person.mp4"); asr0 = os.path.join(e.work, "asr-原片.json")
    if w > h:
        f = faces(e.raw) or {"x": w // 2}; cw = int(h * 9 / 16) // 2 * 2; x0 = max(0, min(w - cw, f["x"] - cw // 2)); vf = f"crop={cw}:{h}:{x0}:0,scale=1080:1920"
    else: vf = "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920"
    drop = a.drop
    if not a.keep_retakes:
        auto = json.load(open(os.path.join(e.work, "重录检测.json"), encoding="utf8")).get("drop", ""); drop = ",".join(x for x in (drop, auto) if x); print("自动剪掉的重录、结巴、语气词：" + (auto or "没有"))
    if a.grade:
        g = subprocess.run([PY, os.path.join(SC, "grade.py"), e.raw, os.path.join(e.work, "调光.json"), "--preview", os.path.join(e.work, "调光对比.jpg")], capture_output=True, text=True)
        if g.returncode == 0 and g.stdout.strip(): vf = g.stdout.strip().splitlines()[-1] + "," + vf; print("已调光，对比图：03_制作过程/调光对比.jpg（肤色不自然就去掉 --grade 重跑）")
    # 对标片几乎没有气口：两个字之间超过 0.45 秒就收到 0.2 秒
    cmd = [PY, os.path.join(SC, "roughcut.py"), e.raw, asr0, "--out", cutv, "--cuts", os.path.join(e.work, "cuts.json"), "--fps", "30", "--vf", vf, "--max-gap", "0.45", "--keep-gap", "0.2"] + (["--drop", drop] if drop else [])
    run(cmd)
    if a.denoise: run([PY, os.path.join(SC, "polish.py"), cutv, "--inplace", "--denoise", "auto"])
    script = read_script(e); print(align(e, script).strip()); hook = None
    if a.hook:
        T = json.load(open(os.path.join(e.work, "timing.json"), encoding="utf8")); chars = [c for l in T["lines"] for c in l["chars"] if c["c"] not in PUNC]; s = "".join(c["c"] for c in chars); k = s.rfind(strip(a.hook))
        if k < 0: sys.exit("在字幕稿里没找到这句开头金句：" + a.hook + "（要和字幕稿里的字一样，可以只给其中连续的一段）")
        n = len(strip(a.hook)); t0 = max(0, chars[k]["t"] - 0.06); t1 = min(chars[k + n]["t"] - 0.03 if k + n < len(chars) else T["total"], chars[k + n - 1]["t"] + 0.42)     # 最后一个字念完就收，不带后面的停顿
        hk = os.path.join(e.tmp, "hook.mp4"); body = os.path.join(e.tmp, "body.mp4"); shutil.move(cutv, body)
        ff("-ss", f"{t0:.3f}", "-t", f"{t1 - t0 + 0.12:.3f}", "-i", body, "-c:v", "libx264", "-crf", "16", "-preset", "fast", "-pix_fmt", "yuv420p", "-r", "30", "-c:a", "aac", "-ar", "48000", "-af", f"afade=t=out:st={t1 - t0:.3f}:d=0.1", hk)
        ff("-i", hk, "-i", body, "-filter_complex", "[0:v][0:a][1:v][1:a]concat=n=2:v=1:a=1[v][a]", "-map", "[v]", "-map", "[a]", "-c:v", "libx264", "-crf", "16", "-preset", "fast", "-pix_fmt", "yuv420p", "-r", "30", "-c:a", "aac", cutv)
        # 金句里的断行沿用字幕稿里那一段的标点
        raw_txt = script.split("\n", 1)[1] if script.startswith("##") else script; flat = [c for c in raw_txt if c != "\n"]; idx = [i for i, c in enumerate(flat) if c not in PUNC]; seg = "".join(flat[idx[k]: idx[k + n - 1] + 1]).strip("，、 ")
        print(align(e, "## 开头金句\n" + seg + "。\n" + script).strip()); hook = {"text": seg, "dur": round(t1 - t0 + 0.12, 2)}
    f = faces(cutv); T = json.load(open(os.path.join(e.work, "timing.json"), encoding="utf8"))
    e.st.update(cut=True, face=f or {"x": 540, "y": 760, "w": 280}, hook=hook, total=T["total"]); e.save()
    c = json.load(open(os.path.join(e.work, "cuts.json"), encoding="utf8"))
    print(f"剪后 {T['total']:.1f} 秒（原片 {e.st['raw']['dur']} 秒），剪口 {len(c.get('cuts', []))} 个，字幕 {len(T['lines'])} 行。" + ("" if f else "没找到人脸，plan.json 里的 face 要手动填。"))
    print(f"下一步：python3 scripts/redtop.py plan {a.ep} --title \"第一行|第二行\" …")


def stacks_of(e):
    """把字幕行按句子堆成「一句话几行逐行累加」。句末标点、长停顿、满三行就另起一堆。"""
    T = json.load(open(os.path.join(e.work, "timing.json"), encoding="utf8")); L = T["lines"]; hook_txt = "## 开头金句\n" + e.st["hook"]["text"] + "。\n" if e.st.get("hook") else ""
    flat = [c for c in (hook_txt + read_script(e)) if True]; txt = "".join(l for l in "".join(flat).splitlines(True) if not l.startswith("##")); pos = 0; ends = []
    for l in L:
        for ch in strip(l["text"]):
            while pos < len(txt) and txt[pos] != ch: pos += 1
            pos += 1
        j = pos
        while j < len(txt) and txt[j] in " \t": j += 1
        ends.append(txt[j] if j < len(txt) else "。")
    out, cur = [], []
    for i, l in enumerate(L):
        cur.append(l); nxt = L[i + 1] if i + 1 < len(L) else None
        if nxt is None or ends[i] in END or ends[i] == "\n" or nxt["start"] - l["end"] > 0.4 or nxt["seg"] != l["seg"]:
            k = -(-len(cur) // 3); size = -(-len(cur) // k)                      # 一句超过三行就均分成几堆（四行分成二加二，不是三加一）
            out += [cur[j:j + size] for j in range(0, len(cur), size)]; cur = []
    S = []
    for k, st in enumerate(out):
        frm = max(0, st[0]["start"] - 0.04); to = out[k + 1][0]["start"] - 0.04 if k + 1 < len(out) else min(T["total"], st[-1]["end"] + 0.3)
        S.append({"from": round(frm, 2), "to": round(to, 2), "lines": [{"text": strip(x["text"]) if False else x["text"].strip(), "at": round(max(frm, x["start"] - 0.04), 2)} for x in st], "seg": st[0]["seg"]})
    return S, T


def find_stack(S, frag, after=0):
    f = strip(frag)
    for i, s in enumerate(S):
        if i >= after and f and f in strip("".join(l["text"] for l in s["lines"])): return i
    return None


def cmd_plan(a):
    e = Ep(a.ep); e.need("cut"); S, T = stacks_of(e); total = T["total"]; title = [x.strip() for x in a.title.split("|")]
    if len(title) != 2 or not all(title): sys.exit("--title 要两行，用竖线隔开：\"短视频没流量？|你可能搞错了战场\"")
    if len(title[0]) > 9 or len(title[1]) > 10: print(f"提醒：标题偏长（{len(title[0])} / {len(title[1])} 个字），会自动缩小字号。对标片是 7 个字和 8 个字。")
    hot = [x.strip() for x in re.split("[,，]", a.hot) if x.strip()]; auto_hot = set()
    for s in S:
        for l in s["lines"]:
            auto_hot.update(re.findall(r"[A-Za-z]{2,}", l["text"])); auto_hot.update(re.findall(r"\d+(?:\.\d+)?[万亿千百%％倍年天个条]?", l["text"]))
            hs = [h for h in list(dict.fromkeys(hot + sorted(auto_hot, key=len, reverse=True))) if h in l["text"]]
            if hs: l["hot"] = hs
    hook_n = sum(1 for s in S if s["seg"] == 1) if e.st.get("hook") else 0; hook_end = S[hook_n - 1]["to"] if hook_n else 0.0
    # 手机壳截图
    inserts = []
    for spec in a.insert or []:
        m = re.match(r"(.+?)@(.+?)(?:~(.+))?$", spec)
        if not m: sys.exit("--insert 的写法：截图.png@从这几个字~到这几个字")
        srcf, f0, f1 = m.group(1), m.group(2), m.group(3) or m.group(2); i0 = find_stack(S, f0, hook_n); i1 = find_stack(S, f1, i0 or 0)
        if i0 is None or i1 is None: sys.exit(f"字幕里没找到这几个字：{f0 if i0 is None else f1}")
        if not os.path.exists(srcf): sys.exit("找不到素材：" + srcf)
        os.makedirs(os.path.join(e.pub, "inserts"), exist_ok=True); dst = os.path.join(e.pub, "inserts", re.sub(r"[^\w.]", "_", os.path.basename(srcf))); shutil.copy(srcf, dst)
        inserts.append({"from": S[i0]["from"], "to": S[i1]["to"], "src": f"{e.slug}/inserts/{os.path.basename(dst)}", "marks": []})
    in_ins = lambda t: any(x["from"] <= t < x["to"] for x in inserts)
    keys = [i for i in (find_stack(S, k, hook_n) for k in re.split("[,，]", a.key) if k.strip()) if i is not None]
    cuts = json.load(open(os.path.join(e.work, "cuts.json"), encoding="utf8")).get("cuts", []); shift = e.st["hook"]["dur"] if e.st.get("hook") else 0
    # 版式：默认人全屏；每句开头如果压着剪口就换一次景别；每隔十几秒挑一句短的放进黑底圆框（关键句优先）
    beats = []; zoom = 1.0; last_mask = -99.0; nmask = 0; last_zoom_at = 0.0
    for i, s in enumerate(S):
        d = s["to"] - s["from"]; t = s["from"]; mode = "full"
        if i < hook_n: mode = "full" if i % 2 == 0 else "circle"                   # 开头金句：全屏、圆框交替
        elif in_ins(t): mode = "full"
        elif (i in keys and d <= MASK_MAX + 2) or (t - last_mask >= MASK_EVERY and MASK_MIN <= d <= MASK_MAX and i > hook_n and i < len(S) - 1): mode = "circle" if nmask % 3 != 2 else "card"
        if mode != "full": last_mask = s["to"]; nmask += i >= hook_n; beats.append({"at": t, "mode": mode}); continue
        on_cut = any(abs(c + shift - t) < 0.35 for c in cuts)
        if beats and beats[-1]["mode"] != "full": zoom = 1.0 if zoom > 1 else ZOOM; last_zoom_at = t          # 从框里回来：换一个景别
        elif on_cut or t - last_zoom_at >= 7.0 or i == hook_n: zoom = 1.0 if zoom > 1 else ZOOM; last_zoom_at = t
        if not beats or beats[-1]["mode"] != "full" or beats[-1].get("zoom", 1) != zoom: beats.append({"at": t, "mode": "full", "zoom": zoom})
    beats[0]["at"] = 0
    sign = None
    if a.name:
        first = next((b["at"] for b in beats if b["mode"] == "full" and b["at"] >= hook_end - 0.01), hook_end); nxt = next((b["at"] for b in beats if b["at"] > first and b["mode"] != "full"), total); sign = {"name": a.name, "title": a.role or "", "from": round(first + 0.3, 2), "to": round(min(total - 0.5, first + 0.3 + SIGN_HOLD, nxt - 0.15), 2)}     # 名牌只在人全屏时出，进黑底框之前收掉
    cta = None; full_total = total
    if a.cta: cta = {"lines": [x.strip() for x in a.cta.split("|") if x.strip()][:3], "from": round(total, 2)}; full_total = round(total + CTA_HOLD, 2)
    key_ranges = [[S[i]["from"], S[i]["to"]] for i in keys]
    plan = {"video": f"{e.slug}/person.mp4", "audio": f"{e.slug}/mix.wav", "total": full_total, "vw": 1080, "vh": 1920, "face": e.st["face"], "title": title, "theme": {"top": a.top, "gold": a.gold},
            "beats": [{**b, "at": round(b["at"], 2)} for b in beats], "subs": [{"from": s["from"], "to": s["to"], "lines": s["lines"]} for s in S], "inserts": inserts, "sign": sign, "cta": cta}
    json.dump(plan, open(e.plan, "w", encoding="utf8"), ensure_ascii=False, indent=1); e.st.update(planned=True, hook_end=round(hook_end, 2), key_ranges=key_ranges, speech_total=total); e.save()
    if not os.path.exists(os.path.join(e.pub, "mix.wav")): shutil.copy(os.path.join(e.pub, "voice.wav"), os.path.join(e.pub, "mix.wav"))
    table(e, plan); print(open(os.path.join(e.work, "版式表.md"), encoding="utf8").read())
    print(f"plan.json 可以直接改：episodes/{a.ep}/plan.json（重点词 hot、版式 beats、截图上的 marks）。\n下一步：python3 scripts/redtop.py music {a.ep}（不要配乐加 --off）→ stills → render")


def shares(plan):
    T = plan["total"]; bs = plan["beats"]; sh = {"full": 0.0, "circle": 0.0, "card": 0.0, "phone": 0.0}; end = plan["cta"]["from"] if plan.get("cta") else T
    for i, b in enumerate(bs):
        t0, t1 = b["at"], bs[i + 1]["at"] if i + 1 < len(bs) else end; step = 0.1; t = t0
        while t < t1: sh["phone" if any(x["from"] <= t < x["to"] for x in plan.get("inserts", [])) else b["mode"]] += step; t += step
    return {k: v / max(0.1, end) for k, v in sh.items()}


def table(e, plan):
    N = {"full": "人全屏", "circle": "黑底圆框", "card": "黑底圆角框", "phone": "手机壳截图"}; bs = plan["beats"]; rows = ["# 版式表 · 红顶双标题口播风", "", f"标题：{plan['title'][0]} / {plan['title'][1]}", "", "| 时间 | 版式 | 字幕（／是换行，【】是金色） |", "|---|---|---|"]
    for s in plan["subs"]:
        b = [x for x in bs if x["at"] <= s["from"] + 0.05][-1]; ins = any(x["from"] <= s["from"] + 0.05 < x["to"] for x in plan.get("inserts", [])); mode = "手机壳截图" if ins else N[b["mode"]] + ("（推近）" if b.get("zoom", 1) > 1 and b["mode"] == "full" else "")
        def mk(l):
            t = l["text"]
            for h in l.get("hot", []): t = t.replace(h, f"【{h}】")
            return t
        rows.append(f"| {s['from']:.1f} | {mode} | {' ／ '.join(mk(l) for l in s['lines'])} |")
    sh = shares(plan); rows += ["", f"占比：人全屏 {sh['full']:.0%}（对标片 63%），黑底框 {sh['circle'] + sh['card']:.0%}（对标片 13%），手机壳截图 {sh['phone']:.0%}（对标片 23%，没给截图就是 0）。"]
    if plan.get("sign"): rows.append(f"名牌：{plan['sign']['from']} 到 {plan['sign']['to']} 秒，{plan['sign']['name']}　{plan['sign'].get('title', '')}")
    if plan.get("cta"): rows.append(f"结尾：{plan['cta']['from']} 秒起黑底，{' ／ '.join(plan['cta']['lines'])}")
    open(os.path.join(e.work, "版式表.md"), "w", encoding="utf8").write("\n".join(rows) + "\n")


def cmd_music(a):
    """配乐：开头金句是干声，金句说完配乐才进，慢慢起；说话时比人声低 24 分贝；关键句再压 8 分贝；结尾黑底时一声收尾音。全是量对标片量出来的。"""
    import numpy as np, soundfile as sf
    e = Ep(a.ep); e.need("planned"); plan = json.load(open(e.plan, encoding="utf8")); SR = 48000; total = plan["total"]; speech = e.st["speech_total"]; n = int(total * SR)
    ff("-i", os.path.join(e.pub, "voice.wav"), "-ac", "1", "-ar", str(SR), os.path.join(e.tmp, "v48.wav")); v, _ = sf.read(os.path.join(e.tmp, "v48.wav")); v = np.pad(v, (0, max(0, n - len(v))))[:n]; out = np.stack([v, v], 1); info = {"music": None}
    fr = (v[: len(v) // 2400 * 2400].reshape(-1, 2400) ** 2).mean(1); Lv = 10 * np.log10(np.mean(np.sort(fr)[int(len(fr) * .4):]) + 1e-12)       # 说话时的人声电平
    if not a.off:
        track = a.track
        if not track:
            lib = json.load(open(os.path.join(R, "music", "library.json"), encoding="utf8"))["tracks"]; c = [x for x in lib if x["mood"] == a.mood and os.path.exists(os.path.join(R, "music", x["file"]))] or [x for x in lib if os.path.exists(os.path.join(R, "music", x["file"]))]
            if not c: sys.exit("music/ 里没有曲子。用 --track 给一首，或加 --off 不要配乐。")
            c.sort(key=lambda x: (x.get("credit") is not None, abs((x.get("bpm") or 100) - 112))); pick = c[0]; track = os.path.join(R, "music", pick["file"]); info = {"music": pick["title"], "credit": pick.get("credit"), "licence": pick.get("licence")}
        else: info = {"music": os.path.basename(track), "credit": None, "licence": "用户自己给的曲子，版权自己确认"}
        ff("-stream_loop", "-1", "-i", track, "-t", f"{total:.2f}", "-ac", "2", "-ar", str(SR), "-af", "highpass=f=90,lowpass=f=10000", os.path.join(e.tmp, "bed.wav")); b, _ = sf.read(os.path.join(e.tmp, "bed.wav")); b = np.pad(b, ((0, max(0, n - len(b))), (0, 0)))[:n]
        Lb = 10 * np.log10((b ** 2).mean() + 1e-12); g = np.full(n, BED_DB + Lv - Lb); t = np.arange(n) / SR; start = max(0.0, e.st.get("hook_end", 0.0) - 0.3)
        g += np.where(t < start, -120, np.minimum(0, -14 * (1 - (t - start) / BED_FADE_IN)))                                    # 金句之后进，8 秒慢慢起
        for k0, k1 in e.st.get("key_ranges", []): g += KEY_DUCK_DB * np.clip(np.minimum((t - k0 + 0.4) / 0.4, (k1 + 0.6 - t) / 0.6), 0, 1)   # 关键句压低
        g += np.where(t > speech - 1.2, -60 * np.clip((t - (speech - 1.2)) / 1.2, 0, 1), 0)                                       # 话说完前收掉
        out += b * (10 ** (g / 20))[:, None]
    if not a.no_sfx:
        rng = np.random.default_rng(7)
        def whoosh(at, db):
            m = int(0.22 * SR); i0 = int(at * SR)
            if i0 < 0 or i0 + m > n: return
            x = rng.standard_normal(m); x = np.convolve(x, np.ones(24) / 24, "same"); env = np.sin(np.linspace(0, np.pi, m)) ** 2; x = x / (np.abs(x).max() + 1e-9) * env * 10 ** ((Lv + db) / 20) * 3; out[i0:i0 + m] += x[:, None]
        bs = plan["beats"]
        for i, b_ in enumerate(bs[1:], 1):
            if b_["mode"] != "full" and bs[i - 1]["mode"] == "full": whoosh(b_["at"] - 0.08, -20)                                # 进黑底框时一声很轻的「唰」
        for x in plan.get("inserts", []): whoosh(x["from"] - 0.08, -18)
        if plan.get("cta"):                                                                                                      # 结尾黑底：一声收尾音（三个音叠在一起慢慢散）
            i0 = int(plan["cta"]["from"] * SR); m = min(n - i0, int(1.9 * SR)); tt = np.arange(m) / SR; ch = sum(np.sin(2 * np.pi * f * tt) * np.exp(-tt * d) for f, d in ((587.3, 2.2), (880.0, 2.8), (1479.98, 3.6))) / 3; out[i0:i0 + m] += (ch * 10 ** ((Lv - 6) / 20) * 2.2)[:, None]
    mp = os.path.join(e.pub, "mix.wav"); sf.write(mp, np.clip(out, -1, 1), SR)
    m = re.search(r"I:\s*(-?[\d.]+) LUFS", subprocess.run(["ffmpeg", "-nostdin", "-i", mp, "-af", "ebur128", "-f", "null", "-"], capture_output=True, text=True).stderr.split("Summary:")[-1])     # 整体响度拉到 -16
    if m: out = out * 10 ** ((-16.0 - float(m.group(1))) / 20)
    pk = np.abs(out).max()
    if pk > 0.89: out = np.tanh(out / pk * 1.6) / np.tanh(1.6) * 0.89
    sf.write(mp, out, SR); e.st.update(music=info); e.save()
    print("配乐：" + (info["music"] or "不要") + (f"（{info.get('licence') or ''}）" if info["music"] else "") + ("　要写进简介的署名：" + info["credit"] if info.get("credit") else ""))
    print(f"做法：{'金句说完（' + str(e.st.get('hook_end')) + ' 秒）才进' if e.st.get('hook_end') else '开头就进'}，{BED_FADE_IN:.0f} 秒慢慢起，说话时比人声低 {-BED_DB:.0f} 分贝，关键句 {len(e.st.get('key_ranges', []))} 处再压 {-KEY_DUCK_DB:.0f} 分贝。\n下一步：python3 scripts/redtop.py stills {a.ep}")


def cmd_stills(a):
    e = Ep(a.ep); e.need("planned"); plan = json.load(open(e.plan, encoding="utf8")); os.makedirs(e.out, exist_ok=True); bs = plan["beats"]; ts = []
    seen = set()
    for i, b in enumerate(bs):
        k = (b["mode"], b.get("zoom", 1)); t1 = bs[i + 1]["at"] if i + 1 < len(bs) else plan["total"]
        if k not in seen and t1 - b["at"] > 0.6: seen.add(k); ts.append(min(b["at"] + (t1 - b["at"]) * 0.6, t1 - 0.1))
    for x in plan.get("inserts", [])[:2]: ts.append((x["from"] + x["to"]) / 2)
    if plan.get("sign"): ts.append(plan["sign"]["from"] + 1.5)
    if plan.get("cta"): ts.append(plan["cta"]["from"] + 1.2)
    for s in plan["subs"]:
        if len(s["lines"]) >= 3: ts.append(s["to"] - 0.15); break
    ts = sorted(set(round(t, 2) for t in ts))[:10]; shots = []
    for i, t in enumerate(ts):
        o = os.path.join(e.tmp, f"k{i}.jpg"); run(["npx", "remotion", "still", "src/index.tsx", "REDTOP", o, "--props", e.plan, "--frame", str(int(t * 30)), "--scale", "0.4", "--log", "error", *browser()], cwd=STUDIO); shots.append(o)
    sheet = os.path.join(e.out, "关键帧.jpg"); ff(*sum((["-i", s] for s in shots), []), "-filter_complex", f"hstack={len(shots)}" if len(shots) > 1 else "null", sheet)
    print(f"关键帧联系表（{len(shots)} 张，时间点 {ts}）：{sheet}\n用看图工具看：标题有没有被切、字幕有没有压脸或出框、圆框里脸是不是居中、名牌和结尾对不对。没问题再 render。")


def cmd_render(a):
    e = Ep(a.ep); e.need("planned"); os.makedirs(e.out, exist_ok=True); plan = json.load(open(e.plan, encoding="utf8")); o = os.path.join(e.out, "成片.mp4")
    run(["npx", "remotion", "render", "src/index.tsx", "REDTOP", o, "--props", e.plan, "--concurrency", str(min(4, os.cpu_count() or 2)), "--log", "error", *browser()], cwd=STUDIO)
    table(e, plan); sh = shares(plan); print(f"成片：{o}\n占比：人全屏 {sh['full']:.0%}，黑底框 {sh['circle'] + sh['card']:.0%}，手机壳截图 {sh['phone']:.0%}（对标片 63% / 13% / 23%）")
    q = os.path.join(SC, "qc.py")
    if os.path.exists(q):
        r = subprocess.run([PY, q, o], capture_output=True, text=True); print(r.stdout.strip()[-700:])
        if "亮度突变" in r.stdout and "未通过" in r.stdout: print("说明：这种风格进出黑底圆框、结尾黑底时画面亮度本来就会跳，「亮度突变」报在这些时刻属于正常；黑场、闪帧、画面停滞有内容才是真问题。")
    print(f"下一步：把成片给用户看；他点头后 python3 scripts/redtop.py publish {a.ep}")


def cmd_publish(a):
    e = Ep(a.ep); e.need("planned"); plan = json.load(open(e.plan, encoding="utf8")); pj = os.path.join(e.dir, "发布.json")
    if not os.path.exists(pj):
        run([PY, os.path.join(SC, "publish_kit.py"), "init", a.ep], capture_output=True); d = json.load(open(pj, encoding="utf8")); d["cover"].update(l1=plan["title"][0], l2=plan["title"][1]); json.dump(d, open(pj, "w", encoding="utf8"), ensure_ascii=False, indent=1)
        print(f"已生成 {pj}，封面两行字先用了片子的标题。请你填：三个标题（titles）、简介（desc）、话题（topics）、提醒（warn），填完再跑一次 publish。"); return
    bd = os.path.join(R, "brands", "_redtop"); os.makedirs(bd, exist_ok=True); th = plan.get("theme") or {}
    json.dump({"name": (plan.get("sign") or {}).get("name", ""), "font": "AlibabaPuHuiTi-3-105-Heavy.ttf", "colors": {"底色": "#1A0800", "主色": th.get("gold", "#FEBE17"), "辅色": "#FFFFFF"}}, open(os.path.join(bd, "fingerprint.json"), "w", encoding="utf8"), ensure_ascii=False)
    r = subprocess.run([PY, os.path.join(SC, "publish_kit.py"), "build", a.ep, "--video", os.path.join(e.pub, "person.mp4"), "--clean", "--brand", "_redtop", "--max-title", "20"], capture_output=True, text=True)
    print((r.stdout + (r.stderr if r.returncode else "")).strip()[-900:])
    if r.returncode: sys.exit(1)
    if (e.st.get("music") or {}).get("credit"): print("配乐要署名，写进简介：" + e.st["music"]["credit"])


def cmd_status(a):
    e = Ep(a.ep); e.need(); s = e.st; steps = [("转写", s.get("transcribed")), ("用户确认标题、字幕稿、个人信息", s.get("cut")), ("粗剪", s.get("cut")), ("排版式", s.get("planned")), ("配乐", s.get("music") is not None), ("成片", os.path.exists(os.path.join(e.out, "成片.mp4"))), ("发布包", os.path.isdir(os.path.join(e.out, "发布包")))]
    for i, (n, ok) in enumerate(steps, 1): print(("✓ " if ok else "· ") + f"{i}. {n}")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter); sub = ap.add_subparsers(dest="cmd", required=True)
    p = sub.add_parser("new"); p.add_argument("ep"); p.add_argument("--video", required=True)
    p = sub.add_parser("transcribe"); p.add_argument("ep"); p.add_argument("--force", action="store_true")
    p = sub.add_parser("cut"); p.add_argument("ep"); p.add_argument("--drop", default=""); p.add_argument("--keep-retakes", action="store_true", help="不自动剪重录、结巴（默认会剪「自动删」的那些）"); p.add_argument("--hook", default=""); p.add_argument("--denoise", action="store_true"); p.add_argument("--grade", action="store_true")
    p = sub.add_parser("plan"); p.add_argument("ep"); p.add_argument("--title", required=True); p.add_argument("--name", default=""); p.add_argument("--role", default=""); p.add_argument("--cta", default=""); p.add_argument("--hot", default=""); p.add_argument("--key", default=""); p.add_argument("--insert", action="append"); p.add_argument("--top", default="#4B1600"); p.add_argument("--gold", default="#FEBE17")
    p = sub.add_parser("music"); p.add_argument("ep"); p.add_argument("--track"); p.add_argument("--mood", default="light"); p.add_argument("--off", action="store_true"); p.add_argument("--no-sfx", action="store_true")
    p = sub.add_parser("confirm"); p.add_argument("ep"); p.add_argument("--titles", required=True); p.add_argument("--hooks", default=""); p.add_argument("--name", default=""); p.add_argument("--role", default="")
    for c in ("stills", "render", "publish", "status"): sub.add_parser(c).add_argument("ep")
    a = ap.parse_args(); globals()["cmd_" + a.cmd](a)


if __name__ == "__main__":
    main()
