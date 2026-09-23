const test = require('node:test');
const assert = require('node:assert/strict');
const loadTs = require('./load-ts.cjs');
const memory = new Map([
  ['casa.world.scenario', 'invalid'],
  ['tasca.world.characters', JSON.stringify({ bad: 'unknown', saved: 'tasca-rosa' })],
]);
global.localStorage = { getItem: key => memory.get(key) ?? null, setItem: (key, value) => memory.set(key, value) };
const { useWorldScenario, visualCharacter, visualPerson } = loadTs('src/renderer/src/scene/godot/scenarios.ts');
const { TASCA_CAST, defaultTascaCharacter } = loadTs('src/renderer/src/scene/godot/tascaCast.ts');

test('invalid preferences recover and visual switching preserves agent data', () => {
  assert.equal(useWorldScenario.getState().scenario, 'casadaindia');
  assert.deepEqual(useWorldScenario.getState().characters, { saved: 'tasca-rosa' });
  const agent = Object.freeze({ id: 'worker', name: 'My custom name', character: 'caminha', ptyId: 'running' });
  const boss = Object.freeze({ id: 'boss', character: 'lourenco', isGod: true });
  const before = JSON.stringify(agent);
  const defaultCharacter = defaultTascaCharacter(agent);
  assert.ok(TASCA_CAST.some(c => c.id === defaultCharacter));
  for (let i = 0; i < 3; i++) {
    useWorldScenario.getState().setScenario('tasca');
    assert.equal(visualCharacter(boss), 'tasca-manuel');
    assert.equal(visualCharacter(agent), i ? 'tasca-celeste' : defaultCharacter);
    useWorldScenario.getState().setCharacter(agent.id, 'tasca-celeste');
    assert.equal(visualPerson(visualCharacter(agent)).nome, 'Celeste');
    useWorldScenario.getState().setScenario('casadaindia');
    assert.equal(visualCharacter(agent), 'caminha');
    assert.equal(JSON.stringify(agent), before);
  }
  assert.equal(JSON.parse(memory.get('tasca.world.characters')).worker, 'tasca-celeste');
  assert.equal(memory.get('casa.world.scenario'), 'casadaindia');
  useWorldScenario.getState().setCharacter(agent.id, '../missing');
  assert.equal(useWorldScenario.getState().characters.worker, 'tasca-celeste');
  useWorldScenario.getState().setScenario('unknown');
  assert.equal(useWorldScenario.getState().scenario, 'casadaindia');
});
