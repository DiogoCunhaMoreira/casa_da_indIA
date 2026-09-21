/**
 * Config da página de pré-visualização do chão (`npm run cena`).
 *
 * Vite puro, sem Electron: a cadeia da cena — TiledMapRenderer, Camera, cast,
 * portraitArt, tema, elenco, retratos, planta — não importa o store nem IPC
 * nenhum, por isso monta-se num browser. É isso que faz o ciclo de olhar para a
 * arte custar dois segundos em vez de quinze mais um assistente de arranque.
 *
 * Os aliases têm de bater certo com os do `electron.vite.config.ts`. Se lá
 * mudarem, mudam aqui — senão a página resolve `@/...` de outra maneira que a
 * app e passamos a olhar para uma coisa que não é a que corre.
 *
 * A build do Electron não sabe que esta página existe: o `input` do renderer
 * continua a ser só o `index.html`.
 */
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  root: resolve(__dirname, 'src/renderer'),
  plugins: [react()],
  define: { __APP_VERSION__: JSON.stringify('cena') },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src/renderer/src'),
      '@brand': resolve(__dirname, 'src/renderer/src/assets/brand'),
      '@shared': resolve(__dirname, 'src/shared'),
    },
  },
  server: {
    port: 5199,
    open: '/cena.html',
    // O `.tmj` entra por `?raw` e o atlas por `?url`, por isso escrever por cima
    // deles com os geradores em Python dispara o recarregamento sozinho.
    watch: { ignored: ['!**/assets/maps/**', '!**/assets/tilesets/**'] },
  },
});
