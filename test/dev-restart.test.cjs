const { test } = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const { readFileSync } = require('node:fs');
const ts = require('typescript');
const { runDev } = require('../tools/dev.cjs');

function setup() {
  const host = Object.assign(new EventEmitter(), { env: { TEST: 'kept' } });
  const children = [];
  runDev('node', ['vite', 'dev', '--watch'], {
    host,
    spawnChild(command, args, options) {
      const child = new EventEmitter();
      child.kill = (signal) => child.emit('close', null, signal);
      children.push({ child, command, args, options });
      return child;
    }
  });
  return { host, children };
}

test('folder restart relaunches the dev server with its arguments and environment', () => {
  const { children, host } = setup();
  children[0].child.emit('close', 75, null);
  assert.equal(children.length, 2);
  assert.deepEqual(children[1].args, ['vite', 'dev', '--watch']);
  assert.deepEqual(children[1].options.env, { TEST: 'kept', CASA_DEV_RESTART: '1' });
  children[1].child.emit('close', 0, null);
  assert.equal(children.length, 2);
  assert.equal(host.exitCode, 0);
});

test('normal errors and shutdown do not start a restart loop', () => {
  const failed = setup();
  failed.children[0].child.emit('close', 1, null);
  assert.equal(failed.children.length, 1);
  assert.equal(failed.host.exitCode, 1);
  const stopped = setup();
  stopped.host.emit('SIGINT');
  assert.equal(stopped.children.length, 1);
  assert.equal(stopped.host.exitCode, 0);
});

test('dev restart requests the supervisor; packaged and standalone apps relaunch normally', () => {
  const source = readFileSync(require.resolve('../src/main/restart.ts'), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS }
  });
  for (const [isPackaged, managed, expected] of [
    [false, '1', [75]], [true, '1', ['relaunch', 0]], [false, undefined, ['relaunch', 0]]
  ]) {
    const calls = [];
    const exports = {};
    const app = { isPackaged, relaunch: () => calls.push('relaunch'), exit: (code) => calls.push(code) };
    new Function('require', 'exports', 'process', outputText)(
      () => ({ app }), exports, { env: { CASA_DEV_RESTART: managed } }
    );
    exports.restartApp();
    assert.deepEqual(calls, expected);
  }
});
