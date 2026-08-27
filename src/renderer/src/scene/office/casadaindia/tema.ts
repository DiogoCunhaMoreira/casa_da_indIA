/**
 * casa_da_indIA — o tema da Casa da Índia.
 *
 * Segue o contrato `ThemeConfig` do upstream, com o `BROOKLYN99_THEME` como
 * modelo: nesta fase o mapa e os tilesets do escritório são reaproveitados tal
 * como estão, e só o elenco e a paleta são nossos. A Ribeira das Naus — mapa
 * Tiled próprio — entra numa fase posterior, e entra por esta mesma costura,
 * sem tocar no motor.
 *
 * O elenco é registado no `portraitArt` por `registarElenco()`, chamado uma vez
 * na carga do módulo, para que os retratos existam antes de a cena os pedir.
 */
import { colors } from '@/design/tokens';
import type { CastMember } from '../cast';
import { getCastFrames } from '../cast';
// IMPORT SÓ DE TIPO, de propósito: o `themeRegistry` é quem constrói este tema,
// e um import de valor daqui para lá fecharia um ciclo em que o OFFICE_THEME
// ainda estaria por inicializar. Os tipos desaparecem na compilação.
import type { ThemeConfig } from '../themeRegistry';
import { ELENCO } from './elenco';
import { registarElenco } from './retratos';

// As receitas têm de estar registadas antes do primeiro pedido de retrato.
registarElenco();

/**
 * Cor do brilho de seleção na cena.
 *
 * Normalmente é a cor do corpo, para o realce combinar com o sprite — mas três
 * oficiais vestem tinta (#21201C), e um brilho quase preto não se vê. Nesses
 * casos usa-se o acento, que é justamente a cor pensada para destacar.
 */
function corDeRealce(corCorpo: string, acento: string): string {
  const h = corCorpo.replace('#', '');
  const maiorCanal = Math.max(
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  );
  return maiorCanal < 90 ? acento : corCorpo;
}

export const ELENCO_CASA: CastMember[] = ELENCO.map((p) => ({
  name: p.id,
  displayName: p.nome,
  shirt: corDeRealce(p.corCorpo, p.acento),
  blurb: p.cargo,
}));

export const CASA_BY_NAME: Record<string, CastMember> =
  Object.fromEntries(ELENCO_CASA.map((c) => [c.name, c]));

/** O escrivão é o mais neutro do elenco — serve de predefinição, como o Jim
 *  serve no escritório. */
export const CASA_DEFAULT_CHARACTER = 'caminha';

/**
 * Constrói o tema a partir do tema do escritório.
 *
 * FASE 1: o mapa e os atlas do escritório são reaproveitados sem alterações —
 * só o elenco e a paleta são da Casa da Índia. Recebe o `base` por argumento em
 * vez de o importar, para não fechar o ciclo de importação descrito acima.
 */
export function criarTemaCasaDaIndia(base: ThemeConfig): ThemeConfig {
  return {
    ...base,
    id: 'casadaindia',
    palette: {
      background: base.palette.background,
      // Notas do livro das armadas, nos tons de marca em vez dos do upstream.
      noteColors: {
        todo: colors.brand.pergaminho,
        doing: colors.brand.azulejo2,
        blocked: colors.brand.vermelho,
        done: colors.brand.verde,
      },
    },
    cast: {
      byName: CASA_BY_NAME,
      getFrames: (name: string) => getCastFrames(name),
      defaultCharacter: CASA_DEFAULT_CHARACTER,
      // O Feitor. Fernão Lourenço despachava as armadas sem embarcar em
      // nenhuma — é o orquestrador, e tem de ser ele a ocupar o gabinete.
      godCharacter: 'lourenco',
    },
  };
}
