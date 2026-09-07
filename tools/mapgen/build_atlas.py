#!/usr/bin/env python3
"""Monta src/renderer/src/assets/tilesets/casadaindia.png a partir das peças.

    python3 tools/mapgen/build_atlas.py            # só o que houver em art/pecas/
    python3 tools/mapgen/build_atlas.py --folha    # e mais os recortes arquivados

Uma peça é um PNG de fundo transparente largado em `tools/mapgen/art/pecas/`
com o nome que o `pecas.py` lhe dá. Tamanho à vontade — isto escala para a área
declarada. Não é preciso editar código para entregar arte.

O que sai é o atlas que o mapa desenha: 16 colunas de células de 32 px, 512×512.
Peças sem ficheiro ficam com a célula vazia; não é erro, é o ponto. O cenário
cresce à medida que a arte chega.

**Porquê 32 px e não os 16 que este projecto usava:** a arte é pintada, não
pixelada. A 16 px uma tijoleira perde as juntas, o azulejo vira ruído e um
barril perde as aduelas — a arte nova chegaria com exactamente o detalhe da que
veio substituir. 32 é a célula mais pequena onde tudo ainda se lê. O mapa, a
câmara e a escala das personagens foram atrás.

**O que isto NÃO faz:** quantizar a paleta. O atlas de 16 px encostava cada
píxel a 27 cores da marca para segurar um aspecto pixelado à mão. Esta arte é
pintada e a cor *é* o detalhe.

**O que isto faz à arte,** as duas coisas medidas, cada uma explicada onde
acontece: os chãos são recortados por dentro do bordo pintado (`INSET_CHAO` no
`pecas.py`, senão cada junta da sala duplica numa gaiola de 32 px visível), e os
adereços levam uma sombra de contacto derivada da própria silhueta
(`sombra_de_contacto`, senão leem-se como autocolantes pousados no chão).

Precisa de pillow + numpy.
"""
import os
import re
import sys

import numpy as np
from PIL import Image, ImageFilter

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from pecas import COLS, INSET_CHAO, PECAS, ROWS, TILE      # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
ASSETS = os.path.join(ROOT, 'src', 'renderer', 'src', 'assets')
DIR_PECAS = os.path.join(HERE, 'art', 'pecas')
FOLHA = os.path.join(HERE, 'art', 'casadaindia-sheet.png')
OUT = os.path.join(ASSETS, 'tilesets', 'casadaindia.png')

USAR_FOLHA = '--folha' in sys.argv


# ── tratamento de imagem ──────────────────────────────────────────────────────
def redimensiona(im, w, h):
    """Reduz sobre alpha pré-multiplicado, para o bordo de um adereço não sangrar
    o preto que está por baixo dos seus píxeis transparentes. Desmultiplica à
    saída. BOX quando encolhemos 2× ou mais (faz a média de todos os píxeis de
    origem, que é o que uma redução de 4× quer), LANCZOS nos outros casos."""
    arr = np.asarray(im, dtype=np.float32)
    al = arr[..., 3:4] / 255.0
    pre = np.concatenate([arr[..., :3] * al, arr[..., 3:4]], axis=-1)
    peq = Image.fromarray(pre.clip(0, 255).astype('uint8'), 'RGBA').resize(
        (w, h), Image.BOX if im.width >= w * 2 else Image.LANCZOS)
    out = np.asarray(peq, dtype=np.float32)
    rgb = (out[..., :3] / np.maximum(out[..., 3:4], 1e-6) * 255.0).clip(0, 255)
    return Image.fromarray(np.dstack([rgb, out[..., 3]]).astype('uint8'), 'RGBA')


def endurece(im, corte=110):
    """Encosta o alpha a ligado/desligado. Um adereço de bordo suave cintila
    contra o chão assim que a câmara se mexe; um bordo duro não."""
    a = np.asarray(im).copy()
    a[..., 3] = (a[..., 3] >= corte) * 255
    a[a[..., 3] == 0] = 0
    return Image.fromarray(a, 'RGBA')


def opaca(im):
    """Chãos e paredes são fundo: força alpha cheio, para um píxel suave num
    bordo de tile não deixar ver a cor de limpeza através da junta."""
    a = np.asarray(im).copy()
    a[..., 3] = 255
    return Image.fromarray(a, 'RGBA')


def apara(im):
    caixa = im.getbbox()
    return im.crop(caixa) if caixa else im


