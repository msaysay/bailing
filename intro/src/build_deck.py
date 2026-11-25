#!/usr/bin/env python3
"""生成 dist/宁序科技-公司介绍.pptx 和 dist/宁少-个人介绍.pptx（原生文本框，可在 PowerPoint / WPS 里直接改字）。"""
import pathlib
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.oxml.ns import qn

ROOT = pathlib.Path(__file__).resolve().parent.parent
QR = str(ROOT.parent / 'site/assets/qr.png')
INK, INK2, PAPER, LIME, GOLD = '0A0A0B', '15171A', 'F4F2EC', 'D6FF3D', 'FFD84A'
MUTE, FAINT, LINE, INKMUTE = 'A3A29E', '6E6D6A', '2B2D30', '55544F'
HEI, DIN = 'Microsoft YaHei', 'Bahnschrift'
W, H = 13.333, 7.5
MX = 0.75


def rgb(h): return RGBColor.from_string(h)


class Deck:
    def __init__(self, brand, foot):
        self.p = Presentation(); self.p.slide_width = Inches(W); self.p.slide_height = Inches(H)
        self.brand, self.foot, self.n = brand, foot, 0

    def slide(self, tag=None, title=None, bg=INK, sub=None):
        s = self.p.slides.add_slide(self.p.slide_layouts[6]); self.n += 1
        s.background.fill.solid(); s.background.fill.fore_color.rgb = rgb(bg)
        self.s, self.dark = s, bg != PAPER
        fg = PAPER if self.dark else INK
        if tag:
            self.mark(MX, 0.5, 0.3)
            self.t(MX + 0.42, 0.47, 6, 0.36, self.brand, 12, fg, bold=True, sp=1)
            self.t(W - MX - 5, 0.47, 5, 0.36, tag, 11, LIME if self.dark else INKMUTE, font=DIN, align='r', sp=3)
            self.t(MX, H - 0.55, 8, 0.3, self.foot, 9, FAINT if self.dark else INKMUTE)
            self.t(W - MX - 2, H - 0.55, 2, 0.3, f'{self.n:02d}', 11, FAINT if self.dark else INKMUTE, font=DIN, align='r')
        if title:
            self.t(MX, 1.05, W - 2 * MX, 0.95, title, 34, fg, bold=True)
        if sub:
            self.t(MX, 1.95, W - 2 * MX, 0.5, sub, 15, MUTE if self.dark else INKMUTE)
        return s

    def box(self, x, y, w, h, fill=None, line=None, lw=0.75, shape=MSO_SHAPE.RECTANGLE):
        sh = self.s.shapes.add_shape(shape, Inches(x), Inches(y), Inches(w), Inches(h))
        sh.shadow.inherit = False
        if fill: sh.fill.solid(); sh.fill.fore_color.rgb = rgb(fill)
        else: sh.fill.background()
        if line: sh.line.color.rgb = rgb(line); sh.line.width = Pt(lw)
        else: sh.line.fill.background()
        return sh

    def poly(self, pts, fill):
        fb = self.s.shapes.build_freeform(Inches(pts[0][0]), Inches(pts[0][1]), scale=1.0)
        fb.add_line_segments([(Inches(a), Inches(b)) for a, b in pts[1:]], close=True)
        sh = fb.convert_to_shape(); sh.shadow.inherit = False
        sh.fill.solid(); sh.fill.fore_color.rgb = rgb(fill); sh.line.fill.background(); return sh

    def mark(self, x, y, size, tile=LIME, bar=INK, cut='8FA82C'):
        """宁序标识：两根竖条 + 一道斜切，合起来是字母 N。"""
        u = size / 120
        r = self.box(x, y, size, size, fill=tile, shape=MSO_SHAPE.ROUNDED_RECTANGLE); r.adjustments[0] = 0.22
        self.box(x + 27 * u, y + 28 * u, 16 * u, 64 * u, fill=bar)
        self.box(x + 77 * u, y + 28 * u, 16 * u, 64 * u, fill=bar)
        self.poly([(x + 48 * u, y + 28 * u), (x + 63 * u, y + 28 * u), (x + 72 * u, y + 92 * u), (x + 57 * u, y + 92 * u)], cut)

    def t(self, x, y, w, h, text, size=14, color=PAPER, bold=False, font=HEI, align='l', sp=0, lh=None, anchor='t'):
        """text 可以是字符串，也可以是 [(文字, {size, color, bold, font, after})...]，每项一段。"""
        tb = self.s.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h)); tf = tb.text_frame
        tf.word_wrap = True; tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
        tf.vertical_anchor = {'t': MSO_ANCHOR.TOP, 'm': MSO_ANCHOR.MIDDLE, 'b': MSO_ANCHOR.BOTTOM}[anchor]
        paras = text if isinstance(text, list) else [(text, {})]
        for i, (txt, o) in enumerate(paras):
            para = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
            para.alignment = {'l': PP_ALIGN.LEFT, 'c': PP_ALIGN.CENTER, 'r': PP_ALIGN.RIGHT}[align]
            if o.get('lh', lh): para.line_spacing = o.get('lh', lh)
            if o.get('after') is not None: para.space_after = Pt(o['after'])
            for j, piece in enumerate(txt.split('\v')):
                if j: para.add_line_break()
                r = para.add_run(); r.text = piece; f = r.font
                sz = o.get('size', size)
                if 11.5 <= sz <= 14: sz = round(sz * 1.18, 1)   # 正文统一放大一档，投屏时看得清
                f.size = Pt(sz); f.bold = o.get('bold', bold); f.color.rgb = rgb(o.get('color', color))
                fn = o.get('font', font); f.name = fn
                rPr = r._r.get_or_add_rPr()
                for tagname in ('a:ea', 'a:cs'):
                    el = rPr.find(qn(tagname))
                    if el is None: el = rPr.makeelement(qn(tagname), {}); rPr.append(el)
                    el.set('typeface', HEI)
                s = o.get('sp', sp)
                if s: rPr.set('spc', str(int(s * 100)))
        return tb

    def card(self, x, y, w, h, tag, title, body, nums=None, hot=False, tsize=20, bsize=12.5):
        self.box(x, y, w, h, fill=INK2, line=LIME if hot else LINE, lw=1.5 if hot else 0.75)
        pad = 0.28
        self.t(x + pad, y + pad - 0.04, w - 2 * pad, 0.3, tag, 10.5, LIME, font=DIN, sp=2, bold=True)
        self.t(x + pad, y + pad + 0.3, w - 2 * pad, 0.5, title, tsize, PAPER, bold=True)
        body = body if isinstance(body, list) else [(body, {})]
        self.t(x + pad, y + pad + 0.3 + tsize / 72 * 1.9, w - 2 * pad, h - 2, [(b, dict({'after': 5}, **o)) for b, o in body], bsize, MUTE, lh=1.25)
        if nums:
            ny = y + h - 0.95
            self.box(x + pad, ny - 0.1, w - 2 * pad, 0.01, fill=LINE)
            nw = (w - 2 * pad) / len(nums)
            for i, (a, b) in enumerate(nums):
                self.t(x + pad + i * nw, ny, nw, 0.45, a, 24, LIME if hot else PAPER, font=DIN, bold=True)
                self.t(x + pad + i * nw, ny + 0.47, nw, 0.3, b, 9.5, MUTE)

    def cols(self, n, gap=0.25):
        w = (W - 2 * MX - gap * (n - 1)) / n
        return [(MX + i * (w + gap), w) for i in range(n)]

    def save(self, name):
        out = ROOT / 'dist' / name; self.p.save(out); print(out)


