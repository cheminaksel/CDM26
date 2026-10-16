# Scène d'arrivée : MacBook + caméra + storyboard sur une table en bois.
# Usage : bvenv/bin/python scene.py <desk|mobile> <largeur> <hauteur> <samples> <sortie.png>
import bpy, bmesh, math, json, sys, os
from mathutils import Vector, Matrix
from bpy_extras.object_utils import world_to_camera_view

VARIANT, RW, RH, SAMPLES, OUT = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), int(sys.argv[4]), sys.argv[5]
HERE = os.path.dirname(os.path.abspath(__file__))
TEX = os.path.join(HERE, 'tex')

bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene

# ------------------------------------------------------------------ outils
def link(ob):
    sc.collection.objects.link(ob); return ob

def mesh_obj(name, bm, mat=None, smooth=True):
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    if smooth:
        for p in me.polygons: p.use_smooth = True
    ob = bpy.data.objects.new(name, me)
    if mat: ob.data.materials.append(mat)
    return link(ob)

def bevel(ob, w, seg=3, angle=50):
    m = ob.modifiers.new('bev', 'BEVEL'); m.width = w; m.segments = seg
    m.limit_method = 'ANGLE'; m.angle_limit = math.radians(angle); m.harden_normals = True
    return m

def rrect_pts(w, d, r, seg=10):
    pts = []
    cs = [(w/2-r, d/2-r, 0), (-w/2+r, d/2-r, 90), (-w/2+r, -d/2+r, 180), (w/2-r, -d/2+r, 270)]
    for cx, cy, a0 in cs:
        for k in range(seg + 1):
            a = math.radians(a0 + 90 * k / seg)
            pts.append((cx + r*math.cos(a), cy + r*math.sin(a)))
    return pts

def prism(name, w, d, h, r, mat, z0=0.0, seg=10, bev=0.0, bseg=3, uv=False):
    bm = bmesh.new()
    vs = [bm.verts.new((x, y, z0)) for x, y in rrect_pts(w, d, r, seg)]
    f = bm.faces.new(vs)
    if f.normal.z > 0: f.normal_flip()
    ext = bmesh.ops.extrude_face_region(bm, geom=[f])
    top = [e for e in ext['geom'] if isinstance(e, bmesh.types.BMVert)]
    bmesh.ops.translate(bm, verts=top, vec=(0, 0, h))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    if uv:
        ul = bm.loops.layers.uv.new()
        for fc in bm.faces:
            for l in fc.loops: l[ul].uv = ((l.vert.co.x + w/2) / w, (l.vert.co.y + d/2) / d)
    ob = mesh_obj(name, bm, mat)
    if bev: bevel(ob, bev, bseg)
    return ob

def quad(name, w, h, mat, uv=True):
    """Plan dans XY, centré, normale +Z, UV 0..1"""
    bm = bmesh.new()
    vs = [bm.verts.new(p) for p in [(-w/2, -h/2, 0), (w/2, -h/2, 0), (w/2, h/2, 0), (-w/2, h/2, 0)]]
    f = bm.faces.new(vs)
    ul = bm.loops.layers.uv.new()
    for l, uvc in zip(f.loops, [(0, 0), (1, 0), (1, 1), (0, 1)]): l[ul].uv = uvc
    return mesh_obj(name, bm, mat, smooth=False)

def grid(name, w, h, nx, ny, mat):
    bm = bmesh.new(); ul = bm.loops.layers.uv.new()
    V = [[bm.verts.new((-w/2 + w*i/nx, -h/2 + h*j/ny, 0)) for i in range(nx+1)] for j in range(ny+1)]
    for j in range(ny):
        for i in range(nx):
            f = bm.faces.new([V[j][i], V[j][i+1], V[j+1][i+1], V[j+1][i]])
            for l in f.loops: l[ul].uv = ((l.vert.co.x + w/2)/w, (l.vert.co.y + h/2)/h)
    return mesh_obj(name, bm, mat)

def cyl(name, r, L, mat, seg=72, bev=0.0, r2=None):
    """Cylindre le long de l'axe Y local, de y=0 à y=-L"""
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=seg, radius1=r, radius2=r if r2 is None else r2, depth=L)
    bmesh.ops.rotate(bm, verts=bm.verts, cent=(0, 0, 0), matrix=Matrix.Rotation(math.radians(90), 3, 'X'))
    bmesh.ops.translate(bm, verts=bm.verts, vec=(0, -L/2, 0))
    ob = mesh_obj(name, bm, mat)
    if bev: bevel(ob, bev, 2, 40)
    return ob

