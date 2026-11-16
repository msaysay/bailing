# 频道宠物 · 浮石海豹（在用户提供的 QuietCompanions.blend 里「03 浮石海豹」的基础上优化）。
# 用法：blender -b pet/assets/QuietCompanions.blend -P pet/seal.py -- --stage 2 --branch none --expr calm --out <目录> [--still --frame 10] [--frames 48 --res 512 --samples 32]
#   --stage 0 冰蛋 · 1 破冰 · 2 幼崽 · 3 成体    --branch none / tech 机芯 / gold 金羽 / flame 焰心 / star 星语    --expr calm / happy / shock    --crack 冰蛋裂纹 0 到 1
# 改动：透明底 + 只留影子；镜头放低转正，让脸在小尺寸下也看得清；身体换成奶白的毛绒质感；眼睛放大、加高光；加腮红和头顶的小芽；
#       待机动画（呼吸、眨眼、拍鳍、甩尾）；按成长阶段和路线加配件。原模型的形体和比例不动。
import bpy, math, sys, argparse, os
from mathutils import Vector
argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
ap = argparse.ArgumentParser(); ap.add_argument("--stage", type=int, default=2); ap.add_argument("--branch", default="none"); ap.add_argument("--expr", default="calm"); ap.add_argument("--crack", type=float, default=.3)
ap.add_argument("--out", default="/tmp/seal/"); ap.add_argument("--frames", type=int, default=48); ap.add_argument("--res", type=int, default=512); ap.add_argument("--samples", type=int, default=32)
ap.add_argument("--still", action="store_true"); ap.add_argument("--frame", type=int, default=10); ap.add_argument("--yaw", type=float, default=22)
A = ap.parse_args(argv); ST = min(A.stage, 3); BR = A.branch if ST >= 3 else "none"; F = A.frames; TAU = math.tau

S = bpy.data.scenes["03 浮石海豹"]; bpy.context.window.scene = S
for sc in list(bpy.data.scenes):
    if sc != S: bpy.data.scenes.remove(sc)
G = bpy.data.objects["03 浮石海豹 · 整体"]; O = lambda n: bpy.data.objects[n]
body_parts = ["卵石形躯干", "左侧鳍", "右侧鳍", "左尾鳍", "右尾鳍"]

# ---------- 渲染与镜头 ----------
S.render.engine = "CYCLES"; S.cycles.device = "CPU"; S.cycles.samples = A.samples; S.cycles.use_denoising = True
S.render.film_transparent = True; S.render.resolution_x = S.render.resolution_y = A.res; S.render.resolution_percentage = 100
S.render.image_settings.file_format = "PNG"; S.render.image_settings.color_mode = "RGBA"; S.frame_start, S.frame_end = 1, F; S.render.fps = 24
S.view_settings.look = "AgX - Base Contrast"
O("无缝地面.002").is_shadow_catcher = True
cam = S.camera; cam.location = (math.sin(math.radians(A.yaw)) * 6.6, -math.cos(math.radians(A.yaw)) * 6.6, 1.9); cam.data.lens = 52
cam.rotation_euler = (Vector((0, .05, .55)) - cam.location).to_track_quat("-Z", "Y").to_euler()
for l in [o for o in S.objects if o.type == "LIGHT"]: l.data.energy *= .9

# ---------- 材质 ----------
PAL = {"none": ((.90, .91, .92), (.99, .98, .96)), "tech": ((.60, .74, .92), (.94, .97, 1.0)), "gold": ((.97, .82, .52), (1.0, .96, .84)),
       "flame": ((.97, .70, .62), (1.0, .93, .88)), "star": ((.72, .66, .94), (.96, .94, 1.0))}
FUR, MUZZ = PAL[BR]
def plush(m, col, sheen=.7):
    b = next(n for n in m.node_tree.nodes if n.type == "BSDF_PRINCIPLED"); nt = m.node_tree
    b.inputs["Base Color"].default_value = (*col, 1); b.inputs["Roughness"].default_value = .82; b.inputs["Coat Weight"].default_value = 0
    b.inputs["Sheen Weight"].default_value = sheen; b.inputs["Sheen Roughness"].default_value = .4; b.inputs["Subsurface Weight"].default_value = .3; b.inputs["Subsurface Radius"].default_value = (.7, .5, .4)
    if not any(n.type == "BUMP" for n in nt.nodes):
        tc = nt.nodes.new("ShaderNodeTexCoord"); nz = nt.nodes.new("ShaderNodeTexNoise"); nz.inputs["Scale"].default_value = 300; nz.inputs["Detail"].default_value = 4; nt.links.new(tc.outputs["Object"], nz.inputs["Vector"])
        bm = nt.nodes.new("ShaderNodeBump"); bm.inputs["Strength"].default_value = .15; bm.inputs["Distance"].default_value = .002; nt.links.new(nz.outputs["Fac"], bm.inputs["Height"]); nt.links.new(bm.outputs["Normal"], b.inputs["Normal"])
