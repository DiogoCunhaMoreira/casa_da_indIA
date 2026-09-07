# `casadaindia.png` — como se põe arte no chão

**512 × 512, 16 colunas × 16 linhas de células de 32 × 32 px.** É o único atlas
do chão: o `interiors.png`, que é de 16 px, saiu do mapa quando a arte passou a
32 e já não é desenhado em lado nenhum.

O ficheiro é **gerado**. Não o edites à mão — larga sprites e volta a correr, ou
este documento passa a mentir.

## O ciclo

```
1.  larga um PNG em  tools/mapgen/art/pecas/<nome>.png
2.  npm run arte      recorta as peças e redesenha a planta
3.  npm run cena      abre a cena no browser; recarrega-se sozinha
```

O passo 1 também se faz sem desenhar nada. As 46 peças que lá estão vieram da
PixelLab, e o `tools/mapgen/import_pecas.py` traz qualquer uma delas outra vez:

```
PIXELLAB_TOKEN=... python3 tools/mapgen/import_pecas.py            # o que faltar
PIXELLAB_TOKEN=... python3 tools/mapgen/import_pecas.py --refaz barril
```

O `art/pecas/FONTES.json` diz de onde vem cada peça e **porquê daquele gerador**
— a escolha está medida, não é gosto. Em resumo: chãos pelo `topdown_tileset`,
paredes pelo `tiles_pro`, adereços pelo `map_object` a 1 geração cada. O kit
inteiro custou 70 gerações.

`npm run cena` monta o **mesmo** `TiledMapRenderer`, a mesma `Camera` e o mesmo
`ThemeConfig` que o `OfficeFloor.tsx` monta dentro do Electron — o que fica de
fora é o store, os agentes, os terminais e o assistente de arranque. Isso é o
que faz o ciclo custar dois segundos em vez de quinze mais sete passos de
assistente por cada barril entregue.

Interruptores no canto (também por URL, `?grelha=1&colisao=1&spawns=1`): grelha
de tiles, camada de colisão, lugares e zonas, e cinco oficiais à escala real —
que é a única maneira de julgar se a mobília está do tamanho certo.

Para o rasterizador offline, que não precisa de browser nenhum:
`python3 tools/mapgen/render_map.py --labels`.

## Os sprites

Fundo transparente, tamanho à vontade — o construtor escala para a área que a
peça tem declarada. Os nomes são os do `tools/mapgen/pecas.py`, que é ao mesmo
tempo o vocabulário e a lista de compras:

| Grupo | Nomes | Área |
|---|---|---|
| chão | `chao-terracota-1..8`, `chao-lioz-1..4`, `esteira` | 1×1 |
| parede | `parede-reboco-1..6`, `parede-azulejo-1..5`, `parede-friso-1..4`, `parede-viga-1..4` | 1×1 |
| parede | `parede-vertical-1..2` (tabique de perfil), `parede-canto-1..4` | 1×1 |
| vãos | `porta` 2×3, `arco` 2×3, `janela` 2×2 | |
| mobília | `escrivaninha` 2×2, `mesa-comercio` 4×2, `arca` 3×2, `balanca` 1×2, `planta` 1×2, `mesa-refeitorio` 2×1, `banco` 2×1 | |
| mercadoria | `barril`, `barril-deitado`, `barril-espicha`, `saca-vermelha`, `saca-amarela`, `caixote`, `fardo` | 1×1 |
| adereços | `livro`, `pergaminho`, `castical` | 1×1 |

**Uma peça que não exista simplesmente não aparece.** O gerador da planta salta
a colocação e conta-a; o mapa sai à mesma. É esse o ponto — dá para ver o
cenário crescer peça a peça em vez de ser tudo ou nada. `npm run arte` imprime
sempre o que falta.

### Duas peças não precisam de arte

`escuro` é uma cor lisa gerada por código. `parede-vertical-*` deriva-se de uma
face de reboco queimando-lhe uma goteira de sombra nos dois bordos — um tabique
visto de perfil é outro tile que não uma face de parede, e usar uma face aqui
lê-se como uma tira pálida de chão. Ambas aceitam um ficheiro próprio, que ganha.

### Duas regras que não são gosto

**`escrivaninha` nunca é espelhada.** A cadeira desenhada na célula inferior
esquerda **é** o lugar sentado — é lá que o gerador ancora o spawn point e é lá
que o agente aparece. Espelhá-la punha a cadeira do outro lado do tile.

**`parede-canto-*` também não.** Cada canto aponta para o seu lado.

Tudo o resto que lê igual dos dois lados leva `espelhavel=True` e o gerador
vira-a em cara-ou-coroa, o que duplica o número de variantes aparentes sem
ninguém desenhar nada.

## O que o construtor faz à arte

**Não quantiza a paleta.** O atlas de 16 px encostava cada píxel a 27 cores da
marca para segurar um aspecto pixelado à mão. Esta arte é pintada e a cor *é* o
detalhe.

Faz três coisas, todas medidas:

**Recorta os chãos por dentro do bordo pintado** (`INSET_CHAO`, 4 px). Um tile
de chão costuma vir desenhado com a sua própria argamassa à volta; encostando
dois, cada junta da sala carrega os dois bordos. Medido no chão anterior, essa
junta ficava **~48 níveis de cinzento** abaixo do interior do tile contra **±5**
de variação lá dentro — uma gaiola de 32 px dez vezes mais forte do que tudo o
que as variantes tinham para dizer, e o olho parava de ver tijoleira para ver a
grelha. Cortar 4 px de cada lado deixa uma junta em vez de duas empilhadas, e
mediu-se a descer de 52 para 20.

**Dá aos adereços uma sombra de contacto** derivada da própria silhueta. Sem
ela, cada barril e cada arca lê-se como um autocolante pousado no chão em vez de
um objecto de pé.

**Harmoniza o tom das variantes de chão** (`harmoniza_chaos`, 75% do caminho até
à `-1` da família). Cada variante vem da sua própria chamada à PixelLab, e o
gerador trata "terracota mais escura" como *outro terreno* e não como outra
tijoleira do mesmo chão. Como chegaram, a terracota espalhava-se por **45 níveis
de luma** entre variantes e o lioz por **78** — mais do que os 48 da gaiola que
o `INSET_CHAO` foi criado para matar. O olho não via variedade, via manta de
retalhos. Depois de harmonizar: 11.5 e 19.6. Não vai a 100% de propósito, senão
sobravam oito cópias do mesmo tile.

## Porquê 32 px e não os 16 de antes

A arte é pintada, não pixelada. A 16 px uma tijoleira perde as juntas, o azulejo
vira ruído e um barril perde as aduelas — a arte nova chegaria com exactamente o
detalhe da que veio substituir. 32 é a célula mais pequena onde tudo ainda se lê.

O mapa (40 × 28 = 1280 × 896), a câmara e a escala das personagens foram atrás.
As personagens continuam a ser os 18 × 32 píxeis colocados à mão no
`portraitArt.ts`, desenhados a 2× — ficam do mesmo tamanho no ecrã que tinham, e
visivelmente mais grosseiras do que o chão que pisam. Redesenhá-las nativamente
a 36 × 64 é reescrever esse ficheiro inteiro, píxel a píxel.

## O caminho de volta

`npm run arte -- --folha` reactiva os recortes da folha pintada arquivada em
`tools/mapgen/art/casadaindia-sheet.png` para as 46 peças que ela cobre, e repõe
o chão como estava antes de se começar a entregar sprites um a um. Um ficheiro
próprio em `art/pecas/` ganha sempre à folha.
