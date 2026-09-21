const test = require('node:test');
const assert = require('node:assert/strict');
const loadTs = require('./load-ts.cjs');
const { allocateWorldSeats, isWorldRequest } = loadTs('src/shared/worldBridge.ts');
test('stable seats survive reorder, deletion, corrupted saved assignments and overflow', () => {
  const agents = Array.from({ length: 24 }, (_, i) => ({ id: `a${i}`, isGod: i === 0 }));
  const seats = allocateWorldSeats(agents, { a0: 5, a1: 0, a2: 200, a3: -1, a4: 1, a5: 1 });
  assert.equal(seats.a0, 0);
  assert.equal(Object.keys(seats).length, 21);
  assert.equal(new Set(Object.values(seats)).size, 21);
  assert.deepEqual(allocateWorldSeats([...agents].reverse(), seats), seats);
  const remaining = agents.filter(a => a.id !== 'a4');
  const next = allocateWorldSeats(remaining, seats);
  assert.equal(next.a4, undefined);
  assert.equal(next.a21, seats.a4);
  assert.equal(next.a5, seats.a5);
});
test('visual requests accept only known version, commands and bounded identities', () => {
  for (const value of [null, {}, {version:2,type:'ready'}, {version:1,type:'exec',command:'x'}, {version:1,type:'openTerminal',id:''}, {version:1,type:'view',room:'../secret'}]) assert.equal(isWorldRequest(value), false);
  assert.equal(isWorldRequest({version:1,type:'ready'}), true);
  assert.equal(isWorldRequest({version:1,type:'select',id:'real-id'}), true);
  assert.equal(isWorldRequest({version:1,type:'view',room:'refeitorio'}), true);
});

test('retiring the entrance desk relocates its occupant without moving other agents', () => {
  const next = allocateWorldSeats([{ id: 'feitor', isGod: true }, { id: 'door' }, { id: 'keep' }], { feitor: 0, door: 5, keep: 9 });
  assert.equal(next.feitor, 0);
  assert.equal(next.keep, 9);
  assert.equal(next.door, 1);
  assert.ok(!Object.values(next).includes(5));
});
