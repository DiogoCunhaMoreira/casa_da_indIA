import { create } from 'zustand';
import { isWorldScenario, type WorldScenario } from '@shared/worldBridge';
import { ELENCO as CASA_CAST } from '../office/casadaindia/elenco';
import { TASCA_CAST, defaultTascaCharacter } from './tascaCast';

export const SCENARIO_LABELS = { casadaindia: 'Casa da Índia', tasca: 'Tasca Portuguesa' };
export const TASCA_ROOM_LABELS = ['tascaOverview', 'tascaCounter', 'tascaTables', 'tascaKitchen', 'tascaPantry', 'tascaPatio'];
export const readWorldPreference = (key: string) => { try { return localStorage.getItem(key); } catch { return null; } };
export const saveWorldPreference = (key: string, value: string) => { try { localStorage.setItem(key, value); } catch { /* Keep the in-memory choice. */ } };
const saved = readWorldPreference('casa.world.scenario');
function loadCharacters(): Record<string, string> {
  try {
    const raw = JSON.parse(readWorldPreference('tasca.world.characters') || '{}');
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
    return Object.fromEntries(Object.entries(raw).filter(([, value]) => TASCA_CAST.some(c => c.id === value))) as Record<string, string>;
  } catch { return {}; }
}
export const useWorldScenario = create<{
  scenario: WorldScenario;
  characters: Record<string, string>;
  setScenario: (scenario: WorldScenario) => void;
  setCharacter: (id: string, character: string) => void;
}>((set) => ({
  scenario: isWorldScenario(saved) ? saved : 'casadaindia',
  characters: loadCharacters(),
  setScenario: scenario => { if (!isWorldScenario(scenario)) return; saveWorldPreference('casa.world.scenario', scenario); set({ scenario }); },
  setCharacter: (id, character) => {
    if (!TASCA_CAST.some(c => c.id === character)) return;
    set(state => {
      const characters = { ...state.characters, [id]: character };
      saveWorldPreference('tasca.world.characters', JSON.stringify(characters));
      return { characters };
    });
  },
}));
export function visualCharacter(agent: { id: string; character: string; isGod?: boolean }, scenario = useWorldScenario.getState().scenario): string {
  if (scenario === 'casadaindia') return agent.character;
  return useWorldScenario.getState().characters[agent.id] ?? defaultTascaCharacter(agent);
}
export function visualPerson(character: string) {
  return TASCA_CAST.find(c => c.id === character) ?? CASA_CAST.find(c => c.id === character) ?? CASA_CAST[0];
}
export const TASCA_ROSTER = TASCA_CAST.map(c => ({ name: c.id, displayName: c.nome, shirt: c.corCorpo, blurb: c.cargo }));
