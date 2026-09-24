import { sessionMatchesModel } from '@shared/agentSessionModel';
import { useAgentModelSession } from '@/hooks/useAgentModelSession';
import { switchAgentModel } from '@/lib/switchAgentModel';
import { acquireTerminal, resetTerminal } from './terminalPool';
import { useTranslation } from 'react-i18next';
import { AgentModelPicker } from './AgentModelPicker';
import { uiText, useUiLanguage } from '@/i18n/uiText';
import { useEffect, useState, type CSSProperties } from 'react';
import { PixelPanel } from './PixelPanel';
import { PixelButton } from './PixelButton';
import { SpritePortrait } from './SpritePortrait';
import { useStore, type Agent } from '@/store/store';
import type { CharacterName } from '@/scene/office/cast';
import { TASCA_ROSTER, useWorldScenario, visualCharacter, visualName } from '@/scene/godot/scenarios';
import { ELENCO as CASA_ROSTER } from '@/scene/office/themeRegistry';
import { type AccentColorName } from '@/design/tokens';
import {
  type AgentProvider,
  type HarnessConfig,
  inferAgentProvider
} from '@/store/config';

const ACCENTS: AccentColorName[] = ['coral', 'mint', 'sky', 'lemon', 'lilac', 'peach'];

export interface EditAgentModalProps {
  agent: Agent;
  onClose: () => void;
}

/**
 * Compact post-hire editor for Identity / Engine / Briefing. Mirrors the Add
 * Agent fields that matter after spawn; save only patches the durable roster
 * via updateAgent; model changes replace the live terminal session on save.
 */
