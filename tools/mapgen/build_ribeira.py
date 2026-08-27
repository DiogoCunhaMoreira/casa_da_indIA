#!/usr/bin/env python3
"""Generate ribeira.tmj — the Casa da Índia floor, Ribeira das Naus, Lisboa c.1500.

    python3 tools/mapgen/build_ribeira.py

34 × 22 tiles, the same size as office.tmj, so the camera and the seat/errand
machinery need no changes. Art comes from casadaindia.png (firstgid 2449, see
src/renderer/src/assets/tilesets/ATLAS.md) plus two potted plants borrowed from
interiors.png. The plan:

      0        9  11             21 22   26        33
    ┌──────────┬────────────────────┬──────┬────────┐ 0
    │  janela  │ janela  ARCO janela│      │ janela │ rows 0-2  north wall
    │          │                    │      │        │ 3
    │ GABINETE │       ÁTRIO        │      │ARMAZÉM │ the arch is the way in
    │ DO FEITOR│    Padrão Real     │      │        │ 8
    ├──┬───────┤                    ├──────┴──┬─────┤ 9-11  interior walls
    │  ↑ porta │                    │   porta ↑     │
    │                               │               │ 12
    │     CASA DE CONTAS            │  REFEITÓRIO   │ seats on rows 13 and 18
    │     14 escrivaninhas          │               │
    │                               │               │ 20
    └───────────────────────────────┴───────────────┘ 21  skirting

Floors: the rich azulejo is the Feitor's, the plain azulejo is the counting
hall, lioz is the warehouse, boards are the refectory.

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

W, H, TS = 34, 22, 16
CASA = 2449          # firstgid of casadaindia.png (256 tiles, 16 columns)


def g(col, row):
    """gid of an atlas cell."""
    return CASA + row * 16 + col


def _empty_gids():
    """Atlas cells that are fully transparent — never painted."""
    a = Image.open(os.path.join(ASSETS, 'tilesets', 'casadaindia.png')).convert('RGBA')
    return {g(c, r) for r in range(16) for c in range(16)
            if a.crop((c * 16, r * 16, c * 16 + 16, r * 16 + 16)).getbbox() is None}


EMPTY = _empty_gids()

# ── the pieces, by name ───────────────────────────────────────────────────────
CHAO = {                                  # 2×2 motifs: [[tl, tr], [bl, br]]
    'azulejo':  [[g(0, 0), g(1, 0)], [g(0, 1), g(1, 1)]],
    'lioz':     [[g(2, 0), g(3, 0)], [g(2, 1), g(3, 1)]],
    'madeira':  [[g(4, 0), g(5, 0)], [g(4, 1), g(5, 1)]],
}
VARIANTE = [[g(8 + c, r) for c in range(4)] for r in range(4)]   # 4×4 motif

PAREDE = [g(0, 2), g(0, 3), g(0, 4)]      # cornice / plaster / dado + skirting
PILAR = [g(1, 2), g(1, 3), g(1, 4)]
CANTO_ESQ = [[g(2, 2), g(3, 2)], [g(2, 3), g(3, 3)], [g(2, 4), g(3, 4)]]
CANTO_DIR = [[g(4, 2), g(5, 2)], [g(4, 3), g(5, 3)], [g(4, 4), g(5, 4)]]
SOCO = g(0, 4)                            # the dado, used as the room's skirting

ARCO = [[g(c, r) for c in range(0, 3)] for r in range(5, 9)]     # 3 wide × 4 tall
JANELA = [[g(c, r) for c in range(3, 6)] for r in range(5, 9)]

ESCRIVANINHA = [g(0, 15), g(1, 15)]       # 2 wide, solid
BANCO = g(2, 15)                          # 1×1, walkable — the seat itself
MESA = [g(3, 15), g(4, 15)]               # 2 wide, solid

# atlas props as (col, row, tiles wide, tiles tall)
BARRIL, PILHA_BARRIS, BARRIL_DEITADO = (0, 9, 1, 1), (1, 9, 2, 2), (3, 9, 1, 1)
SACA, PILHA_SACAS, CAIXOTE = (4, 9, 1, 1), (5, 9, 2, 2), (7, 9, 1, 1)
PILHA_CAIXOTES, CORDAME = (8, 9, 2, 2), (10, 9, 1, 1)
ANCORA, FARDO = (11, 9, 2, 2), (13, 9, 2, 2)
CESTO, ANFORA = (0, 11, 1, 1), (1, 11, 1, 1)
BALANCA, ESFERA, PADRAO_REAL = (0, 12, 2, 2), (2, 12, 2, 2), (4, 12, 3, 2)
PILHA_LIVROS, AMPULHETA = (8, 12, 1, 1), (10, 12, 1, 1)
CASTICAL, ARCA_FORTE = (11, 12, 1, 1), (12, 12, 1, 1)
ASTROLABIO, PORTULANOS = (13, 12, 2, 2), (0, 14, 2, 1)
# borrowed from interiors.png (firstgid 1025) — a palm out of the Indies and a
# potted shrub. The only two tiles on this floor that are not ours.
PALMEIRA = [[1742, 1743], [1758, 1759]]   # 2×2
PLANTA = [[1756], [1772]]                 # 1×2

# ── layers ────────────────────────────────────────────────────────────────────
floor, walls, fb, fa, coll = ([0] * (W * H) for _ in range(5))


def put(layer, x, y, gid):
    if 0 <= x < W and 0 <= y < H and gid and gid not in EMPTY:
        layer[y * W + x] = gid


def blit(layer, x0, y0, rows):
    for dy, row in enumerate(rows):
        for dx, gid in enumerate(row):
            put(layer, x0 + dx, y0 + dy, gid)


def prop(layer, x0, y0, spec):
    c, r, pw, ph = spec
    blit(layer, x0, y0, [[g(c + dx, r + dy) for dx in range(pw)] for dy in range(ph)])


def fill(x0, y0, x1, y1, kind):
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            put(floor, x, y,
                VARIANTE[y % 4][x % 4] if kind == 'variante' else CHAO[kind][y % 2][x % 2])


# ── floor ─────────────────────────────────────────────────────────────────────
fill(0, 3, W - 1, H - 1, 'azulejo')       # the whole floor, then the rooms over it
fill(1, 3, 8, 8, 'variante')              # gabinete do Feitor
fill(27, 3, 32, 8, 'lioz')                # armazém
fill(22, 12, 32, 20, 'madeira')           # refeitório

# ── outer shell ───────────────────────────────────────────────────────────────
for x in range(W):                        # the plain north wall, all the way across
    for r in range(3):
        put(walls, x, r, PAREDE[r])
for y in range(3, H):                     # west and east skirting
    put(walls, 0, y, SOCO)
    put(walls, W - 1, y, SOCO)
for x in range(W):                        # south skirting
    put(walls, x, H - 1, SOCO)

# The corners and the signature pieces go on furniture-above, not on walls: they
# do not fill their bounding box, and on the walls layer their transparent
# margins would replace the wall instead of sitting on top of it. That layer
# still draws under the agents — the name means "above the floor".
blit(fa, 0, 0, CANTO_ESQ)
blit(fa, W - 2, 0, CANTO_DIR)
blit(fa, 4, 0, JANELA)                    # the Feitor's window — his cigar window
blit(fa, 11, 0, JANELA)                   # the hall's two public windows
blit(fa, 20, 0, JANELA)
blit(fa, 28, 0, JANELA)                   # the warehouse window
blit(fa, 15, 0, ARCO)                     # the way in


def vwall(col, r0, r1):
    for r in range(r0, r1 + 1):
        put(walls, col, r, PILAR[0] if r == r0 else (PILAR[2] if r == r1 else PILAR[1]))


def hwall(row, c0, c1, doors=()):
    """A south-facing wall: cornice, plaster, dado — the room is above it."""
    for c in range(c0, c1 + 1):
        if c in doors:
            continue
        for r in range(3):
            put(walls, c, row + r, PAREDE[r])


PORTA_GABINETE, PORTA_ARMAZEM = 3, 29
vwall(9, 3, 11)                           # gabinete: east wall, no door
hwall(9, 1, 9, doors=(PORTA_GABINETE,))
vwall(26, 3, 11)                          # armazém: west wall, no door
hwall(9, 26, 32, doors=(PORTA_ARMAZEM,))

# ══ GABINETE DO FEITOR ═══════════════════════════════════════════════════════
prop(fa, 1, 3, ESFERA)                    # the armillary sphere, D. Manuel's device
prop(fa, 7, 3, ASTROLABIO)
blit(fa, 4, 5, [ESCRIVANINHA])            # his desk, under his own window
put(fb, 4, 6, BANCO)
LUGAR_FEITOR = (4, 6)
blit(fa, 1, 6, PALMEIRA)                  # a palm out of the Indies — his to water
prop(fa, 6, 8, PORTULANOS)
prop(fb, 8, 7, ARCA_FORTE)

# ══ ÁTRIO — the hall under the arch ══════════════════════════════════════════
prop(fa, 10, 4, AMPULHETA)
prop(fa, 11, 6, PADRAO_REAL)              # the master chart, on its high table
prop(fa, 14, 4, PILHA_LIVROS)
prop(fa, 22, 3, FARDO)                    # goods waiting on the scales
prop(fa, 22, 5, BALANCA)                  # everything that came ashore was weighed
prop(fa, 10, 8, ANFORA)                   # the water jar
blit(fa, 19, 7, PLANTA)
blit(fa, 24, 9, PLANTA)
prop(fb, 25, 7, CESTO)

# ══ ARMAZÉM — col 29 is kept clear as the aisle from its door ════════════════
prop(fa, 27, 3, CAIXOTE)
prop(fa, 31, 3, BARRIL_DEITADO)
prop(fa, 27, 4, PILHA_BARRIS)
prop(fa, 30, 4, PILHA_SACAS)
prop(fa, 32, 4, BARRIL)
prop(fa, 32, 5, ANFORA)
prop(fa, 27, 7, PILHA_CAIXOTES)
prop(fa, 30, 7, ANCORA)
prop(fa, 32, 7, CORDAME)
prop(fa, 32, 8, SACA)

# ══ CASA DE CONTAS — the fourteen writing desks ══════════════════════════════
COLS_MESA = [1, 4, 7, 10, 13, 16, 19]     # a desk is 2 wide with a 1-tile aisle
LINHAS_MESA = [13, 18]                    # the seat row; the desk is one row above
LUGARES = []
for sy in LINHAS_MESA:
    for sx in COLS_MESA:
        blit(fa, sx, sy - 1, [ESCRIVANINHA])
        put(fb, sx, sy, BANCO)
        LUGARES.append((sx, sy))

prop(fa, 21, 12, PILHA_LIVROS)            # the clerks' overflow, along the wall
prop(fa, 21, 16, CASTICAL)
prop(fb, 21, 20, CESTO)

# ══ REFEITÓRIO ═══════════════════════════════════════════════════════════════
blit(fa, 24, 14, [MESA])                  # two tables, benches on the south side
blit(fa, 24, 17, [MESA])
LUGARES_CAFE = [(24, 15), (25, 15), (24, 18), (25, 18)]
for (bx, by) in LUGARES_CAFE:
    put(fb, bx, by, BANCO)

# The adega counter: the coffee economy, in barrels. It has to be an unbroken
# run of solid tiles along row 13 — the scene turns a standing agent toward the
# first non-walkable neighbour it finds, and a gap here would have them serving
# themselves with their back to the barrels.
prop(fa, 28, 13, BARRIL)                  # where the cups live
prop(fa, 29, 13, BARRIL)
prop(fa, 30, 12, PILHA_BARRIS)            # the tapped barrels — the "machine"
prop(fa, 32, 13, BARRIL_DEITADO)          # the rinsing barrel
blit(fa, 29, 19, PALMEIRA)
prop(fb, 32, 17, CESTO)
prop(fb, 22, 19, ARCA_FORTE)

# ══ COLLISION ════════════════════════════════════════════════════════════════
for y in range(H):
    for x in range(W):
        solid = bool(walls[y * W + x])
        for layer in (fb, fa):
            gid = layer[y * W + x]
            if gid and gid != BANCO:      # the stool IS the seat — agents stand on it
                solid = True
        if solid:
            coll[y * W + x] = 1
coll[3 * W + 16] = 0                      # the threshold under the arch
for (sx, sy) in LUGARES + LUGARES_CAFE + [LUGAR_FEITOR]:
    coll[sy * W + sx] = 0

# ── what the theme needs to know ──────────────────────────────────────────────
ENTRADA = (16, 4)
CAFE = {
    'trayTile': (28, 13), 'trayStand': (28, 14),   # the cup barrel
    'machineStand': (30, 14),                      # below the tapped barrels
    'sinkTile': (32, 13), 'sinkStand': (32, 14),   # the rinsing barrel
    'maxCups': 4,
}
BANCAS_CAFE = [('cafe-stand-coffee', (29, 14), 'coffee'),
               ('cafe-stand-vending', (31, 14), 'vending')]
ANCORAS = {
    'calendar': (2, 1),    # TRIGGERS — hangs on the Feitor's north wall
    'boards': (4, 11),     # TASKS    — against the counting hall's north wall
    'clock': (8, 1),       # CLOSING TIME
}
# kind, stand, facing, fx, duration, godOnly. Every `fx` is the prop the errand
# plays against, and every `stand` is the walkable tile beside it.
RECADOS = [
    ('water', (3, 6), 'left', (2, 6), 4.5, True),        # the Feitor's palm
    ('smoke', (5, 4), 'up', (5, 2), 18, True),           # his window, his cigar
    ('water', (18, 8), 'right', (19, 8), 4.5, False),
    ('water', (23, 10), 'right', (24, 10), 4.5, False),
    ('water', (28, 20), 'right', (29, 20), 4.5, False),  # the refectory palm
    ('window', (12, 4), 'up', (12, 2), 5, False),        # the two public windows
    ('window', (21, 4), 'up', (21, 2), 5, False),
    ('dispenser', (10, 7), 'down', (10, 8), 3.5, False),  # the water jars
    ('dispenser', (32, 6), 'up', (32, 5), 3.5, False),
    ('fridge', (21, 17), 'up', (21, 16), 3.2, False),    # the lit candlestick
    ('shelf', (21, 13), 'up', (21, 12), 4, False),       # the ledger stack
    ('shelf', (22, 20), 'up', (22, 19), 4, False),       # the strongbox
    ('bin', (24, 7), 'right', (25, 7), 2.6, False),      # the wicker baskets
    ('bin', (31, 17), 'right', (32, 17), 2.6, False),
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
    # the floor around the Padrão Real is the boardroom: its walkable tiles are
    # the seat overflow when there are more agents than there are desks.
    {'id': 0, 'name': 'boardroom', 'type': '', 'x': 10 * TS, 'y': 7 * TS,
     'width': 7 * TS, 'height': 3 * TS, 'rotation': 0, 'visible': True},
    {'id': 0, 'name': 'cafeteria', 'type': '', 'x': 22 * TS, 'y': 12 * TS,
     'width': 11 * TS, 'height': 9 * TS, 'rotation': 0, 'visible': True},
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


seen = reachable_from(ENTRADA)
must_reach = {o['name']: (o['x'] // TS, o['y'] // TS) for o in spawns}
must_reach.update({f'{kind}@{stand}': stand for kind, stand, _, _, _, _ in RECADOS})
must_reach.update({f'coffee:{k}': v for k, v in CAFE.items()
                   if k.endswith('Stand')})
cut_off = sorted(n for n, t in must_reach.items() if t not in seen)
if cut_off:
    raise SystemExit('unreachable from the door: ' + ', '.join(cut_off))
# every errand's fx tile must be the prop itself, i.e. NOT walkable
loose = [f'{k}@{fx}' for k, _, _, fx, _, _ in RECADOS
         if fx[1] < H and not coll[fx[1] * W + fx[0]]]
if loose:
    raise SystemExit('errand fx tiles with nothing on them: ' + ', '.join(loose))

# ── assemble and write ────────────────────────────────────────────────────────
def tilelayer(name, data, lid):
    return {'data': data, 'height': H, 'id': lid, 'name': name, 'opacity': 1,
            'type': 'tilelayer', 'visible': True, 'width': W, 'x': 0, 'y': 0}


def objlayer(name, objs, lid):
    return {'draworder': 'topdown', 'id': lid, 'name': name, 'objects': objs,
            'opacity': 1, 'type': 'objectgroup', 'visible': True, 'x': 0, 'y': 0}


# Two atlases, and the theme replaces both with its own inline metadata — only
# the firstgids and the order matter here. interiors.png is in for exactly six
# tiles: the palm and the potted shrub. The collision layer's marker value of 1
# resolves to no atlas, which is fine — that layer is parsed, never drawn.
tmj = {
    'compressionlevel': -1, 'height': H, 'infinite': False,
    'nextlayerid': 8, 'nextobjectid': 1, 'orientation': 'orthogonal',
    'renderorder': 'right-down', 'tiledversion': '1.12.0', 'tileheight': TS,
    'tilewidth': TS, 'type': 'map', 'version': '1.10', 'width': W,
    'tilesets': [
        {'firstgid': 1025, 'source': 'interiors.tsx'},
        {'firstgid': CASA, 'source': 'casadaindia.tsx'},
    ],
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

/** Os três adereços clicáveis. */
export const ANCORAS: AnchorConfig = {{
  calendar: {t(ANCORAS['calendar'])},
  boards: {t(ANCORAS['boards'])},
  clock: {t(ANCORAS['clock'])},
}};

/** Os recados de ócio. Cada `fx` é o adereço, cada `stand` é o tile ao lado
 *  — ambos verificados contra a camada de colisão pelo gerador. */
export const RECADOS: ErrandSpot[] = [
{recados_ts}
];
''')

print(f'wrote {OUT}  {W}x{H}, {len(LUGARES) + 1} desks, '
      f'{len(seen)} tiles reachable from the door')
print(f'wrote {OUT_TS}')
