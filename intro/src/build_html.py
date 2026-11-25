#!/usr/bin/env python3
"""生成 dist/company.html 和 dist/personal.html（单文件，样式、字体、二维码都内嵌）。改文案改这里，再跑一次。"""
import base64, pathlib, subprocess

ROOT = pathlib.Path(__file__).resolve().parent.parent
REPO = ROOT.parent
css = (ROOT / 'src/style.css').read_text()
din = subprocess.run(['git', '-C', str(REPO), 'show', 'origin/claude/video-editing-workflow-merge-ok25mz:site/assets/fonts/ddin.otf'], capture_output=True).stdout
if not din:
    din = pathlib.Path.home().joinpath('.fonts/ddin.otf').read_bytes()
css = css.replace('__DIN__', base64.b64encode(din).decode())
qr = 'data:image/png;base64,' + base64.b64encode((REPO / 'site/assets/qr.png').read_bytes()).decode()

MARK = '<svg viewBox="0 0 120 120" aria-hidden="true"><rect width="120" height="120" rx="26" fill="#D6FF3D"/><rect x="27" y="28" width="16" height="64" fill="#0A0A0B"/><rect x="77" y="28" width="16" height="64" fill="#0A0A0B"/><polygon points="48,28 63,28 72,92 57,92" fill="#0A0A0B" fill-opacity=".38"/></svg>'

STEPS = [
    ('定位', '给谁看、解决什么', '人定', '讲清楚给谁创造什么价值。这一步只能人来拿主意。', ['人：拿主意']),
    ('找对标', '拆头部成片', '人 + AI', '找到值得学的头部账号，把成片逆向拆成版式、字体、节奏和画面规律。', ['人：选对标', 'AI：拆解']),
    ('选题', '每周选题池', '人 + AI', '热点、行业问题、评论区提问进选题池，上一轮复盘的结论回到这里。', ['人：拍板', 'AI：备选']),
    ('脚本', '结构化成稿', '人 + AI', '按「反常识观点、支撑、关键词、转化」的结构出稿，人审稿。', ['人：审稿', 'AI：起草']),
    ('素材', '原片与画面', '人 + AI', '人录口播或接受访谈；没有的画面，AI 去找或直接生成。', ['人：出镜', 'AI：找素材']),
    ('剪辑', '原片进，成片出', 'AI', '去重录、去口吃、降噪、调光、排画面、配乐、出封面，最后自查。', ['AI：全流程', '人：过片']),
    ('发布', '多平台分发', 'AI', '抖音、视频号、小红书分发，发布前做一次数据预估。', ['AI：执行']),
    ('复盘与承接', '数据回到选题', '人 + AI', '发布第三天对数据，找出最弱的一环；询盘交给私域接待助手。', ['AI：对数', '人：定下一步']),
]

def line8():
    return '<ol class="line8" aria-label="八道工序">' + ''.join(
        f'<li><small>0{i+1}</small><b>{s[0]}</b><span>{s[2]}</span></li>' for i, s in enumerate(STEPS)) + '</ol>'

def steps():
    out = []
    for i, s in enumerate(STEPS):
        chips = ''.join(f'<span class="chip {"ai" if c.startswith("AI") else "hu"}">{c}</span>' for c in s[4])
        out.append(f'<div><small>0{i+1}</small><h3>{s[0]}</h3><p>{s[3]}</p><div class="r">{chips}</div></div>')
    return '<div class="steps">' + ''.join(out) + '</div>'

