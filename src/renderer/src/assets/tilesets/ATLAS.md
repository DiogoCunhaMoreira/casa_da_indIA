# `casadaindia.png` — o que ficou onde

Isto é o **mapa do ficheiro construído**, não o pedido. Onde diverge de
`CASA-DA-INDIA-SPEC.md`, a razão está anotada. Quem monta a planta deve ler
este ficheiro, não a especificação.

| | |
|---|---|
| **Ficheiro** | `casadaindia.png` — 256 × 256, RGBA, alfa só 0 ou 255 |
| **Grelha** | 16 × 16 células de 16 px |
| **Cores** | 30, todas da paleta em `tools/mapgen/build_atlas.py` |
| **Gerado por** | `python3 tools/mapgen/build_atlas.py [pasta-das-artes]` |

Uma célula `(coluna, linha)` começa no píxel `(coluna × 16, linha × 16)`.

---

## BLOCO A — CHÃO · linhas 0–1 (a variante vai até à 3) · opaco

| Células | O quê | Origem |
|---|---|---|
| `(0,0)`–`(1,1)` | **Azulejo principal**, 2 × 2 | `1.png` |
| `(2,0)`–`(3,1)` | **Pedra lioz**, 2 × 2 | desenhado em código |
| `(4,0)`–`(5,1)` | **Soalho de madeira**, 2 × 2 | desenhado em código |
| `(8,0)`–`(11,3)` | **Azulejo variante** (gabinete do Feitor), **4 × 4** | `2.png` |

Os quatro passam o teste da costura — repetem em grelha infinita sem linha
fantasma. Está verificado, não é uma promessa.

**Divergência:** a variante é 4 × 4, não 2 × 2. O padrão de `2.png` é denso de
mais: a 32 px transforma-se em ruído azul. A 64 px lê-se como azulejo. Ocupa as
linhas 0–3 nas colunas 8–11, longe das paredes.

**Divergência:** a lioz e o soalho não vieram nas artes. Estão desenhados por
código no gerador, com a paleta da casa. Servem, mas são os dois candidatos
óbvios a substituir se houver mais uma ronda de arte. A esteira/tapete não
existe.

## BLOCO B — PAREDES · linhas 2–4

As artes vieram como **segmentos de parede inteiros** — cornija, pano de cal,
dado de azulejo e soco de pedra empilhados. Por isso cada peça é uma **coluna
de 3 tiles de altura**, e não o tile de face único que a especificação pedia.
Empilha as três linhas e tens a parede completa.

| Células | O quê |
|---|---|
| `(0,2)` / `(0,3)` / `(0,4)` | **Parede de cal** — cornija / pano liso / dado de azulejo + soco |
| `(1,2)` / `(1,3)` / `(1,4)` | **Pilar** de pedra, ou junção em T |
| `(2,2)`–`(3,4)` | **Canto superior esquerdo**, 2 × 3 |
| `(4,2)`–`(5,4)` | **Canto superior direito**, 2 × 3 |
| `(6,2)` | Cornija solta, para rematar onde faltar |
| `(6,4)` | Faixa de azulejo solta |

As peças de 1 tile de largura estão espelhadas ao centro, para encostarem a si
próprias sem salto na junta.

**Não veio:** a linha inteira em pedra aparelhada (`(0,3)`–`(5,3)` da
especificação, para o armazém). Usa o lioz do chão e as peças de cal por agora.

## BLOCO C — ARCO E JANELA · linhas 5–8

| Células | O quê |
|---|---|
| `(0,5)`–`(2,8)` | **Arco manuelino**, 3 × 4 — esfera armilar e cruz de Cristo no fecho. A abertura é escura e opaca. |
| `(3,5)`–`(5,8)` | **Janela com a nau**, 3 × 4 — Tejo, nau com a cruz de Cristo, e a Torre ao fundo |

**Divergência:** ambas são 3 × 4 (48 × 64 px), não 3 × 3 e 2 × 2. A janela em
particular estava ilegível mais pequena — a nau desaparecia. A 64 px de altura
ainda se lê. É a peça mais cara do ficheiro em píxeis, e vale a pena.

**Não veio:** janela fechada com postigos, porta de armazém, padrão/brasão.

