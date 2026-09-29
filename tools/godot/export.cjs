const { spawnSync } = require('node:child_process');
const { mkdirSync, copyFileSync, existsSync } = require('node:fs');
const { resolve, join } = require('node:path');
const { homedir } = require('node:os');
const root = resolve(__dirname, '../..');
const output = resolve(root, 'src/renderer/public/godot');
const committed = existsSync(resolve(output, 'index.pck')) && existsSync(resolve(output, 'index.wasm'));

// A exportação vai no repositório, por isso só quem mexe no mundo precisa do Godot.
// Sem Godot (ou sem os templates), usa-se a exportação que já lá está.
function useCommitted(reason) {
  if (!committed) throw new Error(`${reason} Consulta godot/INTEGRATION.md.`);
  console.log(`[godot] ${reason} A usar o mundo já exportado em src/renderer/public/godot.`);
  process.exit(0);
}

const binary = process.env.GODOT_BIN || ['/Applications/Godot.app/Contents/MacOS/Godot', join(homedir(), 'Downloads/Godot.app/Contents/MacOS/Godot')].find(existsSync) || 'godot';
const version = spawnSync(binary, ['--version'], { encoding: 'utf8' });
if (version.error || !version.stdout.startsWith('4.6.2.')) useCommitted('Godot 4.6.2 não encontrado (define GODOT_BIN para exportar).');
if (!existsSync(resolve(root, '.cache/godot/web_nothreads_release.zip'))) useCommitted('Templates Web do Godot 4.6.2 em falta em .cache/godot/.');
mkdirSync(output, { recursive: true });
const result = spawnSync(binary, ['--headless', '--path', resolve(root, 'godot/casa-da-india'), '--export-release', 'Casa Web', resolve(output, 'index.html')], { stdio: 'inherit' });
if (result.status !== 0) process.exit(result.status || 1);
copyFileSync(resolve(root, 'godot/web/bridge.js'), resolve(output, 'bridge.js'));
console.log('Godot exportado para desenvolvimento e empacotamento offline.');
