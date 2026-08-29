/**
 * Banco de ensaio de uma personagem — vê-la andar e parar em todas as direcções
 * antes de a meter no chão.
 *
 *     python3 tools/mapgen/build_personagem.py fidalgo
 *     npm run cena     →  http://localhost:5199/personagem.html
 *
 * Mostra as seis animações que a folha traz mais as duas espelhadas, cada uma a
 * tocar em ciclo, sobre uma grelha de 32 px — que é um tile do chão — para o
 * tamanho se poder julgar. Em baixo, um passeio de ida e volta que muda de
 * direcção nas pontas, que é o que revela se o corpo oscila ou se os frames não
 * casam nas transições.
 *
 * A esquerda é o espelho da direita, exactamente como o `CharacterSprite` faz.
 * Se o desenho tiver a espada de um lado só, é aqui que se vê o problema.
 *
 * Isto NÃO passa pelo `cast.ts` nem pelo `portraitArt.ts`: lê a folha e o JSON
 * que o gerador escreveu, e mais nada. É deliberado — serve para julgar a arte
 * antes de mexer no elenco da app.
 */
import { Application, Assets, Container, Graphics, Sprite, Text, Texture, Rectangle } from 'pixi.js';
import folhaUrl from '@/assets/sprites/fidalgo.png?url';
import mapa from '@/assets/sprites/fidalgo.json';

const palco = document.getElementById('palco')!;
const sub = document.getElementById('sub')!;
const painelErro = document.getElementById('erro')!;

interface Mapa {
  nome: string;
  /** [largura, altura] da célula. O JSON dá `number[]`, daí o par explícito. */
  cell: number[];
  cols: number;
  frames: number;
  anims: Record<string, number[]>;
}

const M: Mapa = mapa;
const CW = M.cell[0];
const CH = M.cell[1];
const TILE = 32;                 // um tile do chão, para dar escala

/** As oito casas do quadro: as seis animações da folha e as duas espelhadas. */
const QUADRO: Array<{ rotulo: string; anim: string; espelho?: boolean }> = [
  { rotulo: 'andar ↓', anim: 'walk-down' },
  { rotulo: 'andar ↑', anim: 'walk-up' },
  { rotulo: 'andar →', anim: 'walk-right' },
  { rotulo: 'andar ←', anim: 'walk-right', espelho: true },
  { rotulo: 'parado ↓', anim: 'idle-down' },
  { rotulo: 'parado ↑', anim: 'idle-up' },
  { rotulo: 'parado →', anim: 'idle-right' },
  { rotulo: 'parado ←', anim: 'idle-right', espelho: true },
];

function rebenta(e: unknown): void {
  painelErro.style.display = 'block';
  painelErro.textContent = e instanceof Error ? `${e.message}\n\n${e.stack ?? ''}` : String(e);
  console.error(e);
}

