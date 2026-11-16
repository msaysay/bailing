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
ap.add_argument("--still", action="store_true"); ap.add_argument("--frame", type=int, default=10); ap.add_argument("--angle", type=float, default=-24); ap.add_argument("--silhouette", action="store_true"); ap.add_argument("--expr", default="calm")
A = ap.parse_args(argv)
bpy.ops.wm.read_factory_settings(use_empty=True)
S = bpy.context.scene; F = A.frames; TAU = math.tau; ST = min(A.stage, 3); BR = A.branch if ST >= 3 else "none"
# v3：参考成年人喜欢的 IP（卡皮巴拉的「情绪稳定」、吉伊卡哇的糯米团子、Loopy 的小表情）——低饱和奶油色、绒面、豆豆眼、表情是记号。
# 主色、肚皮色、点缀色、发光色、（保留位）
PAL = {"none": ((.90, .64, .40), (1.0, .93, .82), (.55, .78, .40), (.70, .95, .45), (0, 0, 0)),
       "tech": ((.45, .62, .88), (.92, .96, 1.0), (.14, .18, .28), (.35, .90, 1.0), (0, 0, 0)),
       "gold": ((.95, .72, .30), (1.0, .94, .78), (.80, .55, .15), (1.0, .82, .35), (0, 0, 0)),
       "flame": ((.92, .45, .32), (1.0, .88, .78), (.85, .30, .20), (1.0, .52, .15), (0, 0, 0)),
       "star": ((.58, .50, .86), (.95, .92, 1.0), (.30, .22, .60), (.90, .80, 1.0), (0, 0, 0))}
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
def body_mat(col=None, belly=True):
    """绒面身体：主色，前下方一块柔边的浅色肚皮；细小的凹凸和边缘光做出毛绒感。"""
    m, nt, b = nodes_mat("body"); b.inputs["Roughness"].default_value = .85; b.inputs["Sheen Weight"].default_value = .6; b.inputs["Sheen Roughness"].default_value = .35; b.inputs["Sheen Tint"].default_value = (1, 1, 1, 1)
    b.inputs["Subsurface Weight"].default_value = .25; b.inputs["Subsurface Radius"].default_value = (.6, .35, .25)
    tc = nt.nodes.new("ShaderNodeTexCoord"); sp = nt.nodes.new("ShaderNodeSeparateXYZ"); nt.links.new(tc.outputs["Object"], sp.inputs[0])
    nz = nt.nodes.new("ShaderNodeTexNoise"); nz.inputs["Scale"].default_value = 260; nz.inputs["Detail"].default_value = 4; nt.links.new(tc.outputs["Object"], nz.inputs["Vector"])
    bm = nt.nodes.new("ShaderNodeBump"); bm.inputs["Strength"].default_value = .18; bm.inputs["Distance"].default_value = .002; nt.links.new(nz.outputs["Fac"], bm.inputs["Height"]); nt.links.new(bm.outputs["Normal"], b.inputs["Normal"])
    base = col or MAIN
    if not belly: b.inputs["Base Color"].default_value = (*base, 1); return silh(m)
    ex = nt.nodes.new("ShaderNodeMath"); ex.operation = "DIVIDE"; ex.inputs[1].default_value = .55; nt.links.new(sp.outputs["X"], ex.inputs[0])
    zz = nt.nodes.new("ShaderNodeMath"); zz.operation = "SUBTRACT"; zz.inputs[1].default_value = -.45; nt.links.new(sp.outputs["Z"], zz.inputs[0])
    ez = nt.nodes.new("ShaderNodeMath"); ez.operation = "DIVIDE"; ez.inputs[1].default_value = .5; nt.links.new(zz.outputs[0], ez.inputs[0])
    vl = nt.nodes.new("ShaderNodeCombineXYZ"); nt.links.new(ex.outputs[0], vl.inputs[0]); nt.links.new(ez.outputs[0], vl.inputs[1])
    ln = nt.nodes.new("ShaderNodeVectorMath"); ln.operation = "LENGTH"; nt.links.new(vl.outputs[0], ln.inputs[0])
    mr = nt.nodes.new("ShaderNodeMapRange"); mr.inputs[1].default_value = .85; mr.inputs[2].default_value = 1.0; mr.inputs[3].default_value = 1; mr.inputs[4].default_value = 0; nt.links.new(ln.outputs["Value"], mr.inputs[0])
    fr = nt.nodes.new("ShaderNodeMapRange"); fr.inputs[1].default_value = -.1; fr.inputs[2].default_value = -.4; nt.links.new(sp.outputs["Y"], fr.inputs[0])
    k = nt.nodes.new("ShaderNodeMath"); k.operation = "MULTIPLY"; nt.links.new(mr.outputs[0], k.inputs[0]); nt.links.new(fr.outputs[0], k.inputs[1])
    mix = nt.nodes.new("ShaderNodeMix"); mix.data_type = "RGBA"; mix.inputs[6].default_value = (*base, 1); mix.inputs[7].default_value = (*FACE, 1); nt.links.new(k.outputs[0], mix.inputs[0]); nt.links.new(mix.outputs[2], b.inputs["Base Color"])
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
light((2.6, -3.0, 3.2), 420, 3.0, (1, .95, .86)); light((-3.4, -2.0, 1.4), 45, 3.5, (.8, .88, 1)); light((-1.5, 3.4, 2.4), 520, 2.0, (1, .96, .9)); light((1.8, 3.0, 1.6), 300, 1.6, (1, .9, .8))
bpy.ops.object.camera_add(location=(0, -6.4, 1.7)); cam = bpy.context.object; S.camera = cam; cam.data.lens = 62; cam.rotation_euler = (Vector((0, 0, .9)) - cam.location).to_track_quat("-Z", "Y").to_euler()
bpy.ops.object.empty_add(); root = bpy.context.object; root.rotation_euler[2] = math.radians(A.angle)
bpy.ops.object.empty_add(); rig = bpy.context.object; rig.parent = root

