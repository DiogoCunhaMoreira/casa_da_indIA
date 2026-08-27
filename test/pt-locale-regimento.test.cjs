'use strict';

// The Portuguese locale is machine-translated (by Amália, run locally), so the
// failure modes are mechanical rather than editorial, and all three are silent
// in the UI:
//
//   1. a translated {{placeholder}} renders as literal text on screen;
//   2. a renamed key is a dead string — i18next falls back to English for a
//      MISSING key, but a renamed one just never resolves;
//   3. Brazilian Portuguese creeping in. PT-PT vs PT-BR is the whole point of
//      shipping a Portuguese build at all, and the tell is vocabulary, not
//      grammar — so the specific words are held here.
//
// The last test holds the regimento wiring: agent prose is Portuguese because
// of an INSTRUCTION, not because of the model, which is what makes it work on
// engines that cannot be pointed at a local server.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const locale = (l) => JSON.parse(read(`src/renderer/src/i18n/locales/${l}.json`));

function flatten(obj, pre = '', out = {}) {
  for (const [k, v] of Object.entries(obj)) {
    const key = pre ? `${pre}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) flatten(v, key, out);
    else out[key] = v;
  }
  return out;
}

const text = (v) => (Array.isArray(v) ? v.join(' ') : String(v));
/** Interpolations and tags that must survive translation byte-for-byte. */
const TOKENS = /\{\{.*?\}\}|<\/?[0-9a-zA-Z][^>]*>|\$t\([^)]*\)/g;

test('pt-PT has exactly the key tree of en.json', () => {
  const en = flatten(locale('en'));
  const pt = flatten(locale('pt-PT'));
  const missing = Object.keys(en).filter((k) => !(k in pt));
  const extra = Object.keys(pt).filter((k) => !(k in en));
  assert.deepEqual(missing, [], 'keys missing from pt-PT');
  assert.deepEqual(extra, [], 'keys in pt-PT that en.json does not have');
});

test('pt-PT preserves every placeholder and tag', () => {
  const en = flatten(locale('en'));
  const pt = flatten(locale('pt-PT'));
  const broken = [];
  for (const [k, v] of Object.entries(en)) {
    const a = (text(v).match(TOKENS) || []).sort();
    const b = (text(pt[k]).match(TOKENS) || []).sort();
    if (a.join('|') !== b.join('|')) broken.push(`${k}: [${a}] -> [${b}]`);
  }
  assert.deepEqual(broken, [], 'placeholder/tag mismatch');
});

test('pt-PT uses European Portuguese, not Brazilian', () => {
  // Word-boundary matched so "arquivo" is caught but "arquivos" is too, while
  // an unrelated substring is not. Each pair is PT-BR -> PT-PT.
  const BR = [
    ['arquivo', 'ficheiro'], ['tela', 'ecrã'], ['usuário', 'utilizador'],
    ['gerenciar', 'gerir'], ['gerenciamento', 'gestão'], ['deletar', 'eliminar'],
    ['configurações', 'definições'], ['time', 'equipa'], ['dados pessoais', '—'],
  ];
  const pt = flatten(locale('pt-PT'));
  const hits = [];
  for (const [k, v] of Object.entries(pt)) {
    const s = text(v).toLowerCase();
    for (const [br, ptpt] of BR) {
      if (br === 'time') continue; // English loanword, too ambiguous to flag
      if (new RegExp(`\\b${br}\\b`).test(s)) hits.push(`${k}: "${br}" (usar "${ptpt}")`);
    }
  }
  assert.deepEqual(hits, [], 'Brazilian Portuguese in pt-PT.json');
});

test('pt-PT is registered in every place i18n needs it', () => {
  const src = read('src/renderer/src/i18n/index.ts');
  assert.match(src, /import ptPT from '\.\/locales\/pt-PT\.json'/, 'not imported');
  assert.match(src, /'pt-PT': \{ translation: ptPT \}/, 'not in resources');
  assert.match(src, /supportedLngs: \[[^\]]*'pt-PT'/, 'not in supportedLngs');
  assert.match(src, /code: 'pt-PT'/, 'not in the LANGUAGES picker');
});

test('the regimento reaches the agent system prompt', () => {
  const reg = read('src/shared/regimento.ts');
  // The instruction has to name the variety explicitly — "Portuguese" alone
  // gets Brazilian output from most models.
  assert.match(reg, /português europeu \(PT-PT\)/);
  assert.match(reg, /nunca em português do Brasil/);
  // Code must be exempt, or agents start translating identifiers.
  assert.match(reg, /NÃO traduzas: código/);

  const hive = read('src/main/hive.ts');
  assert.match(hive, /import \{ regimentoLine \}/, 'hive.ts does not import it');
  assert.match(hive, /regimentoLine\(agentLanguage\)/, 'not appended to the prompt');
  assert.match(hive, /agentLanguage\?: string;/, 'not a spawn option');

  // …and the option is actually passed at the spawn call site, not just typed.
  const index = read('src/main/index.ts');
  assert.match(index, /agentLanguage: readConfig\(\)\.agentLanguage/, 'never wired');
});