CASES = [
    ('直播切片 · MCN', '李洋洋', '情感社交类直播博主',
     '逆向拆解 43 条 10 万+ 赞切片和 41 组直播原素材，把爆款收敛成 3 种标准模板，做成自动化切片工作流。团队提的 10 条反馈全部写进流程，人只把关 3 件事：发哪几条、花字对不对味、要不要补二创。',
     [('43', '条爆款逆向拆解'), ('3', '种标准模板'), ('4', '条首批成片')]),
    ('口播剪辑 · 头部博主', '蛋解创业', '抖音商业财经类头部账号',
     '严格对标现有成片做口播剪辑工作流：原片进去，自动去掉重录和气口、调光、排版式、上花字和数据面板，出片前自查。',
     [('5', '种版式'), ('7', '种花字'), ('5', '种数据面板')]),
    ('口播剪辑 · 超级个体', '张展鹏', '知识科普类口播创作者',
     '从粗剪、分镜到成片六步走完，创作者只需要确认三次。宋体字幕、钩子大字、插画场景、论文卡等样式都按他的成片复刻成固定模板。',
     [('6', '步流程'), ('3', '次人工确认')]),
    ('品牌口播 · 企业', '约读书房', '阅读教育品牌',
     '「品牌包 + 剪辑决定表 + 固定模板」：品牌相框、署名条、八种画面处理固定下来，每期只换内容，不动代码。样片 4 分 39 秒，71 段画面由流程自动排出。',
     [('8', '种画面处理'), ('71', '段画面自动编排')]),
    ('企业介绍片 · 企业', '词元引擎', '电商经营 AI 咨询公司',
     '客户给一份 24 页的公司介绍 PDF，当天交付一条 3 分 14 秒的企业介绍片和一套 17 页的公司介绍 PPT。',
     [('1', '天交付'), ('3′14″', '企业介绍片'), ('17', '页 PPT')]),
]

def cases(a=0, b=5):
    out = []
    for tag, name, who, body, nums in CASES[a:b]:
        ns = ''.join(f'<div><b>{a}</b><span>{b}</span></div>' for a, b in nums)
        out.append(f'<article class="box case"><div class="n">{tag}</div><h3>{name}</h3><div class="who-is">{who}</div><p>{body}</p><div class="nums">{ns}</div></article>')
    return ''.join(out)

CASE_NOTE = '<p class="fine">数字来自各项目的方案文档和交付过程中的样片测试，是工作流本身的规格，不代表客户账号的经营数据。</p>'

def page(title, desc, body):
    return f'''<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<meta name="description" content="{desc}">
<style>
{css}
</style>
</head>
<body>
{body}
</body>
</html>
'''

