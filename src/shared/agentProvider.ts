/**
 * Agent providers — the CLI a worker runs on: Claude Code, the OpenAI Codex CLI
 * (`codex`, ChatGPT models) or OpenCode (`opencode`, which drives local models
 * through an OpenAI-compatible server).
 * Each provider declares how to build its spawn command (model/auto-mode flags) and
 * whether it accepts the hive's Claude-specific identity injection
 * (`--append-system-prompt` + `--settings`).
 *
 * Shared between main and renderer; keep it dependency-free (no electron, no UI).
 */
import type { CmdGroup } from './claudeCommands';
import { COMMAND_GROUPS as CLAUDE_COMMAND_GROUPS } from './claudeCommands';
import { CODEX_COMMAND_GROUPS } from './codexCommands';

export type AgentProvider = 'claude' | 'codex' | 'opencode';

export const AGENT_PROVIDERS: readonly AgentProvider[] = ['claude', 'codex', 'opencode'];

export interface AgentProviderPreset {
  id: AgentProvider;
  label: string;
  /** The binary spawned when the user hasn't typed a custom command. */
  defaultCommand: string;
  /** Slash / CLI command reference for this provider. */
  commandGroups: CmdGroup[];
  /** Environment variable to set for non-interactive / first-run suppression. */
  nonInteractiveEnv?: Record<string, string>;
  /** Flag(s) appended to the command string when auto mode is active.
   *  Kept alongside `autoFlag` (same value) for the HEAD consumers that read
   *  `autoModeFlag` via `autoModeFlagForProvider`. */
  autoModeFlag: string;
  /** Show a model picker and splice the model into the command. */
  supportsModel: boolean;
  /** Flag that selects the session model, e.g. `--model`. */
  modelFlag?: string;
  /** Flag appended when the floor is in auto (skip-permissions) mode.
   *  PR #54 consumers read this; mirrors `autoModeFlag`. */
  autoFlag?: string;
  /** Claude Code accepts the hive identity injection (`--append-system-prompt`
   *  + hook `--settings`). Codex and OpenCode don't: the hive protocol rides in as
   *  their initial prompt and lifecycle events come from their `hookBridge`. */
  hiveAware: boolean;
  /** How a NON-hiveAware provider reports lifecycle events to the hive:
   *    - 'codex'    → installCodexHooks() writes a per-agent CODEX_HOME config and
   *                   reuses the Claude `cth-hook` shim verbatim.
   *    - 'opencode' → installOpenCodePlugin() drops a per-agent plugin that posts
   *                   the same payloads on tool/idle events.
   *  Claude leaves this undefined (it uses its native `--settings` path). */
  hookBridge?: 'codex' | 'opencode';
  /** The model the GOD orchestrator ("Michael") defaults to when this provider
   *  powers it — surfaced as the picker default and the advisory "give Michael a
   *  longer-context, higher-capability model". `modelForRole` resolves the GOD
   *  model as `config.godModel ?? preset.recommendedOrchestratorModel ?? MODEL_GOD`.
   *  Advisory + user-overridable. */
  recommendedOrchestratorModel?: string;
  /** For non-hive-aware CLIs that still take an INITIAL prompt to orient the
   *  session (OpenCode's `opencode --prompt "<prompt>"`), the flag to pass it under. The
   *  hive identity+protocol rides in as the first turn — the closest thing to
   *  Claude's `--append-system-prompt` these CLIs offer. undefined = the CLI
   *  takes its initial prompt POSITIONALLY (Codex: `codex "<prompt>"`) and the
   *  injection branch appends it as a quoted trailing arg instead of a flag. */
  initialPromptFlag?: string;
  /** This CLI accepts the initial hive prompt as a trailing positional argument.
   *  Codex does. */
  positionalInitialPrompt?: boolean;
  /** Flag to resume a prior session on respawn, given the recorded session id
   *  (Claude `--resume <sid>`). undefined = no
   *  resume support, spawn fresh. */
  resumeFlag?: string;
  /** Shell command that installs this provider's engine CLI when it's missing,
   *  e.g. `npm install -g @anthropic-ai/claude-code`. When set, the missing-CLI
   *  path may RUN it visibly in the agent terminal (after pre-spawn detection);
   *  when undefined, the user is shown a manual instruction only and nothing is
   *  auto-run. MUST be a trusted, hardcoded constant — never user/manifest input. */
  installCommand?: string;
  /** A SELF-CONTAINED installer that needs no Node/npm at all, per platform.
   *
   *  `installCommand` is `npm install -g …` for every provider, which silently
   *  assumes npm — i.e. node — is already on the machine. When it isn't, the
   *  missing-CLI banner prints a command that CANNOT succeed, so the user watches
   *  an installer fail instead of an app work. Where the vendor ships a native
   *  installer we run that instead (see buildMissingCliScript's ladder).
   *
   *  Trusted, hardcoded constants — never user/manifest input. MUST contain no
   *  double-quotes: the Windows form is wrapped verbatim in `cmd /d /s /c "…"`. */
  nativeInstallCommand?: { posix: string; win32: string };
  /** Optional docs URL surfaced as a manual-setup hint in the missing-CLI banner. */
  docsUrl?: string;
  /** Extra argv tokens that count as an explicit permission stance (so the auto
   *  flag is not appended). Defaults to the auto flag's own leading token. */
  autoStanceTokens?: string[];
  resumeSubcommand?: string; // CLIs that resume via a subcommand instead of a flag (Codex: `codex resume [OPTIONS] [SESSION_ID]`)
}

