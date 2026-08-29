#!/usr/bin/env node
/**
 * `npm run arte` — recorta as peças para o atlas e redesenha a planta.
 *
 * Existe em vez de dois `python3 ...` encadeados no package.json por uma razão
 * chata mas real: os geradores precisam de pillow e numpy, e o python do
 * sistema raramente os tem. Em vez de mandar instalar coisas no python de
 * ninguém, isto usa um ambiente virtual dentro do próprio tools/mapgen — cria-o
 * na primeira vez e reutiliza-o daí em diante.
 *
 *     node tools/mapgen/run.cjs [--folha]
 *
 * `--folha` passa à frente para o construtor do atlas, que então também usa os
 * recortes da folha pintada arquivada para as peças que ainda não têm ficheiro
 * próprio em art/pecas/.
 */
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const AQUI = __dirname;
const VENV = path.join(AQUI, '.venv');
const PY = process.platform === 'win32'
  ? path.join(VENV, 'Scripts', 'python.exe')
  : path.join(VENV, 'bin', 'python3');

function temDependencias(python) {
  return spawnSync(python, ['-c', 'import PIL, numpy'], { stdio: 'ignore' }).status === 0;
}

function preparaVenv() {
  if (temDependencias(PY)) return PY;

  // Talvez o python do sistema já sirva — se servir, não criamos nada.
  const sistema = process.platform === 'win32' ? 'python' : 'python3';
  if (!fs.existsSync(VENV) && temDependencias(sistema)) return sistema;

  console.log('[arte] a preparar o ambiente de python em tools/mapgen/.venv …');
  if (!fs.existsSync(VENV)) {
    execFileSync(sistema, ['-m', 'venv', VENV], { stdio: 'inherit' });
  }
  execFileSync(PY, ['-m', 'pip', 'install', '--quiet', 'pillow', 'numpy'],
    { stdio: 'inherit' });
  if (!temDependencias(PY)) {
    console.error('[arte] não consegui instalar pillow + numpy. Instala-os à mão:');
    console.error(`       ${PY} -m pip install pillow numpy`);
    process.exit(1);
  }
  return PY;
}

const python = preparaVenv();
const extra = process.argv.slice(2);

for (const script of ['build_atlas.py', 'build_ribeira.py']) {
  // Só o construtor do atlas conhece --folha; o da planta lê o que lá estiver.
  const args = script === 'build_atlas.py' ? [path.join(AQUI, script), ...extra]
    : [path.join(AQUI, script)];
  const r = spawnSync(python, args, { stdio: 'inherit', cwd: path.join(AQUI, '..', '..') });
  if (r.status !== 0) process.exit(r.status ?? 1);
}
