#!/usr/bin/env python3
"""Build src/renderer/src/assets/tilesets/casadaindia.png from the painted sheet.

    python3 tools/mapgen/build_atlas.py [SHEET.png]

The source is one 1448×1086 painted sheet (tools/mapgen/art/casadaindia-sheet.png)
holding 29 pieces at roughly 120 px per floor tile. This cuts it into the atlas
the map draws with: 16 columns of 32 px cells, 512×512.

Why 32 and not the 16 this project used to run at: the sheet is painted, not
pixelled. At 16 px a terracotta tile loses its joints, the azulejo turns to
noise and the barrel loses its staves — i.e. the new art would arrive with
exactly the detail of the art it replaced. 32 px is the smallest cell where
every piece on the sheet still reads. The map, the camera and the character
scale were moved to match; see build_ribeira.py and CharacterSprite.ts.

**No palette quantisation.** The old 16 px atlas snapped every pixel to 27 brand
colours to hold a hand-pixelled look together. This art is painted and its
colour IS the detail — posterising it is the one edit that would undo the whole
point of the exercise.

**Two things this does do to the art, both measured, both explained where they
happen:** floor cells are cut *inside* their painted mortar rim (`cell`'s
`inset`, or every joint in the room doubles up into a visible 32 px cage), and
props get a contact shadow derived from their own silhouette (`contact_shadow`,
or they read as stickers laid on the floor rather than things standing on it).

Layout of the output is documented in
src/renderer/src/assets/tilesets/ATLAS.md — keep the two in sync.
Requires pillow + numpy.
"""
import os, sys
import numpy as np
from PIL import Image, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
ASSETS = os.path.join(ROOT, 'src', 'renderer', 'src', 'assets')
SHEET = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, 'art', 'casadaindia-sheet.png')
OUT = os.path.join(ASSETS, 'tilesets', 'casadaindia.png')

TILE = 32
COLS = ROWS = 16

# ── cutting the sheet ─────────────────────────────────────────────────────────
# Every box below was measured off the sheet by alpha-island analysis. A box is
# (x, y, w, h) of the whole run; `nx`/`ny` say how many equal cells it holds.
# The art was laid out by hand, so a run's cells are only *approximately* even —
# the residual error is a couple of source pixels, which is a third of a pixel
# once a 120 px cell becomes 32.

def grid(x, y, w, h, nx=1, ny=1):
    """Split a run into nx×ny boxes, in reading order."""
    return [(round(x + c * w / nx), round(y + r * h / ny),
             round(w / nx), round(h / ny))
            for r in range(ny) for c in range(nx)]


# floors — self-contained tiles, cut on their shared grout lines
TERRACOTA = grid(19, 17, 244, 249, 2, 2) + grid(268, 17, 245, 249, 2, 2)
LIOZ = [(521, 19, 113, 120), (639, 19, 110, 120),
        (756, 19, 112, 120), (873, 18, 109, 121)]
# walls — 3×2 run of limewashed plaster, some with stone showing at the base
REBOCO = grid(995, 17, 440, 272, 3, 2)
# the azulejo dado: five painted panels, three patterned and two with the
# armillary sphere. They go ON THE WALL, never on the floor — putting azulejo
# underfoot everywhere is what made the old floor read as noise.
AZULEJO = grid(19, 281, 933, 174, 5, 1)
FRISO = grid(966, 311, 238, 113, 2, 1) + grid(1210, 311, 224, 114, 2, 1)
VIGA = grid(20, 475, 477, 142, 4, 1)

# big pieces — (box, tiles wide, tiles tall)
PORTA = ((515, 475, 285, 405), 2, 3)
JANELA = ((823, 482, 230, 268), 2, 2)
ARCA = ((1083, 473, 335, 144), 3, 2)
MESA_COMERCIO = ((23, 645, 458, 248), 4, 2)
ESCRIVANINHA = ((1064, 637, 247, 260), 2, 2)
BALANCA = ((1327, 659, 107, 230), 1, 2)

# loose props, one tile each unless noted
SACA_VERMELHA = ((33, 921, 119, 127), 1, 1)
SACA_AMARELA = ((169, 914, 121, 133), 1, 1)
CAIXOTE = ((325, 917, 111, 128), 1, 1)
FARDO = ((471, 917, 115, 126), 1, 1)
BARRIL = ((619, 905, 110, 145), 1, 1)
LIVRO = ((761, 932, 145, 108), 1, 1)
PERGAMINHO = ((925, 919, 125, 119), 1, 1)
CASTICAL = ((1070, 904, 69, 145), 1, 1)
BANCO = ((1179, 937, 241, 115), 2, 1)


