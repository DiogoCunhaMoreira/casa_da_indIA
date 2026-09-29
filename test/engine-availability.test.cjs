'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const loadTs = require('./load-ts.cjs');

const {
  classifyEngineAvailability,
  engineBlocksOnboarding,
  engineAvailabilityBadge,
  engineAvailabilityMessage
} = loadTs('src/shared/engineAvailability.ts');
const { toolCatalog } = loadTs('src/shared/toolCatalog.ts');

// Build what `tools:status` returns for a machine where `found` lists the only
// binaries present. Mirrors the main-process handler's shape without electron.
function statusesFor(found) {
  return toolCatalog().map((spec) => ({
    ...spec,
    installCommand: spec.install.posix,
    found: !!spec.bin && found.includes(spec.bin),
    path: spec.bin && found.includes(spec.bin) ? `/usr/local/bin/${spec.bin}` : null
  }));
}

test('an installed engine is installed, whatever its installer story', () => {
  const s = statusesFor(['claude', 'opencode']);
  assert.equal(classifyEngineAvailability(s, 'claude').state, 'installed');
  assert.equal(classifyEngineAvailability(s, 'opencode').state, 'installed');
  assert.equal(classifyEngineAvailability(s, 'opencode').path, '/usr/local/bin/opencode');
});

test('a missing engine with an installer installs on first run and does not block', () => {
  const s = statusesFor([]);
  for (const id of ['claude', 'codex', 'opencode']) {
    const a = classifyEngineAvailability(s, id);
    assert.equal(a.state, 'installs-on-first-run', id);
    assert.ok(a.installCommand.length > 0, id);
    assert.equal(engineBlocksOnboarding(a), false, id);
  }
});

test('a missing engine with no installer blocks onboarding with a plain message', () => {
  const s = [{ id: 'engine:codex', bin: 'codex', label: 'Codex', kind: 'engine', installCommand: '', found: false, path: null }];
  const a = classifyEngineAvailability(s, 'codex');
  assert.equal(a.state, 'not-installable');
  assert.equal(engineBlocksOnboarding(a), true);
  assert.equal(engineAvailabilityBadge(a), 'NOT INSTALLED');
  const msg = engineAvailabilityMessage(a, 'Codex');
  assert.match(msg, /not installed/);
  assert.match(msg, /check again/);
  assert.match(msg, /Claude Code/);
  assert.doesNotMatch(msg, /[–—-]/, 'no dashes in user facing prose');
});

test('no probe result means unknown, and unknown never blocks', () => {
  const a = classifyEngineAvailability(undefined, 'codex');
  assert.equal(a.state, 'unknown');
  assert.equal(engineBlocksOnboarding(a), false);
  assert.equal(engineAvailabilityBadge(a), null);
  assert.equal(engineAvailabilityMessage(a, 'Codex'), null);
  // a probe that ran but lacks the row behaves the same
  assert.equal(classifyEngineAvailability([], 'codex').state, 'unknown');
});

test('only the dead end has a message', () => {
  const s = statusesFor(['claude']);
  assert.equal(engineAvailabilityMessage(classifyEngineAvailability(s, 'claude'), 'Claude Code'), null);
  assert.equal(engineAvailabilityMessage(classifyEngineAvailability(s, 'codex'), 'Codex'), null);
});
