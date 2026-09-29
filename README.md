<div align="center">

# casa_da_indIA

### A Casa da Índia, com naus de código

*Um enxame local de agentes de IA à maneira da casa que, em Lisboa, armava as
armadas: o Feitor despacha, as naus partem, e tudo se regista.*

<p>
  <em>Electron · React · TypeScript · Godot · xterm.js · node-pty</em>
</p>

<p>
  <a href="#o-que-é">O que é</a> ·
  <a href="#como-funciona">Como funciona</a> ·
  <a href="#funcionalidades">Funcionalidades</a> ·
  <a href="#o-elenco">O elenco</a> ·
  <a href="#a-tasca-portuguesa">A Tasca</a> ·
  <a href="#português">Português</a> ·
  <a href="#começar">Começar</a>
</p>

</div>

---

## O que é

Uma aplicação para o computador que transforma as CLIs de código que já usas — **Claude Code**,
**Codex** e **OpenCode** — numa equipa. Cada agente é um processo real num terminal real,
com a sua pasta, o seu modelo e a sua memória. Por cima deles, um orquestrador — o
**Feitor** — reparte o trabalho, responde ao que é rotina e só te chama a ti para o que
interessa.

Tu vês tudo: os terminais, o quadro de tarefas, as mensagens que os agentes trocam entre
si, o que custam, e um mundo 3D em Godot onde cada oficial da Casa anda pelas salas
conforme o que o seu agente está a fazer.

Corre tudo na tua máquina. Não há servidor nosso, nem é preciso criar conta.