M_body = body_mat(); M_acc = silh(mat("acc", ACC, .5, coat=.3)); M_glow = silh(mat("glow", GLOW, .4, emit=GLOW, estr=3))
M_eye = silh(mat("eye", (.03, .025, .03), .25, coat=.6)); M_iris = silh(mat("iris", IRIS, .2, coat=1, emit=IRIS, estr=.6)); M_hi = silh(mat("hi", (1, 1, 1), .2, emit=(1, 1, 1), estr=8))
M_mouth = silh(mat("mouth", (.12, .06, .05), .6)); M_tongue = silh(mat("tongue", (1, .38, .42), .5)); M_fang = silh(mat("fang", (1, 1, .98), .25, coat=.5)); M_cheek = silh(mat("cheek", (1, .55, .55), .9))
M_shell = silh(mat("shell", (1, .92, .80), .45, sss=.15, coat=.4))
blink = int(F * .62)

def creature(sc, kit):
    """糯米团子：宽过高、底部压扁坐着；豆豆眼分得开、靠下；表情由 --expr 决定。kit 是这一形态的配件。"""
    rx, ry, rz = 1.0 * sc, .92 * sc, .88 * sc; cz = rz * .92
    bpy.ops.mesh.primitive_uv_sphere_add(segments=64, ring_count=32, location=(0, 0, cz)); b = bpy.context.object; bpy.ops.object.shade_smooth(); b.data.materials.append(M_body); b.parent = rig
    for v in b.data.vertices:
        if v.co.z < -.55: v.co.z = -.55 + (v.co.z + .55) * .25   # 底部压平，像坐在桌上的年糕
        k = 1 + .08 * max(0, -v.co.z); v.co.x *= k; v.co.y *= k
    b.scale = (rx, ry, rz)
    fy = lambda x, z: surf(x, z, rx * 1.02, ry, rz, cz)
    E = A.expr; ez = cz + .02 * sc
    for sx in (-1, 1):   # 豆豆眼
        ex = sx * .38 * sc; ey = fy(ex, ez) + .01
        if E in ("calm", "smug", "idle"):   # 豆豆眼：黑色竖椭圆，一个小高光；smug 是半眯
            h = .055 if E == "smug" else .10
            obj_sphere("eye", (ex, ey, ez - (.02 * sc if E == "smug" else 0)), (.085 * sc, .035 * sc, h * sc), M_eye, seg=24, parent=rig, rot=(0, sx * math.radians(8 if E == "smug" else 0), 0))
            obj_sphere("hi", (ex - .025 * sc, ey - .032 * sc, ez + (.0 if E == "smug" else .04) * sc), (.025 * sc, .01 * sc, .028 * sc), M_hi, seg=12, parent=rig)
        elif E == "happy":   # ^ ^
            tube("eye", [(ex - .07 * sc, ey - .01, ez - .02 * sc), (ex, ey - .02, ez + .05 * sc), (ex + .07 * sc, ey - .01, ez - .02 * sc)], [1, 1, 1], M_eye, parent=rig, bev=.026 * sc)
        elif E == "shock":
            obj_sphere("eye", (ex, ey, ez), (.075 * sc, .03 * sc, .095 * sc), M_eye, seg=24, parent=rig); obj_sphere("hi", (ex - .02 * sc, ey - .03 * sc, ez + .035 * sc), (.022 * sc, .01 * sc, .025 * sc), M_hi, seg=12, parent=rig)
        else:
            obj_sphere("eye", (ex, ey, ez), (.07 * sc, .03 * sc, .085 * sc), M_eye, seg=24, parent=rig); obj_sphere("hi", (ex - .02 * sc, ey - .03 * sc, ez + .03 * sc), (.02 * sc, .01 * sc, .022 * sc), M_hi, seg=12, parent=rig)
        cx, czz = sx * .60 * sc, cz - .12 * sc; obj_sphere("cheek", (cx, fy(cx, czz) - .005, czz), (.11 * sc, .035 * sc, .065 * sc), M_cheek, seg=32, parent=rig, rot=(0, 0, sx * math.radians(-36)))
    mz = cz - .10 * sc; my = fy(0, mz) - .005
    if E == "shock": obj_sphere("mouth", (0, my + .01, mz - .02 * sc), (.04 * sc, .02 * sc, .05 * sc), M_mouth, seg=24, parent=rig)
    elif E == "smug": tube("mouth", [(-.05 * sc, my, mz), (.02 * sc, my - .005, mz - .015 * sc), (.08 * sc, my, mz + .02 * sc)], [1, 1, 1], M_mouth, parent=rig, bev=.018 * sc)
    else: tube("mouth", [(-.06 * sc, my, mz + .01 * sc), (-.03 * sc, my - .01, mz - .02 * sc), (0, my - .005, mz), (.03 * sc, my - .01, mz - .02 * sc), (.06 * sc, my, mz + .01 * sc)], [1] * 5, M_mouth, parent=rig, bev=.018 * sc)   # ω
    for sx in (-1, 1):   # 小圆耳、短短的手
        obj_sphere("ear", (sx * .56 * sc, .1 * sc, cz + .60 * sc), (.17 * sc, .12 * sc, .14 * sc), M_body, seg=32, parent=rig, rot=(0, sx * math.radians(-30), 0))
        obj_sphere("hand", (sx * .78 * sc, -.42 * sc, cz - .30 * sc), (.13 * sc, .12 * sc, .10 * sc), M_body, seg=24, parent=rig, rot=(0, sx * math.radians(30), 0))
    tz = cz + rz * .98
    kit(sc, cz, tz, fy)
    return cz
