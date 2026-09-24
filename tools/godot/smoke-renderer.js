window.results = [];
window.scenario = 'casadaindia';
window.sendSnapshot = (count = 16, room = window.scenario === 'tasca' ? 'tasca' : 'casa') => {
  document.getElementById('world').contentWindow.postMessage({ version: 2, type: 'snapshot', scenario: window.scenario, room, visible: true,
    agents: Array.from({ length: count }, (_, i) => ({ id: `smoke-${i}`, name: window.scenario === 'tasca' ? window.tascaNames[i] : i === 0 ? 'Feitor de teste' : `Oficial ${i}`, character: window.scenario === 'tasca' ? window.tascaCast[i % 8].id : `character-${i}`, status: i === 1 ? 'blocked' : 'working', seat: i < 21 ? (i < 5 ? i : i + 1) : null, selected: i === 0, isGod: i === 0,
      ...(window.scenario === 'tasca' ? { appearance: (() => { const c = window.tascaCast[i % 8]; return { skin: c.pele, hair: c.cabelo, cloth: c.corCorpo, beard: c.barba, hat: c.cabeca, cape: c.capa, capeColor: c.corCapa, outfit: c.outfit }; })() } : {}) }))
  }, 'casa-world://app');
};
let handshake;
window.switchScenario = scenario => {
  clearInterval(handshake);
  window.scenario = scenario;
  window.results = [];
  // A fresh browsing context matches the application's keyed iframe.
  const old = document.getElementById('world');
  const frame = old.cloneNode(false);
  frame.src = `casa-world://app/index.html?scenario=${scenario}`;
  old.replaceWith(frame);
  handshake = setInterval(() => frame.contentWindow.postMessage({ version:2, type:'hello' }, 'casa-world://app'), 500);
};
window.addEventListener('message', e => {
  if (e.origin !== 'casa-world://app' || e.source !== document.getElementById('world').contentWindow) return;
  window.results.push(e.data);
  if (e.data.type === 'ready') { clearInterval(handshake); window.sendSnapshot(); }
});
window.switchScenario('casadaindia');
