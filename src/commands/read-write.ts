/**
 * omm read <path> <field>           — read a field
 * omm write <path> <field> <text|-> — write a field
 *
 * Paths use / for nesting: overall-architecture/main-process
 */

import {
  isValidField,
  ensureOmmForRead,
  readField,
  writeField,
  readNodeField,
  writeNodeField,
} from '../lib/store.js';
import type { Field } from '../types.js';

function parsePath(targetPath: string): { perspective: string; nodePath: string[] } {
  const parts = targetPath.split('/');
  return { perspective: parts[0], nodePath: parts.slice(1) };
}

export function commandRead(targetPath?: string, field?: string): void {
  if (!targetPath || !field) {
    process.stderr.write('error: omm read <path> <field>\n');
    process.exit(1);
  }
  if (!isValidField(field)) {
    process.stderr.write(`error: invalid field '${field}'. Valid: description, diagram, constraint, concern, context, todo, note\n`);
    process.exit(1);
  }
  if (!ensureOmmForRead()) return;

  const { perspective, nodePath } = parsePath(targetPath);
  const content = nodePath.length === 0
    ? readField(perspective, field as Field)
    : readNodeField(perspective, nodePath, field as Field);

  if (content) {
    process.stdout.write(content);
  }
}

export async function commandWrite(targetPath?: string, field?: string, contentArgs?: string[]): Promise<void> {
  if (!targetPath || !field) {
    process.stderr.write('error: omm write <path> <field> <content|->\n');
    process.exit(1);
  }
  if (!isValidField(field)) {
    process.stderr.write(`error: invalid field '${field}'. Valid: description, diagram, constraint, concern, context, todo, note\n`);
    process.exit(1);
  }

  const args = contentArgs ?? [];
  let content: string;

  if (args.length === 0) {
    process.stderr.write('error: omm write <path> <field> <content|->\n');
    process.exit(1);
    return;
  }

  if (args[0] === '-') {
    const chunks: Buffer[] = [];
    for await (const chunk of process.stdin) {
      chunks.push(chunk);
    }
    content = Buffer.concat(chunks).toString('utf-8');
  } else {
    content = args.join(' ');
  }

  const { perspective, nodePath } = parsePath(targetPath);
  if (nodePath.length === 0) {
    writeField(perspective, field as Field, content);
  } else {
    writeNodeField(perspective, nodePath, field as Field, content);
  }
}