def parent(ch, pa):
    ch.parent = pa
    return ch

# ------------------------------------------------------------------ matériaux
def mat(name, color=(0.8, 0.8, 0.8), metal=0.0, rough=0.5, **kw):
    m = bpy.data.materials.new(name); m.use_nodes = True
    nt = m.node_tree; b = nt.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*color, 1)
    b.inputs['Metallic'].default_value = metal
    b.inputs['Roughness'].default_value = rough
    for k, v in kw.items(): b.inputs[k].default_value = v
    return m

def node(nt, kind, **props):
    n = nt.nodes.new(kind)
    for k, v in props.items(): setattr(n, k, v)
    return n

def bump_noise(m, scale, strength, detail=2.0, dist=0.0, coords='Object'):
    nt = m.node_tree; b = nt.nodes['Principled BSDF']
    tc = nt.nodes.new('ShaderNodeTexCoord')
    nz = nt.nodes.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = scale; nz.inputs['Detail'].default_value = detail
    bp = nt.nodes.new('ShaderNodeBump'); bp.inputs['Strength'].default_value = strength; bp.inputs['Distance'].default_value = 0.0005
    nt.links.new(tc.outputs[coords], nz.inputs['Vector']); nt.links.new(nz.outputs['Fac'], bp.inputs['Height'])
    nt.links.new(bp.outputs['Normal'], b.inputs['Normal'])
    return m

def ribs(m, freq, strength, axis='Y'):
    """Stries (bagues de l'objectif) le long d'un axe local"""
    nt = m.node_tree; b = nt.nodes['Principled BSDF']
    tc = nt.nodes.new('ShaderNodeTexCoord')
    sep = nt.nodes.new('ShaderNodeSeparateXYZ'); nt.links.new(tc.outputs['Object'], sep.inputs[0])
    at = nt.nodes.new('ShaderNodeMath'); at.operation = 'ARCTAN2'
    nt.links.new(sep.outputs['X'], at.inputs[0]); nt.links.new(sep.outputs['Z'], at.inputs[1])
    mu = nt.nodes.new('ShaderNodeMath'); mu.operation = 'MULTIPLY'; mu.inputs[1].default_value = freq
    nt.links.new(at.outputs[0], mu.inputs[0])
    sn = nt.nodes.new('ShaderNodeMath'); sn.operation = 'SINE'; nt.links.new(mu.outputs[0], sn.inputs[0])
    bp = nt.nodes.new('ShaderNodeBump'); bp.inputs['Strength'].default_value = strength; bp.inputs['Distance'].default_value = 0.0006
    nt.links.new(sn.outputs[0], bp.inputs['Height']); nt.links.new(bp.outputs['Normal'], b.inputs['Normal'])
    return m

def img_mat(name, path, rough=0.5, emission=0.0, gloss=False, extend=False):
    m = bpy.data.materials.new(name); m.use_nodes = True
    nt = m.node_tree; b = nt.nodes['Principled BSDF']
    t = nt.nodes.new('ShaderNodeTexImage'); t.image = bpy.data.images.load(path)
    if extend: t.extension = 'EXTEND'
    nt.links.new(t.outputs['Color'], b.inputs['Base Color'])
    b.inputs['Roughness'].default_value = rough
    if emission:
        nt.links.new(t.outputs['Color'], b.inputs['Emission Color']); b.inputs['Emission Strength'].default_value = emission
        b.inputs['Base Color'].default_value = (0, 0, 0, 1)
        nt.links.remove(b.inputs['Base Color'].links[0])
        b.inputs['Base Color'].default_value = (0.0, 0.0, 0.0, 1)
        b.inputs['Roughness'].default_value = 0.06
        b.inputs['Coat Weight'].default_value = 1.0; b.inputs['Coat Roughness'].default_value = 0.03
    return m

