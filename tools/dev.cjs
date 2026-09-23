const { spawn } = require('node:child_process');
const { dirname, join } = require('node:path');

// electron-vite exits with its Electron child's status. Restart the whole dev
// session on an explicit app restart, so the new renderer has a live Vite server.
function runDev(command, args, { spawnChild = spawn, host = process } = {}) {
  let child;
  let stopping = false;
  const start = () => {
    child = spawnChild(command, args, {
      stdio: 'inherit',
      env: { ...host.env, CASA_DEV_RESTART: '1' }
    });
    child.once('error', (error) => {
      console.error('[dev]', error.message);
      host.exitCode = 1;
    });
    child.once('close', (code, signal) => {
      if (!stopping && code === 75) start();
      else host.exitCode = stopping ? 0 : (code ?? (signal ? 1 : 0));
    });
  };
  for (const signal of ['SIGINT', 'SIGTERM']) {
    host.once(signal, () => {
      stopping = true;
      child?.kill(signal);
    });
  }
  start();
}

if (require.main === module) {
  const cli = join(dirname(require.resolve('electron-vite/package.json')), 'bin/electron-vite.js');
  runDev(process.execPath, [cli, 'dev', ...process.argv.slice(2)]);
}

module.exports = { runDev };
