/** Public visual data only: never send prompts, paths, credentials or PTY output. */
export const WORLD_VERSION = 1 as const;
export const WORLD_ORIGIN = 'casa-world://app';
export const WORLD_ROOMS = ['casa', 'gabinete', 'escrivaes', 'conselho', 'cartografia', 'tesouraria', 'refeitorio'] as const;
export type WorldRoom = typeof WORLD_ROOMS[number];
export interface WorldAgent {
  id: string; name: string; character: string; status: string; seat: number | null;
  station?: 'shelf' | 'terminal' | 'web' | 'board' | 'mailbox' | 'mcp' | 'desk';
  selected: boolean; isGod: boolean;
  appearance?: { skin: string; hair: string; cloth: string; beard: string; hat: string; cape: string; capeColor: string };
}
export type WorldPayload = { type: 'hello' } |
  { type: 'snapshot'; room: WorldRoom; visible: boolean; agents: WorldAgent[]; tasks: { id: string; status: string; assignee?: string }[]; humanQuestions: number } |
  { type: 'message'; id: string; from: string; targets: string[]; act: string } |
  { type: 'control'; action: 'zoom_in' | 'zoom_out' | 'walls' };
export type WorldRequest = { version: 1 } & (
  { type: 'ready' } | { type: 'openPanel'; panel: 'tasks' | 'human' } | { type: 'select' | 'openTerminal'; id: string } |
  { type: 'error'; message: string } | { type: 'view'; room: WorldRoom }
);
export function isWorldRequest(value: unknown): value is WorldRequest {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  if (v.version !== WORLD_VERSION) return false;
  if (v.type === 'ready') return true;
  if (v.type === 'openPanel') return v.panel === 'tasks' || v.panel === 'human';
  if (v.type === 'select' || v.type === 'openTerminal') return typeof v.id === 'string' && v.id.length > 0 && v.id.length <= 256;
  if (v.type === 'error') return typeof v.message === 'string' && v.message.length <= 1000;
  return v.type === 'view' && WORLD_ROOMS.includes(v.room as WorldRoom);
}
/** Retain occupied seats across reordering and release only removed agents. */
export function allocateWorldSeats(agents: { id: string; isGod?: boolean }[], previous: Record<string, number>): Record<string, number> {
  const next: Record<string, number> = Object.create(null);
  const used = new Set<number>();
  const ordered = [...agents].sort((a, b) => Number(!!b.isGod) - Number(!!a.isGod));
  for (const a of ordered) {
    const seat = previous[a.id];
    if (Number.isInteger(seat) && seat >= 0 && seat < 22 && !used.has(seat) && (a.isGod ? seat === 0 : seat !== 0)) {
      next[a.id] = seat; used.add(seat);
    }
  }
  for (const a of ordered) {
    if (next[a.id] !== undefined) continue;
    const candidates = a.isGod ? [0] : Array.from({ length: 21 }, (_, i) => i + 1);
    const seat = candidates.find(i => !used.has(i));
    if (seat !== undefined) { next[a.id] = seat; used.add(seat); }
  }
  return next;
}
