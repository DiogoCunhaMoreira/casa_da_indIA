// A conversa do refeitório — a Casa da Índia à hora da merenda.
//
// O elenco são quinze oficiais documentados da casa que armava as naus (ver
// `casadaindia/elenco.ts`), e a pausa é a desculpa para cada um dizer uma coisa
// que só ele diria. Há duas espécies de fala:
//   • solta — uma tirada por cima de um agente sozinho num sítio da pausa
//   • a dois — uma troca de deixas entre dois que calharam à mesma mesa
//
// São curtas porque têm de caber no balão de pensamento (≈MAX_WIDTH); as
// compridas são cortadas. As chaves são os `id` do elenco; quem não tiver falas
// próprias cai no bolo comum, para o refeitório nunca ficar mudo.
//
// Trata-se toda a gente por tu. Ninguém aqui diz "você".

import type { CharacterName } from './cast';

/** Onde é que o agente está parado — escolhe o bolo de falas conforme o sítio. */
export type BreakSpot = 'coffee' | 'vending' | 'snack' | 'table';

const pick = <T,>(arr: readonly T[], seed: number): T =>
  arr[((seed % arr.length) + arr.length) % arr.length];

// ─── falas soltas, por sítio ─────────────────────────────────────────────────

/** O barril das canecas. */
const ADEGA: readonly string[] = [
  'água da Ribeira outra vez não',
  'quem é que não lavou a caneca?',
  'este vinho veio na nau ou veio do Tejo?',
  'a primeira caneca do dia. e a quinta.',
  'aguado. está aguado.',
  'juro que esta caneca era minha',
];

/** Os barris de espicha. */
const BARRIS: readonly string[] = [
  'está a espicha entupida',
  'é bater com jeito. com respeito.',
  'este barril veio de Cochim',
  'cheira a canela. cheira a tudo.',
  'trouxe copo. trouxe copo?',
  'este é o bom. o outro é para as visitas.',
];

/** Qualquer coisa de comer. */
const MERENDA: readonly string[] = [
  'pão e queijo. como ontem.',
  'quem acabou os figos??',
  'um bocadinho só',
  'isto é de todos, não é? pois.',
  'segundo almoço',
  'trouxeram marmelada da boa',
];

/** À mesa. */
const MESA: readonly string[] = [
  'dia grande. muita audiência.',
  'só mais cinco minutos',
  'já leste o rol de hoje?',
  'a fingir que releio as minhas notas',
  'precisava mesmo desta pausa',
  'não digas ao Feitor que estou aqui',
];

const SPOT_POOL: Record<BreakSpot, readonly string[]> = {
  coffee: ADEGA, vending: BARRIS, snack: MERENDA, table: MESA,
};

// ─── o tempero de cada um — passa à frente do bolo do sítio ──────────────────

const POR_PERSONAGEM: Partial<Record<string, readonly string[]>> = {
  lourenco: [
    'quem assina isto sou eu',
    'a armada parte com maré, não com vontade',
    'nunca embarquei. e despacho-as todas.',
    'tragam-me o livro. o outro livro.',
  ],
  gama: [
    'da última vez trouxe pimenta a dobrar',
    'o caminho existe. eu fui lá.',
    'em Calecute isto não se servia assim',
    'perguntem ao piloto, não a mim',
  ],
  cabral: [
    'ia para um lado, dei noutro',
    'e afinal correu bem',
    'a terra estava lá. eu vi.',
    'ninguém me tira isso',
  ],
  dias: [
    'aquilo lá em baixo não é tormenta, é vontade',
    'dobrei-o. dobrei-o eu.',
    'cheira a levante',
    'não confies no céu limpo',
  ],
  covilha: [
    'falem baixo',
    'já bebi coisas piores, e por bons motivos',
    'estive fora dezoito anos. dezoito.',
    'não me chamem pelo nome aqui',
  ],
  caminha: [
    'isso escreve-se com dois erres',
    'ponho no rol e assinas por baixo',
    'a carta seguia hoje, se me deixassem',
    'tenho tudo anotado. tudo.',
  ],
  pacheco: [
    'em Cochim aguentámos com menos do que isto',
    'a defesa faz-se antes, não depois',
    'contei os barris. faltam dois.',
    'eu fico de vigia. bebam.',
  ],
  magalhaes: [
    'em Sevilha davam-me três armadas',
    'aqui ninguém me ouve',
    'a especiaria vem por oeste, digo eu',
    'ainda me hão-de dar razão',
  ],
  pires: [
    'em Malaca a pimenta não sabe assim',
    'isto era boticário que eu era, antes',
    'anotei setenta portos. setenta.',
    'esta erva serve para outra coisa',
  ],
  barbosa: [
    'em malaiala isso diz-se de outra maneira',
    'traduzi mal de propósito, uma vez',
    'ouve-se muito, à mesa',
    'não é a mesma palavra. nunca é.',
  ],
  albuquerque: [
    'toma-se, e depois discute-se',
    'Goa não se pediu, Goa tomou-se',
    'a barba? a barba fica.',
    'quem hesita, perde a maré',
  ],
  almeida: [
    'de pé. sempre de pé.',
    'primeiro o mar, depois a terra',
    'vice-rei fui eu, o primeiro',
    'não preciso de aço para mandar',
  ],
  rodrigues: [
    'a carta está errada a norte de Cananor',
    'desenho-te isso num instante',
    'as mangas arregaçadas é para trabalhar',
    'sem roteiro, é só ir dar à costa',
  ],
  faleiro: [
    'as longitudes não batem certo',
    'já refiz a conta três vezes',
    'os números não mentem, os pilotos mentem',
    'fiquei em terra. e ainda bem.',
  ],
  leonor: [
    'isso passa por mim primeiro',
    'a Misericórdia é minha, sim',
    'sentem-se. há tempo.',
    'não se decide de pé',
  ],
};