M = bpy.data.materials
plush(M["浮石 · 雾灰石粉"], FUR); plush(M["浮石 · 奶白石粉"], MUZZ, .5)
shade = M["浮石 · 阴灰"]; next(n for n in shade.node_tree.nodes if n.type == "BSDF_PRINCIPLED").inputs["Base Color"].default_value = (FUR[0] * .72, FUR[1] * .74, FUR[2] * .78, 1)
eyeg = next(n for n in M["浮石 · 深灰玻璃"].node_tree.nodes if n.type == "BSDF_PRINCIPLED"); eyeg.inputs["Base Color"].default_value = (.012, .012, .016, 1); eyeg.inputs["Coat Weight"].default_value = 1; eyeg.inputs["Roughness"].default_value = .06; eyeg.inputs["Coat Roughness"].default_value = .02
def mat(name, col, rough=.5, emit=None, estr=0., metal=0., coat=0.):
    m = bpy.data.materials.new(name); m.use_nodes = True; b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*col, 1); b.inputs["Roughness"].default_value = rough; b.inputs["Metallic"].default_value = metal; b.inputs["Coat Weight"].default_value = coat
    if emit: b.inputs["Emission Color"].default_value = (*emit, 1); b.inputs["Emission Strength"].default_value = estr
    return m
GLOW = {"none": (.65, .95, .45), "tech": (.3, .9, 1.0), "gold": (1, .8, .3), "flame": (1, .5, .15), "star": (.9, .78, 1.0)}[BR]
M_hi = mat("hi", (1, 1, 1), .2, (1, 1, 1), 6); M_cheek = mat("cheek", (1, .58, .62), .9); M_leaf = mat("leaf", (.45, .74, .34), .7)
M_glow = mat("glow", GLOW, .4, GLOW, 5); M_dark = mat("dark", (.12, .14, .2), .4, coat=.5); M_gold = mat("gold", (1, .74, .22), .28, metal=1)

def add(kind, name, loc, scale=(1, 1, 1), m=None, rot=(0, 0, 0), parent=G, **kw):
    getattr(bpy.ops.mesh, f"primitive_{kind}_add")(location=loc, rotation=rot, **kw); o = bpy.context.object; o.name = name; o.scale = scale
    if kind in ("uv_sphere", "cone", "torus", "cylinder"): bpy.ops.object.shade_smooth()
    if m: o.data.materials.append(m)
    o.parent = parent; return o
def tube(name, pts, rad, m, bev, parent=G):
    cu = bpy.data.curves.new(name, "CURVE"); cu.dimensions = "3D"; cu.bevel_depth = bev; cu.bevel_resolution = 6; cu.use_fill_caps = True
    sp = cu.splines.new("NURBS"); sp.points.add(len(pts) - 1); sp.use_endpoint_u = True; sp.order_u = min(4, len(pts))
    for p, co, r in zip(sp.points, pts, rad): p.co = (*co, 1); p.radius = r
    o = bpy.data.objects.new(name, cu); S.collection.objects.link(o); o.data.materials.append(m); o.parent = parent; return o

# ---------- 脸：眼睛放大、高光、腮红、表情 ----------
eyes = [O("左 · 眼.001"), O("右 · 眼.001")]; sockets = [O("左 · 眼窝.001"), O("右 · 眼窝.001")]
for e in eyes: e.scale = (e.scale[0] * 1.3, e.scale[1] * 1.2, e.scale[2] * 1.3)
for e in sockets: e.scale = (e.scale[0] * 1.12, e.scale[1], e.scale[2] * 1.12)
for e in eyes:
    pass   # 高光交给眼睛材质本身的清漆层，不再另加小球
for sx in (-1, 1): add("uv_sphere", "cheek", (sx * .40, -1.0, .70), (.11, .03, .06), M_cheek, rot=(math.radians(-8), 0, sx * math.radians(-30)), segments=32, ring_count=16)
if A.expr == "happy":   # 眼睛换成弯弯的 ^ ^
    for e, s_ in zip(eyes, sockets):
        e.hide_render = s_.hide_render = True; x, y, z = e.location
        tube("arc", [(x - .09, y - .05, z - .025), (x, y - .09, z + .05), (x + .09, y - .05, z - .025)], [1, 1, 1], M["浮石 · 深灰玻璃"], .032)
elif A.expr == "shock":
    for e in eyes: e.scale = (e.scale[0] * 1.15, e.scale[1], e.scale[2] * 1.4)

