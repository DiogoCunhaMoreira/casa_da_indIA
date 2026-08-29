/**
 * A planta da Ribeira das Naus, em coordenadas de tile.
 *
 * GERADO por `tools/mapgen/build_ribeira.py` a partir do mesmo código que
 * desenha o `ribeira.tmj`. Não edites à mão — muda a planta no gerador e
 * volta a correr, ou o mapa e o tema deixam de dizer a mesma coisa.
 *
 * A lista de recados traz só os que têm mesmo um adereço desenhado contra o
 * qual jogar. Enquanto a arte for chegando peça a peça, ela cresce sozinha.
 */
import type { AnchorConfig, CoffeeConfig, ErrandSpot } from '../themeRegistry';

/** Ordem de ocupação dos lugares. O primeiro é do Feitor — é o lugar de deus. */
export const NOMES_LUGARES: string[] = [
  'desk-feitor',
  'desk-1',
  'desk-2',
  'desk-3',
  'desk-4',
  'desk-5',
  'desk-6',
  'desk-7',
  'desk-8',
  'desk-9',
  'desk-10',
  'desk-11',
  'desk-12',
  'desk-13',
  'desk-14',
];

/** Os bancos das duas mesas do refeitório. */
export const NOMES_LUGARES_CAFE: string[] = [
  'cafe-seat-1',
  'cafe-seat-2',
  'cafe-seat-3',
  'cafe-seat-4',
];

/** Onde se fica de pé no refeitório, e a que serve cada sítio. */
export const BANCAS_CAFE = [
  ['cafe-stand-coffee', 'coffee'],
  ['cafe-stand-vending', 'vending'],
] as const;

/** A adega: o barril das canecas, os barris de espicha, o barril de lavar. */
export const CAFE: CoffeeConfig = {
  trayTile: { x: 31, y: 16 },
  trayStand: { x: 31, y: 17 },
  machineStand: { x: 33, y: 17 },
  sinkTile: { x: 36, y: 16 },
  sinkStand: { x: 36, y: 17 },
  maxCups: 4,
};

/** Os quatro adereços clicáveis — painéis de azulejo do silhar. */
export const ANCORAS: AnchorConfig = {
  calendar: { x: 6, y: 2 },
  boards: { x: 10, y: 13 },
  clock: { x: 8, y: 2 },
  askme: { x: 16, y: 13 },
};

/** Os recados de ócio. Cada `fx` é o adereço, cada `stand` é o tile ao lado
 *  — ambos verificados contra a camada de colisão pelo gerador. */
export const RECADOS: ErrandSpot[] = [

];
