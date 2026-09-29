'use strict';

// A1: one Save button. Settings used to persist three different ways — toggles
// wrote on click, some sections had their own Save, a couple of fields saved on
// blur — and nothing told the user which kind they were looking at.
//
// SettingsModal is a 2000-line TSX with a wide import graph, so these read the
// source rather than mounting it. That is the existing house pattern for this
// file, and it holds the RULE, which is what actually regressed.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const MODAL = read('src/renderer/src/components/SettingsModal.tsx');

test('there is exactly one writer of config in the whole modal', () => {
  const calls = MODAL.match(/window\.cth\.updateConfig\(/g) ?? [];
  assert.equal(calls.length, 1,
    `${calls.length} updateConfig calls — every setting must go through saveAll`);
});

test('the one writer is saveAll, and it sends a single merged patch', () => {
  const i = MODAL.indexOf('const saveAll');
  assert.ok(i > 0, 'saveAll is gone');
  const body = MODAL.slice(i, MODAL.indexOf('\n  };', i));
  assert.match(body, /window\.cth\.updateConfig\(patch\)/,
    'saveAll must write one patch, not several calls');
  for (const part of ['maxTurnsPatch()', 'budgetPatch()', '...pending']) {
    assert.ok(body.includes(part), `saveAll does not include ${part}`);
  }
});

test('toggles stage their change instead of writing it', () => {
  // The specific toggles that used to persist the instant you clicked them.
  for (const key of ['strongKeepalive', 'autoMode', 'orchestratorMaySpawn',
                     'semanticMemory', 'autoUpdate']) {
    const re = new RegExp(`stage\\(\\{ ${key}:`);
    assert.match(MODAL, re, `${key} is not staged`);
  }
});

test('closing with staged changes asks first, instead of dropping them', () => {
  assert.match(MODAL, /const requestClose/, 'no close guard');
  const i = MODAL.indexOf('const requestClose');
  const body = MODAL.slice(i, i + 300);
  assert.match(body, /dirty/, 'the guard does not check for staged changes');
  assert.match(body, /window\.confirm/, 'the guard does not actually ask');
  // And the footer button must use it, not raw onClose.
  assert.match(MODAL, /onClick=\{requestClose\}/, 'the footer Close bypasses the guard');
});

test('the footer offers Save, and it is the only Save left in the modal', () => {
  assert.match(MODAL, /onClick=\{\(\) => void saveAll\(\)\}/, 'no footer Save');
  // The per-section Save buttons this replaced are gone.
  assert.doesNotMatch(MODAL, /onClick=\{saveBudget\}/, 'the budget Save button is back');
  assert.doesNotMatch(MODAL, /onBlur=\{\(\) => void saveMaxTurns\(\)\}/, 'maxTurns saves on blur again');
});

// --- the two deliberate exceptions ------------------------------------------

// --- A2: Connections tidying -------------------------------------------------

test('the section heading is defined once, not written out seventeen times', () => {
  assert.match(MODAL, /const sectionHead = \{/);
  const inline = MODAL.match(/fontFamily: 'var\(--cth-font-ui\)', fontSize: 14, fontWeight: 600, lineHeight: '22px',/g) ?? [];
  assert.equal(inline.length, 1, `${inline.length} inline copies remain — only the const should define it`);
});

