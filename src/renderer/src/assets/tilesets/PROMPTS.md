# Prompts para o modelo de imagem

Um prompt por peça. **Não peças o atlas todo de uma vez** — nenhum modelo acerta
na grelha de 16 px, e o resultado vem sempre com *anti-aliasing* e fora de
alinhamento.

## Como usar

1. Gera **uma peça de cada vez**, no tamanho que o modelo quiser (grande é bom).
2. Manda-me os PNG em bruto. Eu faço a redução para 16 px por tile, a
   posterização para a paleta, o *snap* à grelha e o teste de costura.
3. Se o modelo insistir em fundos brancos, pede "transparent background" e, se
   não obedecer, deixa branco liso — eu recorto.

**O que vai correr mal, e não faz mal:** contornos esbatidos, cores a mais,
tamanhos estranhos. Tudo isso se corrige na pós-produção. O que **não** se
corrige é composição errada — se o arco não for simétrico, ou o azulejo não for
concebido para repetir, tem de voltar ao modelo.

## Paleta a colar em todos os prompts

```
#1F4E9C azul de azulejo    #7FA9D9 azul claro      #F2E6CE branco-pergaminho
#C8961E ouro/latão         #046A38 verde           #A4161A vermelho
#21201C tinta (contorno)   #8B5E34 madeira         #D8D2C4 pedra lioz
```

---

## 1 · AZULEJO PRINCIPAL — a peça mais importante

> Pixel art tile, 16-bit SNES style, top-down orthogonal floor tile for a
> tile-based game. A single square motif of a 16th-century Portuguese *azulejo*
> floor tile, blue and white, painted-ceramic look.
>
> The motif MUST be **seamlessly tileable**: the pattern continues perfectly
> when the square is repeated edge-to-edge in an infinite grid, in all four
> directions. Design it as a repeating unit, not as a framed picture. No border,
> no frame, no vignette, no drop shadow, nothing that breaks at the seam.
>
> Pattern: geometric *enxaquetado* or diamond-point (*ponta de diamante*)
> lattice, with small stylised curls at the corners. Flat colour only.
>
> Palette, strictly: #1F4E9C deep blue for the linework, #7FA9D9 mid blue for
> fills, #F2E6CE warm off-white for the ceramic ground. Three colours, no more.
>
> Hard style rules: crisp hard-edged pixels, NO anti-aliasing, NO gradients, NO
> soft shading, NO blur, NO outline glow, NO text, NO watermark. Perfectly
> square. Viewed straight from above, zero perspective.

**Pede 3 ou 4 variações** e escolho a que repete melhor.

## 2 · AZULEJO DO GABINETE — variante rica

Igual ao anterior, mas troca o parágrafo do padrão por:

> Pattern: a denser, more ornate *azulejo* — interlacing ribbons and a stylised
> maritime knot, still strictly geometric and still seamlessly tileable.

## 3 · PAREDES

> Pixel art wall tiles, 16-bit SNES style, for a tile-based game. A horizontal
> strip showing SIX separate wall pieces, side by side, evenly spaced, each one
> a square of identical size, with clear gaps between them:
>
> 1. plain lime-plastered wall face (the repeating piece)
> 2. wall top / stone cornice
> 3. top-left corner
> 4. top-right corner
> 5. a blue-and-white *azulejo* dado — a decorative tiled band running along the
>    bottom of the wall
> 6. a stone pillar / T-junction
>
> Setting: the interior of a 16th-century Portuguese royal customs house in
> Lisbon. Whitewashed lime plaster over stone.
>
> Seen **flat-on, straight from the front, with zero perspective** — this is a
> flat game tileset, not a rendered scene.
>
> Palette: #F2E6CE plaster, #D8D2C4 and #B8B0A0 stone, #1F4E9C and #7FA9D9 for
> the azulejo band, #21201C for outlines.
>
> Hard style rules: crisp hard-edged pixels, NO anti-aliasing, NO gradients, NO
> soft shading, NO blur, NO text. Transparent background.

## 4 · ARCO MANUELINO — a peça de assinatura

> Pixel art architectural element, 16-bit SNES style, for a tile-based game. A
> single **Manueline** stone archway — the Portuguese late-Gothic style of King
> Manuel I, c. 1500.
>
> Carved into the stone of the arch: twisted rope mouldings (the signature
> Manueline motif), a small **armillary sphere** at the keystone, and a **Cross
> of the Order of Christ** — a red cross with flared arms. Sea-rope and knot
> carvings down the jambs.
>
> Seen **flat-on, straight from the front, perfectly symmetrical, with zero
> perspective**. Square-ish overall proportion. The opening is dark.
>
> Palette: #D8D2C4 and #B8B0A0 for the stone, #C8961E for the armillary sphere,
> #A4161A for the cross, #21201C for outlines.
>
> Hard style rules: crisp hard-edged pixels, NO anti-aliasing, NO gradients, NO
> blur, NO text. Transparent background.