ALU = mat('alu', (0.90, 0.91, 0.93), 1.0, 0.36, **{'Anisotropic': 0.2})
bump_noise(ALU, 900, 0.03)
ALU_PAD = mat('alu_pad', (0.70, 0.71, 0.73), 1.0, 0.34)
ALU_DARK = mat('alu_dark', (0.18, 0.18, 0.19), 1.0, 0.35)
BEZEL = mat('bezel', (0.004, 0.004, 0.005), 0.0, 0.05, **{'Coat Weight': 1.0, 'Coat Roughness': 0.02})
KEY = mat('key', (0.012, 0.012, 0.013), 0.0, 0.42)
WELL = mat('well', (0.035, 0.035, 0.038), 0.4, 0.55)
SCREEN = img_mat('screen', os.path.join(TEX, 'lock.png'), emission=4.2)
SPK = img_mat('spk', os.path.join(TEX, 'speaker.png'), rough=0.3)
SPK.node_tree.nodes['Principled BSDF'].inputs['Metallic'].default_value = 1.0

BODY = mat('cam_body', (0.010, 0.010, 0.011), 0.0, 0.5); bump_noise(BODY, 3200, 0.55, 4)
BODY_SATIN = mat('cam_satin', (0.014, 0.014, 0.015), 0.3, 0.32)
RUBBER = ribs(mat('rubber', (0.010, 0.010, 0.011), 0.0, 0.62), 140, 0.8)
RUBBER_FINE = ribs(mat('rubber_fine', (0.012, 0.012, 0.013), 0.0, 0.5), 300, 0.5)
METAL = mat('metal', (0.75, 0.75, 0.77), 1.0, 0.22)
RED = mat('red', (0.62, 0.02, 0.02), 0.0, 0.3, **{'Coat Weight': 0.6})
GLASS = mat('glass', (0.0, 0.0, 0.0), 0.0, 0.015, **{'Specular IOR Level': 1.0, 'Thin Film Thickness': 520.0, 'Thin Film IOR': 1.38})
INNER = mat('inner', (0.002, 0.002, 0.002), 0.0, 0.85)

PAPER = img_mat('paper', os.path.join(TEX, 'sheet.png'), rough=0.85)
_pn = PAPER.node_tree; _mx = _pn.nodes.new('ShaderNodeMixRGB'); _mx.blend_type = 'MULTIPLY'; _mx.inputs['Fac'].default_value = 1.0; _mx.inputs['Color2'].default_value = (0.78, 0.76, 0.72, 1)
_t = [n for n in _pn.nodes if n.type == 'TEX_IMAGE'][0]; _pn.links.new(_t.outputs['Color'], _mx.inputs['Color1']); _pn.links.new(_mx.outputs['Color'], _pn.nodes['Principled BSDF'].inputs['Base Color'])
PAPER.node_tree.nodes['Principled BSDF'].inputs['Subsurface Weight'].default_value = 0.05
PENCIL = mat('pencil', (0.85, 0.55, 0.03), 0.0, 0.32, **{'Coat Weight': 0.4})
WOODRAW = mat('woodraw', (0.75, 0.55, 0.36), 0.0, 0.6)
GRAPH = mat('graphite', (0.05, 0.05, 0.05), 0.6, 0.35)
FERRULE = mat('ferrule', (0.8, 0.7, 0.4), 1.0, 0.3)
ERASER = mat('eraser', (0.85, 0.35, 0.38), 0.0, 0.8)

