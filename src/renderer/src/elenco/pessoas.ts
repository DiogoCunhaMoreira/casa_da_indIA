/**
 * casa_da_indIA — o elenco da Casa da Índia
 *
 * Ficheiro de DADOS. Descreve cada oficial por cores e peças de vestuário; o
 * adaptador em `retratos.ts` converte para as receitas do `portraitArt.ts`.
 *
 * ── Rigor histórico ────────────────────────────────────────────────────────
 * Janela: Lisboa, c. 1500–1516, no reinado de D. Manuel I. A Casa da Índia foi
 * fundada por volta de 1500–1503 no Paço da Ribeira. Todas as figuras abaixo
 * estavam vivas e ativas nessa janela.
 *
 * O Infante D. Henrique NÃO consta, e não pode constar: morreu em 1460, quatro
 * décadas antes de a Casa da Índia existir. Pela mesma razão saíram Gil Eanes,
 * Zarco e Diogo Cão (cedo demais), Abraão Zacuto (deixou Portugal em 1497),
 * Camões (n. 1524) e Fernão Mendes Pinto (embarcou em 1537) — tarde demais.
 *
 * Duas ressalvas assumidas, ditas aqui e no README em vez de escondidas:
 *   1. D. Leonor de Viseu era patrona régia, não oficial da Casa.
 *   2. Gama, Cabral, Albuquerque, Almeida, Pires e Barbosa estavam no Índico e
 *      não em Lisboa — que é precisamente o que os torna bons agentes remotos.
 */

// ── Paleta ────────────────────────────────────────────────────────────────
// Tons de pele do elenco. `curtida` é queimada de sol e sal — os que navegam
// mesmo — e mapeia para o tom `weathered` acrescentado ao portraitArt.
export const PELE = {
  clara:   '#F0C8A0',
  media:   '#D9A273',
  morena:  '#B67B4E',
  escura:  '#8A5433',
  curtida: '#C08B5C',
} as const;

export const CABELO = {
  negro:    '#1C1A19',
  castanho: '#4A3121',
  ruivo:    '#8C3B1B',
  grisalho: '#7A7A72',
  branco:   '#D8D4C8',
} as const;

// Panos, derivados dos tokens de marca.
export const PANO = {
  azulejo:    '#1F4E9C',
  azulClaro:  '#7FA9D9',
  pergaminho: '#F2E6CE',
  ouro:       '#C8961E',
  verde:      '#046A38',
  vermelho:   '#A4161A',
  tinta:      '#21201C',
  couro:      '#6B4A2B',
  linho:      '#CFC1A3',
  aco:        '#9AA3AB',
  seda:       '#B03A78',
} as const;

// ── Vocabulário de peças ──────────────────────────────────────────────────
export type Cabeca = 'nenhuma' | 'chaperon' | 'barrete' | 'coifa' | 'elmo'
                   | 'gorro' | 'toucado' | 'turbante' | 'chapeuAba';
export type Corpo = 'gibao' | 'jaqueta' | 'tunica' | 'gown' | 'peitoral' | 'robe';
export type Capa = 'nenhuma' | 'curta' | 'longa' | 'esvoacante';
export type Barba = 'nenhuma' | 'curta' | 'cheia' | 'bifurcada' | 'longa' | 'bigode';

export interface Personagem {
  id: string;
  nome: string;
  /** Cargo histórico real, não inventado. */
  cargo: string;
  /** Papel no enxame de agentes. */
  papel: string;
  /** Datas, para que o rigor da janela seja verificável no próprio ficheiro. */
  datas: string;
  pele: string;
  cabelo: string;
  barba: Barba;
  cabeca: Cabeca;
  corpo: Corpo;
  corCorpo: string;
  capa: Capa;
  corCapa: string;
  /** Cor de destaque: forros, punhos, golas, bordados. */
  acento: string;
  /** Pala no olho — só onde é historicamente defensável. */
  pala?: boolean;
  /** O que distingue a figura a 32px. É o critério de aceitação do sprite. */
  nota: string;
}

