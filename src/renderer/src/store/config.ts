import type { LocalConnection } from '@shared/localModels';
// Mirrors src/main/config.ts. Kept as a renderer-side type-only module
// so we don't have to reach into the preload package to type-check.
import {
  AGENT_PROVIDER_PRESETS,
  providerPreset,
  inferAgentProvider,
  isClaudeProvider,
  type AgentProvider
} from '@shared/agentProvider';
import type { ContextTriggerConfig } from '@shared/triggers';
import { isNewer } from '@shared/updateState';
import modelCatalog from '@shared/modelCatalog.json';

export {
  AGENT_PROVIDER_PRESETS,
  providerPreset,
  inferAgentProvider,
  isClaudeProvider,
  type AgentProvider
};

/** A recurring auto-dispatched mission (mirrors src/main/config.ts). */
export interface ScheduledMission {
  id: string;
  label: string;
  intervalMs: number;
  to: string;
  body: string;
  enabled: boolean;
  autoCompact?: boolean;
  lastFiredAt?: number;
  kind?: 'dispatch' | 'heartbeat' | 'compact';
  quietThresholdMs?: number;
}

/** Circuit-breaker thresholds (mirrors src/main/config.ts CircuitBreakerConfig). */
export interface CircuitBreakerConfig {
  enabled?: boolean;
  hardStop?: boolean;
  repeatedToolLimit?: number;
  errorStormLimit?: number;
  tokenVelocityPerMin?: number;
}

/** Enterprise Knowledge Graph config (mirrors src/main/config.ts KnowledgeGraphConfig). */
export interface KnowledgeGraphConfig {
  enabled?: boolean;
  rootPath?: string;
}

export interface HarnessConfig {
  onboardingComplete: boolean;
  /** Self-identified audience from the first onboarding screen ('technical' vs
   *  'non-technical') — drives the copy register across onboarding. Mirrors
   *  src/main/config.ts. */
  audience?: 'technical' | 'non-technical';
  harnessHome: string | null;
  /** Recently-opened hive home folders (most-recent first) for the launch picker.
   *  Mirrors src/main/config.ts. */
  recentHives?: string[];
  registeredRepos: string[];
  autoMode: boolean;
  /** May the orchestrator ("Michael") spin up agents on its own? Default FALSE,
   *  so an absent value reads as off. Mirrors src/main/config.ts. */
  orchestratorMaySpawn?: boolean;
  defaultCommand: string;
  /** Default model for newly spawned agents (e.g. 'claude-sonnet-4-6[1m]'); unset = CLI default. */
  defaultModel?: string;
  /** Which provider+model powers the GOD orchestrator ("Michael"). Default
   *  'claude' / 'claude-opus-4-8'. Mirrors src/main/config.ts. */
  godProvider?: AgentProvider;
  godModel?: string;
  /** Per-server consent for the default MCP bundle, keyed by catalog id (mirrors
   *  src/main/config.ts; seeded from MCP_CATALOG). */
  mcpDefaults?: { [id: string]: { enabled: boolean } };
  semanticMemory: boolean;
  embeddingModel: 'minilm' | 'embeddinggemma';
  missions?: ScheduledMission[];
  opsStandupSeeded?: boolean;
  heartbeatSeeded?: boolean;
  notifications?: boolean;
  /** Opt-in "strong keep-alive": escalates the in-app power blocker to
   *  prevent-display-sleep so scheduled missions/terminals keep firing on time
   *  while away (battery cost; best on AC). Default off = survive + catch up on
   *  resume. Mirrors the main-process field (src/main/config.ts). */
  strongKeepalive?: boolean;
  /** Auto-update from GitHub releases (default ON; Settings → General). */
  autoUpdate?: boolean;
  costCapUsd?: number;
  /** Hard total-token ceiling across active agents (the user-facing budget). */
  costCapTokens?: number;
  /** Per-agent total-token ceiling, keyed by agent id. Overrides the floor budget
   *  for that agent's meter and trips the breaker for it alone. */
  agentTokenCaps?: Record<string, number>;
  autoDeliveryPausedAgents?: string[];
  maxTurns?: number;
  circuitBreaker?: CircuitBreakerConfig;
  /** Enterprise Knowledge Graph (multimodal context for agents). Default OFF. */
  knowledgeGraph?: KnowledgeGraphConfig;
  /** Language agents are instructed to write prose in. */
  agentLanguage?: string;
  localConnections?: LocalConnection[];
  /** Auto-compaction / auto-clearing of agent terminal context. Main deep-fills
   *  both halves on read, so the renderer can treat the sub-keys as present
   *  (mirrors src/main/config.ts). */
  contextTrigger?: ContextTriggerConfig;
  /** One-time guard for the main-process triggers migration; read-only here. */
  triggersMigratedV1?: boolean;
}

