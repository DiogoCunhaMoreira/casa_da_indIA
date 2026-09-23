import { uiText, useUiLanguage } from '@/i18n/uiText';
import { useEffect, useRef, useState } from 'react';
import { useStore } from '@/store/store';
import { SCENARIO_LABELS, TASCA_ROOM_LABELS, useWorldScenario, visualCharacter, visualPerson } from './scenarios';
import { allocateWorldSeats, isWorldRequest, WORLD_ORIGIN, WORLD_VERSION, WORLD_SCENARIOS, scenarioRooms, isScenarioRoom, type WorldRoom, type WorldPayload } from '@shared/worldBridge';

const read = (key: string) => { try { return localStorage.getItem(key); } catch { return null; } };
const save = (key: string, value: string) => { try { localStorage.setItem(key, value); } catch { /* session still works */ } };
export function WorldViewport() {
  useUiLanguage();
  const scenario = useWorldScenario(s => s.scenario);
  const setScenario = useWorldScenario(s => s.setScenario);
  const rooms = scenarioRooms(scenario);
  const storagePrefix = scenario === 'casadaindia' ? 'casa.world' : 'tasca.world';
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);
  const [summary, setSummary] = useState<{ todo: number; doing: number; done: number; blocked: number; questions: number } | null>(null);
  const openPanel = (panel: 'tasks' | 'human') => {
    const state = useStore.getState();
    const feitor = state.agents.find(a => a.isGod);
    if (feitor) state.select(feitor.id);
    state.requestCommandCenterTab(panel);
  };
  const [generation, setGeneration] = useState(0);
  const frame = useRef<HTMLIFrameElement>(null);
  const seats = useRef<Record<string, number>>({});
  const room = useRef<WorldRoom>('casa');
  const [view, setView] = useState<WorldRoom>('casa');
  const publish = useRef<() => void>(() => {});
  const control = (action: string) => frame.current?.contentWindow?.postMessage({ version: WORLD_VERSION, type: 'control', action }, WORLD_ORIGIN);
  useEffect(() => {
    try { seats.current = JSON.parse(read(`${storagePrefix}.seats`) || '{}') || {}; } catch { seats.current = {}; }
    const saved = read(`${storagePrefix}.room`) as WorldRoom;
    room.current = isScenarioRoom(scenario, saved) ? saved : rooms[0]; setView(room.current);
  }, [scenario]);
  useEffect(() => {
    setError(''); setReady(false);
    let alive = true;
    let connected = false;
    let tasks: { id: string; status: string; assignee?: string }[] = [];
    let humanQuestions = 0;
    const post = (message: WorldPayload) => frame.current?.contentWindow?.postMessage({ version: WORLD_VERSION, ...message }, WORLD_ORIGIN);
    const snapshot = () => {
      if (!alive || !connected) return;
      const state = useStore.getState();
      seats.current = allocateWorldSeats(state.agents, seats.current);
      save(`${storagePrefix}.seats`, JSON.stringify(seats.current));
      post({ type: 'snapshot', scenario, room: room.current, tasks, humanQuestions, visible: !document.hidden && !state.fullscreenAgentId,
        agents: state.agents.map(a => ({ id: a.id, name: a.name, character: visualCharacter(a, scenario), status: a.status, station: a.currentStation,
          appearance: (() => { const c = visualPerson(visualCharacter(a, scenario)); return c ? { skin: c.pele, hair: c.cabelo, cloth: c.corCorpo, beard: c.barba, hat: c.cabeca, cape: c.capa, capeColor: c.corCapa, outfit: 'outfit' in c ? c.outfit : undefined } : undefined; })(),
          isGod: !!a.isGod, selected: a.id === state.selectedId, seat: seats.current[a.id] ?? null })) });
    };
    publish.current = snapshot;
    const handshake = setInterval(() => { if (!connected) post({ type: 'hello' }); }, 500);
    const timeout = setTimeout(() => { if (alive && !connected) setError(uiText('worldTimeout')); }, 60000);
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
      else if (message.type === 'view') { if (message.scenario !== scenario) return; room.current = message.room; setView(message.room); save(`${storagePrefix}.room`, message.room); }
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
        setSummary({ todo: rows.filter(t => t.status === 'todo').length, doing: rows.filter(t => t.status === 'doing').length,
          done: rows.filter(t => t.status === 'done').length, blocked: rows.filter(t => t.status === 'blocked').length, questions: humanQuestions });
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
    const unsubscribeVisual = useWorldScenario.subscribe(snapshot);
    const unsubscribe = useStore.subscribe((s, previous) => {
      if (s.agents === previous.agents && s.selectedId === previous.selectedId && s.fullscreenAgentId === previous.fullscreenAgentId) return;
      if (!pending) pending = setTimeout(() => { pending = undefined; snapshot(); }, 100);
    });
    return () => { alive = false; unsubscribeVisual(); offMessage?.(); clearInterval(taskTimer); clearInterval(handshake); clearTimeout(timeout); clearTimeout(pending); unsubscribe(); window.removeEventListener('message', receive); document.removeEventListener('visibilitychange', snapshot); };
  }, [generation, scenario]);
  return <div style={{ height: '100%', position: 'relative', display: 'flex', flexDirection: 'column' }}>
    <div className="cth-world-toolbar" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', padding: '6px 10px', background: 'var(--cth-paper-100)' }}>
      <select aria-label={uiText("worldScenario")} value={scenario} onChange={e => setScenario(e.target.value as typeof scenario)}>
        {WORLD_SCENARIOS.map(id => <option key={id} value={id}>{SCENARIO_LABELS[id]}</option>)}
      </select>
      <select aria-label={uiText("Sala_985f15")} value={view} onChange={e => { room.current = e.target.value as WorldRoom; setView(room.current); save(`${storagePrefix}.room`, room.current); publish.current(); }}>
        {rooms.map((r, i) => <option key={r} value={r}>{scenario === 'tasca' ? uiText(TASCA_ROOM_LABELS[i]) : uiText(['roomOverview', 'roomOffice', 'roomScribes', 'roomCouncil', 'roomMaps', 'roomTreasury', 'roomDining'][i])}</option>)}
      </select><button aria-label={uiText("Aproximar_e85804")} onClick={() => control('zoom_in')}>+</button><button aria-label={uiText("Afastar_36cff4")} onClick={() => control('zoom_out')}>−</button><button onClick={() => control('walls')}>{uiText("Paredes_6b367e")}</button>
      {!ready && !error && <span role="status">{uiText("A_carregar_o_cenario_362adc")}</span>}
    </div>
    <div className="cth-world-toolbar" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, padding: '6px 10px', background: 'var(--cth-paper-100)', fontSize: 12 }}>
      <button onClick={() => openPanel('tasks')}>{summary ? uiText('dynamic20', { v0: summary.todo, v1: summary.doing, v2: summary.done, v3: summary.blocked }) : uiText('worldTasks')}</button>
      <button onClick={() => openPanel('human')}>{uiText("Perguntas_820953")}{summary ? ` · ${summary.questions}` : ''}</button>
      <span style={{ marginLeft: 'auto' }}>{uiText("Arrasta_para_mover_roda_ou_pinca_para_aproxim_cccb54")}</span>
    </div>
    <div style={{ position: 'relative', flex: 1, minHeight: 0 }}>
      <iframe key={`${scenario}-${generation}`} ref={frame} title={`${SCENARIO_LABELS[scenario]} — cenário 3D`} src={`${WORLD_ORIGIN}/index.html?scenario=${scenario}`}
        sandbox="allow-scripts allow-same-origin" allow="fullscreen" style={{ width: '100%', height: '100%', border: 0 }} />
      {error && <div role="alert" style={{ position: 'absolute', inset: 20, background: 'var(--cth-paper-100)', padding: 24 }}>
        <p>{error}</p><p>{uiText("Os_agentes_e_terminais_continuam_disponiveis_2af835")}</p>
        <button onClick={() => setScenario(scenario === 'tasca' ? 'casadaindia' : 'tasca')}>{uiText("worldSwitchScenario")}</button>
        <button onClick={() => setGeneration(g => g + 1)}>{uiText("Tentar_novamente_04fc24")}</button>
      </div>}
    </div>
  </div>;
}