def tira_ardosia(im, ate_linha):
    """Apaga um painel de fundo neutro pintado por trás de uma peça.

    A balança da folha arquivada foi desenhada contra uma ardósia escura que faz
    parte do quadro e não do objecto. É a única coisa NEUTRA do recorte — mede
    R≈G≈B à volta de (48,48,50), enquanto todos os outros píxeis escuros da peça
    são castanho quente ou dourado saturado. Um teste de saturação tira-a
    exactamente, sem tolerância nenhuma para afinar, e limitá-lo às linhas acima
    do tampo mantém-no longe da madeira."""
    a = np.asarray(im).astype(np.int16).copy()
    rgb = a[:ate_linha, :, :3]
    neutro = (rgb.max(-1) - rgb.min(-1) < 14) & (rgb.mean(-1) < 100)
    a[:ate_linha][neutro] = 0
    return Image.fromarray(a.astype(np.uint8), 'RGBA')


def harmoniza_chaos(chaos, forca=0.75):
    """Encosta as variantes de um chão ao tom da primeira.

    A terceira coisa que se faz à arte, e pela mesma razão que as outras duas:
    mediu-se e era o defeito mais barulhento da sala. As variantes vêm cada uma
    da sua chamada à PixelLab, e o gerador trata "terracota mais escura" como
    outro terreno e não como outra tijoleira do mesmo chão. Medido nas peças
    entregues: a terracota espalha-se por **45 níveis de luma** entre variantes
    e o lioz por **78** — contra os 48 do problema da gaiola, que já se tinha
    achado inaceitável. O olho não vê variedade, vê manta de retalhos.

    Cada variante é puxada `forca` do caminho até à média da `-1` da sua
    família. Não vai a 100% de propósito: a diferença entre a tijoleira gasta e
    a tijoleira queimada é o que se foi lá buscar, e apagá-la toda deixava oito
    cópias do mesmo tile.

    O deslocamento é feito em torno da média de cada tile, com a amplitude
    encolhida só o suficiente para nada bater no 0 nem no 255. Somar a direito
    era mais simples, mas empurrava os píxeis claros do lioz contra o tecto e
    o tile perdia as juntas — que é exactamente a textura que aqui se quer
    guardar.
    """
    familias = {}
    for nome in chaos:
        familias.setdefault(re.sub(r'-\d+$', '', nome), []).append(nome)

    for nomes in familias.values():
        nomes.sort()
        ancora = np.asarray(chaos[nomes[0]], np.float32)[..., :3].reshape(-1, 3).mean(0)
        for nome in nomes[1:]:
            a = np.asarray(chaos[nome]).astype(np.float32)
            rgb = a[..., :3]
            media = rgb.reshape(-1, 3).mean(0)
            alvo = media + (ancora - media) * forca

            alto = rgb.reshape(-1, 3).max(0)
            baixo = rgb.reshape(-1, 3).min(0)
            escala = np.ones(3)
            for c in range(3):
                if alto[c] > media[c]:
                    escala[c] = min(escala[c], (255 - alvo[c]) / (alto[c] - media[c]))
                if media[c] > baixo[c]:
                    escala[c] = min(escala[c], alvo[c] / (media[c] - baixo[c]))
            escala = np.clip(escala, 0, 1)

            a[..., :3] = (rgb - media) * escala + alvo
            chaos[nome] = Image.fromarray(a.clip(0, 255).astype('uint8'), 'RGBA')
    return chaos


def sombra_de_contacto(adereco, linhas_pe=5):
    """Um poço de sombra debaixo do adereço, pintado nas células dele.

    Sem ela, cada barril e cada arca lê-se como um autocolante pousado no chão
    em vez de um objecto de pé — a razão mais barulhenta para a sala parecer
    chapada. Sai da própria silhueta: pegar nas últimas linhas do alpha,
    esmagá-las numa elipse, desfocar, e pôr isso ATRÁS do adereço. Não há nada
    para desenhar, e segue a forma do que quer que esteja por cima."""
    a = np.asarray(adereco)
    al = a[..., 3] > 0
    ys = np.flatnonzero(al.any(1))
    if not len(ys):
        return adereco
    fundo = ys[-1]
    faixa = al[max(0, fundo - linhas_pe):fundo + 1]
    if not faixa.any():
        return adereco
    xs = np.flatnonzero(faixa.any(0))
    cx, meio = (xs[0] + xs[-1]) / 2, max(2.0, (xs[-1] - xs[0]) / 2 * 1.15)
    ry = max(2.0, meio * 0.34)
    cy = fundo - ry * 0.35

    yy, xx = np.mgrid[0:a.shape[0], 0:a.shape[1]]
    d = ((xx - cx) / meio) ** 2 + ((yy - cy) / ry) ** 2
    mascara = np.clip(1.0 - d, 0, 1) ** 0.7
    sh = np.zeros_like(a)
    sh[..., 3] = (mascara * 118).astype(np.uint8)
    sombra = Image.fromarray(sh, 'RGBA').filter(ImageFilter.GaussianBlur(1.1))
    out = Image.new('RGBA', adereco.size, (0, 0, 0, 0))
    out.alpha_composite(sombra)
    out.alpha_composite(adereco)
    return out


