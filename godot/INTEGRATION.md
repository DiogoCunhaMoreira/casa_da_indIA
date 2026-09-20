# Casa da Índia dentro da aplicação

O seletor **Visualização → Godot 3D · experimental**, acima do cenário, abre a Casa dentro do Electron. Pixel art continua disponível durante a transição. A lista de agentes e os terminais funcionam mesmo que o cenário não carregue; o aviso permite tentar novamente ou voltar ao pixel art.

## O que está ligado

- As seis salas partilham um único mundo. Mudar de sala move a câmara; não recria os agentes.
- Cada agente mantém o ID, o nome personalizado e a personagem escolhida. As cores, cabelo, pele, barba, cobertura da cabeça e capa vêm do elenco da aplicação.
- A aplicação atribui e guarda os lugares: gabinete (1), escrivães (8), cartografia (3), tesouraria (4), conselho (6 de reserva). O refeitório não ocupa lugares de trabalho. Acima de 22, os restantes aguardam lugar.
- Os estados vêm do store existente. Bloqueio e espera de lugar são diferentes. As estações de ferramentas orientam as deslocações. Os percursos são calculados a partir da geometria, com margem para a personagem.
- Quatro lugares de pausa no refeitório, com serviço, refeição e lavagem. Uma mudança para trabalho cancela a pausa. Isto é animação: nunca suspende PTYs ou tarefas reais.
- O quadro apresenta contagens reais de tarefas. Clicar abre Tarefas; Shift+clique abre as perguntas para o utilizador. Correspondência real produz envelopes, sem transmitir o conteúdo das mensagens ao Godot.
- Clique seleciona um agente; duplo clique abre o seu terminal. Roda/pinça e botões +/− fazem zoom, arrastar com o botão direito move a câmara, F foca o agente, R repõe a vista. O seletor de sala e a opção de paredes ficam na aplicação.
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

No macOS, a instalação em `/Applications/Godot.app` é detetada automaticamente; noutros locais usar `GODOT_BIN`. Se estiver no PATH, o comando `godot` também funciona.

A exportação fica em `src/renderer/public/godot/`; Vite copia-a para `out/renderer/godot/`, incluído no pacote Electron. Templates e exportações são ignorados pelo Git. Depois de alterar GDScript ou a shell, repetir a exportação; `npm run build` sozinho não recompila o Godot.

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

A migração mantém-se experimental. Faltam a avaliação visual pelo utilizador, sessões prolongadas com agentes reais (incluindo foco de terminal, memória após muitas mudanças de sala e recuperação gráfica), e a validação de Windows/Linux. A promoção do Godot a predefinição e a remoção do Pixi dependem dessa aceitação. Não se alterou o motor de agentes para acomodar a visualização.

### Resultado do ensaio local — 20/09/2026

- 752 testes de regressão passaram; TypeScript sem erros.
- Percursos dos 22 postos e seis destinos do refeitório acessíveis; pausa cancelada ao regressar ao estado de trabalho; renomear preserva a identidade do nó.
- Exportação no `app.asar`, rede HTTP/HTTPS bloqueada, janela de 1440×900: 60 FPS com 1, 16 e 24 agentes na vista Escrivães. Limite de desenho: 60 FPS. São medições locais do cenário, não uma garantia para outros equipamentos ou para cargas reais dos providers.
- O agrupamento estático reduziu o ensaio de 16 agentes para cerca de 1.637 chamadas de desenho e 2.235 nós. Materiais repetidos são partilhados.
- Sem erros de JavaScript/Godot no ensaio Electron. Confirmado: `typeof require` e `typeof window.cth` são `undefined` dentro do mundo.
- O Godot nativo em sandbox emitiu avisos de acesso às definições do editor/certificados do macOS; os testes e a exportação terminaram com sucesso. A execução Web isolada não emitiu esses avisos.
