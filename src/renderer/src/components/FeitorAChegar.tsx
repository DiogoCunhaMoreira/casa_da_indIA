import { godCharacter } from '@/scene/office/themeRegistry';
import { SpritePortrait } from './SpritePortrait';
import { useTranslation } from 'react-i18next';
import { PixelPanel } from '@/components/PixelPanel';
import { useResolvedGodName } from '@/hooks/useResolvedGodName';

/**
 * O que se vê no chão vazio enquanto o Feitor está a chegar ao arranque.
 * Substitui o convite a "adicionar agente", para quem volta não apanhar o chão
 * às moscas antes de deus ter arrancado.
 *
 * Aparece enquanto `agentCount === 0` — antes de a store ter o agente vivo de
 * deus, e portanto antes de existir um `agent.name` para ler seja onde for —
 * por isso lê o nome persistido directamente, como faz o efeito de spawn no
 * useHive.ts, em vez de assumir o nome por omissão.
 */
export function FeitorAChegar() {
  const { t } = useTranslation();
  const godName = useResolvedGodName();
  return (
    <div style={{
      position: 'absolute', inset: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      pointerEvents: 'none'
    }}>
      <div style={{ pointerEvents: 'auto', width: 360 }}>
        <PixelPanel variant="dialog" title={t('office.booting.title')} noPadding>
          <div style={{
            padding: 20,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14
          }}>
            <SpritePortrait character={godCharacter()} scale={4} />
            <p style={{
              margin: 0, fontSize: 13, lineHeight: '20px', textAlign: 'center',
              color: 'var(--cth-ink-700)'
            }}>
              {t('office.booting.body', { godName })}
            </p>
          </div>
        </PixelPanel>
      </div>
    </div>
  );
}
