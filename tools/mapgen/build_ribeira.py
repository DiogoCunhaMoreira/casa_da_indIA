#!/usr/bin/env python3
"""Generate ribeira.tmj — the Casa da Índia floor, Ribeira das Naus, Lisboa c.1500.

    python3 tools/mapgen/build_atlas.py     # first: cut the painted sheet
    python3 tools/mapgen/build_ribeira.py   # then: lay out the floor

40 × 28 tiles of 32 px = 1280 × 896, drawn entirely from casadaindia.png
(firstgid 1 — it is now the only atlas; interiors.png is gone from this floor).
The plan:

      0 1              11        19-20        28              38 39
    ┌───────────────────┬──────────┴┬───────────┬───────────────────┐ 0  vigas
    │  jan.             │   jan.   PORTA  jan.  │        jan.       │ 1  reboco
    │───────────────────┼───────────────────────┼───────────────────│ 2  azulejo
    │                   │                       │                   │ 3
    │  GABINETE         │        ÁTRIO          │      ARMAZÉM      │
    │  DO FEITOR        │   mesa de comércio    │    mercadoria     │ 8  ↔ vão
    │  lioz             │        lioz           │    terracota      │ 10
    ├────┬──┬───────────┴────┬──┬───────────────┴─────┬──┬──────────┤ 11 vigas
    │    vão               vão                       vão            │ 12 reboco
    │                                                               │ 13 azulejo
    │            CASA DE CONTAS              │        ADEGA /       │ 14
    │         14 escrivaninhas (2×2)         │      REFEITÓRIO      │
    │            terracota                   ↔       terracota      │ 26
    └────────────────────────────────────────┴──────────────────────┘ 27 friso

Every wall is the same three-row stack, top to bottom: ceiling beam, limewashed
plaster, azulejo dado. The azulejo is ON THE WALL and nowhere else — spreading
it across the floor is what made the previous version of this map read as one
undifferentiated field of blue. The floor is quiet terracotta and limestone so
the furniture has something to sit against, and the pale north half / warm
south half is doing the work of telling the rooms apart.

This script also writes casadaindia/planta.ts — the seat names, café tiles,
prop anchors and errand spots, all derived from the coordinates below. The
theme imports that file rather than repeating the numbers, so the map and the
ThemeConfig cannot drift apart.
"""
import json, os
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
ASSETS = os.path.join(ROOT, 'src', 'renderer', 'src', 'assets')
OUT = os.path.join(ASSETS, 'maps', 'ribeira.tmj')
OUT_TS = os.path.join(ROOT, 'src', 'renderer', 'src', 'scene', 'office',
                      'casadaindia', 'planta.ts')

W, H, TS = 40, 28, 32
ATLAS_TILE, ATLAS_COLS = 32, 16
CASA = 1             # firstgid — casadaindia.png is the only atlas on this floor


def g(col, row):
    """gid of an atlas cell."""
    return CASA + row * ATLAS_COLS + col


def _empty_gids():
    """Atlas cells that are fully transparent — never painted."""
    a = Image.open(os.path.join(ASSETS, 'tilesets', 'casadaindia.png')).convert('RGBA')
    t = ATLAS_TILE
    return {g(c, r) for r in range(ATLAS_COLS) for c in range(ATLAS_COLS)
            if a.crop((c * t, r * t, c * t + t, r * t + t)).getbbox() is None}


EMPTY = _empty_gids()

# ── the pieces, by name (see tilesets/ATLAS.md) ───────────────────────────────
TERRACOTA = [g(i, 0) for i in range(8)]     # eight patterns and wear levels
LIOZ = [g(8 + i, 0) for i in range(4)]      # four pale limestone flags
REBOCO = [g(i, 1) for i in range(6)]        # six limewashed plaster faces
AZULEJO = [g(6 + i, 1) for i in range(5)]   # three patterns + two armillary spheres
FRISO = [g(11 + i, 1) for i in range(4)]    # four stone skirting mouldings
VIGA = [g(i, 2) for i in range(4)]          # four beam segments, meant to run on
ESCURO = g(4, 2)                            # the dark outside the walls
PAREDE_V = [g(5, 2), g(6, 2)]               # partitions seen edge-on (derived)

