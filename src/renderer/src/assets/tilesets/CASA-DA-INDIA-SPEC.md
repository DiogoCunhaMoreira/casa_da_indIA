# Atlas da Casa da Índia — especificação de desenho

O que desenhar para o chão da Ribeira das Naus deixar de ser o *open space* da
Dunder Mifflin. Escrito para quem desenha, não para quem programa.

> **A arte chegou, o atlas está montado e a planta está de pé.** Este ficheiro é
> o pedido, não o resultado — a planta do `casadaindia.png` construído está em
> [`ATLAS.md`](./ATLAS.md), e diverge daqui em alguns sítios. Para mexer no
> mapa, lê o `ATLAS.md`. Este fica como registo do que foi encomendado e do que
> ainda falta desenhar.
>
> O escritório da Dunder Mifflin saiu do repositório: já não há selector de
> temas nem `office.tmj`. A Ribeira das Naus é o único chão.

---

## O ficheiro

| | |
|---|---|
| **Caminho** | `src/renderer/src/assets/tilesets/casadaindia.png` |
| **Formato** | PNG, RGBA, fundo **transparente** |
| **Dimensões** | **256 × 256 px**, exactamente |
| **Grelha** | 16 colunas × 16 linhas de **16 × 16 px** |
| **Total** | 256 células (não é preciso preencher todas) |

Uma célula `(coluna, linha)` começa no píxel `(coluna × 16, linha × 16)`, com a
`(0,0)` no canto superior esquerdo.

## Regras invioláveis

1. **Sem *anti-aliasing*.** A cena desenha com `imageSmoothingEnabled = false` e
   a escala é inteira. Um píxel esbatido fica esbatido no ecrã.
2. **Sem gradientes suaves.** Sombreado por *dithering* ou por degraus de cor.
3. **Alinhamento exacto à grelha de 16.** Nada pode transbordar da sua célula —
   o motor corta pela grelha, não pelo desenho.
4. **Fundo transparente** em tudo menos o chão (bloco A), que é opaco.
5. **Paleta curta.** Quanto menos cores, mais coeso. Base sugerida abaixo.

## Paleta da marca

Já está em `design/tokens.ts` — usa estas como espinha dorsal e acrescenta
tons intermédios conforme precisares.

| Nome | Hex | Para |
|---|---|---|
| `azulejo` | `#1F4E9C` | o azul do azulejo, traço forte |
| `azulejo2` | `#7FA9D9` | o azul claro, preenchimento |
| `pergaminho` | `#F2E6CE` | o branco-creme do azulejo e da cal |
| `ouro` | `#C8961E` | latão, balança, esfera armilar |
| `verde` | `#046A38` | o verde da bandeira, panos |
| `vermelho` | `#A4161A` | lacre, o vermelho da bandeira |
| `tinta` | `#21201C` | contorno, ferro, tinta de escrever |

Para madeira, pedra e corda não há tokens — sugestão: madeira `#8B5E34` /
`#6B4423` / `#4A2F18`, pedra lioz `#D8D2C4` / `#B8B0A0`, corda `#C9A66B`.

---

## BLOCO A — CHÃO · linhas 0–1 · **PRIORIDADE MÁXIMA**

Este bloco sozinho muda a sala inteira. O chão actual são **quatro** tiles
repetidos 143 vezes cada — um motivo 2×2 alastrado por toda a planta. Desenha
32×32 píxeis e o chão está feito.

| Células | O quê |
|---|---|
| `(0,0)`–`(1,1)` | **Azulejo principal**, motivo 2×2. Padrão azul-e-branco de meados do séc. XVI: enxaquetado, ponta-de-diamante ou nó marinheiro. Tem de **repetir sem costura** nas quatro direcções — o motivo encosta a si próprio em grelha infinita. É o mais importante do ficheiro inteiro. |
| `(2,0)`–`(3,1)` | **Azulejo variante**, motivo 2×2. Mais rico, para o gabinete do Feitor. Mesma regra de repetição. |
| `(4,0)`–`(5,1)` | **Pedra lioz**, motivo 2×2. Lajeado irregular, tom creme-acinzentado. Para o armazém e a alfândega. |
| `(6,0)`–`(7,1)` | **Soalho de madeira**, motivo 2×2. Tábua corrida, para o lado da doca. |
| `(8,0)`–`(9,1)` | **Esteira / tapete**, motivo 2×2. Opcional. |

> **Teste da costura:** põe o motivo lado a lado 4×4 num editor. Se vires uma
> linha ou uma grelha fantasma, ainda não está.

## BLOCO B — PAREDES · linhas 2–3

Paredes precisam de peças de canto ou fazem esquinas partidas. A parede vê-se
sempre de frente (projecção a direito, sem perspectiva).

| Células | O quê |
|---|---|
| `(0,2)` | Parede de cal — face lisa, o tile de repetição |
| `(1,2)` | Parede de cal — remate de topo / cornija |
| `(2,2)` | Canto superior esquerdo |
| `(3,2)` | Canto superior direito |
| `(4,2)` | Rodapé / soco de azulejo (faixa azul no fundo da parede) |
| `(5,2)` | Junção em T / pilar |
| `(0,3)`–`(5,3)` | As mesmas seis peças, em **pedra aparelhada** (para o armazém) |