# ── image helpers ─────────────────────────────────────────────────────────────
def resize_rgba(im, w, h):
    """Downscale on premultiplied alpha, so a prop's edge does not bleed the
    black that sits under its transparent pixels. Un-premultiplies on the way
    out. BOX when we are shrinking by 2× or more (it averages every source
    pixel, which is what a 4× reduction wants), LANCZOS otherwise."""
    arr = np.asarray(im, dtype=np.float32)
    al = arr[..., 3:4] / 255.0
    pre = np.concatenate([arr[..., :3] * al, arr[..., 3:4]], axis=-1)
    small = Image.fromarray(pre.clip(0, 255).astype('uint8'), 'RGBA').resize(
        (w, h), Image.BOX if im.width >= w * 2 else Image.LANCZOS)
    out = np.asarray(small, dtype=np.float32)
    rgb = (out[..., :3] / np.maximum(out[..., 3:4], 1e-6) * 255.0).clip(0, 255)
    return Image.fromarray(
        np.dstack([rgb, out[..., 3]]).astype('uint8'), 'RGBA')


def harden(im, cut=110):
    """Snap the alpha to on/off. A prop with a soft edge shimmers against the
    floor once the camera moves; a hard edge does not."""
    a = np.asarray(im).copy()
    a[..., 3] = (a[..., 3] >= cut) * 255
    a[a[..., 3] == 0] = 0
    return Image.fromarray(a, 'RGBA')


def opaque(im):
    """Floors and walls are backdrops: force them fully opaque so a stray soft
    pixel at a tile border cannot show the clear colour through the seam."""
    a = np.asarray(im).copy()
    a[..., 3] = 255
    return Image.fromarray(a, 'RGBA')


def trim(im):
    box = im.getbbox()
    return im.crop(box) if box else im


def drop_slate(im, until_row):
    """Erase the dark slate panel the scales were painted against.

    That panel is part of the picture, not part of the object — dropped onto a
    terracotta floor it reads as a black hole. It is the one **neutral** thing
    in the crop: the slate measures R≈G≈B around (48,48,50), while every other
    dark pixel in the piece is warm brown or saturated gold. So a channel-spread
    test keys it out exactly, with no tolerance to tune, and restricting it to
    the rows above the table top keeps it away from the wood below."""
    a = np.asarray(im).astype(np.int16).copy()
    rgb = a[:until_row, :, :3]
    neutral = (rgb.max(-1) - rgb.min(-1) < 14) & (rgb.mean(-1) < 100)
    a[:until_row][neutral] = 0
    return Image.fromarray(a.astype(np.uint8), 'RGBA')


# ── build ─────────────────────────────────────────────────────────────────────
sheet = Image.open(SHEET).convert('RGBA')
atlas = Image.new('RGBA', (COLS * TILE, ROWS * TILE), (0, 0, 0, 0))
used = {}


def place(col, row, im):
    atlas.alpha_composite(im, (col * TILE, row * TILE))


def cell(box, col, row, kind='prop', inset=0):
    """One 32×32 atlas cell from one source box.

    `inset` trims that many source pixels off all four sides, and on the floors
    it is the difference between a room and a cage. Each floor cell on the sheet
    is drawn with its own dark mortar rim — about five pixels down the left edge
    and six down the right. Cut on the shared line and every joint in the room
    carries BOTH rims: eleven source pixels of dark, which lands as a solid
    three-pixel line every thirty-two, at a perfectly regular pitch, forty
    columns wide. Measured against the finished floor that seam ran ~48 grey
    levels below the tile interior while the variation *inside* a tile was ±5 —
    ten times stronger than anything the eight painted variants could say. So
    the eye stops seeing terracotta and starts seeing the grid.

    Trimming half the rim off each side leaves one ordinary grout line where two
    tiles meet, instead of two stacked."""
    x, y, w, h = box
    im = resize_rgba(sheet.crop((x + inset, y + inset,
                                 x + w - inset, y + h - inset)), TILE, TILE)
    place(col, row, opaque(im) if kind == 'flat' else harden(im))


def contact_shadow(prop, feet_rows=5):
    """A soft pool of shade under a prop, painted into its own cells.

    Without one, every barrel and every chest reads as a sticker laid on the
    floor rather than an object standing on it — the single loudest reason the
    room looked flat. It is derived from the prop's own silhouette: take the
    bottom few rows of its alpha, squash them into an ellipse-ish smear, blur
    it, and put it *behind* the prop. Nothing to draw, and it follows the shape
    of whatever it is under."""
    a = np.asarray(prop)
    al = a[..., 3] > 0
    ys = np.flatnonzero(al.any(1))
    if not len(ys):
        return prop
    bottom = ys[-1]
    band = al[max(0, bottom - feet_rows):bottom + 1]
    if not band.any():
        return prop
    xs = np.flatnonzero(band.any(0))
    x0, x1 = xs[0], xs[-1]
    cx, half = (x0 + x1) / 2, max(2.0, (x1 - x0) / 2 * 1.15)
    ry = max(2.0, half * 0.34)
    cy = bottom - ry * 0.35

    yy, xx = np.mgrid[0:a.shape[0], 0:a.shape[1]]
    d = ((xx - cx) / half) ** 2 + ((yy - cy) / ry) ** 2
    mask = np.clip(1.0 - d, 0, 1) ** 0.7
    sh = np.zeros_like(a)
    sh[..., 3] = (mask * 118).astype(np.uint8)
    shadow = Image.fromarray(sh, 'RGBA').filter(ImageFilter.GaussianBlur(1.1))
    out = Image.new('RGBA', prop.size, (0, 0, 0, 0))
    out.alpha_composite(shadow)
    out.alpha_composite(prop)
    return out


