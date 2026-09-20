// Runs the real isolated protocol and Web export without starting providers or touching user data.
const { app, BrowserWindow } = require('electron');
const { join, resolve } = require('node:path');
const { writeFileSync } = require('node:fs');
const root = resolve(__dirname, '../..');
app.setPath('userData', '/tmp/casa-world-smoke-profile');
app.setAppPath(root);
const { registerWorldProtocol } = require('../../test/load-ts.cjs')('src/main/worldProtocol.ts');
const delay = ms => new Promise(r => setTimeout(r, ms));
app.whenReady().then(async () => {
  const win = new BrowserWindow({ width: 1440, height: 900, show: true, webPreferences: { sandbox: true, contextIsolation: true, nodeIntegration: false, backgroundThrottling: false } });
  registerWorldProtocol(win.webContents.session, process.env.CASA_WORLD_ASSETS);
  win.webContents.session.webRequest.onBeforeRequest({ urls: ['http://*/*', 'https://*/*'] }, (_details, done) => done({ cancel: true }));
  for (const path of ['../package.json', '%2e%2e%2fpackage.json', 'bridge.js/secret', 'unknown.js']) {
    const response = await win.webContents.session.fetch(`casa-world://app/${path}`);
    if (response.status !== 404) throw new Error(`Unexpected protocol access: ${path}`);
  }
  const errors = [];
  win.webContents.on('console-message', (_e, level, message) => { console.log(`[renderer ${level}] ${message}`); if (level >= 3) errors.push(message); });
  win.webContents.on('render-process-gone', (_e, info) => { console.error(info); app.exit(1); });
  await win.loadFile(join(__dirname, 'smoke.html'));
  let ready = false;
  for (let i=0; i<90; i++) {
    await delay(1000);
    ready = await win.webContents.executeJavaScript("window.results.some(x => x.type === 'ready')");
    if (ready) break;
  }
  if (!ready) throw new Error('Godot bridge never became ready');
  await delay(3000);
  writeFileSync('/tmp/casa-world-smoke.png', (await win.webContents.capturePage()).toPNG());
  const subframe = win.webContents.mainFrame.frames.find(f => f.url.startsWith('casa-world:'));
  const isolation = await subframe.executeJavaScript("({origin:location.origin, node:typeof require, preload:typeof window.cth, canvas:!!document.querySelector('canvas')})");
  console.log('ISOLATION', JSON.stringify(isolation));
  if (isolation.node !== 'undefined' || isolation.preload !== 'undefined') throw new Error('World is not isolated');
  for (const count of [1,24,16]) { await win.webContents.executeJavaScript(`window.sendSnapshot(${count}, 'escrivaes')`); await delay(5000); console.log('PERFORMANCE', JSON.stringify(await subframe.executeJavaScript('window.casaBridge.stats'))); }
  writeFileSync('/tmp/casa-world-room.png', (await win.webContents.capturePage()).toPNG());
  console.log('MESSAGES', JSON.stringify(await win.webContents.executeJavaScript('window.results')));
  console.log('ERRORS', JSON.stringify(errors));
  app.exit(errors.length ? 1 : 0);
}).catch(error => { console.error(error); app.exit(1); });