STEPS = [('定位', '人定', '给谁看、解决什么。只能人来拿主意。'), ('找对标', '人 + AI', '把头部成片拆成版式、字体、节奏和画面规律。'),
         ('选题', '人 + AI', '热点、行业问题、评论区提问进选题池。'), ('脚本', '人 + AI', '反常识观点、支撑、关键词、转化。人审稿。'),
         ('素材', '人 + AI', '人录口播或访谈；没有的画面 AI 找或生成。'), ('剪辑', 'AI', '去重录、去口吃、降噪、调光、排画面、配乐、封面。'),
         ('发布', 'AI', '抖音、视频号、小红书分发，发布前做数据预估。'), ('复盘与承接', '人 + AI', '第三天对数据；询盘交给私域接待助手。')]

CASES = [
    ('直播切片 · MCN', '李洋洋', '情感社交类直播博主', '逆向拆解 43 条 10 万+ 赞切片和 41 组直播原素材，把爆款收敛成 3 种标准模板，做成自动化切片工作流。团队的 10 条反馈全部写进流程，人只把关 3 件事。', [('43', '条爆款逆向拆解'), ('3', '种标准模板'), ('4', '条首批成片')]),
    ('口播剪辑 · 头部博主', '蛋解创业', '抖音商业财经类头部账号', '严格对标现有成片做口播剪辑工作流：原片进去，自动去掉重录和气口、调光、排版式、上花字和数据面板，出片前自查。', [('5', '种版式'), ('7', '种花字'), ('5', '种数据面板')]),
    ('口播剪辑 · 超级个体', '张展鹏', '知识科普类口播创作者', '从粗剪、分镜到成片六步走完，创作者只需要确认三次。字幕、钩子大字、插画场景、论文卡等样式按他的成片复刻成固定模板。', [('6', '步流程'), ('3', '次人工确认')]),
    ('品牌口播 · 企业', '约读书房', '阅读教育品牌', '「品牌包 + 剪辑决定表 + 固定模板」：品牌相框、署名条、八种画面处理固定下来，每期只换内容，不动代码。', [('8', '种画面处理'), ('71', '段画面自动编排')]),
    ('企业介绍片 · 企业', '词元引擎', '电商经营 AI 咨询公司', '客户给一份 24 页的公司介绍 PDF，当天交付一条 3 分 14 秒的企业介绍片和一套 17 页的公司介绍 PPT。', [('1', '天交付'), ('3′14″', '企业介绍片'), ('17', '页 PPT')]),
]
NOTE = '数字来自各项目的方案文档和交付过程中的样片测试，是工作流本身的规格，不代表客户账号的经营数据。'


