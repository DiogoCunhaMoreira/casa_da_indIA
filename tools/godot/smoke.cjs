// Runs the real isolated protocol and Web export without starting providers or touching user data.
const { app, BrowserWindow } = require('electron');
const { join, resolve } = require('node:path');
const { writeFileSync, mkdtempSync } = require('node:fs');
const root = resolve(__dirname, '../..');
app.setPath('userData', mkdtempSync('/tmp/casa-world-smoke-'));
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
  const cast = require('../../test/load-ts.cjs')('src/renderer/src/scene/godot/tascaCast.ts').TASCA_CAST;
  await win.webContents.executeJavaScript(`window.tascaCast = ${JSON.stringify(cast)}`);
  const { visualName, useWorldScenario } = require('../../test/load-ts.cjs')('src/renderer/src/scene/godot/scenarios.ts');
  const names = Array.from({ length: 24 }, (_, i) => {
    useWorldScenario.getState().setCharacter(`smoke-${i}`, cast[i % 8].id);
    return visualName({ id: `smoke-${i}`, name: `Oficial ${i}`, character: 'caminha', isGod: i === 0 }, 'tasca');
  });
  await win.webContents.executeJavaScript(`window.tascaNames = ${JSON.stringify(names)}`);
  const waitReady = async () => {
    for (let i=0; i<90; i++) {
      await delay(1000);
      if (await win.webContents.executeJavaScript("window.results.some(x => x.type === 'ready')")) return;
    }
    throw new Error('Godot bridge never became ready');
  };
  for (const scenario of ['casadaindia', 'tasca', 'casadaindia']) {
    if (scenario !== 'casadaindia' || await win.webContents.executeJavaScript("window.scenario === 'tasca'")) {
      await win.webContents.executeJavaScript(`window.switchScenario('${scenario}')`);
    }
    await waitReady();
    await delay(1500);
    writeFileSync(`/tmp/${scenario}-world-overview.png`, (await win.webContents.capturePage()).toPNG());
    const subframe = win.webContents.mainFrame.frames.find(f => f.url.startsWith('casa-world:'));
    const isolation = await subframe.executeJavaScript("({origin:location.origin, node:typeof require, preload:typeof window.cth, canvas:!!document.querySelector('canvas')})");
    console.log('ISOLATION', scenario, JSON.stringify(isolation));
    if (isolation.node !== 'undefined' || isolation.preload !== 'undefined') throw new Error('World is not isolated');
    for (const count of [1,24,16]) {
      await win.webContents.executeJavaScript(`window.sendSnapshot(${count}, '${scenario === 'tasca' ? 'mesas' : 'escrivaes'}')`);
      await delay(3000);
      const stats = await subframe.executeJavaScript('window.casaBridge.stats');
      console.log('PERFORMANCE', JSON.stringify(stats));
      if (stats.agents !== count || stats.scenario !== scenario) throw new Error('Roster/scenario mismatch');
      if (count > 1 && !stats.bubbles) throw new Error('Activity clouds are missing');
    }
    writeFileSync(`/tmp/${scenario}-world-room.png`, (await win.webContents.capturePage()).toPNG());
    {
      await win.webContents.executeJavaScript('window.sendIdle()');
      await delay(4000);
      const idleStats = await subframe.executeJavaScript('window.casaBridge.stats');
      if (!idleStats.walking) throw new Error('Idle workers did not start wandering');
      console.log('IDLE BEHAVIOUR', JSON.stringify(idleStats));
      writeFileSync(`/tmp/${scenario}-world-idle.png`, (await win.webContents.capturePage()).toPNG());
    }
    for (const room of (scenario === 'tasca' ? ['balcao','reservado','cozinha','despensa','patio'] : ['gabinete','conselho','cartografia','tesouraria','refeitorio'])) {
      await win.webContents.executeJavaScript(`window.sendSnapshot(16, '${room}')`);
      await delay(1100);
      const stats = await subframe.executeJavaScript('window.casaBridge.stats');
      if (stats.room !== room || stats.agents !== 16) throw new Error('Navigation lost agents');
      if (scenario === 'tasca') writeFileSync(`/tmp/tasca-world-${room}.png`, (await win.webContents.capturePage()).toPNG());
    }
  }
  console.log('MESSAGES', JSON.stringify(await win.webContents.executeJavaScript('window.results')));
  console.log('ERRORS', JSON.stringify(errors));
  app.exit(errors.length ? 1 : 0);
}).catch(error => { console.error(error); app.exit(1); });