async function montar(): Promise<void> {
  const folha = (await Assets.load(folhaUrl)) as Texture;
  folha.source.scaleMode = 'nearest';

  const quadro = (i: number): Texture => new Texture({
    source: folha.source,
    frame: new Rectangle((i % M.cols) * CW, Math.floor(i / M.cols) * CH, CW, CH),
  });
  const quadros = Array.from({ length: M.frames }, (_, i) => quadro(i));

  // Quatro por linha, duas linhas: a marcha em cima, as paradas em baixo. Em
  // oito seguidas a tela ficava com 1200 px e a 2× não cabia numa janela.
  const COLUNAS = 4;
  const CEL_W = 148;
  const CEL_H = CH + 44;
  const LARGURA = COLUNAS * CEL_W;
  const LINHAS = Math.ceil(QUADRO.length / COLUNAS);
  const PASSEIO_H = 128;

  const ALTURA = LINHAS * CEL_H + PASSEIO_H;
  const app = new Application();
  await app.init({
    width: LARGURA,
    height: ALTURA,
    background: 0x14100c,
    antialias: false,
    roundPixels: true,
  });
  palco.appendChild(app.canvas);

  const raiz = new Container();
  app.stage.addChild(raiz);

  // ── grelha de 32 px ────────────────────────────────────────────────────────
  const grelha = new Graphics();
  for (let x = 0; x <= LARGURA; x += TILE) grelha.moveTo(x, 0).lineTo(x, app.screen.height);
  for (let y = 0; y <= app.screen.height; y += TILE) grelha.moveTo(0, y).lineTo(LARGURA, y);
  grelha.stroke({ color: 0x3d6f7a, alpha: 0.5, width: 1 });
  raiz.addChild(grelha);

  // ── as oito casas ──────────────────────────────────────────────────────────
  interface Casa { sprite: Sprite; frames: number[]; t: number }
  const casas: Casa[] = [];

  for (let i = 0; i < QUADRO.length; i++) {
    const { rotulo, anim, espelho } = QUADRO[i];
    const idxs = M.anims[anim];
    if (!idxs) continue;

    const ox = (i % COLUNAS) * CEL_W + CEL_W / 2;
    const linhaCasa = Math.floor(i / COLUNAS);
    const chao = linhaCasa * CEL_H + CH + 8;

    // linha de chão, para se ver que os pés não flutuam nem afundam
    const linha = new Graphics().moveTo(ox - 34, chao).lineTo(ox + 34, chao)
      .stroke({ color: 0xc8961e, alpha: 0.55, width: 1 });
    raiz.addChild(linha);

    const s = new Sprite(quadros[idxs[0]]);
    s.anchor.set(0.5, 1);              // pés na origem, como no CharacterSprite
    s.position.set(ox, chao);
    s.scale.x = espelho ? -1 : 1;
    raiz.addChild(s);

    const t = new Text({
      text: `${rotulo}   ${idxs.length}f`,
      style: { fontSize: 11, fill: 0xb9a480, fontFamily: 'monospace' },
    });
    t.anchor.set(0.5, 0);
    t.position.set(ox, chao + 6);
    raiz.addChild(t);

    casas.push({ sprite: s, frames: idxs, t: 0 });
  }

  // ── o passeio ──────────────────────────────────────────────────────────────
  // Anda de um lado ao outro e vira nas pontas. É onde se vê se o corpo oscila,
  // se os frames casam na transição e se a velocidade da animação bate certo com
  // a velocidade a que ele se desloca — um passo a patinar nota-se logo aqui.
  const SPEED = 96;                     // px/s, o mesmo do Character.ts
  const chaoPasseio = ALTURA - 22;
  const linhaP = new Graphics().moveTo(0, chaoPasseio).lineTo(LARGURA, chaoPasseio)
    .stroke({ color: 0xc8961e, alpha: 0.55, width: 1 });
  raiz.addChild(linhaP);

  const andarilho = new Sprite(quadros[M.anims['walk-right'][0]]);
  andarilho.anchor.set(0.5, 1);
  andarilho.position.set(60, chaoPasseio);
  raiz.addChild(andarilho);

  let px = 60;
  let dir = 1;
  let tp = 0;

  // ── controlos ──────────────────────────────────────────────────────────────
  const vel = document.getElementById('vel') as HTMLInputElement;
  const cxGrelha = document.getElementById('grelha') as HTMLInputElement;
  const cxPasseio = document.getElementById('passeio') as HTMLInputElement;
  const selZoom = document.getElementById('zoom') as HTMLSelectElement;

  const aplicaZoom = (): void => {
    const z = Number(selZoom.value);
    app.canvas.style.width = `${LARGURA * z}px`;
    app.canvas.style.height = `${ALTURA * z}px`;
    app.canvas.style.imageRendering = 'pixelated';
  };
  aplicaZoom();
  selZoom.addEventListener('change', aplicaZoom);
  cxGrelha.addEventListener('change', () => { grelha.visible = cxGrelha.checked; });
  cxPasseio.addEventListener('change', () => {
    andarilho.visible = linhaP.visible = cxPasseio.checked;
  });

  app.ticker.add((tick) => {
    const dt = tick.deltaMS / 1000;
    const fps = Number(vel.value);

    for (const c of casas) {
      c.t += dt * fps;
      c.sprite.texture = quadros[c.frames[Math.floor(c.t) % c.frames.length]];
    }

    if (cxPasseio.checked) {
      px += dir * SPEED * dt;
      if (px > LARGURA - 60) { px = LARGURA - 60; dir = -1; }
      if (px < 60) { px = 60; dir = 1; }
      andarilho.x = Math.round(px);
      andarilho.scale.x = dir;
      tp += dt * fps;
      const idxs = M.anims['walk-right'];
      andarilho.texture = quadros[idxs[Math.floor(tp) % idxs.length]];
    }
  });

  sub.innerHTML =
    `<b>${M.nome}</b> · ${M.frames} frames de ${CW}×${CH} px · `
    + `a personagem tem ~72 px de alto = ${(72 / TILE).toFixed(2)} tiles · `
    + `<a href="/cena.html">ver o chão →</a>`;
}

montar().catch(rebenta);
window.addEventListener('error', (e) => rebenta(e.error ?? e.message));
window.addEventListener('unhandledrejection', (e) => rebenta(e.reason));
