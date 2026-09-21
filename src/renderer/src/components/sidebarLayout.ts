export const SIDEBAR_DEFAULT = 420;
export const SPLITTER_WIDTH = 10;

/** Width is the content box, excluding the parent padding. */
export function sidebarLimits(contentWidth: number) {
  const available = Math.max(0, contentWidth - SPLITTER_WIDTH);
  const min = Math.min(320, available);
  const max = Math.min(1200, Math.max(min, available - 360));
  return { min, max };
}

export function clampSidebarWidth(width: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Math.round(Number.isFinite(width) ? width : SIDEBAR_DEFAULT)));
}
