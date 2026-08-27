/**
 * Regimento — a instrução de língua acrescentada ao prompt de cada nau.
 *
 * Um *regimento* era a instrução escrita que a Coroa entregava a cada capitão e
 * a cada oficial da Casa da Índia, a dizer o que devia fazer e o que devia
 * registar. O regimento de 1509 fez exatamente isso para os oficiais da Casa.
 * É, literalmente, um system prompt de 1509 — daí o nome.
 *
 * ── Porquê isto existe ─────────────────────────────────────────────────────
 * Ter a aplicação em português NÃO exige um modelo português. O que faz um
 * agente responder, escrever commits e relatar em PT-PT é a instrução, não o
 * modelo — e a instrução funciona em QUALQUER motor, incluindo os que não se
 * podem apontar ao LM Studio (Claude Code, Codex e Antigravity usam login
 * próprio). É por isso que esta camada é a que entrega a maior parte do
 * objetivo, e a que é robusta.
 *
 * O texto é mantido curto e estável de propósito: entra em todos os spawns via
 * `--append-system-prompt`, e um prefixo estável mantém a cache de prompt do
 * motor a funcionar (ver a nota sobre estabilidade em hive.ts).
 */

/** Códigos de língua que a aplicação sabe instruir. */
export type RegimentoLang = 'pt-PT';

const PT_PT = [
  'LÍNGUA: responde SEMPRE em português europeu (PT-PT), nunca em português do Brasil.',
  'Isto aplica-se a tudo o que escreves para pessoas: respostas, resumos, relatórios,',
  'mensagens de commit, descrições de pull request, notas do quadro e mensagens para',
  'outras naus. Usa ficheiro (não arquivo), ecrã (não tela), utilizador (não usuário),',
  'gerir (não gerenciar), definições (não configurações), eliminar (não deletar).',
  'NÃO traduzas: código, identificadores, nomes de ficheiros, caminhos, comandos,',
  'saída de terminal, nem termos de git (commit, branch, merge, pull request, rebase).',
  'Se uma instrução te chegar em inglês, respondes na mesma em português.',
].join(' ');

/** A linha de regimento para uma língua, ou '' se não houver nada a instruir. */
export function regimentoLine(lang: string | undefined | null): string {
  return lang === 'pt-PT' ? PT_PT : '';
}