def wood_mat():
    m = bpy.data.materials.new('wood'); m.use_nodes = True
    nt = m.node_tree; b = nt.nodes['Principled BSDF']
    tc = nt.nodes.new('ShaderNodeTexCoord')
    mp = nt.nodes.new('ShaderNodeMapping'); mp.inputs['Scale'].default_value = (0.18, 4.2, 1.0)
    nt.links.new(tc.outputs['Object'], mp.inputs['Vector'])
    wv = nt.nodes.new('ShaderNodeTexWave'); wv.wave_type = 'BANDS'; wv.bands_direction = 'Y'
    wv.inputs['Scale'].default_value = 5.5; wv.inputs['Distortion'].default_value = 14.0
    wv.inputs['Detail'].default_value = 8.0; wv.inputs['Detail Scale'].default_value = 2.2; wv.inputs['Detail Roughness'].default_value = 0.62
    nt.links.new(mp.outputs['Vector'], wv.inputs['Vector'])
    nz = nt.nodes.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = 3.0; nz.inputs['Detail'].default_value = 6.0
    mp2 = nt.nodes.new('ShaderNodeMapping'); mp2.inputs['Scale'].default_value = (0.25, 9.0, 1.0)
    nt.links.new(tc.outputs['Object'], mp2.inputs['Vector']); nt.links.new(mp2.outputs['Vector'], nz.inputs['Vector'])
    cr = nt.nodes.new('ShaderNodeValToRGB'); e = cr.color_ramp.elements
    e[0].position = 0.0; e[0].color = (0.045, 0.024, 0.013, 1)
    e[1].position = 1.0; e[1].color = (0.24, 0.135, 0.072, 1)
    mid = e.new(0.5); mid.color = (0.13, 0.07, 0.038, 1)
    mix = nt.nodes.new('ShaderNodeMath'); mix.operation = 'MULTIPLY_ADD'
    nt.links.new(wv.outputs['Fac'], mix.inputs[0]); mix.inputs[1].default_value = 0.45
    nt.links.new(nz.outputs['Fac'], mix.inputs[2])
    sub = nt.nodes.new('ShaderNodeMath'); sub.operation = 'SUBTRACT'; sub.inputs[1].default_value = 0.12; sub.use_clamp = True
    nt.links.new(mix.outputs[0], sub.inputs[0]); nt.links.new(sub.outputs[0], cr.inputs['Fac'])
    nt.links.new(cr.outputs['Color'], b.inputs['Base Color'])
    rr = nt.nodes.new('ShaderNodeMapRange'); rr.inputs['To Min'].default_value = 0.28; rr.inputs['To Max'].default_value = 0.48
    nt.links.new(wv.outputs['Fac'], rr.inputs['Value']); nt.links.new(rr.outputs['Result'], b.inputs['Roughness'])
    b.inputs['Coat Weight'].default_value = 0.35; b.inputs['Coat Roughness'].default_value = 0.12
    bp = nt.nodes.new('ShaderNodeBump'); bp.inputs['Strength'].default_value = 0.05; bp.inputs['Distance'].default_value = 0.0003
    nt.links.new(wv.outputs['Fac'], bp.inputs['Height']); nt.links.new(bp.outputs['Normal'], b.inputs['Normal'])
    return m
WOOD = wood_mat()

WALL = mat('wall', (0.07, 0.064, 0.058), 0.0, 0.92); bump_noise(WALL, 220, 0.25, 4)
BOOK1 = mat('book1', (0.06, 0.16, 0.12), 0.0, 0.6); BOOK2 = mat('book2', (0.30, 0.27, 0.22), 0.0, 0.7)
BOOK3 = mat('book3', (0.42, 0.13, 0.07), 0.0, 0.6); PAGES = mat('pages', (0.55, 0.51, 0.44), 0.0, 0.9)
LAMP = mat('lamp', (0.03, 0.03, 0.032), 0.8, 0.35)
BULB = mat('bulb', (1, 1, 1), 0.0, 0.5, **{'Emission Color': (1.0, 0.72, 0.42, 1), 'Emission Strength': 25.0})

# ------------------------------------------------------------------ MacBook
W, D, BT, LT = 0.3124, 0.2215, 0.0098, 0.0058
OPEN = 108.0
mac = bpy.data.objects.new('mac', None); link(mac)
base = parent(prism('base', W, D, BT, 0.0115, ALU, bev=0.0022, bseg=4), mac)
well = parent(prism('kbwell', 0.282, 0.108, 0.0004, 0.004, WELL, z0=BT - 0.0002), mac); well.location = (0, 0.0415, 0)
# clavier
rows = [([1] * 14, 0.0102), ([1] * 13 + [1.5], 0.0165), ([1.5] + [1] * 13, 0.0165), ([1.8] + [1] * 11 + [1.8], 0.0165),
        ([2.35] + [1] * 10 + [2.35], 0.0165), ([1, 1, 1, 1.25, 5.3, 1.25, 1, 1, 1, 1], 0.0165)]
KW, GAP = 0.276, 0.0026
y = 0.0415 + 0.108 / 2 - 0.0028
bmk = bmesh.new()
for units, hgt in rows:
    tot = sum(units); n = len(units)
    unit = (KW - GAP * (n - 1)) / tot
    x = -KW / 2
    for u in units:
        kw_ = unit * u
        res = bmesh.ops.create_cube(bmk, size=1.0)
        vv = res['verts']
        bmesh.ops.scale(bmk, verts=vv, vec=(kw_, hgt, 0.0011))
        bmesh.ops.translate(bmk, verts=vv, vec=(x + kw_ / 2, y - hgt / 2, BT + 0.0006))
        x += kw_ + GAP
    y -= hgt + GAP