## BLOCO D — ARMAZÉM · linhas 9–11

| Células | O quê | | Células | O quê |
|---|---|---|---|---|
| `(0,9)` | Barril de pé | | `(8,9)`–`(9,10)` | Pilha de caixotes |
| `(1,9)`–`(2,10)` | Pilha de barris | | `(10,9)` | Rolo de cordame |
| `(3,9)` | Barril deitado | | `(11,9)`–`(12,10)` | Âncora |
| `(4,9)` | Saca de pimenta | | `(13,9)`–`(14,10)` | Fardo de velame |
| `(5,9)`–`(6,10)` | Pilha de sacas | | `(0,11)` | Cesto de vime |
| `(7,9)` | Caixote | | `(1,11)` | Ânfora de barro |

**Não veio:** tonel pequeno, rolo de tecido.

## BLOCO E — A CASA DE CONTAS · linhas 12–14

| Células | O quê | | Células | O quê |
|---|---|---|---|---|
| `(0,12)`–`(1,13)` | Balança de dois pratos | | `(9,12)` | Tinteiro e penas |
| `(2,12)`–`(3,13)` | Esfera armilar | | `(10,12)` | Ampulheta |
| `(4,12)`–`(6,13)` | **Padrão Real** na mesa, 3 × 2 | | `(11,12)` | Castiçal aceso |
| `(7,12)` | Livro de registo aberto | | `(12,12)` | Arca-forte ferrada |
| `(8,12)` | Pilha de livros | | `(13,12)`–`(14,13)` | Astrolábio |
| | | | `(0,14)`–`(1,14)` | Portulanos enrolados |

## MOBÍLIA · linha 15 — **desenhada em código**

Nada disto veio nas artes, e a planta não se monta sem: são quinze lugares para
sentar quinze oficiais.

| Células | O quê |
|---|---|
| `(0,15)`–`(1,15)` | **Escrivaninha**, 2 × 1 — mesa de madeira com o livro de registo e o tinteiro em cima (esses dois são a arte a sério, composta por cima da mesa) |
| `(2,15)` | **Banco** — 1 × 1. É o lugar. Pinta-se no `furniture-below` e **é pisável**; tudo o resto na `furniture-above` é sólido |
| `(3,15)`–`(4,15)` | **Mesa do refeitório**, 2 × 1 — a escrivaninha sem nada em cima |

São peças geométricas simples, e nota-se ao lado do resto. A seguir à lioz e ao
soalho, são as primeiras candidatas a substituir se houver outra ronda de arte —
os prompts estão no [`PROMPTS.md`](./PROMPTS.md).

---

## Ângulos

Como estava previsto, e é para respeitar quando se monta a planta:

- **Chão, paredes, arco e janela** → de frente, sem perspectiva
- **Adereços** (blocos D e E) → três-quartos de cima, ancorados em baixo ao
  centro da sua célula, para assentarem no chão

## A planta

O atlas está montado no mapa `assets/maps/ribeira.tmj` — a Ribeira das Naus,
34 × 22 tiles, gerada por `tools/mapgen/build_ribeira.py`. O `firstgid` é
**2449**, a seguir ao `interiors.png` (1025–2448).

Esse gerador também escreve `casadaindia/planta.ts`, com os nomes dos lugares,
os tiles da adega, os adereços clicáveis e os recados — tudo derivado das mesmas
coordenadas que desenham o mapa, para que o `tema.ts` não repita um único número
de tile à mão. Se mexeres na planta, corre o gerador; não edites o `.ts`.

**Só duas peças do mapa não são deste atlas:** a palmeira e a planta de vaso,
emprestadas do `interiors.png` (gids 1742/1743/1758/1759 e 1756/1772).

## Ainda por desenhar

Por ordem de quanto se nota:

1. **A escrivaninha, o banco e a mesa** (linha 15) — repetem-se trinta vezes no
   chão; são o que mais se vê e o que menos parece arte
2. **A pedra lioz e o soalho de madeira** (blocos `(2,0)` e `(4,0)`)
3. A linha de paredes em pedra aparelhada, para o armazém
4. A janela fechada, a porta de armazém, o brasão das quinas
5. O tonel pequeno, o rolo de tecido, a esteira
