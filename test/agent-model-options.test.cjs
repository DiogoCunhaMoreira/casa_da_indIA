const test = require('node:test');
const assert = require('node:assert/strict');
const load = require('./load-ts.cjs');
const { agentModelOptions } = load('src/shared/agentModelOptions.ts');

test('one engine default and one option per identifier, even with duplicate catalog entries', () => {
  assert.deepEqual(agentModelOptions([
    {label:'CLI default'}, {label:'Custom'}, {id:'',label:'Custom'},
    {id:'qwen',label:'Qwen'}, {id:'qwen',label:'Duplicate'}
  ], undefined, 'Predefinição'), [{id:'',label:'Predefinição'}, {id:'qwen',label:'Qwen'}]);
});

test('keeps a saved local model selected without mixing in unconfigured local examples', () => {
  const slug = 'local-123/qwen/qwen3.5-9b';
  const options = agentModelOptions([
    {label:'default'}, {id:'local/llama3',label:'Example local'},
    {id:'openai/local',label:'Example proxy'}, {id:'remote/model',label:'Remote'}
  ], slug, 'Default');
  assert.deepEqual(options.map(o=>o.id), ['', 'remote/model', slug]);
});

test('preserves existing legacy and uncatalogued models rather than silently changing them', () => {
  for (const current of ['local/llama3', 'openai/local', 'org/unlisted-model']) {
    const options = agentModelOptions([{id:'local/llama3',label:'Legacy'}],current,'Default');
    assert.equal(options.filter(option=>option.id===current).length,1);
  }
});
