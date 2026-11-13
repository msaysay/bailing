#!/usr/bin/env python3
"""Build Fredtalk Shots' portable, evidence-based local report (Python stdlib)."""
from __future__ import annotations

import argparse
import copy
import html
import json
import math
import os
from pathlib import Path
import shutil
import statistics
import sys
import tempfile

sys.dont_write_bytecode = True
from validate_bundle import atomic_write, declares_cut, within_tolerance

SKILL_ROOT = Path(__file__).resolve().parents[1]
SIZE_NAMES = {'none': '无景别', 'extreme-wide': '大远景', 'wide': '全景', 'medium-wide': '中远景', 'medium': '中景', 'medium-close': '中近景', 'close': '特写', 'extreme-close': '大特写'}
CATEGORY_NAMES = {
    'establishing': '定场', 'subject': '主体动作', 'dialogue': '对白', 'reaction': '反应',
    'insert': '局部细节', 'pov': '主观', 'empty': '空镜', 'product': '产品展示',
    'text-card': '字卡', 'transition': '转场镜头', 'archive': '引用素材',
}
TRANSITION_LABELS = {
    'cut': ('硬切', 'cut', 'hard cut', 'hard-cut'),
    'dissolve': ('叠化', 'dissolve'), 'fade-in': ('淡入', 'fade-in', 'fade in'),
    'fade-out': ('淡出', 'fade-out', 'fade out'), 'whip': ('甩切', 'whip'),
    'match-cut': ('匹配剪辑', '匹配切', 'match-cut', 'match cut'),
    'wipe': ('划像', 'wipe'), 'morph': ('特效转场', 'morph'),
}
RESERVED_OUTPUTS = {
    'shots-report.html', 'shots.md', 'analysis.md', 'reverse-prompts.md', 'timed-camera-prompts.md',
    'shots.json', 'analysis.json', 'reverse-prompts.json', 'timed-camera-prompts.json',
    'validation.txt', 'track.json', 'source.json', 'validation.json',
}


def h(value):
    return html.escape(str(value), quote=True)


def tm(seconds):
    minutes, rest = divmod(round(float(seconds), 2), 60)
    return f'{int(minutes):02d}:{rest:05.2f}'


def seek(seconds, label):
    return f'<button data-seek="{float(seconds):.6f}">{h(label)}</button>'


def read_json(path):
    try:
        return json.loads(Path(path).read_text(encoding='utf-8'))
    except (OSError, ValueError) as exc:
        raise ValueError(f'Cannot read JSON {path}: {exc}') from exc


def require_text(obj, keys, context):
    if not isinstance(obj, dict):
        raise ValueError(f'{context} must be an object')
    for key in keys:
        if not isinstance(obj.get(key), str) or not obj[key].strip():
            raise ValueError(f'{context}.{key} must contain reviewed text')


def number(value, context):
    if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value):
        raise ValueError(f'{context} must be a finite number')
    return float(value)