# ---------- 头顶的小芽和成长配件 ----------
top = (0, -.15, 1.12)
def sprout(size=1.0, leafm=M_leaf, n=2):
    tube("stem", [(top[0], top[1], top[2] - .04), (top[0], top[1], top[2] + .13 * size), (top[0] + .02, top[1], top[2] + .2 * size)], [1, .9, .8], leafm, .022)
    for i in range(n):
        a = (i - (n - 1) / 2) * 2.2; add("uv_sphere", "leaf", (top[0] + math.sin(a) * .1 * size, top[1], top[2] + .23 * size), (.11 * size, .03, .06 * size), leafm, rot=(0, -a * .6, 0), segments=24, ring_count=12)
if ST >= 1 and BR == "none": sprout({1: .7, 2: 1.0, 3: 1.2}[ST])
if BR == "tech":   # 机芯：一副头戴耳机，芽变成天线
    t = add("torus", "band", (0, -.42, .62), (1, 1, .62), M_dark, rot=(math.radians(90), 0, 0), major_radius=.92, minor_radius=.045)
    bpy.ops.object.mode_set(mode="EDIT"); bpy.ops.mesh.select_all(action="DESELECT"); bpy.ops.object.mode_set(mode="OBJECT")
    for v in t.data.vertices: v.select = v.co.y < -.05   # 只留上半圈（环在 XZ 平面，旋转前的 y 对应高度）
    bpy.ops.object.mode_set(mode="EDIT"); bpy.ops.mesh.delete(type="VERT"); bpy.ops.object.mode_set(mode="OBJECT")
    for sx in (-1, 1): add("uv_sphere", "cup", (sx * .90, -.42, .62), (.12, .22, .22), M_dark, segments=32, ring_count=16); add("uv_sphere", "cupl", (sx * 1.02, -.42, .62), (.02, .13, .13), M_glow, segments=24, ring_count=12)
    tube("ant", [(top[0], top[1], top[2] - .03), (top[0], top[1], top[2] + .2)], [.6, .5], M_dark, .025); add("uv_sphere", "antb", (top[0], top[1], top[2] + .26), (.06,) * 3, M_glow, segments=24, ring_count=12)
elif BR == "gold":   # 金羽：两只鳍抱着一枚金币，芽变成金叶
    c = add("cylinder", "coin", (0, -1.28, .42), (1, 1, 1), M_gold, rot=(math.radians(80), 0, 0), vertices=48, radius=.26, depth=.05); bv = c.modifiers.new("b", "BEVEL"); bv.width = .015; bv.segments = 3
    add("torus", "coinr", (0, -1.31, .425), (1, 1, 1), mat("gold2", (.85, .55, .12), .3, metal=1), rot=(math.radians(80), 0, 0), major_radius=.19, minor_radius=.012); sprout(1.2, M_gold, 3)
elif BR == "flame":   # 焰心：头顶一簇火苗，尾巴尖也冒着小火
    for i, (x, h) in enumerate(((-.15, .40), (0, .62), (.15, .44))): o = add("cone", "flame", (x, top[1], top[2] + h * .42), (1, 1, 1), M_glow, vertices=24, radius1=.13, radius2=0, depth=h); s_ = o.modifiers.new("s", "SUBSURF"); s_.levels = s_.render_levels = 2
elif BR == "star":   # 星语：芽顶一颗星，身边绕着两颗小星
    tube("stem", [(top[0], top[1], top[2] - .03), (top[0], top[1], top[2] + .18)], [.5, .4], M_leaf, .022)
    add("cone", "star", (top[0], top[1], top[2] + .3), (1, 1, 1), M_glow, rot=(math.radians(90), 0, 0), vertices=5, radius1=.2, radius2=0, depth=.06)
    for i in range(2):
        bpy.ops.object.empty_add(location=(0, .09, .6)); orb = bpy.context.object; orb.parent = G
        add("uv_sphere", "spark", (1.25, 0, .25 * (1 if i else -1)), (.05,) * 3, M_glow, segments=16, ring_count=8, parent=orb)
        for fr in (1, F + 1): orb.rotation_euler[2] = (fr - 1) / F * TAU + i * math.pi; orb.keyframe_insert("rotation_euler", index=2, frame=fr)
        for fc in orb.animation_data.action.fcurves:
            for k in fc.keyframe_points: k.interpolation = "LINEAR"

