/** The built-in review is useful only when there is a team or unfinished work. */
export function shouldDispatchStandup(
  agents: Record<string, { archived?: boolean; isAssistant?: boolean; isGod?: boolean }>,
  godId: string | null, ledger: unknown
): boolean {
  if (Object.entries(agents).some(([id, a]) => id !== (godId || 'god') && !a.isGod && !a.archived && !a.isAssistant)) return true;
  const tasks = Array.isArray(ledger) ? ledger : ledger && typeof ledger === 'object' ? (ledger as { tasks?: unknown }).tasks : [];
  return Array.isArray(tasks) && tasks.some(t => t && typeof t === 'object' && !['done', 'cancelled', 'canceled', 'archived'].includes(String(t.status)));
}
