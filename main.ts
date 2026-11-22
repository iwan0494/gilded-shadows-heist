// GILDED SHADOWS — hand-in program (Node 22, standard library only).
//
// The game lives next to this file, in game/: plain static files a desktop
// browser loads offline (game/index.html plus its ES modules, no library, no
// network request). This program hands it in: it copies game/ and screenshots/
// into the output directory and writes dossier.json there, the summary the
// judge reads, using the vendored make.fun library.
//
// Serve it locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// Every path below is resolved from this file's own location (import.meta.url),
// never from the process working directory: the grader runs
// `node /bot/main.ts` from a working directory that is not /bot, so a relative
// path here would fail to find the game at all.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

const gameDir = join(here, 'game');
const shotsDir = join(here, 'screenshots');
const outGameDir = join(outDir, 'game');
const outShotsDir = join(outDir, 'screenshots');

mkdirSync(outGameDir, { recursive: true });
cpSync(gameDir, outGameDir, { recursive: true });
mkdirSync(outShotsDir, { recursive: true });
if (existsSync(shotsDir)) cpSync(shotsDir, outShotsDir, { recursive: true });

const dossier = buildDossier(outDir, {
  text_max_bytes: 1024 * 1024,
  screenshots: { max: 4, max_bytes: 256 * 1024 },
  game_max_files: 993,
  game_max_bytes: 48 * 1024 * 1024,
  game_path_max_bytes: 1000,
});
writeFileSync(join(outDir, 'dossier.json'), dossier);