É um *fork* português do [**Munder Difflin**](https://github.com/chaitanyagiri/munder-difflin),
de Chaitanya Giri. O upstream é uma paródia do *The Office*; este troca-a pela **Casa da
Índia**, a instituição que em Lisboa geria o comércio ultramarino da Coroa — e que era, na
prática, um escritório: alfândega, armazém, contabilidade e arquivo.

E o nome é o que é: **Casa da Ind**·**IA**.

## Como funciona

```
                         ┌──────────────┐
                         │      Tu      │  Vedor da Fazenda
                         └──────▲───────┘
                                │  só o que é crítico
                         ┌──────┴───────┐
                         │    Feitor    │  orquestrador
                         └──────┬───────┘
                 despacha       │       responde ao rotineiro
          ┌─────────────┬───────┴─────┬─────────────┐
          ▼             ▼             ▼             ▼
      ┌───────┐     ┌───────┐     ┌───────┐     ┌───────┐
      │  nau  │     │  nau  │     │  nau  │     │  nau  │   agentes (Claude Code,
      └───┬───┘     └───┬───┘     └───┬───┘     └───┬───┘   Codex, OpenCode)
          └─────────────┴──────┬──────┴─────────────┘
                               ▼
               ┌───────────────────────────────┐
               │   a colmeia — um repo git     │  inbox/ · outbox/ · memory.md
               │   local, um único escrivão    │  tarefas · quadro partilhado
               └───────────────────────────────┘
```

- **Cada agente escreve só na sua pasta.** As mensagens saem pelo `outbox/` de um e o
  processo principal entrega-as no `inbox/` de outro. Nenhum ficheiro tem dois escritores.
- **Só a aplicação faz commits.** Tudo o que a equipa sabe fica num repositório git local,
  com histórico — o arquivo da Casa. Nenhum agente toca no `.git`.
- **O ciclo é autónomo.** Quando um agente acaba, um *hook* faz-lhe esvaziar a caixa de
  entrada antes de parar. Se ficar parado com correio por ler, um vigia acorda-o.
- **O controlo vai pelos hooks, não pelo teclado.** Bloquear ferramentas, parar ou orientar
  um agente viaja pelo protocolo de hooks da própria CLI — nada é escrito no terminal dele.

O desenho completo está em [`HIVE.md`](./HIVE.md) e [`SPEC.md`](./SPEC.md).

## Funcionalidades

### ⚓ A armada — os agentes

- **Três motores:** Claude Code, Codex (ChatGPT) e OpenCode — este último para modelos
  locais em LM Studio, Ollama, vLLM ou qualquer servidor compatível com OpenAI.
- **Novo agente em quatro partes:** identidade (nome, personagem, cor), espaço de
  trabalho (pasta, isolamento, retomar sessão), motor (fornecedor, modelo, comando) e
  instruções (descrição e objetivo).
- **Worktrees isoladas:** um agente pode trabalhar na sua própria *git worktree*, sem pisar
  os ficheiros dos outros — com as dependências do projeto disponíveis lá dentro.
- **Mudar de modelo sem perder a conversa:** dentro do mesmo fornecedor, a sessão é
  retomada.
- **Restaurar a equipa:** depois de fechares e voltares a abrir, **Reiniciar e continuar**
  põe todos os agentes a trabalhar outra vez, ao mesmo tempo, a partir de onde tinham ficado.
- **Nomes editáveis** e uma nota privada por agente, só para ti.

### 🧭 O Feitor — o orquestrador

- Recebe o trabalho, reparte-o pelos agentes que já existem e resolve sozinho o que é
  rotina: esclarecimentos, pedidos de dados, ajustes ao plano.
- **Contrata trabalhadores efémeros** para uma única tarefa: arrancam, fazem o trabalho,
  dão conta do resultado e saem. Estão todos à vista no separador **Trabalhadores**.
- **Passa-te a ti o que é crítico** — operações destrutivas, gastos, mudanças de âmbito,
  conflitos sem solução — no separador **Perguntas**, com markdown, respostas encadeadas e
  aviso de quando uma pergunta está a bloquear outras tarefas.
- **Conversa a dois:** pede ao Feitor que deixe um agente em paz enquanto falas com ele.
- O motor do Feitor é escolhido por ti, como o de qualquer outro agente.

### 📜 Coordenação — a colmeia

- **Quadro de tarefas** em quatro colunas — *Por fazer*, *Em curso*, *Bloqueadas*,
  *Concluídas* — com o id de cada cartão (`bmt-12`) e a vista de detalhe com o histórico de
  perguntas e respostas.
- **Mensagens entre agentes**, agrupadas em conversas, para leres e responderes.
- **Equipa:** o estado de cada agente num relance — *a pensar*, *a trabalhar*, *à espera*,
  *precisa de ti*, *a compactar*, *em ciclo* — com a ocupação do contexto.
- **Fila de mensagens:** escreve enquanto o agente está ocupado e a mensagem sai quando ele
  puder recebê-la. Aceita anexos (ficheiros e imagens), e mostra porque é que está retida.

### 🛡️ Controlo e segurança

- **Bloquear ferramentas:** o agente continua a pensar e a falar contigo, mas não lê,
  escreve nem executa nada. Imediato e reversível.
- **Parar após este passo:** deixa acabar o que está a fazer e para, com a sessão intacta.
- **Orientar:** envia uma nota que lhe chega como contexto na vez seguinte, sem o
  interromper.
- **Suspender a entrega** de mensagens a toda a equipa com um clique.
- **Disjuntor:** deteta agentes em ciclo ou a gastar de mais e vai subindo o tom —
  corrigir → restringir → parar. Tudo se ajusta em **Autonomia e limites**.
- **Limites de tokens por agente**, medidos em trabalho feito e não em contexto em cache.
- **Servidores MCP por níveis:** os de só leitura vêm ligados; os que escrevem ou pedem
  credenciais ficam desligados até os ativares tu.
- **Cofre de segredos local:** os trabalhadores usam integrações REST através de um
  *proxy* em `127.0.0.1`, sem nunca verem a credencial.
- **Fecho de expediente:** ao sair, cada agente arruma o trabalho, grava a memória e
  confirma antes de a porta fechar. Nada fica a meio.

### 🧠 Memória e conhecimento

- **Memória por agente** (`memory.md`), que cada um lê ao arrancar e atualiza ao
  trabalhar.
- **Condensação automática:** quando a memória cresce de mais, é reescrita num formato
  limitado — factos fixos, um resumo recursivo e as secções mais recentes na íntegra.
- **Memória semântica partilhada:** pesquisa por significado, não só por palavras exatas.
- **Grafo de memória:** vê que tópicos cada agente conhece e como as mensagens os ligam.
- **Grafo de conhecimento:** alimenta a equipa com documentos do teu contexto, que os
  agentes consultam por pesquisa.

### ⏰ Automações

- **Agendamentos:** envia instruções a um agente ou à equipa inteira de *N* em *N*
  minutos,
  ou a uma hora certa nos dias da semana que escolheres (sem se baralhar com a mudança
  da hora).
- **Regras de contexto:** compacta ou limpa o contexto dos agentes quando passa um
  intervalo e a ocupação atinge um limiar.
- **Recupera o que ficou para trás:** se o computador entrou em suspensão, os agendamentos
  em falta correm quando ele volta, e os terminais encravados são reanimados.

### 🛠️ As ferramentas de trabalho

- **Terminais a sério** (xterm.js + WebGL): seguem o tema claro/escuro, ampliam o
  painel inteiro, e todos os caminhos impressos são clicáveis — markdown abre na
  pré-visualização, código no editor, o resto no Finder.
- **Modo de foco:** um agente em ecrã completo, com a lista da equipa ao lado.
- **Arrasta um ficheiro** para um terminal e o caminho entra no prompt.
- **Editor integrado** (Monaco) por agente, com árvore de ficheiros e pré-visualização de
  markdown e imagens.
- **Git:** estado, ramos e histórico de cada projeto, e uma **máquina do tempo** para
  saltar para um commit anterior e comparar.
- **Atividade:** uma cascata de chamadas a ferramentas por agente, com tokens frescos,
  em cache e totais.
- **Custos** acumulados ao longo da vida da aplicação, com o valor da sessão ao lado.
- **Competências:** instala e pesquisa *skills* a partir de um catálogo, e vem com as
  suas — incluindo intervalos de datas (`hoje`, `últimos 7 dias`, `este trimestre`…).

### 🏛️ O mundo

- **A Casa em 3D, feita em Godot:** Gabinete do Feitor, Escrivães, Conselho, Cartografia,
  Tesouraria, Refeitório e a Planta geral. Tudo procedural — modelos, materiais e
  personagens gerados em GDScript, sem arte de terceiros.
- **As personagens acompanham o estado dos agentes:** andam pelas salas, vão para o seu
  posto quando esperam ou precisam de ti, e mostram balões com o que estão a pensar.
- **Um segundo cenário, a Tasca Portuguesa** — ver [mais abaixo](#a-tasca-portuguesa).
- Câmara livre: aproximar, afastar, arrastar, e clicar num oficial para ver quem é e o que
  está a fazer.

### ✨ Conforto

- **Configuração inicial em quatro passos:** espaço de trabalho, motor do Feitor, os teus
  repositórios, e permissões (quanto podem os agentes fazer sozinhos, e manter o
  computador acordado).
- **Pré-requisitos tratados por ela:** a aplicação vê o que falta e instala o Node e as
  CLIs dos motores quando não os encontra.
- **Atualizações automáticas**, do aviso à instalação, com a página de novidades na
  primeira abertura depois de atualizar.
- **Notificações** no ambiente de trabalho quando alguém precisa de ti.
- **Português e inglês**, à escolha em Definições → Geral.

## Duas coisas que este fork faz de diferente

**1. A nomenclatura é histórica, não inventada.** Os cargos da aplicação são os cargos
reais da Casa:

| Na aplicação | Na Casa da Índia |
|---|---|
| orquestrador | **Feitor** — Fernão Lourenço ocupou o cargo c. 1481–1504 |
| tu, a quem se leva a decisão | **Vedor da Fazenda**, e acima dele o Rei |
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

## A Tasca Portuguesa

Nem só de armadas vive a Casa. Em **Mudar de cenário**, o mundo troca o século XVI por uma
tasca de bairro: a mesma equipa, os mesmos terminais, o mesmo Feitor — só muda o que se vê.

### As salas

| Sala | O que lá está |
|---|---|
| **Balcão e gerência** | balcão de inox escovado e o quadro dos pratos do dia: *bacalhau à Brás, pataniscas, sopa de legumes, moelas, vinho da casa* |
| **Cozinha** | panelas ao lume, frigideiras e caldo a apurar |
| **Sala de mesas** | toalhas de papel, guardanapeiros e cadeiras de espaldar |
| **Sala reservada** | para as conversas que não são para toda a gente |
| **Adega e despensa** | prateleiras de mantimentos e garrafas com rolha e rótulo |
| **Pátio dos habituais** | cá fora, para os de sempre |

Tudo com azulejos azuis de padrão floral, uma guitarra pendurada na parede, relógio,
candeeiros e, claro, os ditados de sempre:

> *Fiado só amanhã.*
> *Quem não é para comer, não é para trabalhar.*
> *Pão e vinho fazem caminho.*
> *A boa mesa junta a gente.*
> *Casa onde não há pão, todos ralham e ninguém tem razão.*

### Quem lá trabalha

| Personagem | Ofício |
|---|---|
| **Manuel** | taberneiro — é o Feitor, atrás do balcão |
| **Lurdes** | cozinheira |
| **Rosa** | empregada de mesa |
| **Joaquim** | empregado de mesa |
| **António** | carteiro |
| **Amélia** | vizinha |
| **Celeste** | comerciante |
| **Zé** | cliente habitual |

Cada agente recebe uma personagem e um nome de gente da terra — *Rosa Ferreira*,
*Joaquim Teixeira* — que podes trocar ao editar o agente. Estas alcunhas são só de
cenário: não mexem na identidade do agente, no terminal nem na orquestração, e o elenco é
fictício, puramente decorativo. Ao voltar à Casa da Índia, volta tudo aos oficiais de D.
Manuel.

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

Precisas do Node, de pelo menos uma das CLIs (`claude`, `codex` ou `opencode`), do Godot 4.6
(para exportar o mundo) e, no macOS, das Xcode Command Line Tools.

```bash
npm install          # o postinstall faz electron-rebuild — precisa das Xcode CLT no macOS
npm run dev          # exporta o mundo Godot e abre a aplicação
```

```bash
npm run typecheck    # tsconfig.node + tsconfig.web
npm run test:focused # node --test test/*.test.cjs
npm run build        # exportação Godot + electron-vite
npm run dist:mac     # empacota (também dist:win e dist:linux)
```

### Onde está o quê

| Pasta | O que tem |
|---|---|
| `src/main/` | processo principal: PTYs, colmeia, hooks, disjuntor, memória, agendamentos |
| `src/renderer/` | a interface em React: painéis, terminais, editor, elenco, i18n |
| `src/shared/` | tipos e regras partilhados, incluindo o regimento |
| `godot/casa-da-india/` | o mundo 3D — salas, personagens, navegação |
| `resources/skills/` | as competências que vêm com a aplicação |
| `test/` | a bateria de testes (`node --test`) |

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
