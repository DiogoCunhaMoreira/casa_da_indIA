// Re-render committed UI portraits whenever the Godot character geometry changes.
const { spawnSync } = require('node:child_process');
const { mkdtempSync, writeFileSync, mkdirSync, existsSync } = require('node:fs');
const { tmpdir, homedir } = require('node:os');
const { join, resolve } = require('node:path');
const root = resolve(__dirname, '../..');
const scratch = mkdtempSync(join(tmpdir(), 'casa-portraits-'));
const roster = join(scratch, 'roster.json');
writeFileSync(roster, JSON.stringify([...require('../../test/load-ts.cjs')('src/renderer/src/scene/office/casadaindia/elenco.ts').ELENCO, ...require('../../test/load-ts.cjs')('src/renderer/src/scene/godot/tascaCast.ts').TASCA_CAST]));
const output = join(root, 'src/renderer/public/portraits');
mkdirSync(output, { recursive: true });
const binary = process.env.GODOT_BIN || ['/Applications/Godot.app/Contents/MacOS/Godot', join(homedir(), 'Downloads/Godot.app/Contents/MacOS/Godot')].find(existsSync) || 'godot';
const result = spawnSync(binary, ['--path', join(root, 'godot/casa-da-india'), '--script', 'res://scripts/export_portraits.gd', '--log-file', join(scratch, 'render.log'), '--', roster, output], { stdio: 'inherit' });
if (result.error) throw result.error;
process.exit(result.status ?? 1);
