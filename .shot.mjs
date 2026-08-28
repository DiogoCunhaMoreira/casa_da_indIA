// Throwaway: launch the built app against an ISOLATED user-data dir (so the
// user's real ~/Library/Application Support/casa-da-india is never touched),
// click through onboarding, and screenshot the floor.
import { _electron as electron } from 'playwright-core';
import * as fs from 'node:fs';
import * as path from 'node:path';

const APP_DIR = '/Users/homomac/Documents/projects/casa_da_indIA';
const SCRATCH = '/private/tmp/claude-501/-Users-homomac-Documents-projects-casa-da-indIA/5db71841-4ae5-4cb2-b6f0-b4160360ccd2/scratchpad';
const SHOT_DIR = path.join(SCRATCH, 'shots');
const UD = path.join(SCRATCH, 'userdata');
fs.mkdirSync(SHOT_DIR, { recursive: true });
fs.mkdirSync(UD, { recursive: true });

const bin = path.join(APP_DIR, 'node_modules/electron/dist/Electron.app/Contents/MacOS/Electron');
const app = await electron.launch({
  executablePath: bin,
  args: [APP_DIR, `--user-data-dir=${UD}`],
  cwd: APP_DIR,
  timeout: 60_000,
});

const logs = [];
await new Promise((r) => setTimeout(r, 14_000));
const page = app.windows().find((w) => !w.url().startsWith('devtools://')) ?? await app.firstWindow();
page.on('console', (m) => logs.push(`[${m.type()}] ${m.text()}`));
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
await page.setViewportSize({ width: 1600, height: 1000 }).catch(() => {});

const shot = async (n) => {
  await new Promise((r) => setTimeout(r, 1500));
  const f = path.join(SHOT_DIR, n + '.png');
  await page.screenshot({ path: f });
  console.log('shot:', f);
};
const state = async () => page.evaluate(() => ({
  buttons: [...document.querySelectorAll('button,[role="button"]')]
    .map((e) => e.textContent?.trim()).filter(Boolean).slice(0, 30),
  head: document.body.innerText.slice(0, 300).replace(/\n+/g, ' / '),
  canvases: [...document.querySelectorAll('canvas')].map((c) => `${c.width}x${c.height}`),
}));

for (let step = 0; step < 22; step++) {
  const s = await state();
  console.log(`\n== step ${step} == canvases=${JSON.stringify(s.canvases)}`);
  console.log('   buttons:', s.buttons.join(' | '));
  console.log('   text:', s.head);
  await shot(`step-${String(step).padStart(2, '0')}`);
  // a big Pixi canvas means we reached the floor
  if (s.canvases.some((c) => Number(c.split('x')[0]) > 600)) { console.log('FLOOR REACHED'); break; }
  const clicked = await page.evaluate(() => {
    const wants = ['configurar isto', 'concluir', 'continuar', 'seguinte',
                   'começar', 'avançar', 'entrar', 'saltar', 'ignorar'];
    const els = [...document.querySelectorAll('button,[role="button"]')];
    const norm = (e) => (e.textContent || '').trim().toLowerCase();
    const advance = els.find((e) => wants.includes(norm(e)) && !e.disabled);
    if (advance) { advance.click(); return 'ADVANCE:' + norm(advance); }
    // The advance button is disabled: this step wants a choice. Take the first
    // option that isn't a nav button.
    const opt = els.find((e) => !e.disabled && norm(e).length > 3
                              && !wants.includes(norm(e)) && norm(e) !== 'retroceder');
    if (opt) { opt.click(); return 'OPTION:' + norm(opt).slice(0, 40); }
    return null;
  });
  console.log('   clicked:', clicked);
  if (!clicked) break;
  await new Promise((r) => setTimeout(r, 2500));
}

console.log('\n--- console ---');
console.log(logs.filter((l) => /OfficeFloor|pageerror|error|tile sprites/i.test(l)).slice(0, 25).join('\n'));
await app.close().catch(() => {});
process.exit(0);
