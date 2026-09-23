/* Isolated visual frame: no Electron APIs and no remote resources. */
(() => {
  'use strict';
  window.addEventListener('unhandledrejection', e => console.error(e.reason?.stack || e.reason));
  const canvas = document.getElementById('canvas');
  let hostOrigin;
  let receiver;
  let latest;
  const send = payload => { if (hostOrigin) parent.postMessage({ version: 2, ...payload }, hostOrigin); };
  window.casaBridge = {
    metrics(json) { this.stats = JSON.parse(json); },
    listen(callback) { receiver = callback; if (latest) callback(JSON.stringify(latest)); send({ type: 'ready' }); },
    emit(json) { const message = JSON.parse(json); send(message); }
  };
  window.addEventListener('message', event => {
    if (event.source !== parent || !event.data || event.data.version !== 2) return;
    // The parent is the app renderer (file:// packaged, Vite localhost in dev).
    if (event.origin !== 'file://' && event.origin !== 'null' && !/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(event.origin)) return;
    hostOrigin = event.origin === 'null' ? '*' : event.origin;
    if (event.data.type === 'hello') { if (receiver) send({ type: 'ready' }); return; }
    if (event.data.type === 'message' && typeof event.data.from === 'string' && Array.isArray(event.data.targets)) { if (receiver) receiver(JSON.stringify(event.data)); return; }
    if (event.data.type === 'control' && ['zoom_in', 'zoom_out', 'walls'].includes(event.data.action)) { if (receiver) receiver(JSON.stringify(event.data)); return; }
    if (event.data.type !== 'snapshot' || !Array.isArray(event.data.agents)) return;
    latest = event.data;
    if (receiver) receiver(JSON.stringify(latest));
  });
  const report = error => send({ type: 'error', message: String(error).slice(0, 1000) });
  canvas.addEventListener('webglcontextlost', event => { event.preventDefault(); report('A ligação gráfica foi interrompida. Podes tentar carregar o cenário novamente.'); });
  const scenario = new URLSearchParams(location.search).get('scenario') === 'tasca' ? 'tasca' : 'casadaindia';
  document.getElementById('status').textContent = scenario === 'tasca' ? 'A preparar a Tasca…' : 'A preparar a Casa…';
  const engine = new Engine({ executable: 'index', canvas, args: ['--audio-driver', 'Dummy', '--', ...(scenario === 'tasca' ? ['--tasca'] : [])], persistentPaths: [], canvasResizePolicy: 2, focusCanvas: false, experimentalVK: false });
  engine.startGame().then(() => { document.getElementById('status').remove(); }).catch(error => {
    document.getElementById('status').textContent = 'Não foi possível carregar o cenário.';
    send({ type: 'error', message: String(error).slice(0, 1000) });
  });
})();