export const AGENT_PROVIDER_PRESETS: AgentProviderPreset[] = [
  {
    id: 'claude',
    label: 'Claude Code',
    defaultCommand: 'claude',
    commandGroups: CLAUDE_COMMAND_GROUPS,
    autoModeFlag: '--permission-mode bypassPermissions',
    supportsModel: true,
    modelFlag: '--model',
    autoFlag: '--permission-mode bypassPermissions',
    hiveAware: true,
    // Longest-context Claude variant — matches the "give Michael a bigger model"
    // advisory and the Recommended tag on the orchestrator picker.
    recommendedOrchestratorModel: 'claude-opus-4-8[1m]',
    resumeFlag: '--resume',
    // Official Claude Code install (npm global). Used by the missing-CLI auto-install.
    installCommand: 'npm install -g @anthropic-ai/claude-code',
    // Anthropic's official native installer — a standalone binary, no node/npm.
    // The only rung of the ladder that works on a machine with no Node at all.
    nativeInstallCommand: {
      posix: 'curl -fsSL https://claude.ai/install.sh | bash',
      win32: 'powershell -c irm https://claude.ai/install.ps1 ^| iex'
    },
    docsUrl: 'https://docs.claude.com/en/docs/claude-code'
  },
  {
    id: 'codex',
    label: 'Codex · GPT',
    defaultCommand: 'codex',
    commandGroups: CODEX_COMMAND_GROUPS,
    // Auto mode: never prompt (-a never) but KEEP codex's OS sandbox, scoped to the
    // workspace (-s workspace-write). The app used to spawn with
    // `--dangerously-bypass-approvals-and-sandbox` for one reason only: a hive
    // worker must write to its agent folder at <harnessHome>/hive/agents/<id>/,
    // a different path tree from cwd, which workspace-write blocked. That is a
    // path-layout problem, not a reason to drop the sandbox: codex's documented
    // `--add-dir <DIR>` makes extra directories writable alongside the workspace,
    // and the hive spawn path (hive.ts, which knows the agent dir) appends it.
    // So: approvals off, sandbox on, hive housekeeping still works.
    autoModeFlag: '-a never -s workspace-write',
    autoFlag: '-a never -s workspace-write',
    // Any of these on a command line means the user already chose a posture
    // (including the old full bypass) — do not stack ours on top.
    autoStanceTokens: ['-a', '--ask-for-approval', '-s', '--sandbox', '--full-auto', '--dangerously-bypass-approvals-and-sandbox'],
    // Suppresses first-run interactive prompts (directory-trust gate, installer).
    nonInteractiveEnv: { CODEX_NON_INTERACTIVE: '1' },
    supportsModel: true,
    modelFlag: '--model',
    // Codex is NOT hiveAware in the Claude-flag sense: it has no
    // `--append-system-prompt`/`--settings`. The hive protocol is injected as
    // Codex's INITIAL prompt, which it takes POSITIONALLY (`codex "<prompt>"`) —
    // hence initialPromptFlag is undefined and hive.ts appends it as a trailing arg.
    hiveAware: false,
    // …but Codex DOES expose a Claude-style hooks system (hooks.json / config.toml
    // [hooks]; PreToolUse/PostToolUse/Stop/…), so it gets full hive parity via the
    // 'codex' bridge: a per-agent CODEX_HOME/hooks.json wired to the cth-hook shim
    // (see hive.installCodexHooks). Stop→drain works natively (Codex's Stop honors
    // {decision:'block',reason} = continue-with-prompt, exactly like Claude).
    hookBridge: 'codex',
    // Inbox drains via the codex-hook bridge's Stop→drain (the renderer's idle
    // inbox-wake nudge remains as a harmless fallback for an idle worker).
    initialPromptFlag: undefined,
    positionalInitialPrompt: true,
    // Codex's long-context coding model for the orchestrator role. // TODO-verify
    // the exact codex CLI model id (couldn't install the codex CLI to confirm).
    recommendedOrchestratorModel: 'gpt-5-codex',
    // Codex resumes via a SUBCOMMAND, not a flag: `codex resume [OPTIONS]
    // [SESSION_ID]`. A `--resume <id>` flag does not exist, which is why restarts
    // used to silently start a brand-new session instead of continuing.
    resumeFlag: undefined,
    resumeSubcommand: 'resume',
    // Official OpenAI Codex CLI install (npm global). Used by the missing-CLI auto-install.
    installCommand: 'npm install -g @openai/codex',
    docsUrl: 'https://github.com/openai/codex'
  },
  {
    // OpenCode — the TypeScript AI coding agent (opencode.ai / anomalyco/opencode,
    // ex sst/opencode). NOT the archived Go opencode-ai/opencode (→ Crush). Run as
    // its interactive TUI in a PTY (like codex), oriented by --prompt.
    id: 'opencode',
    label: 'OpenCode',
    defaultCommand: 'opencode',
    commandGroups: [],
    // OpenCode's TUI exposes no skip-permissions FLAG; headless auto-approve is a
    // config concern (permission:allow). To keep auto-mode gated behind the floor
    // `config.autoMode` toggle (Pam guardrail #2), the permission JSON is NOT a
    // static nonInteractiveEnv — spawnAgentCore builds OPENCODE_CONFIG_CONTENT
    // dynamically (permission:allow only when autoMode is on; + a local provider
    // block when a base-URL is set). So no auto flag is spliced onto the command.
    autoModeFlag: '',
    autoFlag: '',
    supportsModel: true,
    modelFlag: '--model', // value form: provider/model, e.g. anthropic/claude-sonnet-4-5
    hiveAware: false, // no --append-system-prompt/--settings; protocol rides in via --prompt
    // NATIVE PLUGIN bridge (god Decision 1): OpenCode has no Claude-shaped Stop hook,
    // but its plugin API DOES expose a real lifecycle event (session.idle). A bundled
    // per-agent plugin drains the inbox on idle and posts HIVE_SOCK payloads — the
    // same Stop→drain semantics as codex's hooks, provider-agnostic, no traffic
    // interception (installOpenCodePlugin, sibling of installCodexHooks).
    hookBridge: 'opencode',
    // god-eligible. NOTE: the plugin bridge is architecturally verified (event surface
    // + payload contract) but its live runtime (auto-load + session.idle firing +
    // injection) is UNVERIFIED pending a local LLM. The renderer idle
    // inbox-wake nudge (useHive.ts) is the guaranteed fallback so a god still drains.
    initialPromptFlag: '--prompt', // opencode --prompt "<orchestrator/worker brief>"
    // NO recommended model — deliberately: OpenCode runs the user's local
    // connections, so there is no model id worth preselecting. Undefined means
    // buildSpawnCommand emits no `--model` at all.
    recommendedOrchestratorModel: undefined,
    // Capturing the TUI session id for resume is unverified; spawn fresh on respawn
    // (protocol re-injected as the initial prompt), matching codex.
    resumeFlag: undefined,
    installCommand: 'npm install -g opencode-ai@latest', // trusted, hardcoded
    // Node-free installers, for the rung that runs when npm is absent AND no Node
    // installer could be resolved (offline / unsupported platform) — until now
    // OpenCode had none, so that rung printed a manual hint and installed nothing.
    // Both are trusted, hardcoded constants and contain no double-quotes (the
    // win32 form is wrapped verbatim in `cmd /d /s /c "…"`).
    //
    // Unlike Claude, OpenCode ships NO standalone Windows one-liner: opencode.ai
    // serves the POSIX install script but has no `install.ps1` (verified 404), and
    // its docs list Chocolatey/Scoop as the Windows-native routes. `-y` because the
    // banner runs the command unattended in the agent terminal. Honest limitation:
    // this rung needs Chocolatey already present; when it isn't, the user sees
    // choco's own "not recognized" error plus the banner's existing "run the
    // command above manually" fallback — no worse off than the manual-only text.
    nativeInstallCommand: {
      posix: 'curl -fsSL https://opencode.ai/install | bash',
      win32: 'choco install opencode -y'
    },
    docsUrl: 'https://opencode.ai/docs'
  }
];