keys = parent(mesh_obj('keys', bmk, KEY), mac); bevel(keys, 0.0012, 2, 30)
pad = parent(prism('trackpad', 0.140, 0.088, 0.0002, 0.006, ALU_PAD, z0=BT + 0.00005), mac); pad.location = (0, -0.0595, 0)
for sx in (-1, 1):
    s = parent(quad('spk', 0.0125, 0.104, SPK), mac); s.location = (sx * 0.1475, 0.0415, BT + 0.0003)
hinge = parent(cyl('hinge', 0.0030, W - 0.07, ALU_DARK), mac)
hinge.rotation_euler = (0, 0, math.radians(90)); hinge.location = (-(W - 0.07) / 2, D / 2 - 0.004, BT + 0.0005)
# couvercle (pivot à la charnière)
lidp = bpy.data.objects.new('lid_pivot', None); link(lidp); lidp.parent = mac
lidp.location = (0, D / 2 - 0.002, BT)
lid = parent(prism('lid', W, D, LT, 0.0115, ALU, bev=0.0018, bseg=3), lidp); lid.location = (0, -D / 2, 0)
bez = parent(prism('bezel', W - 0.0026, D - 0.0026, 0.0002, 0.0102, BEZEL, z0=-0.0002), lidp); bez.location = (0, -D / 2, 0)
SW, SH, CHIN, TOPB = 0.3005, 0.1950, 0.0170, 0.0085
scr = parent(quad('screen', SW, SH, SCREEN), lidp)
scr.location = (0, -(CHIN + SH / 2), -0.00025); scr.rotation_euler = (math.radians(180), 0, 0)
notch = parent(prism('notch', 0.033, 0.0062, 0.0001, 0.0018, BEZEL, z0=-0.00045), lidp); notch.location = (0, -(D - TOPB - 0.0031 + 0.0008), 0)
lidp.rotation_euler = (math.radians(-OPEN), 0, 0)

# ------------------------------------------------------------------ appareil photo (hybride + zoom série L)
cam = bpy.data.objects.new('camera_body', None); link(cam)
B = parent(prism('cbody', 0.134, 0.040, 0.080, 0.008, BODY, bev=0.004, bseg=4), cam); B.location = (0, 0.002, 0.004)
hump = prism('hump', 0.060, 0.050, 0.022, 0.008, BODY, bev=0.004, bseg=3)
for v in hump.data.vertices:
    if v.co.z > 0.011: v.co.x *= 0.62; v.co.y = v.co.y * 0.8 + 0.006
parent(hump, cam); hump.location = (0.004, 0.004, 0.078)
shoe = parent(prism('shoe', 0.022, 0.020, 0.002, 0.001, METAL), cam); shoe.location = (0.004, 0.006, 0.0995)
grip = parent(prism('grip', 0.038, 0.036, 0.080, 0.014, BODY, bev=0.009, bseg=5), cam); grip.location = (-0.048, -0.027, 0.002)
for dx, rr in ((-0.040, 0.0115), (0.044, 0.0125)):
    dial = parent(cyl('dial', rr, 0.0065, RUBBER_FINE, seg=48, bev=0.0008), cam)
    dial.rotation_euler = (math.radians(-90), 0, 0); dial.location = (dx, 0.008, 0.0835)
btn = parent(cyl('shutter', 0.0055, 0.004, METAL, seg=32, bev=0.0006), cam); btn.rotation_euler = (math.radians(-90), 0, 0); btn.location = (-0.050, -0.033, 0.0815)
rel = parent(cyl('release', 0.0045, 0.003, METAL, seg=32, bev=0.0005), cam); rel.location = (0.050, -0.018, 0.050)
foot = parent(prism('foot', 0.12, 0.034, 0.004, 0.006, BODY_SATIN), cam); foot.location = (0, 0.002, 0.0)
LX, LZ = 0.008, 0.046
def lens(name, y0, L, r, m, bev=0.0008, r2=None):
    o = parent(cyl(name, r, L, m, bev=bev, r2=r2), cam); o.location = (LX, y0, LZ); return o
