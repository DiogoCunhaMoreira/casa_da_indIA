window.results = [];
window.sendSnapshot = (count = 16, room = 'casa') => {
  document.getElementById('world').contentWindow.postMessage({ version: 1, type: 'snapshot', room, visible: true,
    agents: Array.from({ length: count }, (_, i) => ({ id: `smoke-${i}`, name: i === 0 ? 'Feitor de teste' : `Oficial ${i}`, character: `character-${i}`, status: i === 1 ? 'blocked' : 'working', seat: i < 22 ? i : null, selected: i === 0, isGod: i === 0 }))
  }, 'casa-world://app');
};
window.addEventListener('message', e => {
  if (e.origin !== 'casa-world://app' || e.source !== document.getElementById('world').contentWindow) return;
  window.results.push(e.data);
  if (e.data.type === 'ready') { clearInterval(handshake); window.sendSnapshot(); }
});
const handshake = setInterval(() => document.getElementById('world').contentWindow.postMessage({ version:1, type:'hello' }, 'casa-world://app'), 500);