/** The Sonnet model with the 1M-token context window — used for Michael's prep
 *  assistant (cheap, large-context context gathering). Mirrors ASSISTANT_MODEL
 *  in src/main/assistant.ts; keep the two in sync. */
export const ASSISTANT_MODEL = 'claude-sonnet-4-6[1m]';

export interface ModelOption {
  /** undefined = use the CLI default (no --model flag) */
  id?: string;
  label: string;
}

/** One row of the model catalog. `minAppVersion` / `maxAppVersion` are INCLUSIVE
 *  app-version bounds: the model is offered while the running build sits inside
 *  them, and null (or an absent key) means unbounded in that direction. That is
 *  what lets a release introduce or retire a model without a code change.
 *
 *  PRERELEASES COUNT AS THEIR RELEASE. The comparison is major.minor.patch only
 *  (`isNewer` discards a `-rc.N` suffix), so `minAppVersion: '0.4.6'` IS offered
 *  on `0.4.6-rc.1`. That is deliberate and ruled on: an rc of a release should
 *  count as that release, it matches the update badge's own comparison, and the
 *  alternative would hide a new model from exactly the testers meant to
 *  exercise it. Bound a model to the release, not to its rc. */
interface CatalogModel {
  /** absent = use the CLI default (no --model flag) */
  id?: string;
  label: string;
  minAppVersion?: string | null;
  maxAppVersion?: string | null;
}

interface ModelCatalog {
  version: number;
  providers: Record<string, CatalogModel[]>;
}

/** The model presets every provider picker offers.
 *
 *  These were a dozen hardcoded `ModelOption[]` arrays in this file, so shipping
 *  a model — one string — meant editing, type-checking and rebuilding renderer
 *  source. They now live in src/shared/modelCatalog.json, imported at BUILD time
 *  (no fs, no network, offline-safe) and filtered per running version, so adding
 *  a model is a one-line JSON edit and a model can name the releases it belongs
 *  to instead of appearing in builds whose CLI never shipped it.
 *
 *  What the arrays used to say — kept, because it explains why the entries look
 *  the way they do:
 *
 *  - claude: `[1m]` selects the 1M-token context-window variant. The list
 *    deliberately has NO "pass no --model flag" entry: every option names a real
 *    model, because the whole reason to open this picker is to know which model
 *    an agent is on, and a no-flag option resolves to whatever Claude Code
 *    happens to choose — which the UI cannot show and the user cannot predict.
 *    The harness default is marked ` · default` instead, and it names a real model.
 *  - The leading `CLI default` entry several providers carry means no `--model`
 *    flag at all — whatever the CLI itself defaults to. That is NOT the harness's
 *    `config.defaultModel`; the pickers mark that one separately, and labelling
 *    both "default" is what made the two impossible to tell apart.
 *  - codex: current OpenAI models offered by Codex. The command field stays
 *    editable and `codex --model <id>` is the source of truth.
 *  - opencode: only `CLI default` — its models are the user's local connections
 *    (Settings → AI Engines), listed alongside by the pickers.
 */
const CATALOG: ModelCatalog = modelCatalog;

declare const __APP_VERSION__: string | undefined;

/** The version of the running build. electron-vite replaces `__APP_VERSION__`
 *  with package.json's version at build time — the same value the update badge
 *  shows — so the renderer knows it synchronously, with no round trip to main.
 *  Outside a build (unit tests) the define is absent and there is no version to
 *  compare against; see the fail-open note on `offeredAtVersion`. */
export function runningAppVersion(): string {
  return typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : '';
}