lens('mount', -0.018, 0.006, 0.0305, METAL)
lens('lbase', -0.024, 0.014, 0.0335, BODY_SATIN)
lens('zoom', -0.038, 0.036, 0.0418, RUBBER, bev=0.0015)
lens('lmid', -0.074, 0.014, 0.0400, BODY_SATIN)
ring = parent(cyl('redring', 0.0405, 0.0022, RED, seg=96), cam); ring.location = (LX, -0.0875, LZ)
lens('focus', -0.0897, 0.028, 0.0414, RUBBER_FINE, bev=0.0012)
lens('front', -0.1177, 0.014, 0.0420, BODY_SATIN, bev=0.0015)
lens('rim', -0.1317, 0.002, 0.0418, BODY_SATIN, r2=0.0385)
inner = parent(cyl('inner', 0.0376, 0.004, INNER, seg=96), cam); inner.location = (LX, -0.1290, LZ)
glass = parent(cyl('glass', 0.0335, 0.002, INNER, seg=96), cam); glass.location = (LX, -0.1240, LZ)
# dôme de la lentille frontale
bmg = bmesh.new()
bmesh.ops.create_uvsphere(bmg, u_segments=96, v_segments=48, radius=0.07)
bmesh.ops.delete(bmg, geom=[v for v in bmg.verts if v.co.y > -0.0612], context='VERTS')
dome = parent(mesh_obj('dome', bmg, GLASS), cam); dome.location = (LX, -0.0625, LZ)

capo = bpy.data.objects.new('lenscap', None); link(capo)
cp1 = parent(cyl('cap', 0.0415, 0.009, RUBBER_FINE, seg=96, bev=0.0015), capo); cp1.rotation_euler = (math.radians(-90), 0, 0)
cp2 = parent(cyl('capface', 0.036, 0.001, BODY_SATIN, seg=96), capo); cp2.rotation_euler = (math.radians(-90), 0, 0); cp2.location = (0, 0, 0.0091)

# ------------------------------------------------------------------ feuille + crayon
paper = grid('paper', 0.297, 0.210, 24, 16, PAPER)
bend = paper.modifiers.new('bend', 'SIMPLE_DEFORM'); bend.deform_method = 'BEND'; bend.angle = math.radians(6); bend.deform_axis = 'Y'
pen = bpy.data.objects.new('pencil', None); link(pen)
p_body = parent(cyl('pbody', 0.0037, 0.150, PENCIL, seg=6, bev=0.0004), pen)
p_cone = parent(cyl('pcone', 0.0037, 0.018, WOODRAW, seg=24, r2=0.0009), pen); p_cone.location = (0, -0.150, 0)
p_tip = parent(cyl('ptip', 0.0009, 0.004, GRAPH, seg=16, r2=0.0002), pen); p_tip.location = (0, -0.168, 0)
p_fer = parent(cyl('pfer', 0.0039, 0.010, FERRULE, seg=32), pen); p_fer.location = (0, 0.010, 0)
p_er = parent(cyl('per', 0.0036, 0.008, ERASER, seg=32, bev=0.001), pen); p_er.location = (0, 0.018, 0)

# ------------------------------------------------------------------ table, mur, décor
table = prism('table', 3.2, 1.6, 0.04, 0.01, WOOD, z0=-0.04, bev=0.003)
table.location = (0, -0.25, 0)
wall = quad('wall', 6, 3, WALL); wall.rotation_euler = (math.radians(90), 0, 0); wall.location = (0, 0.56, 1.0)
books = bpy.data.objects.new('books', None); link(books)
zz = 0.0
for i, (bw, bd, bh, m, rot) in enumerate([(0.24, 0.17, 0.032, BOOK1, 3), (0.22, 0.155, 0.026, BOOK3, -4), (0.205, 0.145, 0.022, BOOK2, 6)]):
    cover = parent(prism('book', bw, bd, bh, 0.002, m, bev=0.0015), books); cover.location = (0, 0, zz); cover.rotation_euler = (0, 0, math.radians(rot))
    pg = parent(prism('pages', bw - 0.006, bd - 0.008, bh - 0.004, 0.001, PAGES), books); pg.location = (0.004, 0, zz + 0.002); pg.rotation_euler = (0, 0, math.radians(rot))
    zz += bh
