import { ensureOmmForRead, listClasses, readField, classExists } from '../lib/store.js';
import { validateDiagram } from '../lib/validate.js';

function validateClass(className: string, allClasses: string[]): { errors: number; warnings: number } {
  const diagram = readField(className, 'diagram');
  if (!diagram) {
    process.stdout.write(`${className}:\n  (no diagram)\n\n`);
    return { errors: 0, warnings: 0 };
  }

  const result = validateDiagram(diagram, { className, allClasses });
  const errors = result.issues.filter(i => i.level === 'error').length;
  const warnings = result.issues.filter(i => i.level === 'warning').length;

  const status = result.valid
    ? `✓ valid${warnings > 0 ? ` (${warnings} warning${warnings > 1 ? 's' : ''})` : ''}`
    : `✗ invalid (${errors} error${errors > 1 ? 's' : ''}${warnings > 0 ? `, ${warnings} warning${warnings > 1 ? 's' : ''}` : ''})`;

  process.stdout.write(`${className}:\n  ${status}\n`);
  for (const issue of result.issues) {
    const loc = issue.line ? ` line ${issue.line}:` : '';
    process.stdout.write(`  ${issue.level} [${issue.rule}]${loc} ${issue.message}\n`);
  }
  process.stdout.write('\n');

  return { errors, warnings };
}

export function commandValidate(className?: string): void {
  if (!ensureOmmForRead()) return;

  const allClasses = listClasses();

  if (className) {
    if (!classExists(className)) {
      process.stderr.write(`error: class '${className}' not found\n`);
      process.exit(1);
    }
    const { errors } = validateClass(className, allClasses);
    if (errors > 0) process.exit(1);
    return;
  }

  // Validate all classes
  let totalErrors = 0;
  for (const cls of allClasses) {
    const { errors } = validateClass(cls, allClasses);
    totalErrors += errors;
  }

  if (totalErrors > 0) process.exit(1);
}
