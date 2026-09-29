/**
 * TRIGGERS — every way the God orchestrator gets woken up without a human typing.
 *
 * This module is the single contract shared by main, preload and renderer. Two
 * trigger types live under one roof:
 *
 *   schedules  — recurring dispatched missions (the pre-existing `ScheduledMission`;
 *                still owned by config.missions, surfaced under Triggers)
 *   context    — auto-compaction / auto-clearing of agent terminal context
 */

/**
 * One half of the context trigger (compact, or clear). Both the *message* sent to
 * the agent and the *conditions* that fire it are user-editable — that is the whole
 * point of surfacing this as a trigger rather than leaving it hardcoded.
 *
 * A run fires for an agent when BOTH conditions hold:
 *   - at least `everyMs` has elapsed since the last run, and
 *   - that agent's context is at least `minContextPct` full.
 * `minContextPct` of 0 disables the pressure gate (time alone fires it).
 */
export interface ContextRule {
  enabled: boolean;
  /** Minimum wall-clock gap between runs. */
  everyMs: number;
  /** Percent (0-100) of the context window that must be used before firing. */
  minContextPct: number;
  /**
   * Separate, lower bar for very large context windows (~1M tokens), where a
   * smaller *fraction* is still an enormous absolute amount of text.
   */
  minContextPctLargeWindow: number;
  /**
   * For `compact`: extra focus text appended to the provider's compaction command,
   * on the providers that read trailing text (codex and opencode ignore it, so it
   * is dropped for them rather than typed as stray input).
   *
   * For `clear`: a literal command that OVERRIDES the provider's own clear verb.
   * That override doubles as the escape hatch for any CLI whose own clear verb
   * we don't know.
   *
   * Empty string = send the provider's bare command.
   */
  message: string;
}

export interface ContextTriggerConfig {
  compact: ContextRule;
  clear: ContextRule;
}

/**
 * The focus text that has always ridden along with `/compact`. Preserved verbatim
 * as the default so upgrading users see no behaviour change beyond the cadence.
 */
export const DEFAULT_COMPACTION_FOCUS =
  'Keep the current task, recent decisions, open questions, and file paths in play. Drop resolved tangents.';

/**
 * Defaults are deliberately TWICE the old cadence and TWICE the previously
 * documented pressure bar.
 *
 * History: `main/config.ts` documented a 30% / 20% context gate that was never
 * actually implemented — every live agent got compacted on every tick, hourly.
 * This makes the gate real and sets it at 2x, so compaction now costs an agent
 * half as many interruptions.
 *
 * Auto-clear ships DISABLED. `/clear` is destructive — it discards context rather
 * than summarising it, and the codebase already gates the manual verb behind a
 * spoken confirm word. Turning it on is an explicit operator choice.
 */
export const DEFAULT_CONTEXT_TRIGGER: ContextTriggerConfig = {
  compact: {
    enabled: true,
    everyMs: 7_200_000, // 2h — was 1h
    minContextPct: 60, // was a documented-but-unenforced 30
    minContextPctLargeWindow: 40, // was a documented-but-unenforced 20
    message: DEFAULT_COMPACTION_FOCUS
  },
  clear: {
    enabled: false,
    everyMs: 7_200_000,
    minContextPct: 90,
    minContextPctLargeWindow: 80,
    message: ''
  }
};