export function isAgentProvider(value: unknown): value is AgentProvider {
  return (AGENT_PROVIDERS as readonly unknown[]).includes(value);
}

export function normalizeAgentProvider(value: unknown): AgentProvider | undefined {
  return isAgentProvider(value) ? value : undefined;
}

export function providerPreset(provider: AgentProvider): AgentProviderPreset {
  return AGENT_PROVIDER_PRESETS.find((p) => p.id === provider) ?? AGENT_PROVIDER_PRESETS[0];
}

export function isClaudeProvider(provider: AgentProvider | undefined): boolean {
  return provider === 'claude';
}

/** Whether this provider takes the hive's Claude-only identity injection. */
export function isHiveAwareProvider(provider: AgentProvider | undefined): boolean {
  return providerPreset(provider ?? 'claude').hiveAware;
}

/** The bare executable from a command string ('codex --model x' → 'codex'). */
function commandBinary(command: string | undefined): string {
  const first = (command ?? '').trim().split(/\s+/)[0] ?? '';
  // strip a path + extension so 'C:\...\codex.exe' and '/usr/bin/claude' both map
  const leaf = first.split(/[\\/]/).pop() ?? first;
  return leaf.replace(/\.(exe|cmd|bat|ps1)$/i, '').toLowerCase();
}

