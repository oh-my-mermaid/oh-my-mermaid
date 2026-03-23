import { ensureOmmForRead } from '../lib/store.js';
import { startServer } from '../server/index.js';

export function commandServe(port: number = 3000): void {
  if (!ensureOmmForRead()) return;
  startServer(port);
}
