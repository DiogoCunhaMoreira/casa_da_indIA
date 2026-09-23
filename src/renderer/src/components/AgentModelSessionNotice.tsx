import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { sessionMatchesModel } from '@shared/agentSessionModel';
import { inferAgentProvider, providerPreset } from '@/store/config';
import { useAgentModelSession } from '@/hooks/useAgentModelSession';
import { switchAgentModel } from '@/lib/switchAgentModel';
import { useStore, type Agent } from '@/store/store';
import { acquireTerminal, resetTerminal } from './terminalPool';
import { PixelButton } from './PixelButton';

/** Never present the saved model as the running model when an older session survives. */
export function AgentModelSessionNotice({ agent }: { agent: Agent }) {
  const { t } = useTranslation();
  const live = useAgentModelSession(agent.ptyId);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const provider = inferAgentProvider(agent.command, agent.provider);
  if (!live.ready || live.error || (!busy && !error && sessionMatchesModel(live.session, provider, agent.model))) return null;
  const apply = async () => {
    if (busy) return;
    setBusy(true); setError('');
    try {
      const config = await window.cth.getConfig();
      await switchAgentModel(agent, config, provider, agent.model, {
        api: window.cth,
        prepareTerminal: id => {
          const entry = acquireTerminal(id);
          const dimensions = { cols: entry.term.cols || 100, rows: entry.term.rows || 30 };
          resetTerminal(id);
          return dimensions;
        },
        update: patch => useStore.getState().updateAgent(agent.id, patch),
        missingEngine: label => t('agentModelPicker.missingEngine', { label }),
        failed: t('agentModelPicker.switchFailed')
      });
    } catch (e) { setError(e instanceof Error ? e.message : t('agentModelPicker.switchFailed')); }
    finally { setBusy(false); }
  };
  // Strip only the generated connection prefix, preserving the real model identifier.
  const model = agent.model?.replace(/^local-[^/]+\//, '') ?? providerPreset(provider).label;
  return <div role="status" style={{ padding: 12, flexShrink: 0, background: 'var(--cth-paper-100)', borderBottom: '1px solid var(--cth-ink-100)', fontSize: 13 }}>
    <div>{t('agentModelPicker.liveMismatch', { model, engine: live.session ? providerPreset(inferAgentProvider(live.session.command)).label : t('agentModelPicker.noSession') })}</div>
    <div style={{ fontSize: 12, color: 'var(--cth-ink-500)', margin: '5px 0 8px' }}>{t('agentModelPicker.switchHint')}</div>
    <PixelButton size="sm" disabled={busy} onClick={apply}>{t(busy ? 'agentModelPicker.switching' : 'agentModelPicker.applyTerminal')}</PixelButton>
    {error && <div role="alert" style={{ marginTop: 8 }}>{error}</div>}
  </div>;
}
