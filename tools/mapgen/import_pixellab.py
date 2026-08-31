#!/usr/bin/env python3
"""Traz uma personagem da PixelLab para a folha de sprites que a app lê.

    PIXELLAB_TOKEN=... python3 tools/mapgen/import_pixellab.py caminha 75988fde-...

Escreve os mesmos dois ficheiros que o `build_personagem.py` escreve, com o
mesmo formato, para o banco de ensaio não ter de saber de onde veio a arte:

    src/renderer/src/assets/sprites/<nome>.png     a folha, células fixas
    src/renderer/src/assets/sprites/<nome>.json    que frames são que animação

O token não vive aqui. Sai do ambiente, e o `.mcp` do Claude já o tem — é o
mesmo `Bearer` que o servidor MCP usa. Não o commites.

Porque é que isto é mais curto que o `build_personagem.py`
──────────────────────────────────────────────────────────
O irmão mais velho recebe PNGs **aparados**, cada um com a sua moldura, e tem
de reconstruir por correlação de silhuetas o alinhamento que se perdeu na
exportação. Aqui não é preciso nada disso: a PixelLab devolve todos os frames
numa tela uniforme de N×N, já centrados no mesmo pivot. O alinhamento vem de
borda.

O que substitui a correlação é uma regra só, e é ela que segura tudo:

* **Uma caixa só, para todos os frames.** A caixa de recorte é a união das
  caixas de conteúdo de *todos* os frames da personagem, e depois recorta-se
  esse mesmo rectângulo de cada frame. Recortar cada frame à sua própria caixa
  reintroduziria exactamente o salto que a PixelLab já tinha resolvido — a
  pena sobe, a caixa cresce, o corpo desce. Uma caixa só, e o pivot mantém-se.

O preço a pagar
───────────────
A tela da PixelLab é de 128 px e a célula da app quer a personagem com ~72 px
de alto. A redução não é por um inteiro, portanto o resultado é reamostrado e
perde a grelha de píxeis dura — o que colide com a regra 1 do
`CASA-DA-INDIA-SPEC.md`. Duas saídas, conforme o que se quiser:

* aceitar, com o `--altura` que vem por omissão (é o que o `fidalgo` já faz);
* ou gerar a personagem na PixelLab já a um tamanho pequeno (o `create_character`
  em v3 aceita `size`), e importar com `--altura 0`, que desliga a redução.

Precisa de pillow + numpy (o `npm run arte` prepara-os).
"""
import argparse
import io
import json
import os
import re
import sys
import urllib.request
import zipfile

import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
ASSETS = os.path.join(ROOT, 'src', 'renderer', 'src', 'assets')

API = 'https://api.pixellab.ai/mcp/characters/{}/download'

# A célula, igual à do build_personagem.py — o `personagem.tsx` e o
# `CharacterSprite` já contam com esta.
CEL_W, CEL_H = 56, 80
ALTURA_ALVO = 72
COLS = 8

# As direcções da PixelLab que a app consome. A esquerda é o espelho da
# direita, feito em tempo de desenho pelo `scale.x = -1`, por isso o `west`
# não entra na folha — seria peso morto.
DIRECCOES = {'south': 'down', 'north': 'up', 'east': 'right'}


def descarrega(character_id, token):
    """O zip da personagem. Traz as rotações e as animações por direcção."""
    pedido = urllib.request.Request(
        API.format(character_id), headers={'Authorization': f'Bearer {token}'})
    with urllib.request.urlopen(pedido) as r:
        if r.status != 200:
            raise SystemExit(f'a PixelLab respondeu {r.status}')
        return zipfile.ZipFile(io.BytesIO(r.read()))


