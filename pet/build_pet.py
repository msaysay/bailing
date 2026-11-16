# 频道宠物 v2：建模与渲染（Blender 4.2，命令行运行）。
# 设计依据（docs/宠物成长规则.md「形象设计」）：不像任何一种具体动物（方便分路线进化）；三个记号——头顶发光的「灵芽」、一条比身子还大的卷尾巴、一颗小虎牙；
# 婴儿比例（大头、眼睛大而靠下、分得开、圆脸颊、短手短脚）；哑光软胶质感；进化时改的是轮廓（耳朵、灵芽、尾巴），不只是换色。
# 用法：blender -b -P pet/build_pet.py -- --stage 3 --branch tech --out <目录> [--still --frame 10] [--frames 48 --res 384 --samples 20] [--silhouette]
#   --stage 0 蛋 · 1 破壳 · 2 幼体 · 3 成体    --branch none / tech 机芯 / gold 金羽 / flame 焰心 / star 星语    --crack 蛋的裂纹 0 到 1
import bpy, math, sys, argparse, os
from mathutils import Vector
argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
ap = argparse.ArgumentParser(); ap.add_argument("--stage", type=int, default=2); ap.add_argument("--branch", default="none"); ap.add_argument("--crack", type=float, default=.3)
ap.add_argument("--out", default="/tmp/pet/"); ap.add_argument("--frames", type=int, default=48); ap.add_argument("--res", type=int, default=512); ap.add_argument("--samples", type=int, default=24)
ap.add_argument("--still", action="store_true"); ap.add_argument("--frame", type=int, default=10); ap.add_argument("--angle", type=float, default=-24); ap.add_argument("--silhouette", action="store_true")
A = ap.parse_args(argv)
bpy.ops.wm.read_factory_settings(use_empty=True)
S = bpy.context.scene; F = A.frames; TAU = math.tau; ST = min(A.stage, 3); BR = A.branch if ST >= 3 else "none"
# 主色、脸罩色、点缀色、发光色、眼睛虹膜色
PAL = {"none": ((1.0, .50, .26), (1.0, .80, .58), (.98, .42, .22), (1.0, .78, .35), (.25, .16, .12)),
       "tech": ((.12, .30, .78), (.62, .84, 1.0), (.05, .12, .32), (.10, .95, 1.0), (.02, .35, .55)),
       "gold": ((.98, .62, .10), (1.0, .84, .50), (.70, .36, .04), (1.0, .82, .30), (.35, .20, .04)),
       "flame": ((.90, .16, .12), (1.0, .72, .52), (.35, .05, .06), (1.0, .50, .08), (.45, .06, .04)),
       "star": ((.30, .20, .78), (.74, .66, 1.0), (.12, .06, .38), (.85, .70, 1.0), (.20, .10, .45))}
MAIN, FACE, ACC, GLOW, IRIS = PAL[BR]

def nodes_mat(name):
    m = bpy.data.materials.new(name); m.use_nodes = True; return m, m.node_tree, m.node_tree.nodes["Principled BSDF"]
def mat(name, col, rough=.6, sss=.0, emit=None, estr=0., metal=0., coat=0., trans=0.):
    m, nt, b = nodes_mat(name); b.inputs["Base Color"].default_value = (*col, 1); b.inputs["Roughness"].default_value = rough; b.inputs["Metallic"].default_value = metal
    b.inputs["Subsurface Weight"].default_value = sss; b.inputs["Subsurface Radius"].default_value = (.4, .2, .12); b.inputs["Coat Weight"].default_value = coat; b.inputs["Transmission Weight"].default_value = trans
    if emit: b.inputs["Emission Color"].default_value = (*emit, 1); b.inputs["Emission Strength"].default_value = estr
    return m
def silh(m):
    if A.silhouette:
        m.use_nodes = True; nt = m.node_tree; [nt.nodes.remove(n) for n in list(nt.nodes) if n.type != "OUTPUT_MATERIAL"]; e = nt.nodes.new("ShaderNodeEmission"); e.inputs[0].default_value = (0, 0, 0, 1); nt.links.new(e.outputs[0], nt.nodes["Material Output"].inputs[0])
    return m
