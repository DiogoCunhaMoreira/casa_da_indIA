#!/usr/bin/env python3
"""Gera ribeira.tmj — o chão da Casa da Índia, Ribeira das Naus, Lisboa c.1500.

    python3 tools/mapgen/build_atlas.py      # primeiro: montar o atlas
    python3 tools/mapgen/build_ribeira.py    # depois: desenhar a planta

40 × 28 tiles de 32 px = 1280 × 896, desenhado inteiramente com o
`casadaindia.png` (firstgid 1 — é o único atlas do chão). A planta:

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
    │            terracota                   ↔         lioz         │ 26
    └────────────────────────────────────────┴──────────────────────┘ 27 friso

Toda a parede é a mesma pilha de três linhas, de cima para baixo: viga de tecto,
reboco de cal, silhar de azulejo. O azulejo está NA PAREDE e em mais lado
nenhum — espalhá-lo pelo chão é o que fazia a versão anterior deste chão ler-se
como um campo azul indiferenciado. O chão é tijoleira e pedra sossegadas, para a
mobília ter contra o quê assentar, e a metade norte pálida contra a metade sul
quente é o que faz as salas distinguirem-se.

**Nada aqui exige que a arte exista.** Cada colocação pede uma peça pelo nome ao
`pecas.py`; se essa peça ainda não tiver sido desenhada, a colocação é saltada e
contada, e o mapa sai à mesma. É assim que dá para ver o cenário crescer peça a
peça em vez de ser tudo ou nada.

Este script escreve também `casadaindia/planta.ts` — nomes de lugares, tiles da
adega, âncoras de adereços e recados, tudo derivado das coordenadas daqui. O
tema importa esse ficheiro em vez de repetir os números, para que o mapa e o
`ThemeConfig` não possam divergir.
"""
import collections
import json
import os
import sys

from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from pecas import COLS as ATLAS_COLS, PECAS, TILE as ATLAS_TILE      # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
ASSETS = os.path.join(ROOT, 'src', 'renderer', 'src', 'assets')
OUT = os.path.join(ASSETS, 'maps', 'ribeira.tmj')
OUT_TS = os.path.join(ROOT, 'src', 'renderer', 'src', 'scene', 'office',
                      'casadaindia', 'planta.ts')

W, H, TS = 40, 28, 32
CASA = 1                   # firstgid — o casadaindia.png é o único atlas
FLIP_H = 0x80000000        # bandeira de espelho do Tiled; o renderizador honra-a
GID_MASK = 0x1FFFFFFF      # as bandeiras vivem nos três bits do topo


def g(col, row):
    return CASA + row * ATLAS_COLS + col


def _presentes():
    """Que peças têm mesmo arte no atlas.

    Uma peça conta como presente se QUALQUER uma das suas células estiver
    pintada: um adereço ancorado em baixo pode legitimamente ter as células de
    cima vazias."""
    caminho = os.path.join(ASSETS, 'tilesets', 'casadaindia.png')
    if not os.path.exists(caminho):
        return set()
    a = Image.open(caminho).convert('RGBA')
    t = ATLAS_TILE
    cheias = {(c, r) for r in range(ATLAS_COLS) for c in range(ATLAS_COLS)
              if a.crop((c * t, r * t, c * t + t, r * t + t)).getbbox()}
    return {n for n, p in PECAS.items() if any(cel in cheias for cel in p.celulas)}


PRESENTES = _presentes()
SALTADAS = collections.Counter()
COLOCADAS = collections.Counter()
CHOQUES = []

# ── as paletas, por nome ──────────────────────────────────────────────────────
TERRACOTA = [f'chao-terracota-{i}' for i in range(1, 9)]
LIOZ = [f'chao-lioz-{i}' for i in range(1, 5)]
REBOCO = [f'parede-reboco-{i}' for i in range(1, 7)]
AZULEJO = [f'parede-azulejo-{i}' for i in range(1, 6)]
FRISO = [f'parede-friso-{i}' for i in range(1, 5)]
VIGA = [f'parede-viga-{i}' for i in range(1, 5)]
PAREDE_V = ['parede-vertical-1', 'parede-vertical-2']