def normalize_and_check(doc, analysis, prompts, camera):
    """Require real analysis; normalize only presentation fields, never invent evidence."""
    if not isinstance(doc, dict) or not isinstance(analysis, dict) or not isinstance(camera, dict):
        raise ValueError('shots, analysis and camera JSON roots must be objects')
    require_text(doc, ['title', 'source'], 'shots')
    meta = doc.get('meta', {})
    duration = number(meta.get('durationSeconds'), 'meta.durationSeconds')
    fps = number(meta.get('fps'), 'meta.fps')
    if duration <= 0 or fps <= 0:
        raise ValueError('Duration and fps must be positive')
    for dimension in ('width', 'height'):
        if number(meta.get(dimension), 'meta.'+dimension) <= 0:
            raise ValueError('Frame dimensions must be positive')
    shots = doc.get('shots', [])
    if not shots:
        raise ValueError('shots must contain at least one reviewed shot')
    cast = doc.get('cast', [])
    if not isinstance(cast, list):
        raise ValueError('cast must be an array (an empty array is valid)')
    cast_ids = set()
    for actor in cast:
        require_text(actor, ['id', 'name', 'note'], 'cast entry')
        if actor['id'] in cast_ids:
            raise ValueError(f'Duplicate cast id: {actor["id"]}')
        cast_ids.add(actor['id'])
        actor.setdefault('entityType', 'character')
    ids = set()
    previous = 0
    for index, shot in enumerate(shots):
        context = f'shots[{index}]'
        require_text(shot, ['id', 'title', 'frame', 'fight', 'cameraRead', 'spatial', 'remake', 'note', 'size', 'category', 'camera', 'transitionIn'], context)
        if shot['id'] in ids:
            raise ValueError(f'Duplicate shot id: {shot["id"]}')
        ids.add(shot['id'])
        start, end = number(shot.get('start'), context+'.start'), number(shot.get('end'), context+'.end')
        if not within_tolerance(start, previous) or end <= start or end > duration+.002:
            raise ValueError(f'{context}: non-contiguous or out-of-range shot interval')
        seconds = number(shot.get('seconds'), context+'.seconds')
        if not within_tolerance(seconds, end-start):
            raise ValueError(f'{context}.seconds disagrees with end-start')
        previous = end
        if not isinstance(shot.get('subjects'), list) or any(actor not in cast_ids for actor in shot['subjects']):
            raise ValueError(f'{context}.subjects must reference known cast ids')
        if not isinstance(shot.get('beats'), list) or not shot['beats']:
            raise ValueError(f'{context}.beats needs at least one reviewed action/state interval')
        for beat in shot['beats']:
            if not isinstance(beat, list) or len(beat) != 2 or not all(isinstance(item, str) and item for item in beat):
                raise ValueError(f'{context}.beats must contain [timeLabel, reviewedAction] pairs')
        shot.setdefault('audio', '')
        shot.setdefault('rhythmNote', '')
        shot.setdefault('principalSubjects', [actor for actor in shot['subjects'] if actor not in shot.get('backgroundSubjects', [])])
        shot.setdefault('backgroundSubjects', [])
        for key in ('principalSubjects', 'backgroundSubjects'):
            if not isinstance(shot[key], list) or any(actor not in shot['subjects'] for actor in shot[key]):
                raise ValueError(f'{context}.{key} must reference present cast members')
        principal, background = set(shot['principalSubjects']), set(shot['backgroundSubjects'])
        if principal & background:
            raise ValueError(f'{context}: principal and background cast cannot overlap')
        if principal | background != set(shot['subjects']):
            raise ValueError(f'{context}: cast role groups must cover subjects exactly')
        presence = shot.setdefault('castPresence', {})
        if not isinstance(presence, dict) or any(actor not in shot['subjects'] for actor in presence):
            raise ValueError(f'{context}.castPresence must map present cast ids to their roles')
        for actor in shot['subjects']:
            presence.setdefault(actor, '背景' if actor in shot['backgroundSubjects'] else '主要')
        frames = shot.setdefault('frames', {})
        for pick in ('a', 'b'):
            frames.setdefault(pick, {'src': f'frames/{shot["id"]}{pick}.jpg', 'time': None})
            require_text(frames[pick], ['src'], context+f'.frames.{pick}')
            frames[pick].setdefault('time', None)
            if frames[pick]['time'] is not None:
                stamp = number(frames[pick]['time'], context+f'.frames.{pick}.time')
                if stamp < start-.002 or stamp > end+.002:
                    raise ValueError(f'{context}.frames.{pick}.time is outside its shot')
    if not within_tolerance(previous, duration):
        raise ValueError('The shot timeline does not cover the source duration')
    if not isinstance(analysis.get('topics'), list) or len(analysis['topics']) < 6:
        raise ValueError('analysis.topics requires at least six evidence-based dimensions')
    for index, topic in enumerate(analysis['topics']):
        require_text(topic, ['tag', 'title', 'observed', 'meaning', 'apply'], f'analysis.topics[{index}]')
        if not isinstance(topic.get('times'), list) or not topic['times']:
            raise ValueError('Each analysis topic needs seekable source evidence times')
        for stamp in topic['times']:
            if not 0 <= number(stamp, 'analysis evidence time') <= duration:
                raise ValueError('Analysis evidence time is outside source duration')
    if not isinstance(analysis.get('phases'), list) or not analysis['phases']:
        raise ValueError('analysis.phases needs a source-specific narrative structure')
    for phase in analysis['phases']:
        require_text(phase, ['rangeLabel', 'title', 'analysis'], 'analysis phase')
        if not 0 <= number(phase.get('sampleTime'), 'phase.sampleTime') <= duration:
            raise ValueError('Phase sample time is outside source duration')
    if not isinstance(analysis.get('limits'), list) or not analysis['limits']:
        raise ValueError('analysis.limits must disclose observation and design boundaries')
    if not isinstance(prompts, list) or len(prompts) < 6:
        raise ValueError('prompts needs at least six source-specific prompt variants')
    for index, prompt in enumerate(prompts):
        prompt.setdefault('kind', 'variant')
        require_text(prompt, ['kind', 'label', 'caption', 'text'], f'prompts[{index}]')
    timed = [p for p in prompts if p['kind'] == 'timed']
    if len(timed) != 1:
        raise ValueError('Exactly one prompt must have kind=timed')
    prompts[:] = timed + [p for p in prompts if p['kind'] != 'timed']
    windows = camera.get('windows', [])
    if not windows:
        raise ValueError('camera.windows needs detailed time-based camera/action instructions')
    if not isinstance(camera.get('designBoundary'), dict) or not camera['designBoundary']:
        raise ValueError('camera.designBoundary must distinguish source evidence from reproduction design')
    previous, previous_shot = 0, None
    window_ids = set()
    for index, window in enumerate(windows):
        require_text(window, ['id', 'shotId', 'transitionLabel', 'title', 'cameraPrompt', 'actionPrompt', 'endState'], f'camera.windows[{index}]')
        if window['id'] in window_ids:
            raise ValueError(f'Duplicate camera window id: {window["id"]}')
        window_ids.add(window['id'])
        start, end = number(window.get('start'), 'window.start'), number(window.get('end'), 'window.end')
        if not within_tolerance(start, previous) or end <= start:
            raise ValueError('Camera windows must be continuous and positive')
        source_shot = next((shot for shot in shots if shot['id'] == window['shotId']), None)
        if source_shot is None or start < source_shot['start']-.002 or end > source_shot['end']+.002:
            raise ValueError(f'Window {window["id"]} must remain inside its source shot')
        label = window['transitionLabel'].strip().lower()
        hard_cut = declares_cut(label)
        if previous_shot == window['shotId']:
            if hard_cut:
                raise ValueError(f'Window {window["id"]} invents a hard cut inside a continuous source shot')
        elif previous_shot is not None:
            if not within_tolerance(start, source_shot['start']):
                raise ValueError(f'Window {window["id"]} transition must align with the measured source boundary')
            transition = source_shot['transitionIn']
            aliases = TRANSITION_LABELS.get(transition, (transition,))
            identified = hard_cut if transition == 'cut' else any(
                alias in label if not alias.isascii() else label == alias or label.startswith(alias+' ')
                for alias in aliases)
            if not identified:
                raise ValueError(f'Window {window["id"]} must identify the source transition: {transition}')
        previous, previous_shot = end, window['shotId']
    if not within_tolerance(previous, duration):
        raise ValueError('Camera windows must cover the complete source duration')
    if {window['shotId'] for window in windows} != ids:
        raise ValueError('Camera windows must cover every measured source shot')
    if camera.get('timelinePrompt') and camera['timelinePrompt'] != timed[0]['text']:
        raise ValueError('camera.timelinePrompt must exactly match the timed prompt text')
    camera['timelinePrompt'] = timed[0]['text']
    camera['totalSeconds'] = duration
    camera['windowCount'] = len(windows)
    camera['sourceShotCount'] = len(shots)
    report = doc.setdefault('report', {})
    defaults = {
        'title': doc['title'], 'kicker': 'FREDTALK SHOTS / 逐帧研究', 'headline': doc['title'],
        'intro': f'沿着原片的 {len(shots)} 个镜头，拆开动作、空间、人物状态与剪辑，再把这些关系写成可用的生成提示词。',
        'actionLabel': '具体动作过程', 'audioFallback': '未标注可确认的对白或声音内容；请参照原片音轨与观察边界。',
        'shotHeading': '逐镜动作档案', 'peopleHeading': '先分清人物，再看空间关系',
        'peopleIntro': '人物与背景群体分开记录。头像来自对应主体，出场关系包含镜内的短暂变化。',
        'analysisHeading': '把观察拆成可用的关系', 'statsHeading': '镜头长度与景别分布',
        'cameraIntro': '标明切镜点与镜内变化。机位、焦段和未能实测的接触安排属于复刻设计，不能作为原片事实。',
        'promptIntro': '时间轴版逐段写明景别、机位、运镜、动作和结束状态。共同设定与分段方案可单独复制。',
        'promptGuides': ['先提供与本片对应的人物和场景参考，确认外观、数量与相对位置。', '按时间窗安排镜头；同一动作窗内连续完成起势、应对、接触或状态变化。', '生成后检查动作衔接、空间方向、人物身份与状态的跨镜连续性。'],
    }
    for key, value in defaults.items():
        report.setdefault(key, value)
    if 'media' not in doc:
        details = f'{meta.get("width", "?")} × {meta.get("height", "?")} · {fps:g} fps · {str(meta.get("codec", "")).upper()}'
        doc['media'] = [{'src': 'source-original.mp4', 'label': '原片', 'details': details}]
    if not isinstance(doc['media'], list) or not doc['media']:
        raise ValueError('doc.media must contain at least one playable source')
    for media in doc['media']:
        require_text(media, ['src', 'label'], 'media entry')
    return doc, analysis, prompts, camera


