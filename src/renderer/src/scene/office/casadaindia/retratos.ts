/**
 * casa_da_indIA — adaptador do elenco para as receitas do portraitArt.
 *
 * Converte `Personagem` (dados históricos, cores em hexadecimal, peças em
 * português) para `Recipe` (o tipo real do motor de desenho, cores em tuplos
 * RGB, peças nos nomes dos slots). É o único ficheiro que muda se o upstream
 * mexer nos nomes dos campos do portraitArt.
 *
 * Registamos as receitas com `registerRecipes` em vez de as escrever dentro da
 * tabela RECIPES do upstream — assim o `portraitArt.ts` continua a ser um
 * ficheiro que podemos sincronizar com o upstream sem conflitos.
 */
import {
  registerRecipes,
  type Recipe, type Hat, type Cloak, type Cloth, type Facial,
  type HairStyle, type RGB, type Brow, type Mouth,
} from '../portraitArt';
import { ELENCO, PELE, type Personagem, type Barba, type Cabeca, type Capa, type Corpo } from './elenco';

/** `#RRGGBB` → `[r, g, b]`. (Não confundir com `hexToNumber` do cast.ts, que
 *  produz um inteiro 0xRRGGBB para os tints do Pixi.) */
export function hexToRgb(hex: string): RGB {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

/** Tom de pele → chave da tabela SKIN. `curtida` usa o quinto tom `weathered`
 *  acrescentado ao portraitArt para quem passou anos no mar. */
const PELE_PARA_SKIN: Record<string, string> = {
  [PELE.clara]: 'light',
  [PELE.media]: 'tan',
  [PELE.morena]: 'brown',
  [PELE.escura]: 'dark',
  [PELE.curtida]: 'weathered',
};

/** Barba → slot `facial`. `curta` usa o goatee (barbicha compacta), que a 18px
 *  se distingue mesmo da barba cheia; `cheia`, `bifurcada` e `longa` usam os
 *  três estilos de barba inteira acrescentados ao motor. */
const BARBA_PARA_FACIAL: Record<Barba, Facial | undefined> = {
  nenhuma: undefined,
  bigode: 'mustache',
  curta: 'goatee',
  cheia: 'beard',
  bifurcada: 'forked',
  longa: 'long',
};

const CABECA_PARA_HAT: Record<Cabeca, Hat> = {
  nenhuma: 'none',
  chaperon: 'chaperon',
  barrete: 'flatcap',
  coifa: 'coif',
  elmo: 'helmet',
  gorro: 'scholarcap',
  toucado: 'headdress',
  turbante: 'turban',
  chapeuAba: 'widebrim',
};

const CAPA_PARA_CLOAK: Record<Capa, Cloak> = {
  nenhuma: 'none',
  curta: 'short',
  longa: 'long',
  esvoacante: 'flowing',
};

/** Corpo → `cloth`. Reutilizamos os cortes existentes do upstream sempre que a
 *  silhueta aguenta; só o peitoral, a gown e o robe justificaram peças novas. */
const CORPO_PARA_CLOTH: Record<Corpo, Cloth> = {
  gibao: 'dressshirt',
  jaqueta: 'sweater',
  tunica: 'sweater',
  gown: 'gown',
  peitoral: 'breastplate',
  robe: 'robe',
};

/** Cabelo, sobrancelha e boca são decisões de desenho, não factos históricos —
 *  por isso vivem aqui e não no `elenco.ts`. Só se indica quem foge do normal. */
const ESTILO: Record<string, { hair?: HairStyle; brow?: Brow; mouth?: Mouth; heavy?: boolean }> = {
  lourenco:    { hair: 'styleRecede', brow: 'flat', mouth: 'neutral' },
  gama:        { hair: 'styleShort', brow: 'angry', mouth: 'neutral' },
  cabral:      { hair: 'styleFloppy', brow: 'raised', mouth: 'smile' },
  // Cabelo empurrado para um lado — está sempre com vento contra.
  dias:        { hair: 'styleMessy', brow: 'angry', mouth: 'frown' },
  covilha:     { hair: 'styleShort', brow: 'soft', mouth: 'neutral' },
  caminha:     { hair: 'styleShort', brow: 'soft', mouth: 'smile' },
  pacheco:     { hair: 'styleShort', brow: 'flat', mouth: 'neutral', heavy: true },
  magalhaes:   { hair: 'styleShort', brow: 'angry', mouth: 'neutral' },
  pires:       { hair: 'styleFloppy', brow: 'raised', mouth: 'grin' },
  barbosa:     { hair: 'styleShort', brow: 'soft', mouth: 'smile' },
  albuquerque: { hair: 'styleRecede', brow: 'angry', mouth: 'frown' },
  almeida:     { hair: 'styleShort', brow: 'flat', mouth: 'neutral' },
  rodrigues:   { hair: 'styleShort', brow: 'flat', mouth: 'smile' },
  faleiro:     { hair: 'styleRecede', brow: 'soft', mouth: 'neutral' },
  leonor:      { hair: 'styleFrame', brow: 'soft', mouth: 'neutral' },
};

/** Uma personagem → a receita que o motor de desenho consome. */
export function paraReceita(p: Personagem): Recipe {
  const e = ESTILO[p.id] ?? {};
  const acento = hexToRgb(p.acento);
  const cloth = CORPO_PARA_CLOTH[p.corpo];
  return {
    skin: PELE_PARA_SKIN[p.pele] ?? 'tan',
    hairc: hexToRgb(p.cabelo),
    hair: e.hair ?? 'styleShort',
    cloth,
    c1: hexToRgb(p.corCorpo),
    // A gown lê a gola em c2 e o robe lê a debrua — nos dois casos é o acento.
    c2: cloth === 'gown' || cloth === 'robe' ? acento : undefined,
    hat: CABECA_PARA_HAT[p.cabeca],
    hatc: hexToRgb(p.corCorpo),
    cloak: CAPA_PARA_CLOAK[p.capa],
    cloakc: hexToRgb(p.corCapa),
    facial: BARBA_PARA_FACIAL[p.barba],
    patch: p.pala,
    brow: e.brow,
    mouth: e.mouth,
    heavy: e.heavy,
    // Leonor é a única com olhos marcados, como no resto do elenco do upstream.
    lashes: p.id === 'leonor',
  };
}

/** id → receita, para todo o elenco. */
export const RECEITAS: Record<string, Recipe> = Object.fromEntries(
  ELENCO.map((p) => [p.id, paraReceita(p)]),
);

/** Regista o elenco no motor de desenho. Chamado uma vez, na carga do tema. */
export function registarElenco(): void {
  registerRecipes(RECEITAS);
}
