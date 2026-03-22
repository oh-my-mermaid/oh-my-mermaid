import fs from 'node:fs';
import type { ServerResponse } from 'node:http';
import { getOmmDir } from '../lib/store.js';

const clients = new Set<ServerResponse>();

export function addSSEClient(res: ServerResponse): void {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });
  res.write('data: connected\n\n');
  clients.add(res);

  res.on('close', () => {
    clients.delete(res);
  });
}

function broadcast(event: string, data: string): void {
  for (const client of clients) {
    client.write(`event: ${event}\ndata: ${data}\n\n`);
  }
}

let watcher: fs.FSWatcher | null = null;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

export function startWatcher(): void {
  if (watcher) return;

  const dir = getOmmDir();
  if (!fs.existsSync(dir)) return;

  watcher = fs.watch(dir, { recursive: true }, (_event, filename) => {
    // Debounce rapid changes
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      broadcast('change', JSON.stringify({ file: filename, time: Date.now() }));
    }, 300);
  });

  watcher.on('error', () => {
    // Silently handle watcher errors
  });
}

export function stopWatcher(): void {
  if (watcher) {
    watcher.close();
    watcher = null;
  }
}
