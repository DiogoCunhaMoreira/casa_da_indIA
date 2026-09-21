import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PixelButton } from './PixelButton';
import brandLogo from '@brand/logo.png?url';

const REPOSITORY = 'https://github.com/DiogoCunhaMoreira/casa_da_indIA';

/** Product identity and help. Update controls live in UpdatesSection below. */
export function SettingsHeroCard() {
  const { t } = useTranslation();
  const [version, setVersion] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    void window.cth.appInfo().then(info => { if (alive) setVersion(info.version); }).catch(() => {});
    void window.cth.heroPayload().then(result => { if (alive) setNotice(result.hero.notice ?? null); }).catch(() => {});
    return () => { alive = false; };
  }, []);
  return <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <img src={brandLogo} alt="" width={44} height={44} style={{ borderRadius: 8 }} />
      <div>
        <h2 style={{ margin: 0, fontSize: 20, lineHeight: '28px' }}>Casa da Índia</h2>
        <span style={{ color: 'var(--cth-ink-500)', fontSize: 13 }}>{version && `v${version} · `}{t('settingsHero.local')}</span>
      </div>
    </div>
    <p style={{ margin: 0, color: 'var(--cth-ink-700)', lineHeight: '22px' }}>{t('settingsHero.localDescription')}</p>
    {notice && <p role="status" style={{ margin: 0, padding: 12, borderRadius: 6, background: 'var(--cth-lemon-light)' }}>{notice}</p>}
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      <PixelButton variant="secondary" onClick={() => window.dispatchEvent(new CustomEvent('cth:show-release-notes'))}>{t('settingsHero.whatsNew')}</PixelButton>
      <PixelButton variant="ghost" onClick={() => void window.cth.openExternal(REPOSITORY)}>{t('settingsHero.repository')}</PixelButton>
      <PixelButton variant="ghost" onClick={() => void window.cth.openExternal(`${REPOSITORY}/issues/new`)}>{t('settingsHero.reportProblem')}</PixelButton>
    </div>
    <small style={{ color: 'var(--cth-ink-500)', lineHeight: '20px' }}>{t('settingsHero.credits')}</small>
  </section>;
}
