#!/usr/bin/env python3
"""Build src/renderer/src/assets/tilesets/casadaindia.png from the raw artwork.

The image model draws one piece at a time, big and anti-aliased. This does the
post-production the artwork spec promises: downscale to 16 px per tile,
posterise to the brand palette, snap to the grid, keep the floors seamless.

    python3 tools/mapgen/build_atlas.py [SRC_DIR]

SRC_DIR defaults to ~/Downloads/casa_de_contas_11_pngs. Layout of the output
atlas is documented in src/renderer/src/assets/tilesets/ATLAS.md — keep the two
in sync. Requires pillow + numpy.
"""
import os, sys
import numpy as np
from PIL import Image, ImageEnhance

HERE = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.abspath(os.path.join(HERE, '..', '..', 'src', 'renderer', 'src', 'assets'))
SRC = sys.argv[1] if len(sys.argv) > 1 else \
    os.path.expanduser('~/Downloads/casa_de_contas_11_pngs')
OUT = os.path.join(ASSETS, 'tilesets', 'casadaindia.png')
TILE = 16
COLS = ROWS = 16

# ── palette ───────────────────────────────────────────────────────────────────
# The brand tokens from design/tokens.ts plus the ramps the artwork needs.
# Every pixel in the atlas is snapped to one of these.
PALETTE_HEX = [
    '21201C', '3A3833', '4A4A50', '7A7A84',          # ink / iron
    '123A73', '1F4E9C', '7FA9D9', 'B7CFE9',          # azulejo blues
    'D9C9A8', 'F2E6CE', 'FFF8E8',                    # parchment / limewash
    '8A6412', 'C8961E', 'E8C46A',                    # brass / gold
    '046A38', '2E9C63',                              # green
    'A4161A', 'D64045',                              # red
    '4A2F18', '6B4423', '8B5E34', 'B08050',          # wood
    '6E675C', '8E877A', 'B8B0A0', 'D8D2C4',          # lioz stone
    'A0824A', 'C9A66B',                              # jute / rope
    '7A4022', 'A05A32', 'C4703C',                    # terracotta
    'CFE0F2',                                        # Tagus sky
]
PAL = np.array([[int(h[i:i + 2], 16) for i in (0, 2, 4)] for h in PALETTE_HEX], np.float32)


def _srgb_to_lab(rgb):
    """rgb in 0..255 -> CIELab. Accurate enough for nearest-colour matching."""
    c = rgb.astype(np.float32) / 255.0
    c = np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)
    m = np.array([[0.4124, 0.3576, 0.1805],
                  [0.2126, 0.7152, 0.0722],
                  [0.0193, 0.1192, 0.9505]], np.float32)
    xyz = c @ m.T / np.array([0.95047, 1.0, 1.08883], np.float32)
    f = np.where(xyz > 0.008856, np.cbrt(xyz), 7.787 * xyz + 16.0 / 116.0)
    return np.stack([116 * f[..., 1] - 16,
                     500 * (f[..., 0] - f[..., 1]),
                     200 * (f[..., 1] - f[..., 2])], axis=-1)


PAL_LAB = _srgb_to_lab(PAL)


def quantize(rgb):
    """Nearest palette colour in Lab. No dithering — at 16 px it reads as noise."""
    flat = _srgb_to_lab(rgb).reshape(-1, 3)
    d = ((flat[:, None, :] - PAL_LAB[None, :, :]) ** 2).sum(-1)
    return PAL[d.argmin(1)].astype(np.uint8).reshape(rgb.shape)


# ── helpers ───────────────────────────────────────────────────────────────────
def load(name):
    return np.asarray(Image.open(os.path.join(SRC, name)).convert('RGBA')).astype(np.float32)


def bbox(a, thr=16):
    ys, xs = np.nonzero(a[..., 3] > thr)
    return int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1


def trim(a):
    x0, y0, x1, y1 = bbox(a)
    return a[y0:y1, x0:x1]


