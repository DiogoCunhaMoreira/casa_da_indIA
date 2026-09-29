<div align="center">

# casa_da_indIA

### A Casa da Índia, com naus de código

*Um enxame local de agentes de IA à maneira da casa que, em Lisboa, armava as
armadas: o Feitor despacha, as naus partem, e tudo se regista.*

<p>
  <em>Electron · React · TypeScript · Godot · xterm.js · node-pty</em>
</p>

</div>

---

## O que é

Um *fork* português do [**Munder Difflin**](https://github.com/chaitanyagiri/munder-difflin),
de Chaitanya Giri — um harness multi-agente que envolve as CLIs de código que já usas
como avatares a trabalhar num piso partilhado, com um orquestrador a despachar trabalho
e a escalar-te o que interessa.

Este fork suporta três motores: **Claude Code**, **Codex** (ChatGPT) e **OpenCode** para
modelos locais (LM Studio, Ollama, vLLM ou outro servidor compatível com OpenAI).

O upstream é uma paródia do *The Office*. Este fork troca-a pela **Casa da Índia**, a
instituição que em Lisboa geria o comércio ultramarino da Coroa — e que era, na prática,
um escritório: alfândega, armazém, contabilidade e arquivo. O orquestrador é o **Feitor**,
que despachava armadas sem nunca embarcar em nenhuma.

E o nome é o que é: **Casa da Ind**·**IA**.

## Duas coisas que este fork faz de diferente

**1. A nomenclatura é histórica, não inventada.** Os cargos da aplicação são os cargos
reais da Casa:

| Na aplicação | Na Casa da Índia |
|---|---|
| orquestrador | **Feitor** — Fernão Lourenço ocupou o cargo c. 1481–1504 |
| tu, a quem se escala | **Vedor da Fazenda**, e acima dele o Rei |
| *system prompt* / manual | **Regimento** — o de 1509 dizia a cada oficial o que fazer e o que registar |
| relatórios, PRs | **Escrivão** — era o cargo de Caminha na feitoria de Calecute |
| orçamento | **Tesoureiro** |
| índice semântico | **Padrão Real** — o mapa-mestre, guardado sob sigilo |
| infraestrutura | **Armazéns da Guiné e Índia** |
| agente remoto | **feitoria** — entreposto longe da sede, com correio irregular |
| tarefa de longo curso | **Carreira da Índia** |

O *regimento* é o achado: era a instrução escrita entregue a cada oficial. É um system
prompt, em 1509.

**2. Fala português a sério.** A interface está traduzida para PT-PT, e os agentes são
instruídos a responder, documentar e escrever commits em português europeu — em qualquer
motor, não só nos locais. Ver [Português](#português) abaixo.

## O elenco

Quinze oficiais documentados, todos vivos e ativos na mesma janela: **Lisboa, c. 1500–1516**,
no reinado de D. Manuel I.

| Figura | Datas | Papel |
|---|---|---|
| **Fernão Lourenço** | fl. 1481–1504 | orquestrador — Feitor e Tesoureiro da Casa |
| **Vasco da Gama** | 1469–1524 | agente de longo curso |
| **Pedro Álvares Cabral** | c.1467–1520 | resolve brilhantemente o *ticket* errado |
| **Bartolomeu Dias** | c.1450–1500 | disjuntor — morreu numa tormenta ao largo do Cabo que dobrara |
| **Pêro da Covilhã** | c.1460–depois de 1526 | investigação — partiu em 1487 e nunca voltou |
| **Pêro Vaz de Caminha** | c.1450–1500 | escrivão — relatórios e PRs |
| **Duarte Pacheco Pereira** | c.1460–1533 | defesa e testes |
| **Fernão de Magalhães** | c.1480–1521 | o agente que se passou para outro fornecedor |
| **Tomé Pires** | c.1465–1540 | documentação |
| **Duarte Barbosa** | c.1480–1521 | tradução — era intérprete de malaiala |
| **Afonso de Albuquerque** | 1453–1515 | operações destrutivas |
| **Francisco de Almeida** | c.1450–1510 | comando de primeira linha |
| **Francisco Rodrigues** | fl. até 1515 | cartas e roteiros |
| **Rui Faleiro** | m. c.1523 | dados e cálculo |
| **D. Leonor de Viseu** | 1458–1525 | políticas e aprovações |

As personagens são modelos procedurais do mundo em Godot (`godot/casa-da-india`), e os
retratos são renderizados a partir deles — não há arte licenciada. O elenco vive em
`src/renderer/src/elenco/`.

### O que este fork não faz

Os documentos que deram origem a este projeto propunham o **Infante D. Henrique** como
orquestrador da Casa da Índia. Isso não pode ser: o Infante morreu em **1460** e a Casa da
Índia foi fundada por volta de **1500–1503**. Nunca se cruzaram. Verificado o resto do
elenco proposto, abrangia três séculos.

Por isso não há aqui nem Infante, nem Gil Eanes, nem Zarco (cedo demais), nem Diogo Cão
(morreu antes de a Casa existir), nem Zacuto (deixou Portugal em 1497), nem Camões
(n. 1524) nem Fernão Mendes Pinto (embarcou em 1537) — tarde demais.

Duas ressalvas assumidas, ditas em vez de escondidas:

1. **D. Leonor de Viseu** era patrona régia, não oficial da Casa.
2. **Gama, Albuquerque, Almeida, Pires e Barbosa** estavam no Índico e não em Lisboa — que
   é precisamente o que os torna bons agentes destacados.

## Português

Há duas camadas, e só uma delas é frágil.

**A interface** está em PT-PT (`i18n/locales/pt-PT.json`). Escolhe *Português* em
Definições → Geral.

**A saída dos agentes** vem do **regimento** (`src/shared/regimento.ts`), acrescentado ao
prompt de cada nau. É instrução, não modelo — e por isso funciona em qualquer motor,
incluindo os que não se podem apontar a um servidor local. Controla-se por
`agentLanguage` na configuração.

### Amália

O [Amália](https://ia.gov.pt) (9B, aberto, PT-PT) serve-se localmente por LM Studio, Ollama
ou vLLM, e liga-se em **Definições → Agentes e modelos** como ligação local, que o OpenCode
usa. É configuração, não código.

**O aviso que interessa:** o Amália não foi treinado como agente de código. Esses motores
correm ciclos de ferramentas de várias voltas (ler → editar → correr → observar), e um
modelo de 9B tende a falhar esse ciclo de forma suja — chamadas mal formadas, ciclos, ou
conteúdo de ficheiros inventado. A lista de modelos locais do próprio upstream começava
nos **20B**.

Dá-lhe antes o que ele faz bem, que é a língua: relatórios e PRs (o papel do Caminha),
tradução, e condensação de memória. A tradução completa de `pt-PT.json` neste repositório
foi feita por ele.

> **Arquitetura honesta:** o código conduzido por uma CLI de código, a língua pelo Amália.

## Começar

```bash
npm install          # o postinstall faz electron-rebuild — precisa das Xcode CLT no macOS
npm run dev
```

```bash
npm run typecheck    # tsconfig.node + tsconfig.web
npm run test:focused # node --test test/*.test.cjs
npm run build
```

## Créditos e licenças

Este projeto é um fork de **[Munder Difflin](https://github.com/chaitanyagiri/munder-difflin)**,
de **Chaitanya Giri**, sob licença MIT. O trabalho difícil — o harness, o protocolo do
enxame, a camada i18n — é dele. Aqui mudou-se o tema, o elenco, a língua e o mundo, que
passou a ser em Godot.

- **Código:** MIT. Ver [`LICENSE`](./LICENSE), que se mantém intacto, com o aviso de
  direitos de autor do autor original.
- **Arte:** o mundo e os retratos são procedurais, código deste projeto, cobertos pela MIT.
  Versões anteriores usavam tilesets *Modern Interiors* do **[LimeZu](https://limezu.itch.io/)**;
  já não são distribuídos. Ver [`ATTRIBUTION.md`](./src/renderer/src/assets/ATTRIBUTION.md).
- **Figuras históricas:** domínio público.

## Sobre o registo

Isto é uma paródia de escritório com fato de época — não uma celebração do império.

A Casa da Índia administrava um monopólio régio que incluía o tráfico de escravos. Um
projeto que faz questão de acertar nos nomes dos cargos não deve ter pudor em nomear
também isso. As figuras aqui são funcionários de uma burocracia, tratados como colegas de
escritório: alguém que resolve o problema errado com muita confiança, alguém que parte
numa investigação e nunca mais dá notícias, alguém que se passa para a concorrência.

Se o tom escorregar para épico-nacionalista, é para corrigir.