/** Infer the provider from a command (or honor an explicit override). Anything
 *  that is not `codex` or `opencode` runs as Claude Code. */
export function inferAgentProvider(command: string | undefined, explicit?: unknown): AgentProvider {
  const normalized = normalizeAgentProvider(explicit);
  if (normalized) return normalized;
  const bin = commandBinary(command);
  if (bin === 'codex') return 'codex';
  if (bin === 'opencode') return 'opencode';
  return 'claude';
}

export function defaultCommandForProvider(provider: AgentProvider, fallback = ''): string {
  return providerPreset(provider).defaultCommand || fallback;
}

/** Returns the preset's auto-mode CLI flag for the given provider. Empty string = no flag. */
export function autoModeFlagForProvider(provider: AgentProvider): string {
  return providerPreset(provider).autoModeFlag ?? '';
}

/** Idempotently append a provider's auto-mode flag to an args array, honoring the
 *  user's global autoMode toggle. The renderer's Add Agent flow bakes this same
 *  flag into the command STRING before a GUI hire ever reaches the shared spawn
 *  core (buildSpawnCommand → tokenizeCommand), so `args` for a GUI spawn already
 *  contains it by the time it gets here — this is a no-op for that path. A
 *  main-only spawn (an ephemeral worker, a voice hire) never passes through that
 *  renderer step, so without this it got neither the flag nor any equivalent,
 *  leaving it in an ask-first posture no one could ever answer. */
export function argsWithAutoModeFlag(args: string[], autoMode: boolean, provider: AgentProvider): string[] {
  if (!autoMode) return args;
  const flag = autoModeFlagForProvider(provider);
  if (!flag) return args;
  if (hasAutoModeStance(args, provider)) return args;
  return [...args, ...flag.trim().split(/\s+/)];
}

/** True when argv already states a permission posture for this provider: the
 *  auto flag's leading token, or any of the preset's `autoStanceTokens`. Token
 *  match, not substring. */
export function hasAutoModeStance(args: string[], provider: AgentProvider): boolean {
  const preset = providerPreset(provider);
  const flag = preset.autoModeFlag ?? '';
  const lead = flag.trim().split(/\s+/)[0];
  const stance = new Set([...(lead ? [lead] : []), ...(preset.autoStanceTokens ?? [])]);
  return args.some((a) => stance.has(a));
}

/** Returns any env vars the provider needs for non-interactive / first-run suppression. */
export function nonInteractiveEnvForProvider(provider: AgentProvider): Record<string, string> {
  return providerPreset(provider).nonInteractiveEnv ?? {};
}

/** Returns the command reference groups for the given provider. */
export function commandGroupsForProvider(provider: AgentProvider): CmdGroup[] {
  return providerPreset(provider).commandGroups ?? [];
}

/** Install metadata for a provider's engine CLI, consumed by the missing-CLI
 *  auto-install path. `command` is the (trusted, hardcoded) installer to run when
 *  present; when undefined the caller shows a manual hint and runs NOTHING. `label`
 *  is the friendly CLI name; `docsUrl` is an optional manual-setup link. */
export interface ProviderInstallInfo {
  command?: string;
  /** A node-free installer for this platform, when the vendor ships one. */
  nativeCommand?: string;
  label: string;
  docsUrl?: string;
}

export function installInfoForProvider(
  provider: AgentProvider,
  platform: string = process.platform
): ProviderInstallInfo {
  const p = providerPreset(provider);
  const native = p.nativeInstallCommand;
  return {
    command: p.installCommand,
    nativeCommand: native ? (platform === 'win32' ? native.win32 : native.posix) : undefined,
    label: p.label,
    docsUrl: p.docsUrl
  };
}
