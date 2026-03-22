import YAML from 'yaml';
import { ensureOmm, showClass } from '../lib/store.js';

export function commandShow(className: string): void {
  ensureOmm();
  const data = showClass(className);
  if (!data) {
    process.stderr.write(`error: class '${className}' not found\n`);
    process.exit(1);
  }

  const fields = ['description', 'diagram', 'constraint', 'concern', 'context', 'todo', 'note'] as const;
  for (const field of fields) {
    if (data[field]) {
      process.stdout.write(`--- field: ${field} ---\n${data[field]}\n`);
    }
  }
  if (data.meta) {
    process.stdout.write(`--- field: meta ---\n${YAML.stringify(data.meta)}`);
  }
}
