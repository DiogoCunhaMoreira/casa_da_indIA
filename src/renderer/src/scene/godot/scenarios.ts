import { useCallback } from 'react';
import { create } from 'zustand';
import { isWorldScenario, type WorldScenario } from '@shared/worldBridge';
import { ELENCO as CASA_CAST } from '../../elenco/pessoas';
import { TASCA_CAST, defaultTascaCharacter } from './tascaCast';

export const SCENARIO_LABELS = { casadaindia: 'Casa da Índia', tasca: 'Tasca Portuguesa' };
export const TASCA_ROOM_LABELS = ['tascaOverview', 'tascaCounter', 'tascaTables', 'tascaPrivate', 'tascaKitchen', 'tascaPantry', 'tascaPatio'];
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
function loadNames(): Record<string, string> {
  try {
    const raw = JSON.parse(readWorldPreference('tasca.world.names') || '{}');
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
    return Object.fromEntries(Object.entries(raw).filter(([, value]) => typeof value === 'string' && value.trim())) as Record<string, string>;
  } catch { return {}; }
}
export const useWorldScenario = create<{
  scenario: WorldScenario;
  characters: Record<string, string>;
  names: Record<string, string>;
  setName: (id: string, name: string) => void;
  setScenario: (scenario: WorldScenario) => void;
  setCharacter: (id: string, character: string) => void;
}>((set) => ({
  scenario: isWorldScenario(saved) ? saved : 'casadaindia',
  characters: loadCharacters(),
  names: loadNames(),
  setName: (id, name) => {
    if (!name.trim()) return;
    set(state => {
      const names = { ...state.names, [id]: name.trim() };
      saveWorldPreference('tasca.world.names', JSON.stringify(names));
      return { names };
    });
  },
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

type NamedAgent = { id: string; name: string; character?: string; isGod?: boolean };
/** Scene aliases never change the agent identity, terminal or orchestration data. */
export function visualName(agent: NamedAgent, scenario = useWorldScenario.getState().scenario): string {
  if (scenario === 'casadaindia') return agent.name;
  const saved = useWorldScenario.getState().names[agent.id];
  if (saved) return saved;
  if (agent.isGod) return 'José Carlos';
  const surnames = ['Silva', 'Santos', 'Ferreira', 'Pereira', 'Costa', 'Rodrigues', 'Martins', 'Sousa', 'Fernandes', 'Gonçalves', 'Lopes', 'Marques', 'Almeida', 'Ribeiro', 'Carvalho', 'Teixeira'];
  let hash = 0;
  for (const c of agent.id) hash = (Math.imul(hash, 31) + c.charCodeAt(0)) >>> 0;
  return `${visualPerson(visualCharacter({ ...agent, character: agent.character ?? '' }, scenario)).nome} ${surnames[hash % surnames.length]}`;
}
export function useAgentNames() {
  const scenario = useWorldScenario(s => s.scenario);
  const names = useWorldScenario(s => s.names);
  const characters = useWorldScenario(s => s.characters);
  return useCallback((agent: NamedAgent) => visualName(agent, scenario), [scenario, names, characters]);
}
export async function renameVisualAgent(id: string, name: string, rename: (id: string, name: string) => Promise<{ ok: boolean; error?: string }>) {
  if (useWorldScenario.getState().scenario === 'casadaindia') return rename(id, name);
  if (!name.trim()) return { ok: false, error: 'Indique um nome.' };
  useWorldScenario.getState().setName(id, name);
  return { ok: true };
}
