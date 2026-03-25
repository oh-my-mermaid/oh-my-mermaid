import { ensureOmmForRead, listClasses, readMeta } from '../lib/store.js';

export function commandStatus(): void {
  if (!ensureOmmForRead()) return;
  const classes = listClasses();

  if (classes.length === 0) {
    process.stdout.write('No perspectives found. Run /omm-scan to generate.\n');
    return;
  }

  process.stdout.write(`Perspectives: ${classes.length}\n\n`);

  for (const cls of classes) {
    const meta = readMeta(cls);
    const updated = meta?.updated ? new Date(meta.updated).toLocaleString() : 'unknown';
    const count = meta?.update_count ?? 0;
    process.stdout.write(`  ${cls}\n`);
    process.stdout.write(`    updated: ${updated} (${count} updates)\n`);
  }
}