# ── camadas ───────────────────────────────────────────────────────────────────
floor, walls, fb, fa, coll = ([0] * (W * H) for _ in range(5))


def rnd(x, y, salt=0):
    """Um hash da coordenada do tile. Determinista — o mesmo mapa em cada
    execução, sem ficheiro de semente — mas sem estrutura que o olho encontre.

    Isto já foi `(x*7 + y*13 + (x*y) % 5) % n`, que parece dispersão e não é: é
    linear em x e em y, portanto dispõe as variantes numa rede diagonal com
    corridas de cinco tiles iguais seguidos. Num chão com vinte e sete tiles de
    largura isso lê-se como riscas, e riscas são exactamente a repetição que as
    variantes pintadas existem para evitar."""
    h = (x * 0x9E3779B1) ^ (y * 0x85EBCA77) ^ (salt * 0xC2B2AE3D)
    h &= 0xFFFFFFFF
    h ^= h >> 15
    h = (h * 0x2545F491) & 0xFFFFFFFF
    h ^= h >> 13
    return h


def escolhe(paleta, x, y):
    """Uma das variantes que EXISTEM desta paleta, ou None se nenhuma existir."""
    disp = [n for n in paleta if n in PRESENTES]
    if not disp:
        SALTADAS[paleta[0].rsplit('-', 1)[0]] += 1
        return None
    return disp[rnd(x, y) % len(disp)]


def _celula(layer, x, y, gid_):
    if 0 <= x < W and 0 <= y < H and gid_:
        layer[y * W + x] = gid_


def poe(layer, x, y, nome, salt=0):
    """Uma peça de uma célula, espelhada em cara-ou-coroa se ela o permitir."""
    if nome is None:
        return
    p = PECAS[nome]
    gid_ = g(p.col, p.row)
    if p.espelhavel and rnd(x, y, salt) & 1:
        gid_ |= FLIP_H
    _celula(layer, x, y, gid_)


def adereco(layer, x0, y0, nome):
    """Pinta uma peça a partir do seu canto superior esquerdo.

    Devolve False — e conta — quando a peça ainda não foi desenhada. Isso não é
    erro: é o que deixa a planta inteira ser gerada com meia dúzia de sprites.

    Regista as células que pisou. Dois adereços num tile é estrago silencioso —
    o segundo ganha, o primeiro meio desaparece, e a camada de colisão continua
    a dizer sólido, por isso nada a jusante dá por ela."""
    if nome not in PRESENTES:
        SALTADAS[nome] += 1
        return False
    p = PECAS[nome]
    # Espelhar UMA célula de um adereço de várias parte-o ao meio; e a cadeira
    # da escrivaninha está à esquerda de propósito, porque essa célula é o lugar.
    virar = p.espelhavel and p.tw == 1 and p.th == 1 and rnd(x0, y0, 21) & 1
    for dy in range(p.th):
        for dx in range(p.tw):
            x, y = x0 + dx, y0 + dy
            if not (0 <= x < W and 0 <= y < H):
                continue
            if layer[y * W + x]:
                CHOQUES.append(f'{nome} por cima de {(x, y)}')
            gid_ = g(p.col + dx, p.row + dy)
            _celula(layer, x, y, gid_ | FLIP_H if virar else gid_)
    COLOCADAS[nome] += 1
    return True


def chao(x0, y0, x1, y1, paleta):
    """Chão, com um espelho em cara-ou-coroa por cima da escolha da variante.

    Cada célula de chão é um quadrado completo com a sua própria junta nos
    quatro lados, por isso espelhar uma é livre e legal — e duplica oito padrões
    em dezasseis sem ninguém desenhar nada."""
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            poe(floor, x, y, escolhe(paleta, x, y), salt=77)