lamp = bpy.data.objects.new('lamp', None); link(lamp)
MUG = mat('mug', (0.035, 0.037, 0.04), 0.0, 0.18, **{'Coat Weight': 0.6, 'Coat Roughness': 0.05})
COFFEE = mat('coffee', (0.02, 0.008, 0.003), 0.0, 0.05)
mug = bpy.data.objects.new('mug', None); link(mug)
m1 = parent(cyl('mugo', 0.041, 0.092, MUG, seg=64, bev=0.002), mug); m1.rotation_euler = (math.radians(-90), 0, 0)
m2 = parent(cyl('mugc', 0.0365, 0.002, COFFEE, seg=64), mug); m2.rotation_euler = (math.radians(-90), 0, 0); m2.location = (0, 0, 0.080)
bmh = bmesh.new(); bmesh.ops.create_circle(bmh, cap_ends=False, segments=48, radius=0.026)
th = mesh_obj('handle_path', bmh, MUG)
th.parent = mug
tor = bpy.data.meshes.new('torus'); bmt = bmesh.new()
R, rr, nu, nv = 0.024, 0.0055, 48, 16
VV = [[bmt.verts.new(((R + rr*math.cos(2*math.pi*j/nv))*math.cos(2*math.pi*i/nu), 0, (R + rr*math.cos(2*math.pi*j/nv))*math.sin(2*math.pi*i/nu)) if False else Vector(((R + rr*math.cos(2*math.pi*j/nv))*math.cos(2*math.pi*i/nu), rr*math.sin(2*math.pi*j/nv), (R + rr*math.cos(2*math.pi*j/nv))*math.sin(2*math.pi*i/nu)))) for j in range(nv)] for i in range(nu)]
for i in range(nu):
    for j in range(nv):
        bmt.faces.new([VV[i][j], VV[(i+1)%nu][j], VV[(i+1)%nu][(j+1)%nv], VV[i][(j+1)%nv]])
bmesh.ops.recalc_face_normals(bmt, faces=bmt.faces)
hd = parent(mesh_obj('handle', bmt, MUG), mug); hd.location = (0.041, 0, 0.047)
bpy.data.objects.remove(th)

# ------------------------------------------------------------------ placement selon le format
if VARIANT == 'desk':
    mac.location = (0, 0, 0); mac.rotation_euler = (0, 0, math.radians(0))
    cam.location = (0.300, -0.040, 0); cam.rotation_euler = (0, 0, math.radians(-58)); capo.location = (0.228, -0.178, 0)
    paper.location = (-0.315, -0.150, 0.0006); paper.rotation_euler = (0, 0, math.radians(-10))
    pen.location = (-0.230, -0.135, 0.0045); pen.rotation_euler = (0, 0, math.radians(-118))
    books.location = (-0.64, 0.32, 0); lamp.location = (0.95, 0.40, 0); mug.location = (0.46, 0.25, 0); mug.rotation_euler = (0, 0, math.radians(200))
    CAM_LOC, CAM_TGT, LENS, FSTOP = (0.0, -1.06, 0.43), (0.0, 0.03, 0.085), 40, 5.0
else:
    mac.location = (0, 0.02, 0)
    cam.location = (0.115, -0.225, 0); cam.rotation_euler = (0, 0, math.radians(-55)); capo.location = (0.215, -0.330, 0)
    paper.location = (-0.130, -0.265, 0.0006); paper.rotation_euler = (0, 0, math.radians(-12))
    pen.location = (-0.060, -0.250, 0.0045); pen.rotation_euler = (0, 0, math.radians(-122))
    books.location = (-0.36, 0.33, 0); lamp.location = (0.60, 0.42, 0); mug.location = (0.25, 0.27, 0); mug.rotation_euler = (0, 0, math.radians(200))
    CAM_LOC, CAM_TGT, LENS, FSTOP = (0.0, -0.80, 0.56), (0.0, -0.095, 0.06), 30, 4.0

# ------------------------------------------------------------------ caméra de rendu
cd = bpy.data.cameras.new('view'); cd.lens = LENS; cd.sensor_width = 36
cd.dof.use_dof = True; cd.dof.aperture_fstop = FSTOP
co = bpy.data.objects.new('view', cd); link(co); sc.camera = co
co.location = CAM_LOC
d = Vector(CAM_TGT) - Vector(CAM_LOC)
co.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()
bpy.context.view_layer.update()
focus = bpy.data.objects.new('focus', None); link(focus)
focus.location = scr.matrix_world.translation
cd.dof.focus_object = focus

