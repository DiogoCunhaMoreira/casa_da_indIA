/**
 * Página de pré-visualização do chão — o ciclo curto de olhar para a arte.
 *
 *     npm run arte     # recorta as peças e redesenha a planta
 *     npm run cena     # esta página, que se recarrega sozinha
 *
 * Isto NÃO é uma imitação do renderizador: monta o mesmo `TiledMapRenderer`, a
 * mesma `Camera`, o mesmo atlas e o mesmo `ThemeConfig` que o `OfficeFloor.tsx`
 * monta dentro do Electron. A diferença é o que fica de fora — store, agentes,
 * terminais, IPC e o assistente de arranque — que é precisamente o que tornava
 * insuportável olhar para o cenário a cada sprite entregue: quinze segundos de
 * arranque e sete passos de assistente por cada barril.
 *
 * Funciona porque a cadeia da cena não importa nada disso: `TiledMapRenderer`
 * recebe `(mapData, textures)` e mais nada, e `tema`/`elenco`/`retratos`/`cast`
 * não conhecem o Electron. Fica assim.
 *
 * O `.tmj` entra por `?raw` e o atlas por `?url`, por isso o Vite recarrega a
 * página sozinho quando os geradores em Python escrevem por baixo.
 *
 * Esta página não entra na build do Electron — o `input` do renderer continua a
 * ser só o `index.html`. Ver `vite.cena.config.ts`.
 */
import { Application, Assets, Container, Graphics, Text, Texture } from 'pixi.js';
import { Camera } from './scene/office/Camera';
import { CharacterSprite } from './scene/office/CharacterSprite';
import { TiledMapRenderer } from './scene/office/TiledMapRenderer';
import { resolveThemeMap, themeTilesetUrls } from './scene/office/themeLoader';
import { TEMA } from './scene/office/themeRegistry';

const palco = document.getElementById('palco')!;
const estado = document.getElementById('estado')!;
const painelErro = document.getElementById('erro')!;

function rebenta(e: unknown): void {
  painelErro.style.display = 'block';
  painelErro.textContent = e instanceof Error ? `${e.message}\n\n${e.stack ?? ''}` : String(e);
  console.error(e);
}

