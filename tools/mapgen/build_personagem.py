#!/usr/bin/env python3
"""Monta a folha de sprites de uma personagem a partir dos PNGs soltos.

    python3 tools/mapgen/build_personagem.py fidalgo

Lê `tools/mapgen/art/personagens/<nome>/sprite-<linha>-<coluna>.png` — a grelha
tal como o desenhador a entrega — e escreve dois ficheiros:

    src/renderer/src/assets/sprites/<nome>.png     a folha, células fixas
    src/renderer/src/assets/sprites/<nome>.json    que frames são que animação

A grelha de origem que este ficheiro sabe ler (24 PNGs, 3×8):

    linha 1   1-4  marcha de frente        5-8  marcha de costas
    linha 2   1-8  marcha de perfil (para a direita — a esquerda é o espelho)
    linha 3   1-2  parado de frente        3-4  parado de costas
              5-8  parado de perfil

O trabalho a sério está no alinhamento
──────────────────────────────────────
Os PNGs vêm **aparados**, cada um com a sua moldura: 180×272, 172×277, 171×274…
O alinhamento que o desenhador tinha na tela dele perdeu-se na exportação, e
sem o reconstruir a personagem salta e encolhe de frame para frame.

Duas coisas o reconstroem:

* **Uma escala só para todos os frames.** Os frames parados medem ~301 px de
  alto e os de marcha ~275: ele anda ligeiramente agachado, e isso é a animação,
  não ruído. Normalizar cada frame para a mesma altura achatava exactamente a
  diferença que dá vida à coisa. Há uma escala global, tirada do frame mais
  alto, e as alturas relativas ficam como o desenhador as fez.

* **Alinhamento horizontal por correlação, não pelo centro da caixa.** O centro
  da caixa passeia com a capa, que balança e é assimétrica de perfil; ancorar
  pelos pés punha o corpo a oscilar em vez das pernas. Em vez disso, cada frame
  é deslocado para o x que minimiza a diferença de silhueta contra o primeiro
  frame do seu grupo. As pernas mudam de propósito e pesam pouco; o tronco, a
  cabeça e o chapéu é que mandam, e são esses que têm de ficar quietos.

Na vertical é pelo fundo da caixa: o pé mais baixo assenta sempre no chão, o que
preserva o balanço do corpo se o desenhador o desenhou.

Precisa de pillow + numpy (o `npm run arte` prepara-os).
"""
import json
import os
import sys

import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
ASSETS = os.path.join(ROOT, 'src', 'renderer', 'src', 'assets')

NOME = sys.argv[1] if len(sys.argv) > 1 else 'fidalgo'
SRC = os.path.join(HERE, 'art', 'personagens', NOME)
OUT_PNG = os.path.join(ASSETS, 'sprites', f'{NOME}.png')
OUT_JSON = os.path.join(ASSETS, 'sprites', f'{NOME}.json')

# A célula. Alta que chegue para a pluma do chapéu e larga que chegue para a
# capa aberta de perfil. A personagem sai com ~72 px de alto, que são pouco mais
# de dois tiles de 32 — a mesma fracção do chão que as figuras antigas ocupavam.
CEL_W, CEL_H = 56, 80
ALTURA_ALVO = 72
COLS = 8

# Que PNGs formam cada animação, na ordem em que se tocam.
ANIMACOES = {
    'walk-down':  [(1, 1), (1, 2), (1, 3), (1, 4)],
    'walk-up':    [(1, 5), (1, 6), (1, 7), (1, 8)],
    'walk-right': [(2, c) for c in range(1, 9)],
    'idle-down':  [(3, 1), (3, 2)],
    'idle-up':    [(3, 3), (3, 4)],
    'idle-right': [(3, 5), (3, 6), (3, 7), (3, 8)],
}


def carrega(linha, coluna):
    caminho = os.path.join(SRC, f'sprite-{linha}-{coluna}.png')
    if not os.path.exists(caminho):
        raise SystemExit(f'falta {caminho}')
    return Image.open(caminho).convert('RGBA')


def caixa(im):
    a = np.asarray(im)
    ys, xs = np.nonzero(a[..., 3] > 32)
    return int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1