# ------------------------------------------------------------------ lumières
def area(name, loc, tgt, size, power, color, shape='RECTANGLE', sy=None, spread=180):
    ld = bpy.data.lights.new(name, 'AREA'); ld.energy = power; ld.color = color; ld.shape = shape
    ld.size = size; ld.size_y = sy or size; ld.spread = math.radians(spread)
    o = bpy.data.objects.new(name, ld); link(o); o.location = loc
    o.rotation_euler = (Vector(tgt) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
    return o
area('key', (-0.95, -0.42, 0.90), (0.05, -0.05, 0.0), 0.9, 75, (1.0, 0.89, 0.78), sy=0.7)
area('rim', (0.10, 0.50, 0.85), (0, 0.05, 0.1), 1.6, 22, (0.82, 0.88, 1.0), sy=0.5)
area('fill', (0.9, -1.2, 0.5), (0, 0, 0.1), 1.2, 8, (0.9, 0.93, 1.0))
sp = bpy.data.lights.new('lampspot', 'SPOT'); sp.energy = 30; sp.color = (1.0, 0.70, 0.42); sp.spot_size = math.radians(95); sp.spot_blend = 0.6
spo = bpy.data.objects.new('lampspot', sp); link(spo)
spo.location = lamp.location + Vector((0, 0, 0.29))
wl = bpy.data.lights.new('wallwash', 'POINT'); wl.energy = 16; wl.color = (1.0, 0.68, 0.40); wl.shadow_soft_size = 0.1
wlo = bpy.data.objects.new('wallwash', wl); link(wlo); wlo.location = Vector((0.72, 0.47, 0.40) if VARIANT == 'desk' else (0.58, 0.47, 0.55))

world = bpy.data.worlds.new('w'); sc.world = world; world.use_nodes = True
wn = world.node_tree; env = wn.nodes.new('ShaderNodeTexEnvironment')
env.image = bpy.data.images.load(os.path.join(HERE, 'hdri', 'apartment.exr'))
bg = wn.nodes['Background']; bg.inputs['Strength'].default_value = 0.1
wn.links.new(env.outputs['Color'], bg.inputs['Color'])

# ------------------------------------------------------------------ rendu
r = sc.render; r.engine = 'CYCLES'; r.resolution_x = RW; r.resolution_y = RH; r.resolution_percentage = 100
r.image_settings.file_format = 'PNG'; r.filepath = OUT
sc.cycles.device = 'CPU'; sc.cycles.samples = SAMPLES; sc.cycles.use_denoising = True
try: sc.cycles.denoiser = 'OPENIMAGEDENOISE'
except Exception: pass
sc.cycles.max_bounces = 8; sc.cycles.glossy_bounces = 4; sc.cycles.transmission_bounces = 4
sc.cycles.use_adaptive_sampling = True
sc.view_settings.view_transform = 'AgX'
for look in (os.environ.get('LOOK', 'AgX - Punchy'), 'AgX - Medium High Contrast'):
    try: sc.view_settings.look = look; break
    except Exception: pass
sc.view_settings.exposure = float(os.environ.get('EXPO', '-0.9'))

# coins de l'écran (pour superposer l'écran de verrouillage dans la page)
bpy.context.view_layer.update()
mw = scr.matrix_world
loc_c = [(-SW/2, SH/2), (SW/2, SH/2), (SW/2, -SH/2), (-SW/2, -SH/2)]
# l'écran est retourné (rotation 180/180) : on prend les coins dans l'ordre visuel haut-gauche, haut-droit, bas-droit, bas-gauche
pts = []
for x, y in loc_c:
    w = mw @ Vector((x, y, 0))
    p = world_to_camera_view(sc, co, w)
    pts.append((p.x, 1 - p.y))
pts.sort(key=lambda p: p[1])
top = sorted(pts[:2]); bot = sorted(pts[2:])
quadp = [top[0], top[1], bot[1], bot[0]]
# zone cliquable : boîte englobante du Mac
xs, ys = [], []
for ob in (base, lid):
    for v in ob.data.vertices:
        p = world_to_camera_view(sc, co, ob.matrix_world @ v.co); xs.append(p.x); ys.append(1 - p.y)
meta = {'w': RW, 'h': RH, 'screen': [[round(a, 5), round(b, 5)] for a, b in quadp],
        'mac': [round(min(xs), 4), round(min(ys), 4), round(max(xs), 4), round(max(ys), 4)]}
json.dump(meta, open(OUT.rsplit('.', 1)[0] + '.json', 'w'))
print('META', json.dumps(meta))
bpy.ops.render.render(write_still=True)
print('DONE', OUT)
