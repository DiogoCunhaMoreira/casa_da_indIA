/**
 * A planta da Ribeira das Naus, em coordenadas de tile.
 *
 * GERADO por `tools/mapgen/build_ribeira.py` a partir do mesmo código que
 * desenha o `ribeira.tmj`. Não edites à mão — muda a planta no gerador e
 * volta a correr, ou o mapa e o tema deixam de dizer a mesma coisa.
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
  { kind: 'smoke', stand: { x: 5, y: 3 }, facing: 'up', fx: { x: 5, y: 2 }, duration: 18, godOnly: true },
  { kind: 'window', stand: { x: 14, y: 3 }, facing: 'up', fx: { x: 14, y: 2 }, duration: 5 },
  { kind: 'window', stand: { x: 25, y: 3 }, facing: 'up', fx: { x: 25, y: 2 }, duration: 5 },
  { kind: 'window', stand: { x: 33, y: 3 }, facing: 'up', fx: { x: 33, y: 2 }, duration: 5 },
  { kind: 'dispenser', stand: { x: 34, y: 5 }, facing: 'up', fx: { x: 34, y: 4 }, duration: 3.5 },
  { kind: 'dispenser', stand: { x: 37, y: 20 }, facing: 'up', fx: { x: 37, y: 19 }, duration: 3.5 },
  { kind: 'fridge', stand: { x: 24, y: 16 }, facing: 'up', fx: { x: 24, y: 15 }, duration: 3.2 },
  { kind: 'fridge', stand: { x: 30, y: 16 }, facing: 'up', fx: { x: 30, y: 15 }, duration: 3.2 },
  { kind: 'shelf', stand: { x: 23, y: 18 }, facing: 'up', fx: { x: 23, y: 17 }, duration: 4 },
  { kind: 'shelf', stand: { x: 30, y: 26 }, facing: 'up', fx: { x: 30, y: 25 }, duration: 4 },
  { kind: 'bin', stand: { x: 23, y: 25 }, facing: 'up', fx: { x: 23, y: 24 }, duration: 2.6 },
  { kind: 'bin', stand: { x: 12, y: 10 }, facing: 'up', fx: { x: 12, y: 9 }, duration: 2.6 },
];
