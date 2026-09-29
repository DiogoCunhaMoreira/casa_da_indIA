'use strict';
/**
 * Agent-provider registry tests. Self-contained, no test framework — run with
 * `node test/agent-provider.test.cjs` (mirrors test/kg-core.test.cjs). The
 * registry lives in TypeScript (src/shared/agentProvider.ts), so we transpile it
 * and its dependency-free command-group siblings with the bundled `typescript`
 * compiler into a temp dir and require the result. Exercises the three engines
 * the app ships (Claude Code, Codex, OpenCode): registration, command inference
 * and the hook bridge each non-Claude engine uses.
 */

const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const ts = require('typescript');

const SHARED = path.join(__dirname, '..', 'src', 'shared');
const out = fs.mkdtempSync(path.join(os.tmpdir(), 'agentprov-'));
for (const name of ['claudeCommands', 'codexCommands', 'agentProvider']) {
  const src = fs.readFileSync(path.join(SHARED, `${name}.ts`), 'utf8');
  const js = ts.transpileModule(src, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
  }).outputText;
  fs.writeFileSync(path.join(out, `${name}.js`), js, 'utf8');
}
const ap = require(path.join(out, 'agentProvider.js'));

let failures = 0;
function test(name, fn) {
  try { fn(); console.log(`  ✓ ${name}`); }
  catch (err) { failures++; console.log(`  ✗ ${name}\n     ${err && err.message}`); }
}

console.log('agent-provider registry tests');

test('only claude, codex and opencode are registered', () => {
  assert.deepStrictEqual(ap.AGENT_PROVIDER_PRESETS.map((p) => p.id), ['claude', 'codex', 'opencode']);
  for (const gone of ['copilot', 'cursor', 'grok', 'kimi', 'gemini', 'antigravity', 'qwen', 'crush', 'pi', 'custom']) {
    assert.strictEqual(ap.isAgentProvider(gone), false, `${gone} is no longer a provider`);
  }
});

test('inferAgentProvider maps codex and opencode binaries, everything else to claude', () => {
  assert.strictEqual(ap.inferAgentProvider('codex'), 'codex');
  assert.strictEqual(ap.inferAgentProvider('/usr/local/bin/opencode --model x'), 'opencode');
  assert.strictEqual(ap.inferAgentProvider('C:\\tools\\codex.exe'), 'codex');
  assert.strictEqual(ap.inferAgentProvider('claude'), 'claude');
  assert.strictEqual(ap.inferAgentProvider('some-other-cli'), 'claude');
  assert.strictEqual(ap.inferAgentProvider('codex', 'opencode'), 'opencode', 'explicit provider wins');
});

test('non-Claude engines ride a hook bridge and an initial prompt', () => {
  const codex = ap.providerPreset('codex');
  assert.strictEqual(codex.hiveAware, false);
  assert.strictEqual(codex.hookBridge, 'codex');
  assert.strictEqual(codex.positionalInitialPrompt, true);
  const opencode = ap.providerPreset('opencode');
  assert.strictEqual(opencode.hiveAware, false);
  assert.strictEqual(opencode.hookBridge, 'opencode');
  assert.strictEqual(opencode.initialPromptFlag, '--prompt');
  assert.strictEqual(ap.providerPreset('claude').hiveAware, true);
});

if (failures > 0) {
  console.log(`\n${failures} test(s) failed`);
  process.exit(1);
}
console.log('\nAll agent-provider tests passed');
