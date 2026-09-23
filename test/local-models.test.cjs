const test = require('node:test');
const assert = require('node:assert/strict');
const load = require('./load-ts.cjs');
const { normalizeLocalUrl, parseLocalModels, localModelSlug, localProviderConfig } = load('src/shared/localModels.ts');
const { discoverLocalModels } = load('src/main/localModels.ts');
const { buildSpawnCommand, tokenizeCommand } = load('src/renderer/src/store/config.ts');

test('normalizes addresses, preserving reverse proxy paths and rejecting embedded secrets', () => {
  assert.equal(normalizeLocalUrl(' http://localhost:1234/ '), 'http://localhost:1234/v1');
  assert.equal(normalizeLocalUrl('http://host:8000/v1/models/'), 'http://host:8000/v1');
  assert.equal(normalizeLocalUrl('https://host/inference/v1/'), 'https://host/inference/v1');
  for (const url of ['file:///tmp/foo', 'http://secret:pass@host', 'http://host?key=secret', 'bad']) assert.throws(() => normalizeLocalUrl(url));
});

test('discovery keeps real model identifiers and handles empty or malformed lists', () => {
  assert.deepEqual(parseLocalModels({ data: [{id:'org/model:Q4'}, {id:'org/model:Q4'}, null, {id:4}] }), ['org/model:Q4']);
  assert.deepEqual(parseLocalModels({data:[]}), []);
  assert.throws(() => parseLocalModels({models:[]}));
});

test('selected model reaches its own server and only its own credential', () => {
  const connections = [
    {id:'local-one', kind:'lmstudio', baseUrl:'http://localhost:1234/v1', model:'org/model:Q4'},
    {id:'local-two', kind:'vllm', baseUrl:'http://host:8000/v1', model:'org/model:Q4'}
  ];
  const slug = localModelSlug(connections[1]);
  const cmd = buildSpawnCommand({defaultCommand:'claude',autoMode:false}, slug, 'opencode');
  const args = tokenizeCommand(cmd);
  assert.equal(args[args.indexOf('--model')+1], slug);
  const requested = [];
  const providers = localProviderConfig(connections, slug, id => { requested.push(id); return 'secret'; });
  assert.deepEqual(requested, ['local-two']);
  assert.deepEqual(Object.keys(providers), ['local-two']);
  assert.equal(providers['local-two'].options.baseURL, 'http://host:8000/v1');
  assert.equal(providers['local-two'].options.apiKey, 'secret');
  assert.ok(providers['local-two'].models['org/model:Q4']);
  assert.deepEqual(localProviderConfig(connections, 'openai/other', () => assert.fail()), {});
});

test('probe uses a bounded non-redirecting request and reports actionable errors', async () => {
  const original = global.fetch;
  try {
    global.fetch = async (url, options) => {
      assert.equal(url, 'http://localhost:1234/v1/models');
      assert.equal(options.headers.Authorization, 'Bearer token');
      assert.equal(options.redirect, 'error');
      assert.ok(options.signal);
      return {ok:true,json:async()=>({data:[{id:'model'}]})};
    };
    assert.deepEqual(await discoverLocalModels({baseUrl:'http://localhost:1234',key:'token'}), {ok:true,baseUrl:'http://localhost:1234/v1',models:['model']});
    global.fetch = async () => ({ok:false,status:401});
    assert.equal((await discoverLocalModels({baseUrl:'http://localhost:1234'})).error,'auth');
    global.fetch = async () => { throw new Error('offline'); };
    assert.equal((await discoverLocalModels({baseUrl:'http://localhost:1234'})).error,'connection');
    assert.equal((await discoverLocalModels({baseUrl:'file:///tmp/file'})).error,'invalid_url');
  } finally { global.fetch = original; }
});