def escolhe_animacoes(nomes):
    """Que pastas de animação são a marcha e quais são a parada.

    Devolve **listas**, não nomes soltos, e a razão é o processo de trabalho:
    afinar uma personagem faz-se a gerar variantes da mesma direcção em grupos
    separados — `walk_a`, `walk_b`, `walk_c` — para se poderem ver lado a lado
    antes de escolher. Quem ganha fica; os outros apagam-se. No fim é normal o
    `south` ter vindo de um grupo e o `east` de outro, e não há forma de os
    juntar do lado da PixelLab: uma animação não se muda de grupo. Junta-se
    aqui.

    Os nomes vêm do que se escreveu ao pedir a animação, e nem sempre são
    limpos: o Gama tem uma pasta `Just_normal_walking_and_idle_animations`, que
    casa com as duas palavras. Daí a ordem importar — a marcha reclama primeiro,
    e a parada só pode sair do que sobrar.
    """
    walk = [n for n in nomes if re.search(r'walk', n, re.I)]
    idle = [n for n in nomes
            if n not in walk and re.search(r'idle|breath', n, re.I)]
    return walk, idle


def frames_de(animacoes, grupos, direccao):
    """Os frames de uma direcção, do primeiro grupo que a tenha.

    Com várias variantes vivas ao mesmo tempo a escolha seria ambígua, por isso
    o importador avisa em vez de decidir em silêncio — apaga-se a perdedora na
    PixelLab e volta a correr-se.
    """
    tem = [g for g in grupos if animacoes.get(g, {}).get(direccao)]
    if len(tem) > 1:
        print(f'  aviso: {direccao} está em {len(tem)} grupos '
              f'({", ".join(tem)}) — fico com {tem[0]}', file=sys.stderr)
    return animacoes[tem[0]][direccao] if tem else None


def recolhe(z):
    """Do zip para {(anim, direccao): [frames]}, mais as rotações como recurso.

    As rotações servem de parada de emergência: uma personagem sem animação
    nenhuma ainda dá uma folha utilizável, com um frame por direcção.
    """
    rotacoes, animacoes = {}, {}
    for nome in z.namelist():
        if not nome.endswith('.png'):
            continue
        partes = nome.split('/')
        if len(partes) == 3 and partes[1] == 'rotations':
            rotacoes[partes[2][:-4]] = nome
        elif len(partes) == 5 and partes[1] == 'animations':
            animacoes.setdefault(partes[2], {}).setdefault(partes[3], []).append(nome)
    for grupo in animacoes.values():
        for frames in grupo.values():
            frames.sort()
    return rotacoes, animacoes


def caixa(im):
    a = np.asarray(im)
    ys, xs = np.nonzero(a[..., 3] > 32)
    if len(xs) == 0:
        return None
    return int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1


def uniao(caixas):
    xs0, ys0, xs1, ys1 = zip(*caixas)
    return min(xs0), min(ys0), max(xs1), max(ys1)


def reduz(im, w, h):
    """Reduz sobre alpha pré-multiplicado, senão o bordo sangra o preto que
    está por baixo dos píxeis transparentes. Igual ao build_personagem.py."""
    a = np.asarray(im, dtype=np.float32)
    al = a[..., 3:4] / 255.0
    pre = np.concatenate([a[..., :3] * al, a[..., 3:4]], axis=-1)
    peq = Image.fromarray(pre.clip(0, 255).astype('uint8'), 'RGBA').resize(
        (w, h), Image.LANCZOS)
    o = np.asarray(peq, dtype=np.float32)
    rgb = (o[..., :3] / np.maximum(o[..., 3:4], 1e-6) * 255.0).clip(0, 255)
    return Image.fromarray(np.dstack([rgb, o[..., 3]]).astype('uint8'), 'RGBA')