/** Uma fala solta na pausa. O tempero da personagem sai ~60% das vezes; o resto
 *  é uma fala do sítio onde ela está parada. O `seed` mantém isto determinístico
 *  por sítio de chamada (evita o Math.random, que o código sob CSP prefere não
 *  ver). */
export function pickSoloLine(character: CharacterName, spot: BreakSpot, seed: number): string {
  const tempero = POR_PERSONAGEM[character];
  if (tempero && seed % 5 < 3) return pick(tempero, Math.floor(seed / 5));
  return pick(SPOT_POOL[spot], seed);
}

// ─── trocas a dois (dois agentes à mesma mesa) ───────────────────────────────
//
// Cada troca é uma lista de deixas que ALTERNAM entre os dois: deixa[0] = quem
// se sentou primeiro, deixa[1] = o companheiro de mesa, deixa[2] = o primeiro
// outra vez, e assim por diante. O realizador toca-as uma de cada vez.

type Exchange = readonly string[];

/** Conversa comum — serve entre quaisquer dois, que são todos da casa. */
const TROCAS: readonly Exchange[] = [
  ['a maré é às quatro.', 'a maré é sempre às quatro.', 'e nós sempre atrasados.'],
  ['quanto é que veio de pimenta?', 'menos do que diz o rol.', 'pois. sempre.'],
  ['viste o que o Tesoureiro pesou hoje?', 'vi. e calei-me.', 'fizeste bem.'],
  ['isto é canela ou é serradura?', 'depende de quem a vendeu.', 'ah.'],
  ['a nau entrou de noite.', 'entrou. e ninguém a viu.', 'alguém a viu.'],
  ['dizem que se perdeu uma armada.', 'dizem sempre.', 'desta vez é verdade.'],
  ['tens o inventário do armazém?', 'tenho. e não bate.', 'nunca bate.'],
  ['quantos partiram este ano?', 'dezassete.', 'e voltaram?', '...come o teu pão.'],
  ['há quanto tempo estás na casa?', 'demasiado.', 'isso não é um número.', 'é o suficiente.'],
  ['sabes escrever o meu nome?', 'sei escrever o de toda a gente.', 'esse é o problema.'],
  ['o Feitor perguntou por ti.', 'eu não estou.', 'já lhe disse que estavas.', 'obrigado.'],
  ['isto é vinho de bordo.', 'como é que sabes?', 'sabe a alcatrão.', '...é vinho de bordo.'],
  ['dizem que o mar é o mesmo em toda a parte.', 'quem diz isso nunca lá foi.', 'exacto.'],
  ['assinaste o rol?', 'assinei.', 'leste-o?', '...assinei.'],
  ['guardei-te lugar.', 'não precisavas.', 'não guardei nada. senta-te.'],
  ['está frio hoje.', 'está sempre frio nesta sala.', 'é da pedra.', 'é da companhia.'],
  ['aquilo no armazém é meu.', 'aquilo no armazém é do rei.', '...era só para saber.'],
  ['que dia é hoje?', 'quinta.', 'do quê?', 'não te sei dizer.'],
  ['ouvi dizer que vais partir.', 'ouviste mal.', 'ouvi bem.', '...ouviste.'],
  ['a ampulheta parou.', 'não parou, é a areia.', 'está parada há uma hora.', 'então parou.'],
];

// Estas abrem pela personagem que se sentou primeiro — cada um tem direito ao
// número dele.
const TROCAS_POR_PERSONAGEM: Partial<Record<string, Exchange>> = {
  lourenco:    ['isto passa por mim.', 'tudo passa por ti.', 'e ainda bem.'],
  gama:        ['eu fui lá.', 'já sabemos que foste.', '...eu fui lá.'],
  cabral:      ['enganei-me no rumo.', 'e descobriste uma terra.', 'foi de propósito.', 'não foi nada.'],
  dias:        ['vem aí tormenta.', 'está sol.', '...vem aí tormenta.'],
  covilha:     ['não me viste.', 'estou a olhar para ti.', 'não me viste.'],
  caminha:     ['posso pôr isso por escrito?', 'não.', '...já pus.'],
  pacheco:     ['contei os barris.', 'ninguém te pediu.', 'faltam dois.'],
  magalhaes:   ['em Castela isto era diferente.', 'então vai para Castela.', '...pode ser que vá.'],
  pires:       ['isto tem cravo a mais.', 'tem cravo a menos.', 'não. tem a mais.'],
  barbosa:     ['essa palavra não quer dizer isso.', 'quer, sim.', 'em que língua?'],
  albuquerque: ['tomava aquilo antes do jantar.', 'tomavas o quê?', 'aquilo.'],
  almeida:     ['senta-te direito.', 'estou na pausa.', 'senta-te direito na pausa.'],
  rodrigues:   ['a tua carta está errada.', 'não é minha.', 'está errada na mesma.'],
  faleiro:     ['refiz a conta.', 'e?', 'refiz outra vez.'],
  leonor:      ['há tempo.', 'não há.', 'há sempre tempo. senta-te.'],
};

/** Uma troca de deixas para dois agentes à mesma mesa. As deixas alternam:
 *  índice 0 = o `speaker`, 1 = o companheiro, 2 = o `speaker`, … */
export function pickExchange(speaker: CharacterName, seed: number): Exchange {
  const propria = TROCAS_POR_PERSONAGEM[speaker];
  if (propria && seed % 4 === 0) return propria;
  return pick(TROCAS, seed);
}