# ── montagem ──────────────────────────────────────────────────────────────────
atlas = Image.new('RGBA', (COLS * TILE, ROWS * TILE), (0, 0, 0, 0))
folha = Image.open(FOLHA).convert('RGBA') if USAR_FOLHA and os.path.exists(FOLHA) else None
presentes: set[str] = set()


def cola(peca, im):
    atlas.alpha_composite(im, (peca.col * TILE, peca.row * TILE))


def origem(nome, peca):
    """A arte desta peça, ou None. Um ficheiro próprio ganha sempre à folha."""
    caminho = os.path.join(DIR_PECAS, nome + '.png')
    if os.path.exists(caminho):
        return Image.open(caminho).convert('RGBA'), 'ficheiro'
    if folha is not None and peca.folha:
        x, y, w, h = peca.folha
        im = folha.crop((x, y, x + w, y + h))
        if peca.matte:
            im = tira_ardosia(im, peca.matte)
        return im, 'folha'
    return None, None


def monta(nome, peca):
    im, fonte = origem(nome, peca)
    if im is None:
        return None

    if peca.especie == 'chao':
        # Recorta por dentro do bordo pintado antes de reduzir — ver INSET_CHAO.
        n = INSET_CHAO if fonte == 'folha' else max(1, round(INSET_CHAO * im.width / 120))
        if im.width > 2 * n and im.height > 2 * n:
            im = im.crop((n, n, im.width - n, im.height - n))
        return opaca(redimensiona(im, TILE, TILE)), fonte

    if peca.especie == 'parede':
        return opaca(redimensiona(im, peca.tw * TILE, peca.th * TILE)), fonte

    # 'vao' e 'adereco': escala para caber, ancorada em baixo ao centro para
    # assentar no chão em vez de flutuar dentro da sua caixa.
    im = apara(im)
    W, H = peca.tw * TILE, peca.th * TILE
    s = min(W / im.width, H / im.height)
    nw, nh = max(1, round(im.width * s)), max(1, round(im.height * s))
    peq = endurece(redimensiona(im, nw, nh))
    tela = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    tela.alpha_composite(peq, ((W - nw) // 2, H - nh))
    if peca.especie == 'adereco':
        tela = sombra_de_contacto(tela)
    return tela, fonte


def deriva(nome, peca):
    """Peças que se fazem por código quando não há ficheiro."""
    tipo, arg = peca.derivar.split(':', 1)

    if tipo == 'liso':
        r, g, b = (int(v) for v in arg.split(','))
        return Image.new('RGBA', (TILE, TILE), (r, g, b, 255))

    if tipo == 'vertical':
        base = PECAS.get(arg)
        if base is None or arg not in presentes:
            return None
        x, y = base.col * TILE, base.row * TILE
        im = atlas.crop((x, y, x + TILE, y + TILE))
        a = np.asarray(im).astype(np.float32).copy()
        borda = np.minimum(np.arange(TILE), TILE - 1 - np.arange(TILE)) / 9.0
        a[..., :3] *= np.clip(0.22 + 0.78 * borda, 0, 1)[None, :, None]
        a[..., 3] = 255
        return Image.fromarray(a.clip(0, 255).astype('uint8'), 'RGBA')

    return None


# Primeiro o que tem arte, depois o que se deriva do que já está colado.
# Os chãos ficam de lado até ao fim da passagem: harmonizar o tom de uma
# variante precisa de ver as irmãs todas, e nessa altura ainda não vimos.
chaos_por_colar = {}
for nome, peca in PECAS.items():
    if peca.derivar:
        continue
    feito = monta(nome, peca)
    if feito:
        if peca.especie == 'chao':
            chaos_por_colar[nome] = feito[0]
        else:
            cola(peca, feito[0])
        presentes.add(nome)

for nome, im in harmoniza_chaos(chaos_por_colar).items():
    cola(PECAS[nome], im)

for nome, peca in PECAS.items():
    if not peca.derivar:
        continue
    feito = monta(nome, peca)                     # um ficheiro próprio manda
    im = feito[0] if feito else deriva(nome, peca)
    if im is not None:
        cola(peca, im)
        presentes.add(nome)

os.makedirs(os.path.dirname(OUT), exist_ok=True)
atlas.save(OUT)

# ── relatório ─────────────────────────────────────────────────────────────────
faltam = [n for n in PECAS if n not in presentes]
print(f'escrito {OUT}  {atlas.width}×{atlas.height}, células de {TILE}px')
print(f'peças: {len(presentes)}/{len(PECAS)} presentes'
      + ('  (com --folha)' if USAR_FOLHA else ''))
if faltam:
    print(f'faltam {len(faltam)}: ' + ', '.join(faltam))
    print(f'  larga PNGs com esses nomes em {os.path.relpath(DIR_PECAS, ROOT)}/')