def resize_rgba(a, w, h):
    """Area downscale with premultiplied alpha — no black halo around the edges."""
    al = a[..., 3:4] / 255.0
    pm = np.concatenate([a[..., :3] * al, a[..., 3:4]], axis=-1)
    im = Image.fromarray(np.clip(pm, 0, 255).astype(np.uint8), 'RGBA')
    im = im.resize((w, h), Image.BOX if a.shape[1] >= w * 2 else Image.LANCZOS)
    out = np.asarray(im).astype(np.float32)
    al2 = np.maximum(out[..., 3:4], 1e-6) / 255.0
    return np.concatenate([np.clip(out[..., :3] / al2, 0, 255), out[..., 3:4]], axis=-1)


def finish(a, opaque=False):
    """Posterise and harden the alpha. Returns uint8 RGBA."""
    if not opaque:
        a = a.copy()
        a[..., 3] = np.where(a[..., 3] >= 110, 255, 0)
    al = np.full(a.shape[:2], 255, np.uint8) if opaque else a[..., 3].astype(np.uint8)
    out = np.dstack([quantize(a[..., :3]), al])
    out[al == 0] = 0
    return out


def fit_prop(a, tw, th, pad=1):
    """Scale a prop to fit tw×th tiles, anchored bottom-centre so it sits on the floor."""
    a = trim(a)
    W, H = tw * TILE, th * TILE
    ih, iw = a.shape[:2]
    s = min((W - 2 * pad) / iw, (H - 2 * pad) / ih)
    nw, nh = max(1, round(iw * s)), max(1, round(ih * s))
    canvas = np.zeros((H, W, 4), np.float32)
    ox, oy = (W - nw) // 2, H - nh - pad
    canvas[oy:oy + nh, ox:ox + nw] = resize_rgba(a, nw, nh)
    return finish(canvas)