def block(spec, col, row, name, slate=0, shadow=True):
    """A prop that spans tw×th cells, scaled to fit and anchored bottom-centre
    so it stands on the floor rather than floating in its bounding box."""
    (x, y, w, h), tw, th = spec
    src = sheet.crop((x, y, x + w, y + h))
    if slate:
        src = drop_slate(src, slate)
    src = trim(src)
    W, H = tw * TILE, th * TILE
    s = min(W / src.width, H / src.height)
    nw, nh = max(1, round(src.width * s)), max(1, round(src.height * s))
    small = harden(resize_rgba(src, nw, nh))
    canvas = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    canvas.alpha_composite(small, ((W - nw) // 2, H - nh))
    if shadow:
        canvas = contact_shadow(canvas)
    place(col, row, canvas)
    used[name] = (col, row, tw, th)


# row 0 — the eight terracotta floors, then the four limestone flags.
# INSET_CHAO trims half the painted mortar rim off each side; see cell().
INSET_CHAO = 4
for i, b in enumerate(TERRACOTA):
    cell(b, i, 0, 'flat', inset=INSET_CHAO)
for i, b in enumerate(LIOZ):
    cell(b, 8 + i, 0, 'flat', inset=INSET_CHAO)

# row 1 — plaster (0-5), azulejo dado (6-10), stone frieze (11-14)
for i, b in enumerate(REBOCO):
    cell(b, i, 1, 'flat')
for i, b in enumerate(AZULEJO):
    cell(b, 6 + i, 1, 'flat')
for i, b in enumerate(FRISO):
    cell(b, 11 + i, 1, 'flat')

# row 2 — ceiling beams (0-3), then the two tiles the sheet does not contain
for i, b in enumerate(VIGA):
    cell(b, i, 2, 'flat')

# ESCURO: what lies outside the walls. Not on the sheet — a flat tile in the
# shadow tone the beams are painted in, so the map has something honest to put
# behind a wall instead of a hole.
escuro = Image.new('RGBA', (TILE, TILE), (26, 20, 16, 255))
place(4, 2, escuro)

# PAREDE_V: a wall running north–south. The sheet has wall *faces*, which is all
# a south-facing wall needs, but a partition seen edge-on is a different tile and
# a plain plaster face used for one reads as a pale stripe of floor. So: a
# plaster tile with a shadow gutter burnt down both edges, which is what gives it
# the thickness that makes it read as a wall instead of a path.
def parede_vertical(src_col):
    im = resize_rgba(sheet.crop((REBOCO[src_col][0], REBOCO[src_col][1],
                                 REBOCO[src_col][0] + REBOCO[src_col][2],
                                 REBOCO[src_col][1] + REBOCO[src_col][3])), TILE, TILE)
    a = np.asarray(im).astype(np.float32).copy()
    x = np.arange(TILE)
    edge = np.minimum(x, TILE - 1 - x) / 9.0          # 0 at the edges, 1 by 9 px in
    shade = np.clip(0.22 + 0.78 * edge, 0, 1)[None, :, None]
    a[..., :3] *= shade
    a[..., 3] = 255
    return Image.fromarray(a.clip(0, 255).astype('uint8'), 'RGBA')


place(5, 2, parede_vertical(0))
place(6, 2, parede_vertical(3))

# rows 3-5 — the big pieces
block(PORTA, 0, 3, 'porta')                 # 2×3, rows 3-5
block(JANELA, 2, 3, 'janela')               # 2×2, rows 3-4
block(ARCA, 4, 3, 'arca')                   # 3×2
block(MESA_COMERCIO, 7, 3, 'mesa_comercio')  # 4×2
block(ESCRIVANINHA, 11, 3, 'escrivaninha')  # 2×2
# the slate panel behind the scales is painted in; key it out above the table top
block(BALANCA, 13, 3, 'balanca', slate=80)

# row 6 — the loose props
for i, (spec, name) in enumerate([
        (SACA_VERMELHA, 'saca_vermelha'), (SACA_AMARELA, 'saca_amarela'),
        (CAIXOTE, 'caixote'), (FARDO, 'fardo'), (BARRIL, 'barril'),
        (LIVRO, 'livro'), (PERGAMINHO, 'pergaminho'), (CASTICAL, 'castical')]):
    block(spec, i, 6, name)
block(BANCO, 8, 6, 'banco')                 # 2×1

atlas.save(OUT)
filled = sum(1 for r in range(ROWS) for c in range(COLS)
             if atlas.crop((c * TILE, r * TILE, c * TILE + TILE, r * TILE + TILE)).getbbox())
print(f'wrote {OUT}  {atlas.width}×{atlas.height}, {TILE}px cells, {filled} non-empty')