def sprout(sc, tz, leaf_mat, size=1.0, n=2):
    """头顶一株小芽：一根细茎、两片叶子。成长线的记号。"""
    tube("stem", [(0, 0, tz - .05 * sc), (0, 0, tz + .14 * sc * size), (.02 * sc, 0, tz + .22 * sc * size)], [1, .9, .8], leaf_mat, parent=rig, bev=.025 * sc)
    for i in range(n):
        a = (i - (n - 1) / 2) * 2.2
        o = obj_sphere("leaf", (math.sin(a) * .11 * sc * size, 0, tz + .26 * sc * size), (.12 * sc * size, .03 * sc, .065 * sc * size), leaf_mat, seg=24, parent=rig, rot=(0, -a * .6, 0))
def egg(crack):
    cz = 1.0
    bpy.ops.mesh.primitive_uv_sphere_add(segments=64, ring_count=32, location=(0, 0, cz)); e = bpy.context.object; bpy.ops.object.shade_smooth(); e.parent = rig
    for v in e.data.vertices: k = 1 - .15 * max(0, v.co.z); v.co.x *= k; v.co.y *= k
    e.scale = (.8, .8, 1.0)
    m, nt, b = nodes_mat("egg"); b.inputs["Roughness"].default_value = .7; b.inputs["Sheen Weight"].default_value = .5; b.inputs["Coat Weight"].default_value = .1; b.inputs["Subsurface Weight"].default_value = .2
    tc = nt.nodes.new("ShaderNodeTexCoord"); sp = nt.nodes.new("ShaderNodeSeparateXYZ"); nt.links.new(tc.outputs["Object"], sp.inputs[0])
    # 两色蛋：下半主色、上半浅色，中间一道波浪分界
    wv = nt.nodes.new("ShaderNodeTexVoronoi"); wv.inputs["Scale"].default_value = 3.5; nt.links.new(tc.outputs["Object"], wv.inputs["Vector"])
    add = nt.nodes.new("ShaderNodeMath"); add.operation = "ADD"; add.operation = "MULTIPLY"; add.inputs[1].default_value = 1.0; nt.links.new(wv.outputs["Distance"], add.inputs[0])
    band = nt.nodes.new("ShaderNodeMapRange"); band.inputs[1].default_value = .16; band.inputs[2].default_value = .22; nt.links.new(add.outputs[0], band.inputs[0])
    mix = nt.nodes.new("ShaderNodeMix"); mix.data_type = "RGBA"; mix.inputs[6].default_value = (*PAL["none"][0], 1); mix.inputs[6].default_value = (.82, .55, .32, 1); mix.inputs[7].default_value = (.97, .86, .70, 1); nt.links.new(band.outputs[0], mix.inputs[0]); nt.links.new(mix.outputs[2], b.inputs["Base Color"])
    vo = nt.nodes.new("ShaderNodeTexVoronoi"); vo.feature = "DISTANCE_TO_EDGE"; vo.inputs["Scale"].default_value = 3.0; nt.links.new(tc.outputs["Object"], vo.inputs["Vector"])
    mr = nt.nodes.new("ShaderNodeMapRange"); mr.inputs[1].default_value = 0; mr.inputs[2].default_value = .015 + .05 * crack; mr.inputs[3].default_value = 1; mr.inputs[4].default_value = 0; nt.links.new(vo.outputs["Distance"], mr.inputs[0])
    h = nt.nodes.new("ShaderNodeMapRange"); h.inputs[1].default_value = 1.0 - 2.0 * crack; h.inputs[2].default_value = 1.25 - 2.0 * crack; nt.links.new(sp.outputs["Z"], h.inputs[0])
    m1 = nt.nodes.new("ShaderNodeMath"); m1.operation = "MULTIPLY"; nt.links.new(mr.outputs[0], m1.inputs[0]); nt.links.new(h.outputs[0], m1.inputs[1])
    m2 = nt.nodes.new("ShaderNodeMath"); m2.operation = "MULTIPLY"; m2.inputs[1].default_value = 6 * crack; nt.links.new(m1.outputs[0], m2.inputs[0])
    b.inputs["Emission Color"].default_value = (*PAL["none"][3], 1); nt.links.new(m2.outputs[0], b.inputs["Emission Strength"]); e.data.materials.append(silh(m))
    # 灵芽从蛋顶冒出来
    sprout(.75, cz + .98, silh(mat("leafe", (.45, .72, .32), .7, sss=.2, emit=(.5, .9, .3), estr=1.5 * crack)), size=.6 + .5 * crack)
    amp = math.radians(4 + 10 * crack)
    for fr in range(1, F + 2):
        p = (fr - 1) / F; rig.rotation_euler[1] = amp * math.sin(p * TAU * 3) * math.sin(p * math.pi) ** 2; rig.keyframe_insert("rotation_euler", index=1, frame=fr)