# props as (col, row, tiles wide, tiles tall) — anchored bottom-centre in the atlas
PORTA = (0, 3, 2, 3)
JANELA = (2, 3, 2, 2)
ARCA = (4, 3, 3, 2)
MESA_COMERCIO = (7, 3, 4, 2)
ESCRIVANINHA = (11, 3, 2, 2)       # the chair is the bottom-LEFT cell: that is the seat
BALANCA = (13, 3, 1, 2)
SACA_VERMELHA, SACA_AMARELA = (0, 6, 1, 1), (1, 6, 1, 1)
CAIXOTE, FARDO, BARRIL = (2, 6, 1, 1), (3, 6, 1, 1), (4, 6, 1, 1)
LIVRO, PERGAMINHO, CASTICAL = (5, 6, 1, 1), (6, 6, 1, 1), (7, 6, 1, 1)
BANCO = (8, 6, 2, 1)

# The merchandise reads the same either way round, so it may be mirrored to
# break up a row of identical barrels. Nothing else is: the door, the window,
# the chest, the tables and the scales all have a front, and the escrivaninha's
# chair sits on the left because that cell is the seat.
ESPELHÁVEIS = {SACA_VERMELHA, SACA_AMARELA, CAIXOTE, FARDO, BARRIL,
               LIVRO, PERGAMINHO}

# ── layers ────────────────────────────────────────────────────────────────────
floor, walls, fb, fa, coll = ([0] * (W * H) for _ in range(5))


GID_MASK = 0x1FFFFFFF      # the flip flags live in the top three bits


def put(layer, x, y, gid):
    if 0 <= x < W and 0 <= y < H and gid and (gid & GID_MASK) not in EMPTY:
        layer[y * W + x] = gid


CHOQUES = []


def prop(layer, x0, y0, spec, nome=''):
    """Paint a prop's cells from its top-left. Transparent cells are skipped, so
    a prop's empty margin never punches a hole in what it is standing on.

    Records any cell it paints over. Two props on one tile is silent damage —
    the second wins, the first half-disappears, and the collision layer still
    says solid, so nothing downstream notices."""
    c, r, pw, ph = spec
    for dy in range(ph):
        for dx in range(pw):
            gid = g(c + dx, r + dy)
            x, y = x0 + dx, y0 + dy
            if (gid and gid not in EMPTY and 0 <= x < W and 0 <= y < H
                    and layer[y * W + x]):
                CHOQUES.append(f'{nome or spec} over {(x, y)}')
            # Mirror the one-tile merchandise. Only those: mirroring one cell of
            # a multi-tile prop would tear it apart, and the escrivaninha's chair
            # is on the left ON PURPOSE — that cell is the seat.
            if pw == 1 and ph == 1 and spec in ESPELHÁVEIS and rnd(x, y, 21) & 1:
                gid |= FLIP_H
            put(layer, x, y, gid)


FLIP_H = 0x80000000       # Tiled's horizontal-flip flag; the renderer honours it


def rnd(x, y, salt=0):
    """A hash of the tile coordinate. Deterministic — same map every run, no
    seed file — but with no structure the eye can find.

    This started life as `(x*7 + y*13 + (x*y) % 5) % n`, which looks like
    scatter and is not: it is linear in x and y, so it lays the variants out on
    a diagonal lattice with runs of five identical tiles in a row. On a floor
    twenty-seven tiles wide that reads as stripes, and stripes are exactly the
    repetition the eight painted variants were bought to avoid."""
    h = (x * 0x9E3779B1) ^ (y * 0x85EBCA77) ^ (salt * 0xC2B2AE3D)
    h &= 0xFFFFFFFF
    h ^= h >> 15
    h = (h * 0x2545F491) & 0xFFFFFFFF
    h ^= h >> 13
    return h


def pick(pool, x, y, salt=0):
    return pool[rnd(x, y, salt) % len(pool)]


