// O elenco que a interface oferece a quem contrata, sem nada de motor gráfico.
//
// Os dados de cada oficial vivem em `pessoas.ts`; isto é só a vista que os
// formulários, os cartões e o hive precisam: um nome estável, o nome que se lê
// e a linha que aparece quando a cara é escolhida.

import { ELENCO as PESSOAS } from './pessoas';

export type CharacterName = string;

export interface CastMember {
  name: CharacterName;
  displayName: string;
  /** A linha que aparece quando esta cara é escolhida ou ainda não tem descrição. */
  blurb: string;
}

/** O elenco, pela ordem em que a interface o oferece. */
export const ELENCO: CastMember[] = PESSOAS.map((p) => ({
  name: p.id,
  displayName: p.nome,
  blurb: p.cargo
}));

/** A cara de quem chega sem cara escolhida. O escrivão é o mais neutro do elenco. */
export const CARA_POR_OMISSAO: CharacterName = 'caminha';

/** Com que cara é que o orquestrador aparece.
 *
 *  Toda a superfície que desenha deus tem de perguntar AQUI, e nunca nomear uma
 *  personagem à mão. Foi exactamente assim que o Feitor apareceu um dia com a
 *  cara do Caminha, o escrivão. Fernão Lourenço despachava as armadas sem
 *  embarcar em nenhuma — é o orquestrador. */
export function godCharacter(): CharacterName {
  return 'lourenco';
}
