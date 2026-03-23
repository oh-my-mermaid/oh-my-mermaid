import { ensureOmmForRead, readField, readMeta, classExists } from '../lib/store.js';
import { diffMermaid, formatDiff } from '../lib/diff.js';

export function commandDiff(className: string): void {
  if (!ensureOmmForRead()) return;

  if (!classExists(className)) {
    process.stderr.write(`error: class '${className}' not found\n`);
    process.exit(1);
  }

  const current = readField(className, 'diagram');
  if (!current) {
    process.stderr.write(`error: ${className}/diagram.mmd is empty\n`);
    process.exit(1);
  }

  const meta = readMeta(className);
  const prev = meta?.prev_diagram;
  if (!prev) {
    process.stderr.write(`No previous diagram version for '${className}'.\n`);
    return;
  }

  const diff = diffMermaid(prev, current);
  process.stdout.write(formatDiff(diff));
}
