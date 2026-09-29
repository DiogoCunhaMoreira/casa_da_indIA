import { uiText, useUiLanguage } from '@/i18n/uiText';
import { useState, useEffect, type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { AGENT_MODELS, type HarnessConfig } from '@/store/config';
import { useStore } from '@/store/store';
import { PixelPanel } from './PixelPanel';
import { PixelButton } from './PixelButton';
import { UpdatesSection } from './UpdatesSection';
import { SettingsHeroCard } from './SettingsHeroCard';
import { SetupPanel } from './SetupPanel';
import { Icon } from './Icon';
import { McpDefaultsSettings } from './McpDefaultsSettings';
import { IntegrationsRegistry } from './IntegrationsRegistry';
import { AiEnginesSettings } from './AiEnginesSettings';
import { LANGUAGES, setLanguage } from '@/i18n';

export interface SettingsModalProps {
  config: HarnessConfig;
  onClose: () => void;
  /** Open straight to a section instead of General. Used by deep links from
   *  elsewhere in the UI, so they land on the tab that holds the field. */
  initialSection?: Section;
}

/** Pixel-aesthetic text input, mirroring AddAgentModal's inputStyle. */
const textInputStyle: CSSProperties = {
  width: '100%',
  padding: '6px 8px 4px',
  background: 'var(--cth-paper-100)',
  border: 'none',
  boxShadow: 'inset 0 0 0 1px var(--cth-ink-100)',
  fontFamily: 'var(--cth-font-ui)',
  fontSize: 13,
  color: 'var(--cth-ink-900)',
  outline: 'none'
};

const fieldLabelStyle: CSSProperties = {
  fontFamily: 'var(--cth-font-display)',
  fontSize: 12,
  lineHeight: '18px',
  color: 'var(--cth-ink-700)',
  textTransform: 'none'
};

/** Clear every renderer-side persisted key so a relaunch starts truly empty. */
function clearLocalState(): void {
  try {
    const keys: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith('cth.')) keys.push(k);
    }
    for (const k of keys) window.localStorage.removeItem(k);
  } catch { /* noop */ }
}

// v0.3.4 redesign: one topic per tab. 'AI Engines' folded into Agents & Models;
// MCP + REST live together in Connections; Danger Zone became a red row at the
// bottom of General.
/* The small-caps section heading, defined once. It was written out inline
   seventeen times, in three slightly different forms, which is how a tab ends
   up looking subtly unlike its neighbours. */
const sectionHead = {
  fontFamily: 'var(--cth-font-ui)', fontSize: 14, fontWeight: 600, lineHeight: '22px',
  color: 'var(--cth-ink-900)', textTransform: 'none', marginBottom: 10
} as const;

export type Section = 'General' | 'Prerequisites' | 'Agents & Models' | 'Autonomy & Budgets' | 'Connections' | 'Memory & Knowledge';
const NAV_SECTIONS: Section[] = ['General', 'Prerequisites', 'Agents & Models', 'Autonomy & Budgets', 'Connections', 'Memory & Knowledge'];
/** i18n key for each nav section's label — the Section values themselves stay
 *  as stable identifiers (tab state, deep links). */
const NAV_SECTION_KEYS: Record<Section, string> = {
  'General': 'settings.nav.general',
  'Prerequisites': 'settings.nav.prerequisites',
  'Agents & Models': 'settings.nav.agentsModels',
  'Autonomy & Budgets': 'settings.nav.autonomyBudgets',
  'Connections': 'settings.nav.connections',
  'Memory & Knowledge': 'settings.nav.memoryKnowledge'
};

