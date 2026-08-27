// O contrato do chão — e o único tema que o cumpre.
//
// Isto começou como um registo de temas: o escritório da Dunder Mifflin mais
// cinco séries por fazer, com um selector nas definições. Já não. A casa tem um
// chão só, a Ribeira das Naus, e é este ficheiro que diz de que é feito.
//
// O `ThemeConfig` fica, apesar de haver um só tema, porque é ele que mantém as
// ~40% de constantes que estavam cravadas dentro do `OfficeFloor.tsx` fora do
// `OfficeFloor.tsx`: lugares, recados, adereços clicáveis, atlas, paleta. O
// motor — `TiledMapRenderer`, o BFS, a câmara, a animação — não sabe nada disto
// e não precisa de saber.

import type { Texture } from 'pixi.js';
import { TEMA_CASA_DA_INDIA } from './casadaindia/tema';
import type { CastMember } from './cast';

/** Só existe um. O tipo fica por legibilidade nas assinaturas. */
export type ThemeId = 'casadaindia';

export interface Tile { x: number; y: number; }
export type Facing = 'up' | 'down' | 'left' | 'right';

/** Os recadinhos de ócio pelo chão. O 'smoke' é o especial do patrão: o Feitor
 *  à janela do gabinete dele, e mais ninguém. */
export type ErrandKind =
  | 'water' | 'window' | 'dispenser' | 'fridge' | 'shelf' | 'bin' | 'smoke';

/** Uma âncora de recado: o tile onde se fica de pé e para onde se olha, o tile
 *  `fx` onde corre a animação de ambiente, a duração, e se é só de deus. */
export interface ErrandSpot {
  kind: ErrandKind;
  stand: Tile;
  facing: Facing;
  fx: Tile;
  duration: number;
  godOnly?: boolean;
}

/** Um atlas e o sítio dele no espaço global de gids. A ordem desta lista tem de
 *  bater certo com a ordem dos `tilesets` do mapa — o carregador casa
 *  `textures[i]` com `tilesets[i]` pelo índice, não pelo nome. */
export interface TilesetEntry {
  url: string;
  firstgid: number;
  image?: string;
  imagewidth?: number;
  imageheight?: number;
  tilewidth?: number;
  tileheight?: number;
  columns?: number;
  tilecount?: number;
}

/** Sobreposição de ecrã de secretária. Herdado do escritório, onde o mapa
 *  pintava um monitor apagado e a cena acendia o aceso por cima enquanto o
 *  agente lá estava sentado. Em 1500 não há ecrãs — a Casa da Índia passa um
 *  gid que não existe e nenhuma escrivaninha acende. */
export interface MonitorConfig {
  /** gid do canto superior esquerdo do bloco apagado, como o mapa o pinta. */
  offTopLeftGid: number;
  /** Os tiles acesos correspondentes, em [gid, dx, dy] a partir desse canto. */
  onGids: ReadonlyArray<readonly [number, number, number]>;
}

/** Os tiles fixos da adega: o barril das canecas → os barris de espicha → o
 *  barril de lavar → e volta ao princípio. `maxCups` limita as canecas lavadas. */
export interface CoffeeConfig {
  trayTile: Tile;
  trayStand: Tile;
  machineStand: Tile;
  sinkTile: Tile;
  sinkStand: Tile;
  maxCups: number;
}

/** Adereços clicáveis (coordenadas de tile). calendar → GATILHOS,
 *  boards → TAREFAS, clock → HORA DE FECHAR. */
export interface AnchorConfig {
  calendar: Tile;
  boards: Tile;
  clock: Tile;
}

/** Paleta do chão. `background` é a cor com que se limpa a tela; `noteColors`
 *  são as cores das notas do quadro, por estado da tarefa. */
export interface PaletteConfig {
  background: number;
  noteColors: Record<string, number>;
}

/** O elenco do chão. `roster` é a lista ordenada que a interface oferece a quem
 *  contrata — é ela, e não uma lista à parte, que garante que ninguém pode
 *  escolher uma cara que não existe neste chão. */
export interface ThemeCast {
  roster: CastMember[];
  byName: Record<string, CastMember>;
  getFrames: (name: string) => Promise<Texture[][]>;
  defaultCharacter: string;
  /** Com que cara é que o ORQUESTRADOR aparece. Separado do
   *  `defaultCharacter` porque deus não é "aquele para quem cairmos por
   *  omissão" — é um oficial em concreto. */
  godCharacter: string;
}

/** Tudo o que o chão precisa de declarar. */
export interface ThemeConfig {
  id: ThemeId;
  /** O Tiled JSON em bruto; parseado e remendado pelo `themeLoader`. */
  mapRaw: string;
  /** Atlas por ordem — a mesma ordem da carga de texturas e a mesma do mapa. */
  tilesets: TilesetEntry[];
  /** Ordem de ocupação dos lugares, por nome de spawn point. O 0 é de deus. */
  primarySeatNames: string[];
  /** Os lugares emparelhados das mesas do refeitório, por ordem. */
  cafeSeatNames: string[];
  /** Onde se fica de pé no refeitório: [nome do spawn point, a que serve]. */
  cafeStands: ReadonlyArray<readonly [string, 'coffee' | 'vending']>;
  coffee: CoffeeConfig;
  anchors: AnchorConfig;
  errandSpots: ErrandSpot[];
  monitor: MonitorConfig;
  palette: PaletteConfig;
  cast: ThemeCast;
}

/** A Casa da Índia — Lisboa, c. 1500–1516. Quinze oficiais documentados na
 *  Ribeira das Naus. É este o chão. */
export const TEMA: ThemeConfig = TEMA_CASA_DA_INDIA;

/** O elenco que a interface oferece a quem contrata, por ordem.
 *
 *  Sai do tema de propósito, e não de uma lista à parte: enquanto havia uma
 *  lista à parte, dava para escolher uma cara que o chão não tinha. */
export const ELENCO: CastMember[] = TEMA.cast.roster;

/** A cara de quem chega sem cara escolhida. */
export const CARA_POR_OMISSAO: string = TEMA.cast.defaultCharacter;

/** Com que cara é que o orquestrador aparece.
 *
 *  Toda a superfície que desenha deus — a cena, o assistente de arranque, o
 *  registo do agente que fica gravado — tem de perguntar AQUI, e nunca nomear
 *  uma personagem à mão. Foi exactamente assim que o Feitor apareceu um dia com
 *  a cara do Caminha, o escrivão. */
export function godCharacter(): string {
  return TEMA.cast.godCharacter;
}