def case_slide(d, tag, title, items):
    d.slide(tag, title)
    for (x, w), c in zip(d.cols(len(items)), items):
        d.card(x, 2.3, w, 4.1, c[0], c[1], [(c[2], {'color': GOLD, 'size': 11.4}), (c[3], {})], c[4], bsize=11.5 if len(items) == 3 else 12.5)
    d.t(MX, 6.52, W - 2 * MX, 0.3, NOTE, 9, FAINT)


def contact(d, tag, head, lime, body, rows, qrlabel):
    d.slide(tag)
    d.t(MX, 1.7, 8.2, 2.4, [(head, {}), (lime, {'color': LIME})], 46, PAPER, bold=True, lh=1.1)
    d.t(MX, 4.1, 7.6, 0.8, body, 15, MUTE, lh=1.3)
    for i, (k, v) in enumerate(rows):
        d.t(MX, 5.05 + i * 0.4, 1.4, 0.35, k, 12.5, FAINT); d.t(MX + 1.4, 5.05 + i * 0.4, 7, 0.35, v, 12.5, PAPER)
    d.box(9.55, 1.75, 3.0, 3.5, fill=PAPER)
    d.s.shapes.add_picture(QR, Inches(9.75), Inches(1.95), Inches(2.6), Inches(2.6))
    d.t(9.55, 4.72, 3.0, 0.35, qrlabel, 12, INK, bold=True, align='c', sp=1.5)


# ───────────── 公司版 ─────────────
d = Deck('宁序科技  NINGXU', '宁序科技 · 让好内容，按工序生产')
d.slide()
d.mark(MX, 0.75, 0.62); d.t(MX + 0.82, 0.78, 6, 0.4, '宁序科技', 20, PAPER, bold=True, sp=2); d.t(MX + 0.84, 1.14, 6, 0.3, 'NINGXU TECH', 11, MUTE, font=DIN, sp=4)
d.t(MX, 2.3, 12, 2.9, [('让好内容，', {}), ('按工序生产。', {'color': LIME})], 80, PAPER, bold=True, lh=1.05)
d.t(MX, 5.25, 9.2, 0.9, '为 MCN 机构、企业和超级个体搭建 AI 内容生产工作流。从找对标到线索承接，八道工序，一套方法，一个工作台。', 17, MUTE, lh=1.35)
d.t(MX, H - 0.75, 9, 0.3, 'AI CONTENT WORKFLOW  ·  BEIJING  ·  公司介绍 2026', 11, FAINT, font=DIN, sp=3)

d.slide('BRAND', '名字和标识')
d.box(MX, 2.3, 4.6, 4.2, fill=INK2, line=LINE); d.mark(MX + 1.3, 2.75, 2.0)
d.t(MX, 5.05, 4.6, 0.5, '宁序科技', 26, PAPER, bold=True, align='c', sp=4); d.t(MX, 5.6, 4.6, 0.3, 'NINGXU', 12, MUTE, font=DIN, align='c', sp=8)
d.t(5.9, 2.3, 6.7, 4.3, [
    ('「宁」', {'size': 22, 'color': LIME, 'bold': True, 'after': 2}), ('取自创始人陈宁的名字，也是安定、从容。内容团队最缺的就是这份确定性。', {'after': 14}),
    ('「序」', {'size': 22, 'color': LIME, 'bold': True, 'after': 2}), ('工序、秩序、程序。把靠感觉的内容生产，变成一道一道排好的工序。', {'after': 14}),
    ('标识', {'size': 22, 'color': LIME, 'bold': True, 'after': 2}), ('两根竖条加一道斜切，合起来是字母 N。斜切是剪辑里的一刀，也是时间线上的一段素材。', {'after': 14}),
    ('全称：北京宁序科技有限公司（筹）', {'size': 12, 'color': FAINT})], 15, MUTE, lh=1.3)