/** Whether a catalog entry belongs in a picker on this build. Both bounds are
 *  inclusive of the release they name. Anything unparseable — an absent bound, a
 *  malformed one, an unknown app version — is ignored rather than hiding the
 *  model: a picker that silently loses every model is far worse than one that
 *  offers a model this build's CLI cannot run (the command field is editable and
 *  the CLI reports the bad slug). */
function offeredAtVersion(model: CatalogModel, appVersion: string): boolean {
  if (model.minAppVersion && isNewer(model.minAppVersion, appVersion)) return false;
  if (model.maxAppVersion && isNewer(appVersion, model.maxAppVersion)) return false;
  return true;
}

/** The model preset list for a provider's picker, as of a given app version.
 *  `providers` is injectable so the version filter can be exercised against
 *  bounded entries — the shipped catalog is deliberately all-unbounded. */
export function modelsForProviderAtVersion(
  provider: AgentProvider,
  appVersion: string,
  providers: Record<string, CatalogModel[]> = CATALOG.providers
): ModelOption[] {
  // An unknown provider falls back to the Claude list.
  const entries = providers[provider] ?? providers.claude ?? [];
  return entries
    .filter((model) => offeredAtVersion(model, appVersion))
    .map((model) => (model.id === undefined ? { label: model.label } : { id: model.id, label: model.label }));
}

// tokenizeCommand moved to src/shared/commandLine.ts so main's spawn-request
// path splits command lines with the SAME rules as the renderer's spawn flows
// (they used to carry byte-identical copies). Re-exported here so existing
// importers keep their path.
export { tokenizeCommand } from '@shared/commandLine';

/** The model preset list for a given provider's picker, on this build. */
export function modelsForProvider(provider: AgentProvider): ModelOption[] {
  return modelsForProviderAtVersion(provider, runningAppVersion());
}

/** The Claude presets, for the surfaces that only ever offer Claude models. */
export const AGENT_MODELS: ModelOption[] = modelsForProvider('claude');

/** Providers shown in the Command Center's cross-provider model picker. */
export function modelProvidersForAgent() {
  return AGENT_PROVIDER_PRESETS.filter((preset) => preset.supportsModel);
}

/** Native <select> values must carry both provider and model because each
 *  provider has its own "default" option and model namespace. */
export function encodeProviderModel(provider: AgentProvider, model?: string): string {
  return `${provider}:${encodeURIComponent(model ?? '')}`;
}

export function decodeProviderModel(value: string): {
  provider: AgentProvider;
  model?: string;
} | null {
  const split = value.indexOf(':');
  if (split < 1) return null;
  const provider = value.slice(0, split);
  if (!AGENT_PROVIDER_PRESETS.some((preset) => preset.id === provider)) return null;
  try {
    const model = decodeURIComponent(value.slice(split + 1));
    return { provider: provider as AgentProvider, model: model || undefined };
  } catch {
    return null;
  }
}

/** Build the command line to feed into spawnPty, honoring the provider's flags,
 *  autoMode, and an optional per-agent model override. Claude keeps the user's
 *  configured `defaultCommand`; other providers use their preset binary so the
 *  app works without Claude installed. */
export function buildSpawnCommand(
  config: Pick<HarnessConfig, 'defaultCommand' | 'autoMode'>,
  model?: string,
  provider: AgentProvider = inferAgentProvider(config.defaultCommand)
): string {
  const preset = providerPreset(provider);
  // Claude keeps the user's configured defaultCommand; codex and opencode use
  // their preset binary so the app works even without Claude installed.
  const base = provider === 'claude' ? config.defaultCommand || preset.defaultCommand : preset.defaultCommand;
  let cmd = base;
  if (preset.supportsModel && model && preset.modelFlag) {
    // Quote model values that contain whitespace so the command tokenizer
    // keeps them one arg.
    const m = /\s/.test(model) ? `"${model}"` : model;
    cmd = `${cmd} ${preset.modelFlag} ${m}`;
  }
  // Auto (skip-permissions) mode appends each provider's own flag — Claude's
  // bypassPermissions or Codex's sandboxed never-ask.
  if (config.autoMode && preset.autoFlag) cmd = `${cmd} ${preset.autoFlag}`;
  return cmd;
}
