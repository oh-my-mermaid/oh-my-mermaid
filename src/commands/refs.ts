import { ensureOmm, classExists } from '../lib/store.js';
import { getIncomingRefs, getOutgoingRefs } from '../lib/refs.js';

export function commandRefs(className: string, reverse: boolean): void {
  ensureOmm();

  if (!classExists(className)) {
    process.stderr.write(`error: class '${className}' not found\n`);
    process.exit(1);
  }

  if (reverse) {
    // Show what this class references (outgoing)
    const refs = getOutgoingRefs(className);
    if (refs.length === 0) {
      process.stdout.write(`${className} does not reference any other class.\n`);
      return;
    }
    process.stdout.write(`${className} references:\n`);
    for (const ref of refs) {
      process.stdout.write(`  → ${ref.target_class}\n`);
    }
  } else {
    // Show what references this class (incoming)
    const refs = getIncomingRefs(className);
    if (refs.length === 0) {
      process.stdout.write(`No class references ${className}.\n`);
      return;
    }
    process.stdout.write(`Referenced by:\n`);
    for (const ref of refs) {
      process.stdout.write(`  ← ${ref.source_class}\n`);
    }
  }
}
