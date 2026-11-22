// GILDED SHADOWS — local static server for playtesting only (not graded).
// Serves the repo root on http://localhost:8080 so game/index.html loads
// its ES modules offline, exactly like the grader's static hosting.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = fileURLToPath(new URL('.', import.meta.url));
const MIME = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
};

const server = createServer(async (req, res) => {
  const raw = req.url === '/' ? '/game/index.html' : (req.url ?? '/').split('?')[0];
  const rel = raw.replace(/^\//, '');
  try {
    const data = await readFile(join(here, rel));
    res.writeHead(200, { 'content-type': MIME[extname(rel)] ?? 'application/octet-stream' });
    res.end(data);
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain' });
    res.end('not found');
  }
});

server.listen(8080, () => console.log('GILDED SHADOWS at http://localhost:8080'));