def symmetrise_x(t):
    """Mirror the tile left/right so it butts against itself without a jump."""
    out, w = t.copy(), t.shape[1]
    out[:, w // 2:] = t[:, :w // 2][:, ::-1]
    return out


# ── block A · floors ──────────────────────────────────────────────────────────
def resize_seamless(a, n, contrast=1.0):
    """Downscale a repeating motif without breaking the seam.

    Tiles 3×3 copies, resizes the lot and keeps the middle one, so the filter
    always sees neighbours from across the join and the border comes out
    identical to the interior. Lanczos + a contrast lift keeps the linework
    crisp; a plain box average turns dense azulejo into blue mush.
    """
    big = np.tile(np.clip(a[..., :3], 0, 255).astype(np.uint8), (3, 3, 1))
    im = Image.fromarray(big, 'RGB').resize((n * 3, n * 3), Image.LANCZOS)
    if contrast != 1.0:
        im = ImageEnhance.Contrast(im).enhance(contrast)
    mid = np.asarray(im).astype(np.float32)[n:2 * n, n:2 * n]
    return finish(np.dstack([mid, np.full((n, n, 1), 255.0)]), opaque=True)


def floor_azulejo_principal():
    """2×2 tiles. 1.png holds 2×2 copies of the motif; the period measures 627 px."""
    return resize_seamless(load('1.png')[0:627, 0:627], 32, contrast=1.25)


def floor_azulejo_variante():
    """4×4 tiles, not 2×2 — the pattern is too dense to survive 32 px.

    The whole image is one motif: it is mirror-symmetric and continuous across
    its own borders (measured), so it repeats as delivered.
    """
    return resize_seamless(load('2.png'), 64, contrast=1.6)


def floor_lioz():
    """Lioz flagstone, 2×2 tiles. Drawn here — it was not in the delivered art."""
    P = {k: np.array([int(v[i:i + 2], 16) for i in (0, 2, 4)], np.uint8)
         for k, v in dict(clr='D8D2C4', med='B8B0A0', esc='8E877A', jun='8E877A').items()}
    t = np.zeros((32, 32, 4), np.uint8)
    t[..., 3] = 255
    t[..., :3] = P['jun']              # the joints are the background showing through
    lajes = [(0, 0, 19, 14, P['clr']), (19, 0, 32, 14, P['med']),
             (0, 14, 12, 32, P['med']), (12, 14, 25, 32, P['clr']),
             (25, 14, 32, 32, P['med'])]
    for x0, y0, x1, y1, tom in lajes:
        t[y0 + 1:y1, x0 + 1:x1, :3] = tom
        t[y1 - 1, x0 + 1:x1, :3] = P['esc']            # shadow along the bottom edge
    rng = np.random.default_rng(7)                     # stone speckle
    t[..., :3][rng.random((32, 32)) < 0.05] = P['esc']
    t[..., :3][rng.random((32, 32)) < 0.04] = P['clr']
    return t


def floor_madeira():
    """Board flooring, 2×2 tiles. Drawn here — it was not in the delivered art."""
    C = {k: np.array([int(v[i:i + 2], 16) for i in (0, 2, 4)], np.uint8)
         for k, v in dict(clr='B08050', med='8B5E34', esc='6B4423', jun='4A2F18').items()}
    t = np.zeros((32, 32, 4), np.uint8)
    t[..., 3] = 255
    rng = np.random.default_rng(3)
    for i, tom in enumerate([C['med'], C['clr'], C['esc'], C['med']]):   # four 8 px boards
        y0 = i * 8
        t[y0:y0 + 8, :, :3] = tom
        t[y0, :, :3] = C['jun']                        # joint between boards
        for y in (y0 + 3, y0 + 5):                     # grain
            t[y, rng.random(32) < 0.30, :3] = C['esc']
    for i, x in enumerate((5, 21, 13, 29)):            # staggered board ends
        t[i * 8:i * 8 + 8, x, :3] = C['jun']
    return t


# ── block B · walls ───────────────────────────────────────────────────────────
def wall_column(name, bands, tiles_w=1, sym=True):
    """Slice a wall drawing into 16 px bands. bands = [(fy0, fy1), ...] of the bbox.

    The delivered walls are whole segments — cornice, plaster, azulejo dado,
    stone skirting — so each becomes a 3-tile-tall column rather than the single
    face tile the spec asked for.
    """
    a = load(name)
    x0, y0, x1, y1 = bbox(a)
    if tiles_w == 1:                    # middle panel only, so it repeats sideways
        panel = (x1 - x0) / 3.0
        cx = x0 + ((x1 - x0) - panel) / 2
        a = a[y0:y1, int(cx):int(cx + panel)]
    else:
        a = a[y0:y1, x0:x1]
    H = a.shape[0]
    out = []
    for fy0, fy1 in bands:
        t = finish(resize_rgba(a[int(fy0 * H):int(fy1 * H)], tiles_w * TILE, TILE))
        out.append(symmetrise_x(t) if (sym and tiles_w == 1) else t)
    return out


# ── row 15 · furniture drawn here ─────────────────────────────────────────────
# The delivered art has no desk and no seat, and the floor needs fifteen of each.
# These are drawn from the palette rather than shipped as art; the props that go
# on top of the desk are composited from the real drawings. See ATLAS.md —
# they are the first thing to replace if there is another round of artwork.
def _rgb(h):
    return np.array([int(h[i:i + 2], 16) for i in (0, 2, 4)], np.uint8)


def _stand(a, canvas, cx, base_y, height):
    """Scale a prop to `height` px and stand it on `base_y`, centred on `cx`."""
    a = trim(a)
    ih, iw = a.shape[:2]
    nh = height
    nw = max(1, round(iw * nh / ih))
    small = resize_rgba(a, nw, nh)
    x0, y0 = cx - nw // 2, base_y - nh
    for y in range(nh):                      # alpha-composite, prop over table
        for x in range(nw):
            if small[y, x, 3] > 110 and 0 <= y0 + y < canvas.shape[0] and 0 <= x0 + x < canvas.shape[1]:
                canvas[y0 + y, x0 + x] = small[y, x]


def _tampo(w):
    """A plain wooden table seen from the three-quarter game angle, w px wide."""
    clr, med, esc, tinta = _rgb('B08050'), _rgb('8B5E34'), _rgb('4A2F18'), _rgb('21201C')
    t = np.zeros((TILE, w, 4), np.float32)

    def band(y0, y1, col, x0=0, x1=None):
        t[y0:y1, x0:(w if x1 is None else x1), :3] = col
        t[y0:y1, x0:(w if x1 is None else x1), 3] = 255

    band(4, 5, tinta)                        # far edge, in shadow
    band(5, 11, clr)                         # the top
    band(11, 12, esc)                        # the lip
    band(12, 14, med)                        # the apron below the top
    t[5:11, 0, :3] = med                     # side edges
    t[5:11, w - 1, :3] = med
    for lx in (1, w - 3):                    # two legs, front corners
        band(14, 16, esc, lx, lx + 2)
    return t


def escrivaninha():
    """Writing desk, 2×1 tiles — the ledger and the inkwell are the real art."""
    t = _tampo(2 * TILE)
    _stand(load('7_4_livro_aberto_pena.png'), t, 11, 10, 7)     # open ledger
    _stand(load('7_6_tinteiro_penas.png'), t, 24, 10, 9)        # inkwell and quills
    return finish(t)


def mesa_refeitorio():
    """Plain table, 2×1 tiles — the refectory and the café tables."""
    return finish(_tampo(2 * TILE))


def banco():
    """Stool, 1×1. Walkable: it is painted on furniture-below and is the seat."""
    clr, med, esc = _rgb('B08050'), _rgb('8B5E34'), _rgb('4A2F18')
    t = np.zeros((TILE, TILE, 4), np.float32)
    t[6:11, 3:13, :3] = clr                  # the seat
    t[6:11, 3:13, 3] = 255
    t[10:11, 3:13, :3] = med                 # front lip
    t[6:7, 4:12, :3] = med                   # far edge
    for lx in (4, 10):                       # two visible legs
        t[11:14, lx:lx + 2, :3] = esc
        t[11:14, lx:lx + 2, 3] = 255
    return finish(t)


def strip_piece(name, fx0, fx1, sym=True):
    """One 16×16 tile taken out of a horizontal strip."""
    a = load(name)
    x0, y0, x1, y1 = bbox(a)
    w = x1 - x0
    t = finish(resize_rgba(a[y0:y1, x0 + int(fx0 * w):x0 + int(fx1 * w)], TILE, TILE))
    return symmetrise_x(t) if sym else t


# ── assembly ──────────────────────────────────────────────────────────────────
GPT = 'ChatGPT Image Aug 27, 2026 at '

ARMAZEM = [                              # file, col, row, tiles wide, tiles tall
    (GPT + '06_12_18 PM.png',       0,  9, 1, 1),   # barrel, upright
    (GPT + '06_12_26 PM (1).png',   1,  9, 2, 2),   # stack of barrels
    (GPT + '06_12_27 PM (2).png',   3,  9, 1, 1),   # barrel on its side
    (GPT + '06_12_28 PM (3).png',   4,  9, 1, 1),   # pepper sack
    (GPT + '06_12_28 PM (4).png',   5,  9, 2, 2),   # stack of sacks
    (GPT + '06_12_28 PM (5).png',   7,  9, 1, 1),   # crate
    (GPT + '06_12_29 PM (6).png',   8,  9, 2, 2),   # stack of crates
    (GPT + '06_12_30 PM (7).png',  10,  9, 1, 1),   # coil of rope
    (GPT + '06_12_30 PM (8).png',  11,  9, 2, 2),   # anchor
    (GPT + '06_12_31 PM (9).png',  13,  9, 2, 2),   # bale of sailcloth
    (GPT + '06_12_31 PM (10).png',  0, 11, 1, 1),   # wicker basket
    (GPT + '06_15_26 PM.png',       1, 11, 1, 1),   # amphora
]

CONTAS = [
    ('7_1_balanca.png',                      0, 12, 2, 2),
    ('7_2_esfera_armilar.png',               2, 12, 2, 2),
    ('7_3_carta_nautica_mesa.png',           4, 12, 3, 2),   # the Padrão Real
    ('7_4_livro_aberto_pena.png',            7, 12, 1, 1),
    ('7_5_pilha_livros.png',                 8, 12, 1, 1),
    ('7_6_tinteiro_penas.png',               9, 12, 1, 1),
    ('7_7_ampulheta.png',                   10, 12, 1, 1),
    ('7_8_castical.png',                    11, 12, 1, 1),
    ('7_9_arca_forte.png',                  12, 12, 1, 1),
    ('7_10_astrolabio.png',                 13, 12, 2, 2),
    ('7_11_cartas_portulano_enroladas.png',  0, 14, 2, 1),
]


def main():
    atlas = np.zeros((ROWS * TILE, COLS * TILE, 4), np.uint8)

    def put(tile, cx, cy):
        h, w = tile.shape[:2]
        atlas[cy * TILE:cy * TILE + h, cx * TILE:cx * TILE + w] = tile

    # block A · floors (rows 0-1; the rich azulejo spans rows 0-3)
    put(floor_azulejo_principal(), 0, 0)
    put(floor_lioz(), 2, 0)
    put(floor_madeira(), 4, 0)
    put(floor_azulejo_variante(), 8, 0)

    # block B · walls (rows 2-4): cornice / plaster face / azulejo dado + skirting
    for i, t in enumerate(wall_column('3 - parede simples.png',
                                      [(0.00, 0.155), (0.32, 0.52), (0.645, 1.00)])):
        put(t, 0, 2 + i)
    for i, t in enumerate(wall_column('3 - pilar de pedra.png',
                                      [(0.00, 0.17), (0.34, 0.54), (0.66, 1.00)])):
        put(t, 1, 2 + i)
    for i, t in enumerate(wall_column('3 - Canto superior Esq.png',
                                      [(0.00, 0.20), (0.34, 0.54), (0.62, 1.00)], tiles_w=2)):
        put(t, 2, 2 + i)
    for i, t in enumerate(wall_column('3 - Canto superior dir.png',
                                      [(0.00, 0.20), (0.34, 0.54), (0.62, 1.00)], tiles_w=2)):
        put(t, 4, 2 + i)
    put(strip_piece('3 - topo parede.png', 0.10, 0.38), 6, 2)      # loose cornice
    put(strip_piece('3 - faixa de azulejo.png', 0.02, 0.35), 6, 4)  # loose azulejo band

    # block C · arch and window (rows 5-8)
    put(fit_prop(load('4 - Arco Manuelino.png'), 3, 4, pad=0), 0, 5)
    put(fit_prop(load('5 - Janela com Nau.png'), 3, 4, pad=0), 3, 5)

    # blocks D and E · props (rows 9-11 and 12-14)
    for name, cx, cy, tw, th in ARMAZEM + CONTAS:
        put(fit_prop(load(name), tw, th), cx, cy)

    # row 15 · furniture the map needs and the artwork did not supply
    put(escrivaninha(), 0, 15)
    put(banco(), 2, 15)
    put(mesa_refeitorio(), 3, 15)

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    Image.fromarray(atlas, 'RGBA').save(OUT)
    used = len(np.unique(atlas.reshape(-1, 4)[atlas.reshape(-1, 4)[:, 3] > 0][:, :3], axis=0))
    print(f'wrote {OUT}  256x256  {used} colours')


if __name__ == '__main__':
    main()