d.slide('WHAT WE BELIEVE', '内容不该靠运气和加班。它可以是一条生产线。', bg=PAPER)
for (x, w), (k, v) in zip(d.cols(2, 0.5), [('使命', '让每个认真做内容的团队，都拥有一条自己的 AI 内容生产线。'), ('愿景', '把内容生产从个人手艺，变成可以交接、可以迭代的组织能力。')]):
    d.box(x, 2.55, w, 0.03, fill=INK); d.box(x, 2.75, 0.75, 0.34, fill=LIME); d.t(x, 2.75, 0.75, 0.34, k, 12, INK, bold=True, align='c', anchor='m', sp=3)
    d.t(x, 3.3, w, 2.4, v, 30, INK, bold=True, lh=1.25)
d.t(MX, 6.1, W - 2 * MX, 0.5, 'AI 能力大家都买得到。差距在于有没有人把它们接成一条适合你业务的工序，并且让它留在你的公司里。', 13, INKMUTE)

d.slide('VALUES', '四条价值观')
for i, ((x, w), (h, b)) in enumerate(zip(d.cols(4), [
        ('人定方向，\nAI 跑工序', '定位、选题、审美判断留给人；重复的工序交给 AI。人负责打骨架，确认这是一个好的闭环。'),
        ('审美先行', '工作流只解决 40%，剩下 60% 靠审美。每一套模板，都是从头部成片一帧一帧拆出来的。'),
        ('资产留在\n客户手里', '人会走，工作流留在公司。我们交付的是装在你电脑上、写好交接文档的生产线。'),
        ('先拿自己\n做实验', '每一道工序先在自己的账号上跑通，再交给客户。不承诺爆款，只对工序和成片质量负责。')])):
    d.box(x, 2.3, w, 4.1, fill=INK2, line=LINE)
    d.t(x + 0.28, 2.5, 1, 0.6, f'0{i+1}', 30, LIME, font=DIN, bold=True)
    d.t(x + 0.28, 3.25, w - 0.56, 1.1, h.replace('\n', '\v'), 22, PAPER, bold=True, lh=1.15)
    d.t(x + 0.28, 4.5, w - 0.56, 1.8, b, 13, MUTE, lh=1.35)

d.slide('WHO WE SERVE', '三类客户，同一套底层工序')
for (x, w), (n, h, pain, do, give, case) in zip(d.cols(3), [
        ('01 · MCN', '专业 MCN 机构', '账号多、量大。剪辑靠人堆，风格靠感觉，换一个剪辑师就换一种味道。', ['爆款逆向拆解，收敛成标准模板', '直播切片、口播自动化剪辑工作流', '按账号定制风格骨架，一个人管多个号'], '专属剪辑工作流 + 账号模板 + 交接文档', '李洋洋 · 蛋解创业'),
        ('02 · ENTERPRISE', '企业内容生产改造', '想靠短视频做品宣和获客，没有方法论。人一走，经验也跟着走。', ['按八道工序改造整条内容生产线', '创始人 IP、品牌 IP 的内容模板', '内容创作工作台和私域接待承接'], '企业自己拥有的生产线 + 培训与陪跑', '约读书房 · 词元引擎'),
        ('03 · CREATOR', '做内容的超级个体', '一个人既要想选题、又要录、还要剪。时间都花在剪辑上。', ['开箱即用的 AI 剪辑工作流', '知识星球：模板组件持续更新和答疑', '两天一夜线下培训，现场跑通流程'], '自己跑通的工作流 + 专属模板', '张展鹏')]):
    d.box(x, 2.3, w, 4.5, fill=INK2, line=LINE); p = 0.28
    d.t(x + p, 2.48, w, 0.3, n, 10.5, LIME, font=DIN, bold=True, sp=2); d.t(x + p, 2.78, w - 2 * p, 0.5, h, 22, PAPER, bold=True)
    d.t(x + p, 3.4, w - 2 * p, 3, [('卡点', {'size': 9.5, 'color': FAINT, 'bold': True, 'sp': 2, 'after': 1}), (pain, {'after': 8}),
                                   ('我们做什么', {'size': 9.5, 'color': FAINT, 'bold': True, 'sp': 2, 'after': 1})] + [('▪ ' + i, {'after': 1}) for i in do] +
        [('交付', {'size': 9.5, 'color': FAINT, 'bold': True, 'sp': 2, 'after': 1}), (give, {'color': PAPER, 'bold': True, 'after': 6}), ('代表项目：' + case, {'color': GOLD, 'size': 11})], 11.5, MUTE, lh=1.2)

