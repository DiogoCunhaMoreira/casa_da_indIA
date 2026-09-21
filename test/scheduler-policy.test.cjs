const test = require('node:test');
const assert = require('node:assert/strict');
const { shouldDispatchStandup } = require('./load-ts.cjs')('src/shared/schedulerPolicy.ts');
test('a greeting on an empty floor needs no standup, even with completed history', () => {
  const agents = { chief: {isGod:true}, old: {archived:true}, prep: {isAssistant:true} };
  assert.equal(shouldDispatchStandup(agents, 'chief', { tasks: [] }), false);
  assert.equal(shouldDispatchStandup(agents, 'chief', [{status:'done'}]), false);
  assert.equal(shouldDispatchStandup(agents, 'chief', { tasks: [{status:'blocked'}] }), true);
  assert.equal(shouldDispatchStandup({...agents, worker:{}}, 'chief', { tasks: [] }), true);
});
