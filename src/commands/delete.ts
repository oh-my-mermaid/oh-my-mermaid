import { ensureOmmForRead, deleteClass } from '../lib/store.js';

export function commandDelete(className: string): void {
  if (!ensureOmmForRead()) return;
  if (deleteClass(className)) {
    process.stderr.write(`deleted element '${className}'\n`);
  } else {
    process.stderr.write(`error: element '${className}' not found\n`);
    process.exit(1);
  }
}