d.slide('THE METHOD', '八道工序：从找对标，到线索承接')
cw, ch = (W - 2 * MX) / 4, 1.9
for i, (n, who, b) in enumerate(STEPS):
    x, y = MX + (i % 4) * cw, 2.25 + (i // 4) * ch
    d.box(x, y, cw, ch, line=LINE)
    d.t(x + 0.22, y + 0.16, 1, 0.5, f'0{i+1}', 22, LIME, font=DIN, bold=True)
    ai = who == 'AI'; tw = 0.55 if ai else (0.62 if who == '人定' else 0.9)
    d.box(x + cw - tw - 0.2, y + 0.2, tw, 0.27, fill=LIME if ai else None, line=None if ai else GOLD)
    d.t(x + cw - tw - 0.2, y + 0.2, tw, 0.27, who, 9.5, INK if ai else GOLD, bold=True, align='c', anchor='m')
    d.t(x + 0.22, y + 0.66, cw - 0.4, 0.4, n, 19, PAPER, bold=True); d.t(x + 0.22, y + 1.1, cw - 0.44, 0.75, b, 11.5, MUTE, lh=1.25)
d.box(MX, 6.2, 0.05, 0.42, fill=LIME); d.t(MX + 0.2, 6.2, W - 2 * MX, 0.42, '这是一个环：第八道的复盘结论回到第三道选题。拼的是每周都知道下一条该怎么改。', 12.5, MUTE, anchor='m')

d.slide('PRODUCTS', '工序背后的四件工具')
for (x, w), (n, h, b, nums) in zip(d.cols(4), [
        ('剪辑', 'AI 剪辑工作流', '你给原片或录音，它交出能发的成片。出镜的竖屏口播、不出镜的横屏解读，两条生产线。', [('6', '套风格'), ('298', '个组件')]),
        ('运营', '内容创作工作台', '一个界面管抖音、视频号、小红书：定位、周计划、创作、发布、采集、复盘。', [('3', '个平台'), ('5', '段漏斗')]),
        ('输入', '百灵 Mynah', '连着知识库的语音输入。写对你的人名、产品名和行业词，改过一次以后都对。', None),
        ('承接', '私域接待助手', '内容带来的询盘，由接上业务知识库的 AI 助理先接待，再跟进到人工。', None)]):
    d.card(x, 2.3, w, 4.1, n, h, b, nums, tsize=19, bsize=12.5)

case_slide(d, 'CASES · 1/2', '我们做过的：MCN 与头部博主', CASES[:2])
case_slide(d, 'CASES · 2/2', '我们做过的：企业与超级个体', CASES[2:])

d.slide('HOW WE WORK', '三种合作方式')
for (x, w), (n, h, b, nums) in zip(d.cols(3), [
        ('A · 你们自己跑', '培训', '企业派 1 到 2 个人，或创作者本人，参加两天一夜线下小班。用自己的原片和账号现场搭出流程。', [('¥6,980', '每人 · 线下小班')]),
        ('B · 我们来搭', '工作流定制', '按你的对标和业务搭好生产线，出第一批成片，连同交接文档交给你的团队。适合 MCN 和企业。', [('项目制', '按账号数和工序范围报价')]),
        ('C · 一起迭代', '持续迭代', '模板、组件和工作流持续更新。平台风向变了，对标换了，生产线跟着升级。', [('社群 / 年度', '个人走知识星球，企业另议')])]):
    d.card(x, 2.25, w, 3.2, n, h, b, nums, bsize=11.4)
for i, ((x, w), (h, b)) in enumerate(zip(d.cols(5, 0.2), [('诊断', '找到最卡的那道工序'), ('拆对标', '逆向拆出模板'), ('搭线', '装到你的电脑上'), ('跑第一批', '真实原片出成片'), ('交接', '文档 + 第一次复盘')])):
    d.box(x, 5.72, w, 0.03, fill=LIME); d.t(x, 5.84, w, 0.9, [(f'0{i+1}  {h}', {'size': 15, 'color': PAPER, 'bold': True, 'after': 2}), (b, {})], 11.5, MUTE)

d.slide('FOUNDER', '创始人')
d.box(MX, 2.3, 4.2, 4.2, fill=INK2, line=LINE); d.box(MX + 0.35, 2.65, 0.95, 0.95, fill=LIME); d.t(MX + 0.35, 2.65, 0.95, 0.95, '宁', 34, INK, bold=True, align='c', anchor='m')
d.t(MX + 0.35, 3.85, 3.6, 2.5, [('陈宁（宁少）', {'size': 24, 'color': PAPER, 'bold': True, 'after': 4}), ('宁序科技创始人\n「宁少 AI 进化论」主理人'.replace('\n', '\v'), {'after': 12}),
                               ('中国人民大学校友企业家理事', {'size': 11.5}), ('山东财经大学创新创业导师', {'size': 11.5}), ('重庆大学 MBA 课堂分享嘉宾', {'size': 11.5})], 13, MUTE, lh=1.3)
d.t(5.5, 2.3, 7.1, 4.3, [('先做了十多年企业，再做 AI。所以我们交付的是能在真实业务里跑起来的工序。', {'size': 22, 'color': PAPER, 'bold': True, 'after': 16, 'lh': 1.3}),
                         ('2011 年加入联想，做渠道销售管理和电商运营，是联想集团最年轻的「联想英雄」个人和团队获得者。', {'after': 8}),
                         ('2015 年联合创办一家消费品新零售企业，十年做到全国 2000 多家门店，连续五年入选胡润全球独角兽榜。', {'after': 8}),
                         ('这两年先用 AI 改造自己的企业，再把自己的内容生产一步步交给 AI，在自己的账号上跑通之后，开始帮 MCN、企业和创作者搭生产线。', {})], 14, MUTE, lh=1.4)

contact(d, 'CONTACT', '发一条成片过来，', '我们先拆给你看。', '无论你是 MCN、企业，还是一个人做内容，都可以从一次对标拆解开始。',
        [('公司', '北京宁序科技有限公司（筹）'), ('所在地', '北京'), ('内容账号', '宁少AI进化论（抖音 / 视频号 / 小红书）')], '微信扫码 · 聊聊合作')
d.save('宁序科技-公司介绍.pptx')

# ───────────── 个人版 ─────────────
d = Deck('宁少 AI 进化论', '宁少 AI 进化论 · 陪伴 AI 时代的超级个体')
d.slide()
d.mark(MX, 0.75, 0.62); d.t(MX + 0.82, 0.78, 6, 0.4, '宁少 AI 进化论', 20, PAPER, bold=True, sp=2); d.t(MX + 0.84, 1.14, 8, 0.3, '陈宁 · 陪伴 AI 时代的超级个体', 11.5, MUTE, sp=2)
d.t(MX, 2.3, 12, 2.9, [('一个人，', {}), ('一条内容生产线。', {'color': LIME})], 80, PAPER, bold=True, lh=1.05)
d.t(MX, 5.25, 9.4, 0.9, '我拿自己做实验，把内容生产一步步交给 AI：选题我来定，剩下的它来做。跑通的工作流，我拿出来教人，也帮 MCN 和企业搭。', 17, MUTE, lh=1.35)
d.t(MX, H - 0.75, 9, 0.3, '个人与产品介绍 2026', 11, FAINT, sp=3)

d.slide('ABOUT', '先做了十多年企业，再来做 AI')
d.box(MX, 2.3, 3.9, 4.2, fill=INK2, line=LINE); d.box(MX + 0.35, 2.65, 0.95, 0.95, fill=LIME); d.t(MX + 0.35, 2.65, 0.95, 0.95, '宁', 34, INK, bold=True, align='c', anchor='m')
d.t(MX + 0.35, 3.85, 3.3, 2.5, [('陈宁（宁少）', {'size': 24, 'color': PAPER, 'bold': True, 'after': 4}), ('宁序科技创始人\v「宁少 AI 进化论」主理人', {'after': 12}),
                               ('中国人民大学校友企业家理事', {'size': 11.5}), ('山东财经大学创新创业导师', {'size': 11.5}), ('消费品创业者 · 企业 AI 应用实践者', {'size': 11.5})], 13, MUTE, lh=1.3)
for i, (yr, h, b) in enumerate([('2011', '加入联想', '做渠道销售管理和电商运营，是联想集团最年轻的「联想英雄」个人和团队获得者。'),
                                ('2015', '联合创办消费品新零售企业', '十年，全国 2000 多家门店，连续五年入选胡润全球独角兽榜。'),
                                ('近两年', '用 AI 改造自己的企业', '老办法的增长慢了，所以去找新的答案。从管理流程到内容生产，一块一块交给 AI。'),
                                ('2026', '把内容生产线做成产品', '为蛋解创业、李洋洋、张展鹏等账号搭剪辑工作流；11 月受邀到重庆大学 MBA 课堂分享。')]):
    y = 2.3 + i * 1.07
    d.t(5.1, y, 1.3, 0.5, yr, 22, LIME, font=DIN, bold=True); d.box(6.4, y + 0.08, 0.02, 0.85, fill=LINE)
    d.t(6.65, y, 5.95, 1.0, [(h, {'size': 17, 'color': PAPER, 'bold': True, 'after': 2}), (b, {})], 12, MUTE, lh=1.25)

d.slide('WHAT I BELIEVE', '我常说的几句话', bg=PAPER)
Q = [('不是 all in AI，而是 AI in all。', 'AI 只是手段，不是目的。'), ('过去是他说我做，现在是我说它做。', '从「我问它答」变成了「我说它做」。'),
     ('选题，是整条链路里唯一需要我拿主意的地方。', '你只需要想清楚给谁创造什么价值。'), ('值钱的从来不是代码，是你拿它做出了什么。', '所以工具我愿意免费给。'),
     ('把自己当成一个创业者。', '从岗位思维，转向任务思维。'), ('人会走，工作流留在公司。', '个体提效，不等于组织提效。')]
for i, (q, c) in enumerate(Q):
    (x, w) = d.cols(2, 0.5)[i % 2]; y = 2.25 + (i // 2) * 1.45
    d.box(x, y, w, 0.02, fill=INK); d.t(x, y + 0.2, w, 1.2, [(q, {'size': 19, 'color': INK, 'bold': True, 'after': 3}), (c, {})], 12, INKMUTE, lh=1.2)

d.slide('WHO I HELP', '我帮三类人')
for (x, w), (n, h, b) in zip(d.cols(3), [('01', '做内容的超级个体', '想一个人把选题到成片都做完。从免费包开始，进星球持续更新，或者来线下两天把自己的流程跑通。'),
                                         ('02', '想做内容的企业', '创始人 IP 或品牌 IP。派 1 到 2 个人来培训，现场搭出自己的自动化流程，一个人管多个号。'),
                                         ('03', '专业 MCN 机构', '账号多、量大，要的是按账号定制的工作流。这部分由我的公司宁序科技以项目制交付。')]):
    d.card(x, 2.3, w, 3.2, n, h, b, bsize=13.5)

d.slide('PRODUCTS', '三档产品，从免费到面对面')
for (x, w), (lab, price, h, who, items, hot) in zip(d.cols(3), [
        ('自己动手', '¥0', '免费工作流包', '适合想先试一试的人', ['口播剪辑完整流程', '2 套风格 · 56 个基础组件', '去重录、去口吃、降噪、调光、配乐'], False),
        ('持续跟上 · 早鸟价', '¥980', '知识星球「AI获客工坊」', '适合想长期用 AI 做内容的个体和小团队', ['全部 6 套风格，每天有新模板', '全部 298 个动效组件和演示工程', '持续更新 + 提问答疑'], True),
        ('面对面 · 线下小班', '¥6,980', 'AI 内容工作流培训', '两天一夜，全程动手', ['带走你自己跑通的工作流', '按你对标做的专属模板', '现场做出的成片 + 内容创作工作台'], False)]):
    d.box(x, 2.3, w, 4.2, fill=INK2, line=LIME if hot else LINE, lw=1.5 if hot else 0.75); p = 0.3
    d.t(x + p, 2.5, w, 0.3, lab, 11, MUTE, bold=True, sp=2)
    d.t(x + p, 2.82, w - 2 * p, 0.95, price, 50, LIME if hot else PAPER, font=DIN, bold=True)
    d.t(x + p, 3.9, w - 2 * p, 2.5, [(h, {'size': 18, 'color': PAPER, 'bold': True, 'after': 2}), (who, {'after': 10})] + [('▪ ' + i, {'color': PAPER, 'after': 3}) for i in items], 12.5, MUTE, lh=1.25)

d.slide('¥980', '知识星球「AI获客工坊」')
d.t(MX, 2.3, 4.3, 1.3, '¥980', 88, LIME, font=DIN, bold=True)
d.t(MX, 3.85, 4.3, 2.6, [('早鸟价 · 按人数涨价', {'size': 16, 'color': PAPER, 'bold': True, 'after': 6}), ('前 100 人 ¥980，满 100 人后 ¥2,980，之后继续随人数上调。', {'after': 12}),
                         ('适合谁', {'size': 16, 'color': PAPER, 'bold': True, 'after': 6}), ('想长期用 AI 做内容、需要有人答疑的超级个体和小团队。', {})], 13, MUTE, lh=1.35)
for i, (h, b) in enumerate([('全部 6 套剪辑风格', '加上每天新做的模板'), ('纯内容生产线', '不出镜也能出片'), ('全部 298 个动效组件', '含演示工程'), ('工作流持续更新', '新版本在星球里拿'), ('提问答疑', '帮你把工作流调成适合自己业务的')]):
    y = 2.3 + i * 0.84
    d.box(5.6, y, 7.0, 0.72, fill=INK2, line=LINE); d.t(5.85, y, 0.6, 0.72, f'0{i+1}', 16, LIME, font=DIN, bold=True, anchor='m')
    d.t(6.5, y, 2.9, 0.72, h, 15.5, PAPER, bold=True, anchor='m'); d.t(9.4, y, 3.1, 0.72, b, 12, MUTE, anchor='m')

d.slide('¥6,980', 'AI 内容工作流培训：两天一夜，带着你直接搞出来')
d.t(MX, 2.15, 4.2, 1.0, [('¥6,980', {})], 58, LIME, font=DIN, bold=True)
d.t(MX + 3.35, 2.62, 3, 0.4, '原价 ¥9,800 · 线下小班', 12.5, MUTE)
d.t(7.4, 2.25, 5.2, 0.9, '不讲概念，全程动手。每个人用自己的原片、自己的账号、自己的行业来做。', 13.5, MUTE, lh=1.35)
for (x, w), (t1, h, b) in zip(d.cols(5, 0.15), [('第一天 · 上午', '跑通第一条', '装好环境，用自己的原片出第一条成片'), ('第一天 · 下午', '定你自己的风格', '拆你的对标账号，做成专属模板'), ('第一天 · 晚上', '共创夜', '每人一条成片，一对一过片'),
                                                ('第二天 · 上午', '不出镜和一人多号', '纯内容生产线，批量出片'), ('第二天 · 下午', '接上工作台，带走流程', '企业学员现场写交接文档')]):
    d.box(x, 3.4, w, 1.55, fill=INK2, line=LINE)
    d.t(x + 0.18, 3.52, w - 0.3, 1.4, [(t1, {'size': 10, 'color': LIME, 'bold': True, 'after': 3}), (h, {'size': 14.5, 'color': PAPER, 'bold': True, 'after': 3}), (b, {})], 10.5, MUTE, lh=1.2)
d.t(MX, 5.2, 5.9, 1.3, [('走的时候你手里有', {'size': 14, 'color': PAPER, 'bold': True, 'after': 4}), ('▪ 自己跑通的 AI 剪辑工作流，装在你电脑上', {}), ('▪ 按你对标的博主做出来的专属模板', {}), ('▪ 现场做出的成片，和内容创作工作台', {})], 12, MUTE, lh=1.25)
d.t(7.0, 5.2, 5.6, 1.3, [('谁来学', {'size': 14, 'color': PAPER, 'bold': True, 'after': 4}), ('▪ 超级个体：从选题到成片一个人完成', {}), ('▪ 企业：现场搭出自动化流程，一个人管 N 个号', {}), ('小班制，报名需先付款锁定名额；时间地点在知识星球公布', {'color': FAINT, 'size': 10.5})], 12, MUTE, lh=1.25)

case_slide(d, 'CASES · 1/2', '我帮他们搭过生产线', CASES[:3])
case_slide(d, 'CASES · 2/2', '我帮他们搭过生产线', CASES[3:])

d.slide('TALKS', '讲课与分享')
(x1, w1), (x2, w2) = d.cols(2)
d.card(x1, 2.3, w1, 4.1, '2026.11 · 重庆大学', 'AI 时代，个体如何打怪升级', [('从个人 IP 聊起', {'color': GOLD}), ('面向 MBA 课堂，现场 60 多位在职的企业中层。整套课件是用 AI 做的互动网页，一共 55 页，一行代码都不是我写的。', {})], [('60+', '位 MBA 同学'), ('55', '页互动课件')], bsize=13.5)
d.card(x2, 2.3, w2, 4.1, '可以讲的主题', '企业和机构可以约的三个题目', [('给个人：AI 时代，个体如何打怪升级', {'color': PAPER, 'after': 10}), ('给企业家：企业内容生产线——人定方向，AI 跑工序'.replace('——', '：'), {'color': PAPER, 'after': 10}), ('给内容团队：AI 剪辑工作流实操，两天一夜版', {'color': PAPER, 'after': 10}), ('不讲概念，讲我自己是怎么做的，现场演示。', {})], bsize=13.5)

contact(d, 'CONTACT', '想跟上，', '就一起进化。', '尝试 AI 转型的创业者、做内容的同行，加个微信聊聊。',
        [('内容账号', '宁少AI进化论（抖音 / 视频号 / 小红书）'), ('知识星球', 'AI获客工坊'), ('公司合作', '宁序科技 NINGXU')], '微信扫码 · 加宁少')
d.save('宁少-个人介绍.pptx')
