# Arte de conceito do elenco

Os quinze oficiais como arte de conceito, renomeados pelos `id` do `elenco.ts`.
Origem: `~/Downloads/sprites 2/sprite-<linha>-<coluna>.png`, por ordem de leitura
(3 linhas × 5 colunas), que corresponde exactamente à numeração dos blocos da
Secção B do prompt que os gerou.

| Origem | id | O que confirma |
|---|---|---|
| 1-1 | `lourenco` | corrente de ouro ao peito, molho de chaves, barrete preto |
| 1-2 | `gama` | cruz vermelha da Ordem de Cristo, capa azul sobre creme, espada |
| 1-3 | `cabral` | barba ruiva, sem chapéu, gibão verde, mapa aberto nas duas mãos |
| 1-4 | `dias` | capuz posto, capa cinzento-azul rasgada, lanterna |
| 1-5 | `covilha` | pano de cabeça creme e ocre, alforge a tiracolo |
| 2-1 | `caminha` | pena branca ao alto, colarinho creme, imberbe |
| 2-2 | `pacheco` | morrião, peitoral sobre túnica vermelha, escudo redondo |
| 2-3 | `magalhaes` | ouro e vermelho **sem cruz**, chapéu de aba levantada, bússola |
| 2-4 | `pires` | livros às costas, túnica verde, bolsas de especiaria |
| 2-5 | `barbosa` | robe azul aberto, faixa às riscas, mão levantada a meio do gesto |
| 3-1 | `albuquerque` | barba branca até ao peito, capa vermelha, espada ao ombro |
| 3-2 | `almeida` | pluma branca única, manto azul de debrum dourado, bastão |
| 3-3 | `rodrigues` | três cartas enroladas sob o braço, coifa creme, gibão de couro |
| 3-4 | `faleiro` | cabelo desgrenhado, robe índigo com estrelas, astrolábio |
| 3-5 | `leonor` | toucado com aro dourado, vestido vermelho de corte, carta selada |

## Estas NÃO são pixel art

Medido: 19 000 a 26 000 cores únicas cada, sem grelha de píxeis nativa (bloco
1×1), bordos com anti-aliasing e gradientes na pele. São ilustrações pintadas em
*estilo* pixel art. Reduzidas directamente viram papa, e violam a regra 1 do
`CASA-DA-INDIA-SPEC.md`.

Servem como **conceito**, não como sprite. Quem as consome é o
`create_portrait_character` da PixelLab, que as reinterpreta em pixel art a
sério.

## `refs/`

As mesmas quinze a **192 px, 32 cores, sem dithering**. Duas razões:

1. A quantização tira o anti-aliasing que as torna más referências.
2. Cabem em ~29 KB de base64, e a documentação do MCP avisa que os clientes
   truncam base64 grande a meio da string e corrompem a imagem em silêncio.

## A cadeia por MCP

```
create_portrait_character   image = refs/<id>.png
                            direction = portrait_to_character
                            view = low top-down
                            result_size = 128
get_portrait_character      → URL HTTPS do sprite em pixel art

create_character            mode = "v3"   (obrigatório com imagem de referência)
                            reference_image_url = <o URL de cima>
                            description = bloco da Secção B do oficial
                            size = 128 · view = low top-down · n_directions = 8

animate_character           template_animation_id = "walking-4-frames"
animate_character           template_animation_id = "breathing-idle"
```

Modo template custa 1 geração por direcção: 8 + 8 = 16 por personagem.

**Excepção, a Leonor.** O vestido tapa as pernas e o template é um esqueleto que
mexe pernas. Para ela, modo v3 com `action_description` a descrever o balanço da
bainha.

## Estado

- `gama` — feito à mão na app web (rotações + marcha e parado em 4 direcções).
  **Confirmar que descrição ficou guardada**: pode ter ficado a do Caminha.
- Os outros catorze — por fazer.
