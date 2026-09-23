// Fictional cast. Presentation only: never used as agent instructions or capabilities.
export const TASCA_CAST = [
  ['manuel', 'Manuel', 'Taberneiro', '#D9A273', '#7A7A72', '#ece0c5', 'bigode', 'nenhuma', 'apron'],
  ['lurdes', 'Lurdes', 'Cozinheira', '#F0C8A0', '#4A3121', '#ece6db', 'nenhuma', 'coifa', 'apron'],
  ['rosa', 'Rosa', 'Empregada', '#B67B4E', '#1C1A19', '#9b5149', 'nenhuma', 'nenhuma', 'apron'],
  ['joaquim', 'Joaquim', 'Empregado', '#D9A273', '#4A3121', '#487b80', 'curta', 'nenhuma', 'apron'],
  ['antonio', 'António', 'Carteiro', '#F0C8A0', '#7A7A72', '#445b79', 'bigode', 'barrete', 'shirt'],
  ['amelia', 'Amélia', 'Vizinha', '#8A5433', '#D8D4C8', '#986e92', 'nenhuma', 'nenhuma', 'shirt'],
  ['celeste', 'Celeste', 'Comerciante', '#D9A273', '#8C3B1B', '#73844b', 'nenhuma', 'nenhuma', 'shirt'],
  ['ze', 'Zé', 'Cliente habitual', '#B67B4E', '#4A3121', '#b98845', 'curta', 'barrete', 'shirt'],
].map(([id, nome, cargo, pele, cabelo, corCorpo, barba, cabeca, outfit]) => ({
  id: `tasca-${id}`, nome, cargo, pele, cabelo, corCorpo, barba, cabeca,
  capa: 'nenhuma', corCapa: '#78503d', outfit,
}));
export function defaultTascaCharacter(agent: { id: string; isGod?: boolean }): string {
  if (agent.isGod) return TASCA_CAST[0].id;
  let hash = 0;
  for (const char of agent.id) hash = (Math.imul(hash, 31) + char.charCodeAt(0)) | 0;
  return TASCA_CAST[1 + (hash >>> 0) % (TASCA_CAST.length - 1)].id;
}
