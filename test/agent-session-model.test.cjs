const test = require('node:test');
const assert = require('node:assert/strict');
const load = require('./load-ts.cjs');
const {sessionMatchesModel} = load('src/shared/agentSessionModel.ts');

test('saved Amalia is pending when the running PTY is still Claude, including an old main process', () => {
  const live = {id:'pty-caminha',command:'/Users/example/bin/claude'};
  assert.equal(sessionMatchesModel(live,'opencode','local-123/amalia-9b-0626-dpo'),false);
});
test('checks the actual model when a current main process reports it', () => {
  const live = {id:'pty-caminha',command:'/bin/opencode',model:'local-123/amalia',modelKnown:true};
  assert.equal(sessionMatchesModel(live,'opencode','local-123/amalia'),true);
  assert.equal(sessionMatchesModel(live,'opencode','local-123/qwen'),false);
  assert.equal(sessionMatchesModel({...live,model:undefined},'opencode','local-123/amalia'),false);
});
test('missing session requires applying the recipe, same engine in legacy main stays compatible', () => {
  assert.equal(sessionMatchesModel(undefined,'opencode','local-123/amalia'),false);
  assert.equal(sessionMatchesModel({id:'pty',command:'opencode'},'opencode','local-123/amalia'),true);
});