// ── O elenco ──────────────────────────────────────────────────────────────
export const ELENCO: Personagem[] = [
  {
    id: 'lourenco', nome: 'Fernão Lourenço', cargo: 'Feitor e Tesoureiro da Casa da Índia',
    papel: 'orquestrador', datas: 'fl. 1481–1504',
    pele: PELE.clara, cabelo: CABELO.grisalho, barba: 'curta',
    cabeca: 'chaperon', corpo: 'gown', corCorpo: PANO.tinta,
    capa: 'longa', corCapa: PANO.tinta, acento: PANO.pergaminho,
    nota: 'O único em traje civil de escritório e o único sem qualquer arma. O chaperon é enorme, quase tão largo como os ombros — deve ler-se a 32px sem mais nenhuma pista. Mandava armadas e nunca navegou.',
  },
  {
    id: 'gama', nome: 'Vasco da Gama', cargo: 'Capitão-mor da Carreira da Índia',
    papel: 'agente de longo curso', datas: '1469–1524',
    pele: PELE.curtida, cabelo: CABELO.negro, barba: 'bifurcada',
    cabeca: 'barrete', corpo: 'gibao', corCorpo: PANO.azulejo,
    capa: 'longa', corCapa: PANO.tinta, acento: PANO.ouro,
    nota: 'O azul mais saturado do elenco. É a cara da aplicação a seguir ao Feitor. Barba bifurcada, como nos retratos.',
  },
  {
    id: 'cabral', nome: 'Pedro Álvares Cabral', cargo: 'Capitão-mor da armada de 1500',
    papel: 'resolve o ticket errado', datas: 'c.1467–1520',
    pele: PELE.clara, cabelo: CABELO.ruivo, barba: 'curta',
    cabeca: 'barrete', corpo: 'gibao', corCorpo: PANO.vermelho,
    capa: 'curta', corCapa: PANO.pergaminho, acento: PANO.ouro,
    nota: 'Jovem, cores alegres, o mais claro do elenco. Ia para a Índia e chegou ao Brasil — resolveu brilhantemente outra coisa.',
  },
  {
    id: 'dias', nome: 'Bartolomeu Dias', cargo: 'Capitão, dobrou o Cabo em 1488',
    papel: 'disjuntor / tormenta', datas: 'c.1450–1500',
    pele: PELE.curtida, cabelo: CABELO.grisalho, barba: 'cheia',
    cabeca: 'nenhuma', corpo: 'jaqueta', corCorpo: PANO.couro,
    capa: 'esvoacante', corCapa: PANO.aco, acento: PANO.azulClaro,
    nota: 'A única capa esvoaçante do elenco — soprada para um lado mesmo parado. Morreu numa tormenta ao largo do próprio Cabo que dobrara, em 1500, na armada de Cabral. Mascote perfeita do disjuntor.',
  },
  {
    id: 'covilha', nome: 'Pêro da Covilhã', cargo: 'Emissário por terra ao Oriente',
    papel: 'investigação, agente destacado', datas: 'c.1460–depois de 1526',
    pele: PELE.morena, cabelo: CABELO.negro, barba: 'cheia',
    cabeca: 'turbante', corpo: 'robe', corCorpo: PANO.pergaminho,
    capa: 'longa', corCapa: PANO.couro, acento: PANO.verde,
    nota: 'Vai disfarçado: cores baças, nada que chame a atenção — e é isso que o distingue num elenco de veludo. Partiu em 1487, ficou retido na Etiópia e nunca regressou; a embaixada de 1520 ainda o encontrou vivo. É o agente que parte e não volta.',
  },
  {
    id: 'caminha', nome: 'Pêro Vaz de Caminha', cargo: 'Escrivão da feitoria de Calecute',
    papel: 'escrivão — relatórios, PRs', datas: 'c.1450–1500',
    pele: PELE.clara, cabelo: CABELO.castanho, barba: 'nenhuma',
    cabeca: 'coifa', corpo: 'gown', corCorpo: PANO.tinta,
    capa: 'nenhuma', corCapa: PANO.tinta, acento: PANO.pergaminho,
    nota: 'Colarinho branco, o ponto mais claro do sprite, à altura do queixo. FAZ ESTE PRIMEIRO: é o mais neutro e serve de referência de estilo para os outros catorze. Escreveu a carta a D. Manuel em Maio de 1500.',
  },
  {
    id: 'pacheco', nome: 'Duarte Pacheco Pereira', cargo: 'Capitão, defesa de Cochim',
    papel: 'defesa, testes, revisão', datas: 'c.1460–1533',
    pele: PELE.media, cabelo: CABELO.negro, barba: 'cheia',
    cabeca: 'elmo', corpo: 'peitoral', corCorpo: PANO.aco,
    capa: 'curta', corCapa: PANO.vermelho, acento: PANO.ouro,
    nota: 'O único metálico e o mais largo de ombros. A faixa clara horizontal no peitoral é o que o faz ler como aço e não como mais uma túnica escura. Aguentou Cochim contra tudo em 1504.',
  },
  {
    id: 'magalhaes', nome: 'Fernão de Magalhães', cargo: 'Passou ao serviço de Castela',
    papel: 'agente noutro fornecedor', datas: 'c.1480–1521',
    pele: PELE.media, cabelo: CABELO.negro, barba: 'cheia',
    cabeca: 'barrete', corpo: 'gibao', corCorpo: PANO.ouro,
    capa: 'curta', corCapa: PANO.vermelho, acento: PANO.pergaminho,
    nota: 'Cores de Castela, não da casa — é a única paleta que destoa de propósito. Serviu na Índia portuguesa de 1505 a 1513 e passou-se para Castela em 1517.',
  },
  {
    id: 'pires', nome: 'Tomé Pires', cargo: 'Escrivão da feitoria de Malaca',
    papel: 'documentação', datas: 'c.1465–1540',
    pele: PELE.clara, cabelo: CABELO.castanho, barba: 'curta',
    cabeca: 'chapeuAba', corpo: 'robe', corCorpo: PANO.seda,
    capa: 'curta', corCapa: PANO.ouro, acento: PANO.azulClaro,
    nota: 'Boticário antes de escrivão, e o que mais misturou trajes do Oriente — a paleta mais mista do elenco, sem chegar a destoar como o Magalhães. Escreveu a Suma Oriental entre 1512 e 1515.',
  },
  {
    id: 'barbosa', nome: 'Duarte Barbosa', cargo: 'Escrivão em Cochim e Cananor',
    papel: 'i18n — línguas e tradução', datas: 'c.1480–1521',
    pele: PELE.media, cabelo: CABELO.castanho, barba: 'curta',
    cabeca: 'nenhuma', corpo: 'tunica', corCorpo: PANO.linho,
    capa: 'nenhuma', corCapa: PANO.linho, acento: PANO.verde,
    nota: 'O mais simples do elenco, de propósito: linho claro, sem capa, sem chapéu. Era intérprete de malaiala — daí o papel da tradução. Morreu em Cebu, em 1521, com o Magalhães.',
  },
  {
    id: 'albuquerque', nome: 'Afonso de Albuquerque', cargo: 'Governador da Índia, 1509–1515',
    papel: 'operações destrutivas', datas: '1453–1515',
    pele: PELE.curtida, cabelo: CABELO.branco, barba: 'longa',
    cabeca: 'nenhuma', corpo: 'gibao', corCorpo: PANO.tinta,
    capa: 'longa', corCapa: PANO.vermelho, acento: PANO.ouro,
    nota: 'A barba branca, longa e bifurcada até ao peito é a coisa mais reconhecível do elenco inteiro — em todos os retratos históricos é o que se vê primeiro. Não a cortes.',
  },
  {
    id: 'almeida', nome: 'Francisco de Almeida', cargo: 'Primeiro Vice-Rei da Índia',
    papel: 'comando de primeira linha', datas: 'c.1450–1510',
    pele: PELE.clara, cabelo: CABELO.grisalho, barba: 'cheia',
    cabeca: 'gorro', corpo: 'gibao', corCorpo: PANO.verde,
    capa: 'longa', corCapa: PANO.tinta, acento: PANO.ouro,
    nota: 'Sóbrio e vertical, o contrário do Pacheco: sem metal, sem largura, autoridade pela postura. Venceu Diu em 1509 e morreu em 1510 na baía da Table.',
  },
  {
    id: 'rodrigues', nome: 'Francisco Rodrigues', cargo: 'Piloto e cartógrafo',
    papel: 'cartas, o roteiro', datas: 'fl. até 1515',
    pele: PELE.curtida, cabelo: CABELO.castanho, barba: 'nenhuma',
    cabeca: 'chapeuAba', corpo: 'jaqueta', corCorpo: PANO.couro,
    capa: 'nenhuma', corCapa: PANO.couro, acento: PANO.azulejo,
    nota: 'Mangas arregaçadas, prático, sem ostentação. Desenhou roteiros, regras de navegação e mapas no Oriente antes de 1515 — o índice do que se sabia.',
  },
  {
    id: 'faleiro', nome: 'Rui Faleiro', cargo: 'Cosmógrafo',
    papel: 'dados e cálculo', datas: 'm. c.1523',
    pele: PELE.clara, cabelo: CABELO.grisalho, barba: 'longa',
    cabeca: 'gorro', corpo: 'robe', corCorpo: PANO.azulejo,
    capa: 'longa', corCapa: PANO.azulejo, acento: PANO.ouro,
    pala: true,
    nota: 'Barba longa e roupa comprida da mesma cor: silhueta vertical sem interrupções, o oposto exato do Pacheco. Planeou a viagem com o Magalhães e passou-se com ele a Castela — ficou em terra à partida.',
  },
  {
    id: 'leonor', nome: 'D. Leonor de Viseu', cargo: 'Rainha viúva, irmã de D. Manuel I',
    papel: 'políticas e aprovações', datas: '1458–1525',
    pele: PELE.clara, cabelo: CABELO.castanho, barba: 'nenhuma',
    cabeca: 'toucado', corpo: 'gown', corCorpo: PANO.verde,
    capa: 'longa', corCapa: PANO.pergaminho, acento: PANO.ouro,
    nota: 'O toucado com véu dá-lhe a segunda silhueta mais reconhecível, a seguir ao Feitor, e é a única que desce dos dois lados até abaixo dos ombros. Postura imóvel. Fundou as Misericórdias em 1498.',
  },
];
