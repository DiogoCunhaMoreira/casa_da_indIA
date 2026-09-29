'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const loadTs = require('./load-ts.cjs');

const {
  inferAgentProvider,
  providerPreset
} = loadTs('src/shared/agentProvider.ts');
const {
  buildSpawnCommand,
  decodeProviderModel,
  encodeProviderModel,
  modelProvidersForAgent,
  modelsForProvider
} = loadTs('src/renderer/src/store/config.ts');

const autoConfig = { defaultCommand: 'claude', autoMode: true };

test('OpenCode is inferred, prompt-seeded and has no auto flag of its own', () => {
  assert.equal(inferAgentProvider('/usr/local/bin/opencode'), 'opencode');
  const preset = providerPreset('opencode');
  assert.equal(preset.defaultCommand, 'opencode');
  assert.equal(preset.autoFlag, '');
  assert.equal(preset.initialPromptFlag, '--prompt');
  assert.equal(preset.recommendedOrchestratorModel, undefined);
});

test('provider commands use matching models and equivalent bypass modes', () => {
  assert.equal(
    buildSpawnCommand(autoConfig, 'claude-sonnet-5', 'claude'),
    'claude --model claude-sonnet-5 --permission-mode bypassPermissions'
  );
  assert.equal(
    buildSpawnCommand(autoConfig, 'gpt-5.6-sol', 'codex'),
    'codex --model gpt-5.6-sol -a never -s workspace-write'
  );
  // OpenCode's auto-approve rides in its config env var, never on argv.
  assert.equal(
    buildSpawnCommand(autoConfig, 'local-1/qwen3', 'opencode'),
    'opencode --model local-1/qwen3'
  );
});

test('model picker options stay provider-specific', () => {
  assert.equal(
    modelsForProvider('claude').find((model) => model.id === 'claude-opus-5')?.label,
    'Opus 5 · 1M'
  );
  assert.deepEqual(
    modelsForProvider('codex').map((model) => model.id),
    [undefined, 'gpt-5.6-sol', 'gpt-5.6-terra', 'gpt-5.6-luna']
  );
  assert.deepEqual(modelsForProvider('opencode').map((model) => model.id), [undefined]);
});

test('Command Center model choices round-trip provider and model', () => {
  const encoded = encodeProviderModel('opencode', 'local-1/My Model');
  assert.deepEqual(
    decodeProviderModel(encoded),
    { provider: 'opencode', model: 'local-1/My Model' }
  );
  assert.deepEqual(
    decodeProviderModel(encodeProviderModel('codex')),
    { provider: 'codex', model: undefined }
  );
  assert.equal(decodeProviderModel('unknown:model'), null);
});

test('every engine is offered in the model picker', () => {
  assert.deepEqual(
    modelProvidersForAgent().map((preset) => preset.id),
    ['claude', 'codex', 'opencode']
  );
});