async function montar(): Promise<void> {
  const app = new Application();
  await app.init({
    background: TEMA.palette.background,
    antialias: false,
    roundPixels: true,
    resizeTo: window,
  });
  palco.appendChild(app.canvas);

  const mundo = new Container();
  mundo.sortableChildren = true;
  app.stage.addChild(mundo);

  // Exactamente o caminho da app: o tema resolve o mapa e a lista de atlas, e o
  // carregador de texturas casa `textures[i]` com `tilesets[i]` pelo índice.
  const mapa = resolveThemeMap(TEMA);
  const texturas: Texture[] = [];
  for (const url of themeTilesetUrls(TEMA)) {
    const tex = (await Assets.load(url)) as Texture;
    tex.source.scaleMode = 'nearest';
    texturas.push(tex);
  }

  const renderer = new TiledMapRenderer(mapa, texturas);
  mundo.addChild(renderer.getContainer());
  const camadaPersonagens = renderer.getCharacterContainer();
  const ts = renderer.tileSize;

  const camera = new Camera(mundo);
  camera.setMapSize(renderer.width * ts, renderer.height * ts);
  camera.setViewSize(app.screen.width, app.screen.height);
  camera.fitToScreen();
  app.ticker.add((t) => camera.update(t.deltaMS / 1000));
  window.addEventListener('resize', () =>
    camera.setViewSize(app.screen.width, app.screen.height));

  // ── sobreposições de diagnóstico ───────────────────────────────────────────
  const grelha = new Graphics();
  grelha.zIndex = 900_000;
  for (let x = 0; x <= renderer.width; x++) {
    grelha.moveTo(x * ts, 0).lineTo(x * ts, renderer.height * ts);
  }
  for (let y = 0; y <= renderer.height; y++) {
    grelha.moveTo(0, y * ts).lineTo(renderer.width * ts, y * ts);
  }
  grelha.stroke({ color: 0x00e0ff, alpha: 0.22, width: 1 });
  mundo.addChild(grelha);

  const colisao = new Graphics();
  colisao.zIndex = 900_001;
  for (let y = 0; y < renderer.height; y++) {
    for (let x = 0; x < renderer.width; x++) {
      if (!renderer.isWalkable(x, y)) colisao.rect(x * ts, y * ts, ts, ts);
    }
  }
  colisao.fill({ color: 0xff2b4a, alpha: 0.24 });
  mundo.addChild(colisao);

  const marcas = new Container();
  marcas.zIndex = 900_002;
  for (const [nome, p] of renderer.getAllSpawnPoints()) {
    const g = new Graphics()
      .rect(p.x * ts + 1, p.y * ts + 1, ts - 2, ts - 2)
      .stroke({ color: 0x2bff9e, width: 2 });
    const r = new Text({
      text: nome,
      style: { fontSize: 9, fill: 0x2bff9e, fontFamily: 'monospace' },
    });
    r.position.set(p.x * ts + 2, p.y * ts + 2);
    marcas.addChild(g, r);
  }
  for (const [nome, z] of renderer.getAllZones()) {
    const g = new Graphics()
      .rect(z.x * ts, z.y * ts, z.width * ts, z.height * ts)
      .stroke({ color: 0xffc400, width: 2, alpha: 0.8 });
    const r = new Text({
      text: nome,
      style: { fontSize: 11, fill: 0xffc400, fontFamily: 'monospace' },
    });
    r.position.set(z.x * ts + 3, z.y * ts + 3);
    marcas.addChild(g, r);
  }
  mundo.addChild(marcas);

  // ── oficiais, à escala real ────────────────────────────────────────────────
  // A razão de estarem aqui: é impossível julgar se a mobília está à escala
  // certa sem alguém de pé ao lado dela. São os mesmos sprites e o mesmo
  // CHAR_SCALE da app.
  const oficiais = new Container();
  oficiais.zIndex = 500_000;
  camadaPersonagens.addChild(oficiais);

  const elenco = TEMA.cast.roster;
  const lugares = [
    TEMA.primarySeatNames[0],
    TEMA.primarySeatNames[Math.min(4, TEMA.primarySeatNames.length - 1)],
    TEMA.primarySeatNames[Math.min(9, TEMA.primarySeatNames.length - 1)],
    TEMA.cafeSeatNames[0],
    'entrance',
  ].filter(Boolean);

  for (let i = 0; i < lugares.length; i++) {
    const p = renderer.getSpawnPoint(lugares[i]);
    const quem = elenco[i % elenco.length];
    if (!p || !quem) continue;
    try {
      const sprite = new CharacterSprite(await TEMA.cast.getFrames(quem.name));
      sprite.setPosition(p.x * ts + ts / 2, p.y * ts + ts);
      sprite.container.zIndex = p.y * ts + ts;
      oficiais.addChild(sprite.container);
    } catch (e) {
      console.warn('sem sprite para', quem.name, e);
    }
  }

  // ── interruptores ──────────────────────────────────────────────────────────
  // Os interruptores também se ligam pelo URL — `?grelha=1&colisao=1` — para dar
  // para fotografar um estado concreto sem clicar em nada.
  const params = new URLSearchParams(location.search);
  const liga = (chave: string, alvo: Container | Graphics): void => {
    const cx = document.getElementById(`t-${chave}`) as HTMLInputElement;
    if (params.has(chave)) cx.checked = params.get(chave) !== '0';
    alvo.visible = cx.checked;
    cx.addEventListener('change', () => { alvo.visible = cx.checked; });
  };
  liga('grelha', grelha);
  liga('colisao', colisao);
  liga('spawns', marcas);
  liga('oficiais', oficiais);

  const desenhados = renderer.getContainer().children.reduce(
    (n, c) => n + ((c as Container).children?.length ?? 0), 0);
  estado.textContent =
    `${renderer.width}×${renderer.height} tiles de ${ts}px\n`
    + `${renderer.width * ts}×${renderer.height * ts} px\n`
    + `${desenhados} sprites de tile\n`
    + `${TEMA.errandSpots.length} recados activos`;
}

montar().catch(rebenta);
window.addEventListener('error', (e) => rebenta(e.error ?? e.message));
window.addEventListener('unhandledrejection', (e) => rebenta(e.reason));