# ── a casca ───────────────────────────────────────────────────────────────────
def parede_h(row, c0, c1, vaos=()):
    """Uma parede virada a sul, três linhas: viga, reboco, silhar de azulejo.
    `vaos` são as colunas deixadas abertas — uma porta é um buraco na parede,
    não uma porta desenhada."""
    for c in range(c0, c1 + 1):
        if c in vaos:
            continue
        poe(walls, c, row + 0, escolhe(VIGA, c, row), salt=11)
        poe(walls, c, row + 1, escolhe(REBOCO, c, row + 1), salt=12)
        poe(walls, c, row + 2, escolhe(AZULEJO, c, row + 2), salt=13)


def parede_v(col, linhas):
    """Um tabique norte-sul. Usa a peça vista de perfil, não uma face de
    parede: uma face aqui lê-se como uma tira pálida de chão."""
    for r in linhas:
        poe(walls, col, r, escolhe(PAREDE_V, col, r), salt=15)


def rodape(x, y):
    poe(walls, x, y, escolhe(FRISO, x, y), salt=14)


PORTA_COLS = (19, 20)                       # a entrada, na parede norte

# O chão primeiro — as paredes são pintadas por cima. Pedra pálida para as salas
# que o público vê, tijoleira quente para as que trabalham. Espalhar tijoleira
# pelas duas metades transformava o mapa num campo de laranja, que é o mesmo
# erro que o chão todo de azulejo fazia noutra cor.
chao(0, 3, W - 1, H - 1, TERRACOTA)         # o chão todo, e as salas por cima
chao(1, 3, 10, 10, LIOZ)                    # gabinete do Feitor
chao(12, 3, 27, 10, LIOZ)                   # átrio
chao(29, 14, W - 2, H - 2, LIOZ)            # adega / refeitório

parede_h(0, 0, W - 1, vaos=PORTA_COLS)      # parede norte, com o vão da entrada
adereco(fa, PORTA_COLS[0], 0, 'porta')      # a porta, a encher esse vão
for jc in (4, 14, 24, 33):                  # quatro janelas, sentadas no reboco
    adereco(fa, jc, 1, 'janela')

for y in range(3, H - 1):                   # rodapé poente e nascente
    rodape(0, y)
    rodape(W - 1, y)
for x in range(W):                          # rodapé a sul
    rodape(x, H - 1)

parede_v(11, range(3, 11))                  # gabinete: parede nascente, sem porta
parede_v(28, range(3, 9))                   # átrio | armazém, aberto nas linhas 9-10
parede_v(28, range(14, 25))                 # casa de contas | adega, aberto em 25-26

VAOS_INTERIORES = (5, 6, 22, 23, 33, 34)
parede_h(11, 1, W - 2, vaos=VAOS_INTERIORES)

# ══ GABINETE DO FEITOR ═══════════════════════════════════════════════════════
adereco(fa, 1, 3, 'arca')                   # a arca-forte, contra a parede norte
adereco(fa, 9, 3, 'balanca')                # a balança dele
adereco(fa, 4, 5, 'escrivaninha')           # a mesa dele, sob a sua própria janela
LUGAR_FEITOR = (4, 6)                       # a cadeira desenhada, canto inf. esq.
adereco(fa, 7, 4, 'livro')
adereco(fa, 9, 6, 'livro')
adereco(fa, 2, 6, 'pergaminho')
adereco(fa, 7, 6, 'pergaminho')
adereco(fa, 2, 9, 'pergaminho')
adereco(fa, 8, 9, 'castical')
adereco(fa, 9, 9, 'livro')
adereco(fa, 3, 8, 'planta')                 # a planta que os recados de 'water' regam
adereco(fb, 1, 8, 'banco')                  # um banco à parede, para quem espera