# ───────────────────────── 公司版 ─────────────────────────
company = f'''
<header class="nav"><div class="in">
  <a class="brand" href="#top">{MARK}<span>宁序科技</span><small>NINGXU</small></a>
  <nav><a href="#believe">我们相信</a><a href="#who">服务对象</a><a href="#method">八道工序</a><a href="#products">产品</a><a href="#cases">案例</a><a href="#about">创始人</a></nav>
  <a class="btn lime sm" href="#contact">聊聊合作</a>
</div></header>

<section class="hero" id="top"><div class="in">
  <div class="kicker"><b></b>NINGXU TECH · AI CONTENT WORKFLOW · BEIJING</div>
  <h1><span>让好内容，</span><span class="lime">按工序生产。</span></h1>
  <p class="lead">宁序科技为 <b>MCN 机构、企业和超级个体</b>搭建 AI 内容生产工作流。从找对标到线索承接，八道工序，一套方法，一个工作台。<b>谁来做都行，产出要能持续。</b></p>
  <div class="cta"><a class="btn lime" href="#contact">聊聊你的内容生产线 <i>→</i></a><a class="btn ghost" href="#cases">看我们做过的</a></div>
  {line8()}
  <ul class="stats">
    <li><b>8</b><span>道工序，一条完整生产线</span></li>
    <li><b>298</b><span>个动效组件</span></li>
    <li><b>6</b><span>套头部博主剪辑风格</span></li>
    <li><b>59</b><span>款可商用字体</span></li>
  </ul>
</div></section>

<section class="sec paper" id="believe"><div class="in">
  <div class="head"><span class="tag">WHAT WE BELIEVE</span><h2>内容不该靠运气和加班。它可以是一条生产线。</h2>
  <p>识别、剪辑、生成，这些 AI 能力大家都买得到。差距在于有没有人把它们接成一条适合你业务的工序，并且让它留在你的公司里。</p></div>
  <div class="mv">
    <div><small>使命</small><p>让每个认真做内容的团队，都拥有一条<mark>自己的 AI 内容生产线</mark>。</p></div>
    <div><small>愿景</small><p>把内容生产从<mark>个人手艺</mark>，变成可以交接、可以迭代的<mark>组织能力</mark>。</p></div>
  </div>
  <div class="vals">
    <div><i>01</i><h3>人定方向，AI 跑工序</h3><p>定位、选题、审美判断留给人；重复的工序交给 AI。人负责打骨架，确认这是一个好的闭环。</p></div>
    <div><i>02</i><h3>审美先行</h3><p>工作流只解决 40%，剩下 60% 靠审美。每一套模板，都是从头部成片一帧一帧拆出来的。</p></div>
    <div><i>03</i><h3>资产留在客户手里</h3><p>人会走，工作流留在公司。我们交付的是装在你电脑上、写好交接文档的生产线。</p></div>
    <div><i>04</i><h3>先拿自己做实验</h3><p>每一道工序先在自己的账号上跑通，再交给客户。不承诺爆款，只对工序和成片质量负责。</p></div>
  </div>
</div></section>

<section class="sec" id="who"><div class="in">
  <div class="head"><span class="tag">WHO WE SERVE</span><h2>三类客户，同一套底层工序</h2><p>规模不同，卡点不同，交付的深度也不同。</p></div>
  <div class="who">
    <article><span class="n">01 · MCN</span><h3>专业 MCN 机构</h3>
      <dl><div><dt>卡点</dt><dd>账号多，切片和口播的量大。剪辑靠人堆，风格靠感觉，换一个剪辑师就换一种味道。</dd></div>
      <div><dt>我们做什么</dt><dd><ul><li>爆款逆向拆解，收敛成可复用的标准模板</li><li>直播切片、口播的自动化剪辑工作流</li><li>按账号定制风格骨架，一个人管多个号</li></ul></dd></div>
      <div><dt>交付</dt><dd><b>专属剪辑工作流 + 账号模板 + 交接文档</b></dd></div></dl>
      <p class="case">代表项目：<b>李洋洋</b> 直播切片 · <b>蛋解创业</b> 口播剪辑</p></article>
    <article><span class="n">02 · ENTERPRISE</span><h3>企业内容生产改造</h3>
      <dl><div><dt>卡点</dt><dd>想靠短视频做品宣和获客，没有方法论。养一个内容团队成本高，人一走，经验也跟着走。</dd></div>
      <div><dt>我们做什么</dt><dd><ul><li>按八道工序改造整条内容生产线</li><li>创始人 IP、品牌 IP 的内容模板</li><li>内容创作工作台和私域接待承接</li></ul></dd></div>
      <div><dt>交付</dt><dd><b>企业自己拥有的生产线 + 团队培训与陪跑</b></dd></div></dl>
      <p class="case">代表项目：<b>约读书房</b> 品牌口播 · <b>词元引擎</b> 企业介绍片</p></article>
    <article><span class="n">03 · CREATOR</span><h3>做内容的超级个体</h3>
      <dl><div><dt>卡点</dt><dd>一个人既要想选题、又要录、还要剪。时间都花在剪辑上，没精力想内容。</dd></div>
      <div><dt>我们做什么</dt><dd><ul><li>开箱即用的 AI 剪辑工作流</li><li>知识星球：模板、组件持续更新和答疑</li><li>两天一夜线下培训，现场跑通自己的流程</li></ul></dd></div>
      <div><dt>交付</dt><dd><b>自己跑通的工作流 + 按对标做的专属模板</b></dd></div></dl>
      <p class="case">代表项目：<b>张展鹏</b> 知识科普口播 · 详见 <a href="personal.html#products"><b>宁少 AI 进化论 →</b></a></p></article>
  </div>
</div></section>

<section class="sec alt" id="method"><div class="in">
  <div class="head"><span class="tag">THE METHOD</span><h2>八道工序：从找对标，到线索承接</h2><p>每道工序都写清楚谁来做：哪些必须人拿主意，哪些交给 AI。</p></div>
  {steps()}
  <p class="loop"><b>这是一个环。</b>第八道的复盘结论回到第三道选题。做内容拼到最后，拼的是每周都知道下一条该怎么改。</p>
</div></section>

<section class="sec" id="products"><div class="in">
  <div class="head"><span class="tag">PRODUCTS</span><h2>工序背后的四件工具</h2><p>都是先给自己用，再拿出来交付的。</p></div>
  <div class="grid2">
    <article class="box"><div class="n">剪辑</div><h3>AI 剪辑工作流</h3><p>你给原片或录音，它交出能发的成片。去重录、去口吃、降噪、调光、配乐、封面一步到位。<b>两条生产线</b>：出镜的竖屏口播，和不出镜的横屏解读。</p>
      <div class="nums"><div><b>6</b><span>套剪辑风格</span></div><div><b>298</b><span>个动效组件</span></div><div><b>59</b><span>款可商用字体</span></div></div></article>
    <article class="box"><div class="n">运营</div><h3>内容创作工作台</h3><p>一个界面管抖音、视频号、小红书：定位、周计划、创作、发布、数据采集、复盘。漏斗里第一个偏弱的环节，就是这周唯一要改的事。</p>
      <div class="nums"><div><b>3</b><span>个平台</span></div><div><b>5</b><span>段漏斗复盘</span></div></div></article>
    <article class="box"><div class="n">输入</div><h3>百灵 Mynah 语音输入</h3><p>连着你的知识库，越说越懂你。按住说话，松开出字；它读你的笔记，写对你的人名、产品名和行业词，改过一次的地方以后都对。</p></article>
    <article class="box"><div class="n">承接</div><h3>私域接待助手</h3><p>内容带来的询盘，由接上业务知识库的 AI 助理先接待：介绍产品、回答常见问题、跟进到人工。</p></article>
  </div>
</div></section>

<section class="sec alt" id="cases"><div class="in">
  <div class="head"><span class="tag">CASES</span><h2>我们做过的</h2><p>从头部 MCN 账号，到企业品牌，到一个人的口播号。</p></div>
  <div class="grid3">{cases()}
    <article class="box"><div class="n">你的项目</div><h3>下一个，可以是你</h3><p>发一条你现在的成片，或者一个你想对标的账号。我们先拆给你看，再谈怎么做。</p><p style="margin-top:18px"><a class="btn ghost sm" href="#contact">聊聊合作 <i>→</i></a></p></article>
  </div>
  {CASE_NOTE}
</div></section>

<section class="sec" id="work"><div class="in">
  <div class="head"><span class="tag">HOW WE WORK</span><h2>三种合作方式</h2></div>
  <div class="grid3">
    <article class="box"><div class="n">A · 你们自己跑</div><h3>培训</h3><p>企业派 1 到 2 个人，或者创作者本人，参加两天一夜的线下小班。用自己的原片、自己的账号现场搭出流程，带回去用。</p><div class="nums"><div><b>¥6,980</b><span>每人 · 线下小班</span></div></div></article>
    <article class="box"><div class="n">B · 我们来搭</div><h3>工作流定制</h3><p>我们按你的对标和业务搭好生产线，出第一批成片，再连同交接文档一起交给你的团队。适合 MCN 和企业。</p><div class="nums"><div><b>项目制</b><span>按账号数和工序范围报价</span></div></div></article>
    <article class="box"><div class="n">C · 一起迭代</div><h3>持续迭代</h3><p>模板、组件和工作流持续更新。平台的风向变了，对标换了，生产线跟着升级。</p><div class="nums"><div><b>社群 / 年度</b><span>个人走知识星球，企业另议</span></div></div></article>
  </div>
  <ol class="flow">
    <li><b>诊断</b><span>看现有成片和流程，找到最卡的那道工序</span></li>
    <li><b>拆对标</b><span>选定对标账号，逆向拆出模板</span></li>
    <li><b>搭线</b><span>把工作流装到你的电脑上</span></li>
    <li><b>跑第一批</b><span>用你的真实原片出成片，按反馈改</span></li>
    <li><b>交接</b><span>交接文档 + 第一次复盘</span></li>
  </ol>
</div></section>

<section class="sec alt" id="about"><div class="in">
  <div class="head"><span class="tag">FOUNDER</span><h2>创始人</h2></div>
  <div class="bio">
    <div class="card-me"><div class="av">宁</div><h3>陈宁<small>宁少</small></h3><p>宁序科技创始人 ·「宁少 AI 进化论」主理人</p>
      <ul><li>中国人民大学校友企业家理事</li><li>山东财经大学创新创业导师</li><li>重庆大学 MBA 课堂分享嘉宾</li></ul></div>
    <div>
      <p style="font-size:clamp(18px,1.7vw,24px);font-weight:900;line-height:1.5">先做了十多年企业，再做 AI。所以我们交付的是能在真实业务里跑起来的工序。</p>
      <p style="color:var(--mute);margin-top:16px;max-width:40em">2011 年加入联想，做渠道销售管理和电商运营，是联想集团最年轻的「联想英雄」个人和团队获得者。2015 年联合创办一家消费品新零售企业，十年做到全国 2000 多家门店，连续五年入选胡润全球独角兽榜。</p>
      <p style="color:var(--mute);margin-top:12px;max-width:40em">这两年他先用 AI 改造自己的企业，再把自己的内容生产一步步交给 AI，在自己的账号上跑通之后，开始帮 MCN、企业和创作者搭生产线。</p>
      <p style="margin-top:22px"><a class="btn ghost sm" href="personal.html">看宁少的个人页 <i>→</i></a></p>
    </div>
  </div>
</div></section>

<section class="sec" id="contact"><div class="in contact">
  <div><span class="tag">CONTACT</span><h2>发一条成片过来，<em>我们先拆给你看。</em></h2>
    <p>无论你是 MCN、企业，还是一个人做内容，都可以从一次对标拆解开始。</p>
    <dl><dt>公司</dt><dd>北京宁序科技有限公司（筹）</dd><dt>所在地</dt><dd>北京</dd><dt>内容账号</dt><dd>宁少AI进化论（抖音 / 视频号 / 小红书）</dd></dl></div>
  <div class="qr"><img src="{qr}" alt="创始人陈宁的微信二维码"><span>微信扫码 · 聊聊合作</span></div>
</div></section>

<footer><div class="in"><span>© 2026 宁序科技 NINGXU · 让好内容，按工序生产</span><span><a href="personal.html">宁少 AI 进化论</a></span></div></footer>
'''

