import { initOmm, ommExists } from '../lib/store.js';

export function commandInit(): void {
  const cwd = process.cwd();

  if (ommExists(cwd)) {
    process.stderr.write('.omm/ already initialized.\n');
  } else {
    initOmm(cwd);
    process.stderr.write('Created .omm/ directory. Add to .gitignore if not wanted.\n');
  }
}
