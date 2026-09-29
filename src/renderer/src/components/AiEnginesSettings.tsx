import { LocalModelsSettings } from './LocalModelsSettings';
import type { LocalConnection } from '@shared/localModels';
import { useTranslation } from 'react-i18next';
import type { HarnessConfig } from '@/store/config';

/**
 * AiEnginesSettings — the engines surface. Claude Code and Codex sign in through
 * their own CLIs, so the only thing configured here is the list of local model
 * servers OpenCode can drive (LM Studio, Ollama, vLLM, …).
 */
export function AiEnginesSettings({ config, onLocalChange }: { config: HarnessConfig; onLocalChange: (connections: LocalConnection[]) => void }) {
  const { t } = useTranslation();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <LocalModelsSettings config={config} onChange={onLocalChange} />
      {/* Unsandboxed-in-auto caveat (Pam guardrail #6) */}
      <div style={{
        fontSize: 12, color: 'var(--cth-ink-700)', lineHeight: '17px',
        padding: 8, boxShadow: 'inset 0 0 0 1px var(--cth-ink-300)', background: 'var(--cth-paper-100)'
      }}>
        {t('aiEngines.autoModeCaveat')}
      </div>
    </div>
  );
}
