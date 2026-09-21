'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { sidebarLimits, clampSidebarWidth } = require('./load-ts.cjs')('src/renderer/src/components/sidebarLayout.ts');
const display = (saved, content) => {
  const { min, max } = sidebarLimits(content);
  return clampSidebarWidth(saved, min, max);
};
test('panel reserves the real floor space and separator, including at the minimum app window', () => {
  const content = 1280 - 32;
  assert.equal(display(1200, content), 878);
  assert.equal(content - display(1200, content) - 10, 360);
  assert.equal(display(1200, 2000), 1200);
});
test('shrinking and expanding restores the preferred width without overwriting it', () => {
  const preferred = 1100;
  assert.deepEqual([display(preferred, 1600), display(preferred, 900), display(preferred, 1600)], [1100, 530, 1100]);
});
test('very narrow containers prioritise the panel without overflowing', () => {
  for (const content of [0, 10, 250, 500, 690]) {
    const width = display(420, content);
    assert.ok(width >= 0);
    assert.ok(width <= Math.max(0, content - 10));
  }
  assert.equal(display(420, 500), 320);
});
test('reset and invalid values respect the current bounds', () => {
  assert.equal(display(420, 700), 330);
  assert.equal(display(NaN, 1200), 420);
  assert.equal(display(-100, 1200), 320);
  assert.equal(display(450.7, 1200), 451);
});
