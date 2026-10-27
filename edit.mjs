// Local bar editor server (see README): serves the repo and saves edits to <slug>/overrides.json.
import http from 'http';
import fs from 'fs';
import path from 'path';
import { execFile } from 'child_process';
import { fileURLToPath } from 'url';

const root = path.dirname(fileURLToPath(import.meta.url));
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json',
  '.tex': 'text/plain; charset=utf-8', '.txt': 'text/plain; charset=utf-8', '.woff2': 'font/woff2', '.woff': 'font/woff',
};

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const api = url.pathname.match(/^\/api\/([\w-]+)\/bars\/(\d+)$/);
  if (api) {
    const [, slug, index] = api;
    if (!fs.existsSync(path.join(root, slug, 'song.mjs'))) return send(res, 404, 'No such song');
    const file = path.join(root, slug, 'overrides.json');
    const overrides = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {};
    if (req.method === 'PUT') {
      let body = '';
      for await (const chunk of req) body += chunk;
      overrides[index] = JSON.parse(body).raw;
    } else if (req.method === 'DELETE') {
      delete overrides[index];
    } else {
      return send(res, 405, 'Use PUT or DELETE');
    }
    if (Object.keys(overrides).length) fs.writeFileSync(file, JSON.stringify(overrides, null, 2) + '\n');
    else fs.rmSync(file, { force: true });
    return execFile(process.execPath, [path.join(root, 'build.mjs'), slug], { cwd: root }, (err, stdout, stderr) =>
      send(res, err ? 500 : 200, err ? stderr || err.message : stderr));
  }

  let file = path.join(root, decodeURIComponent(url.pathname));
  if (!file.startsWith(root)) return send(res, 403, 'Forbidden');
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!fs.existsSync(file)) return send(res, 404, 'Not found');
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] ?? 'application/octet-stream', 'Cache-Control': 'no-store' });
  fs.createReadStream(file).pipe(res);
}).listen(8810, '127.0.0.1', () => console.log('Editor: http://localhost:8810/editor/?song=<slug>'));

function send(res, status, text) {
  res.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end(text);
}
