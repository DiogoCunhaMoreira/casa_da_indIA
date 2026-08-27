// Elenco — o tipo de uma personagem, e as texturas com que ela anda na cena.
//
// Este ficheiro já não sabe QUEM é o elenco: quem o diz é o tema, em
// `casadaindia/elenco.ts`, e quem o serve à interface é `TEMA.cast.roster`. Aqui
// fica só a maquinaria, que é a mesma para qualquer roster.
//
// Tanto os retratos estáticos (cartões, escolha de cara) como os sprites que
// andam pelo chão saem das mesmas receitas por personagem, no `portraitArt.ts`:
// o sprite reaproveita a cabeça, a cara e a roupa do retrato e acrescenta-lhe
// pernas, para que um agente no chão seja igual ao cartão dele. As folhas base
// do LimeZu não são usadas para o elenco. Ver assets/ATTRIBUTION.md.

import { Texture } from 'pixi.js';
import { paintPortrait, sceneFrameBufs, SCENE_W, SCENE_H } from './portraitArt';

/** O nome de uma personagem. É só uma string: quem manda são as receitas
 *  registadas no `portraitArt` e o roster do tema. */
export type CharacterName = string;

export interface CastMember {
  name: CharacterName;
  displayName: string;
  /** Cor de assinatura (hex) — usada no brilho de selecção na cena. */
  shirt: string;
  /** A linha que aparece quando esta cara é escolhida ou ainda não tem descrição. */
  blurb: string;
}

export function hexToNumber(hex: string): number {
  return parseInt(hex.replace('#', ''), 16);
}

// ─── scene frames ────────────────────────────────────────────────────────────
const frameCache = new Map<string, Texture[][]>();

function bufToTexture(buf: Uint8ClampedArray): Texture {
  const canvas = document.createElement('canvas');
  canvas.width = SCENE_W; canvas.height = SCENE_H;
  const ctx = canvas.getContext('2d')!;
  const img = ctx.createImageData(SCENE_W, SCENE_H);
  img.data.set(buf);
  ctx.putImageData(img, 0, 0);
  const tex = Texture.from(canvas);
  tex.source.scaleMode = 'nearest';
  return tex;
}

/**
 * Frame grid CharacterSprite expects: 3 rows (down, up, right) × 7 frames
 * [walk1, walk2, walk3, type1, type2, read1, read2]. We provide a front view
 * (down — and reused for the side row, so left/right walkers still show a face)
 * and a back view (up — agents seated facing their desk show their back). The
 * three walk frames are stand / step-left / step-right.
 */
export async function getCastFrames(name: string): Promise<Texture[][]> {
  const cached = frameCache.get(name);
  if (cached) return cached;
  const { front, back } = sceneFrameBufs(name);
  const toRow = (bufs: Uint8ClampedArray[]): Texture[] => {
    const [stand, stepL, stepR] = bufs.map(bufToTexture);
    return [stand, stepL, stepR, stand, stand, stand, stand];
  };
  const frontRow = toRow(front);
  const frames: Texture[][] = [frontRow, toRow(back), frontRow]; // down, up, right
  frameCache.set(name, frames);
  return frames;
}

/**
 * Paint a character's static portrait for cards / the picker (delegates to the
 * custom procedural composer in portraitArt.ts).
 */
export async function paintCastPortrait(
  ctx: CanvasRenderingContext2D,
  name: string,
  scale = 2,
): Promise<void> {
  paintPortrait(ctx, name, scale);
}
