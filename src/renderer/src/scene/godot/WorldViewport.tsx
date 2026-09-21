import { useEffect, useRef, useState } from 'react';
import { useStore } from '@/store/store';
import { ELENCO } from '@/scene/office/casadaindia/elenco';
import { allocateWorldSeats, isWorldRequest, WORLD_ORIGIN, WORLD_ROOMS, type WorldRoom, type WorldPayload } from '@shared/worldBridge';

const read = (key: string) => { try { return localStorage.getItem(key); } catch { return null; } };
const save = (key: string, value: string) => { try { localStorage.setItem(key, value); } catch { /* session still works */ } };
export function WorldViewport() {
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);
  const [generation, setGeneration] = useState(0);
  const frame = useRef<HTMLIFrameElement>(null);
  const seats = useRef<Record<string, number>>({});
  const room = useRef<WorldRoom>('casa');
  const [view, setView] = useState<WorldRoom>('casa');
  const publish = useRef<() => void>(() => {});
  const control = (action: string) => frame.current?.contentWindow?.postMessage({ version: 1, type: 'control', action }, WORLD_ORIGIN);
  useEffect(() => {
    try { seats.current = JSON.parse(read('casa.world.seats') || '{}') || {}; } catch { seats.current = {}; }
    const saved = read('casa.world.room') as WorldRoom;
    if (WORLD_ROOMS.includes(saved)) { room.current = saved; setView(saved); }
  }, []);
  useEffect(() => {
    setError(''); setReady(false);
    let alive = true;
    let connected = false;
    let tasks: { id: string; status: string; assignee?: string }[] = [];
    let humanQuestions = 0;
    const post = (message: WorldPayload) => frame.current?.contentWindow?.postMessage({ version: 1, ...message }, WORLD_ORIGIN);
    const snapshot = () => {
      if (!connected) return;
      const state = useStore.getState();
      seats.current = allocateWorldSeats(state.agents, seats.current);
      save('casa.world.seats', JSON.stringify(seats.current));
      post({ type: 'snapshot', room: room.current, tasks, humanQuestions, visible: !document.hidden && !state.fullscreenAgentId,
        agents: state.agents.map(a => ({ id: a.id, name: a.name, character: a.character, status: a.status, station: a.currentStation,
          appearance: (() => { const c = ELENCO.find(c => c.id === a.character); return c ? { skin: c.pele, hair: c.cabelo, cloth: c.corCorpo, beard: c.barba, hat: c.cabeca, cape: c.capa, capeColor: c.corCapa } : undefined; })(),
          isGod: !!a.isGod, selected: a.id === state.selectedId, seat: seats.current[a.id] ?? null })) });
    };
    publish.current = snapshot;
    const handshake = setInterval(() => { if (!connected) post({ type: 'hello' }); }, 500);
    const timeout = setTimeout(() => { if (alive && !connected) setError('O cenário não respondeu. Tenta carregar novamente. Os agentes continuam disponíveis.'); }, 60000);
    const receive = (event: MessageEvent) => {
      if (event.source !== frame.current?.contentWindow || event.origin !== WORLD_ORIGIN || !isWorldRequest(event.data)) return;
      const message = event.data;
      if (message.type === 'ready') { connected = true; setReady(true); setError(''); clearTimeout(timeout); snapshot(); }
      else if (message.type === 'error') setError(message.message);
      else if (message.type === 'openPanel') {
        const state = useStore.getState();
        const feitor = state.agents.find(a => a.isGod);
        if (feitor) state.select(feitor.id);
        state.requestCommandCenterTab(message.panel);
      }
      else if (message.type === 'view') { room.current = message.room; setView(message.room); save('casa.world.room', message.room); }
      else {
        const state = useStore.getState();
        const agent = state.agents.find(a => a.id === message.id);
        if (!agent) return;
        state.select(agent.id);
        if (message.type === 'openTerminal' && agent.ptyId) state.setFullscreen(agent.id);
      }
    };
    let polling = false;
    const pollTasks = async () => {
      if (polling) return;
      polling = true;
      try {
        const raw = await window.cth.hiveTasks() as { tasks?: { id?: string; status?: string; assignee?: string; humanQA?: { q?: string; a?: string }[] }[] } | null;
        if (!alive) return;
        const rows = Array.isArray(raw?.tasks) ? raw.tasks : [];
        tasks = rows.filter(t => typeof t.id === 'string').slice(0, 1000).map(t => ({ id: t.id!, status: String(t.status || 'todo'), assignee: t.assignee }));
        humanQuestions = rows.filter(t => t.status === 'blocked' && t.humanQA?.some(qa => qa.q && !qa.a)).length;
        snapshot();
      } catch { /* preserve the last successful ledger snapshot */ }
      finally { polling = false; }
    };
    void pollTasks();
    const taskTimer = setInterval(() => { void pollTasks(); }, 5000);
    const offMessage = window.cth.onHiveMessage?.(e => {
      if (!connected || document.hidden) return;
      const ids = new Set(useStore.getState().agents.map(a => a.id));
      if (ids.has(e.from)) post({ type: 'message', id: e.id, from: e.from, targets: e.targets.filter(id => ids.has(id)), act: e.act });
    });
    window.addEventListener('message', receive);
    document.addEventListener('visibilitychange', snapshot);
    // Coalesce rapidly arriving agent events and keep the bridge free of PTY traffic.
    let pending: ReturnType<typeof setTimeout> | undefined;
    const unsubscribe = useStore.subscribe((s, previous) => {
      if (s.agents === previous.agents && s.selectedId === previous.selectedId && s.fullscreenAgentId === previous.fullscreenAgentId) return;
      if (!pending) pending = setTimeout(() => { pending = undefined; snapshot(); }, 100);
    });
    return () => { alive = false; offMessage?.(); clearInterval(taskTimer); clearInterval(handshake); clearTimeout(timeout); clearTimeout(pending); unsubscribe(); window.removeEventListener('message', receive); document.removeEventListener('visibilitychange', snapshot); };
  }, [generation]);
  return <div style={{ height: '100%', position: 'relative', display: 'flex', flexDirection: 'column' }}>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', padding: '6px 10px', background: 'var(--cth-paper-100)' }}>
      <strong>Casa da Índia</strong>
      <select aria-label="Sala" value={view} onChange={e => { room.current = e.target.value as WorldRoom; setView(room.current); save('casa.world.room', room.current); publish.current(); }}>
        {WORLD_ROOMS.map((r, i) => <option key={r} value={r}>{['Planta geral', 'Gabinete', 'Escrivães', 'Conselho', 'Cartografia', 'Tesouraria', 'Refeitório'][i]}</option>)}
      </select><button aria-label="Aproximar" onClick={() => control('zoom_in')}>+</button><button aria-label="Afastar" onClick={() => control('zoom_out')}>−</button><button onClick={() => control('walls')}>Paredes</button>
      {!ready && !error && <span role="status">A carregar o cenário…</span>}
    </div>
    <div style={{ position: 'relative', flex: 1, minHeight: 0 }}>
      <iframe key={generation} ref={frame} title="Casa da Índia — mundo 3D" src={`${WORLD_ORIGIN}/index.html`}
        sandbox="allow-scripts allow-same-origin" allow="fullscreen" style={{ width: '100%', height: '100%', border: 0 }} />
      {error && <div role="alert" style={{ position: 'absolute', inset: 20, background: 'var(--cth-paper-100)', padding: 24 }}>
        <p>{error}</p><p>Os agentes e terminais continuam disponíveis.</p>
        <button onClick={() => setGeneration(g => g + 1)}>Tentar novamente</button>
      </div>}
    </div>
  </div>;
}