## BLOCO C — ARCOS E JANELAS · linhas 4–6

Estes são altos, por isso ocupam três linhas.

| Células | O quê |
|---|---|
| `(0,4)`–`(2,6)` | **Arco manuelino**, 3 × 3 tiles (48 × 48 px). Cordas de pedra torcidas, esferas armilares, cruz de Cristo. É a peça de assinatura do sítio. |
| `(3,4)`–`(4,5)` | **Janela com o Tejo**, 2 × 2. Vê-se água, e ao fundo uma **nau** de velas quadradas. Moldura de pedra. |
| `(5,4)`–`(6,5)` | **Janela fechada**, 2 × 2 — postigos de madeira |
| `(7,4)`–`(8,6)` | **Porta de armazém**, 2 × 3 — dupla, madeira e ferro |
| `(9,4)`–`(10,5)` | **Padrão / brasão** na parede, 2 × 2 — escudo das quinas |

## BLOCO D — ARMAZÉM · linhas 7–9

O que enche uma casa que recebia especiaria.

| Células | O quê |
|---|---|
| `(0,7)` | Barril de pé, 1 × 1 |
| `(1,7)`–`(2,8)` | Pilha de barris, 2 × 2 |
| `(3,7)` | Barril deitado |
| `(4,7)` | Saca de pimenta, atada com corda |
| `(5,7)`–`(6,8)` | Pilha de sacas, 2 × 2 |
| `(7,7)` | Caixote de madeira |
| `(8,7)`–`(9,8)` | Pilha de caixotes, 2 × 2 |
| `(10,7)` | Rolo de cordame |
| `(11,7)` | Âncora encostada |
| `(12,7)`–`(13,8)` | Fardo de pano / velame, 2 × 2 |
| `(0,9)`–`(3,9)` | Quatro variantes soltas: cesto, ânfora, tonel pequeno, rolo de tecido |

## BLOCO E — A CASA DE CONTAS · linhas 10–12

O trabalho de escritório da Casa. **Nota:** mesas de madeira, estantes, arcas e
lareira já existem no atlas `interiors.png` e vou reutilizá-las — só preciso do
que é específico da Casa.

| Células | O quê |
|---|---|
| `(0,10)`–`(1,11)` | **Balança de dois pratos**, 2 × 2 — latão. A alfândega pesava tudo. |
| `(2,10)`–`(3,11)` | **Esfera armilar**, 2 × 2 — a divisa de D. Manuel I |
| `(4,10)`–`(6,11)` | **Padrão Real**, 3 × 2 — o mapa-mestre numa mesa alta, ou pendurado |
| `(7,10)` | Livro de registo aberto, com pena |
| `(8,10)` | Pilha de livros de registo |
| `(9,10)` | Tinteiro e penas |
| `(10,10)` | Ampulheta |
| `(11,10)` | Castiçal aceso |
| `(12,10)` | Arca-forte ferrada (o Tesoureiro) |
| `(13,10)` | Astrolábio pendurado |
| `(0,12)`–`(2,12)` | Três variantes de rolos de carta / portulanos |

## Linhas 13–15 — livres

Deixa em branco. É a margem para o que faltar quando eu montar a planta.

---

## Se não deres tudo, esta é a ordem

1. **Bloco A, células `(0,0)`–`(1,1)`** — o azulejo principal. Sozinho vale mais
   do que todo o resto junto.
2. **Bloco B** — paredes. Sem elas o azulejo fica a flutuar.
3. **Bloco C, o arco e a janela com a nau** — é o que faz alguém perceber onde está.
4. **Bloco D** — barris e sacas. Enchem o armazém depressa.
5. **Bloco E** — o requinte.

Manda o que tiveres, mesmo incompleto. Monto a planta com o que houver e as
células vazias ficam com os tiles de madeira do `interiors.png`, que já servem.

---

## O que eu fiz quando o recebi

Fica aqui só para saberes que o encaixe estava pensado — está tudo feito.

- ✅ O atlas registado em `casadaindia/tema.ts` com **`firstgid: 2449`** (a seguir
  ao `interiors.png`, que ocupa 1025–2448)
- ✅ `assets/maps/ribeira.tmj` — a planta nova, 34 × 22 tiles, gerada por
  `tools/mapgen/build_ribeira.py`
- ✅ Os lugares, a adega, os adereços clicáveis e os catorze recados reancorados
  às coordenadas novas — e gerados para `casadaindia/planta.ts` pelo mesmo
  script que desenha o mapa, para não haver deriva
- ✅ O `office.tmj` fora do repositório, com o `brooklyn99.tmj`, os dois atlas do
  escritório e o selector de temas todo

## O que NÃO precisas de desenhar

As **personagens**. Os 15 oficiais são desenhados por código em
`casadaindia/retratos.ts`, a 18 × 28 píxeis, com slots de chapéu, capa, barba e
pala. Não há PNG nenhum de personagem neste projeto e não vai haver.