def chao(x0, y0, x1, y1, pool):
    """Floor, with a coin-flip mirror on top of the variant choice.

    Every floor cell on the sheet is a self-contained square with its own grout
    on all four sides, so mirroring one is free and legal — and it doubles eight
    patterns into sixteen without anybody drawing anything."""
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            gid = pick(pool, x, y)
            if rnd(x, y, 77) & 1:
                gid |= FLIP_H
            put(floor, x, y, gid)


# ── the shell ─────────────────────────────────────────────────────────────────
def espelhado(gid, x, y, salt):
    return gid | FLIP_H if rnd(x, y, salt) & 1 else gid


def parede_h(row, c0, c1, vaos=()):
    """A south-facing wall, three rows: beam, plaster, azulejo dado. `vaos` are
    columns left open — a doorway is a gap in the wall, not a drawn door.

    Mirrored per cell like the floor: a forty-column run of five azulejo panels
    is the most visible repeat on the map, and this halves how often the same
    panel appears the same way up."""
    for c in range(c0, c1 + 1):
        if c in vaos:
            continue
        put(walls, c, row + 0, espelhado(pick(VIGA, c, row), c, row, 11))
        put(walls, c, row + 1, espelhado(pick(REBOCO, c, row + 1), c, row + 1, 12))
        put(walls, c, row + 2, espelhado(pick(AZULEJO, c, row + 2), c, row + 2, 13))


def parede_v(col, rows):
    """A partition running north–south. Uses the derived edge-on tile, not a
    plaster face: a face used here reads as a pale stripe of floor."""
    for r in rows:
        put(walls, col, r, pick(PAREDE_V, col, r))


def rodape(x, y):
    put(walls, x, y, espelhado(pick(FRISO, x, y), x, y, 14))


PORTA_COLS = (19, 20)                       # the way in, in the north wall

# Floors first — the walls are painted over them. Pale limestone for the rooms
# the public sees, warm terracotta for the ones that work. Spreading terracotta
# over both halves turned the map into one field of orange, which is the same
# mistake the old all-azulejo floor made in a different colour.
chao(0, 3, W - 1, H - 1, TERRACOTA)         # the whole floor, then the rooms over it
chao(1, 3, 10, 10, LIOZ)                    # gabinete do Feitor
chao(12, 3, 27, 10, LIOZ)                   # átrio
chao(29, 14, W - 2, H - 2, LIOZ)            # adega / refeitório

parede_h(0, 0, W - 1, vaos=PORTA_COLS)      # north wall, with the doorway
prop(fa, PORTA_COLS[0], 0, PORTA)           # the door itself, filling that gap
for jc in (4, 14, 24, 33):                  # four windows, seated in the plaster
    prop(fa, jc, 1, JANELA)

for y in range(3, H - 1):                   # west and east skirting
    rodape(0, y)
    rodape(W - 1, y)
for x in range(W):                          # south skirting
    rodape(x, H - 1)

parede_v(11, range(3, 11))                  # gabinete's east wall — no door, sealed
parede_v(28, range(3, 9))                   # átrio | armazém, open at rows 9-10
parede_v(28, range(14, 25))                 # casa de contas | adega, open at rows 25-26

# the interior wall band, with three doorways
VAOS_INTERIORES = (5, 6, 22, 23, 33, 34)
parede_h(11, 1, W - 2, vaos=VAOS_INTERIORES)

# ══ GABINETE DO FEITOR ═══════════════════════════════════════════════════════
prop(fa, 1, 3, ARCA, 'arca')                # the strongbox, against the north wall
prop(fa, 9, 3, BALANCA, 'balanca')          # his own scales
prop(fa, 4, 5, ESCRIVANINHA, 'mesa-feitor')  # his desk, under his own window
LUGAR_FEITOR = (4, 6)                       # the drawn chair, bottom-left of the desk
prop(fa, 7, 4, LIVRO)
prop(fa, 9, 6, LIVRO)
prop(fa, 2, 6, PERGAMINHO)
prop(fa, 7, 6, PERGAMINHO)
prop(fa, 2, 9, PERGAMINHO)
prop(fa, 8, 9, CASTICAL)
prop(fa, 9, 9, LIVRO)
prop(fb, 1, 8, BANCO, 'banco')              # a bench along the wall, for whoever waits

