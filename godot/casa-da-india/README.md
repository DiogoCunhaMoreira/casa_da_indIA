# Casa da Índia — maquete Godot

Protótipo 3D autónomo para Godot 4.6.2. Não depende da aplicação Electron nem altera a versão em pixel art. Modelos e materiais construídos em GDScript, sem assets externos.

Abre `project.godot` no Godot e carrega em **F5** para abrir Refeitório e Adega (`scenes/refeitorio.tscn`). Usa os botões **Gabinete**, **Escrivães**, **Conselho**, **Cartografia**, **Tesouraria**, **Refeitório** e **Planta** para alternar entre cenas. A planta geral continua em `scenes/casa.tscn`: abre essa cena e usa **F6** para a executar separadamente.

- Roda do rato, gesto de pinça/scroll no trackpad ou teclas +/−: aproximar/afastar.
- Arrastar com o botão direito: deslocar a vista.
- F: aproximar e centrar a personagem selecionada.
- Setas esquerda/direita: rodar a câmara.
- Clique numa personagem: nome, cargo e atividade.
- Espaço: pausar/retomar as rotinas.
- R: repor a câmara.
- F11 (ou Fn+F11, conforme o teclado do Mac): alternar ecrã completo.

A cena apresenta a sala de trabalho, o arquivo, mercadoria e um pequeno cais. Fernão Lourenço, Pêro Vaz de Caminha e Tomé Pires percorrem trajetos fixos com animação procedural. Os estados são simulados, sem ligação a agentes reais. É um estudo visual, não uma reconstrução histórica.

A geometria é gerada por `scripts/casa.gd`, também no editor através de `@tool`. Para alterar a disposição, edita `_ready()`; os auxiliares `desk`, `shelf`, `barrel` e `make_official` constroem os elementos. Reabre a cena depois de alterar a geração. Os nós gerados são transitórios e ainda não constituem um conjunto de cenas modulares editáveis individualmente.

Próximas iterações: acertar direção artística com feedback visual, separar mobiliário e personagens em cenas próprias, melhorar animações e navegação. A integração com a app fica para uma decisão posterior.

## Revisão visual — personagens e detalhe

Personagens com cabeças maiores, cabelo, bochechas, boinas e rostos distintos. Ombros, cotovelos, ancas e joelhos articulados; passada dependente da distância percorrida, aceleração e travagem graduais, transição suave para repouso, respiração e piscar de olhos. Animação ainda procedural, sem captura de movimento ou rig importado.

Azulejos, cantaria, lanternas, livros abertos, escrita, selos, gavetas, vasos, sacos e cordas acrescentam detalhe ao cenário. Os nomes aparecem apenas na seleção. Os trajetos continuam predefinidos, sem navegação dinâmica.

Para uma captura de revisão, executar o Godot com `--path godot/casa-da-india -- --capture` a partir da raiz do repositório. Grava `/tmp/casa-preview.png` e termina; no macOS, a janela pode precisar de estar em primeiro plano para renderizar.

## Passo 1 — planta inspirada na referência em pixel art

Quatro salas: gabinete do Feitor, escrivães, cartografia/arquivo e tesouraria. Corredor central com quatro vãos, entrada, pátio e pontão. Divisórias em corte para preservar a visibilidade. Mobiliário simples reaproveitado para avaliar escala e circulação; a decoração detalhada será trabalhada por sala. As três rotas passam pelos vãos e usam lados distintos do corredor quando possível. Ainda sem colisões ou navegação dinâmica.

A planta é construída em `build_layout()`, com grupos próprios para cada divisão. Esta etapa substitui a disposição da sala única; a descrição de detalhes das revisões anteriores é um registo do protótipo anterior, não o inventário da planta atual.

## Passo 2 — gabinete do Feitor

Interior autónomo de 16 × 10 unidades, preparado para observação próxima, com um único oficial. A cena principal passa a ser `scenes/gabinete.tscn`; a planta das quatro salas é preservada em `scenes/casa.tscn`.

`gabinete.gd` constrói a arquitetura e os adereços: piso de terracota, lambris, frisos e cantaria, janelas com portadas, tapeçaria, tapete bordado, secretária com painéis e pernas torneadas, cadeira estofada, livros com nervuras, arquivo de gavetas, carta decorativa, globo, castiçais, arca e mesa de consulta. Materiais e formas continuam procedurais. O mapa, a tapeçaria e os objetos são interpretações estilizadas, não reproduções documentais históricas.

Validação desta etapa: execução de 600 frames no Godot 4.6.2 sem erros; captura visual da cena no renderer Compatibility. O enquadramento geral e o detalhe foram inspecionados; o botão de ecrã completo foi implementado, mas não foi testado interativamente nesta etapa.

