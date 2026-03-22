import { ensureOmm, listClasses } from '../lib/store.js';

export function commandList(): void {
  ensureOmm();
  const classes = listClasses();
  if (classes.length === 0) {
    process.stderr.write('No classes found.\n');
    return;
  }
  process.stdout.write(classes.join('\n') + '\n');
}
