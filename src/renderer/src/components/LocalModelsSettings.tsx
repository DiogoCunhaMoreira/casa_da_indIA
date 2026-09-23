import { useRef, useState, type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { LOCAL_SERVERS, localModelSlug, type LocalConnection, type LocalServerKind } from '@shared/localModels';
import type { HarnessConfig } from '@/store/config';
import { PixelButton } from './PixelButton';

const field: CSSProperties = { width: '100%', padding: 8, background: 'var(--cth-paper-100)', color: 'var(--cth-ink-900)', border: '1px solid var(--cth-ink-100)', fontFamily: 'var(--cth-font-ui)' };
export function LocalModelsSettings({ config, onChange, onUse, selectedSlug }: {
  config: HarnessConfig;
  selectedSlug?: string;
  onChange?: (connections: LocalConnection[]) => void;
  onUse?: (connection: LocalConnection, config: HarnessConfig) => void;
}) {
  const { t } = useTranslation();
  const [connections, setConnections] = useState(config.localConnections ?? []);
  const [editing, setEditing] = useState(false);
  const [kind, setKind] = useState<LocalServerKind>('lmstudio');
  const [baseUrl, setBaseUrl] = useState(LOCAL_SERVERS.lmstudio.url);
  const [key, setKey] = useState('');
  const [models, setModels] = useState<string[]>([]);
  const [model, setModel] = useState('');
  const [search, setSearch] = useState('');
  const [connected, setConnected] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const generation = useRef(0);
  const invalidate = () => { generation.current++; setConnected(false); setModels([]); setModel(''); setNote(''); setBusy(false); };
  const discover = async () => {
    if (typeof window.cth.discoverLocalModels !== 'function') {
      setNote(t('localModels.errors.restart'));
      return;
    }
    const version = ++generation.current;
    setBusy(true); setNote(''); setConnected(false); setModels([]); setModel('');
    try {
      const result = await window.cth.discoverLocalModels({ baseUrl, key });
      if (version !== generation.current) return;
      if (!result.ok) { setNote(t(`localModels.errors.${result.error ?? 'connection'}`)); return; }
      setBaseUrl(result.baseUrl!); setModels(result.models!); setConnected(true);
      if (result.models!.length === 1) setModel(result.models![0]);
    } catch (error) {
      if (version === generation.current) {
        const missingHandler = error instanceof Error && /No handler registered|localModels:discover/.test(error.message);
        setNote(t(missingHandler ? 'localModels.errors.restart' : 'localModels.errors.connection'));
      }
    }
    finally { if (version === generation.current) setBusy(false); }
  };
  const persist = async (next: LocalConnection[]) => {
    if (onChange) { onChange(next); return { ...config, localConnections: next }; }
    return window.cth.updateConfig({ localConnections: next });
  };
  const save = async () => {
    setBusy(true); setNote('');
    try {
      const latest = onChange ? config : await window.cth.getConfig();
      const previous = onChange ? connections : latest.localConnections ?? [];
      const existing = previous.find(c => c.baseUrl === baseUrl && c.model === model);
      const connection: LocalConnection = existing ?? { id: `local-${crypto.randomUUID()}`, kind, baseUrl, model };
      if (key) {
        const result = await window.cth.setLocalModelKey(connection.id, key);
        if (!result.ok) throw new Error('save');
      }
      const next = existing ? previous : [...previous, connection];
      const updated = await persist(next);
      setConnections(next); setEditing(false); setKey('');
      setNote(t(onChange ? 'localModels.staged' : 'localModels.saved'));
      onUse?.(connection, updated);
    } catch { setNote(t('localModels.errors.save')); }
    finally { setBusy(false); }
  };
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
    <strong>{t('localModels.title')}</strong>
    {connections.map(connection => <div key={connection.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ overflowWrap: 'anywhere', flex: 1 }} title={connection.baseUrl}>{connection.model} · {LOCAL_SERVERS[connection.kind]?.label ?? connection.kind}</span>
      {onUse && <PixelButton size="sm" variant="secondary" disabled={busy || selectedSlug === localModelSlug(connection)} onClick={() => onUse(connection, { ...config, localConnections: connections })}>{t(selectedSlug === localModelSlug(connection) ? 'localModels.selected' : 'localModels.use')}</PixelButton>}
      {onChange && <PixelButton size="sm" variant="secondary" onClick={() => { const next = connections.filter(c => c.id !== connection.id); setConnections(next); onChange(next); }}>{t('common.delete')}</PixelButton>}
    </div>)}
    {!editing ? <PixelButton size="sm" variant="secondary" onClick={() => { setEditing(true); setNote(''); }}>{t('localModels.add')}</PixelButton> : <>
      <label>{t('localModels.server')}<select style={field} value={kind} disabled={busy} onChange={e => { const value = e.target.value as LocalServerKind; invalidate(); setKind(value); setBaseUrl(LOCAL_SERVERS[value].url); setKey(''); }}>
        {Object.entries(LOCAL_SERVERS).map(([id, server]) => <option key={id} value={id}>{id === 'other' ? t('localModels.other') : server.label}</option>)}
      </select></label>
      <label>{t('localModels.address')}<input style={field} value={baseUrl} disabled={busy} onChange={e => { invalidate(); setBaseUrl(e.target.value); }} /></label>
      <details><summary>{t('localModels.advanced')}</summary>
        <label>{t('localModels.key')}<input type="password" autoComplete="off" style={field} value={key} disabled={busy} onChange={e => { invalidate(); setKey(e.target.value); }} /></label>
      </details>
      <PixelButton size="sm" variant="secondary" disabled={busy || !baseUrl.trim()} onClick={discover}>{t(busy ? 'localModels.working' : connected ? 'localModels.refresh' : 'localModels.connect')}</PixelButton>
      {connected && <>
        <div role="status">{t(models.length ? 'localModels.connected' : 'localModels.empty')}</div>
        {models.length > 0 && <>
          <input aria-label={t('localModels.search')} placeholder={t('localModels.search')} style={field} value={search} onChange={e => setSearch(e.target.value)} />
          <label>{t('localModels.model')}<select style={field} value={model} onChange={e => setModel(e.target.value)}>
            <option value="">{t('localModels.choose')}</option>
            {models.filter(id => id === model || id.toLowerCase().includes(search.toLowerCase())).map(id => <option key={id} value={id}>{id}</option>)}
          </select></label>
          <small>{t('localModels.engine')}</small>
          <PixelButton size="sm" disabled={busy || !model} onClick={save}>{t(onUse ? 'localModels.use' : 'localModels.add')}</PixelButton>
        </>}
      </>}
      <PixelButton size="sm" variant="secondary" disabled={busy} onClick={() => { invalidate(); setEditing(false); setKey(''); }}>{t('common.cancel')}</PixelButton>
    </>}
    {note && <div role="status">{note}</div>}
  </div>;
}