## Passo 3 — Sala dos Escrivães

Nova cena `scenes/escrivaes.tscn`, construída por `scripts/escrivaes.gd`. Reutiliza os adereços do gabinete (biblioteca, janelas, castiçais, arca, bancos e vasos) e acrescenta seis postos com registos abertos, escrita, tinteiros, penas, selos, gavetas e travessas. Arquivo de registos, correspondência e contas; quadros de recados; azulejos; mesa de consulta e passadeiras.

Três personagens com percursos locais predefinidos, independentes e sem cruzamentos entre si. Os outros três postos ficam disponíveis visualmente. Os bancos estão recolhidos ao lado dos postos; ainda não há animação de sentar nem ligação a agentes reais.

A cena de arranque é agora a Sala dos Escrivães. Os botões no topo permitem alternar para o gabinete ou para a planta geral sem sair do jogo. A câmara, seleção, zoom, pausa e F11 continuam disponíveis.

Verificação: captura renderizada inspecionada, execução sem erros, transições Escrivães → Gabinete → Planta → Escrivães testadas por código e 60 segundos simulados de movimento em cada etapa. A validação também confirmou que os oficiais se mantêm dentro das faixas de circulação previstas na sala nova.

## Passo 4 — Sala do Conselho

Cena autónoma `scenes/conselho.tscn`, construída em `scripts/conselho.gd`, agora como cena de arranque. Mesa única com carta, marcadores de rota, atas, selos e castiçais; seis cadeiras com recuos, rotações e estofos variados; mapa de parede, pendões, aparador, globo e arca. Reutiliza os elementos de arquitetura e adereços do gabinete.

Feitor e Caminha circulam pelos lados da mesa. A reunião é simulada; ainda não há animação de sentar nem ligação à app. Os nomes das atividades descrevem apenas a rotina visual.

Validação: 600 frames sem erros, captura renderizada inspecionada, alternância entre as quatro cenas verificada por código e 60 segundos simulados dos percursos laterais do Conselho, com verificação de posições válidas e afastamento da mesa.

## Passo 5 — Cartografia e Roteiros

`scenes/cartografia.tscn` é a nova cena de arranque; `scripts/cartografia.gd` constrói o interior. Mesa em cavaletes ligeiramente rodada, carta com linhas de navegação e anotações, régua, compasso, arquivo horizontal de gavetas, nichos de rolos com ocupação variável, globo, instrumento armilar e posto de consulta. Composição assimétrica, mantendo a arquitetura comum às salas anteriores. Mapas e instrumentos são interpretações estilizadas, não reproduções históricas documentais.

Francisco Rodrigues e Rui Faleiro têm percursos independentes e atividade simulada, sem integração com a app. Verificação: execução sem erros, captura inspecionada, transições entre as cinco cenas testadas por código e 60 segundos simulados das rotinas da nova sala com posições válidas.

## Passo 6 — Tesouraria e Contabilidade

Nova cena de arranque `scenes/tesouraria.tscn`, com construção em `scripts/tesouraria.gd`. Balcão de contagem, balança com pratos e pesos, pilhas de moedas, livro de contas, quadro de lançamentos, cofres diferenciados, arquivo, sacos e posto do escrivão. Feitor e Caminha executam rotinas visuais predefinidas, sem ligação financeira real à app.

Verificação: captura correta da Tesouraria inspecionada, execução sem erros, transições entre seis cenas e 60 segundos simulados das rotinas testados por código. O modo `--capture` impede mudanças de sala para não gravar acidentalmente uma sala diferente durante a captura; a navegação normal mantém-se disponível.

## Passo 7 — Refeitório e Adega

Cena `scenes/refeitorio.tscn`, construída em `scripts/refeitorio.gd`, como novo arranque. Duas mesas de dimensões diferentes, bancos compridos e bancos individuais deslocados, pratos, canecas, pão e cântaros. Lareira com brasas, lenha, balcão de servir, prateleiras de loiça e adega com barris e garrafas.

Tomé Pires e Duarte Barbosa percorrem rotas independentes entre mesas e balcão. Estados de pausa próprios, sem gestos de escrita. Ainda não há animações de sentar, comer ou beber: trata-se de uma rotina visual de circulação e repouso.

Verificação: captura renderizada inspecionada, transições entre as sete cenas (seis salas e planta) testadas por código, 60 segundos simulados dos percursos com posições válidas e verificação dos estados de pausa. Ecrã completo e controlos de câmara mantidos. As seis salas funcionais previstas têm agora cenas próprias; a planta geral continua a ser o estudo anterior de quatro divisões, não uma planta atualizada das seis salas.