# ══ ÁTRIO — the hall you walk into ═══════════════════════════════════════════
prop(fa, 18, 6, MESA_COMERCIO, 'mesa')      # the trade table: the centre of the room
prop(fa, 25, 5, BALANCA, 'balanca')         # everything landed was weighed
# Against the north wall, as the rules ask — but between the windows, not under
# them: the two window errands need their tile on row 3 to stand on.
prop(fa, 16, 3, ARCA, 'arca')
# merchandise, grouped by the chest and by the door
prop(fa, 21, 3, SACA_VERMELHA)
prop(fa, 22, 3, SACA_AMARELA)
prop(fa, 26, 3, CAIXOTE)
prop(fa, 27, 3, FARDO)
prop(fa, 12, 9, CAIXOTE)
prop(fa, 13, 9, FARDO)
prop(fa, 14, 9, BARRIL)
prop(fa, 12, 6, CASTICAL)
prop(fa, 27, 6, LIVRO)
prop(fa, 26, 9, PERGAMINHO)
prop(fa, 27, 9, CASTICAL)
prop(fb, 22, 9, BANCO, 'banco')             # the waiting bench, by the door

# ══ ARMAZÉM — the goods, stacked along the walls ═════════════════════════════
prop(fa, 29, 3, ARCA, 'arca')
prop(fa, 32, 3, BARRIL)
prop(fa, 36, 3, CAIXOTE)
prop(fa, 37, 3, FARDO)
prop(fa, 33, 4, BARRIL)
prop(fa, 34, 4, BARRIL)
prop(fa, 38, 4, BARRIL)
prop(fa, 29, 6, SACA_AMARELA)
prop(fa, 30, 6, SACA_VERMELHA)
prop(fa, 35, 6, FARDO)
prop(fa, 36, 6, SACA_AMARELA)
prop(fa, 37, 6, CAIXOTE)
prop(fa, 38, 7, CAIXOTE)
prop(fa, 29, 9, FARDO)
prop(fa, 30, 9, CAIXOTE)
prop(fa, 31, 9, SACA_VERMELHA)
prop(fa, 35, 9, FARDO)
prop(fa, 37, 9, BARRIL)
prop(fb, 33, 9, BANCO, 'banco')

# ══ CASA DE CONTAS — the fourteen writing desks ══════════════════════════════
# A desk is the 2×2 escrivaninha; its bottom-left cell is the drawn chair, and
# that cell is the seat. Three columns per desk leaves a one-tile aisle between.
COLS_MESA = [1, 4, 7, 10, 13, 16, 19]
LINHAS_MESA = [15, 21]                      # the desk's top row; the seat is one below
LUGARES = []
for dy in LINHAS_MESA:
    for dx in COLS_MESA:
        prop(fa, dx, dy, ESCRIVANINHA, f'mesa@{dx},{dy}')
        LUGARES.append((dx, dy + 1))

# the east aisle, against the wall
prop(fa, 24, 14, ARCA, 'arca')              # cols 24-26, rows 14-15
prop(fa, 23, 17, LIVRO)                     # the 'shelf' errand plays against this
prop(fa, 27, 17, CASTICAL)
prop(fa, 27, 14, PERGAMINHO)
prop(fa, 27, 20, BALANCA, 'balanca')        # col 27, rows 20-21 — clear of the chest
prop(fa, 23, 21, CASTICAL)
prop(fa, 23, 24, CAIXOTE)                   # the 'bin' errand
prop(fa, 25, 24, LIVRO)
prop(fa, 26, 24, PERGAMINHO)
prop(fb, 25, 20, BANCO, 'banco')

# ══ ADEGA / REFEITÓRIO ═══════════════════════════════════════════════════════
# The counter has to be an unbroken run of solid tiles along its row: the scene
# turns a standing agent toward the first non-walkable neighbour it finds, and a
# gap here would have them serving themselves with their back to the barrels.
for bx in range(31, 38):
    prop(fa, bx, 16, BARRIL, f'barril@{bx}')
