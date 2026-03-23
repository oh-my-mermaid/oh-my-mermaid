import { execSync } from 'node:child_process';
import type { Platform } from './types.js';

function run(cmd: string): { ok: boolean; out: string } {
  try {
    const out = execSync(cmd, { stdio: ['ignore', 'pipe', 'pipe'] }).toString().trim();
    return { ok: true, out };
  } catch {
    return { ok: false, out: '' };
  }
}

export const claude: Platform = {
  name: 'Claude Code',
  id: 'claude',

  detect(): boolean {
    return run('which claude').ok;
  },

  isSetup(): boolean {
    const { ok, out } = run('claude plugin list 2>&1');
    if (!ok) return false;
    return out.includes('oh-my-mermaid');
  },

  async setup(): Promise<void> {
    // Add marketplace (may already exist — ignore error)
    run('claude plugin marketplace add oh-my-mermaid/oh-my-mermaid');

    const { ok, out } = run('claude plugin install oh-my-mermaid 2>&1');
    if (!ok) {
      // If marketplace add failed, suggest manual install
      process.stderr.write(`  Could not auto-install plugin. Run manually:\n`);
      process.stderr.write(`    claude plugin marketplace add oh-my-mermaid/oh-my-mermaid\n`);
      process.stderr.write(`    claude plugin install oh-my-mermaid\n`);
      return;
    }
    process.stderr.write(`  ${out}\n`);
  },

  teardown(): void {
    run('claude plugin uninstall oh-my-mermaid 2>&1');
    run('claude plugin marketplace remove oh-my-mermaid 2>&1');
  },
};