# ══ ÁTRIO — a sala em que se entra ═══════════════════════════════════════════
adereco(fa, 18, 6, 'mesa-comercio')         # a mesa de comércio: o centro da sala
adereco(fa, 25, 5, 'balanca')               # tudo o que desembarcava era pesado
# Contra a parede norte, como as regras pedem — mas ENTRE as janelas e não por
# baixo delas: os recados de janela precisam do seu tile na linha 3 para se pôr.
adereco(fa, 16, 3, 'arca')
adereco(fa, 21, 3, 'saca-vermelha')
adereco(fa, 22, 3, 'saca-amarela')
adereco(fa, 26, 3, 'caixote')
adereco(fa, 27, 3, 'fardo')
adereco(fa, 12, 9, 'caixote')
adereco(fa, 13, 9, 'fardo')
adereco(fa, 14, 9, 'barril')
adereco(fa, 12, 6, 'castical')
adereco(fa, 27, 6, 'livro')
adereco(fa, 26, 9, 'pergaminho')
adereco(fa, 27, 9, 'castical')
adereco(fa, 13, 4, 'planta')
adereco(fb, 22, 9, 'banco')                 # o banco de espera, junto à porta
adereco(fb, 15, 9, 'esteira')

# ══ ARMAZÉM — a mercadoria, empilhada às paredes ═════════════════════════════
adereco(fa, 29, 3, 'arca')
adereco(fa, 32, 3, 'barril-deitado')
adereco(fa, 36, 3, 'caixote')
adereco(fa, 37, 3, 'fardo')
adereco(fa, 33, 4, 'barril')
adereco(fa, 34, 4, 'barril')
adereco(fa, 38, 4, 'barril-deitado')
adereco(fa, 29, 6, 'saca-amarela')
adereco(fa, 30, 6, 'saca-vermelha')
adereco(fa, 35, 6, 'fardo')
adereco(fa, 36, 6, 'saca-amarela')
adereco(fa, 37, 6, 'caixote')
adereco(fa, 38, 7, 'caixote')
adereco(fa, 29, 9, 'fardo')
adereco(fa, 30, 9, 'caixote')
adereco(fa, 31, 9, 'saca-vermelha')
adereco(fa, 35, 9, 'fardo')
adereco(fa, 37, 9, 'barril')
adereco(fb, 33, 9, 'banco')

# ══ CASA DE CONTAS — as catorze escrivaninhas ════════════════════════════════
# Uma mesa é a escrivaninha de 2×2; a sua célula inferior esquerda é a cadeira
# desenhada, e é essa célula o lugar. Três colunas por mesa deixam um corredor.
COLS_MESA = [1, 4, 7, 10, 13, 16, 19]
LINHAS_MESA = [15, 21]                      # a linha de topo; o lugar é uma abaixo
LUGARES = []
for dy in LINHAS_MESA:
    for dx in COLS_MESA:
        adereco(fa, dx, dy, 'escrivaninha')
        LUGARES.append((dx, dy + 1))

adereco(fa, 24, 14, 'arca')                 # o corredor nascente, à parede
adereco(fa, 23, 17, 'livro')
adereco(fa, 27, 17, 'castical')
adereco(fa, 27, 14, 'pergaminho')
adereco(fa, 27, 20, 'balanca')
adereco(fa, 23, 21, 'castical')
adereco(fa, 23, 24, 'caixote')
adereco(fa, 25, 24, 'livro')
adereco(fa, 26, 24, 'pergaminho')
adereco(fa, 22, 26, 'planta')
adereco(fb, 25, 20, 'banco')
adereco(fb, 24, 18, 'esteira')

# ══ ADEGA / REFEITÓRIO ═══════════════════════════════════════════════════════
# O balcão tem de ser uma corrida ininterrupta de tiles sólidos na sua linha: a
# cena vira um agente de pé para o primeiro vizinho não-caminhável que encontra,
# e um buraco aqui punha-o a servir-se de costas para os barris.
BALCAO = [(31, 'barril'), (32, 'barril'), (33, 'barril-espicha'),
          (34, 'barril-espicha'), (35, 'barril'), (36, 'barril'), (37, 'barril')]
for bx, peca in BALCAO:
    if not adereco(fa, bx, 16, peca):
        adereco(fa, bx, 16, 'barril')        # sem a variante, serve o barril liso