prop(fa, 30, 14, ARCA, 'arca')              # cols 30-32, rows 14-15
prop(fa, 37, 14, CAIXOTE)
prop(fa, 38, 16, FARDO)
prop(fa, 37, 19, CASTICAL)                  # the 'dispenser' errand
prop(fa, 30, 18, PERGAMINHO)
prop(fa, 33, 24, FARDO)
prop(fa, 30, 25, LIVRO)                     # the 'shelf' errand
prop(fa, 37, 25, BARRIL)

# two trestle tables: a bench as the board, a bench as the seat below it
LUGARES_CAFE = []
for tx in (30, 34):
    prop(fa, tx, 20, BANCO, f'mesa-cafe@{tx}')   # the table — solid
    prop(fb, tx, 21, BANCO, f'banco-cafe@{tx}')  # the bench — walkable, this is the seat
    LUGARES_CAFE += [(tx, 21), (tx + 1, 21)]

# ══ COLLISION ════════════════════════════════════════════════════════════════
# Everything drawn is solid, then the seats are cut back out. `fb` is the layer
# for things agents stand ON (the benches), so it never contributes.
for y in range(H):
    for x in range(W):
        if walls[y * W + x] or fa[y * W + x]:
            coll[y * W + x] = 1
for (sx, sy) in LUGARES + LUGARES_CAFE + [LUGAR_FEITOR]:
    coll[sy * W + sx] = 0
for c in PORTA_COLS:                        # the threshold under the door
    coll[3 * W + c] = 0

# ── what the theme needs to know ──────────────────────────────────────────────
ENTRADA = (19, 4)
CAFE = {
    'trayTile': (31, 16), 'trayStand': (31, 17),   # the cup barrel
    'machineStand': (33, 17),                      # below the tapped barrels
    'sinkTile': (36, 16), 'sinkStand': (36, 17),   # the rinsing barrel
    'maxCups': 4,
}
BANCAS_CAFE = [('cafe-stand-coffee', (32, 17), 'coffee'),
               ('cafe-stand-vending', (35, 17), 'vending')]
# The three clickable props are azulejo panels on the dado — the two armillary
# spheres and a pattern — because the sheet has no calendar, board or clock and
# a painted panel is a better thing to click than a barrel pretending to be one.
ANCORAS = {
    'calendar': (6, 2),     # TRIGGERS   — the gabinete's dado
    'boards': (10, 13),     # TASKS      — the counting hall's dado
    'clock': (8, 2),        # CLOSING TIME
    'askme': (16, 13),      # ASK ME     — further along the same dado
}
# kind, stand, facing, fx, duration, godOnly. Every `fx` is the prop the errand
# plays against, and every `stand` is the walkable tile beside it. There are no
# 'water' errands on this floor: the sheet has no plant and nobody is going to
# water a barrel — see ATLAS.md for what is still missing.
RECADOS = [
    ('smoke', (5, 3), 'up', (5, 2), 18, True),           # his window, his cigar
    ('window', (14, 3), 'up', (14, 2), 5, False),        # the hall's two windows
    ('window', (25, 3), 'up', (25, 2), 5, False),
    ('window', (33, 3), 'up', (33, 2), 5, False),        # the warehouse window
    ('dispenser', (34, 5), 'up', (34, 4), 3.5, False),   # drawing from a barrel
    ('dispenser', (37, 20), 'up', (37, 19), 3.5, False),  # the lit candlestick
    ('fridge', (24, 16), 'up', (24, 15), 3.2, False),    # opening the great chest
    ('fridge', (30, 16), 'up', (30, 15), 3.2, False),
    ('shelf', (23, 18), 'up', (23, 17), 4, False),       # the open ledger
    ('shelf', (30, 26), 'up', (30, 25), 4, False),
    ('bin', (23, 25), 'up', (23, 24), 2.6, False),       # the crate
    ('bin', (12, 10), 'up', (12, 9), 2.6, False),
]

