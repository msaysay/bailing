#!/usr/bin/env python3
"""从仓库里的事实源生成官网数据 site/data.js：组件目录（studio/src/gallery/catalog*.tsx）、Skill（skills/*/SKILL.md 和 skills/README.md 的两张表）。
用法：python3 site/tools/build_data.py    改了组件或 Skill 之后重跑一次。"""
import json, os, re
root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))); G = os.path.join(root, "studio/src/gallery")
files = ["catalog.tsx"] + sorted(f for f in os.listdir(G) if re.fullmatch(r"catalog-.+\.tsx", f)); comps = []
for fn in files:
    src = open(os.path.join(G, fn), encoding="utf-8").read(); fv = dict(re.findall(r"\b(f\d?) = '([^']+)'", src)); gv = re.search(r"\bg = '([^']+)'", src)
    for m in re.finditer(r"\{ id: '([^']+)', name: '([^']+)', export: '([^']+)', file: ('[^']+'|f\d?), group: (?:'([^']+)'|g), use: '([^']*)', avoid: '([^']*)', props: '([^']*)', demo:", src):
        it = dict(zip(("id", "name", "export", "file", "group", "use", "avoid", "props"), m.groups()))
        it["file"] = it["file"][1:-1] if it["file"].startswith("'") else fv[it["file"]]; it["group"] = it["group"] or gv.group(1); it["i"] = len(comps); comps.append(it)
readme = open(os.path.join(root, "skills/README.md"), encoding="utf-8").read(); rows = {}
for line in readme.split("\n"):
    c = [x.strip() for x in line.strip().strip("|").split("|")]
    if len(c) == 6 and "`" in c[1] and re.match(r"`(talk|video)-\d\d", c[1]):
        name = c[1].strip("`"); rows.setdefault(name, {"what": c[2], "input": c[3].replace("`", ""), "output": c[4].replace("`", ""), "confirm": c[5].replace("✔", "").strip(), "ask": "✔" in c[5]})
skills = []
for d in sorted(os.listdir(os.path.join(root, "skills"))):
    p = os.path.join(root, "skills", d, "SKILL.md")
    if not os.path.exists(p): continue
    s = open(p, encoding="utf-8").read(); desc = re.search(r"^description: (.+)$", s, re.M).group(1).strip()
    gate = re.search(r"^## 放行条件\n(.+?)(?=\n## |\Z)", s, re.M | re.S); title = re.search(r"^# (.+)$", s, re.M)
    r = rows.get(d, {}); skills.append({"name": d, "line": "talk" if d.startswith("talk") else "video", "title": (title.group(1) if title else d), "desc": desc, "gate": (gate.group(1).strip().replace("`", "") if gate else ""), **r})
groups = []
for c in comps:
    if c["group"] not in groups: groups.append(c["group"])
data = {"components": comps, "groups": groups, "skills": skills}
open(os.path.join(root, "site/data.js"), "w", encoding="utf-8").write("window.SITE_DATA = " + json.dumps(data, ensure_ascii=False) + ";\n")
print(len(comps), "个组件，", len(groups), "组，", len(skills), "个 Skill")
for g in groups: print(" ", g, sum(1 for c in comps if c["group"] == g))
for s in skills: print(" ", s["name"], "|", s.get("what", "—")[:30], "|", s["title"])
