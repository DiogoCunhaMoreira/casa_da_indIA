import { useTranslation } from 'react-i18next';
import { type SidebarTab } from '@/store/store';
import { type AccentColorName } from '@/design/tokens';
import { Icon, type IconName } from './Icon';

// v0.3.4: the files tab is gone — the per-agent IDE button (header) opens the
// full Monaco editor + file tree, which superseded the read-only browser.
const TABS: { key: SidebarTab; labelKey: string; icon: IconName }[] = [
  { key: 'terminal', labelKey: 'sidebar.terminal', icon: 'terminal' },
  { key: 'git',      labelKey: 'sidebar.git',      icon: 'code' },
  { key: 'messages', labelKey: 'sidebar.messages', icon: 'bell' },
  { key: 'traces',   labelKey: 'sidebar.traces',   icon: 'web' }
];

export interface SidebarTabsProps {
  current: SidebarTab;
  accent: AccentColorName;
  onChange: (tab: SidebarTab) => void;
}

export function SidebarTabs({ current, accent, onChange }: SidebarTabsProps) {
  const { t } = useTranslation();
  return (
    <div style={{
      display: 'flex',
      gap: 4, padding: '6px', flexWrap: 'wrap',
      background: 'var(--cth-cream-200)',
      boxShadow: 'inset 0 -1px 0 var(--cth-ink-100)',
      flexShrink: 0
    }}>
      {TABS.map(tab => {
        const active = current === tab.key;
        return (
          <button
            key={tab.key}
            aria-pressed={active}
            onClick={() => onChange(tab.key)}
            style={{
              flex: '1 0 auto',
              height: 36,
              padding: '0 10px',
              border: 'none',
              cursor: 'pointer',
              background: active ? 'var(--cth-action-soft)' : 'transparent',
              boxShadow: active
                ? 'inset 0 -2px 0 var(--cth-action)'
                : 'inset 0 0 0 0',
              fontFamily: 'var(--cth-font-display)',
              fontSize: 12,
              lineHeight: '18px',
              fontWeight: active ? 600 : 500,
              color: active ? 'var(--cth-action-text)' : 'var(--cth-ink-500)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6
            }}
          >
            <Icon name={tab.icon} /> {t(tab.labelKey)}
          </button>
        );
      })}
    </div>
  );
}
