import { ELENCO } from '@/scene/office/casadaindia/elenco';

export interface SpritePortraitProps {
  character: string;
  /** Retains the existing layout scale while displaying a smooth 3D render. */
  scale?: number;
  background?: string;
}

/** Offline portraits rendered from the same Godot models as the live world.
 * The component name is retained for existing callers; there is no sprite canvas. */
export function SpritePortrait({ character, scale = 2, background = 'transparent' }: SpritePortraitProps) {
  const person = ELENCO.find(c => c.id === character) ?? ELENCO[0];
  return <img
    src={new URL(`portraits/${person.id}.png`, document.baseURI).href}
    alt={person.nome}
    width={Math.round(18 * scale)} height={Math.round(28 * scale)}
    draggable={false}
    style={{ width: Math.round(18 * scale), height: Math.round(28 * scale), objectFit: 'contain', background, flexShrink: 0 }}
  />;
}