def main():
    p = argparse.ArgumentParser(description=__doc__,
                                formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument('nome', help='como se vai chamar a folha, ex. caminha')
    p.add_argument('character_id', help='o id da PixelLab')
    p.add_argument('--altura', type=int, default=ALTURA_ALVO,
                   help=f'altura da personagem em px (0 = não reduzir). '
                        f'omissão: {ALTURA_ALVO}')
    args = p.parse_args()

    token = os.environ.get('PIXELLAB_TOKEN')
    if not token:
        raise SystemExit('falta PIXELLAB_TOKEN no ambiente')

    z = descarrega(args.character_id, token)
    rotacoes, animacoes = recolhe(z)
    walk, idle = escolhe_animacoes(list(animacoes))
    print(f'animações no zip: {list(animacoes) or "nenhuma"}')
    print(f'  marcha → {", ".join(walk) or "(usa a rotação parada)"}')
    print(f'  parada → {", ".join(idle) or "(usa a rotação parada)"}')

    # Que frames formam cada animação da folha. Sem animação, cai na rotação:
    # um frame só, que o `personagem.tsx` toca em ciclo sem dar por isso.
    plano = {}
    for direccao, sufixo in DIRECCOES.items():
        for chave, grupos in (('walk', walk), ('idle', idle)):
            frames = frames_de(animacoes, grupos, direccao)
            if not frames:
                frames = [rotacoes[direccao]] if direccao in rotacoes else []
            if frames:
                plano[f'{chave}-{sufixo}'] = frames

    if not plano:
        raise SystemExit('o zip não trouxe nem animações nem rotações')

    # ── a caixa única ─────────────────────────────────────────────────────────
    # Ver o cabeçalho: uma só para todos os frames, senão o corpo salta.
    todos = sorted({f for frames in plano.values() for f in frames})
    abertos = {f: Image.open(io.BytesIO(z.read(f))).convert('RGBA') for f in todos}
    caixas = [c for c in (caixa(im) for im in abertos.values()) if c]
    x0, y0, x1, y1 = uniao(caixas)
    print(f'{len(todos)} frames de {next(iter(abertos.values())).size}, '
          f'caixa comum {x1 - x0}×{y1 - y0} em ({x0},{y0})')

    recortados = {f: im.crop((x0, y0, x1, y1)) for f, im in abertos.items()}

    if args.altura:
        escala = args.altura / (y1 - y0)
        w = max(1, round((x1 - x0) * escala))
        h = max(1, round((y1 - y0) * escala))
        recortados = {f: reduz(im, w, h) for f, im in recortados.items()}
        print(f'escala {escala:.3f} ({y1 - y0}px → {h}px)')
    else:
        print('sem redução (--altura 0)')

    amostra = next(iter(recortados.values()))
    if amostra.width > CEL_W or amostra.height > CEL_H:
        print(f'aviso: {amostra.width}×{amostra.height} não cabe na célula '
              f'{CEL_W}×{CEL_H} — vai ser cortado pelas bordas',
              file=sys.stderr)

    # ── montar a folha ────────────────────────────────────────────────────────
    total = sum(len(v) for v in plano.values())
    linhas = (total + COLS - 1) // COLS
    folha = Image.new('RGBA', (COLS * CEL_W, linhas * CEL_H), (0, 0, 0, 0))

    indice = 0
    mapa = {}
    for anim, frames in plano.items():
        idxs = []
        for f in frames:
            im = recortados[f]
            cx, cy = indice % COLS, indice // COLS
            # Mesma posição para todos: é o que preserva o pivot da PixelLab.
            folha.alpha_composite(im, (
                cx * CEL_W + (CEL_W - im.width) // 2,
                cy * CEL_H + CEL_H - im.height,
            ))
            idxs.append(indice)
            indice += 1
        mapa[anim] = idxs

    out_png = os.path.join(ASSETS, 'sprites', f'{args.nome}.png')
    out_json = os.path.join(ASSETS, 'sprites', f'{args.nome}.json')
    os.makedirs(os.path.dirname(out_png), exist_ok=True)
    folha.save(out_png)
    json.dump({
        'nome': args.nome,
        'cell': [CEL_W, CEL_H],
        'cols': COLS,
        'frames': total,
        'anims': mapa,
        'pixellab': args.character_id,
    }, open(out_json, 'w'), indent=1)

    print(f'escrito {out_png}  {folha.width}×{folha.height}, '
          f'{total} frames de {CEL_W}×{CEL_H}')
    for anim, idxs in mapa.items():
        print(f'  {anim:12s} {len(idxs)} frames  {idxs}')
    print(f'escrito {out_json}')


if __name__ == '__main__':
    main()
