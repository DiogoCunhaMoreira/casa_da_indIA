#!/usr/bin/env python3
"""Traz da PixelLab as peças do cenário para `art/pecas/`, prontas a montar.

    PIXELLAB_TOKEN=... python3 tools/mapgen/import_pecas.py
    PIXELLAB_TOKEN=... python3 tools/mapgen/import_pecas.py barril esteira
    PIXELLAB_TOKEN=... python3 tools/mapgen/import_pecas.py --refaz barril

Sem argumentos, traz tudo o que o `FONTES.json` declarar e ainda não estiver em
`art/pecas/`. Com nomes, traz só esses. O `--refaz` descarrega de novo mesmo
que a peça já exista.

O irmão `import_pixellab.py` faz o mesmo para personagens; este é para o chão.
São ficheiros separados porque não partilham nada: uma personagem é uma folha
de células com animações por direcção, uma peça de cenário é um PNG solto.

    De onde vem uma peça
    ────────────────────
A PixelLab tem três geradores que servem a esta app, e cada um devolve as
coisas à sua maneira. O `FONTES.json` diz, por peça, qual deles e qual pedaço:

    "chao-terracota-1": {"tileset": "<id>", "tile": "wang_0"}
        Um `create_topdown_tileset`. Vem uma folha de 16 tiles Wang mais um
        metadata com o `bounding_box` de cada um. Recortamos por aí — e NÃO
        pela posição implícita na grelha, que é onde toda a gente se engana: o
        `original_position` do metadata é a grelha de geração e a sua linha
        pode passar da folha. É isso que produz o bandeamento horizontal.

    "esteira": {"tiles_pro": "<id>", "indice": 14}
        Um `create_tiles_pro`. Vem um zip com um PNG por tile, numerado pela
        ordem em que foram pedidos no prompt — o `indice` é 0-based, portanto
        o "15)." do prompt é o índice 14.

    "barril": {"objecto": "<id>"}
        Um `create_map_object`. Vem o PNG directo, já com fundo transparente.

    O chão que ninguém pediu
    ────────────────────────
O `create_map_object` inventa terreno por baixo do objecto quando a tela é
grande: a 32 px não acontece, a 64 vem um tapete de relva agarrado à base do
barril. Pedir `no ground, no grass` no prompt baixou-o de 158 para 38 píxeis,
mas não o levou a zero — e as peças altas (`porta` 64x96, `mesa-comercio`
128x64) têm de ser geradas grandes, por isso não há como fugir ao problema.

`limpa_chao` resolve-o nos píxeis, de graça e sempre igual, em vez de se
gastarem gerações a torcer para que a décima tentativa saia limpa. É o mesmo
raciocínio do `limpa_adereco.py`, que já faz isto aos objectos das mãos das
personagens.

    O que isto NÃO faz
    ──────────────────
Não escala, não recorta chãos por dentro do bordo, não põe sombras. Tudo isso
é do `build_atlas.py`, e duplicá-lo aqui era aplicá-lo duas vezes. Isto entrega
o PNG como a PixelLab o desenhou; o `npm run arte` é que decide o resto.

Precisa de pillow + numpy (o `npm run arte` prepara-os em tools/mapgen/.venv).
"""
import argparse
import io
import json
import os
import sys
import urllib.request
import zipfile

import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
DIR_PECAS = os.path.join(HERE, 'art', 'pecas')
FONTES = os.path.join(DIR_PECAS, 'FONTES.json')
CACHE = os.path.join(HERE, 'art', '.cache')

API = 'https://api.pixellab.ai/mcp'

sys.path.insert(0, HERE)
from pecas import PECAS                                        # noqa: E402