export function SettingsModal({ config, onClose, initialSection }: SettingsModalProps) {
  useUiLanguage();
  const { t, i18n } = useTranslation();
  const godName = useStore((s) => s.agents.find((a) => a.isGod)?.name) ?? uiText("the_orchestrator_fc0fec");
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [activeSection, setActiveSection] = useState<Section>(initialSection ?? 'General');

  // Change-home flow: null until the user picks a new folder, then the sub-modal
  // confirms move-vs-fresh. Pre-selects 'move' (recommended - keeps the data).
  const [changeHome, setChangeHome] = useState<string | null>(null);
  const [changeMode, setChangeMode] = useState<'move' | 'fresh'>('move');
  const [changeBusy, setChangeBusy] = useState(false);
  const [changeErr, setChangeErr] = useState('');

  // `notifications` is an optional field on the main-process config; the renderer
  // mirror type may not declare it yet, so read it defensively.
  const [notifications, setNotifications] = useState<boolean>(
    (config as HarnessConfig & { notifications?: boolean }).notifications === true
  );

  const toggleNotifications = async () => {
    const next = !notifications;
    setNotifications(next); // optimistic
    try { await window.cth.setNotifications(next); }
    catch { setNotifications(!next); /* revert on failure */ }
  };

  // ─── v0.3.4 redesign: settings that were onboarding-trapped or UI-less ────
  const cfgX = config as HarnessConfig & {
    strongKeepalive?: boolean; audience?: string; autoMode?: boolean;
    defaultModel?: string; maxTurns?: number; semanticMemory?: boolean;
  };
  /**
   * ONE SAVE BUTTON.
   *
   * Settings used to persist three different ways: toggles wrote to disk the
   * instant you clicked them, some sections had their own Save, and a couple of
   * fields saved on blur. Nothing told you which kind you were looking at, so
   * "did that stick?" had no answer you could learn once and reuse.
   *
   * Now every setting that goes through `updateConfig` is STAGED here and
   * written by the footer Save, in a single call.
   *
   * Secrets stay immediate, on purpose: they go to the write-only secret
   * broker, and nothing can read one back to diff it, so there is no staged
   * value to hold.
   */
  const [pending, setPending] = useState<Partial<HarnessConfig>>({});
  /** Auto-compact lives inside the missions array, so it is resolved at save
   *  time against the config on disk rather than staged as a whole array. */
  const [autoCompactPending, setAutoCompactPending] = useState<boolean | null>(null);
  const [saveBusy, setSaveBusy] = useState(false);
  const [saveNote, setSaveNote] = useState('');
  /** True once a control that USED to persist on click has been changed. Only
   *  those need the close guard: the text fields always needed a Save. */
  const dirty = Object.keys(pending).length > 0 || autoCompactPending !== null;
  const stage = (patch: Partial<HarnessConfig>): void =>
    setPending((prev) => ({ ...prev, ...patch }));

  const [keepAwake, setKeepAwake] = useState<boolean>(cfgX.strongKeepalive === true);
  const toggleKeepAwake = async () => {
    const next = !keepAwake;
    setKeepAwake(next);
    stage({ strongKeepalive: next } as Partial<HarnessConfig>);
  };
  const [simpleMode, setSimpleMode] = useState<boolean>(cfgX.audience === 'non-technical');
  const toggleSimpleMode = async () => {
    const next = !simpleMode;
    setSimpleMode(next);
    stage({ audience: next ? 'non-technical' : 'technical' } as Partial<HarnessConfig>);
  };
  const [autoModeOn, setAutoModeOn] = useState<boolean>(cfgX.autoMode !== false);
  const toggleAutoMode = async () => {
    const next = !autoModeOn;
    setAutoModeOn(next);
    stage({ autoMode: next } as Partial<HarnessConfig>);
  };
  // Default OFF, so an absent value must read as off. Note this is `=== true`,
  // the mirror image of autoMode's `!== false` above, because the two defaults
  // are opposite.
  const [orchSpawnOn, setOrchSpawnOn] = useState<boolean>(cfgX.orchestratorMaySpawn === true);
  const toggleOrchSpawn = async () => {
    const next = !orchSpawnOn;
    setOrchSpawnOn(next);
    stage({ orchestratorMaySpawn: next } as Partial<HarnessConfig>);
  };
  const [defaultModelSel, setDefaultModelSel] = useState<string>(cfgX.defaultModel ?? 'claude-fable-5');
  const saveDefaultModel = (id: string): void => {
    setDefaultModelSel(id);
    stage({ defaultModel: id } as Partial<HarnessConfig>);
  };
  const [maxTurnsVal, setMaxTurnsVal] = useState<string>(cfgX.maxTurns != null ? String(cfgX.maxTurns) : '');
  const maxTurnsPatch = (): Partial<HarnessConfig> => {
    const n = maxTurnsVal.trim() === '' ? undefined : Number(maxTurnsVal);
    return { maxTurns: Number.isFinite(n as number) && (n as number) > 0 ? Math.round(n as number) : undefined } as Partial<HarnessConfig>;
  };
  const [semMemOn, setSemMemOn] = useState<boolean>(cfgX.semanticMemory !== false);
  const toggleSemMem = async () => {
    const next = !semMemOn;
    setSemMemOn(next);
    stage({ semanticMemory: next } as Partial<HarnessConfig>);
  };

  // --- circuit-breaker config (Lane A #6 canonical fields, widened view) ---
  // Drives Jim's real breaker: floor-wide TOKEN budget (costCapTokens) + output-
  // token velocity ceiling (circuitBreaker.tokenVelocityPerMin). The token cap
  // replaced the old dollar cap as the user-facing budget.
  type BreakerCfgView = HarnessConfig & {
    costCapTokens?: number;
    circuitBreaker?: { tokenVelocityPerMin?: number; enabled?: boolean; hardStop?: boolean; repeatedToolLimit?: number; errorStormLimit?: number };
  };
  const breakerCfg = config as BreakerCfgView;
  const [agentBudget, setAgentBudget] = useState(breakerCfg.costCapTokens != null ? String(breakerCfg.costCapTokens) : '');
  const [velocityCeiling, setVelocityCeiling] = useState(breakerCfg.circuitBreaker?.tokenVelocityPerMin != null ? String(breakerCfg.circuitBreaker.tokenVelocityPerMin) : '');
  // v0.3.4: the four previously UI-less breaker fields get controls.
  const [brkEnabled, setBrkEnabled] = useState<boolean>(breakerCfg.circuitBreaker?.enabled !== false);
  const [brkHardStop, setBrkHardStop] = useState<boolean>(breakerCfg.circuitBreaker?.hardStop === true);
  const [brkRepeated, setBrkRepeated] = useState(breakerCfg.circuitBreaker?.repeatedToolLimit != null ? String(breakerCfg.circuitBreaker.repeatedToolLimit) : '');
  const [brkErrStorm, setBrkErrStorm] = useState(breakerCfg.circuitBreaker?.errorStormLimit != null ? String(breakerCfg.circuitBreaker.errorStormLimit) : '');
  const budgetPatch = (): Partial<HarnessConfig> => {
    const tokens = agentBudget.trim() === '' ? undefined : Number(agentBudget);
    const vel = velocityCeiling.trim() === '' ? undefined : Number(velocityCeiling);
    const rep = brkRepeated.trim() === '' ? undefined : Number(brkRepeated);
    const storm = brkErrStorm.trim() === '' ? undefined : Number(brkErrStorm);
    return {
      costCapTokens: Number.isFinite(tokens as number) ? (tokens as number) : undefined,
      circuitBreaker: {
        ...(breakerCfg.circuitBreaker ?? {}),
        enabled: brkEnabled,
        hardStop: brkHardStop,
        tokenVelocityPerMin: Number.isFinite(vel as number) ? (vel as number) : undefined,
        repeatedToolLimit: Number.isFinite(rep as number) ? Math.round(rep as number) : undefined,
        errorStormLimit: Number.isFinite(storm as number) ? Math.round(storm as number) : undefined
      }
    } as Partial<HarnessConfig>;
  };
  /** The one writer. Commits what the form currently shows, in a single
   *  updateConfig, so a half-applied save is not a state the app can reach. */
  const saveAll = async (): Promise<void> => {
    setSaveBusy(true); setSaveNote('');
    try {
      const patch: Partial<HarnessConfig> = {
        ...maxTurnsPatch(),
        ...budgetPatch(),
        ...pending
      };
      if (autoCompactPending !== null) {
        // Read-modify-write against disk, not against a stale copy: another
        // window (or main) may have edited a different mission meanwhile.
        const cfg = await window.cth.getConfig();
        patch.missions = (cfg.missions ?? []).map((m) =>
          m.id === 'compact-maintenance' ? { ...m, enabled: autoCompactPending } : m
        );
      }
      await window.cth.updateConfig(patch);
      setPending({});
      setAutoCompactPending(null);
      setSaveNote(t('settings.saved'));
      setTimeout(() => setSaveNote(''), 1800);
    } catch (e) {
      setSaveNote(e instanceof Error ? e.message : String(e));
    } finally { setSaveBusy(false); }
  };

  /** Closing with staged changes used to be impossible, because everything wrote
   *  on click. Now it is, so say so rather than dropping the edit silently. */
  const requestClose = (): void => {
    if (dirty && !window.confirm(t('settings.unsavedWarning'))) return;
    onClose();
  };

  const fmtBudgetTokens = (raw: string): string => {
    const n = Number(raw);
    if (!raw.trim() || !Number.isFinite(n) || n <= 0) return '';
    if (n >= 1e9) return `${+(n / 1e9).toFixed(2)}B`;
    if (n >= 1e6) return `${+(n / 1e6).toFixed(2)}M`;
    if (n >= 1e3) return `${+(n / 1e3).toFixed(1)}K`;
    return String(n);
  };

  // ─── Knowledge Graph (enterprise multimodal context for agents) ───────────
  const [kgEnabled, setKgEnabled] = useState<boolean>(
    (config as HarnessConfig & { knowledgeGraph?: { enabled?: boolean } }).knowledgeGraph?.enabled === true
  );
  const [kgDocCount, setKgDocCount] = useState(0);
  const [kgBusy, setKgBusy] = useState(false);
  const [kgNote, setKgNote] = useState('');

  const refreshKgStatus = async () => {
    try { const s = await window.cth.kgStatus(); setKgDocCount(s.docCount); }
    catch { /* status unavailable */ }
  };

  const toggleKg = async () => {
    const next = !kgEnabled;
    setKgEnabled(next);
    try {
      stage({ knowledgeGraph: { enabled: next } });
      if (next) await refreshKgStatus();
    } catch { setKgEnabled(!next); }
  };

  const addKgFiles = async () => {
    setKgBusy(true); setKgNote('');
    try {
      const res = await window.cth.kgAddFiles();
      if (!res.ok) { setKgNote(res.error === 'cancelled' ? '' : (res.error ?? 'failed')); return; }
      const added = res.results.filter((r) => r.ok).length;
      const failed = res.results.length - added;
      setKgNote(uiText('documentsAdded', { added, failed }));
      await refreshKgStatus();
    } catch (e) { setKgNote(e instanceof Error ? e.message : String(e)); }
    finally { setKgBusy(false); }
  };

  // ─── Scheduled auto-compact — the compact-maintenance mission's enabled flag.
  // The mission itself stays the single source of truth (the Triggers tab edits
  // the same field); this is just a General-section shortcut. Default OFF (v0.3.4).
  const [autoCompactOn, setAutoCompactOn] = useState<boolean>(
    (config.missions ?? []).some((m) => m.id === 'compact-maintenance' && m.enabled)
  );
  const toggleAutoCompact = async () => {
    const next = !autoCompactOn;
    setAutoCompactOn(next);
    setAutoCompactPending(next);
  };

  // ─── Auto-update (default ON; gates main's updater checks entirely) ────────
  const [autoUpdateOn, setAutoUpdateOn] = useState<boolean>(config.autoUpdate !== false);
  const toggleAutoUpdate = async () => {
    const next = !autoUpdateOn;
    setAutoUpdateOn(next);
    try { stage({ autoUpdate: next }); }
    catch { setAutoUpdateOn(!next); }
  };

  // Re-seed every editable field from the on-disk config when the modal opens.
  // App's `config` prop is loaded once and never refreshed after a save, so
  // without this the saved budget / velocity values show blank on reopen.
  useEffect(() => {
    let alive = true;
    window.cth.getConfig().then((c) => {
      if (!alive) return;
      const cc = c as BreakerCfgView;
      setNotifications(cc.notifications === true);
      setAgentBudget(cc.costCapTokens != null ? String(cc.costCapTokens) : '');
      setVelocityCeiling(cc.circuitBreaker?.tokenVelocityPerMin != null ? String(cc.circuitBreaker.tokenVelocityPerMin) : '');
      const kgOn = (cc as { knowledgeGraph?: { enabled?: boolean } }).knowledgeGraph?.enabled === true;
      setKgEnabled(kgOn);
    }).catch(() => { /* keep prop-seeded values */ });
    window.cth.kgStatus().then((s) => { if (alive) setKgDocCount(s.docCount); })
      .catch(() => { /* status unavailable */ });
    return () => { alive = false; };
  }, []);

  const reset = async () => {
    setBusy(true);
    clearLocalState();
    // Wipes hive + palace, resets config, and relaunches into onboarding.
    // The app exits, so this never resolves - no need to clear `busy`.
    await window.cth.resetAll();
  };

  // --- Change home folder ---
  /** Pick a new folder, then open the move-vs-fresh sub-modal. */
  const pickNewHome = async () => {
    setChangeErr('');
    const res = await window.cth.chooseFolder();
    if (!res.ok) return; // cancelled - no-op
    setChangeMode('move'); // recommended default
    setChangeHome(res.path);
  };

  /** Apply the home-folder change. On success the app relaunches (never resolves);
   *  on failure we surface the error and the existing home keeps running. */
  const applyChangeHome = async () => {
    if (!changeHome) return;
    setChangeBusy(true); setChangeErr('');
    // Moving copies the hive (incl. its .git) + palace, so the new home owns the
    // same renderer-side roster - keep localStorage. A 'fresh' home starts empty,
    // so clear the renderer cache to match.
    if (changeMode === 'fresh') clearLocalState();
    try {
      const res = await window.cth.changeHome(changeHome, changeMode);
      if (!res.ok) { setChangeErr(res.error ?? uiText("Could_not_change_the_home_folder_d51356")); setChangeBusy(false); }
      // ok === true never returns (the process relaunches).
    } catch (e) {
      setChangeErr(e instanceof Error ? e.message : String(e));
      setChangeBusy(false);
    }
  };

  const modalTitle = changeHome
    ? t('settings.changeHomeTitle')
    : confirming
      ? t('settings.resetTitle')
      : t('settings.title');

  return (
    <div
      onClick={busy ? undefined : onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(26, 19, 32, 0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 300
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 980, maxWidth: '92vw', maxHeight: '88vh',
          display: 'flex', flexDirection: 'column',
          boxShadow: 'var(--cth-dialog-shadow)', borderRadius: 'var(--cth-radius-panel)'
        }}
      >
        <PixelPanel
          variant="dialog"
          title={modalTitle}
          noPadding
          style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', maxHeight: '88vh' }}
        >
          {/* === Change home sub-modal === */}
          {changeHome ? (
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 12, color: 'var(--cth-ink-500)' }}>{t('settings.changeHome.newHome')}</span>
                <code style={{
                  fontFamily: 'var(--cth-font-mono, monospace)', fontSize: 12,
                  color: 'var(--cth-ink-900)', wordBreak: 'break-all'
                }}>{changeHome}</code>
              </div>

              {/* Move vs. fresh - two selectable option rows; move is preselected. */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {([
                  ['move', t('settings.changeHome.moveTitle'), t('settings.changeHome.moveDesc')],
                  ['fresh', t('settings.changeHome.freshTitle'), t('settings.changeHome.freshDesc')]
                ] as const).map(([value, title, desc]) => {
                  const selected = changeMode === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setChangeMode(value)}
                      disabled={changeBusy}
                      style={{
                        textAlign: 'left', cursor: changeBusy ? 'default' : 'pointer',
                        padding: '10px 12px', background: 'var(--cth-paper-100)', border: 'none',
                        boxShadow: `inset 0 0 0 ${selected ? 2 : 1}px ${selected ? 'var(--cth-ink-900)' : 'var(--cth-ink-300)'}`,
                        display: 'flex', flexDirection: 'column', gap: 3
                      }}
                    >
                      <span style={{
                        fontSize: 13, lineHeight: '20px',
                        color: 'var(--cth-ink-900)', fontWeight: selected ? 700 : 400
                      }}>
                        {selected ? '◉ ' : '○ '}{title}
                      </span>
                      <span style={{ fontSize: 12, lineHeight: '18px', color: 'var(--cth-ink-500)' }}>{desc}</span>
                    </button>
                  );
                })}
              </div>

              {changeErr && (
                <div style={{ fontSize: 12, lineHeight: '18px', color: 'var(--cth-danger-text)' }}>{changeErr}</div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <PixelButton variant="secondary" size="md" onClick={() => { setChangeHome(null); setChangeErr(''); }} disabled={changeBusy}>
                  {t('common.cancel')}
                </PixelButton>
                <PixelButton variant="primary" size="md" onClick={applyChangeHome} disabled={changeBusy}>
                  {changeBusy ? t('settings.apply') : (changeMode === 'move' ? t('settings.moveAndRestart') : t('settings.switchAndRestart'))}
                </PixelButton>
              </div>
            </div>

          /* === Reset confirmation screen === */
          ) : confirming ? (
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{
                  width: 32, height: 32,
                  background: 'var(--cth-coral-light)',
                  boxShadow: 'inset 0 0 0 1.5px var(--cth-ink-500)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Icon name="bell" />
                </div>
                <div style={{ flex: 1, fontSize: 15, lineHeight: '22px', color: 'var(--cth-ink-700)' }}>
                  {t('settings.resetConfirm.body', { godName })}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <PixelButton variant="secondary" size="md" onClick={() => setConfirming(false)} disabled={busy}>
                  {t('common.cancel')}
                </PixelButton>
                <PixelButton variant="destructive" size="md" onClick={reset} disabled={busy}>
                  {busy ? t('settings.resetting') : t('settings.eraseEverything')}
                </PixelButton>
              </div>
            </div>

          /* === Main two-pane settings layout === */
          ) : (
            <>
              <div className="cth-settings-layout" style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>

                {/* Left nav */}
                <nav className="cth-settings-nav" aria-label={t('settings.title')} style={{
                  width: 210, flexShrink: 0,
                  display: 'flex', flexDirection: 'column',
                  borderRight: '1px solid var(--cth-ink-100)',
                  paddingTop: 8, paddingBottom: 8,
                  background: 'var(--cth-cream-200)'
                }}>
                  {NAV_SECTIONS.map((section) => {
                    const active = activeSection === section;
                    return (
                      <button
                        key={section}
                        aria-current={active ? 'page' : undefined}
                        type="button"
                        onClick={() => setActiveSection(section)}
                        style={{
                          display: 'block', width: '100%', textAlign: 'left',
                          padding: '10px 16px 8px',
                          border: 'none',
                          borderLeft: active ? '3px solid var(--cth-action)' : '3px solid transparent',
                          background: active ? 'var(--cth-action-soft)' : 'transparent',
                          color: active ? 'var(--cth-action-text)' : 'var(--cth-ink-700)',
                          fontFamily: 'var(--cth-font-display)',
                          fontSize: 13,
                          lineHeight: '18px',
                          cursor: 'pointer',
                          letterSpacing: 0
                        }}
                      >
                        {t(NAV_SECTION_KEYS[section])}
                      </button>
                    );
                  })}
                </nav>

                {/* Right scrollable content pane. minWidth:0 lets this flex child
                    shrink to the row's width instead of growing to its content's
                    min-content (which would push a horizontal scrollbar). */}
                <div className="cth-settings-content" style={{
                  flex: 1, minWidth: 0, overflowY: 'auto', overflowX: 'hidden',
                  padding: '20px 24px',
                  display: 'flex', flexDirection: 'column', gap: 20
                }}>

                  {/* GENERAL */}
                  {activeSection === 'General' && (
                    <>
                      {/* Who you are and what this install is — version, plan,
                          sponsor, and the app-level actions that belong to none
                          of the settings below. Slots for a future subscription
                          and a sponsor live here; both render nothing until set. */}
                      <SettingsHeroCard />

                      <div style={{ height: 1, background: 'var(--cth-ink-300)' }} />

                      {/* Updates — first among the settings proper, because "am I
                          on the latest?" is the question people open Settings to
                          answer, and the toolbar chip says nothing at all when
                          the answer is yes. */}
                      <UpdatesSection />

                      <div style={{ height: 1, background: 'var(--cth-ink-300)' }} />

                      {/* Home folder */}
                      <div>
                        <div style={sectionHead}>
                          {t('settings.general.homeFolder')}
                        </div>
                        <div style={{ display: 'flex', gap: 12, fontSize: 13, lineHeight: '20px', alignItems: 'center' }}>
                          <span style={{
                            flex: 1, color: 'var(--cth-ink-900)', wordBreak: 'break-all',
                            fontFamily: 'var(--cth-font-mono, monospace)'
                          }}>{config.harnessHome ?? '—'}</span>
                          <PixelButton variant="secondary" size="sm" onClick={pickNewHome}>{t('settings.change')}</PixelButton>
                        </div>
                      </div>

                      <div style={{ height: 1, background: 'var(--cth-ink-300)' }} />

                      {/* Environment — settings that used to be trapped in onboarding */}
                      <div>
                        <div style={sectionHead}>
                          {t('settings.general.environment')}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                              <span style={{ fontSize: 13, lineHeight: '20px', color: 'var(--cth-ink-900)' }}>{t('settings.general.keepAwake')}</span>
                              <span style={{ fontSize: 12, lineHeight: '18px', color: 'var(--cth-ink-500)' }}>
                                {t('settings.general.keepAwakeDesc')}
                              </span>
                            </div>
                            <PixelButton variant={keepAwake ? 'primary' : 'secondary'} size="sm" onClick={toggleKeepAwake}>
                              {keepAwake ? t('common.on') : t('common.off')}
                            </PixelButton>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                              <span style={{ fontSize: 13, lineHeight: '20px', color: 'var(--cth-ink-900)' }}>{t('settings.general.simpleMode')}</span>
                              <span style={{ fontSize: 12, lineHeight: '18px', color: 'var(--cth-ink-500)' }}>
                                {t('settings.general.simpleModeDesc')}
                              </span>
                            </div>
                            <PixelButton variant={simpleMode ? 'primary' : 'secondary'} size="sm" onClick={toggleSimpleMode}>
                              {simpleMode ? t('common.on') : t('common.off')}
                            </PixelButton>
                          </div>
                        </div>
                      </div>

                      <div style={{ height: 1, background: 'var(--cth-ink-300)' }} />

                      {/* Language — app UI language (i18n) */}
                      <div>
                        <div style={sectionHead}>
                          {t('settings.general.language')}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <span style={{ fontSize: 13, lineHeight: '20px', color: 'var(--cth-ink-900)' }}>{t('settings.general.language')}</span>
                            <span style={{ fontSize: 12, lineHeight: '18px', color: 'var(--cth-ink-500)' }}>
                              {t('settings.general.languageDesc')}
                            </span>
                          </div>
                          <select
                            value={i18n.language}
                            onChange={(e) => setLanguage(e.target.value)}
                            style={textInputStyle}
                            aria-label={t('settings.general.language')}
                          >
                            {LANGUAGES.map((l) => (
                              <option key={l.code} value={l.code}>{l.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div style={{ height: 1, background: 'var(--cth-ink-300)' }} />

                      {/* Desktop notifications toggle */}
                      <div>
                        <div style={sectionHead}>
                          {t('settings.general.notifications')}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <span style={{ fontSize: 13, lineHeight: '20px', color: 'var(--cth-ink-900)' }}>
                              {t('settings.general.desktopNotifications')}
                            </span>
                            <span style={{ fontSize: 12, lineHeight: '18px', color: 'var(--cth-ink-500)' }}>
                              {t('settings.general.desktopNotificationsDesc')}
                            </span>
                          </div>
                          <PixelButton
                            variant={notifications ? 'primary' : 'secondary'}
                            size="sm"
                            onClick={toggleNotifications}
                          >
                            {notifications ? t('common.on') : t('common.off')}
                          </PixelButton>
                        </div>
                      </div>

                      <div style={{ height: 1, background: 'var(--cth-ink-300)' }} />

                      {/* Scheduled auto-compact (compact-maintenance mission) */}
                      <div>
                        <div style={sectionHead}>
                          {t('settings.general.maintenance')}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <span style={{ fontSize: 13, lineHeight: '20px', color: 'var(--cth-ink-900)' }}>
                              {t('settings.general.autoCompact')}
                            </span>
                            <span style={{ fontSize: 12, lineHeight: '18px', color: 'var(--cth-ink-500)' }}>
                              {t('settings.general.autoCompactDesc')}
                            </span>
                          </div>
                          <PixelButton
                            variant={autoCompactOn ? 'primary' : 'secondary'}
                            size="sm"
                            onClick={toggleAutoCompact}
                          >
                            {autoCompactOn ? t('common.on') : t('common.off')}
                          </PixelButton>
                        </div>
                        <div style={{ height: 10 }} />
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <span style={{ fontSize: 13, lineHeight: '20px', color: 'var(--cth-ink-900)' }}>
                              {t('settings.general.autoUpdate')}
                            </span>
                            <span style={{ fontSize: 12, lineHeight: '18px', color: 'var(--cth-ink-500)' }}>
                              {t('settings.general.autoUpdateDesc')}
                            </span>
                          </div>
                          <PixelButton
                            variant={autoUpdateOn ? 'primary' : 'secondary'}
                            size="sm"
                            onClick={toggleAutoUpdate}
                          >
                            {autoUpdateOn ? t('common.on') : t('common.off')}
                          </PixelButton>
                        </div>
                      </div>
                    </>
                  )}

                  {/* AGENTS & MODELS — what powers the office */}
                  {/* PREREQUISITES — the external tools the app leans on and
                      whether this machine has them. It was a Command Center tab,
                      which was the wrong home: it is machine-wide state, not
                      something about the agent whose terminal you are reading. */}
                  {activeSection === 'Prerequisites' && <SetupPanel onDone={onClose} />}

                  {activeSection === 'Agents & Models' && (
                    <>
                      <div>
                        <div style={sectionHead}>
                          {t('settings.agentsModels.defaultModel')}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <span style={{ fontSize: 12, lineHeight: '18px', color: 'var(--cth-ink-500)' }}>
                            {t('settings.agentsModels.defaultModelDesc', { godName })}
                          </span>
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {AGENT_MODELS.map((m) => (
                              <button
                                key={m.label}
                                onClick={() => { if (m.id) void saveDefaultModel(m.id); }}
                                style={{
                                  padding: '3px 8px 1px', border: 'none', cursor: 'pointer',
                                  fontFamily: 'var(--cth-font-ui)', fontSize: 12, color: 'var(--cth-ink-900)',
                                  background: defaultModelSel === m.id ? 'var(--cth-sky-light)' : 'var(--cth-cream-100)',
                                  boxShadow: defaultModelSel === m.id ? 'inset 0 0 0 1.5px var(--cth-ink-500)' : 'inset 0 0 0 1px var(--cth-ink-100)'
                                }}
                              >{m.label}</button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div style={{ height: 1, background: 'var(--cth-ink-300)' }} />

                      <AiEnginesSettings config={{ ...config, ...pending }} onLocalChange={(localConnections) => stage({ localConnections })} />

                      <div style={{ height: 1, background: 'var(--cth-ink-300)' }} />

                      {/* Advanced */}
                      <div>
                        <div style={sectionHead}>
                          {t('settings.agentsModels.advanced')}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: 13, color: 'var(--cth-ink-900)' }}>{t('settings.agentsModels.maxTurns')}</span>
                          <input
                            type="number" min="1" step="10" value={maxTurnsVal}
                            onChange={(e) => setMaxTurnsVal(e.target.value)}
                            placeholder={t('settings.agentsModels.unlimited')}
                            style={{ ...textInputStyle, width: 120 }}
                          />
                          <span style={{ fontSize: 12, color: 'var(--cth-ink-500)' }}>{t('settings.agentsModels.blankUnlimited')}</span>
                        </div>
                      </div>
                    </>
                  )}

                  {/* AUTONOMY & BUDGETS — the safety tab */}
                  {activeSection === 'Autonomy & Budgets' && (
                    <>
                      <div>
                        <div style={sectionHead}>
                          {t('settings.autonomy.autonomy')}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <span style={{ fontSize: 13, lineHeight: '20px', color: 'var(--cth-ink-900)' }}>
                              {autoModeOn ? t('settings.autonomy.autoOn') : t('settings.autonomy.autoOff')}
                            </span>
                            <span style={{ fontSize: 12, lineHeight: '18px', color: 'var(--cth-ink-500)' }}>
                              {t('settings.autonomy.autoDesc')}
                            </span>
                          </div>
                          <PixelButton variant={autoModeOn ? 'primary' : 'secondary'} size="sm" onClick={toggleAutoMode}>
                            {autoModeOn ? t('settings.autonomy.autonomous') : t('settings.autonomy.askFirst')}
                          </PixelButton>
                        </div>
                      </div>

                      <div style={{ height: 1, background: 'var(--cth-ink-300)', margin: '12px 0' }} />

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <span style={{ fontSize: 13, lineHeight: '20px', color: 'var(--cth-ink-900)' }}> {uiText("Who_can_add_agents_1e5f0e")} </span>
                            <span style={{ fontSize: 12, lineHeight: '18px', color: 'var(--cth-ink-500)' }}>
                              {orchSpawnOn
                                ? uiText('dynamic10', { v0: godName })
                                : uiText('dynamic11', { v0: godName })}
                            </span>
                          </div>
                          <PixelButton variant={orchSpawnOn ? 'primary' : 'secondary'} size="sm" onClick={toggleOrchSpawn}>
                            {orchSpawnOn ? uiText('dynamic12', { v0: godName }) : uiText("only_me_c533ea")}
                          </PixelButton>
                        </div>
                      </div>

                      <div style={{ height: 1, background: 'var(--cth-ink-300)' }} />

                      {/* Circuit breaker — the FULL unit (v0.3.4: all fields have UI) */}
                      <div>
                        <div style={sectionHead}>
                          {t('settings.autonomy.breaker')}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                            <span style={{ fontSize: 12, lineHeight: '18px', color: 'var(--cth-ink-500)' }}>
                              {t('settings.autonomy.breakerDesc')}
                            </span>
                            <PixelButton variant={brkEnabled ? 'primary' : 'secondary'} size="sm"
                              onClick={() => { setBrkEnabled(!brkEnabled); }}>
                              {brkEnabled ? t('common.on') : t('common.off')}
                            </PixelButton>
                          </div>
                          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                            <label style={{ display: 'flex', flexDirection: 'column', gap: 4, ...fieldLabelStyle }}>
                              {t('settings.autonomy.floorBudget')}
                              <input
                                type="number" min="0" step="100000" value={agentBudget}
                                onChange={(e) => setAgentBudget(e.target.value)}
                                placeholder={t('settings.autonomy.budgetPlaceholder')}
                                style={{ ...textInputStyle, width: 180 }}
                              />
                              <span style={{ fontSize: 12, color: 'var(--cth-ink-500)' }}>
                                {fmtBudgetTokens(agentBudget) ? t('settings.autonomy.budgetEquals', { value: fmtBudgetTokens(agentBudget) }) : t('settings.autonomy.budgetTotal')}
                              </span>
                            </label>
                            <label style={{ display: 'flex', flexDirection: 'column', gap: 4, ...fieldLabelStyle }}>
                              {t('settings.autonomy.velocity')}
                              <input
                                type="number" min="0" step="1000" value={velocityCeiling}
                                onChange={(e) => setVelocityCeiling(e.target.value)}
                                placeholder={t('settings.autonomy.velocityPlaceholder')}
                                style={{ ...textInputStyle, width: 180 }}
                              />
                            </label>
                            <label style={{ display: 'flex', flexDirection: 'column', gap: 4, ...fieldLabelStyle }}>
                              {t('settings.autonomy.repeatedLimit')}
                              <input
                                type="number" min="0" step="5" value={brkRepeated}
                                onChange={(e) => setBrkRepeated(e.target.value)}
                                placeholder={t('settings.autonomy.defaultPlaceholder')}
                                style={{ ...textInputStyle, width: 140 }}
                              />
                            </label>
                            <label style={{ display: 'flex', flexDirection: 'column', gap: 4, ...fieldLabelStyle }}>
                              {t('settings.autonomy.errorStormLimit')}
                              <input
                                type="number" min="0" step="5" value={brkErrStorm}
                                onChange={(e) => setBrkErrStorm(e.target.value)}
                                placeholder={t('settings.autonomy.defaultPlaceholder')}
                                style={{ ...textInputStyle, width: 140 }}
                              />
                            </label>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                              <span style={{ fontSize: 13, lineHeight: '20px', color: 'var(--cth-ink-900)' }}>{t('settings.autonomy.hardStop')}</span>
                              <span style={{ fontSize: 12, lineHeight: '18px', color: 'var(--cth-ink-500)' }}>
                                {t('settings.autonomy.hardStopDesc')}
                              </span>
                            </div>
                            <PixelButton variant={brkHardStop ? 'destructive' : 'secondary'} size="sm"
                              onClick={() => { setBrkHardStop(!brkHardStop); }}>
                              {brkHardStop ? t('settings.autonomy.killOnTrip') : t('settings.autonomy.steerFirst')}
                            </PixelButton>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* MEMORY & KNOWLEDGE */}
                  {activeSection === 'Memory & Knowledge' && (
                    <>
                      <div>
                        <div style={sectionHead}>
                          {t('settings.memory.semanticMemory')}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <span style={{ fontSize: 13, lineHeight: '20px', color: 'var(--cth-ink-900)' }}>{t('settings.memory.crossSession')}</span>
                            <span style={{ fontSize: 12, lineHeight: '18px', color: 'var(--cth-ink-500)' }}>
                              {t('settings.memory.crossSessionDesc')}
                            </span>
                          </div>
                          <PixelButton variant={semMemOn ? 'primary' : 'secondary'} size="sm" onClick={toggleSemMem}>
                            {semMemOn ? t('common.on') : t('common.off')}
                          </PixelButton>
                        </div>
                      </div>

                      <div style={{ height: 1, background: 'var(--cth-ink-300)' }} />

                      {/* Knowledge Graph — enterprise multimodal context for agents */}
                      <div>
                        <div style={sectionHead}>
                          {t('settings.memory.kg')}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <span style={{ fontSize: 13, lineHeight: '20px', color: 'var(--cth-ink-900)' }}>
                              {t('settings.memory.kgTitle')}
                            </span>
                            <span style={{ fontSize: 12, lineHeight: '18px', color: 'var(--cth-ink-500)' }}>
                              {t('settings.memory.kgDesc')}
                            </span>
                          </div>
                          <PixelButton
                            variant={kgEnabled ? 'primary' : 'secondary'}
                            size="sm"
                            onClick={toggleKg}
                          >
                            {kgEnabled ? t('common.on') : t('common.off')}
                          </PixelButton>
                        </div>
                        {kgEnabled && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
                            <PixelButton variant="secondary" size="sm" onClick={addKgFiles} disabled={kgBusy}>
                              {kgBusy ? t('settings.memory.adding') : t('settings.memory.addFiles')}
                            </PixelButton>
                            <span style={{ fontSize: 12, color: 'var(--cth-ink-500)' }}>
                              {kgDocCount === 1
                                ? t('settings.memory.docCount', { count: kgDocCount })
                                : t('settings.memory.docCountPlural', { count: kgDocCount })}
                            </span>
                            {kgNote && <span style={{ fontSize: 12, color: 'var(--cth-mint)' }}>{kgNote}</span>}
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {/* CONNECTIONS — everything external (MCP + REST) */}
                  {activeSection === 'Connections' && (
                    <>
                      <McpDefaultsSettings config={config} />
                      <div style={{ height: 1, background: 'var(--cth-ink-300)' }} />
                      {/* Connected-services registry (generic, registry-driven). */}
                      <IntegrationsRegistry />
                    </>
                  )}

                  {/* Danger — a red row at the bottom of General (was its own tab) */}
                  {activeSection === 'General' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <div style={{
                        fontFamily: 'var(--cth-font-display)', fontSize: 12, lineHeight: '18px',
                        color: 'var(--cth-danger-text)'
                      }}>{t('settings.general.dangerZone')}</div>
                      <p style={{ margin: 0, fontSize: 13, lineHeight: '20px', color: 'var(--cth-ink-700)' }}>
                        {t('settings.general.dangerDesc', { godName })}
                      </p>
                      <div>
                        <PixelButton variant="destructive" size="md" onClick={() => setConfirming(true)}>
                          {t('settings.general.resetStartOver')}
                        </PixelButton>
                      </div>
                    </div>
                  )}

                </div>
              </div>

              {/* Footer */}
              <div style={{
                borderTop: '2px solid var(--cth-ink-300)',
                padding: '10px 16px',
                display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8,
                background: 'var(--cth-cream-50)'
              }}>
                {saveNote && (
                  <span style={{ fontSize: 12, color: 'var(--cth-mint)' }}>{saveNote}</span>
                )}
                {dirty && !saveNote && (
                  <span style={{ fontSize: 12, color: 'var(--cth-ink-500)' }}>{t('settings.unsavedChanges')}</span>
                )}
                <PixelButton variant="secondary" size="md" onClick={requestClose}>{t('settings.close')}</PixelButton>
                <PixelButton variant="primary" size="md" onClick={() => void saveAll()} disabled={saveBusy}>
                  {saveBusy ? t('settings.saving') : t('common.save')}
                </PixelButton>
              </div>
            </>
          )}
        </PixelPanel>
      </div>
    </div>
  );
}