# ───────────────────────── 个人版 ─────────────────────────
personal = f'''
<header class="nav"><div class="in">
  <a class="brand" href="#top">{MARK}<span>宁少 AI 进化论</span></a>
  <nav><a href="#me">我是谁</a><a href="#believe">我相信</a><a href="#products">产品</a><a href="#cases">案例</a><a href="#talks">讲课</a><a href="company.html">宁序科技</a></nav>
  <a class="btn lime sm" href="#contact">加我微信</a>
</div></header>

<section class="hero" id="top"><div class="in">
  <div class="kicker"><b></b>宁少 · 陈宁 · 陪伴 AI 时代的超级个体</div>
  <h1><span>一个人，</span><span class="lime">一条内容生产线。</span></h1>
  <p class="lead">我是宁少。我拿自己做实验，把内容生产一步步交给 AI：<b>选题我来定，剩下的它来做。</b>跑通的工作流，我拿出来教人，也帮 MCN 和企业搭。</p>
  <div class="cta"><a class="btn lime" href="#products">看我的产品 <i>→</i></a><a class="btn ghost" href="#contact">加微信聊聊</a></div>
  <ul class="stats">
    <li><b>¥980</b><span>知识星球「AI获客工坊」</span></li>
    <li><b>¥6,980</b><span>线下培训 · 两天一夜</span></li>
    <li><b>298</b><span>个动效组件</span></li>
    <li><b>6</b><span>套头部博主剪辑风格</span></li>
  </ul>
</div></section>

<section class="sec alt" id="me"><div class="in">
  <div class="head"><span class="tag">ABOUT</span><h2>先做了十多年企业，再来做 AI</h2></div>
  <div class="bio">
    <div class="card-me"><div class="av">宁</div><h3>陈宁<small>宁少</small></h3><p>宁序科技创始人<br>「宁少 AI 进化论」主理人</p>
      <ul><li>中国人民大学校友企业家理事</li><li>山东财经大学创新创业导师</li><li>消费品创业者 · 企业 AI 应用实践者</li><li>抖音 / 视频号 / 小红书：宁少AI进化论</li></ul></div>
    <ol class="tl">
      <li><time>2011</time><b>加入联想</b><p>做渠道销售管理和电商运营，是联想集团最年轻的「联想英雄」个人和团队获得者。</p></li>
      <li><time>2015</time><b>联合创办消费品新零售企业</b><p>在职场一眼看到了头，决定和兄弟们一起做点事。十年，全国 2000 多家门店，连续五年入选胡润全球独角兽榜。</p></li>
      <li><time>近两年</time><b>用 AI 改造自己的企业</b><p>老办法的增长慢了，所以去找新的答案。从管理流程到内容生产，一块一块交给 AI。</p></li>
      <li><time>2026</time><b>把内容生产线做成产品</b><p>在自己的账号上跑通全流程，开始为蛋解创业、李洋洋、张展鹏等账号搭剪辑工作流；11 月受邀到重庆大学 MBA 课堂分享。</p></li>
    </ol>
  </div>
</div></section>

<section class="sec paper" id="believe"><div class="in">
  <div class="head"><span class="tag">WHAT I BELIEVE</span><h2>我常说的几句话</h2></div>
  <div class="quotes">
    <blockquote>不是 all in AI，而是 AI in all。<cite>AI 只是手段，不是目的。</cite></blockquote>
    <blockquote>过去是他说我做，现在是我说它做。<cite>从「我问它答」变成了「我说它做」。</cite></blockquote>
    <blockquote>选题，是整条链路里唯一需要我拿主意的地方。<cite>你只需要想清楚给谁创造什么价值。</cite></blockquote>
    <blockquote>值钱的从来不是代码，是你拿它做出了什么。<cite>所以工具我愿意免费给。</cite></blockquote>
    <blockquote>把自己当成一个创业者。<cite>从岗位思维，转向任务思维。</cite></blockquote>
    <blockquote>人会走，工作流留在公司。<cite>个体提效，不等于组织提效。</cite></blockquote>
  </div>
</div></section>

<section class="sec" id="who"><div class="in">
  <div class="head"><span class="tag">WHO I HELP</span><h2>我帮三类人</h2></div>
  <div class="grid3">
    <article class="box"><div class="n">01</div><h3>做内容的超级个体</h3><p>想一个人把选题到成片都做完。从免费包开始，进星球持续更新，或者来线下两天把自己的流程跑通。</p></article>
    <article class="box"><div class="n">02</div><h3>想做内容的企业</h3><p>创始人 IP 或品牌 IP。派 1 到 2 个人来培训，现场搭出自己的自动化流程，一个人管多个号。</p></article>
    <article class="box"><div class="n">03</div><h3>专业 MCN 机构</h3><p>账号多、量大，要的是按账号定制的工作流。这部分由我的公司 <a href="company.html"><b style="color:var(--lime)">宁序科技 →</b></a> 以项目制交付。</p></article>
  </div>
</div></section>

<section class="sec alt" id="products"><div class="in">
  <div class="head"><span class="tag">PRODUCTS</span><h2>三档产品，从免费到面对面</h2><p>工具先免费给你用。想跟上更新就进星球；想两天内直接搞出来，就来线下。</p></div>
  <div class="plans">
    <article class="plan"><span class="lab">自己动手</span><div class="price"><small>¥</small>0</div><h3>免费工作流包</h3><p class="for">适合想先试一试的人。口播剪辑的完整流程都在里面。</p>
      <ul><li>口播剪辑完整流程</li><li>2 套风格：财经解读、横屏深度解读</li><li>56 个基础动效组件</li><li>去重录、去口吃、降噪、调光、配乐</li><li>59 款可商用字体目录</li></ul>
      <p class="note">AI 额度和找素材的接口费用，是你自己的成本。</p></article>
    <article class="plan hot"><span class="lab">持续跟上 · 早鸟价</span><div class="price"><small>¥</small>980</div><h3>知识星球「AI获客工坊」</h3><p class="for">适合想长期用 AI 做内容、需要有人答疑的个体和小团队。</p>
      <ul><li>全部 6 套剪辑风格，加上每天新做的模板</li><li>不出镜也能出片的纯内容生产线</li><li>全部 298 个动效组件和演示工程</li><li>工作流持续更新</li><li>提问答疑，帮你把工作流调成适合自己业务的</li></ul>
      <p class="note">按人数涨价：前 100 人 ¥980，满 100 人后 ¥2,980，之后继续随人数上调。</p></article>
    <article class="plan"><span class="lab">面对面 · 线下小班</span><div class="price"><small>¥</small>6,980<s>¥9,800</s></div><h3>AI 内容工作流培训</h3><p class="for">两天一夜，不讲概念，全程动手。用你自己的原片、自己的账号、自己的行业来做。</p>
      <ul><li>你自己跑通的 AI 剪辑工作流，装在你电脑上</li><li>按你对标的博主做出来的专属模板</li><li>现场做出的成片，可以直接发</li><li>内容创作工作台</li></ul>
      <p class="note">小班制，名额有限。报名需先付款锁定名额，最新一期的时间地点在知识星球里公布。</p></article>
  </div>
  <h3 style="margin-top:clamp(40px,5vw,64px)">¥6,980 这两天一夜怎么过</h3>
  <div class="days">
    <div><small>第一天 · 上午</small><b>跑通第一条</b><span>装好环境，用自己的原片出第一条成片</span></div>
    <div><small>第一天 · 下午</small><b>定你自己的风格</b><span>拆你的对标账号，做成专属模板</span></div>
    <div><small>第一天 · 晚上</small><b>共创夜</b><span>每人一条成片，一对一过片</span></div>
    <div><small>第二天 · 上午</small><b>不出镜和一人多号</b><span>纯内容生产线，批量出片</span></div>
    <div><small>第二天 · 下午</small><b>接上工作台，带走流程</b><span>企业学员现场写交接文档</span></div>
  </div>
  <div class="grid2" style="margin-top:18px">
    <div class="box"><div class="n">超级个体来学</div><p style="margin-top:6px"><b>学会用 AI 做内容，从选题到成片一个人完成。</b></p></div>
    <div class="box"><div class="n">企业派人来学</div><p style="margin-top:6px"><b>现场搭出自己的 AI 自动化流程，一个人管 N 个号。</b></p></div>
  </div>
</div></section>

<section class="sec" id="cases"><div class="in">
  <div class="head"><span class="tag">CASES</span><h2>我帮他们搭过生产线</h2></div>
  <div class="grid3">{cases(0, 3)}</div>
  <div class="grid2" style="margin-top:18px">{cases(3, 5)}</div>
  {CASE_NOTE}
</div></section>

<section class="sec alt" id="talks"><div class="in">
  <div class="head"><span class="tag">TALKS</span><h2>讲课与分享</h2><p>不讲概念，讲我自己是怎么做的，现场演示。</p></div>
  <div class="grid2">
    <article class="box"><div class="n">2026.11 · 重庆大学</div><h3>AI 时代，个体如何打怪升级：从个人 IP 聊起</h3><p>面向 MBA 课堂，现场 60 多位在职的企业中层。整套课件是用 AI 做的互动网页，一共 55 页，一行代码都不是我写的。</p>
      <div class="nums"><div><b>60+</b><span>位 MBA 同学</span></div><div><b>55</b><span>页互动课件</span></div></div></article>
    <article class="box"><div class="n">可以讲的主题</div><h3>企业和机构可以约的三个题目</h3>
      <p><b>给个人：</b>AI 时代，个体如何打怪升级</p><p><b>给企业家：</b>企业内容生产线：人定方向，AI 跑工序</p><p><b>给内容团队：</b>AI 剪辑工作流实操，两天一夜版</p></article>
  </div>
</div></section>

<section class="sec" id="contact"><div class="in contact">
  <div><span class="tag">CONTACT</span><h2>想跟上，<em>就一起进化。</em></h2>
    <p>尝试 AI 转型的创业者、做内容的同行，加个微信聊聊。</p>
    <dl><dt>内容账号</dt><dd>宁少AI进化论（抖音 / 视频号 / 小红书）</dd><dt>知识星球</dt><dd>AI获客工坊</dd><dt>公司合作</dt><dd><a href="company.html">宁序科技 →</a></dd></dl></div>
  <div class="qr"><img src="{qr}" alt="陈宁的微信二维码"><span>微信扫码 · 加宁少</span></div>
</div></section>

<footer><div class="in"><span>© 2026 宁少 AI 进化论 · 陪伴 AI 时代的超级个体</span><span><a href="company.html">宁序科技 NINGXU</a></span></div></footer>
'''

(ROOT / 'dist').mkdir(exist_ok=True)
(ROOT / 'dist/company.html').write_text(page('宁序科技 NINGXU · AI 内容生产工作流', '宁序科技为 MCN 机构、企业和超级个体搭建 AI 内容生产工作流：八道工序，一套方法，一个工作台。', company))
(ROOT / 'dist/personal.html').write_text(page('宁少 AI 进化论 · 陈宁', '宁少（陈宁）：陪伴 AI 时代的超级个体。知识星球「AI获客工坊」¥980，AI 内容工作流线下培训 ¥6,980。', personal))
print('built')
