/**
 * omm tree <path> — show element hierarchy as indented tree.
 */

import { ensureOmmForRead, listNodes, listClasses } from '../lib/store.js';

function printTree(perspective: string, nodePath: string[], prefix: string, isLast: boolean, isRoot: boolean): void {
  const name = nodePath.length === 0 ? perspective : nodePath[nodePath.length - 1];

  if (isRoot) {
    process.stdout.write(name + '\n');
  } else {
    process.stdout.write(prefix + (isLast ? '└── ' : '├── ') + name + '\n');
  }

  const children = listNodes(perspective, nodePath);
  const childPrefix = isRoot ? '' : prefix + (isLast ? '    ' : '│   ');

  for (let i = 0; i < children.length; i++) {
    const childPath = [...nodePath, children[i]];
    printTree(perspective, childPath, childPrefix, i === children.length - 1, false);
  }
}

export function commandTree(targetPath?: string): void {
  if (!ensureOmmForRead()) return;

  if (!targetPath) {
    const perspectives = listClasses();
    if (perspectives.length === 0) {
      process.stderr.write('No perspectives found. Run /omm-scan to generate.\n');
      return;
    }
    for (const persp of perspectives) {
      printTree(persp, [], '', true, true);
      process.stdout.write('\n');
    }
    return;
  }

  const parts = targetPath.split('/');
  const perspective = parts[0];
  const nodePath = parts.slice(1);
  printTree(perspective, nodePath, '', true, true);
}