def resolve_assets(doc, source_dir, output_dir):
    """Plan local resource copies without writing, so every target can be checked first."""
    resources = [(entry, 'src') for entry in doc['media']]
    resources += [(frame, 'src') for shot in doc['shots'] for frame in shot['frames'].values()]
    resources += [(actor, 'portrait') for actor in doc['cast'] if actor.get('portrait')]
    planned = {}
    for obj, key in resources:
        raw = obj[key]
        path = Path(raw)
        if path.is_absolute() or '://' in raw or raw.startswith('data:'):
            raise ValueError(f'Report media must be local and portable: {raw}')
        source = (source_dir/path).resolve()
        if not source.is_relative_to(source_dir) or not source.is_file():
            raise ValueError(f'Missing or escaping report resource: {raw}')
        relative = path
        if '..' in relative.parts:
            raise ValueError(f'Resource path cannot escape the report directory: {raw}')
        destination = output_dir/relative
        if relative.as_posix() in RESERVED_OUTPUTS:
            raise ValueError(f'Resource collides with a reserved report output: {raw}')
        identity = destination
        if identity in planned and planned[identity][0].resolve() != source.resolve():
            raise ValueError(f'Two source resources collide at: {relative}')
        planned[identity] = (source, destination)
        obj[key] = relative.as_posix()
    return list(planned.values())


