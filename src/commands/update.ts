import { execFileSync, execSync } from 'node:child_process';

export async function commandUpdate(): Promise<void> {
  // Step 1: Update npm package
  process.stderr.write('Updating oh-my-mermaid CLI...\n');
  try {
    const out = execSync('npm update -g oh-my-mermaid 2>&1', { encoding: 'utf-8' }).trim();
    if (out) process.stderr.write(`  ${out}\n`);
    process.stderr.write('  CLI updated.\n');
  } catch (err: any) {
    process.stderr.write(`  npm update failed: ${err.message}\n`);
    process.stderr.write('  Try manually: npm update -g oh-my-mermaid\n');
    return;
  }

  // Step 2: Re-run setup through the freshly installed CLI
  process.stderr.write('\nUpdating platform plugins...\n');
  try {
    execFileSync('omm', ['setup'], { stdio: 'inherit' });
  } catch (err: any) {
    process.stderr.write('  Updated the npm package, but failed to re-run `omm setup`.\n');
    throw err;
  }
}
