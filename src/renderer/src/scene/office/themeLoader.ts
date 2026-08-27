// Carregador do chão — resolve o `ThemeConfig` num mapa pronto a desenhar.
//
// Faz duas coisas: parseia o Tiled JSON do tema e substitui a lista de atlas do
// mapa pela do tema (que traz os URLs e as dimensões que o Tiled não sabe). O
// resultado tem os `tilesets` pela mesma ordem que as texturas se carregam, que
// é como o `TiledMapRenderer` os casa: `textures[i]` ↔ `tilesets[i]`.
//
// Já não há aqui rede de segurança. Havia, enquanto havia seis temas e um deles
// podia vir partido: caía-se para o escritório. Com um chão só, cair para
// lado nenhum é a única opção honesta — se o mapa não parsear, é um erro deste
// código, e é melhor ver o erro do que ver outra sala qualquer.

import type { TiledMap } from './TiledMapRenderer';
import { TEMA, type ThemeConfig } from './themeRegistry';

/** Parseia o Tiled JSON do tema e remenda-lhe a lista de atlas. */
export function resolveThemeMap(theme: ThemeConfig): TiledMap {
  const m = JSON.parse(theme.mapRaw) as TiledMap;
  return {
    ...m,
    // Fora o `url`, que é só para o carregador de texturas, o resto é metadados
    // do Tiled e vai tal e qual.
    tilesets: theme.tilesets.map(({ url: _url, ...meta }) =>
      meta as TiledMap['tilesets'][number]),
  };
}

/** Os URLs dos atlas, pela ordem dos `tilesets` do mapa. */
export function themeTilesetUrls(theme: ThemeConfig): string[] {
  return theme.tilesets.map((t) => t.url);
}

/** O chão. Assíncrono de propósito — é aqui que um dia se vai buscar um tema a
 *  outro lado, se voltar a haver mais do que um. */
export async function loadTheme(): Promise<ThemeConfig> {
  return TEMA;
}
