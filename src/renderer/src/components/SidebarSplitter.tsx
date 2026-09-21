import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { clampSidebarWidth, SIDEBAR_DEFAULT, SPLITTER_WIDTH } from './sidebarLayout';

export interface SidebarSplitterProps {
  width: number;
  onChange: (px: number) => void;
  min: number;
  max: number;
}

/** Capture the pointer above the embedded world for the entire drag. */
export function SidebarSplitter({ width, onChange, min, max }: SidebarSplitterProps) {
  const { t } = useTranslation();
  const handleRef = useRef<HTMLDivElement>(null);
  const startRef = useRef<{ clientX: number; width: number; pointerId: number } | null>(null);
  const [active, setActive] = useState(false);
  const finish = useCallback(() => {
    const start = startRef.current;
    startRef.current = null;
    if (start && handleRef.current?.hasPointerCapture(start.pointerId)) {
      handleRef.current.releasePointerCapture(start.pointerId);
    }
    setActive(false);
  }, []);

  useEffect(() => {
    if (!active) return;
    const previousCursor = document.body.style.cursor;
    const previousSelection = document.body.style.userSelect;
    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none';
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); finish(); }
    };
    window.addEventListener('blur', finish);
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.cursor = previousCursor;
      document.body.style.userSelect = previousSelection;
      window.removeEventListener('blur', finish);
      window.removeEventListener('keydown', onKey);
      startRef.current = null;
    };
  }, [active, finish]);

  const change = (value: number) => onChange(clampSidebarWidth(value, min, max));
  return <>
    {active && <div aria-hidden="true" style={{
      position: 'fixed', inset: 0, zIndex: 9999, cursor: 'ew-resize', touchAction: 'none'
    }} />}
    <div
      ref={handleRef}
      role="separator"
      tabIndex={0}
      aria-orientation="vertical"
      aria-label={t('sidebar.resizeLabel')}
      aria-controls="agent-detail-panel"
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={width}
      onPointerDown={(event) => {
        if (event.button !== 0 || startRef.current) return;
        event.preventDefault();
        event.currentTarget.focus();
        event.currentTarget.setPointerCapture(event.pointerId);
        startRef.current = { clientX: event.clientX, width, pointerId: event.pointerId };
        setActive(true);
      }}
      onPointerMove={(event) => {
        const start = startRef.current;
        if (!start || start.pointerId !== event.pointerId) return;
        change(start.width + start.clientX - event.clientX);
      }}
      onPointerUp={finish}
      onPointerCancel={finish}
      onLostPointerCapture={finish}
      onDoubleClick={() => change(SIDEBAR_DEFAULT)}
      onKeyDown={(event) => {
        const step = event.shiftKey ? 50 : 10;
        const next = event.key === 'ArrowLeft' ? width + step
          : event.key === 'ArrowRight' ? width - step
          : event.key === 'Home' ? min : event.key === 'End' ? max
          : event.key === 'Enter' ? SIDEBAR_DEFAULT : null;
        if (next !== null) { event.preventDefault(); change(next); }
      }}
      title={t('sidebar.resizeHint')}
      style={{
        width: SPLITTER_WIDTH,
        cursor: 'ew-resize', touchAction: 'none', userSelect: 'none',
        flexShrink: 0, position: 'relative', zIndex: active ? 10000 : undefined,
        background: active ? 'var(--cth-cream-300)' : 'transparent'
      }}
    >
      {/* The visible 2px stripe with hash marks in the middle */}
      <div style={{
        position: 'absolute',
        top: 0, bottom: 0, left: 4,
        width: 2,
        background: active ? 'var(--cth-ink-900)' : 'var(--cth-ink-300)'
      }} />
      <div style={{
        position: 'absolute',
        top: '50%', left: 2, transform: 'translateY(-50%)',
        width: 6, height: 24,
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
      }}>
        <span style={{ height: 2, background: 'var(--cth-ink-900)' }} />
        <span style={{ height: 2, background: 'var(--cth-ink-900)' }} />
        <span style={{ height: 2, background: 'var(--cth-ink-900)' }} />
      </div>
    </div>
  </>;
}