export function EditAgentModal({ agent, onClose }: EditAgentModalProps) {
  useUiLanguage();
  const scenario = useWorldScenario(s => s.scenario);
  const ELENCO = scenario === 'tasca' ? TASCA_ROSTER : CASA_ROSTER;
  const { t } = useTranslation();
  const live = useAgentModelSession(agent.ptyId);
  const [modelPicked, setModelPicked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [configError, setConfigError] = useState(false);
  const updateAgent = useStore((s) => s.updateAgent);
  const [config, setConfig] = useState<HarnessConfig | null>(null);

  const [name, setName] = useState(visualName(agent));
  const [character, setCharacter] = useState<CharacterName>(visualCharacter(agent));
  const [accent, setAccent] = useState<AccentColorName>(agent.accent);
  const [provider, setProvider] = useState<AgentProvider>(
    inferAgentProvider(agent.command, agent.provider)
  );
  const [model, setModel] = useState<string | undefined>(agent.model);
  const [description, setDescription] = useState(agent.description);
  const [goal, setGoal] = useState(agent.goal ?? '');

  useEffect(() => {
    void window.cth.getConfig().then(setConfig).catch(() => setConfigError(true));
  }, []);

  // Keep form in sync when the selected agent changes while the modal is open.
  useEffect(() => {
    setModelPicked(false);
    setName(visualName(agent));
    setCharacter(visualCharacter(agent));
    setAccent(agent.accent);
    setProvider(inferAgentProvider(agent.command, agent.provider));
    setModel(agent.model);
    setDescription(agent.description);
    setGoal(agent.goal ?? '');
  }, [agent.id, scenario]);

  const liveMismatch = live.ready && !live.error && !sessionMatchesModel(live.session, provider, model);
  const engineChanged = liveMismatch || modelPicked || provider !== inferAgentProvider(agent.command, agent.provider) || model !== agent.model;
  const save = async () => {
    if (!config || saving || !live.ready || live.error) return;
    setSaving(true); setSaveError('');
    const patch = {
      name: scenario === 'tasca' ? agent.name : name.trim() || agent.name, character: scenario === 'tasca' ? agent.character : character, accent,
      description: description.trim() || uiText("a_fresh_harness_24e449"),
      goal: goal.trim() || undefined
    };
    try {
      if (engineChanged) {
        await switchAgentModel({ ...agent, ...patch }, config, provider, model, {
          api: window.cth,
          prepareTerminal: id => {
            const entry = acquireTerminal(id);
            const dimensions = { cols: entry.term.cols || 100, rows: entry.term.rows || 30 };
            resetTerminal(id);
            return dimensions;
          },
          update: next => updateAgent(agent.id, next),
          missingEngine: label => t('agentModelPicker.missingEngine', { label }),
          failed: t('agentModelPicker.switchFailed')
        });
      }
      updateAgent(agent.id, patch);
      if (scenario === 'tasca') {
        useWorldScenario.getState().setCharacter(agent.id, character);
        useWorldScenario.getState().setName(agent.id, name);
      }
      onClose();
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : t('agentModelPicker.switchFailed'));
    } finally { setSaving(false); }
  };

  return (
    <div
      onClick={() => { if (!saving) onClose(); }}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(26, 19, 32, 0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 500
      }}
    >
      {/* Same box as Add Agent (940 / 95vw / 86vh). They are the two halves of
          one job — describe an agent — and a tall narrow dialog next to a wide
          one reads as two unrelated screens. */}
      <div onClick={(e) => e.stopPropagation()} style={{ width: 940, maxWidth: '95vw' }}>
        <PixelPanel variant="dialog" title={uiText("EDIT_AGENT_251dbe")} style={{ padding: 16 }} noPadding>
          <div style={{
            display: 'flex', flexDirection: 'column', gap: 14,
            padding: 16, maxHeight: '86vh', overflowY: 'auto'
          }}>
            {/* Two columns so the extra width is used rather than padded.
                Identity and Engine are short field lists; Briefing is free
                text and takes the taller side. minHeight keeps the dialog from
                collapsing into a wide thin strip on a small form. */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
              gap: 16, alignItems: 'start', minHeight: 260
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
            <Section label={uiText("Identity_7e5a97")} hint="name · character · color">
              <Row label={uiText("Name_709a23")}>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={uiText("Stanley_a305f5")}
                  style={inputStyle}
                  autoFocus
                />
              </Row>

              <Row label={uiText("Character_ee9946")}>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {ELENCO.map((c) => {
                    const active = character === c.name;
                    return (
                      <button
                        key={c.name}
                        type="button"
                        onClick={() => { setCharacter(c.name); setName(c.displayName); }}
                        title={c.blurb}
                        style={{
                          padding: 4,
                          background: active ? `var(--cth-${accent}-light)` : 'var(--cth-cream-100)',
                          boxShadow: active
                            ? 'inset 0 0 0 1.5px var(--cth-ink-500)'
                            : 'inset 0 0 0 1px var(--cth-ink-100)',
                          cursor: 'pointer', border: 'none', width: 52,
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2
                        }}
                      >
                        <div style={{
                          width: 40, height: 48,
                          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                          overflow: 'hidden'
                        }}>
                          <SpritePortrait character={c.name} scale={1.5} />
                        </div>
                        <span style={{ fontSize: 12, color: 'var(--cth-ink-700)' }}>{c.displayName}</span>
                      </button>
                    );
                  })}
                </div>
              </Row>

              <Row label={uiText("Color_1d0c83")}>
                <div style={{ display: 'flex', gap: 6 }}>
                  {ACCENTS.map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => setAccent(a)}
                      title={a}
                      style={{
                        width: 28, height: 28,
                        background: `var(--cth-${a})`,
                        boxShadow: accent === a
                          ? 'inset 0 0 0 1.5px var(--cth-ink-500), 0 0 0 2px var(--cth-ink-900)'
                          : 'inset 0 0 0 1px var(--cth-ink-300)',
                        cursor: 'pointer', border: 'none'
                      }}
                    />
                  ))}
                </div>
              </Row>
            </Section>

            <Section label={t('localModels.model')} hint="">
              <fieldset disabled={saving} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
              {config ? <AgentModelPicker config={config} provider={provider} model={model} onChange={(nextProvider, nextModel) => {
                setModelPicked(true); setSaveError('');
                setProvider(nextProvider); setModel(nextModel);
              }} /> : <span role="status">{t(configError ? 'agentModelPicker.loadError' : 'agentModelPicker.loading')}</span>}
              </fieldset>
              {liveMismatch && <div role="status">{t('agentModelPicker.notApplied')}</div>}
              {live.error && <div role="alert">{t('agentModelPicker.sessionError')}</div>}
              <span style={{ fontSize: 12, color: 'var(--cth-ink-500)', lineHeight: '18px' }}>
                {t('agentModelPicker.switchHint')}
              </span>
            </Section>

              </div>
              <div style={{ minWidth: 0 }}>
            <Section label={uiText("Briefing_084694")} hint="description · goal">
              <Row label={uiText("Description_55f8eb")}>
                <input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={uiText("what_is_this_agent_for_847b91")}
                  style={inputStyle}
                />
              </Row>

              <Row label={uiText("Goal_optional_865b56")}>
                <textarea
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder={uiText("long_running_directive_injected_on_every_prom_9dfef9")}
                  rows={4}
                  style={{ ...inputStyle, fontFamily: 'var(--cth-font-ui)', resize: 'vertical', minHeight: 200 }}
                />
              </Row>
            </Section>
              </div>
            </div>

            {saveError && <div role="alert" style={{ color: 'var(--cth-ink-900)', padding: 10, border: '1px solid var(--cth-coral)' }}>{saveError}</div>}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
              <PixelButton variant="ghost" size="md" disabled={saving} onClick={onClose}>{uiText("cancel_4fd065")}</PixelButton>
              <div style={{ flex: 1 }} />
              <PixelButton variant="primary" size="md" disabled={!config || saving || !live.ready || live.error} onClick={save}>{saving ? t('agentModelPicker.switching') : engineChanged ? t(liveMismatch ? 'agentModelPicker.applyTerminal' : 'agentModelPicker.saveSwitch') : uiText("save_changes_c0d61b")}</PixelButton>
            </div>
          </div>
        </PixelPanel>
      </div>
    </div>
  );
}

const inputStyle: CSSProperties = {
  width: '100%',
  padding: '6px 8px 4px',
  background: 'var(--cth-paper-100)',
  border: 'none',
  boxShadow: 'inset 0 0 0 1px var(--cth-ink-100)',
  fontFamily: 'var(--cth-font-ui)',
  fontSize: 16,
  color: 'var(--cth-ink-900)',
  outline: 'none',
  boxSizing: 'border-box'
};

function Section({
  label,
  hint,
  children
}: {
  label: string;
  hint: string;
  children: React.ReactNode;
}) {
  useUiLanguage();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{
          fontFamily: 'var(--cth-font-display)',
          fontSize: 12, lineHeight: '18px',
          color: 'var(--cth-ink-900)',
          textTransform: 'none'
        }}>{label}</span>
        <span style={{ fontSize: 12, color: 'var(--cth-ink-500)' }}>{hint}</span>
      </div>
      {children}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  useUiLanguage();
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{
        fontFamily: 'var(--cth-font-display)',
        fontSize: 12, lineHeight: '18px',
        color: 'var(--cth-ink-700)',
        textTransform: 'none'
      }}>{label}</span>
      {children}
    </label>
  );
}
