#!/usr/bin/env python3
"""O vocabulário de peças do chão da Casa da Índia.

Este ficheiro declara TODAS as peças que a Ribeira das Naus sabe desenhar,
exista arte para elas ou não. É a única lista: `build_atlas.py` usa-a para saber
o que procurar e onde o colar, e `build_ribeira.py` usa-a para saber por que
nomes pedir as coisas — e para saltar em silêncio as que ainda não chegaram.

    Como se entrega uma peça
    ────────────────────────
    Larga um PNG de fundo transparente em  tools/mapgen/art/pecas/<nome>.png
    e corre  npm run arte.  Tamanho à vontade: o construtor escala para a área
    declarada aqui. Não é preciso editar código nenhum para entregar arte.

Uma peça sem ficheiro fica com a célula vazia e desaparece do mapa. Isso é
deliberado: a ideia é ver o cenário crescer peça a peça, e não estar tudo ou
nada. Quem quiser o chão de volta como estava, `--folha` reactiva os recortes da
folha pintada arquivada em `art/casadaindia-sheet.png` para as peças que ainda
não têm ficheiro próprio.
"""
from dataclasses import dataclass
from typing import Optional, Tuple

TILE = 32          # píxeis por célula do atlas
COLS = ROWS = 16   # o atlas é 16×16 células = 512×512

# Os chãos são recortados POR DENTRO do seu bordo pintado. Cada tile de chão
# costuma vir desenhado com a sua própria argamassa à volta; encostando dois,
# cada junta da sala carrega os dois bordos e o resultado é uma gaiola visível a
# cada 32 px. Medido no chão anterior: a junta ficava ~48 níveis de cinzento
# abaixo do interior do tile, contra ±5 de variação lá dentro — dez vezes mais
# forte do que tudo o que as variantes tinham para dizer. Cortar 4 px de cada
# lado deixa uma junta normal em vez de duas empilhadas.
INSET_CHAO = 4


@dataclass(frozen=True)
class Peca:
    """Uma peça: onde vive no atlas, que área ocupa, e como é tratada.

    `especie` decide o tratamento de imagem:
      chao     opaca, recortada por dentro do bordo, sem sombra
      parede   opaca, sem sombra — é fundo, não objecto
      vao      transparente, sem sombra — porta/janela/arco vivem na parede
      adereco  transparente, ancorada em baixo ao centro, com sombra de contacto

    `espelhavel` autoriza o gerador do mapa a virar a peça ao contrário para
    quebrar repetição. Só para o que lê igual dos dois lados: um canto de parede
    espelhado aponta para o sítio errado, e a cadeira da escrivaninha está à
    esquerda de propósito porque essa célula É o lugar sentado.
    """
    col: int
    row: int
    tw: int = 1
    th: int = 1
    especie: str = 'adereco'
    espelhavel: bool = False
    # Recorte na folha arquivada, (x, y, w, h). Só usado com --folha.
    folha: Optional[Tuple[int, int, int, int]] = None
    # Só com --folha: linhas de fundo neutro a remover no topo do recorte.
    matte: int = 0
    # Peça derivada de outra por código, quando não houver ficheiro próprio.
    derivar: Optional[str] = None

    @property
    def celulas(self):
        for dy in range(self.th):
            for dx in range(self.tw):
                yield self.col + dx, self.row + dy


def _linha(prefixo, n, col, row, **kw):
    """Uma corrida de variantes numeradas a partir de uma célula."""
    return {f'{prefixo}-{i + 1}': Peca(col + i, row, **kw) for i in range(n)}


def _folha_grelha(x, y, w, h, nx=1, ny=1):
    """Divide um recorte da folha arquivada em nx×ny caixas, em ordem de leitura."""
    return [(round(x + c * w / nx), round(y + r * h / ny), round(w / nx), round(h / ny))
            for r in range(ny) for c in range(nx)]


# Os recortes da folha arquivada, medidos por análise de ilhas de alpha.
_F_TERRACOTA = _folha_grelha(19, 17, 244, 249, 2, 2) + _folha_grelha(268, 17, 245, 249, 2, 2)
_F_LIOZ = [(521, 19, 113, 120), (639, 19, 110, 120),
           (756, 19, 112, 120), (873, 18, 109, 121)]
_F_REBOCO = _folha_grelha(995, 17, 440, 272, 3, 2)
_F_AZULEJO = _folha_grelha(19, 281, 933, 174, 5, 1)
_F_FRISO = _folha_grelha(966, 311, 238, 113, 2, 1) + _folha_grelha(1210, 311, 224, 114, 2, 1)
_F_VIGA = _folha_grelha(20, 475, 477, 142, 4, 1)


def _com_folha(pecas, caixas):
    """Cola os recortes arquivados a uma corrida de variantes, pela ordem."""
    return {n: Peca(p.col, p.row, p.tw, p.th, p.especie, p.espelhavel, caixa)
            for (n, p), caixa in zip(pecas.items(), caixas)}