# ── spawn points and zones ────────────────────────────────────────────────────
NOMES_LUGARES = ['desk-feitor'] + [f'desk-{i + 1}' for i in range(len(LUGARES))]
NOMES_CAFE = [f'cafe-seat-{i + 1}' for i in range(len(LUGARES_CAFE))]


def pt(name, tile):
    return {'id': 0, 'name': name, 'type': '', 'x': tile[0] * TS, 'y': tile[1] * TS,
            'width': 0, 'height': 0, 'rotation': 0, 'visible': True, 'point': True}


spawns = [pt(n, t) for n, t in zip(NOMES_LUGARES, [LUGAR_FEITOR] + LUGARES)]
spawns += [pt(n, t) for n, t in zip(NOMES_CAFE, LUGARES_CAFE)]
spawns += [pt(n, t) for n, t, _ in BANCAS_CAFE]
spawns.append(pt('entrance', ENTRADA))

zones = [
    # the open floor south of the trade table is the boardroom: its walkable
    # tiles are the seat overflow when there are more agents than there are desks.
    {'id': 0, 'name': 'boardroom', 'type': '', 'x': 15 * TS, 'y': 8 * TS,
     'width': 10 * TS, 'height': 3 * TS, 'rotation': 0, 'visible': True},
    {'id': 0, 'name': 'cafeteria', 'type': '', 'x': 29 * TS, 'y': 14 * TS,
     'width': 10 * TS, 'height': 13 * TS, 'rotation': 0, 'visible': True},
]


# ── check before writing ──────────────────────────────────────────────────────
# A seat an agent cannot walk to is a floor that quietly breaks. Flood-fill from
# the door and refuse to write a map where anything the theme names is cut off.
def reachable_from(start):
    seen, queue = {start}, [start]
    while queue:
        x, y = queue.pop()
        for n in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if 0 <= n[0] < W and 0 <= n[1] < H and n not in seen and not coll[n[1] * W + n[0]]:
                seen.add(n)
                queue.append(n)
    return seen


if CHOQUES:
    raise SystemExit('props painted over each other: ' + '; '.join(CHOQUES))

