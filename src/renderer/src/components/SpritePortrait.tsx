import { useWorldScenario, visualCharacter, visualPerson } from '@/scene/godot/scenarios';
import { useStore } from '@/store/store';

/** Native portrait size in px (width × height = 18 × 28), before scaling. */
export const PORTRAIT_W = 18;
export const PORTRAIT_H = 28;

export interface SpritePortraitProps {
  character: string;
  agentId?: string;
  /** Retains the existing layout scale while displaying a smooth 3D render. */
  scale?: number;
  background?: string;
}

/** Offline portraits rendered from the same Godot models as the live world.
 * The component name is retained for existing callers; there is no sprite canvas. */
export function SpritePortrait({ character, agentId, scale = 2, background = 'transparent' }: SpritePortraitProps) {
  const scenario = useWorldScenario(s => s.scenario);
  useWorldScenario(s => s.characters);
  const agent = useStore(s => agentId ? s.agents.find(a => a.id === agentId) : undefined);
  const resolved = agent ? visualCharacter(agent, scenario) : character;
  const person = visualPerson(resolved);
  return <img
    src={new URL(`portraits/${person.id}.png`, document.baseURI).href}
    alt={person.nome}
    width={Math.round(PORTRAIT_W * scale)} height={Math.round(PORTRAIT_H * scale)}
    draggable={false}
    style={{ width: Math.round(PORTRAIT_W * scale), height: Math.round(PORTRAIT_H * scale), objectFit: 'contain', background, flexShrink: 0 }}
  />;
}