## 5 · JANELA COM A NAU

> Pixel art window, 16-bit SNES style, for a tile-based game. A square stone
> window in a whitewashed wall, seen **flat-on from inside a room, zero
> perspective**.
>
> Through the opening: the river Tagus under a pale sky, and on the water a
> single **Portuguese nau** — a 16th-century carrack with square sails, seen
> small and in the distance, sails bearing a red Cross of the Order of Christ.
>
> Palette: #D8D2C4 stone frame, #7FA9D9 water and sky, #F2E6CE sails, #A4161A
> the cross, #8B5E34 the hull, #21201C outlines.
>
> Hard style rules: crisp hard-edged pixels, NO anti-aliasing, NO gradients, NO
> blur, NO text. Keep the ship SIMPLE and readable — it will be shown very
> small. Transparent background outside the stone frame.

## 6 · ARMAZÉM — adereços

> Pixel art props sheet, 16-bit SNES style, for a tile-based game. A neat grid
> of SEPARATE objects, evenly spaced with clear gaps between them, each drawn
> whole and not overlapping:
>
> a wooden barrel standing upright; a stack of three barrels; a barrel lying on
> its side; a bulging jute sack tied with rope (a pepper sack); a stack of four
> pepper sacks; a wooden crate; a stack of crates; a coiled length of ship's
> rope; an iron anchor leaning against nothing; a bale of folded sailcloth; a
> wicker basket; a small clay amphora.
>
> Setting: the warehouse of a 16th-century Portuguese spice trading house.
>
> Seen from a **high three-quarter top-down game angle**, all objects at the
> same angle and the same scale, lit from the top-left.
>
> Palette: #8B5E34 / #6B4423 / #4A2F18 wood, #C9A66B rope and jute, #21201C iron
> and outlines, small touches of #C8961E.
>
> Hard style rules: crisp hard-edged pixels, NO anti-aliasing, NO gradients, NO
> blur, NO text, NO labels, NO drop shadows on the background. Transparent
> background.

## 7 · CASA DE CONTAS — adereços

> Pixel art props sheet, 16-bit SNES style, for a tile-based game. A neat grid
> of SEPARATE objects, evenly spaced with clear gaps between them, each drawn
> whole and not overlapping:
>
> a brass two-pan balance scale; an **armillary sphere** on a wooden stand (the
> emblem of King Manuel I of Portugal); a large nautical chart unrolled on a
> table, drawn with rhumb lines and a compass rose; an open leather-bound ledger
> with a quill resting on it; a stack of closed ledgers; an inkwell with quills;
> an hourglass; a lit candlestick; an iron-banded strongbox chest; a brass
> **astrolabe**; three rolled-up portolan charts.
>
> Setting: the counting room of a 16th-century Portuguese royal trading house.
>
> Seen from a **high three-quarter top-down game angle**, all objects at the
> same angle and the same scale, lit from the top-left.
>
> Palette: #C8961E brass, #8B5E34 / #6B4423 wood, #F2E6CE parchment, #A4161A
> wax seals, #21201C iron and outlines.
>
> Hard style rules: crisp hard-edged pixels, NO anti-aliasing, NO gradients, NO
> blur, NO text on the charts (illegible squiggles only), NO labels, NO drop
> shadows on the background. Transparent background.

---

## Uma nota sobre o ângulo

Repara que os prompts pedem **duas** perspectivas diferentes, e isso é de
propósito:

- **Chão, paredes, arcos e janelas** → de frente, sem perspectiva nenhuma
- **Adereços soltos** (barris, balança, arcas) → três-quartos de cima

É assim que o atlas do LimeZu que já usamos está feito. Se os adereços vierem
de frente, ficam a flutuar; se as paredes vierem em três-quartos, não encaixam.

## Se o modelo te der luta no azulejo

O azulejo é o único que tem uma exigência que os modelos falham muito: repetir
sem costura. Se ao fim de três tentativas não vier bom, diz-me — 32 × 32 píxeis
de padrão geométrico é pequeno o suficiente para eu o escrever à mão em código,
como já são os retratos.