PECAS: dict[str, Peca] = {
    # ── linha 0 — chão ────────────────────────────────────────────────────────
    **_com_folha(_linha('chao-terracota', 8, 0, 0, especie='chao', espelhavel=True),
                 _F_TERRACOTA),
    **_com_folha(_linha('chao-lioz', 4, 8, 0, especie='chao', espelhavel=True),
                 _F_LIOZ),

    # ── linha 1 — paredes ─────────────────────────────────────────────────────
    **_com_folha(_linha('parede-reboco', 6, 0, 1, especie='parede', espelhavel=True),
                 _F_REBOCO),
    # O silhar de azulejo vai na PAREDE e em mais lado nenhum. Espalhá-lo pelo
    # chão inteiro é o que fazia a versão anterior deste chão ler-se como ruído.
    **_com_folha(_linha('parede-azulejo', 5, 6, 1, especie='parede', espelhavel=True),
                 _F_AZULEJO),
    **_com_folha(_linha('parede-friso', 4, 11, 1, especie='parede', espelhavel=True),
                 _F_FRISO),

    # ── linha 2 — tecto, cantos, e as duas peças que não são arte ─────────────
    **_com_folha(_linha('parede-viga', 4, 0, 2, especie='parede', espelhavel=True),
                 _F_VIGA),
    # O que há fora das paredes. Cor lisa, gerada por código — nunca precisa de
    # ficheiro.
    'escuro': Peca(4, 2, especie='parede', derivar='liso:26,20,16'),
    # Um tabique visto de perfil é outro tile que não uma face de parede: usar
    # uma face aqui lê-se como uma tira pálida de chão. Sem ficheiro próprio,
    # deriva-se de uma face queimando-lhe uma goteira de sombra nos dois bordos.
    'parede-vertical-1': Peca(5, 2, especie='parede', derivar='vertical:parede-reboco-1'),
    'parede-vertical-2': Peca(6, 2, especie='parede', derivar='vertical:parede-reboco-4'),
    # Cantos: NÃO espelháveis, cada um aponta para o seu lado.
    **_linha('parede-canto', 4, 7, 2, especie='parede'),

    # ── linhas 3-5 — os vãos altos ────────────────────────────────────────────
    'porta': Peca(0, 3, 2, 3, 'vao', folha=(515, 475, 285, 405)),
    'arco': Peca(2, 3, 2, 3, 'vao'),          # passagem aberta — ainda por desenhar

    # ── linhas 6-7 — mobília ──────────────────────────────────────────────────
    'janela': Peca(0, 6, 2, 2, 'vao', folha=(823, 482, 230, 268)),
    # A cadeira desenhada na célula inferior esquerda É o lugar sentado. Por isso
    # esta peça nunca é espelhada, e por isso o gerador ancora aí o spawn point.
    'escrivaninha': Peca(2, 6, 2, 2, folha=(1064, 637, 247, 260)),
    'arca': Peca(4, 6, 3, 2, folha=(1083, 473, 335, 144)),
    'mesa-comercio': Peca(7, 6, 4, 2, folha=(23, 645, 458, 248)),
    # A balança da folha foi pintada contra um painel de ardósia que faz parte do
    # quadro e não do objecto; largado num chão de terracota lia-se como um
    # buraco preto. `matte` manda tirá-lo — é a única coisa NEUTRA do recorte
    # (R≈G≈B), enquanto todo o resto da peça é castanho quente ou dourado.
    'balanca': Peca(11, 6, 1, 2, folha=(1327, 659, 107, 230), matte=80),
    'planta': Peca(12, 6, 1, 2),              # religa os recados de 'water'

    # ── linha 8 — assentos e tapetes ──────────────────────────────────────────
    'mesa-refeitorio': Peca(0, 8, 2, 1),      # ainda por desenhar
    'banco': Peca(2, 8, 2, 1, folha=(1179, 937, 241, 115)),
    'esteira': Peca(4, 8, especie='chao', espelhavel=True),

    # ── linha 9 — mercadoria e adereços soltos ────────────────────────────────
    'barril': Peca(0, 9, espelhavel=True, folha=(619, 905, 110, 145)),
    'barril-deitado': Peca(1, 9, espelhavel=True),
    'barril-espicha': Peca(2, 9, espelhavel=True),
    'saca-vermelha': Peca(3, 9, espelhavel=True, folha=(33, 921, 119, 127)),
    'saca-amarela': Peca(4, 9, espelhavel=True, folha=(169, 914, 121, 133)),
    'caixote': Peca(5, 9, espelhavel=True, folha=(325, 917, 111, 128)),
    'fardo': Peca(6, 9, espelhavel=True, folha=(471, 917, 115, 126)),
    'livro': Peca(7, 9, espelhavel=True, folha=(761, 932, 145, 108)),
    'pergaminho': Peca(8, 9, espelhavel=True, folha=(925, 919, 125, 119)),
    'castical': Peca(9, 9, folha=(1070, 904, 69, 145)),
}


def valida():
    """Nenhuma peça pode pisar a célula de outra. Um atlas com duas peças na
    mesma célula perde uma delas em silêncio, e o mapa desenha a errada."""
    ocupado = {}
    for nome, p in PECAS.items():
        for cel in p.celulas:
            if cel in ocupado:
                raise SystemExit(f'atlas: {nome} pisa {ocupado[cel]} em {cel}')
            if not (0 <= cel[0] < COLS and 0 <= cel[1] < ROWS):
                raise SystemExit(f'atlas: {nome} sai da grelha em {cel}')
            ocupado[cel] = nome
    return ocupado


valida()
