const test = require('node:test');
const assert = require('node:assert/strict');
const load = require('./load-ts.cjs');
const { switchAgentModel } = load('src/renderer/src/lib/switchAgentModel.ts');

const agent = {id:'worker', name:'Worker', cwd:'/repo', worktreePath:'/worktree', ptyId:'pty-worker', provider:'claude', command:'claude', model:'sonnet', description:'Review code'};
const config = {defaultCommand:'claude',autoMode:false};
function setup() {
  const calls = [], patches = [];
  const deps = {
    api: {
      toolsStatus: async () => [{id:'engine:opencode',label:'OpenCode',found:true}],
      gitIsRepo: async () => true,
      killPty: async (id, options) => { assert.equal(options.preserveWorktree,true); calls.push(['kill',id]); return {ok:true};},
      listPtys: async () => { const spawn = calls.find(c => c[0] === 'spawn')[1]; return [{id:spawn.id,command:spawn.command,model:spawn.args[1],modelKnown:true}]; },
      spawnPty: async options => {calls.push(['spawn',options]); return {ok:true};}
    },
    prepareTerminal: id => {calls.push(['terminal',id]); return {cols:120,rows:40};},
    update: patch => patches.push(patch),
    missingEngine: label => `Missing ${label}`,
    failed:'Failed'
  };
  return {calls,patches,deps};
}

test('switch replaces Claude with the exact local model and clears stale conversation state', async () => {
  const {calls,patches,deps} = setup();
  const model = 'local-123/qwen/qwen3.5-9b';
  await switchAgentModel(agent,config,'opencode',model,deps);
  assert.deepEqual(calls.map(c=>c[0]),['kill','terminal','spawn']);
  const spawn = calls[2][1];
  assert.equal(spawn.command,'opencode');
  assert.deepEqual(spawn.args,['--model',model]);
  assert.equal(spawn.cwd,'/worktree');
  assert.equal(spawn.isolate,false);
  assert.equal(spawn.resume,false);
  assert.equal(spawn.hive.id,agent.id);
  assert.equal(spawn.hive.role,agent.description);
  assert.equal(spawn.cols,120);
  assert.equal(patches[0].model,model);
  assert.equal(patches[0].provider,'opencode');
  assert.equal(patches[0].contextTokens,0);
  assert.equal(patches[0].recentAssistantText,undefined);
});

test('missing OpenCode leaves the Claude process and durable recipe untouched', async () => {
  const {calls,patches,deps} = setup();
  deps.api.toolsStatus = async () => [{id:'engine:opencode',label:'OpenCode',found:false}];
  await assert.rejects(switchAgentModel(agent,config,'opencode','local-123/model',deps),/Missing OpenCode/);
  assert.deepEqual(calls,[]);
  assert.deepEqual(patches,[]);
});

test('failed stop cannot spawn a second agent', async () => {
  const {calls,patches,deps} = setup();
  deps.api.killPty = async () => ({ok:false,error:'stop refused'});
  await assert.rejects(switchAgentModel(agent,config,'opencode','model',deps),/stop refused/);
  assert.deepEqual(calls,[]);
  assert.deepEqual(patches,[]);
});

test('failed spawn is reported without recording a model that never started', async () => {
  const {patches,deps} = setup();
  deps.api.spawnPty = async () => ({ok:false,error:'spawn failed'});
  await assert.rejects(switchAgentModel(agent,config,'opencode','model',deps),/spawn failed/);
  assert.deepEqual(patches,[{status:'blocked',action:'Failed'}]);
});

test('an exited PTY can be replaced and a missing worktree falls back to project', async () => {
  const {calls,patches,deps} = setup();
  deps.api.gitIsRepo = async () => false;
  deps.api.killPty = async () => ({ok:false,error:'no pty: pty-worker'});
  await switchAgentModel(agent,config,'opencode','model',deps);
  assert.equal(calls.find(c=>c[0]==='spawn')[1].cwd,'/repo');
  assert.equal(patches[0].status,'idle');
});


test('does not report success when spawn returns OK but the terminal is still Claude', async () => {
  const {patches,deps} = setup();
  deps.api.listPtys = async () => [{id:'pty-worker',command:'claude'}];
  await assert.rejects(switchAgentModel(agent,config,'opencode','local-123/amalia',deps),/Failed/);
  assert.deepEqual(patches,[{status:'blocked',action:'Failed'}]);
});