def body_mat():
    """软胶身体：主色，前脸一块椭圆的浅色脸罩，边缘柔和。"""
    m, nt, b = nodes_mat("body"); b.inputs["Roughness"].default_value = .55; b.inputs["Subsurface Weight"].default_value = .12; b.inputs["Subsurface Radius"].default_value = (.5, .25, .15); b.inputs["Coat Weight"].default_value = .15; b.inputs["Coat Roughness"].default_value = .35
    tc = nt.nodes.new("ShaderNodeTexCoord"); sp = nt.nodes.new("ShaderNodeSeparateXYZ"); nt.links.new(tc.outputs["Object"], sp.inputs[0])
    def M(op, a, bb=None, v=None):
        n = nt.nodes.new("ShaderNodeMath"); n.operation = op
        (nt.links.new(a, n.inputs[0]) if not isinstance(a, (int, float)) else n.inputs[0].__setattr__("default_value", a))
        if bb is not None: (nt.links.new(bb, n.inputs[1]) if not isinstance(bb, (int, float)) else n.inputs[1].__setattr__("default_value", bb))
        return n.outputs[0]
    ex = M("POWER", M("DIVIDE", sp.outputs["X"], .50), 2); ez = M("POWER", M("DIVIDE", M("SUBTRACT", sp.outputs["Z"], -.22), .46), 2); d = M("ADD", ex, ez)
    mr = nt.nodes.new("ShaderNodeMapRange"); mr.inputs[1].default_value = .82; mr.inputs[2].default_value = 1.0; mr.inputs[3].default_value = 1; mr.inputs[4].default_value = 0; nt.links.new(d, mr.inputs[0])
    fr = nt.nodes.new("ShaderNodeMapRange"); fr.inputs[1].default_value = -.15; fr.inputs[2].default_value = -.45; fr.inputs[3].default_value = 0; fr.inputs[4].default_value = 1; nt.links.new(sp.outputs["Y"], fr.inputs[0])
    k = M("MULTIPLY", mr.outputs[0], fr.outputs[0])
    mix = nt.nodes.new("ShaderNodeMix"); mix.data_type = "RGBA"; mix.inputs[6].default_value = (*MAIN, 1); mix.inputs[7].default_value = (*FACE, 1); nt.links.new(k, mix.inputs[0]); nt.links.new(mix.outputs[2], b.inputs["Base Color"])
    if BR == "star":   # 星语：身上撒细碎的星点
        vo = nt.nodes.new("ShaderNodeTexVoronoi"); vo.inputs["Scale"].default_value = 18; nt.links.new(tc.outputs["Object"], vo.inputs["Vector"])
        st = nt.nodes.new("ShaderNodeMapRange"); st.inputs[1].default_value = .06; st.inputs[2].default_value = .02; st.inputs[3].default_value = 0; st.inputs[4].default_value = 8; nt.links.new(vo.outputs["Distance"], st.inputs[0])
        b.inputs["Emission Color"].default_value = (*GLOW, 1); nt.links.new(M("MULTIPLY", st.outputs[0], M("SUBTRACT", 1, k)), b.inputs["Emission Strength"])
    return silh(m)
def obj_sphere(name, loc, scale, m, seg=48, parent=None, rot=None):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=seg, ring_count=seg // 2, location=loc); o = bpy.context.object; o.name = name; o.scale = scale; bpy.ops.object.shade_smooth(); o.data.materials.append(m)
    if rot: o.rotation_euler = rot
    if parent: o.parent = parent
    return o
def obj_cone(name, loc, r1, r2, depth, m, rot=(0, 0, 0), parent=None, verts=32, sub=0):
    bpy.ops.mesh.primitive_cone_add(vertices=verts, radius1=r1, radius2=r2, depth=depth, location=loc, rotation=rot); o = bpy.context.object; o.name = name; bpy.ops.object.shade_smooth(); o.data.materials.append(m)
    if sub: md = o.modifiers.new("s", "SUBSURF"); md.levels = md.render_levels = sub
    if parent: o.parent = parent
    return o
