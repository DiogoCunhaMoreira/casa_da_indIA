import { DEFAULT_CONTEXT_TRIGGER, type ContextRule, type ContextTriggerConfig } from '@shared/triggers';

/**
 * TRIGGER IPC — the renderer's side of the trigger config surface.
 *
 * Thin on purpose: `window.cth` already types every call (preload bridges
 * `triggers:*`), so this module exists only for what a raw invoke does not do —
 * deep-fill a half-written context rule before it reaches a number input.
 */

/* ───────────────────────────── context trigger ───────────────────────────── */

function fillRule(partial: Partial<ContextRule> | undefined, fallback: ContextRule): ContextRule {
  return {
    enabled: partial?.enabled ?? fallback.enabled,
    everyMs: typeof partial?.everyMs === 'number' ? partial.everyMs : fallback.everyMs,
    minContextPct: typeof partial?.minContextPct === 'number' ? partial.minContextPct : fallback.minContextPct,
    minContextPctLargeWindow: typeof partial?.minContextPctLargeWindow === 'number'
      ? partial.minContextPctLargeWindow
      : fallback.minContextPctLargeWindow,
    message: typeof partial?.message === 'string' ? partial.message : fallback.message
  };
}

/** Read the context trigger, deep-filled. A half-written sub-object must never
 *  reach the number inputs as `undefined` — React would flip them uncontrolled. */
export async function getContextTrigger(): Promise<ContextTriggerConfig> {
  try {
    const cfg: Partial<ContextTriggerConfig> | null = await window.cth.getContextTrigger();
    return {
      compact: fillRule(cfg?.compact, DEFAULT_CONTEXT_TRIGGER.compact),
      clear: fillRule(cfg?.clear, DEFAULT_CONTEXT_TRIGGER.clear)
    };
  } catch {
    return DEFAULT_CONTEXT_TRIGGER;
  }
}

/** Fire and forget — the controls have already moved, which is the house
 *  pattern for config writes across the Command Center. */
export function setContextTrigger(cfg: ContextTriggerConfig): void {
  void window.cth.setContextTrigger(cfg).catch(() => { /* optimistic */ });
}