def reduz(im, w, h):
    """Reduz sobre alpha pré-multiplicado, senão o bordo sangra o preto que
    está por baixo dos píxeis transparentes."""
    a = np.asarray(im, dtype=np.float32)
    al = a[..., 3:4] / 255.0
    pre = np.concatenate([a[..., :3] * al, a[..., 3:4]], axis=-1)
    peq = Image.fromarray(pre.clip(0, 255).astype('uint8'), 'RGBA').resize(
        (w, h), Image.LANCZOS)
    o = np.asarray(peq, dtype=np.float32)
    rgb = (o[..., :3] / np.maximum(o[..., 3:4], 1e-6) * 255.0).clip(0, 255)
    return Image.fromarray(np.dstack([rgb, o[..., 3]]).astype('uint8'), 'RGBA')


# ── carregar e aparar ─────────────────────────────────────────────────────────
aparados = {}
for anim, chaves in ANIMACOES.items():
    for k in chaves:
        im = carrega(*k)
        aparados[k] = im.crop(caixa(im))

# Uma escala só, do frame mais alto — ver o cabeçalho.
alto = max(im.height for im in aparados.values())
escala = ALTURA_ALVO / alto

reduzidos = {}
for k, im in aparados.items():
    w = max(1, round(im.width * escala))
    h = max(1, round(im.height * escala))
    reduzidos[k] = reduz(im, w, h)


def silhueta_na_celula(im, dx):
    """A máscara de alpha do frame colada na célula, deslocada dx na horizontal
    e assente no fundo."""
    m = np.zeros((CEL_H, CEL_W), np.float32)
    a = np.asarray(im)[..., 3] > 40
    x0 = (CEL_W - im.width) // 2 + dx
    y0 = CEL_H - im.height
    for y in range(im.height):
        for x in range(im.width):
            xx, yy = x0 + x, y0 + y
            if 0 <= xx < CEL_W and 0 <= yy < CEL_H and a[y, x]:
                m[yy, xx] = 1.0
    return m


def alinha(grupo):
    """Desloca cada frame do grupo para o x que melhor casa com o primeiro."""
    ref = silhueta_na_celula(reduzidos[grupo[0]], 0)
    deslocamentos = [0]
    for k in grupo[1:]:
        melhor, melhor_d = None, 0
        for d in range(-10, 11):
            custo = float(np.abs(ref - silhueta_na_celula(reduzidos[k], d)).sum())
            if melhor is None or custo < melhor:
                melhor, melhor_d = custo, d
        deslocamentos.append(melhor_d)
    return deslocamentos


# ── montar a folha ────────────────────────────────────────────────────────────
total = sum(len(v) for v in ANIMACOES.values())
linhas = (total + COLS - 1) // COLS
folha = Image.new('RGBA', (COLS * CEL_W, linhas * CEL_H), (0, 0, 0, 0))

indice = 0
mapa = {}
for anim, chaves in ANIMACOES.items():
    deslocamentos = alinha(chaves)
    idxs = []
    for k, dx in zip(chaves, deslocamentos):
        im = reduzidos[k]
        cx, cy = indice % COLS, indice // COLS
        folha.alpha_composite(im, (
            cx * CEL_W + (CEL_W - im.width) // 2 + dx,
            cy * CEL_H + CEL_H - im.height,
        ))
        idxs.append(indice)
        indice += 1
    mapa[anim] = idxs

os.makedirs(os.path.dirname(OUT_PNG), exist_ok=True)
folha.save(OUT_PNG)
json.dump({
    'nome': NOME,
    'cell': [CEL_W, CEL_H],
    'cols': COLS,
    'frames': total,
    'anims': mapa,
}, open(OUT_JSON, 'w'), indent=1)

print(f'escrito {OUT_PNG}  {folha.width}×{folha.height}, '
      f'{total} frames de {CEL_W}×{CEL_H}')
print(f'escala {escala:.3f} (origem até {alto}px de alto → {ALTURA_ALVO}px)')
for anim, idxs in mapa.items():
    print(f'  {anim:12s} {len(idxs)} frames  {idxs}')
print(f'escrito {OUT_JSON}')