def tube(name, pts, radii, m, parent=None, bev=.12):
    """一根沿着点走的圆管，每个点可以有不同粗细（做尾巴、火苗、天线）。"""
    cu = bpy.data.curves.new(name, "CURVE"); cu.dimensions = "3D"; cu.bevel_depth = bev; cu.bevel_resolution = 6; cu.use_fill_caps = True
    sp = cu.splines.new("NURBS"); sp.points.add(len(pts) - 1); sp.use_endpoint_u = True; sp.order_u = 4
    for p, (co, r) in zip(sp.points, zip(pts, radii)): p.co = (*co, 1); p.radius = r
    o = bpy.data.objects.new(name, cu); bpy.context.collection.objects.link(o); o.data.materials.append(m)
    if parent: o.parent = parent
    return o
def surf(x, z, rx, ry, rz, cz):
    """身体椭球表面上，给定 x、z 时前脸那一点的 y。"""
    v = 1 - (x / rx) ** 2 - ((z - cz) / rz) ** 2; return -ry * math.sqrt(max(v, 0))

# ---------- 场景 ----------
S.render.engine = "CYCLES"; S.cycles.device = "CPU"; S.cycles.samples = A.samples; S.cycles.use_denoising = True
S.render.film_transparent = True; S.render.resolution_x = S.render.resolution_y = A.res; S.render.image_settings.file_format = "PNG"; S.render.image_settings.color_mode = "RGBA"
S.view_settings.view_transform = "AgX"; S.view_settings.look = "AgX - Punchy"; S.frame_start, S.frame_end = 1, F; S.render.fps = 24
w = bpy.data.worlds.new("w"); S.world = w; w.use_nodes = True; w.node_tree.nodes["Background"].inputs[0].default_value = (.6, .65, .75, 1); w.node_tree.nodes["Background"].inputs[1].default_value = .3
def light(loc, energy, size, col):
    bpy.ops.object.light_add(type="AREA", location=loc); l = bpy.context.object; l.data.energy = energy; l.data.size = size; l.data.color = col; l.rotation_euler = (Vector((0, 0, .7)) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()
light((2.2, -3.4, 2.6), 340, 3.5, (1, .95, .88)); light((-3.4, -2.0, 1.4), 90, 3.5, (.82, .9, 1)); light((-1.5, 3.4, 2.4), 420, 1.8, (1, .9, 1)); light((2.6, 2.6, 1.0), 200, 1.5, (*GLOW,))
bpy.ops.object.camera_add(location=(0, -6.4, 1.7)); cam = bpy.context.object; S.camera = cam; cam.data.lens = 58; cam.rotation_euler = (Vector((0, 0, .9)) - cam.location).to_track_quat("-Z", "Y").to_euler()
bpy.ops.object.empty_add(); root = bpy.context.object; root.rotation_euler[2] = math.radians(A.angle)
bpy.ops.object.empty_add(); rig = bpy.context.object; rig.parent = root

M_body = body_mat(); M_acc = silh(mat("acc", ACC, .5, coat=.3)); M_glow = silh(mat("glow", GLOW, .3, emit=GLOW, estr=4.5))
M_eye = silh(mat("eye", (.015, .012, .02), .05, coat=1)); M_iris = silh(mat("iris", IRIS, .2, coat=1, emit=IRIS, estr=.6)); M_hi = silh(mat("hi", (1, 1, 1), .2, emit=(1, 1, 1), estr=8))
M_mouth = silh(mat("mouth", (.22, .04, .06), .5)); M_tongue = silh(mat("tongue", (1, .38, .42), .5)); M_fang = silh(mat("fang", (1, 1, .98), .25, coat=.5)); M_cheek = silh(mat("cheek", (1, .42, .5), .7, emit=(1, .35, .45), estr=.4))
M_shell = silh(mat("shell", (1, .92, .80), .45, sss=.15, coat=.4))
blink = int(F * .62)

def creature(sc, ear, tail, tuft):
    rx, ry, rz = .96 * sc, .88 * sc, .90 * sc; cz = rz + .05
    bpy.ops.mesh.primitive_uv_sphere_add(segments=64, ring_count=32, location=(0, 0, cz)); b = bpy.context.object; b.name = "body"; bpy.ops.object.shade_smooth(); b.data.materials.append(M_body); b.parent = rig
    for v in b.data.vertices:   # 下半身略宽，像一只坐着的团子
        k = 1 + .10 * max(0, -v.co.z); v.co.x *= k; v.co.y *= k
    b.scale = (rx, ry, rz)
    # 眼睛：大、靠下、分得开；黑底 + 彩色虹膜 + 两个高光
    eyes = []
    for sx in (-1, 1):
        ex, ez = sx * .34 * sc, cz - .02 * sc; ey = surf(ex, ez, rx * 1.03, ry, rz, cz) + .02 * sc
        bpy.ops.object.empty_add(location=(ex, ey, ez)); e = bpy.context.object; e.parent = rig; e.rotation_euler = (0, 0, sx * math.radians(-14)); eyes.append(e)
        obj_sphere("eye", (0, 0, 0), (.17 * sc, .07 * sc, .21 * sc), M_eye, parent=e)
        obj_sphere("iris", (0, -.045 * sc, -.05 * sc), (.12 * sc, .04 * sc, .12 * sc), M_iris, parent=e)
        obj_sphere("hi1", (-.05 * sc, -.075 * sc, .07 * sc), (.06 * sc, .02 * sc, .07 * sc), M_hi, seg=16, parent=e)
        obj_sphere("hi2", (.06 * sc, -.07 * sc, -.09 * sc), (.025 * sc, .015 * sc, .025 * sc), M_hi, seg=12, parent=e)
        cx, czz = sx * .58 * sc, cz - .20 * sc; obj_sphere("cheek", (cx, surf(cx, czz, rx * 1.02, ry, rz, cz), czz), (.12 * sc, .03 * sc, .075 * sc), M_cheek, seg=24, parent=rig, rot=(0, 0, sx * math.radians(-35)))
    # 嘴：小小张开的笑，一颗虎牙
    mz = cz - .30 * sc; my = surf(0, mz, rx, ry, rz, cz)
    m = obj_sphere("mouth", (0, my + .01 * sc, mz), (.15 * sc, .05 * sc, .10 * sc), M_mouth, parent=rig); m.rotation_euler[0] = math.radians(-12)
    obj_sphere("tongue", (0, my - .02 * sc, mz - .045 * sc), (.09 * sc, .035 * sc, .045 * sc), M_tongue, seg=24, parent=rig)
    obj_cone("fang", (.06 * sc, my - .03 * sc, mz + .045 * sc), .035 * sc, 0, .085 * sc, M_fang, rot=(math.radians(180), 0, 0), parent=rig, verts=16)
    # 小手小脚
    for sx in (-1, 1):
        obj_sphere("hand", (sx * .84 * sc, -.28 * sc, cz - .38 * sc), (.13 * sc, .13 * sc, .16 * sc), M_body, seg=24, parent=rig)
        obj_sphere("foot", (sx * .38 * sc, -.40 * sc, .08 * sc), (.20 * sc, .24 * sc, .10 * sc), M_body, seg=24, parent=rig)
    # 耳朵：随路线换轮廓
    for sx in (-1, 1):
        base = (sx * .58 * sc, .1 * sc, cz + .80 * sc); tilt = (0, sx * math.radians(-28 if ear != "fin" else -40), 0)
        if ear == "nub": obj_cone("ear", base, .20 * sc, .06 * sc, .34 * sc, M_body, rot=tilt, parent=rig, sub=2)
        elif ear == "fin": obj_cone("ear", base, .20 * sc, .0, .62 * sc, M_acc, rot=tilt, parent=rig, verts=4, sub=0)
        elif ear == "feather": obj_cone("ear", base, .16 * sc, .03 * sc, .78 * sc, M_acc, rot=(math.radians(-12), sx * math.radians(-38), 0), parent=rig, sub=2)
        elif ear == "flame": obj_cone("ear", base, .2 * sc, 0, .66 * sc, M_glow, rot=tilt, parent=rig, sub=2)
        elif ear == "moon": tube("ear", [(sx * .4 * sc, .05 * sc, cz + .62 * sc), (sx * .72 * sc, .05 * sc, cz + .9 * sc), (sx * .62 * sc, .05 * sc, cz + 1.18 * sc)], [1, .7, .05], M_acc, parent=rig, bev=.12 * sc)
    # 灵芽：头顶的记号
    tz = cz + rz
    if tuft == "sprout": tube("tuft", [(0, 0, tz - .05 * sc), (.02 * sc, 0, tz + .2 * sc), (.16 * sc, 0, tz + .34 * sc), (.24 * sc, 0, tz + .28 * sc)], [1, .8, .5, .05], M_glow, parent=rig, bev=.09 * sc)
    elif tuft == "antenna": tube("tuft", [(0, 0, tz - .05 * sc), (0, 0, tz + .3 * sc), (.04 * sc, 0, tz + .5 * sc)], [.5, .4, .3], M_acc, parent=rig, bev=.05 * sc); obj_sphere("tufttip", (.04 * sc, 0, tz + .58 * sc), (.12 * sc,) * 3, M_glow, parent=rig)
    elif tuft == "crown":
        for i in (-1, 0, 1): obj_cone("leaf", (i * .14 * sc, 0, tz + .12 * sc), .09 * sc, 0, (.42 if i == 0 else .3) * sc, silh(mat("gold", (1, .76, .25), .22, metal=1)), rot=(0, i * math.radians(22), 0), parent=rig, sub=1)
    elif tuft == "flame": tube("tuft", [(0, 0, tz - .1 * sc), (.05 * sc, 0, tz + .25 * sc), (-.1 * sc, 0, tz + .5 * sc), (.12 * sc, 0, tz + .78 * sc)], [1.6, 1.2, .7, .02], M_glow, parent=rig, bev=.14 * sc)
    elif tuft == "star":
        bpy.ops.mesh.primitive_cone_add(vertices=5, radius1=.24 * sc, radius2=0, depth=.1 * sc, location=(0, 0, tz + .3 * sc), rotation=(math.radians(90), 0, 0)); o = bpy.context.object; o.data.materials.append(M_glow); o.parent = rig
        tube("stem", [(0, 0, tz - .05 * sc), (0, 0, tz + .2 * sc)], [.4, .3], M_acc, parent=rig, bev=.05 * sc)
    # 尾巴：从屁股后面卷上去，比身子还高——这是剪影里最好认的部分
    if tail:
        L = {"small": .45, "mid": .8, "big": 1.0}[tail[0]]; kind = tail[1]
        P = [(.35 * sc, .55 * sc, .35 * sc), (.85 * sc, .85 * sc, .55 * sc), (1.25 * sc * L + .1, .7 * sc, 1.1 * sc * L + .3), (1.15 * sc * L + .1, .55 * sc, 1.65 * sc * L + .35), (.82 * sc * L + .1, .5 * sc, 1.78 * sc * L + .35), (.7 * sc * L + .1, .48 * sc, 1.55 * sc * L + .35)]
        R = [1.0, 1.25, 1.1, .85, .6, .35]
        if kind == "fluff": tube("tail", P, R, M_body, parent=rig, bev=.22 * sc)
        elif kind == "cable":
            tube("tail", P, [.45] * 6, M_acc, parent=rig, bev=.12 * sc)
            for i in range(1, 6): obj_sphere("seg", P[i], (.13 * sc,) * 3, M_glow if i == 5 else M_body, seg=24, parent=rig)
        elif kind == "fan":
            tube("tail", P[:3], R[:3], M_body, parent=rig, bev=.2 * sc)
            for i in range(5): a = math.radians(-50 + i * 25); obj_cone("plume", (P[2][0] + math.sin(a) * .35 * sc, P[2][1], P[2][2] + math.cos(a) * .45 * sc), .15 * sc, .02 * sc, .8 * sc, silh(mat("gold2", (1, .7, .18), .25, metal=.9)), rot=(0, a, 0), parent=rig, sub=2)
        elif kind == "flame": tube("tail", P, [1.0, 1.4, 1.6, 1.2, .6, .02], M_glow, parent=rig, bev=.2 * sc)
        elif kind == "galaxy":
            tube("tail", P, R, silh(mat("gal", MAIN, .2, emit=GLOW, estr=1.5, trans=.5)), parent=rig, bev=.22 * sc)
            bpy.ops.mesh.primitive_cone_add(vertices=5, radius1=.2 * sc, radius2=0, depth=.08 * sc, location=P[-1], rotation=(math.radians(90), 0, 0)); o = bpy.context.object; o.data.materials.append(M_glow); o.parent = rig
    # 眨眼
    for e in eyes:
        for fr, zs in ((1, 1), (blink - 2, 1), (blink, .1), (blink + 2, 1), (F + 1, 1)): e.scale[2] = zs; e.keyframe_insert("scale", index=2, frame=fr)
    return cz

def egg(crack):
    cz = 1.0
    bpy.ops.mesh.primitive_uv_sphere_add(segments=64, ring_count=32, location=(0, 0, cz)); e = bpy.context.object; bpy.ops.object.shade_smooth(); e.parent = rig
    for v in e.data.vertices: k = 1 - .15 * max(0, v.co.z); v.co.x *= k; v.co.y *= k
    e.scale = (.8, .8, 1.0)
    m, nt, b = nodes_mat("egg"); b.inputs["Roughness"].default_value = .45; b.inputs["Coat Weight"].default_value = .4; b.inputs["Subsurface Weight"].default_value = .15
    tc = nt.nodes.new("ShaderNodeTexCoord"); sp = nt.nodes.new("ShaderNodeSeparateXYZ"); nt.links.new(tc.outputs["Object"], sp.inputs[0])
    # 两色蛋：下半主色、上半浅色，中间一道波浪分界
    wv = nt.nodes.new("ShaderNodeTexVoronoi"); wv.inputs["Scale"].default_value = 3.5; nt.links.new(tc.outputs["Object"], wv.inputs["Vector"])
    add = nt.nodes.new("ShaderNodeMath"); add.operation = "ADD"; add.operation = "MULTIPLY"; add.inputs[1].default_value = 1.0; nt.links.new(wv.outputs["Distance"], add.inputs[0])
    band = nt.nodes.new("ShaderNodeMapRange"); band.inputs[1].default_value = .16; band.inputs[2].default_value = .22; nt.links.new(add.outputs[0], band.inputs[0])
    mix = nt.nodes.new("ShaderNodeMix"); mix.data_type = "RGBA"; mix.inputs[6].default_value = (*PAL["none"][0], 1); mix.inputs[7].default_value = (1, .93, .84, 1); nt.links.new(band.outputs[0], mix.inputs[0]); nt.links.new(mix.outputs[2], b.inputs["Base Color"])
    vo = nt.nodes.new("ShaderNodeTexVoronoi"); vo.feature = "DISTANCE_TO_EDGE"; vo.inputs["Scale"].default_value = 3.0; nt.links.new(tc.outputs["Object"], vo.inputs["Vector"])
    mr = nt.nodes.new("ShaderNodeMapRange"); mr.inputs[1].default_value = 0; mr.inputs[2].default_value = .015 + .05 * crack; mr.inputs[3].default_value = 1; mr.inputs[4].default_value = 0; nt.links.new(vo.outputs["Distance"], mr.inputs[0])
    h = nt.nodes.new("ShaderNodeMapRange"); h.inputs[1].default_value = 1.0 - 2.0 * crack; h.inputs[2].default_value = 1.25 - 2.0 * crack; nt.links.new(sp.outputs["Z"], h.inputs[0])
    m1 = nt.nodes.new("ShaderNodeMath"); m1.operation = "MULTIPLY"; nt.links.new(mr.outputs[0], m1.inputs[0]); nt.links.new(h.outputs[0], m1.inputs[1])
    m2 = nt.nodes.new("ShaderNodeMath"); m2.operation = "MULTIPLY"; m2.inputs[1].default_value = 14 * crack; nt.links.new(m1.outputs[0], m2.inputs[0])
    b.inputs["Emission Color"].default_value = (*PAL["none"][3], 1); nt.links.new(m2.outputs[0], b.inputs["Emission Strength"]); e.data.materials.append(silh(m))
    # 灵芽从蛋顶冒出来
    tz = cz + 1.0
    tube("tuft", [(0, 0, tz - .12), (.02, 0, tz + .08), (.14, 0, tz + .2), (.22, 0, tz + .14)], [1, .8, .5, .05], silh(mat("g0", PAL["none"][3], .3, emit=PAL["none"][3], estr=3 + 5 * crack)), parent=rig, bev=.08)
    amp = math.radians(4 + 10 * crack)
    for fr in range(1, F + 2):
        p = (fr - 1) / F; rig.rotation_euler[1] = amp * math.sin(p * TAU * 3) * math.sin(p * math.pi) ** 2; rig.keyframe_insert("rotation_euler", index=1, frame=fr)

if ST == 0: egg(A.crack)
else:
    form = {1: (.78, "nub", ("small", "fluff"), "sprout"), 2: (.92, "nub", ("mid", "fluff"), "sprout")}
    form3 = {"tech": ("fin", ("big", "cable"), "antenna"), "gold": ("feather", ("big", "fan"), "crown"), "flame": ("flame", ("big", "flame"), "flame"), "star": ("moon", ("big", "galaxy"), "star"), "none": ("nub", ("big", "fluff"), "sprout")}
    if ST < 3: sc, ear, tail, tuft = form[ST]
    else: sc = 1.0; ear, tail, tuft = form3[BR]
    cz = creature(sc, ear, tail, tuft)
    if ST == 1:   # 破壳：坐在下半个蛋壳里
        bpy.ops.mesh.primitive_uv_sphere_add(segments=48, ring_count=24, location=(0, 0, .55)); sh = bpy.context.object; sh.scale = (1.0, 1.0, .75); bpy.ops.object.shade_smooth()
        bpy.ops.object.mode_set(mode="EDIT"); bpy.ops.mesh.select_all(action="DESELECT"); bpy.ops.object.mode_set(mode="OBJECT")
        for v in sh.data.vertices: a_ = math.atan2(v.co.y, v.co.x); v.select = v.co.z > -.02 + .16 * abs(math.sin(a_ * 4.5)) * (.6 + .4 * math.sin(a_ * 11))
        bpy.ops.object.mode_set(mode="EDIT"); bpy.ops.mesh.delete(type="VERT"); bpy.ops.object.mode_set(mode="OBJECT")
        sol = sh.modifiers.new("t", "SOLIDIFY"); sol.thickness = .05; sh.data.materials.append(M_shell); sh.parent = rig
    for fr in range(1, F + 2):   # 呼吸：上下弹、轻微挤压
        p = (fr - 1) / F; up = .5 + .5 * math.sin(p * TAU * 2 - math.pi / 2)
        rig.location[2] = .05 * up; rig.keyframe_insert("location", index=2, frame=fr); rig.scale = (1 + .02 * (1 - up), 1 + .02 * (1 - up), 1 - .025 * (1 - up) + .015 * up); rig.keyframe_insert("scale", frame=fr)
if not A.silhouette:
    bpy.ops.mesh.primitive_plane_add(size=8); bpy.context.object.is_shadow_catcher = True
for o in bpy.data.objects:
    if o.animation_data and o.animation_data.action:
        for fc in o.animation_data.action.fcurves:
            if not any(mm.type == "CYCLES" for mm in fc.modifiers): fc.modifiers.new("CYCLES")
os.makedirs(A.out, exist_ok=True)
if A.still: S.frame_set(A.frame); S.render.filepath = os.path.join(A.out, "still.png"); bpy.ops.render.render(write_still=True)
else: S.render.filepath = os.path.join(A.out, "####"); bpy.ops.render.render(animation=True)
print("DONE", A.out)