if ST == 0: egg(A.crack)
else:
    M_leaf = silh(mat("leaf", (.45, .72, .32), .7, sss=.2))
    def k_base(sc, cz, tz, fy): sprout(sc, tz, M_leaf, size={1: .8, 2: 1.1}.get(ST, 1.2))
    def k_tech(sc, cz, tz, fy):   # 机芯：头戴耳机，芽变成一根小天线
        bpy.ops.mesh.primitive_torus_add(location=(0, .05 * sc, cz + .25 * sc), major_radius=1.04 * sc, minor_radius=.06 * sc, rotation=(math.radians(90), 0, 0)); o = bpy.context.object; o.scale = (1, .55, 1); o.data.materials.append(M_acc); o.parent = rig
        for sx in (-1, 1): obj_sphere("cup", (sx * 1.0 * sc, 0, cz + .02 * sc), (.14 * sc, .28 * sc, .28 * sc), M_acc, parent=rig); obj_sphere("cupglow", (sx * 1.12 * sc, 0, cz + .02 * sc), (.03 * sc, .16 * sc, .16 * sc), M_glow, parent=rig)
        tube("ant", [(0, 0, tz - .05 * sc), (0, 0, tz + .22 * sc)], [.6, .5], M_acc, parent=rig, bev=.03 * sc); obj_sphere("antball", (0, 0, tz + .28 * sc), (.07 * sc,) * 3, M_glow, parent=rig)
    def k_gold(sc, cz, tz, fy):   # 金羽：抱着一枚大金币，头顶的芽变成小金叶
        bpy.ops.mesh.primitive_cylinder_add(vertices=48, radius=.30 * sc, depth=.06 * sc, location=(.05 * sc, -.94 * sc, cz - .30 * sc), rotation=(math.radians(90), 0, math.radians(8))); o = bpy.context.object; o.data.materials.append(silh(mat("coin", (1, .74, .22), .3, metal=1))); o.parent = rig
        bv = o.modifiers.new("b", "BEVEL"); bv.width = .02; bv.segments = 3
        bpy.ops.mesh.primitive_torus_add(location=(.05 * sc, -.975 * sc, cz - .30 * sc), major_radius=.22 * sc, minor_radius=.015 * sc, rotation=(math.radians(90), 0, 0)); r = bpy.context.object; r.data.materials.append(silh(mat("coin2", (.9, .6, .15), .3, metal=1))); r.parent = rig
        sprout(sc, tz, silh(mat("gleaf", (1, .76, .25), .25, metal=1)), size=1.3, n=3)
    def k_flame(sc, cz, tz, fy):   # 焰心：芽变成一小簇火苗，两颊更红
        for i, (x, h) in enumerate(((-.16, .40), (0, .62), (.16, .44))): obj_cone("flame", (x * sc, 0, tz + h * .45 * sc), .14 * sc, 0, h * sc, M_glow, parent=rig, sub=2)
    def k_star(sc, cz, tz, fy):   # 星语：芽顶结出一颗星星，身边绕着两颗小星
        tube("stem", [(0, 0, tz - .05 * sc), (0, 0, tz + .2 * sc)], [.5, .4], M_leaf, parent=rig, bev=.025 * sc)
        bpy.ops.mesh.primitive_cone_add(vertices=5, radius1=.26 * sc, radius2=0, depth=.08 * sc, location=(0, 0, tz + .38 * sc), rotation=(math.radians(90), 0, 0)); o = bpy.context.object; o.data.materials.append(M_glow); o.parent = rig
        for i in range(2):
            bpy.ops.object.empty_add(location=(0, 0, cz)); orb = bpy.context.object; orb.parent = rig; obj_sphere("spark", (1.15 * sc, 0, .2 * sc * (1 if i else -1)), (.05 * sc,) * 3, M_glow, parent=orb)
            for fr in (1, F + 1): orb.rotation_euler[2] = (fr - 1) / F * TAU + i * math.pi; orb.keyframe_insert("rotation_euler", index=2, frame=fr)
    kit = {"tech": k_tech, "gold": k_gold, "flame": k_flame, "star": k_star}.get(BR, k_base) if ST >= 3 else k_base
    cz = creature({1: .80, 2: .92, 3: 1.0}[ST], kit)
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
