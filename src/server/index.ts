import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { handleApi } from './api.js';
import { addSSEClient, startWatcher } from './watcher.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getViewerHtml(): string {
  // Try dist/ first, then src/server/ for dev
  const candidates = [
    path.join(__dirname, 'viewer.html'),
    path.join(__dirname, '..', 'server', 'viewer.html'),
    path.join(__dirname, '..', 'src', 'server', 'viewer.html'),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      return fs.readFileSync(p, 'utf-8');
    }
  }
  return '<html><body><h1>viewer.html not found</h1></body></html>';
}

export function startServer(port: number): void {
  startWatcher();

  const server = http.createServer((req, res) => {
    const url = new URL(req.url || '/', `http://${req.headers.host}`);

    // SSE endpoint
    if (url.pathname === '/events') {
      addSSEClient(res);
      return;
    }

    // API endpoints
    if (url.pathname.startsWith('/api/')) {
      if (handleApi(req, res)) return;
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'not found' }));
      return;
    }

    // Serve viewer HTML
    if (url.pathname === '/' || url.pathname === '/index.html') {
      let html = getViewerHtml();
      const projectName = path.basename(process.cwd());
      html = html.replace('</head>', `<script>window.__projectName=${JSON.stringify(projectName)};</script>\n</head>`);
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
      return;
    }

    res.writeHead(404);
    res.end('Not Found');
  });

  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      process.stderr.write(`Port ${port} in use, trying ${port + 1}...\n`);
      server.close();
      startServer(port + 1);
    } else {
      throw err;
    }
  });

  server.listen(port, () => {
    process.stderr.write(`oh-my-mermaid viewer running at http://localhost:${port}\n`);
  });
}