# ── rede ──────────────────────────────────────────────────────────────────────
def descarrega(url, token, cache_como=None):
    """Um GET autenticado, com cache em disco.

    A cache não é optimização: é para se poder correr isto vinte vezes enquanto
    se afina o `FONTES.json` sem martelar a API por bytes que já cá estão.
    """
    if cache_como:
        caminho = os.path.join(CACHE, cache_como)
        if os.path.exists(caminho):
            with open(caminho, 'rb') as f:
                return f.read()
    pedido = urllib.request.Request(url, headers={'Authorization': f'Bearer {token}'})
    with urllib.request.urlopen(pedido) as r:
        if r.status != 200:
            raise SystemExit(f'a PixelLab respondeu {r.status} a {url}')
        dados = r.read()
    if cache_como:
        os.makedirs(CACHE, exist_ok=True)
        with open(os.path.join(CACHE, cache_como), 'wb') as f:
            f.write(dados)
    return dados


# ── os três geradores ─────────────────────────────────────────────────────────
def do_tileset(fonte, token):
    """Um tile de uma folha Wang, recortado pelo bounding_box do metadata."""
    tid = fonte['tileset']
    folha = Image.open(io.BytesIO(descarrega(
        f'{API}/tilesets/{tid}/image?inline=true', token, f'tileset-{tid}.png'))).convert('RGBA')
    meta = json.loads(descarrega(f'{API}/tilesets/{tid}/metadata', token, f'tileset-{tid}.json'))
    caixas = {t['name']: t['bounding_box'] for t in meta['tileset_data']['tiles']}
    nome = fonte['tile']
    if nome not in caixas:
        raise SystemExit(f'  o tileset {tid} não tem {nome}; tem {sorted(caixas)}')
    b = caixas[nome]
    return folha.crop((b['x'], b['y'], b['x'] + b['width'], b['y'] + b['height']))


def do_tiles_pro(fonte, token):
    """Um tile de um zip do create_tiles_pro, pelo índice 0-based do prompt."""
    tid = fonte['tiles_pro']
    z = zipfile.ZipFile(io.BytesIO(descarrega(
        f'{API}/tiles-pro/{tid}/download', token, f'tiles-pro-{tid}.zip')))
    # Os nomes trazem o prompt inteiro à frente; o que conta é o número no fim.
    porindice = {}
    for nome in z.namelist():
        raiz, _, ext = nome.rpartition('.')
        if ext.lower() != 'png':
            continue
        _, _, num = raiz.rpartition('_')
        if num.isdigit():
            porindice[int(num)] = nome
    i = fonte['indice']
    if i not in porindice:
        raise SystemExit(f'  o tiles_pro {tid} não tem índice {i}; '
                         f'tem 0..{max(porindice)}')
    return Image.open(io.BytesIO(z.read(porindice[i]))).convert('RGBA')


def do_objecto(fonte, token):
    """Um create_map_object. Vem PNG directo, sem zip pelo meio."""
    oid = fonte['objecto']
    return Image.open(io.BytesIO(descarrega(
        f'{API}/map-objects/{oid}/download', token, f'objecto-{oid}.png'))).convert('RGBA')


GERADORES = [('tileset', do_tileset), ('tiles_pro', do_tiles_pro), ('objecto', do_objecto)]


# ── o chão que ninguém pediu ──────────────────────────────────────────────────
def limpa_chao(im, fundo=0.35):
    """Apaga a relva que o gerador colou à base do objecto.

    Três condições ao mesmo tempo, e são as três que evitam falsos positivos:

    * **verde-azeitona** — o verde tem de ser pelo menos tão forte como o
      vermelho e bem acima do azul. A relva medida é (69,69,40) a (164,178,69);
      o ouro da marca é (200,150,30), com o vermelho a dominar, e escapa. Sem a
      condição `g >= r` a madeira clara e o entrançado da esteira iam atrás.
    * **em baixo** — só o terço inferior da silhueta. Uma planta em vaso tem
      verde legítimo, e tem-no em cima.
    * **encostado ao fundo** — a mancha tem de tocar a linha mais baixa do
      objecto. Relva é chão; folhagem a meia altura não é.

    Apaga para transparente em vez de preencher, porque isto vive fora da
    silhueta do objecto: preencher deixava uma forma escura recortada contra o
    chão, que foi exactamente o erro que o `limpa_adereco.py` documenta.
    """
    a = np.asarray(im).astype(int)
    op = a[..., 3] > 128
    if not op.any():
        return im, 0
    r, g, b = a[..., 0], a[..., 1], a[..., 2]

    ys = np.nonzero(op.any(axis=1))[0]
    topo, base = ys.min(), ys.max()
    limite = base - (base - topo) * fundo

    linhas = np.arange(a.shape[0])[:, None]
    verde = op & (g >= r) & (g > b + 25) & (linhas >= limite)
    if not verde.any():
        return im, 0

    # Toca no fundo? Se a mancha mais baixa não chega às últimas linhas do
    # objecto, é verde do próprio objecto e fica.
    if np.nonzero(verde.any(axis=1))[0].max() < base - 3:
        return im, 0

    saida = np.asarray(im).copy()
    saida[verde] = 0
    return Image.fromarray(saida, 'RGBA'), int(verde.sum())