def evidence_copies(source_dir, output_dir):
    """Plan copies of existing measurement/provenance receipts."""
    planned = []
    for name in ('track.json', 'source.json', 'validation.json'):
        source, destination = source_dir/name, output_dir/name
        if source.is_file():
            if not source.resolve().is_relative_to(source_dir):
                raise ValueError(f'Evidence source cannot escape the input directory: {name}')
            planned.append((source.resolve(), destination))
    return planned


def preflight_outputs(output_dir, outputs, assets, evidence, inputs):
    """Reject link targets and cross-role collisions before any file is copied or written."""
    targets = {output_dir/name: ('write', None) for name in outputs}
    for kind, copies in (('asset', assets), ('evidence', evidence)):
        for source, destination in copies:
            if destination in targets:
                raise ValueError(f'Export target collision: {destination.relative_to(output_dir)}')
            targets[destination] = (kind, source)
    protected_assets = {source.resolve() for source, _ in assets}
    protected_inputs = {path.resolve() for path in inputs.values() if path is not None}
    allowed_inputs = {name: path.resolve() for name, path in inputs.items() if path is not None}
    for destination, (kind, source) in targets.items():
        relative = destination.relative_to(output_dir)
        current = output_dir
        for part in relative.parts:
            current /= part
            if current.is_symlink():
                raise ValueError(f'Export target must not contain a symlink: {relative}')
            if current != destination and current.exists() and not current.is_dir():
                raise ValueError(f'Export parent must be a directory: {relative}')
        if destination.exists() and not destination.is_file():
            raise ValueError(f'Export target must be a regular file: {relative}')
        identity = destination.resolve()
        if not identity.is_relative_to(output_dir):
            raise ValueError(f'Export target escapes the output directory: {relative}')
        if kind == 'write':
            if identity in protected_assets:
                raise ValueError(f'Export output aliases a source resource: {relative}')
            if identity in protected_inputs and allowed_inputs.get(relative.as_posix()) != identity:
                raise ValueError(f'Export output aliases a different input JSON or validation file: {relative}')
        elif identity in protected_inputs | protected_assets and identity != source.resolve():
            raise ValueError(f'Export copy aliases another source or input: {relative}')


def atomic_copy(source, destination):
    if source.resolve() == destination.resolve():
        return
    destination.parent.mkdir(parents=True, exist_ok=True)
    temporary = None
    try:
        with tempfile.NamedTemporaryFile(dir=destination.parent, prefix='.fredtalk-copy-', delete=False) as file:
            temporary = Path(file.name)
        shutil.copy2(source, temporary)
        os.replace(temporary, destination)
    finally:
        if temporary is not None:
            temporary.unlink(missing_ok=True)


def prompt_markdown(prompts, title):
    lines = [f'# {title} · 反推提示词', '']
    for prompt in prompts:
        lines += [f'## {prompt["label"]}', '', prompt['caption'], '', '```text', prompt['text'], '```', '']
    return '\n'.join(lines)+'\n'


def shot_markdown(doc):
    lines = [f'# {doc["title"]} · 逐镜分析', '', f'原片：{doc["source"]}', '', f'{doc["meta"]["durationSeconds"]:.2f} 秒 / {len(doc["shots"])} 镜', '']
    for shot in doc['shots']:
        lines += [f'## {shot["id"]} {shot["title"]}', '', f'{tm(shot["start"])}—{tm(shot["end"])} / {shot["seconds"]:.2f}s', '', '### 画面', '', shot['frame'], '', f'### {doc["report"]["actionLabel"]}', '', shot['fight'], '']
        lines += [f'- {stamp}：{text}' for stamp, text in shot['beats']]
        lines += ['', '### 镜头与空间', '', shot['cameraRead'], '', shot['spatial'], '', '### 文字与声音', '', shot['audio'] or doc['report']['audioFallback'], '', '### 复刻要点', '', shot['remake'], '', '判断依据：'+shot['note'], '']
    return '\n'.join(lines)+'\n'


def analysis_markdown(doc, analysis):
    lines = [f'# {doc["title"]} · 深度分析', '']
    for topic in analysis['topics']:
        lines += [f'## {topic["title"]}', '', '画面证据：'+topic['observed'], '', '分析：'+topic['meaning'], '', '提示词写法：'+topic['apply'], '', '回看时间：'+', '.join(tm(t) for t in topic['times']), '']
    lines += ['## 全片结构', '']
    for phase in analysis['phases']:
        lines += [f'### {phase["rangeLabel"]} · {phase["title"]}', '', phase['analysis'], '']
    lines += ['## 观察边界', '']+['- '+line for line in analysis['limits']]+['']
    return '\n'.join(lines)+'\n'


