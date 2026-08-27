/**
 * casa_da_indIA — o chão da Casa da Índia, e o único que há.
 *
 * A Ribeira das Naus (`ribeira.tmj`) desenhada com o atlas `casadaindia.png`,
 * mais o `interiors.png` por causa de seis tiles: a palmeira e a planta de
 * vaso. A ordem desta lista de atlas tem de bater certo com a ordem dos
 * `tilesets` do mapa — o carregador casa-os pelo índice.
 *
 * As coordenadas todas — lugares, adereços clicáveis, adega, recados — vivem
 * no `planta.ts`, que é gerado pelo mesmo script que desenha o mapa. Aqui não
 * se escreve nenhum número de tile à mão, de propósito.
 *
 * O elenco é registado no `portraitArt` por `registarElenco()`, chamado uma vez
 * na carga do módulo, para que os retratos existam antes de a cena os pedir.
 */
import { colors } from '@/design/tokens';
import type { CastMember } from '../cast';
import { getCastFrames } from '../cast';
// IMPORT SÓ DE TIPO, de propósito: é o `themeRegistry` que reexporta este tema,
// e um import de valor daqui para lá fecharia o ciclo. Os tipos desaparecem na
// compilação, por isso este não fecha nada.
import type { ThemeConfig } from '../themeRegistry';
import casadaindiaUrl from '@/assets/tilesets/casadaindia.png?url';
import interiorsUrl from '@/assets/tilesets/interiors.png?url';
// .tmj é Tiled JSON; entra como texto em bruto e é o carregador que o parseia.
import ribeiraMapRaw from '@/assets/maps/ribeira.tmj?raw';
import { ELENCO } from './elenco';
import { ANCORAS, BANCAS_CAFE, CAFE, NOMES_LUGARES, NOMES_LUGARES_CAFE, RECADOS } from './planta';
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
 * Os dois atlas, por esta ordem.
 *
 * O `firstgid` 2449 do nosso é o tile logo a seguir ao último do
 * `interiors.png` (que ocupa 1025–2448). O `ribeira.tmj` foi desenhado com
 * estes números — se algum mudar aqui, o mapa passa a apontar para os tiles
 * errados, e em silêncio.
 */
const ATLAS = [
  {
    url: interiorsUrl,
    firstgid: 1025,
    image: 'interiors',
    imagewidth: 256,
    imageheight: 1424,
    tilewidth: 16,
    tileheight: 16,
    columns: 16,
    tilecount: 1424,
  },
  {
    url: casadaindiaUrl,
    firstgid: 2449,
    image: 'casadaindia',
    imagewidth: 256,
    imageheight: 256,
    tilewidth: 16,
    tileheight: 16,
    columns: 16,
    tilecount: 256,
  },
];

/** O chão da Casa da Índia. */
export const TEMA_CASA_DA_INDIA: ThemeConfig = {
  id: 'casadaindia',
  mapRaw: ribeiraMapRaw,
  tilesets: ATLAS,
  primarySeatNames: NOMES_LUGARES,
  cafeSeatNames: NOMES_LUGARES_CAFE,
  cafeStands: BANCAS_CAFE,
  coffee: CAFE,
  anchors: ANCORAS,
  errandSpots: RECADOS,
  // Em 1500 não há ecrãs. O `DeskScreen` só acende quando encontra este gid por
  // cima de um lugar, e -1 não é um gid — nenhuma escrivaninha acende, que é o
  // que se quer. Zero não servia: casaria com as células vazias.
  monitor: { offTopLeftGid: -1, onGids: [] },
  palette: {
    background: colors.ink[900],
    // As notas do livro das armadas, nos tons da casa.
    noteColors: {
      todo: colors.brand.pergaminho,
      doing: colors.brand.azulejo2,
      blocked: colors.brand.vermelho,
      done: colors.brand.verde,
    },
  },
  cast: {
    roster: ELENCO_CASA,
    byName: CASA_BY_NAME,
    getFrames: (name: string) => getCastFrames(name),
    defaultCharacter: CASA_DEFAULT_CHARACTER,
    // O Feitor. Fernão Lourenço despachava as armadas sem embarcar em nenhuma —
    // é o orquestrador, e tem de ser ele a ocupar o gabinete.
    godCharacter: 'lourenco',
  },
};