adereco(fa, 30, 14, 'arca')
adereco(fa, 37, 14, 'caixote')
adereco(fa, 38, 16, 'fardo')
adereco(fa, 37, 19, 'castical')
adereco(fa, 30, 18, 'pergaminho')
adereco(fa, 33, 24, 'fardo')
adereco(fa, 30, 25, 'livro')
adereco(fa, 37, 25, 'barril-deitado')
adereco(fa, 38, 22, 'planta')

# duas mesas de cavalete: a mesa em cima, o banco por baixo é que é o lugar
LUGARES_CAFE = []
for tx in (30, 34):
    if not adereco(fa, tx, 20, 'mesa-refeitorio'):
        adereco(fa, tx, 20, 'banco')         # sem mesa lisa, um banco faz de tampo
    adereco(fb, tx, 21, 'banco')
    LUGARES_CAFE += [(tx, 21), (tx + 1, 21)]

# ══ COLISÃO ══════════════════════════════════════════════════════════════════
# Tudo o que está desenhado é sólido, e depois os lugares são recortados de
# volta. `fb` é a camada das coisas em que se PISA (os bancos), por isso nunca
# contribui.
for y in range(H):
    for x in range(W):
        if walls[y * W + x] or fa[y * W + x]:
            coll[y * W + x] = 1
for (sx, sy) in LUGARES + LUGARES_CAFE + [LUGAR_FEITOR]:
    coll[sy * W + sx] = 0
for c in PORTA_COLS:                        # a soleira debaixo da porta
    coll[3 * W + c] = 0

# ── o que o tema precisa de saber ─────────────────────────────────────────────
ENTRADA = (19, 4)
CAFE = {
    'trayTile': (31, 16), 'trayStand': (31, 17),   # o barril das canecas
    'machineStand': (33, 17),                      # sob os barris de espicha
    'sinkTile': (36, 16), 'sinkStand': (36, 17),   # o barril de lavar
    'maxCups': 4,
}
BANCAS_CAFE = [('cafe-stand-coffee', (32, 17), 'coffee'),
               ('cafe-stand-vending', (35, 17), 'vending')]
# Os adereços clicáveis são painéis de azulejo do silhar — as duas esferas
# armilares e um padrão — porque não há calendário, quadro nem relógio nesta
# casa, e um painel pintado é melhor coisa para clicar do que um barril a fingir.
ANCORAS = {
    'calendar': (6, 2),     # GATILHOS      — o silhar do gabinete
    'boards': (10, 13),     # TAREFAS       — o silhar da casa de contas
    'clock': (8, 2),        # HORA DE FECHAR
    'askme': (16, 13),      # PERGUNTA-ME   — mais adiante no mesmo silhar
}
# espécie, stand, direcção, fx, duração, só-deus. Cada `fx` é o adereço contra o
# qual o recado joga, e cada `stand` é o tile caminhável ao lado. Os que não
# tiverem adereço no `fx` são deixados de fora do `planta.ts` mais abaixo.
RECADOS = [
    ('smoke', (5, 3), 'up', (5, 2), 18, True),           # a janela dele, o cigarro
    ('water', (3, 9), 'up', (3, 8), 4.5, True),          # a palmeira do gabinete
    ('water', (13, 5), 'up', (13, 4), 4.5, False),
    ('water', (22, 25), 'down', (22, 26), 4.5, False),
    ('water', (38, 23), 'up', (38, 22), 4.5, False),
    ('window', (14, 3), 'up', (14, 2), 5, False),        # as janelas do átrio
    ('window', (25, 3), 'up', (25, 2), 5, False),
    ('window', (33, 3), 'up', (33, 2), 5, False),        # a janela do armazém
    ('dispenser', (34, 5), 'up', (34, 4), 3.5, False),   # tirar de um barril
    ('dispenser', (37, 20), 'up', (37, 19), 3.5, False),  # o castiçal aceso
    ('fridge', (24, 16), 'up', (24, 15), 3.2, False),    # abrir a arca grande
    ('fridge', (30, 16), 'up', (30, 15), 3.2, False),
    ('shelf', (23, 18), 'up', (23, 17), 4, False),       # o livro de registo aberto
    ('shelf', (30, 26), 'up', (30, 25), 4, False),
    ('bin', (23, 25), 'up', (23, 24), 2.6, False),       # o caixote
    ('bin', (12, 10), 'up', (12, 9), 2.6, False),
]