def render_page(doc, analysis, prompts, camera, validation):
    shots, meta, report = doc['shots'], doc['meta'], doc['report']
    duration = meta['durationSeconds']
    stats = [shot['seconds'] for shot in shots]
    longest, shortest = max(shots, key=lambda shot: shot['seconds']), min(shots, key=lambda shot: shot['seconds'])
    segments = ''.join(f'<button class="segment" data-size="{h(s["size"])}" data-category="{h(s["category"])}" data-segment="{h(s["id"])}" style="flex:{s["seconds"]};--played:0%" aria-label="跳转 {h(s["id"])}，{h(s["title"])}，{s["seconds"]:.2f}秒"><span>{h(s["id"])}</span><small>{s["seconds"]:.2f}s</small></button>' for s in shots)
    cast_cards = ''
    for actor in doc['cast']:
        stamp = f'原片 {tm(actor["portraitTime"])} · 局部裁切' if actor.get('portraitTime') is not None else actor.get('portraitNote', '对应主体参考')
        portrait = f'<img src="{h(actor["portrait"])}" alt="{h(actor["name"])}"><p class="portrait-caption">{h(stamp)}</p>' if actor.get('portrait') else '<p class="portrait-caption">未提供可确认的主体裁切</p>'
        cast_cards += f'<article class="cast-card {"group" if actor["entityType"]=="group" else ""}"><div>{portrait}</div><div><div class="cast-letter">{h(actor["id"])} / {"背景群体" if actor["entityType"]=="group" else "人物"}</div><h3>{h(actor["name"])}</h3><p>{h(actor["note"])}</p><button data-cast="{h(actor["id"])}" aria-pressed="false">查看 {sum(actor["id"] in s["subjects"] for s in shots)} 镜 ↗</button></div></article>'
    matrix_head = ''.join(f'<th>{seek(s["start"], s["id"])}</th>' for s in shots)
    matrix_rows = ''.join(f'<tr><th>{h(actor["id"])} · {h(actor["name"])}</th>'+''.join(f'<td class="{"on" if actor["id"] in s["subjects"] else ""}">{h(s["castPresence"].get(actor["id"], "—"))}</td>' for s in shots)+'</tr>' for actor in doc['cast'])
    cast_matrix = f'<div class="cast-matrix"><table><caption style="text-align:left;margin-bottom:9px">人物 × 镜头 · 出场状态按整镜复核</caption><thead><tr><th>人物／群体</th>{matrix_head}</tr></thead><tbody>{matrix_rows}</tbody></table></div>' if doc['cast'] else '<p>本片没有可确认并独立编号的人物。</p>'
    analyses = ''.join(f'<article class="analysis"><div class="eyebrow">{i+1:02d} / {h(a["tag"])}</div><h3>{h(a["title"])}</h3><p><b>片中能看到</b>{h(a["observed"])}</p><p><b>怎样起作用</b>{h(a["meaning"])}</p><p class="apply"><b>写进自己的提示词</b>{h(a["apply"])}</p><div class="time-links">'+''.join(seek(t, tm(t)+' ↗') for t in a['times'])+'</div></article>' for i, a in enumerate(analysis['topics']))
    phases = ''.join(f'<li>{seek(p["sampleTime"],p["rangeLabel"]+" ↗")}<h4>{h(p["title"])}</h4><p>{h(p["analysis"])}</p></li>' for p in analysis['phases'])
    phase_summary = ''.join(f'<div><strong>{i+1:02d} · {h(p["title"])}</strong><span class="mono">{h(p["rangeLabel"])}</span></div>' for i, p in enumerate(analysis.get('overviewPhases', analysis['phases'])))
    size_sums = {}
    for shot in shots:
        size_sums[shot['size']] = size_sums.get(shot['size'], 0)+shot['seconds']
    bars = ''.join(f'<div class="stat-bar"><span>{h(SIZE_NAMES.get(key,key))}</span><div class="stat-track"><i style="width:{value/duration*100:.2f}%"></i></div><span>{value/duration*100:.1f}%</span></div>' for key, value in sorted(size_sums.items(),key=lambda pair:-pair[1]))
    tabs = ''.join(f'<button role="tab" id="prompt-tab-{i}" aria-controls="prompt-panel" aria-selected="false" data-prompt="{i}">{h(p["label"])}</button>' for i,p in enumerate(prompts))
    cues = ''.join(f'<article class="camera-cue"><div class="cue-time">{seek(w["start"],tm(w["start"])+"—"+tm(w["end"])+" ↗")}<span>{h(w["shotId"])} · {h(w["transitionLabel"])}</span></div><div><h4>{h(w["title"])}</h4><p><b>镜头：</b>{h(w["cameraPrompt"])}</p><p><b>动作：</b>{h(w["actionPrompt"])}</p><p class="cue-end"><b>结束／衔接：</b>{h(w["endState"])}</p></div></article>' for w in camera['windows'])
    media = doc['media']
    source_buttons = ''.join(f'<button data-source="{h(item["src"])}" aria-pressed="{"true" if i==0 else "false"}">{h(item["label"])}</button>' for i,item in enumerate(media))
    source_links = ''.join(f'<a href="{h(item["src"])}">{h(item["label"])} ↗</a>' for item in media)
    sidebar = report.get('promptSidebar', [])
    sidebar_html = ''.join(f'<dt>{h(item["label"])}</dt><dd>{h(item["text"])}</dd>' for item in sidebar)
    if not sidebar_html:
        sidebar_html = '<dt>人物参考</dt><dd>'+h(' / '.join(actor['name'] for actor in doc['cast']) or '按本片主体提供对应参考')+'</dd><dt>场景与空间</dt><dd>沿用原片已确认的空间关系，具体设定以共同提示词为准。</dd><dt>连续性</dt><dd>前一时间窗的结束状态必须接入下一时间窗。</dd>'
    corrections = '<div class="changes"><strong>复核与修正</strong><ul>'+''.join(f'<li>{h(line)}</li>' for line in analysis.get('corrections', []))+'</ul></div>' if analysis.get('corrections') else ''
    method = analysis.get('method') or analysis.get('basis', {}).get('evidence') or doc.get('analysisBasis', {}).get('evidence')
    if not method:
        raise ValueError('analysis.method or basis.evidence must describe the actual review method')
    limits = ''.join(f'<li>{h(line)}</li>' for line in analysis['limits'])
    guide_items = ''.join(f'<li>{h(line)}</li>' for line in report['promptGuides'])
    total_characters = sum(actor['entityType'] != 'group' for actor in doc['cast'])
    total_groups = len(doc['cast'])-total_characters
    cast_summary = f'{total_characters} 位人物'+(f'＋{total_groups} 组群体' if total_groups else '')
    ticks = [duration*i/6 for i in range(7)]
    ruler = ''.join(f'<span>{tm(t)}</span>' for t in ticks)
    fps_label = f'{meta["fps"]:g}'
    resolution = f'{meta.get("width", "?")} × {meta.get("height", "?")}'
    track_label = '有音轨' if meta.get('hasAudio') else '无音轨'
    inline_doc = json.dumps(doc,ensure_ascii=False).replace('</','<\/')
    inline_prompts = json.dumps(prompts,ensure_ascii=False).replace('</','<\/')
    css = (SKILL_ROOT/'assets/report.css').read_text(encoding='utf-8')
    js = (SKILL_ROOT/'assets/report.js').read_text(encoding='utf-8')
    validation_html = f'<details class="gate"><summary>结构检查记录</summary><p>时间轴与数据检查和视觉判断分别记录。通过结构检查不代表动作已逐帧确认。</p><pre>{h(validation)}</pre></details>' if validation else '<p class="muted">结构检查未验证：未提供检查记录，请运行完整验证后交付。</p>'
    return f'''<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="{h(report['intro'])}"><title>{h(report['title'])} · Fredtalk Shots</title><style>{css}</style></head><body>
<header class="topbar"><a class="brand" href="#watch">FredTalk <span>Shots</span><b>{h(report.get('badge','拉片手记'))}</b></a><nav class="nav" aria-label="报告导航"><a href="#shots">逐镜分析</a><a href="#people">人物关系</a><a href="#analysis">深度拆解</a><a href="#prompts">反推提示词</a><a href="#evidence">依据与数据</a></nav><a class="download" href="shots.json" download>下载 JSON ↘</a></header>
<main class="wrap"><section class="masthead"><div><div class="eyebrow">{h(report['kicker'])}</div><h1>{h(report['headline']).replace(chr(10),'<br>')}</h1><p class="intro">{h(report['intro'])}</p></div><aside class="source-slip"><div class="eyebrow">SOURCE / 全片</div><strong>{duration:.2f}<span style="font-size:16px"> s</span></strong><div class="file">{h(doc['source'])}</div><div class="mono">{resolution} · {fps_label} fps · {track_label}</div><div class="muted" style="font-size:12px">{len(shots)} 镜头 · {cast_summary}</div></aside></section>
<section class="watch" id="watch" aria-label="原片与同步动作拆解"><div class="watch-grid"><div class="screen"><video id="film" controls playsinline preload="metadata" src="{h(media[0]['src'])}" poster="{h(shots[0]['frames']['a']['src'])}" style="--video-aspect:{meta.get('width',16)}/{meta.get('height',9)}" aria-label="{h(doc['title'])} 原片"></video><div class="screen-toolbar"><div><span id="media-label">{h(media[0]['label'])}</span> · <span id="media-state" role="status">载入中</span></div><div>{source_buttons}</div><label class="filelabel">本地视频 <input type="file" id="local-video" accept="video/*" aria-label="选择本地视频"></label></div></div><aside class="readout"><div class="readout-top"><span class="shotmark" id="current-id">{h(shots[0]['id'])}</span><output class="clock" id="clock">00:00.00 / {tm(duration)}</output></div><div class="eyebrow">当前镜头 / 同步拆解</div><h3 id="current-title"></h3><div class="tags" id="current-tags"></div><p class="current-fight" id="current-fight"></p><p class="minor" id="current-camera"></p><div class="controls"><button id="prev-shot" aria-label="上一镜">← 上一镜</button><button id="play-shot" class="play-one">播放本镜 ▶</button><button id="next-shot" aria-label="下一镜">下一镜 →</button></div></aside></div><div class="timeline-header"><span class="eyebrow">SHOT TIMELINE / 镜头节奏带</span><span class="muted" style="font-size:12px">宽度 = 时长 · 点击定位 · 播放同步</span></div><div class="timeline" aria-label="镜头节奏带">{segments}</div><div class="ruler">{ruler}</div><div class="phase-strip">{phase_summary}</div></section>
<section class="section" id="shots"><header class="section-heading"><div><div class="eyebrow">01 / SHOT DOSSIER</div><h2>{h(report['shotHeading'])}</h2></div><p>画面交代看到了什么，动作过程交代怎样发生。长镜头按镜内变化分段；没有新动作的镜头，也写清状态和作用。</p></header><div class="toolbar"><div class="filters" aria-label="镜头类别"><button data-category="all" aria-pressed="true">全部镜头</button>{''.join(f'<button data-category="{h(category)}" aria-pressed="false">{h(CATEGORY_NAMES.get(category,category))}</button>' for category in dict.fromkeys(s['category'] for s in shots))}</div><div class="search-sort"><input id="search" type="search" placeholder="搜索镜号、动作、人物、字幕…" aria-label="搜索镜号、动作、人物、字幕"><select id="sort" aria-label="镜头排序"><option value="timeline">按时间顺序</option><option value="longest">时长从长到短</option><option value="shortest">时长从短到长</option></select></div></div><div class="results"><span id="result-count"></span><button class="reset" id="clear-filters" hidden>清除筛选</button></div><div id="shot-list"></div><div class="empty" id="empty" hidden>没有匹配镜头，试试其他动作或清除筛选。</div></section>
<section class="section" id="people"><header class="section-heading"><div><div class="eyebrow">02 / CAST & SPACE</div><h2>{h(report['peopleHeading'])}</h2></div><p>{h(report['peopleIntro'])}</p></header><div class="cast-grid">{cast_cards}</div>{cast_matrix}{f'<p class="muted">{h(report["peopleNote"])}</p>' if report.get('peopleNote') else ''}</section>
<section class="section" id="analysis"><header class="section-heading"><div><div class="eyebrow">03 / DEEP READING</div><h2>{h(report['analysisHeading'])}</h2></div><p>每条分析附回看片段：先列画面证据，再解释组织方式，最后给出可以放进自己作品的写法。</p></header><div class="analyses">{analyses}</div><details class="phase-notes"><summary>展开全片 {len(analysis['phases'])} 段结构</summary><ol>{phases}</ol></details></section>
<section class="section prompt-section" id="prompts"><header class="section-heading"><div><div class="eyebrow">04 / REVERSE PROMPT</div><h2>按时间轴，写清镜头怎么变</h2></div><p>每几秒写明景别、机位、运镜、动作和结束状态。长镜头展开内部变化，切镜保留准确时间点。</p></header><div class="prompt-layout"><aside class="prompt-sidebar"><div><p>{h(report['promptIntro'])}</p><a href="reverse-prompts.md" download>下载全部提示词 .md ↘</a></div><dl>{sidebar_html}</dl></aside><div><div class="prompt-tabs" role="tablist" id="prompt-tabs" aria-label="提示词方案">{tabs}</div><div role="tabpanel" id="prompt-panel"><p class="prompt-caption" id="prompt-caption"></p><textarea class="prompt-text" id="prompt-text" aria-label="可复制的详细复刻提示词" readonly></textarea><div class="prompt-actions"><button id="copy-prompt" data-copy-state="idle">复制这份提示词</button><a href="reverse-prompts.json" download>下载提示词 JSON ↘</a></div></div></div></div><section class="camera-schedule" id="camera-schedule"><h3>每个时间窗，怎么拍</h3><p>{len(camera['windows'])} 个拍摄时间窗对应原片 {len(shots)} 个镜头。{h(report['cameraIntro'])}</p><div class="camera-cues">{cues}</div></section><div class="prompt-guides"><strong>使用顺序</strong><ul>{guide_items}</ul></div></section>
<section class="section" id="evidence"><header class="section-heading"><div><div class="eyebrow">05 / EVIDENCE & MEASUREMENTS</div><h2>依据与数据</h2></div><p>时间与切点由脚本测量，人物和动作由画面复核。结构检查与视觉判断分别记录。</p></header><div class="evidence-grid"><div><h3>{h(report['statsHeading'])}</h3><div class="numbers"><div><strong>{len(shots)}</strong><span>镜头 / {max(0,len(shots)-1)} 处镜头边界</span></div><div><strong>{statistics.mean(stats):.2f}s</strong><span>平均镜长</span></div><div><strong>{max(0,len(shots)-1)/duration*60:.1f}</strong><span>次剪切 / 分钟</span></div><div><strong>{statistics.median(stats):.2f}s</strong><span>中位镜长</span></div><div><strong>{longest['seconds']:.2f}s</strong><span>最长 / {h(longest['id'])}</span></div><div><strong>{shortest['seconds']:.2f}s</strong><span>最短 / {h(shortest['id'])}</span></div></div><p class="muted" style="font-size:12px;margin-bottom:14px">镜头密度 {len(shots)/duration*60:.1f} 镜／分钟。景别按主导标注、按时长统计；镜内变化在逐镜档案单独说明。</p><div class="stat-bars">{bars}</div></div><div class="method"><h3>怎样复核</h3><p style="margin-top:13px">{h(method)}</p>{corrections}<ul>{limits}</ul>{validation_html}<div class="downloads"><a href="shots.md" download>逐镜 Markdown ↘</a><a href="analysis.md" download>完整深度分析 ↘</a><a href="timed-camera-prompts.md" download>时间轴提示词 ↘</a>{source_links}</div></div></div></section>
<footer class="footer"><span>Fredtalk Shots / {h(doc['title'])}</span><span>{h(report.get('revisionLabel','逐帧分析与复刻手册'))}</span></footer></main><dialog id="frame-dialog" aria-label="关键帧放大"><div class="dialog-bar"><span id="frame-title"></span><button id="frame-close" aria-label="关闭关键帧">关闭 ×</button></div><img id="frame-img" alt=""><div class="dialog-bottom"><button id="frame-a">前段帧 ←</button><button id="frame-b">后段帧 →</button></div></dialog><div class="toast" id="toast" role="status" hidden></div><script>const DOC={inline_doc};const PROMPTS={inline_prompts};</script><script>{js}</script></body></html>'''


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--input', required=True, type=Path, help='Reviewed shots.json with metadata, cast, shots and local resources')
    parser.add_argument('--analysis', required=True, type=Path, help='Evidence-based analysis JSON (topics, phases, limits, method)')
    parser.add_argument('--prompts', required=True, type=Path, help='Array of >=6 prompt variants; exactly one kind=timed')
    parser.add_argument('--camera', required=True, type=Path, help='Detailed timed-camera JSON with continuous windows')
    parser.add_argument('--output-dir', required=True, type=Path, help='Portable output bundle; local media are copied here')
    parser.add_argument('--validation', type=Path, help='Actual validation log to include in the report')
    args = parser.parse_args(argv)
    try:
        doc, analysis, prompts, camera = normalize_and_check(*[copy.deepcopy(read_json(path)) for path in (args.input,args.analysis,args.prompts,args.camera)])
        validation = args.validation.read_text(encoding='utf-8') if args.validation else ''
        # Check analysis requirements and renderability before touching the output directory.
        render_page(doc, analysis, prompts, camera, validation)
        args.output_dir.mkdir(parents=True, exist_ok=True)
        output_dir = args.output_dir.resolve()
        source_dir = args.input.resolve().parent
        assets = resolve_assets(doc, source_dir, output_dir)
        evidence = evidence_copies(source_dir, output_dir)
        page = render_page(doc, analysis, prompts, camera, validation)
        outputs = {'shots-report.html': page, 'shots.md': shot_markdown(doc), 'analysis.md': analysis_markdown(doc, analysis), 'reverse-prompts.md': prompt_markdown(prompts, doc['title']), 'timed-camera-prompts.md': f'# {doc["title"]} · 时间轴提示词\n\n{camera["timelinePrompt"]}\n'}
        for name, data in [('shots.json',doc),('analysis.json',analysis),('reverse-prompts.json',prompts),('timed-camera-prompts.json',camera)]:
            outputs[name] = json.dumps(data, ensure_ascii=False, indent=2, allow_nan=False)+'\n'
        if validation:
            outputs['validation.txt'] = validation
        inputs = {'shots.json': args.input, 'analysis.json': args.analysis, 'reverse-prompts.json': args.prompts,
                  'timed-camera-prompts.json': args.camera, 'validation.txt': args.validation}
        preflight_outputs(output_dir, outputs, assets, evidence, inputs)
        for source, destination in assets + evidence:
            atomic_copy(source, destination)
        for name, text in outputs.items():
            atomic_write(output_dir/name, text)
        print(json.dumps({'status':'built','report':str((args.output_dir/'shots-report.html').resolve()),'shots':len(doc['shots']),'cast':len(doc['cast']),'topics':len(analysis['topics']),'promptVariants':len(prompts),'cameraWindows':len(camera['windows'])},ensure_ascii=False))
    except (ValueError, OSError, KeyError, TypeError) as exc:
        print(f'Fredtalk Shots: {exc}',file=sys.stderr)
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(main())
