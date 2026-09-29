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

test('keeps a saved local model selected even when it is not in the catalog', () => {
  const slug = 'local-123/qwen/qwen3.5-9b';
  const options = agentModelOptions([{label:'default'}, {id:'remote/model',label:'Remote'}], slug, 'Default');
  assert.deepEqual(options.map(o=>o.id), ['', 'remote/model', slug]);
});

test('preserves uncatalogued models rather than silently changing them', () => {
  const options = agentModelOptions([{id:'known',label:'Known'}],'org/unlisted-model','Default');
  assert.equal(options.filter(option=>option.id==='org/unlisted-model').length,1);
});
