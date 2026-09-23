# Casa da Índia dentro da aplicação

A aplicação abre diretamente a Casa em 3D dentro do Electron. A vista Godot é a visualização definitiva; o seletor de pixel art foi retirado. A lista de agentes e os terminais funcionam mesmo que o cenário não carregue; o aviso permite tentar novamente.

## O que está ligado

- As seis salas partilham um único mundo. Mudar de sala move a câmara; não recria os agentes.
- Cada agente mantém o ID, o nome personalizado e a personagem escolhida. As cores, cabelo, pele, barba, cobertura da cabeça e capa vêm do elenco da aplicação.
- A aplicação atribui e guarda os lugares: gabinete (1), escrivães (7), cartografia (3), tesouraria (4), conselho (6 de reserva). O refeitório não ocupa lugares de trabalho. Acima de 21, os restantes aguardam lugar.
- Os estados vêm do store existente. Bloqueio e espera de lugar são diferentes. As estações de ferramentas orientam as deslocações. Os percursos são calculados a partir da geometria, com margem para a personagem.
- Quatro lugares de pausa no refeitório, com serviço, refeição e lavagem. Uma mudança para trabalho cancela a pausa. Isto é animação: nunca suspende PTYs ou tarefas reais.
- A barra fixa acima do cenário apresenta contagens reais de tarefas e botões para abrir Tarefas e perguntas para o utilizador. Correspondência real produz envelopes, sem transmitir o conteúdo das mensagens ao Godot.
- Clique seleciona um agente; duplo clique abre o seu terminal. Roda/pinça e botões +/− fazem zoom, arrastar com o botão esquerdo, direito ou central move a câmara; a roda/pinça aproxima a zona sob o ponteiro, F foca o agente, R repõe a vista. O seletor de sala e a opção de paredes ficam na aplicação.
- Quando o cenário está oculto ou o terminal está em foco, o desenho pausa. O backend continua ativo. O regresso envia um snapshot completo.

## Fronteira de segurança

`src/shared/worldBridge.ts` define o contrato versionado. O renderer só aceita pedidos do iframe esperado, com origem `casa-world://app`, versão e ações conhecidas. Os IDs são confirmados contra os agentes existentes antes de selecionar ou abrir um terminal.

O protocolo local só serve os ficheiros conhecidos da exportação. Não tem APIs de sistema nem acesso remoto. O iframe tem sandbox e não recebe preload, Node, credenciais, caminhos de projetos, prompts ou transcrições. A CSP permite WebAssembly apenas nesse iframe. A capacidade de consultar o registo de service workers evita um erro do runtime Godot; a CSP continua a proibir a criação de workers.

Estado durável, tarefas, providers, custos, permissões e terminais continuam no Electron/React. O armazenamento `casa.world.*` guarda apenas preferências visuais e lugares, na sessão da janela respetiva. Os protocolos e identificadores legados de compatibilidade foram preservados.

## Exportar

Requer Godot **4.6.2**, renderer Compatibility e templates Web **sem threads** da mesma versão. Não é necessário instalar um MCP para executar esta integração.

1. Descarregar o arquivo oficial `Godot_v4.6.2-stable_export_templates.tpz` de `godotengine/godot-builds`.
2. Extrair `templates/web_nothreads_release.zip` e `templates/web_nothreads_debug.zip` para `.cache/godot/`, sem a pasta `templates`.
3. Executar:

```sh
GODOT_BIN=/caminho/para/Godot npm run build:godot
npm run dev
```

No macOS, a instalação em `/Applications/Godot.app` ou `~/Downloads/Godot.app` é detetada automaticamente; noutros locais usar `GODOT_BIN`. Se estiver no PATH, o comando `godot` também funciona.

A exportação fica em `src/renderer/public/godot/`; Vite copia-a para `out/renderer/godot/`, incluído no pacote Electron. Templates e exportações são ignorados pelo Git. `npm run dev` e `npm run build` exportam automaticamente o Godot antes de arrancar ou compilar a aplicação. Durante uma sessão já aberta, repetir `npm run godot:export` depois de alterar GDScript ou a shell e recarregar o cenário.

O cenário não tem áudio e usa o driver Dummy. Não utiliza IndexedDB: a aplicação é a dona do estado. Isto evita inicializações desnecessárias de áudio/armazenamento no iframe.