# ---------- 冰蛋与破冰 ----------
M_ice = bpy.data.materials.new("ice"); M_ice.use_nodes = True; nt = M_ice.node_tree; ib = nt.nodes["Principled BSDF"]
ib.inputs["Base Color"].default_value = (.82, .92, 1.0, 1); ib.inputs["Roughness"].default_value = .18; ib.inputs["Transmission Weight"].default_value = .85; ib.inputs["IOR"].default_value = 1.31; ib.inputs["Coat Weight"].default_value = .5
tc = nt.nodes.new("ShaderNodeTexCoord"); vo = nt.nodes.new("ShaderNodeTexVoronoi"); vo.feature = "DISTANCE_TO_EDGE"; vo.inputs["Scale"].default_value = 2.6; nt.links.new(tc.outputs["Object"], vo.inputs["Vector"])
mr = nt.nodes.new("ShaderNodeMapRange"); mr.inputs[1].default_value = 0; mr.inputs[2].default_value = .008 + .035 * A.crack; mr.inputs[3].default_value = .6 + 9 * A.crack ** 2; mr.inputs[4].default_value = 0; nt.links.new(vo.outputs["Distance"], mr.inputs[0])
ib.inputs["Emission Color"].default_value = (.7, .92, 1, 1); nt.links.new(mr.outputs[0], ib.inputs["Emission Strength"])
if ST == 0:   # 小海豹缩成一团睡在一颗冰蛋里，隔着冰看得见；裂纹越多越亮
    G.scale = (.5, .5, .5); G.location = (0, -.05, .38)
    for e, s_ in zip(eyes, sockets):
        e.hide_render = s_.hide_render = True; x, y, z = e.location; tube("sleep", [(x - .07, y - .04, z + .01), (x, y - .055, z - .03), (x + .07, y - .04, z + .01)], [1, 1, 1], M["浮石 · 深灰玻璃"], .02)
    e = add("uv_sphere", "iceegg", (0, 0, .86), (1, 1, 1), M_ice, parent=None, segments=64, ring_count=32)
    for v in e.data.vertices: k = 1 - .14 * max(0, v.co.z); v.co.x *= k; v.co.y *= k
    e.scale = (.82, .82, .94)
if ST == 1:   # 破冰：坐在下半个冰壳里，头顶还扣着一小片冰
    sh = add("uv_sphere", "iceshell", (0, .09, .5), (1.25, 1.65, .75), M_ice, parent=None, segments=48, ring_count=24)
    bpy.ops.object.mode_set(mode="EDIT"); bpy.ops.mesh.select_all(action="DESELECT"); bpy.ops.object.mode_set(mode="OBJECT")
    for v in sh.data.vertices: a_ = math.atan2(v.co.y, v.co.x); v.select = v.co.z > -.05 + .18 * abs(math.sin(a_ * 4.5)) * (.6 + .4 * math.sin(a_ * 11))
    bpy.ops.object.mode_set(mode="EDIT"); bpy.ops.mesh.delete(type="VERT"); bpy.ops.object.mode_set(mode="OBJECT"); so = sh.modifiers.new("t", "SOLIDIFY"); so.thickness = .05
    G.scale = (.8, .8, .8)

# ---------- 待机动画：呼吸、眨眼、拍鳍、甩尾 ----------
blink = int(F * .62)
for fr in range(1, F + 2):
    p = (fr - 1) / F; up = .5 + .5 * math.sin(p * TAU * 2 - math.pi / 2); base = G.scale[0] if fr == 1 else base
    G.keyframe_insert("location", index=2, frame=fr) if False else None
    for o in [O(n) for n in body_parts[:1]]:
        o.scale = (o.scale[0], o.scale[1], o.scale[2]); 
    G.delta_scale = (1 + .02 * (1 - up), 1 + .02 * (1 - up), 1 - .03 * (1 - up) + .015 * up); G.keyframe_insert("delta_scale", frame=fr)
    for n, sx in (("左侧鳍", -1), ("右侧鳍", 1)):
        o = O(n); o.delta_rotation_euler = (0, sx * math.radians(10 * math.sin(p * TAU * 2)), 0); o.keyframe_insert("delta_rotation_euler", index=1, frame=fr)
    for n in ("左尾鳍", "右尾鳍"):
        o = O(n); o.delta_rotation_euler = (math.radians(8 * math.sin(p * TAU * 2 + 1.2)), 0, 0); o.keyframe_insert("delta_rotation_euler", index=0, frame=fr)
if A.expr != "happy" and ST > 0:
    for e in eyes + sockets:
        for fr, k in ((1, 1), (blink - 2, 1), (blink, .08), (blink + 2, 1), (F + 1, 1)): e.delta_scale = (1, 1, k); e.keyframe_insert("delta_scale", index=2, frame=fr)
for o in bpy.data.objects:
    if o.animation_data and o.animation_data.action:
        for fc in o.animation_data.action.fcurves:
            if not any(m.type == "CYCLES" for m in fc.modifiers): fc.modifiers.new("CYCLES")
os.makedirs(A.out, exist_ok=True)
if A.still: S.frame_set(A.frame); S.render.filepath = os.path.join(A.out, "still.png"); bpy.ops.render.render(write_still=True)
else: S.render.filepath = os.path.join(A.out, "####"); bpy.ops.render.render(animation=True)
print("DONE", A.out)
