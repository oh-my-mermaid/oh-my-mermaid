import { listClasses, readField } from './store.js';
import type { RefEntry } from '../types.js';

const REF_PATTERN = /@([\w-]+)/g;

/**
 * Extract @class-name references from a mermaid diagram text.
 */
export function extractRefs(diagramText: string): string[] {
  const refs: string[] = [];
  let match: RegExpExecArray | null;
  const pattern = new RegExp(REF_PATTERN.source, 'g');
  while ((match = pattern.exec(diagramText)) !== null) {
    if (!refs.includes(match[1])) {
      refs.push(match[1]);
    }
  }
  return refs;
}

/**
 * Get all classes that the given class references (outgoing refs).
 */
export function getOutgoingRefs(className: string, cwd?: string): RefEntry[] {
  const diagram = readField(className, 'diagram', cwd);
  if (!diagram) return [];

  const refs = extractRefs(diagram);
  return refs.map(target => ({
    source_class: className,
    target_class: target,
    node_id: `@${target}`,
  }));
}

/**
 * Get all classes that reference the given class (incoming refs).
 */
export function getIncomingRefs(className: string, cwd?: string): RefEntry[] {
  const classes = listClasses(cwd);
  const incoming: RefEntry[] = [];

  for (const cls of classes) {
    if (cls === className) continue;
    const diagram = readField(cls, 'diagram', cwd);
    if (!diagram) continue;

    const refs = extractRefs(diagram);
    if (refs.includes(className)) {
      incoming.push({
        source_class: cls,
        target_class: className,
        node_id: `@${className}`,
      });
    }
  }

  return incoming;
}

/**
 * Build a full reference graph for all classes.
 */
export function buildRefGraph(cwd?: string): RefEntry[] {
  const classes = listClasses(cwd);
  const allRefs: RefEntry[] = [];

  for (const cls of classes) {
    const refs = getOutgoingRefs(cls, cwd);
    allRefs.push(...refs);
  }

  return allRefs;
}