# ── principal ─────────────────────────────────────────────────────────────────
def main():
    p = argparse.ArgumentParser(description=__doc__,
                                formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument('nomes', nargs='*', help='que peças trazer (omissão: as que faltam)')
    p.add_argument('--refaz', action='store_true', help='descarrega mesmo que já exista')
    p.add_argument('--sem-limpeza', action='store_true',
                   help='não apagar a relva colada à base dos adereços')
    args = p.parse_args()

    token = os.environ.get('PIXELLAB_TOKEN')
    if not token:
        raise SystemExit('falta o PIXELLAB_TOKEN no ambiente')
    if not os.path.exists(FONTES):
        raise SystemExit(f'não há {FONTES} — é ele que diz de onde vem cada peça')

    # As chaves com `_` à frente são notas para quem lê o ficheiro, não peças.
    fontes = {k: v for k, v in json.load(open(FONTES, encoding='utf-8')).items()
              if not k.startswith('_')}
    os.makedirs(DIR_PECAS, exist_ok=True)

    desconhecidas = sorted(set(fontes) - set(PECAS))
    if desconhecidas:
        print(f'aviso: o FONTES.json declara peças que o pecas.py não conhece '
              f'e que o atlas vai ignorar: {", ".join(desconhecidas)}', file=sys.stderr)

    alvos = args.nomes or sorted(fontes)
    trazidas = saltadas = 0
    for nome in alvos:
        if nome not in fontes:
            print(f'  {nome}: não está no FONTES.json', file=sys.stderr)
            continue
        destino = os.path.join(DIR_PECAS, f'{nome}.png')
        if os.path.exists(destino) and not args.refaz:
            saltadas += 1
            continue

        fonte = fontes[nome]
        gerador = next((f for chave, f in GERADORES if chave in fonte), None)
        if gerador is None:
            print(f'  {nome}: o FONTES.json não diz de onde vem '
                  f'(esperava uma de {[c for c, _ in GERADORES]})', file=sys.stderr)
            continue

        im = gerador(fonte, token)
        nota = f'{im.width}x{im.height}'
        # Chãos e paredes são superfícies opacas de bordo a bordo: não há
        # "fora do objecto" onde possa ter aparecido relva, e a limpeza só
        # arriscaria comer-lhes píxeis legítimos. Adereços e vãos são
        # recortados, e é neles que o gerador inventa terreno.
        especie = PECAS[nome].especie if nome in PECAS else 'adereco'
        if especie in ('adereco', 'vao') and not args.sem_limpeza:
            im, apagados = limpa_chao(im)
            if apagados:
                nota += f', {apagados} px de relva apagados'
        im.save(destino)
        print(f'  {nome}: {nota}')
        trazidas += 1

    print(f'\n{trazidas} peças trazidas, {saltadas} já cá estavam.')
    faltam = sorted(set(PECAS) - set(fontes) - {n for n in PECAS if PECAS[n].derivar})
    if faltam:
        print(f'ainda por gerar ({len(faltam)}): {", ".join(faltam)}')
    print('agora: npm run arte')


if __name__ == '__main__':
    main()
