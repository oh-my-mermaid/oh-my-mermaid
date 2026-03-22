import { ensureOmm, deleteClass } from '../lib/store.js';

export function commandDelete(className: string): void {
  ensureOmm();
  if (deleteClass(className)) {
    process.stderr.write(`deleted class '${className}'\n`);
  } else {
    process.stderr.write(`error: class '${className}' not found\n`);
    process.exit(1);
  }
}
