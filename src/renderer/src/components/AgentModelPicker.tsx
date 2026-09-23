import { useTranslation } from 'react-i18next';
import { useRef, type CSSProperties } from 'react';
import { LOCAL_SERVERS, localModelSlug } from '@shared/localModels';
import { agentModelOptions } from '@shared/agentModelOptions';
import {
  AGENT_PROVIDER_PRESETS, isClaudeProvider, modelsForProvider, providerPreset,
  type AgentProvider, type HarnessConfig
} from '@/store/config';

const field: CSSProperties = {
  width: '100%', minWidth: 0, padding: 8, boxSizing: 'border-box',
  color: 'var(--cth-ink-900)', background: 'var(--cth-paper-100)',
  border: '1px solid var(--cth-ink-100)', fontFamily: 'var(--cth-font-ui)', fontSize: 13
};
export function AgentModelPicker({ config, provider, model, onChange }: {
  config: HarnessConfig;
  provider: AgentProvider;
  model?: string;
  onChange: (provider: AgentProvider, model?: string) => void;
}) {
  const { t } = useTranslation();
  const localMenu = useRef<HTMLDetailsElement>(null);
  const connections = config.localConnections ?? [];
  const selected = provider === 'opencode' ? connections.find(c => localModelSlug(c) === model) : undefined;
  const preset = providerPreset(provider);
  const options = agentModelOptions(modelsForProvider(provider), model, t('agentModelPicker.default'));
  const currentLabel = selected
    ? `${selected.model} · ${LOCAL_SERVERS[selected.kind]?.label ?? selected.kind}`
    : `${options.find(option => option.id === (model ?? ''))?.label ?? model} · ${preset.label}`;
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
    <div style={{ padding: 10, background: 'var(--cth-paper-100)', overflowWrap: 'anywhere' }}>
      <div style={{ fontSize: 12, color: 'var(--cth-ink-500)' }}>{t('agentModelPicker.selected')}</div>
      <strong>{currentLabel}</strong>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontSize: 12, color: 'var(--cth-ink-700)' }}>{t('agentModelPicker.local')}</span>
      {connections.length ? <details ref={localMenu}>
        <summary style={{ ...field, listStyle: 'none', cursor: 'pointer', borderRadius: 6, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600 }}>
              {selected?.model ?? t('agentModelPicker.chooseLocal')}
            </span>
            <span style={{ display: 'block', fontSize: 12, color: 'var(--cth-ink-500)', marginTop: 3 }}>
              {selected ? LOCAL_SERVERS[selected.kind]?.label ?? selected.kind : t('agentModelPicker.savedConnections', { count: connections.length })}
            </span>
          </span>
          <span aria-hidden="true" style={{ color: 'var(--cth-ink-500)' }}>▾</span>
        </summary>
        <div role="group" aria-label={t('agentModelPicker.local')} style={{ marginTop: 5, padding: 4, border: '1px solid var(--cth-ink-100)', borderRadius: 6, background: 'var(--cth-paper-100)', maxHeight: 220, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 3 }}>
          {connections.map(c => <button type="button" key={c.id} aria-pressed={selected?.id === c.id}
            onClick={() => {
              onChange('opencode', localModelSlug(c));
              if (localMenu.current) { localMenu.current.open = false; localMenu.current.querySelector('summary')?.focus(); }
            }}
            style={{ ...field, border: 0, borderRadius: 4, textAlign: 'start', cursor: 'pointer', display: 'flex', gap: 8, alignItems: 'center', background: selected?.id === c.id ? 'var(--cth-action-soft)' : 'transparent', color: selected?.id === c.id ? 'var(--cth-action-text)' : 'var(--cth-ink-900)' }}>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: 'block', overflowWrap: 'anywhere', fontWeight: 600 }}>{c.model}</span>
              <span style={{ display: 'block', fontSize: 12, opacity: 0.75, marginTop: 3, overflowWrap: 'anywhere' }}>{LOCAL_SERVERS[c.kind]?.label ?? c.kind} · {c.baseUrl}</span>
            </span>
            {selected?.id === c.id && <span aria-hidden="true">✓</span>}
          </button>)}
        </div>
      </details> : <div style={{ ...field, borderRadius: 6, color: 'var(--cth-ink-500)' }}>{t('agentModelPicker.noLocal')}</div>}
    </div>
    {selected ? <small style={{ overflowWrap: 'anywhere' }}>{selected.baseUrl} · {t('agentModelPicker.localEngine')}</small>
      : !connections.length && <small>{t('agentModelPicker.localHint')}</small>}
    <details>
      <summary style={{ cursor: 'pointer' }}>{t('agentModelPicker.other')}</summary>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
        <label>{t('agentModelPicker.engine')}
          <select style={field} value={provider} onChange={e => {
            const id = e.target.value as AgentProvider;
            onChange(id, isClaudeProvider(id) ? config.defaultModel : config.providerDefaultModels?.[id]);
          }}>
            {AGENT_PROVIDER_PRESETS.filter(p => p.id !== 'custom' || provider === 'custom').map(p =>
              <option key={p.id} value={p.id}>{p.id === 'custom' ? t('agentModelPicker.customCommand') : p.label}</option>)}
          </select>
        </label>
        {preset.supportsModel && <label>{t('localModels.model')}
          <select style={field} value={model ?? ''} onChange={e => onChange(provider, e.target.value || undefined)}>
            {options.map(option => <option key={option.id} value={option.id}>{selected && option.id === model ? currentLabel : option.label}</option>)}
          </select>
        </label>}
        {preset.supportsModel && <details>
          <summary>{t('agentModelPicker.manual')}</summary>
          <label>{t('agentModelPicker.modelId')}
            <input style={field} value={model ?? ''} onChange={e => onChange(provider, e.target.value.trim() || undefined)} />
          </label>
        </details>}
      </div>
    </details>
  </div>;
}
