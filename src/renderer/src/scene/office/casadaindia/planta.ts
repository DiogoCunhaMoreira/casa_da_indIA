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
  trayTile: { x: 28, y: 13 },
  trayStand: { x: 28, y: 14 },
  machineStand: { x: 30, y: 14 },
  sinkTile: { x: 32, y: 13 },
  sinkStand: { x: 32, y: 14 },
  maxCups: 4,
};

/** Os três adereços clicáveis. */
export const ANCORAS: AnchorConfig = {
  calendar: { x: 2, y: 1 },
  boards: { x: 4, y: 11 },
  clock: { x: 8, y: 1 },
};

/** Os recados de ócio. Cada `fx` é o adereço, cada `stand` é o tile ao lado
 *  — ambos verificados contra a camada de colisão pelo gerador. */
export const RECADOS: ErrandSpot[] = [
  { kind: 'water', stand: { x: 3, y: 6 }, facing: 'left', fx: { x: 2, y: 6 }, duration: 4.5, godOnly: true },
  { kind: 'smoke', stand: { x: 5, y: 4 }, facing: 'up', fx: { x: 5, y: 2 }, duration: 18, godOnly: true },
  { kind: 'water', stand: { x: 18, y: 8 }, facing: 'right', fx: { x: 19, y: 8 }, duration: 4.5 },
  { kind: 'water', stand: { x: 23, y: 10 }, facing: 'right', fx: { x: 24, y: 10 }, duration: 4.5 },
  { kind: 'water', stand: { x: 28, y: 20 }, facing: 'right', fx: { x: 29, y: 20 }, duration: 4.5 },
  { kind: 'window', stand: { x: 12, y: 4 }, facing: 'up', fx: { x: 12, y: 2 }, duration: 5 },
  { kind: 'window', stand: { x: 21, y: 4 }, facing: 'up', fx: { x: 21, y: 2 }, duration: 5 },
  { kind: 'dispenser', stand: { x: 10, y: 7 }, facing: 'down', fx: { x: 10, y: 8 }, duration: 3.5 },
  { kind: 'dispenser', stand: { x: 32, y: 6 }, facing: 'up', fx: { x: 32, y: 5 }, duration: 3.5 },
  { kind: 'fridge', stand: { x: 21, y: 17 }, facing: 'up', fx: { x: 21, y: 16 }, duration: 3.2 },
  { kind: 'shelf', stand: { x: 21, y: 13 }, facing: 'up', fx: { x: 21, y: 12 }, duration: 4 },
  { kind: 'shelf', stand: { x: 22, y: 20 }, facing: 'up', fx: { x: 22, y: 19 }, duration: 4 },
  { kind: 'bin', stand: { x: 24, y: 7 }, facing: 'right', fx: { x: 25, y: 7 }, duration: 2.6 },
  { kind: 'bin', stand: { x: 31, y: 17 }, facing: 'right', fx: { x: 32, y: 17 }, duration: 2.6 },
];
