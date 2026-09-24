const test = require('node:test');
const assert = require('node:assert/strict');
const loadTs = require('./load-ts.cjs');
const memory = new Map([
  ['casa.world.scenario', 'invalid'],
  ['tasca.world.characters', JSON.stringify({ bad: 'unknown', saved: 'tasca-rosa' })],
]);
global.localStorage = { getItem: key => memory.get(key) ?? null, setItem: (key, value) => memory.set(key, value) };
const { useWorldScenario, visualCharacter, visualPerson, visualName, renameVisualAgent } = loadTs('src/renderer/src/scene/godot/scenarios.ts');
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


test('Portuguese aliases switch and rename without touching canonical identity or sessions', async () => {
  const agent = Object.freeze({ id: 'antonio-test', name: 'Caminha', character: 'caminha', ptyId: 'live-terminal' });
  const boss = Object.freeze({ id: 'god', name: 'Lourenço', character: 'lourenco', isGod: true });
  useWorldScenario.getState().setCharacter(agent.id, 'tasca-antonio');
  useWorldScenario.getState().setScenario('tasca');
  assert.match(visualName(agent), /^António /);
  assert.equal(visualName(boss), 'José Carlos');
  const original = JSON.stringify(agent);
  let canonicalCalls = 0;
  const rename = async (id, name) => { canonicalCalls++; assert.equal(id, agent.id); assert.equal(name, 'Nome da Casa'); return { ok: true }; };
  assert.deepEqual(await renameVisualAgent(agent.id, '  António Manuel  ', rename), { ok: true });
  assert.equal(canonicalCalls, 0);
  assert.equal(visualName(agent), 'António Manuel');
  assert.equal((await renameVisualAgent(agent.id, '  ', rename)).ok, false);
  assert.equal(JSON.parse(memory.get('tasca.world.names'))[agent.id], 'António Manuel');
  for (let i=0; i<3; i++) {
    useWorldScenario.getState().setScenario('casadaindia');
    assert.equal(visualName(agent), 'Caminha');
    assert.equal(visualName(boss), 'Lourenço');
    useWorldScenario.getState().setScenario('tasca');
    assert.equal(visualName(agent), 'António Manuel');
  }
  assert.equal(JSON.stringify(agent), original);
  // A fresh module simulates reloading the renderer with the same preferences.
  delete require.cache[require.resolve('./load-ts.cjs')];
  const reloaded = require('./load-ts.cjs')('src/renderer/src/scene/godot/scenarios.ts');
  assert.equal(reloaded.visualName(agent), 'António Manuel');
  useWorldScenario.getState().setScenario('casadaindia');
  await renameVisualAgent(agent.id, 'Nome da Casa', rename);
  assert.equal(canonicalCalls, 1);
});