seen = reachable_from(ENTRADA)
must_reach = {o['name']: (o['x'] // TS, o['y'] // TS) for o in spawns}
must_reach.update({f'{kind}@{stand}': stand for kind, stand, _, _, _, _ in RECADOS})
must_reach.update({f'coffee:{k}': v for k, v in CAFE.items() if k.endswith('Stand')})
cut_off = sorted(n for n, t in must_reach.items() if t not in seen)
if cut_off:
    raise SystemExit('unreachable from the door: ' + ', '.join(cut_off))
# every errand's fx tile must be the prop itself, i.e. NOT walkable
loose = [f'{k}@{fx}' for k, _, _, fx, _, _ in RECADOS
         if fx[1] < H and not coll[fx[1] * W + fx[0]]]
if loose:
    raise SystemExit('errand fx tiles with nothing on them: ' + ', '.join(loose))
# the clickable props must be something, not bare floor
bare = [k for k, (x, y) in ANCORAS.items() if not walls[y * W + x] and not fa[y * W + x]]
if bare:
    raise SystemExit('clickable anchors on empty tiles: ' + ', '.join(bare))
# the café counter must be one unbroken solid run beside the stands
for name, (sx, sy) in [('trayStand', CAFE['trayStand']), ('machineStand', CAFE['machineStand']),
                       ('sinkStand', CAFE['sinkStand'])] + \
                      [(n, t) for n, t, _ in BANCAS_CAFE]:
    if not coll[(sy - 1) * W + sx]:
        raise SystemExit(f'{name} at {(sx, sy)} has nothing to face')


# ── assemble and write ────────────────────────────────────────────────────────
def tilelayer(name, data, lid):
    return {'data': data, 'height': H, 'id': lid, 'name': name, 'opacity': 1,
            'type': 'tilelayer', 'visible': True, 'width': W, 'x': 0, 'y': 0}


def objlayer(name, objs, lid):
    return {'draworder': 'topdown', 'id': lid, 'name': name, 'objects': objs,
            'opacity': 1, 'type': 'objectgroup', 'visible': True, 'x': 0, 'y': 0}


# One atlas now, and the theme replaces this entry with its own inline metadata —
# only the firstgid and the order matter here. The collision layer's marker value
# of 1 happens to also be a real gid; that layer is parsed, never drawn.
tmj = {
    'compressionlevel': -1, 'height': H, 'infinite': False,
    'nextlayerid': 8, 'nextobjectid': 1, 'orientation': 'orthogonal',
    'renderorder': 'right-down', 'tiledversion': '1.12.0', 'tileheight': TS,
    'tilewidth': TS, 'type': 'map', 'version': '1.10', 'width': W,
    'tilesets': [{'firstgid': CASA, 'source': 'casadaindia.tsx'}],
    'layers': [
        tilelayer('floor', floor, 1),
        tilelayer('walls', walls, 2),
        tilelayer('furniture-below', fb, 3),
        tilelayer('furniture-above', fa, 4),
        tilelayer('collision', coll, 5),
        objlayer('spawn-points', spawns, 6),
        objlayer('zones', zones, 7),
    ],
}
json.dump(tmj, open(OUT, 'w'), indent=1)


def t(tile):
    return f'{{ x: {tile[0]}, y: {tile[1]} }}'


recados_ts = '\n'.join(
    f"  {{ kind: '{k}', stand: {t(s)}, facing: '{f}', fx: {t(x)}, duration: {d}"
    + (', godOnly: true },' if go else ' },')
    for k, s, f, x, d, go in RECADOS)

with open(OUT_TS, 'w') as fh:
    fh.write(f'''/**
 * A planta da Ribeira das Naus, em coordenadas de tile.
 *
 * GERADO por `tools/mapgen/build_ribeira.py` a partir do mesmo código que
 * desenha o `ribeira.tmj`. Não edites à mão — muda a planta no gerador e
 * volta a correr, ou o mapa e o tema deixam de dizer a mesma coisa.
 */
import type {{ AnchorConfig, CoffeeConfig, ErrandSpot }} from '../themeRegistry';

/** Ordem de ocupação dos lugares. O primeiro é do Feitor — é o lugar de deus. */
export const NOMES_LUGARES: string[] = [
{chr(10).join(f"  '{n}'," for n in NOMES_LUGARES)}
];

/** Os bancos das duas mesas do refeitório. */
export const NOMES_LUGARES_CAFE: string[] = [
{chr(10).join(f"  '{n}'," for n in NOMES_CAFE)}
];

/** Onde se fica de pé no refeitório, e a que serve cada sítio. */
export const BANCAS_CAFE = [
{chr(10).join(f"  ['{n}', '{kind}']," for n, _, kind in BANCAS_CAFE)}
] as const;

/** A adega: o barril das canecas, os barris de espicha, o barril de lavar. */
export const CAFE: CoffeeConfig = {{
  trayTile: {t(CAFE['trayTile'])},
  trayStand: {t(CAFE['trayStand'])},
  machineStand: {t(CAFE['machineStand'])},
  sinkTile: {t(CAFE['sinkTile'])},
  sinkStand: {t(CAFE['sinkStand'])},
  maxCups: {CAFE['maxCups']},
}};

/** Os quatro adereços clicáveis — painéis de azulejo do silhar. */
export const ANCORAS: AnchorConfig = {{
  calendar: {t(ANCORAS['calendar'])},
  boards: {t(ANCORAS['boards'])},
  clock: {t(ANCORAS['clock'])},
  askme: {t(ANCORAS['askme'])},
}};

/** Os recados de ócio. Cada `fx` é o adereço, cada `stand` é o tile ao lado
 *  — ambos verificados contra a camada de colisão pelo gerador. */
export const RECADOS: ErrandSpot[] = [
{recados_ts}
];
''')

print(f'wrote {OUT}  {W}×{H} @{TS}px = {W * TS}×{H * TS}, '
      f'{len(LUGARES) + 1} desks, {len(seen)} tiles reachable from the door')
print(f'wrote {OUT_TS}')