## Verificar

```sh
npm run typecheck
npm run test:focused
"$GODOT_BIN" --headless --path godot/casa-da-india \
  --script res://tests/live_world_test.gd --log-file /tmp/casa-live-test.log
npm run test:godot
```

O teste nativo verifica identidade entre salas, alterações do roster, capacidade, caminhos dos 22 postos, acesso ao refeitório e cancelamento de pausas. O teste Electron usa uma janela e perfil temporários, bloqueia HTTP/HTTPS, verifica a fronteira do protocolo, confirma ausência de Node/preload e exercita 1, 16 e 24 agentes. Não inicia providers nem utiliza os dados do utilizador. Capturas: `/tmp/casa-world-smoke.png` e `/tmp/casa-world-room.png`.

Para verificar os assets dentro do pacote macOS:

```sh
CASA_WORLD_ASSETS="$PWD/dist/mac-arm64/casa_da_indIA.app/Contents/Resources/app.asar/out/renderer/godot" \
  npm run test:godot
```

## Aceitação da migração

TypeScript, testes de regressão, teste nativo e exportação Web foram executados. Foi criado um pacote local macOS arm64 sem assinatura/notarização e sem publicação. A integração offline foi exercitada com os assets do `app.asar`; isso não substitui um ensaio completo dos providers na aplicação empacotada.

O Godot é a visualização definitiva por decisão do utilizador. O código do antigo cenário e as dependências usadas pelos retratos permanecem no repositório, mas o cenário pixel art já não é montado pela aplicação. Continuam relevantes os ensaios prolongados com providers reais e a validação de Windows/Linux.

### Resultado do ensaio local — 20/09/2026

- 752 testes de regressão passaram; TypeScript sem erros.
- Percursos dos 22 postos e seis destinos do refeitório acessíveis; pausa cancelada ao regressar ao estado de trabalho; renomear preserva a identidade do nó.
- Exportação no `app.asar`, rede HTTP/HTTPS bloqueada, janela de 1440×900: 60 FPS com 1, 16 e 24 agentes na vista Escrivães. Limite de desenho: 60 FPS. São medições locais do cenário, não uma garantia para outros equipamentos ou para cargas reais dos providers.
- O agrupamento estático reduziu o ensaio de 16 agentes para cerca de 1.637 chamadas de desenho e 2.235 nós. Materiais repetidos são partilhados.
- Sem erros de JavaScript/Godot no ensaio Electron. Confirmado: `typeof require` e `typeof window.cth` são `undefined` dentro do mundo.
- O Godot nativo em sandbox emitiu avisos de acesso às definições do editor/certificados do macOS; os testes e a exportação terminaram com sucesso. A execução Web isolada não emitiu esses avisos.

### Ajustes após revisão visual

As seis zonas de abertura das portas estão livres de mobiliário, vasos e bancos. O movimento conserva a velocidade entre os pontos da grelha e trava apenas no destino; testes a 30, 60 e 120 Hz verificam que não há paragens intermédias nem ultrapassagem do destino.

A secretária junto à entrada dos Escrivães foi retirada: há agora 15 lugares principais e 6 no Conselho. O ID do posto retirado (5) fica reservado, para preservar os outros lugares guardados. O globo da Cartografia foi afastado da entrada para a zona do arquivo.

## Cenário alternativo: Tasca Portuguesa

O seletor acima do mundo permite alternar entre **Casa da Índia** e **Tasca Portuguesa**. A Casa é a opção inicial; a última escolha fica em `casa.world.scenario`, na partição local da janela. A troca substitui apenas o iframe e envia um snapshot completo. IDs, nomes, tarefas, PTYs, providers e permissões não são alterados.

A tasca é uma planta original de bairro: balcão (coordenador), sala de mesas com 6 lugares, reservado com 6, cozinha com 4, despensa com 4 e pátio com 4 lugares de pausa. Mantém a capacidade de 21 agentes com lugar, espera para os restantes, estações de ferramentas, correspondência, estados e cancelamento das pausas ao retomar trabalho. Os modelos são procedurais, sem áudio ou recursos remotos.

