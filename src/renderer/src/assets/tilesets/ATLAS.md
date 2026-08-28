# `casadaindia.png` — o que ficou onde

**512 × 512, 16 colunas × 16 linhas de células de 32 × 32 px.** É o único atlas
do chão: o `interiors.png`, que é de 16 px, saiu do mapa quando a arte passou a
32 e já não é desenhado em lado nenhum.

Gerado por `tools/mapgen/build_atlas.py` a partir de uma folha pintada única,
`tools/mapgen/art/casadaindia-sheet.png` (1448 × 1086, 29 peças a ~120 px por
tile de chão). Não edites o PNG à mão — muda o recorte no gerador e volta a
correr, ou este ficheiro passa a mentir.

## Porquê 32 e não 16

O chão andou a 16 px por tile enquanto a arte era pixelada. Esta é pintada, e a
16 px a tijoleira perde as juntas, o azulejo vira ruído e o barril perde as
aduelas — a arte nova chegaria com exactamente o detalhe da que veio substituir.
32 é a célula mais pequena onde todas as peças da folha ainda se leem.

O mapa (40 × 28 = 1280 × 896), a câmara e a escala das personagens foram atrás.
As personagens continuam a ser os 18 × 32 píxeis colocados à mão no
`portraitArt.ts`, desenhados a 2× — ficam do mesmo tamanho no ecrã que tinham,
e visivelmente mais grosseiras do que o chão que pisam.

## Duas coisas que o gerador antigo fazia e este não

- **Não quantiza a paleta.** O atlas de 16 px encostava cada píxel a 27 cores da
  marca para segurar um aspecto pixelado à mão. Esta arte é pintada e a cor
  *é* o detalhe — posterizá-la seria a única edição capaz de desfazer o ponto
  todo do exercício.
- **Não costura os chãos.** Cada célula de chão da folha é um tile completo com
  a sua própria junta, por isso cortar pela junta partilhada faz com que encostem
  bem sem mais trabalho nenhum.

---

## A planta do atlas

| Linha | Colunas | O quê |
|---|---|---|
| **0** | 0–7 | **Tijoleira de terracota**, oito padrões e níveis de desgaste |
| **0** | 8–11 | **Pedra lioz**, quatro lajes claras |
| **1** | 0–5 | **Reboco de cal**, seis faces — algumas com pedra à vista na base |
| **1** | 6–10 | **Silhar de azulejo**: três padrões e duas esferas armilares |
| **1** | 11–14 | **Friso de pedra**, quatro molduras (rodapé e cornija) |
| **2** | 0–3 | **Vigas de tecto**, quatro segmentos feitos para correr uns nos outros |
| **2** | 4 | **Escuro** — o que há fora das paredes. *Derivado, não vem da folha.* |
| **2** | 5–6 | **Parede vertical**, duas variantes. *Derivada* — ver abaixo |
| **3–5** | 0–1 | **Porta** de duas folhas com arco de pedra, 2 × 3 |
| **3–4** | 2–3 | **Janela** geminada de pedra, 2 × 2 |
| **3–4** | 4–6 | **Arca** entalhada, 3 × 2 |
| **3–4** | 7–10 | **Mesa de comércio** — o mapa aberto, o livro, as moedas, 4 × 2 |
| **3–4** | 11–12 | **Escrivaninha** com cadeira, 2 × 2 |
| **3–4** | 13 | **Balança** de pratos sobre o seu suporte, 1 × 2 |
| **6** | 0–7 | saca vermelha · saca amarela · caixote · fardo · barril · livro · pergaminho · castiçal |
| **6** | 8–9 | **Banco** comprido, 2 × 1 |

Tudo o que não é chão nem parede está ancorado **em baixo ao centro** da sua
caixa, para assentar no chão em vez de flutuar.

## As duas peças derivadas

A folha dá faces de parede, que é tudo o que uma parede virada a sul precisa. Um
tabique visto de perfil é outro tile, e usar uma face para isso lê-se como uma
tira pálida de chão. As células `(5,2)` e `(6,2)` são tiles de reboco com uma
goteira de sombra queimada nos dois bordos, que é o que lhes dá a espessura.

A `(4,2)` é lisa, no tom em que as vigas estão pintadas.

## Um retoque na arte

A balança foi pintada contra um painel de ardósia que faz parte do quadro, não
do objecto — largado num chão de terracota lia-se como um buraco preto. É a
única coisa **neutra** do recorte (R≈G≈B à volta de `#303032`, enquanto todos os
outros píxeis escuros da peça são castanhos quentes ou dourados saturados), por
isso sai com um teste de saturação, sem tolerância nenhuma para afinar.

## Ainda por desenhar

Por ordem de quanto se nota:

1. **Uma planta de vaso** — sem ela não há recados de `water` nesta casa, e o
   motor sabe regá-las (`Character.startWatering`). É a única mecânica de ócio
   que está desligada por falta de arte.
2. **Cantos de parede**, interiores e exteriores. Não há: as esquinas encostam
   face a face e safam-se porque a arte é pintada, mas nota-se.
3. **Uma mesa lisa de refeitório.** A adega usa dois bancos, um por tampo e
   outro por assento. Lê-se, mas é um remendo.
4. **Variantes de barril** — de pé, deitado, de espicha. Há um só, e a adega
   repete-o sete vezes em fila.
5. **Um arco ou passagem aberta**, para os vãos das paredes interiores serem
   alguma coisa em vez de um buraco.
6. **Uma esteira ou tapete**, para quebrar os corredores da casa de contas.
7. **A janela com o Tejo** — a que veio tem vidro escuro. Ver o rio e uma nau lá
   ao fundo é o que faz alguém perceber onde está.
