#!/usr/bin/env python3
"""Tira da animação um adereço que o modelo não conseguiu segurar.

    python3 tools/mapgen/limpa_adereco.py <zip-da-personagem> <pasta-de-saída>

Porque é que isto existe
────────────────────────
A PixelLab anima gerando cada frame de novo, e um objecto pequeno na mão não
sobrevive a isso: salta de posição, muda de forma, ou desaparece num frame e
volta no seguinte. Confirmado com eles — o modo `template` usa um esqueleto
genérico que **não sabe que o objecto existe**, e nem o `v3` nem o `pro`
garantem píxeis idênticos entre frames, porque ambos são generativos.

Quando o adereço fica impossível de estabilizar, a saída honesta é tirá-lo da
animação e deixá-lo só na pose parada. Isto faz isso nos píxeis, de forma
determinística e a custo zero, em vez de gastar gerações a torcer para que
saia melhor à décima tentativa.

Como distingue o adereço do resto
─────────────────────────────────
Por cor, tamanho e posição: uma mancha **clara**, **grande** e **abaixo do
colarinho**. A coifa e o colarinho são igualmente claros mas estão em cima; os
punhos são claros mas pequenos. Os tons quentes ficam protegidos, o que salva
a mão e o latão do tinteiro.

E há dois casos que **têm** de ser tratados de forma diferente — foi o que
falhou nas duas primeiras tentativas:

* **sobre o corpo** — preenche-se com a cor dos vizinhos, que no manto é quase
  plana e não deixa emenda visível;
* **fora da silhueta** — apaga-se para transparente. Preencher aqui deixava
  uma forma escura recortada contra o fundo, com o aspecto de uma lâmina.

O corpo é calculado com um fecho morfológico do que sobra depois de retirar o
adereço, para os buracos pequenos contarem como corpo e não como céu aberto.
"""
import io
import os
import sys
import zipfile
from collections import deque

import numpy as np
from PIL import Image


def dilata(m, r=1):
    o = m.copy()
    for _ in range(r):
        p = o.copy()
        p[1:] |= o[:-1]; p[:-1] |= o[1:]
        p[:, 1:] |= o[:, :-1]; p[:, :-1] |= o[:, 1:]
        o = p
    return o


def erode(m, r=1):
    return ~dilata(~m, r)


def componentes(m):
    """Manchas ligadas, em 8-vizinhança. O sprite é 128×128, não vale a pena
    trazer o scipy só por isto."""
    lab = -np.ones(m.shape, int)
    n = 0
    for sy, sx in np.argwhere(m):
        if lab[sy, sx] >= 0:
            continue
        fila = deque([(sy, sx)])
        lab[sy, sx] = n
        while fila:
            y, x = fila.popleft()
            for dy in (-1, 0, 1):
                for dx in (-1, 0, 1):
                    b, c = y + dy, x + dx
                    if (0 <= b < m.shape[0] and 0 <= c < m.shape[1]
                            and m[b, c] and lab[b, c] < 0):
                        lab[b, c] = n
                        fila.append((b, c))
        n += 1
    return lab, n


def limpa(a, altura_minima=0.34, area_minima=14):
    """Devolve (frame limpo, nº de píxeis retirados)."""
    opaco = a[..., 3] > 128
    ys, _ = np.nonzero(opaco)
    if len(ys) == 0:
        return a, 0
    y0 = ys.min()
    alt = max(int(ys.max() - y0), 1)

    mx = a[..., :3].max(-1)
    mn = a[..., :3].min(-1)
    nucleo = opaco & (mn > 150) & ((mx - mn) < 45)

    lab, n = componentes(nucleo)
    alvo = np.zeros(opaco.shape, bool)
    for i in range(n):
        sel = lab == i
        if sel.sum() < area_minima:
            continue
        if (np.argwhere(sel)[:, 0].mean() - y0) / alt <= altura_minima:
            continue          # coifa e colarinho — ficam
        alvo |= sel
    if not alvo.any():
        return a, 0

    # O contorno escuro do adereço não é claro, mas é dele: cresce-se a máscara
    # dois píxeis. Os tons quentes ficam de fora — são a mão e o latão.
    quente = (a[..., 0] - a[..., 2]) > 28
    alvo = dilata(alvo, 2) & opaco & ~quente

    corpo = erode(dilata(opaco & ~alvo, 3), 3)
    dentro, fora = alvo & corpo, alvo & ~corpo

    out = a.copy()
    out[fora] = [0, 0, 0, 0]

    pendentes = set(map(tuple, np.argwhere(dentro)))
    while pendentes:
        avanco = []
        for y, x in pendentes:
            viz = [(y + dy, x + dx)
                   for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1),
                                  (2, 0), (-2, 0), (0, 2), (0, -2))
                   if 0 <= y + dy < a.shape[0] and 0 <= x + dx < a.shape[1]
                   and (y + dy, x + dx) not in pendentes
                   and out[y + dy, x + dx, 3] > 128 and not fora[y + dy, x + dx]]
            if viz:
                avanco.append(((y, x), np.median([out[b, c] for b, c in viz], 0)))
        if not avanco:
            break                      # cercado por pendentes: desiste
        for (y, x), v in avanco:
            out[y, x] = v
            pendentes.discard((y, x))
    return out, int(alvo.sum())


def main():
    """
        limpa_adereco.py <zip> <destino> [filtro ...]

    Sem filtro não faz nada, e é de propósito: o adereço só estorva onde há
    movimento. Nas rotações e na pose parada ele está bem — é lá que identifica
    a figura — e limpá-lo por engano seria tirar-lhe justamente o que o
    distingue. Passa-se o troço do caminho a tratar, por exemplo `walk`.
    """
    if len(sys.argv) < 3:
        raise SystemExit(main.__doc__)
    origem, destino = sys.argv[1], sys.argv[2]
    filtros = sys.argv[3:]
    if not filtros:
        raise SystemExit('falta o filtro — ex.: walk. Ver --help no cabeçalho.')

    z = zipfile.ZipFile(origem)
    total = tratados = copiados = 0
    for nome in sorted(z.namelist()):
        if not nome.endswith('.png'):
            continue
        bruto = z.read(nome)
        caminho = os.path.join(destino, nome)
        os.makedirs(os.path.dirname(caminho), exist_ok=True)

        if not any(f.lower() in nome.lower() for f in filtros):
            open(caminho, 'wb').write(bruto)      # intocado
            copiados += 1
            continue

        a = np.asarray(Image.open(io.BytesIO(bruto)).convert('RGBA')).astype(int)
        out, k = limpa(a)
        total += k
        tratados += 1
        Image.fromarray(out.clip(0, 255).astype('uint8'), 'RGBA').save(caminho)
        print(f'{nome}  −{k} px' if k else f'{nome}  (nada a tirar)')

    print(f'\n{tratados} frames tratados, {copiados} copiados intactos')
    print(f'{total} píxeis de adereço retirados → {destino}')


if __name__ == '__main__':
    main()