`casa_world_config.gd` contém os destinos originais da Casa; `tasca.gd` constrói a tasca e define os seus destinos. O controlador `live_world.gd` é partilhado. A ponte visual está na versão 2: os snapshots e eventos `view` identificam o cenário, e as zonas são validadas por cenário. A origem `casa-world://app` e o isolamento permanecem os mesmos.

`agent.character` continua a guardar a personagem da Casa. A tasca resolve uma personagem estável por ID (Manuel para o coordenador) e guarda escolhas explícitas em `tasca.world.characters`. Criar/editar agentes e os retratos da interface usam o elenco ativo. As escolhas da tasca são preferências locais de apresentação e não fazem parte da exportação do roster. Os lugares e a zona da Casa mantêm as chaves `casa.world.*`; a tasca usa `tasca.world.*`.

Verificações adicionais:

```sh
node --test test/world-bridge.test.cjs test/world-scenarios.test.cjs
"$GODOT_BIN" --headless --path godot/casa-da-india \
  --script res://tests/tasca_world_test.gd --log-file /tmp/tasca-native.log
npm run godot:portraits
npm run test:godot
```

O ensaio Electron percorre Casa → Tasca → Casa, testa 1/24/16 agentes, verifica todas as zonas e a ausência de Node/preload. Capturas em `/tmp/casadaindia-world-overview.png`, `/tmp/tasca-world-overview.png` e `/tmp/tasca-world-*.png`. Não inicia providers reais. Para inspecionar a geometria nativa, executar o projeto Godot com `-- --tasca`.

Referências de ambiente (inspiração, sem copiar imagens ou plantas): [Taste of Lisboa](https://www.tasteoflisboa.com/pt/blog/how-to-identify-an-authentic-portuguese-tasca/) e [Petisc’ar — NiT](https://www.nit.pt/comida/restaurantes/petiscar-o-novo-espaco-da-baixa-onde-ha-pratos-portugueses-sem-precos-proibitivos).

### Verificação da primeira versão — 23/09/2026

TypeScript, build/exportação Web, os cinco testes da ponte/preferências e os dois ensaios nativos passaram. O ensaio Electron Casa → Tasca → Casa terminou sem erros, com 60 FPS nas amostras locais de 1/16/24 agentes e isolamento confirmado. Foram revistas as capturas da planta e do balcão após ajustar o quadro e os materiais. Estes ensaios usam agentes simulados e não substituem uma sessão prolongada com providers reais.

A suite geral terminou com 777 testes aprovados e quatro falhas anteriores à tasca: paridade de chaves e interpolação de `localModels`/`agentModelPicker` nas traduções árabe e chinesa. Confirmado que as árvores dessas traduções, fora das novas mensagens `interface`, são iguais às do commit base `8bcbe7fe`.


### Revisão artística — seis divisões

A planta aberta inicial foi substituída por seis divisões com portas para um corredor central: balcão/gerência, sala de mesas, reservado, cozinha, adega/despensa e pátio. Os 21 IDs de lugar existentes são preservados. O reservado recebe seis dos doze lugares anteriores da sala de mesas; a posição visual adapta-se à nova planta sem alterar os agentes.

Os azulejos usam um shader procedural original, com rosetas, losangos, leques nos cantos, cercadura dupla e juntas. Cada sala tem painéis contínuos nas paredes, frisos e placas cerâmicas. A decoração inclui fotografias estilizadas de fachadas, pratos azuis, relógio, guitarra, cortinas, rádio, toalhas aos quadrados, louça, garrafeiras, panelas de cobre e uma latada no pátio. Tudo é local; não há imagens descarregadas ou recursos de rede.

As paredes de fundo decoradas mantêm-se visíveis em corte, como na Casa; as divisórias do corredor e paredes da frente alternam com o botão Paredes. As portas e os percursos foram verificados com os novos móveis.

Verificação desta revisão: TypeScript e build passaram; testes nativos da Casa e da Tasca confirmaram percursos, identidade e 21 lugares. O Electron percorreu as seis salas da tasca e a troca Casa → Tasca → Casa sem erros, com 60 FPS nas amostras locais de 1/16/24 agentes. Capturas de todas as salas foram geradas; planta, sala de mesas, balcão, cozinha e reservado foram inspecionados. O ensaio do divisor lateral passou, incluindo arrasto sobre Godot, redimensionamento e preservação da instância do terminal. O seu handshake foi atualizado para a versão 2 da ponte.
