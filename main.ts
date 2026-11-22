// main.ts — build entry: copies game/ + screenshots/ into the output dir and
// writes dossier.json exactly as the kit's buildDossier produces it.
// Every path is resolved from this file's own location (import.meta.url) —
// never from the working directory, because the grader runs it from elsewhere.
import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, resolve } from 'node:path';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR
  ? resolve(process.env.MAKEFUN_OUTPUT_DIR)
  : join(here, 'out');

const gameDir = join(here, 'game');
const shotsDir = join(here, 'screenshots');

mkdirSync(outDir, { recursive: true });

const outGameDir = join(outDir, 'game');
mkdirSync(outGameDir, { recursive: true });
cpSync(gameDir, outGameDir, { recursive: true });

const outShotsDir = join(outDir, 'screenshots');
if (existsSync(shotsDir)) {
  mkdirSync(outShotsDir, { recursive: true });
  cpSync(shotsDir, outShotsDir, { recursive: true });
}

const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
});
writeFileSync(join(outDir, 'dossier.json'), dossier);