def solido(t):
    return bool(coll[t[1] * W + t[0]])


# Um recado só existe se o adereço contra o qual joga estiver mesmo lá, e se
# houver onde pôr os pés ao lado dele. Filtrar aqui é o que deixa a planta ser
# gerada com o atlas quase vazio sem a cena mandar ninguém encostar-se ao nada.
RECADOS_ACTIVOS = [r for r in RECADOS if solido(r[3]) and not solido(r[1])]

# ── pontos de spawn e zonas ───────────────────────────────────────────────────
NOMES_LUGARES = ['desk-feitor'] + [f'desk-{i + 1}' for i in range(len(LUGARES))]
NOMES_CAFE = [f'cafe-seat-{i + 1}' for i in range(len(LUGARES_CAFE))]


def pt(nome, tile):
    return {'id': 0, 'name': nome, 'type': '', 'x': tile[0] * TS, 'y': tile[1] * TS,
            'width': 0, 'height': 0, 'rotation': 0, 'visible': True, 'point': True}


spawns = [pt(n, t) for n, t in zip(NOMES_LUGARES, [LUGAR_FEITOR] + LUGARES)]
spawns += [pt(n, t) for n, t in zip(NOMES_CAFE, LUGARES_CAFE)]
spawns += [pt(n, t) for n, t, _ in BANCAS_CAFE]
spawns.append(pt('entrance', ENTRADA))

zones = [
    # O chão aberto a sul da mesa de comércio é o `boardroom`: os seus tiles
    # caminháveis são os lugares sobressalentes quando há mais agentes do que
    # escrivaninhas.
    {'id': 0, 'name': 'boardroom', 'type': '', 'x': 15 * TS, 'y': 8 * TS,
     'width': 10 * TS, 'height': 3 * TS, 'rotation': 0, 'visible': True},
    {'id': 0, 'name': 'cafeteria', 'type': '', 'x': 29 * TS, 'y': 14 * TS,
     'width': 10 * TS, 'height': 13 * TS, 'rotation': 0, 'visible': True},
]


# ── verificar antes de escrever ───────────────────────────────────────────────
# Um lugar a que não se chega a pé é um chão que se parte em silêncio. As
# verificações abaixo apanharam dois erros reais na primeira montagem desta
# planta. Continuam todas, mas as que dependem de arte só correm sobre o que
# está efectivamente colocado — senão um atlas meio vazio seria um erro fatal em
# vez de um passo do caminho.
def alcancavel_de(inicio):
    visto, fila = {inicio}, [inicio]
    while fila:
        x, y = fila.pop()
        for n in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if 0 <= n[0] < W and 0 <= n[1] < H and n not in visto and not coll[n[1] * W + n[0]]:
                visto.add(n)
                fila.append(n)
    return visto


if CHOQUES:
    raise SystemExit('adereços pintados uns por cima dos outros: ' + '; '.join(CHOQUES))

visto = alcancavel_de(ENTRADA)
tem_de_chegar = {o['name']: (o['x'] // TS, o['y'] // TS) for o in spawns}
tem_de_chegar.update({f'{k}@{s}': s for k, s, _, _, _, _ in RECADOS_ACTIVOS})
tem_de_chegar.update({f'adega:{k}': v for k, v in CAFE.items() if k.endswith('Stand')})
cortados = sorted(n for n, t in tem_de_chegar.items() if t not in visto)
if cortados:
    raise SystemExit('inalcançável desde a porta: ' + ', '.join(cortados))

# As âncoras clicáveis têm de estar em cima de alguma coisa — mas só se essa
# alguma coisa já tiver sido desenhada.
if any(n in PRESENTES for n in AZULEJO):
    nuas = [k for k, (x, y) in ANCORAS.items() if not walls[y * W + x] and not fa[y * W + x]]
    if nuas:
        raise SystemExit('âncoras clicáveis em tiles vazios: ' + ', '.join(nuas))

# O balcão da adega tem de ser uma corrida sólida ao lado das bancas — só
# verificável depois de haver barris.
if 'barril' in PRESENTES:
    for nome, (sx, sy) in ([('trayStand', CAFE['trayStand']),
                            ('machineStand', CAFE['machineStand']),
                            ('sinkStand', CAFE['sinkStand'])]
                           + [(n, t) for n, t, _ in BANCAS_CAFE]):
        if not coll[(sy - 1) * W + sx]:
            raise SystemExit(f'{nome} em {(sx, sy)} não tem nada de frente')


# ── montar e escrever ─────────────────────────────────────────────────────────
def camada(nome, dados, lid):
    return {'data': dados, 'height': H, 'id': lid, 'name': nome, 'opacity': 1,
            'type': 'tilelayer', 'visible': True, 'width': W, 'x': 0, 'y': 0}


def camada_obj(nome, objs, lid):
    return {'draworder': 'topdown', 'id': lid, 'name': nome, 'objects': objs,
            'opacity': 1, 'type': 'objectgroup', 'visible': True, 'x': 0, 'y': 0}


# Um atlas só, e o tema substitui esta entrada pelos seus próprios metadados —
# aqui só o firstgid e a ordem contam. O valor marcador 1 da camada de colisão
# calha ser também um gid real; essa camada é lida, nunca desenhada.
tmj = {
    'compressionlevel': -1, 'height': H, 'infinite': False,
    'nextlayerid': 8, 'nextobjectid': 1, 'orientation': 'orthogonal',
    'renderorder': 'right-down', 'tiledversion': '1.12.0', 'tileheight': TS,
    'tilewidth': TS, 'type': 'map', 'version': '1.10', 'width': W,
    'tilesets': [{'firstgid': CASA, 'source': 'casadaindia.tsx'}],
    'layers': [
        camada('floor', floor, 1),
        camada('walls', walls, 2),
        camada('furniture-below', fb, 3),
        camada('furniture-above', fa, 4),
        camada('collision', coll, 5),
        camada_obj('spawn-points', spawns, 6),
        camada_obj('zones', zones, 7),
    ],
}
os.makedirs(os.path.dirname(OUT), exist_ok=True)
json.dump(tmj, open(OUT, 'w'), indent=1)


def t(tile):
    return f'{{ x: {tile[0]}, y: {tile[1]} }}'


recados_ts = '\n'.join(
    f"  {{ kind: '{k}', stand: {t(s)}, facing: '{f}', fx: {t(x)}, duration: {d}"
    + (', godOnly: true },' if go else ' },')
    for k, s, f, x, d, go in RECADOS_ACTIVOS)

with open(OUT_TS, 'w') as fh:
    fh.write(f'''/**
 * A planta da Ribeira das Naus, em coordenadas de tile.
 *
 * GERADO por `tools/mapgen/build_ribeira.py` a partir do mesmo código que
 * desenha o `ribeira.tmj`. Não edites à mão — muda a planta no gerador e
 * volta a correr, ou o mapa e o tema deixam de dizer a mesma coisa.
 *
 * A lista de recados traz só os que têm mesmo um adereço desenhado contra o
 * qual jogar. Enquanto a arte for chegando peça a peça, ela cresce sozinha.
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

# ── relatório ─────────────────────────────────────────────────────────────────
saltadas = sum(SALTADAS.values())
print(f'escrito {OUT}  {W}×{H} @{TS}px = {W * TS}×{H * TS}')
print(f'peças presentes {len(PRESENTES)}/{len(PECAS)}'
      f' · colocações feitas {sum(COLOCADAS.values())}'
      f' · saltadas {saltadas}'
      f' · recados activos {len(RECADOS_ACTIVOS)}/{len(RECADOS)}'
      f' · {len(visto)} tiles alcançáveis desde a porta')
if SALTADAS:
    top = ', '.join(f'{n}×{c}' for n, c in SALTADAS.most_common(8))
    print(f'  mais saltadas: {top}')
print(f'escrito {OUT_TS}')
